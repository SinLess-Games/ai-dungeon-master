import { eq } from "drizzle-orm";
import { rollDice } from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import { dnd35Characters } from "@/infrastructure/database/schema";
import {
  applyHealing,
  applyLethalDamage,
  applyNonlethalDamage,
  consciousnessState,
  grantTemporaryHitPoints,
  resolveDyingStabilization,
  type Dnd35HealthPool,
} from "@/rulesets/dnd35";
import { loadActiveGameContext, loadHealthSnapshot } from "./d1Dnd35State";
import { D1HealthLifecycleStore, type PersistentHealthState } from "./d1HealthLifecycleStore";

export interface HealthLifecycleDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

async function requireContext(deps: HealthLifecycleDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

export async function loadPersistentHealthPool(input: {
  db: Database;
  campaignId: string;
  characterId: string;
}): Promise<Dnd35HealthPool | null> {
  const [health, extension] = await Promise.all([
    loadHealthSnapshot(input),
    input.db
      .select({ stable: dnd35Characters.stable })
      .from(dnd35Characters)
      .where(eq(dnd35Characters.characterId, input.characterId))
      .get(),
  ]);
  if (!health || !extension) return null;
  return {
    maximumHitPoints: health.maximumHitPoints,
    currentHitPoints: health.currentHitPoints,
    temporaryHitPoints: health.temporaryHitPoints,
    nonlethalDamage: health.nonlethalDamage,
    stable: extension.stable,
  };
}

function persistent(pool: Dnd35HealthPool): PersistentHealthState {
  return {
    currentHitPoints: pool.currentHitPoints,
    temporaryHitPoints: pool.temporaryHitPoints,
    nonlethalDamage: pool.nonlethalDamage,
    stable: pool.stable,
  };
}

export function describeHealth(pool: Dnd35HealthPool) {
  return {
    maximumHitPoints: pool.maximumHitPoints,
    currentHitPoints: pool.currentHitPoints,
    temporaryHitPoints: pool.temporaryHitPoints,
    nonlethalDamage: pool.nonlethalDamage,
    stable: pool.stable,
    state: consciousnessState(pool),
  };
}

async function commitHealthTransition(
  deps: HealthLifecycleDependencies,
  input: {
    campaignId: string;
    actorId?: string;
    targetId: string;
    eventType: string;
    sourceId?: string;
    before: Dnd35HealthPool;
    after: Dnd35HealthPool;
    payload: Record<string, unknown>;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const eventId = deps.createId?.() ?? crypto.randomUUID();
  const occurredAt = deps.now?.() ?? new Date();
  const deltas = [
    ...(input.before.currentHitPoints === input.after.currentHitPoints
      ? []
      : [
          {
            id: `${eventId}:hp`,
            entityId: input.targetId,
            path: ["dnd35", "currentHitPoints"],
            before: input.before.currentHitPoints,
            after: input.after.currentHitPoints,
            reason: input.eventType,
          },
        ]),
    ...(input.before.temporaryHitPoints === input.after.temporaryHitPoints
      ? []
      : [
          {
            id: `${eventId}:temp-hp`,
            entityId: input.targetId,
            path: ["dnd35", "temporaryHitPoints"],
            before: input.before.temporaryHitPoints,
            after: input.after.temporaryHitPoints,
            reason: input.eventType,
          },
        ]),
    ...(input.before.nonlethalDamage === input.after.nonlethalDamage
      ? []
      : [
          {
            id: `${eventId}:nonlethal`,
            entityId: input.targetId,
            path: ["dnd35", "nonlethalDamage"],
            before: input.before.nonlethalDamage,
            after: input.after.nonlethalDamage,
            reason: input.eventType,
          },
        ]),
    ...(input.before.stable === input.after.stable
      ? []
      : [
          {
            id: `${eventId}:stable`,
            entityId: input.targetId,
            path: ["dnd35", "stable"],
            before: input.before.stable,
            after: input.after.stable,
            reason: input.eventType,
          },
        ]),
  ];

  const persisted = await new D1HealthLifecycleStore(deps.binding).commit(
    {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: input.eventType,
      occurredAt,
      actorId: input.actorId ?? null,
      sourceId: input.sourceId ?? null,
      targetIds: [input.targetId],
      payload: {
        ...input.payload,
        before: describeHealth(input.before),
        after: describeHealth(input.after),
      },
      deltas,
    },
    {
      characterId: input.targetId,
      expected: persistent(input.before),
      next: persistent(input.after),
    },
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    before: describeHealth(input.before),
    after: describeHealth(input.after),
  };
}

export async function getAuthoritativeHealthState(
  deps: HealthLifecycleDependencies,
  input: { campaignId: string; characterId: string },
) {
  await requireContext(deps, input.campaignId);
  const pool = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.characterId,
  });
  if (!pool) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  return describeHealth(pool);
}

