import { and, eq } from "drizzle-orm";
import { rollDice } from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import { conditions } from "@/infrastructure/database/schema";
import {
  applyHealing,
  applyLethalDamage,
  consciousnessState,
  strengthDamageModifier,
} from "@/rulesets/dnd35";
import {
  resolveAuthoritativeAttack,
  resolveAuthoritativeSavingThrow,
  resolveAuthoritativeSkillCheck,
  type Dnd35AttackKind,
  type Dnd35SaveKind,
} from "../domain/dnd35ActionRuntime";
import {
  loadActiveGameContext,
  loadAttackActionSnapshot,
  loadHealthSnapshot,
  loadSaveActionSnapshot,
  loadSkillActionSnapshot,
  loadWeaponSnapshot,
} from "./d1Dnd35State";
import { D1GameEventStore } from "./d1GameEventStore";
import { prepareEncounterAction } from "./encounterActionState";

export interface GameActionDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

function runtime(deps: GameActionDependencies) {
  return {
    ids: deps.createId ?? (() => crypto.randomUUID()),
    now: deps.now ?? (() => new Date()),
    events: new D1GameEventStore(deps.binding),
  };
}

async function requireContext(deps: GameActionDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function healthPool(snapshot: Awaited<ReturnType<typeof loadHealthSnapshot>>) {
  if (!snapshot) return null;
  return {
    maximumHitPoints: snapshot.maximumHitPoints,
    currentHitPoints: snapshot.currentHitPoints,
    temporaryHitPoints: snapshot.temporaryHitPoints,
    nonlethalDamage: snapshot.nonlethalDamage,
    stable: snapshot.currentHitPoints >= 0,
  };
}

export async function performSkillCheck(
  deps: GameActionDependencies,
  input: {
    campaignId: string;
    actorId: string;
    skillId: string;
    specialization?: string;
    dc: number;
    roll?: number;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const snapshot = await loadSkillActionSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.actorId,
    skillId: input.skillId,
    ...(input.specialization === undefined ? {} : { specialization: input.specialization }),
  });
  if (!snapshot) throw new Error("GAME_ACTOR_OR_SKILL_NOT_FOUND");
  const resolution = resolveAuthoritativeSkillCheck({
    snapshot,
    dc: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
  if (!resolution.allowed) return resolution;

  const rt = runtime(deps);
  const eventId = rt.ids();
  await rt.events.append({
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "check.skill",
    occurredAt: rt.now(),
    actorId: input.actorId,
    sourceId: input.skillId,
    payload: {
      skillId: input.skillId,
      specialization: input.specialization ?? "",
      dc: input.dc,
      modifier: resolution.modifier,
      naturalRoll: resolution.check.naturalRoll,
      total: resolution.check.total,
      margin: resolution.check.margin,
      success: resolution.check.success,
    },
  });
  return { ...resolution, eventId, sessionId: context.sessionId };
}

export async function performSavingThrow(
  deps: GameActionDependencies,
  input: {
    campaignId: string;
    actorId: string;
    save: Dnd35SaveKind;
    dc: number;
    sourceId?: string;
    roll?: number;
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const snapshot = await loadSaveActionSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.actorId,
    save: input.save,
  });
  if (!snapshot) throw new Error("GAME_ACTOR_NOT_FOUND");
  const resolution = resolveAuthoritativeSavingThrow({
    snapshot,
    save: input.save,
    dc: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });

  const rt = runtime(deps);
  const eventId = rt.ids();
  await rt.events.append({
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "check.save",
    occurredAt: rt.now(),
    actorId: input.actorId,
    sourceId: input.sourceId ?? null,
    payload: {
      save: input.save,
      dc: input.dc,
      bonus: resolution.bonus,
      naturalRoll: resolution.result.naturalRoll,
      total: resolution.result.total,
      margin: resolution.result.margin,
      passed: resolution.result.passed,
      automaticSuccess: resolution.result.automaticSuccess,
      automaticFailure: resolution.result.automaticFailure,
    },
  });
  return { ...resolution, eventId, sessionId: context.sessionId };
}

export async function performAttack(
  deps: GameActionDependencies,
  input: {
    campaignId: string;
    attackerId: string;
    targetId: string;
    kind: Dnd35AttackKind;
    weaponInventoryId?: string;
    attackRoll?: number;
    confirmationRoll?: number;
    damageRolls?: readonly number[];
  },
) {
  const context = await requireContext(deps, input.campaignId);
  const encounterAction = await prepareEncounterAction(
    { db: deps.db, binding: deps.binding },
    {
      campaignId: input.campaignId,
      actorId: input.attackerId,
      kind: "standard",
      requiredParticipantIds: [input.attackerId, input.targetId],
    },
  );

  const snapshot = await loadAttackActionSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    attackerId: input.attackerId,
    targetId: input.targetId,
    kind: input.kind,
  });
  if (!snapshot) throw new Error("GAME_ATTACK_PARTICIPANT_NOT_FOUND");

  const weapon = await loadWeaponSnapshot({
    db: deps.db,
    characterId: input.attackerId,
    ...(input.weaponInventoryId === undefined ? {} : { inventoryId: input.weaponInventoryId }),
    attackerSize: snapshot.attackerSize,
    kind: input.kind,
  });
  if (!weapon) throw new Error("GAME_WEAPON_INVALID");
  const resolution = resolveAuthoritativeAttack({
    snapshot: { ...snapshot, threatMinimum: weapon.threatMinimum },
    kind: input.kind,
    ...(input.attackRoll === undefined ? {} : { roll: input.attackRoll }),
    ...(input.confirmationRoll === undefined ? {} : { confirmationRoll: input.confirmationRoll }),
  });

  const rt = runtime(deps);
  const eventId = rt.ids();
  const occurredAt = rt.now();
  if (!resolution.attackRoll.hit) {
    const event = {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "combat.attack",
      occurredAt,
      actorId: input.attackerId,
      sourceId: weapon.itemId,
      targetIds: [input.targetId],
      payload: {
        kind: input.kind,
        weaponInventoryId: weapon.inventoryId,
        attackBonus: resolution.attackBonus,
        armorClass: resolution.armorClass,
        naturalRoll: resolution.attackRoll.naturalRoll,
        total: resolution.attackRoll.total,
        hit: false,
        criticalThreat: false,
        criticalConfirmed: false,
        damage: 0,
      },
    };

    if (encounterAction) {
      const persisted = await rt.events.commitEncounterAction({ event, action: encounterAction });
      if (!persisted) throw new Error("GAME_STATE_CONFLICT");
    } else {
      await rt.events.append(event);
    }
    return { ...resolution, damage: null, eventId, sessionId: context.sessionId };
  }

  const targetHealth = await loadHealthSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  const targetPool = healthPool(targetHealth);
  if (!targetHealth || !targetPool) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");

  const explicitDamage = input.damageRolls;
  const parsedDamage = rollDice(weapon.damageDice);
  if (explicitDamage !== undefined) {
    if (explicitDamage.length !== parsedDamage.expression.count) {
      throw new RangeError("Explicit damage roll count does not match weapon damage dice.");
    }
    if (
      explicitDamage.some(
        (roll) =>
          !Number.isSafeInteger(roll) ||
          roll < 1 ||
          roll > parsedDamage.expression.sides,
      )
    ) {
      throw new RangeError("Explicit damage rolls contain a value outside the weapon die range.");
    }
  }
  const diceRolls = explicitDamage ?? parsedDamage.rolls;
  const diceSubtotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
  const strengthScore = await loadEffectiveStrength(deps.db, input.attackerId);
  const strengthModifier = strengthScore === null ? 0 : strengthScore;
  const handUse = weapon.handedness === "two_handed" ? "two_handed" : "primary";
  const strengthDamage = strengthDamageModifier({
    strengthModifier,
    handUse,
    attackMode:
      input.kind === "melee"
        ? "melee"
        : weapon.handedness === "ranged"
          ? "projectile"
          : "thrown",
  });
  const baseDamage = Math.max(0, diceSubtotal + strengthDamage);
  const multiplier = resolution.critical.confirmed ? weapon.criticalMultiplier : 1;
  const damage = baseDamage * multiplier;
  const application = applyLethalDamage(targetPool, damage);

  const deltas = [
    {
      id: `${eventId}:hp`,
      entityId: input.targetId,
      path: ["dnd35", "currentHitPoints"],
      before: targetHealth.currentHitPoints,
      after: application.after.currentHitPoints,
      sourceId: weapon.itemId ?? undefined,
      reason: "combat.attack",
    },
    {
      id: `${eventId}:temp-hp`,
      entityId: input.targetId,
      path: ["dnd35", "temporaryHitPoints"],
      before: targetHealth.temporaryHitPoints,
      after: application.after.temporaryHitPoints,
      sourceId: weapon.itemId ?? undefined,
      reason: "combat.attack",
    },
  ];
  const event = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "combat.attack",
    occurredAt,
    actorId: input.attackerId,
    sourceId: weapon.itemId,
    targetIds: [input.targetId],
    payload: {
      kind: input.kind,
      weaponInventoryId: weapon.inventoryId,
      damageDice: weapon.damageDice,
      damageRolls: diceRolls,
      strengthDamage,
      attackBonus: resolution.attackBonus,
      armorClass: resolution.armorClass,
      naturalRoll: resolution.attackRoll.naturalRoll,
      total: resolution.attackRoll.total,
      hit: true,
      criticalThreat: resolution.critical.threatened,
      criticalConfirmed: resolution.critical.confirmed,
      criticalMultiplier: multiplier,
      damage,
      absorbedByTemporaryHitPoints: application.absorbedByTemporaryHitPoints,
      hitPointDamage: application.hitPointDamage,
      healthState: consciousnessState(application.after),
    },
    deltas,
  };
  const healthMutation = {
    characterId: input.targetId,
    expected: {
      currentHitPoints: targetHealth.currentHitPoints,
      temporaryHitPoints: targetHealth.temporaryHitPoints,
      nonlethalDamage: targetHealth.nonlethalDamage,
    },
    next: {
      currentHitPoints: application.after.currentHitPoints,
      temporaryHitPoints: application.after.temporaryHitPoints,
      nonlethalDamage: application.after.nonlethalDamage,
    },
  };

  const persisted = encounterAction
    ? await rt.events.commitEncounterAction({
        event,
        action: encounterAction,
        health: healthMutation,
      })
    : await rt.events.applyHealth(event, healthMutation);
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");

  return {
    ...resolution,
    damage: {
      dice: weapon.damageDice,
      rolls: diceRolls,
      strengthDamage,
      multiplier,
      total: damage,
      after: application.after,
    },
    eventId,
    sessionId: context.sessionId,
  };
}

