import { and, eq } from "drizzle-orm";
import { rollDice } from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import {
  conditions,
  gameActors,
  gameEncounters,
} from "@/infrastructure/database/schema";
import {
  applyHealing,
  applyLethalDamage,
  applyNonlethalDamage,
  consciousnessState,
  grantTemporaryHitPoints,
  resolveDyingStabilization,
  type Dnd35HealthPool,
} from "@/rulesets/dnd35";
import { createRoundConditionAnchor } from "../domain/conditionTiming";
import { loadActorDefenseSnapshot } from "./actorCombatState";
import { D1ActorConditionStore } from "./d1ActorConditionStore";
import {
  D1ActorHealthStore,
  type ActorHealthMutation,
  type ActorHealthState,
} from "./d1ActorHealthStore";
import { loadActiveGameContext } from "./d1Dnd35State";

export interface ActorStateMutationDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
  rollPercentile?: () => number;
}

async function requireContext(deps: ActorStateMutationDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function persistent(pool: Dnd35HealthPool): ActorHealthState {
  return {
    currentHitPoints: pool.currentHitPoints,
    temporaryHitPoints: pool.temporaryHitPoints,
    nonlethalDamage: pool.nonlethalDamage,
    stable: pool.stable,
  };
}

function healthView(pool: Dnd35HealthPool) {
  return { ...pool, state: consciousnessState(pool) };
}

async function commitHealth(
  deps: ActorStateMutationDependencies,
  input: {
    campaignId: string;
    actorId?: string;
    targetId: string;
    sourceId?: string;
    eventType: string;
    reason: string;
    before: Dnd35HealthPool;
    after: Dnd35HealthPool;
    healthKind: "character" | "monster";
    payload?: Record<string, unknown>;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const eventId = deps.createId?.() ?? crypto.randomUUID();
  const occurredAt = deps.now?.() ?? new Date();
  const mutation: ActorHealthMutation = {
    actorId: input.targetId,
    kind: input.healthKind,
    expected: persistent(input.before),
    next: persistent(input.after),
  };
  const persisted = await new D1ActorHealthStore(deps.binding).commit({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: input.eventType,
      occurredAt,
      actorId: input.actorId ?? null,
      sourceId: input.sourceId ?? null,
      targetIds: [input.targetId],
      payload: {
        reason: input.reason,
        before: healthView(input.before),
        after: healthView(input.after),
        ...(input.payload ?? {}),
      },
      deltas: [
        ...(input.before.currentHitPoints === input.after.currentHitPoints
          ? []
          : [{
              id: `${eventId}:hp`,
              entityId: input.targetId,
              path: ["dnd35", "currentHitPoints"],
              before: input.before.currentHitPoints,
              after: input.after.currentHitPoints,
              reason: input.reason,
            }]),
        ...(input.before.temporaryHitPoints === input.after.temporaryHitPoints
          ? []
          : [{
              id: `${eventId}:temp-hp`,
              entityId: input.targetId,
              path: ["dnd35", "temporaryHitPoints"],
              before: input.before.temporaryHitPoints,
              after: input.after.temporaryHitPoints,
              reason: input.reason,
            }]),
        ...(input.before.nonlethalDamage === input.after.nonlethalDamage
          ? []
          : [{
              id: `${eventId}:nonlethal`,
              entityId: input.targetId,
              path: ["dnd35", "nonlethalDamage"],
              before: input.before.nonlethalDamage,
              after: input.after.nonlethalDamage,
              reason: input.reason,
            }]),
        ...(input.before.stable === input.after.stable
          ? []
          : [{
              id: `${eventId}:stable`,
              entityId: input.targetId,
              path: ["dnd35", "stable"],
              before: input.before.stable,
              after: input.after.stable,
              reason: input.reason,
            }]),
      ],
    },
    health: mutation,
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    before: healthView(input.before),
    after: healthView(input.after),
  };
}

async function targetHealth(
  deps: ActorStateMutationDependencies,
  campaignId: string,
  actorId: string,
) {
  const snapshot = await loadActorDefenseSnapshot({ db: deps.db, campaignId, actorId });
  if (!snapshot) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  return snapshot;
}

export async function applyActorLethalDamage(
  deps: ActorStateMutationDependencies,
  input: {
    campaignId: string;
    actorId?: string;
    targetId: string;
    amount: number;
    sourceId?: string;
    reason?: string;
  },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) {
    throw new RangeError("Damage must be a non-negative safe integer.");
  }
  const target = await targetHealth(deps, input.campaignId, input.targetId);
  const result = applyLethalDamage(target.health, input.amount);
  return {
    ...(await commitHealth(deps, {
      campaignId: input.campaignId,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
      targetId: input.targetId,
      ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
      eventType: "health.damage",
      reason: input.reason ?? "direct",
      before: target.health,
      after: result.after,
      healthKind: target.healthKind,
      payload: {
        amount: input.amount,
        absorbedByTemporaryHitPoints: result.absorbedByTemporaryHitPoints,
        hitPointDamage: result.hitPointDamage,
      },
    })),
    application: result,
  };
}

export async function applyActorHealing(
  deps: ActorStateMutationDependencies,
  input: {
    campaignId: string;
    actorId?: string;
    targetId: string;
    amount: number;
    sourceId?: string;
    reason?: string;
  },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) {
    throw new RangeError("Healing must be a non-negative safe integer.");
  }
  const target = await targetHealth(deps, input.campaignId, input.targetId);
  const after = applyHealing(target.health, input.amount);
  return commitHealth(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
    eventType: "health.healing",
    reason: input.reason ?? "direct",
    before: target.health,
    after,
    healthKind: target.healthKind,
    payload: { amount: input.amount },
  });
}