export async function applyPersistentLethalDamage(
  deps: HealthLifecycleDependencies,
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
  const before = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  if (!before) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const application = applyLethalDamage(before, input.amount);
  return {
    ...(await commitHealthTransition(deps, {
      campaignId: input.campaignId,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
      targetId: input.targetId,
      eventType: "health.damage",
      ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
      before,
      after: application.after,
      payload: {
        amount: input.amount,
        reason: input.reason ?? "direct",
        absorbedByTemporaryHitPoints: application.absorbedByTemporaryHitPoints,
        hitPointDamage: application.hitPointDamage,
      },
    })),
    application,
  };
}

export async function applyPersistentHealing(
  deps: HealthLifecycleDependencies,
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
  const before = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  if (!before) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const after = applyHealing(before, input.amount);
  return commitHealthTransition(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    eventType: "health.healing",
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
    before,
    after,
    payload: { amount: input.amount, reason: input.reason ?? "direct" },
  });
}

export async function applyPersistentNonlethalDamage(
  deps: HealthLifecycleDependencies,
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
    throw new RangeError("Nonlethal damage must be a non-negative safe integer.");
  }
  const before = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  if (!before) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const after = applyNonlethalDamage(before, input.amount);
  return commitHealthTransition(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    eventType: "health.nonlethal_damage",
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
    before,
    after,
    payload: { amount: input.amount, reason: input.reason ?? "direct" },
  });
}

export async function grantPersistentTemporaryHitPoints(
  deps: HealthLifecycleDependencies,
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
    throw new RangeError("Temporary hit points must be a non-negative safe integer.");
  }
  const before = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  if (!before) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const after = grantTemporaryHitPoints(before, input.amount);
  return commitHealthTransition(deps, {
    campaignId: input.campaignId,
    ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    targetId: input.targetId,
    eventType: "health.temporary_hit_points",
    ...(input.sourceId === undefined ? {} : { sourceId: input.sourceId }),
    before,
    after,
    payload: { amount: input.amount, reason: input.reason ?? "direct" },
  });
}

export async function attemptPersistentStabilization(
  deps: HealthLifecycleDependencies,
  input: { campaignId: string; characterId: string; percentileRoll?: number },
) {
  const before = await loadPersistentHealthPool({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.characterId,
  });
  if (!before) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const roll = input.percentileRoll ?? rollDice("1d100").total;
  const resolved = resolveDyingStabilization(before, roll);
  if (!resolved.ok) {
    const first = resolved.errors[0];
    throw new RangeError(first?.message ?? "Stabilization check is not available.");
  }
  const after = resolved.value;
  const stabilizedThisCheck = !before.stable && after.stable;
  return {
    ...(await commitHealthTransition(deps, {
      campaignId: input.campaignId,
      actorId: input.characterId,
      targetId: input.characterId,
      eventType: stabilizedThisCheck ? "health.stabilized" : "health.stabilization_failed",
      before,
      after,
      payload: { percentileRoll: roll, stabilized: after.stable },
    })),
    percentileRoll: roll,
    stabilized: after.stable,
  };
}