async function loadEffectiveStrength(db: Database, characterId: string): Promise<number | null> {
  const { loadEffectiveAbility } = await import("./d1Dnd35State");
  const score = await loadEffectiveAbility(db, characterId, "str");
  if (score === null) return null;
  return Math.floor((score - 10) / 2);
}

export async function applyDirectDamage(
  deps: GameActionDependencies,
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
  const context = await requireContext(deps, input.campaignId);
  const targetHealth = await loadHealthSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  const pool = healthPool(targetHealth);
  if (!targetHealth || !pool) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const application = applyLethalDamage(pool, input.amount);
  const rt = runtime(deps);
  const eventId = rt.ids();
  const persisted = await rt.events.applyHealth(
    {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "health.damage",
      occurredAt: rt.now(),
      actorId: input.actorId ?? null,
      sourceId: input.sourceId ?? null,
      targetIds: [input.targetId],
      payload: {
        amount: input.amount,
        reason: input.reason ?? "direct",
        absorbedByTemporaryHitPoints: application.absorbedByTemporaryHitPoints,
        hitPointDamage: application.hitPointDamage,
        healthState: consciousnessState(application.after),
      },
      deltas: [
        {
          id: `${eventId}:hp`,
          entityId: input.targetId,
          path: ["dnd35", "currentHitPoints"],
          before: targetHealth.currentHitPoints,
          after: application.after.currentHitPoints,
          reason: input.reason ?? "direct",
        },
      ],
    },
    {
      characterId: input.targetId,
      expected: {
        currentHitPoints: targetHealth.currentHitPoints,
        temporaryHitPoints: targetHealth.temporaryHitPoints,
        nonlethalDamage: targetHealth.nonlethalDamage,
      },
      next: {
        currentHitPoints: application.after.currentHitPoints,
        temporaryHitPoints: application.after.temporaryHitPoints,
        nonlethalDamage: application.after.nonlethalDamage,
      },
    },
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return { eventId, sessionId: context.sessionId, application };
}

export async function applyDirectHealing(
  deps: GameActionDependencies,
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
  const context = await requireContext(deps, input.campaignId);
  const targetHealth = await loadHealthSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  const pool = healthPool(targetHealth);
  if (!targetHealth || !pool) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
  const after = applyHealing(pool, input.amount);
  const rt = runtime(deps);
  const eventId = rt.ids();
  const persisted = await rt.events.applyHealth(
    {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "health.healing",
      occurredAt: rt.now(),
      actorId: input.actorId ?? null,
      sourceId: input.sourceId ?? null,
      targetIds: [input.targetId],
      payload: {
        amount: input.amount,
        reason: input.reason ?? "direct",
        healthState: consciousnessState(after),
      },
      deltas: [
        {
          id: `${eventId}:hp`,
          entityId: input.targetId,
          path: ["dnd35", "currentHitPoints"],
          before: targetHealth.currentHitPoints,
          after: after.currentHitPoints,
          reason: input.reason ?? "direct",
        },
        {
          id: `${eventId}:nonlethal`,
          entityId: input.targetId,
          path: ["dnd35", "nonlethalDamage"],
          before: targetHealth.nonlethalDamage,
          after: after.nonlethalDamage,
          reason: input.reason ?? "direct",
        },
      ],
    },
    {
      characterId: input.targetId,
      expected: {
        currentHitPoints: targetHealth.currentHitPoints,
        temporaryHitPoints: targetHealth.temporaryHitPoints,
        nonlethalDamage: targetHealth.nonlethalDamage,
      },
      next: {
        currentHitPoints: after.currentHitPoints,
        temporaryHitPoints: after.temporaryHitPoints,
        nonlethalDamage: after.nonlethalDamage,
      },
    },
  );
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return { eventId, sessionId: context.sessionId, before: pool, after };
}

export async function applyPersistentCondition(
  deps: GameActionDependencies,
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
  const target = await loadHealthSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.targetId,
  });
  if (!target) throw new Error("GAME_TARGET_NOT_FOUND");
  const definition = await deps.db
    .select({ id: conditions.id })
    .from(conditions)
    .where(eq(conditions.id, input.conditionId))
    .get();
  if (!definition) throw new Error("GAME_CONDITION_NOT_FOUND");

  if (input.durationKind === "rounds") {
    if (!Number.isSafeInteger(input.remainingRounds) || (input.remainingRounds ?? 0) < 0) {
      throw new RangeError("Round duration requires a non-negative integer remainingRounds value.");
    }
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

  const rt = runtime(deps);
  const eventId = rt.ids();
  const conditionInstanceId = rt.ids();
  const occurredAt = rt.now();
  await rt.events.applyCondition({
    event: {
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
      deltas: [
        {
          id: `${eventId}:condition`,
          entityId: input.targetId,
          path: ["dnd35", "conditions", conditionInstanceId],
          before: null,
          after: { conditionId: input.conditionId, durationKind: input.durationKind },
          reason: "condition.applied",
        },
      ],
    },
    condition: {
      id: conditionInstanceId,
      characterId: input.targetId,
      conditionId: input.conditionId,
      sourceCharacterId: input.actorId ?? null,
      sourceDescription: input.sourceDescription ?? null,
      durationKind: input.durationKind,
      remainingRounds: input.remainingRounds ?? null,
      expiresAt: input.expiresAt ?? null,
      state: input.state ?? null,
    },
  });
  return { eventId, conditionInstanceId, sessionId: context.sessionId };
}