export async function applyActorNonlethalDamage(
  deps: ActorStateMutationDependencies,
  input: { campaignId: string; actorId?: string; targetId: string; amount: number; reason?: string },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) {
    throw new RangeError("Nonlethal damage must be a non-negative safe integer.");
  }
  const target = await targetHealth(deps, input.campaignId, input.targetId);
  const after = applyNonlethalDamage(target.health, input.amount);
  return commitHealth(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    eventType: "health.nonlethal_damage",
    reason: input.reason ?? "direct",
    before: target.health,
    after,
    healthKind: target.healthKind,
    payload: { amount: input.amount },
  });
}

export async function grantActorTemporaryHitPoints(
  deps: ActorStateMutationDependencies,
  input: { campaignId: string; actorId?: string; targetId: string; amount: number; reason?: string },
) {
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) {
    throw new RangeError("Temporary hit points must be a non-negative safe integer.");
  }
  const target = await targetHealth(deps, input.campaignId, input.targetId);
  const after = grantTemporaryHitPoints(target.health, input.amount);
  return commitHealth(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    eventType: "health.temporary_hit_points",
    reason: input.reason ?? "direct",
    before: target.health,
    after,
    healthKind: target.healthKind,
    payload: { amount: input.amount },
  });
}

export async function attemptActorStabilization(
  deps: ActorStateMutationDependencies,
  input: { campaignId: string; actorId: string; percentileRoll?: number },
) {
  const target = await targetHealth(deps, input.campaignId, input.actorId);
  const roll = input.percentileRoll ?? deps.rollPercentile?.() ?? rollDice("1d100").total;
  const resolved = resolveDyingStabilization(target.health, roll);
  if (!resolved.ok) {
    throw new RangeError(resolved.errors[0]?.message ?? "Stabilization check is not available.");
  }
  const after = resolved.value;
  const result = await commitHealth(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    targetId: input.actorId,
    eventType: !target.health.stable && after.stable ? "health.stabilized" : "health.stabilization_failed",
    reason: "stabilization",
    before: target.health,
    after,
    healthKind: target.healthKind,
    payload: { percentileRoll: roll, stabilized: after.stable },
  });
  return { ...result, percentileRoll: roll, stabilized: after.stable };
}

