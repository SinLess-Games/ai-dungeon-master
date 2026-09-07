import { eq } from "drizzle-orm";
import { rollDice } from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import { monsterAttacks } from "@/infrastructure/database/schema";
import {
  applyLethalDamage,
  calculateAttackBonus,
  consciousnessState,
  resolveAttackRoll,
  resolveCriticalConfirmation,
  strengthDamageModifier,
} from "@/rulesets/dnd35";
import type { Dnd35AttackKind } from "../domain/dnd35ActionRuntime";
import { loadActiveGameContext, loadEffectiveAbility } from "./d1Dnd35State";
import { D1ActorHealthStore } from "./d1ActorHealthStore";
import { D1GameEventStore, type GameEventWrite } from "./d1GameEventStore";
import {
  loadActorAttackProfile,
  loadActorDefenseSnapshot,
} from "./actorCombatState";
import { prepareEncounterAction } from "./encounterActionState";

export interface ActorCombatDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

async function requireContext(deps: ActorCombatDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function validateDamageRolls(
  expression: ReturnType<typeof rollDice>,
  explicit: readonly number[] | undefined,
): readonly number[] {
  if (explicit === undefined) return expression.rolls;
  if (explicit.length !== expression.expression.count) {
    throw new RangeError("Explicit damage roll count does not match attack damage dice.");
  }
  if (
    explicit.some(
      (roll) =>
        !Number.isSafeInteger(roll) ||
        roll < 1 ||
        roll > expression.expression.sides,
    )
  ) {
    throw new RangeError("Explicit damage rolls contain a value outside the attack die range.");
  }
  return explicit;
}

async function characterDamageBonus(
  deps: ActorCombatDependencies,
  input: {
    actorId: string;
    attackKind: Dnd35AttackKind;
    handedness: "light" | "one_handed" | "two_handed" | "ranged";
  },
): Promise<number> {
  const score = await loadEffectiveAbility(deps.db, input.actorId, "str");
  if (score === null) return 0;
  const modifier = Math.floor((score - 10) / 2);
  return strengthDamageModifier({
    strengthModifier: modifier,
    handUse: input.handedness === "two_handed" ? "two_handed" : "primary",
    attackMode:
      input.attackKind === "melee"
        ? "melee"
        : input.handedness === "ranged"
          ? "projectile"
          : "thrown",
  });
}

/**
 * Resolve an attack between any combat-capable runtime actors.
 *
 * Character and monster definitions are converted into immutable snapshots,
 * then the deterministic D&D rules resolve the roll. Event append, target HP,
 * and encounter action spending share one D1 commit boundary.
 */
export async function performActorAttack(
  deps: ActorCombatDependencies,
  input: {
    campaignId: string;
    attackerId: string;
    targetId: string;
    kind: Dnd35AttackKind;
    weaponInventoryId?: string;
    monsterAttackId?: string;
    attackRoll?: number;
    confirmationRoll?: number;
    damageRolls?: readonly number[];
  },
) {
  const context = await requireContext(deps, input.campaignId);
  if (input.attackerId === input.targetId) {
    throw new RangeError("An actor cannot target itself with this attack command.");
  }

  const [profile, defense, encounterAction] = await Promise.all([
    loadActorAttackProfile({
      db: deps.db,
      campaignId: input.campaignId,
      actorId: input.attackerId,
      kind: input.kind,
      ...(input.weaponInventoryId === undefined
        ? {}
        : { weaponInventoryId: input.weaponInventoryId }),
      ...(input.monsterAttackId === undefined ? {} : { monsterAttackId: input.monsterAttackId }),
    }),
    loadActorDefenseSnapshot({
      db: deps.db,
      campaignId: input.campaignId,
      actorId: input.targetId,
    }),
    prepareEncounterAction(
      { db: deps.db, binding: deps.binding },
      {
        campaignId: input.campaignId,
        actorId: input.attackerId,
        kind: "standard",
        requiredParticipantIds: [input.attackerId, input.targetId],
      },
    ),
  ]);
  if (!profile || !defense) throw new Error("GAME_ATTACK_PARTICIPANT_NOT_FOUND");

  let attackBonus: number;
  let armorClass = defense.armorClass.normal;
  if (profile.kind === "character") {
    attackBonus = calculateAttackBonus({
      baseAttackBonus: profile.baseAttackBonus,
      abilityModifier: profile.attackAbilityModifier,
      size: profile.size,
    }).total;
  } else {
    attackBonus = profile.attackBonus;
    const attackDefinition = await deps.db
      .select({ attackMode: monsterAttacks.attackMode })
      .from(monsterAttacks)
      .where(eq(monsterAttacks.id, profile.sourceId))
      .get();
    if (!attackDefinition) throw new Error("GAME_WEAPON_INVALID");
    if (
      attackDefinition.attackMode === "melee_touch" ||
      attackDefinition.attackMode === "ranged_touch"
    ) {
      armorClass = defense.armorClass.touch;
    }
  }

  const attack = resolveAttackRoll({
    attackBonus,
    armorClass,
    threatMinimum: profile.criticalThreatMinimum,
    ...(input.attackRoll === undefined ? {} : { roll: input.attackRoll }),
  });
  const critical = resolveCriticalConfirmation({
    threat: attack,
    attackBonus,
    armorClass,
    ...(input.confirmationRoll === undefined
      ? {}
      : { confirmationRoll: input.confirmationRoll }),
  });

  const createId = deps.createId ?? (() => crypto.randomUUID());
  const now = deps.now ?? (() => new Date());
  const eventId = createId();
  const occurredAt = now();

  if (!attack.hit) {
    const event: GameEventWrite = {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "combat.attack",
      occurredAt,
      actorId: input.attackerId,
      sourceId: profile.sourceId,
      targetIds: [input.targetId],
      payload: {
        attackerKind: profile.kind,
        kind: input.kind,
        sourceRuntimeId: profile.sourceRuntimeId,
        attackBonus,
        armorClass,
        naturalRoll: attack.naturalRoll,
        total: attack.total,
        hit: false,
        criticalThreat: false,
        criticalConfirmed: false,
        damage: 0,
      },
    };
    if (encounterAction) {
      const persisted = await new D1ActorHealthStore(deps.binding).commit({
        event,
        action: encounterAction,
      });
      if (!persisted) throw new Error("GAME_STATE_CONFLICT");
    } else {
      await new D1GameEventStore(deps.binding).append(event);
    }
    return {
      attack,
      critical,
      attackBonus,
      armorClass,
      damage: null,
      eventId,
      sessionId: context.sessionId,
    };
  }

  const rolled = rollDice(profile.damageDice);
  const damageRolls = validateDamageRolls(rolled, input.damageRolls);
  const diceSubtotal = damageRolls.reduce((sum, value) => sum + value, 0);
  const staticDamage =
    profile.kind === "character"
      ? await characterDamageBonus(deps, {
          actorId: input.attackerId,
          attackKind: input.kind,
          handedness: profile.handedness,
        })
      : profile.damageBonus;
  const baseDamage = Math.max(0, diceSubtotal + staticDamage);
  const multiplier = critical.confirmed ? profile.criticalMultiplier : 1;
  const totalDamage = baseDamage * multiplier;
  const application = applyLethalDamage(defense.health, totalDamage);

  const event: GameEventWrite = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "combat.attack",
    occurredAt,
    actorId: input.attackerId,
    sourceId: profile.sourceId,
    targetIds: [input.targetId],
    payload: {
      attackerKind: profile.kind,
      kind: input.kind,
      sourceRuntimeId: profile.sourceRuntimeId,
      damageDice: profile.damageDice,
      damageRolls,
      staticDamage,
      attackBonus,
      armorClass,
      naturalRoll: attack.naturalRoll,
      total: attack.total,
      hit: true,
      criticalThreat: critical.threatened,
      criticalConfirmed: critical.confirmed,
      criticalMultiplier: multiplier,
      damage: totalDamage,
      absorbedByTemporaryHitPoints: application.absorbedByTemporaryHitPoints,
      hitPointDamage: application.hitPointDamage,
      healthState: consciousnessState(application.after),
    },
    deltas: [
      ...(defense.health.currentHitPoints === application.after.currentHitPoints
        ? []
        : [
            {
              id: `${eventId}:hp`,
              entityId: input.targetId,
              path: ["dnd35", "currentHitPoints"],
              before: defense.health.currentHitPoints,
              after: application.after.currentHitPoints,
              reason: "combat.attack",
            },
          ]),
      ...(defense.health.temporaryHitPoints === application.after.temporaryHitPoints
        ? []
        : [
            {
              id: `${eventId}:temp-hp`,
              entityId: input.targetId,
              path: ["dnd35", "temporaryHitPoints"],
              before: defense.health.temporaryHitPoints,
              after: application.after.temporaryHitPoints,
              reason: "combat.attack",
            },
          ]),
    ],
  };

  const persisted = await new D1ActorHealthStore(deps.binding).commit({
    event,
    health: {
      actorId: input.targetId,
      kind: defense.healthKind,
      expected: {
        currentHitPoints: defense.health.currentHitPoints,
        temporaryHitPoints: defense.health.temporaryHitPoints,
        nonlethalDamage: defense.health.nonlethalDamage,
        stable: defense.health.stable,
      },
      next: {
        currentHitPoints: application.after.currentHitPoints,
        temporaryHitPoints: application.after.temporaryHitPoints,
        nonlethalDamage: application.after.nonlethalDamage,
        stable: application.after.stable,
      },
    },
    ...(encounterAction ? { action: encounterAction } : {}),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");

  return {
    attack,
    critical,
    attackBonus,
    armorClass,
    damage: {
      dice: profile.damageDice,
      rolls: damageRolls,
      staticDamage,
      multiplier,
      total: totalDamage,
      after: application.after,
    },
    eventId,
    sessionId: context.sessionId,
  };
}