export async function applyActorCondition(
  deps: ActorStateMutationDependencies,
  input: {
    campaignId: string;
    actorId?: string;
    targetId: string;
    conditionId: string;
    sourceDescription?: string;
    durationKind: "rounds" | "until_time" | "permanent" | "concentration" | "special";
    remainingRounds?: number;
    expiresAt?: Date;
    state?: Record<string, unknown>;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const [target, definition] = await Promise.all([
    deps.db
      .select({ id: gameActors.id })
      .from(gameActors)
      .where(
        and(
          eq(gameActors.id, input.targetId),
          eq(gameActors.campaignId, input.campaignId),
          eq(gameActors.status, "active"),
        ),
      )
      .get(),
    deps.db.select({ id: conditions.id }).from(conditions).where(eq(conditions.id, input.conditionId)).get(),
  ]);
  if (!target) throw new Error("GAME_TARGET_NOT_FOUND");
  if (!definition) throw new Error("GAME_CONDITION_NOT_FOUND");

  let encounterId: string | null = null;
  let expiresEncounterRound: number | null = null;
  let expiresTurnOrder: number | null = null;
  if (input.durationKind === "rounds") {
    if (!Number.isSafeInteger(input.remainingRounds) || (input.remainingRounds ?? 0) < 1) {
      throw new RangeError("Round duration requires a positive integer remainingRounds value.");
    }
    const encounter = await deps.db
      .select({ id: gameEncounters.id, round: gameEncounters.roundNumber, turn: gameEncounters.activeTurnIndex })
      .from(gameEncounters)
      .where(
        and(
          eq(gameEncounters.campaignId, input.campaignId),
          eq(gameEncounters.sessionId, context.sessionId),
          eq(gameEncounters.status, "active"),
        ),
      )
      .get();
    if (!encounter) throw new Error("ROUND_CONDITION_REQUIRES_ACTIVE_ENCOUNTER");
    const anchor = createRoundConditionAnchor({
      currentRound: encounter.round,
      currentTurnOrder: encounter.turn,
      durationRounds: input.remainingRounds as number,
    });
    encounterId = encounter.id;
    expiresEncounterRound = anchor.expiresEncounterRound;
    expiresTurnOrder = anchor.expiresTurnOrder;
  } else if (input.remainingRounds !== undefined) {
    throw new RangeError("remainingRounds is only valid for round-based conditions.");
  }

  if (input.durationKind === "until_time") {
    if (!input.expiresAt || Number.isNaN(input.expiresAt.getTime())) {
      throw new RangeError("until_time conditions require a valid expiresAt timestamp.");
    }
  } else if (input.expiresAt !== undefined) {
    throw new RangeError("expiresAt is only valid for until_time conditions.");
  }

  const eventId = deps.createId?.() ?? crypto.randomUUID();
  const conditionInstanceId = deps.createId?.() ?? crypto.randomUUID();
  const occurredAt = deps.now?.() ?? new Date();
  const persisted = await new D1ActorConditionStore(deps.binding).commit(
    {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "condition.applied",
      occurredAt,
      actorId: input.actorId ?? null,
      sourceId: input.conditionId,
      targetIds: [input.targetId],
      payload: {
        conditionInstanceId,
        conditionId: input.conditionId,
        durationKind: input.durationKind,
        remainingRounds: input.remainingRounds ?? null,
        expiresAt: input.expiresAt?.toISOString() ?? null,
        sourceDescription: input.sourceDescription ?? null,
      },
      deltas: [{
        id: `${eventId}:condition`,
        entityId: input.targetId,
        path: ["dnd35", "conditions", conditionInstanceId],
        before: null,
        after: { conditionId: input.conditionId, durationKind: input.durationKind },
        reason: "condition.applied",
      }],
    },
    {
      id: conditionInstanceId,
      campaignId: input.campaignId,
      actorId: input.targetId,
      conditionId: input.conditionId,
      sourceActorId: input.actorId ?? null,
      sourceDescription: input.sourceDescription ?? null,
      durationKind: input.durationKind,
      remainingRounds: input.remainingRounds ?? null,
      encounterId,
      expiresEncounterRound,
      expiresTurnOrder,
      expiresAt: input.expiresAt ?? null,
      state: input.state ?? null,
    },
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return { eventId, sessionId: context.sessionId, conditionInstanceId };
}
