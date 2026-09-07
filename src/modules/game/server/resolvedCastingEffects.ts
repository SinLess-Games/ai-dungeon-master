import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  characterConditions,
  conditions,
  gameActors,
  gameEncounterParticipants,
  gameEncounters,
  monsters,
  runtimeDnd35ActorConditions,
  runtimeDnd35EffectProfiles,
  runtimeDnd35MonsterInstances,
  type RuleEffect,
  type RuntimeDnd35ResolvedEffect,
} from "@/infrastructure/database/schema";
import {
  abilityModifier,
  applyHealing,
  applyLethalDamage,
  mitigateDamage,
  resolveSpellTarget,
  type Dnd35DamageType,
  type Dnd35HealthPool,
  type SpellSavingThrowEffect,
} from "@/rulesets/dnd35";
import {
  applyHalfEffect,
  normalizeSaveEffect,
  resolveScaledEffectAmount,
} from "../domain/resolvedEffectRuntime";
import { createRoundConditionAnchor } from "../domain/conditionTiming";
import { loadActorDefenseSnapshot } from "./actorCombatState";
import type { ActorHealthMutation } from "./d1ActorHealthStore";
import { loadSaveActionSnapshot } from "./d1Dnd35State";
import type {
  ResolvedCastingConditionMutation,
  ResolvedCastingEffects,
} from "./d1ResolvedCastingStore";

export interface CastingEffectPlanDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  rollEffect?: (expression: string) => { total: number; rolls: readonly number[] };
  rollD20?: () => number;
}

export interface CastingEffectPlanInput {
  campaignId: string;
  sessionId: string;
  casterActorId: string;
  sourceKind: "spell" | "power";
  sourceId: string;
  sourceLevel: number;
  casterOrManifesterLevel: number;
  castingAbilityScore: number;
  saveKind: "fort" | "ref" | "will" | null;
  resistanceApplies: boolean;
  targetIds: readonly string[];
}

export interface ResolvedCastingTargetResult {
  actorId: string;
  effectSequence: number;
  effectKind: RuntimeDnd35ResolvedEffect["kind"];
  affected: boolean;
  halfEffect: boolean;
  savePassed: boolean | null;
  resistancePenetrated: boolean;
  amount?: number;
  conditionId?: string;
}

export interface PlannedCastingEffects {
  mutations: ResolvedCastingEffects;
  results: readonly ResolvedCastingTargetResult[];
}

const DAMAGE_TYPES = new Set<Dnd35DamageType>([
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "electricity",
  "fire",
  "sonic",
  "force",
  "positive_energy",
  "negative_energy",
  "untyped",
]);

function nextD20(deps: CastingEffectPlanDependencies): number {
  const value = deps.rollD20?.() ?? Math.floor(Math.random() * 20) + 1;
  if (!Number.isSafeInteger(value) || value < 1 || value > 20) {
    throw new RangeError("Casting effect d20 roller must return an integer from 1 through 20.");
  }
  return value;
}

function parseRuleEffects(value: unknown): readonly RuleEffect[] {
  return Array.isArray(value) ? (value as RuleEffect[]) : [];
}

async function actorSaveBonus(
  deps: CastingEffectPlanDependencies,
  campaignId: string,
  actorId: string,
  save: "fort" | "ref" | "will",
): Promise<number | null> {
  const actor = await deps.db
    .select({ kind: gameActors.kind, characterId: gameActors.characterId })
    .from(gameActors)
    .where(and(eq(gameActors.id, actorId), eq(gameActors.campaignId, campaignId)))
    .get();
  if (!actor) return null;

  if (actor.kind === "character") {
    if (!actor.characterId) return null;
    const snapshot = await loadSaveActionSnapshot({
      db: deps.db,
      campaignId,
      characterId: actor.characterId,
      save,
    });
    if (!snapshot) return null;
    return snapshot.baseSaveBonus + snapshot.abilityModifier + (snapshot.miscModifier ?? 0);
  }

  if (actor.kind === "monster") {
    const row = await deps.db
      .select({ fort: monsters.fort, ref: monsters.ref, will: monsters.will })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actorId))
      .get();
    return row?.[save] ?? null;
  }

  return null;
}

async function actorRuleEffects(
  deps: CastingEffectPlanDependencies,
  campaignId: string,
  actorId: string,
): Promise<readonly RuleEffect[]> {
  const actor = await deps.db
    .select({ kind: gameActors.kind, characterId: gameActors.characterId })
    .from(gameActors)
    .where(and(eq(gameActors.id, actorId), eq(gameActors.campaignId, campaignId)))
    .get();
  if (!actor) return [];

  const result: RuleEffect[] = [];
  if (actor.kind === "monster") {
    const definition = await deps.db
      .select({ defenses: monsters.defenses })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actorId))
      .get();
    result.push(...parseRuleEffects(definition?.defenses));

    const conditionRows = await deps.db
      .select({ state: runtimeDnd35ActorConditions.state, effects: conditions.effects })
      .from(runtimeDnd35ActorConditions)
      .innerJoin(conditions, eq(runtimeDnd35ActorConditions.conditionId, conditions.id))
      .where(eq(runtimeDnd35ActorConditions.actorId, actorId))
      .all();
    for (const row of conditionRows) {
      result.push(...parseRuleEffects(row.effects));
      result.push(...parseRuleEffects(row.state?.effects));
    }
  } else if (actor.kind === "character" && actor.characterId) {
    const rows = await deps.db
      .select({ state: characterConditions.state, effects: conditions.effects })
      .from(characterConditions)
      .innerJoin(conditions, eq(characterConditions.conditionId, conditions.id))
      .where(eq(characterConditions.characterId, actor.characterId))
      .all();
    for (const row of rows) {
      result.push(...parseRuleEffects(row.effects));
      result.push(...parseRuleEffects(row.state?.effects));
    }
  }
  return result;
}

async function mitigateActorDamage(
  deps: CastingEffectPlanDependencies,
  input: { campaignId: string; actorId: string; damageType: string | undefined; amount: number },
): Promise<number> {
  const damageType = DAMAGE_TYPES.has(input.damageType as Dnd35DamageType)
    ? (input.damageType as Dnd35DamageType)
    : "untyped";
  const effects = await actorRuleEffects(deps, input.campaignId, input.actorId);
  const energyResistances: Partial<Record<Dnd35DamageType, number>> = {};
  const immunities: Dnd35DamageType[] = [];
  for (const effect of effects) {
    if (effect.kind === "resistance") {
      energyResistances[effect.damageType] = Math.max(
        energyResistances[effect.damageType] ?? 0,
        effect.amount,
      );
    } else if (
      effect.kind === "immunity" &&
      DAMAGE_TYPES.has(effect.subject as Dnd35DamageType)
    ) {
      immunities.push(effect.subject as Dnd35DamageType);
    }
  }
  const mitigated = mitigateDamage({
    damage: [{ id: "casting-effect", type: damageType, amount: input.amount }],
    energyResistances,
    immunities,
  });
  if (!mitigated.ok) throw new Error(mitigated.errors[0]?.message ?? "Damage mitigation failed.");
  return mitigated.value.totalApplied;
}

async function conditionAnchor(
  deps: CastingEffectPlanDependencies,
  input: { campaignId: string; sessionId: string; actorId: string; rounds: number },
): Promise<{
  encounterId: string;
  expiresEncounterRound: number;
  expiresTurnOrder: number;
} | null> {
  const row = await deps.db
    .select({
      encounterId: gameEncounters.id,
      roundNumber: gameEncounters.roundNumber,
      activeTurnIndex: gameEncounters.activeTurnIndex,
    })
    .from(gameEncounters)
    .innerJoin(
      gameEncounterParticipants,
      eq(gameEncounterParticipants.encounterId, gameEncounters.id),
    )
    .where(
      and(
        eq(gameEncounters.campaignId, input.campaignId),
        eq(gameEncounters.sessionId, input.sessionId),
        eq(gameEncounters.status, "active"),
        eq(gameEncounterParticipants.actorId, input.actorId),
        eq(gameEncounterParticipants.status, "active"),
      ),
    )
    .get();
  if (!row) return null;
  return {
    encounterId: row.encounterId,
    ...createRoundConditionAnchor({
      currentRound: row.roundNumber,
      currentTurnOrder: row.activeTurnIndex,
      durationRounds: input.rounds,
    }),
  };
}

function conditionRounds(
  effect: Extract<RuntimeDnd35ResolvedEffect, { kind: "condition" }>,
  level: number,
): number | null {
  if (effect.duration.kind !== "rounds") return null;
  const scaling = effect.duration.roundsPerLevel ?? 0;
  if (!Number.isFinite(scaling) || scaling < 0) {
    throw new RangeError("Condition rounds-per-level must be non-negative.");
  }
  let rounds = effect.duration.rounds + Math.floor(level * scaling);
  if (effect.duration.maxRounds !== undefined) rounds = Math.min(rounds, effect.duration.maxRounds);
  if (!Number.isSafeInteger(rounds) || rounds < 1) {
    throw new RangeError("Resolved condition duration must be a positive integer number of rounds.");
  }
  return rounds;
}

async function targetGate(
  deps: CastingEffectPlanDependencies,
  input: {
    targetId: string;
    campaignId: string;
    saveKind: CastingEffectPlanInput["saveKind"];
    saveDc: number;
    saveEffect: SpellSavingThrowEffect | null;
    resistanceApplies: boolean;
    casterLevel: number;
  },
) {
  const savingThrowBonus =
    input.saveKind === null || input.saveEffect === null
      ? null
      : await actorSaveBonus(deps, input.campaignId, input.targetId, input.saveKind);
  if (input.saveKind !== null && input.saveEffect !== null && savingThrowBonus === null) {
    throw new Error("GAME_TARGET_SAVE_UNAVAILABLE");
  }

  // Numeric SR/PR is deliberately not fabricated. Once a content source or
  // runtime condition exposes a structured value, it can be supplied here.
  const spellResistance: number | null = null;
  return resolveSpellTarget({
    casterLevel: input.casterLevel,
    spellResistance,
    spellResistanceApplies: input.resistanceApplies,
    ...(savingThrowBonus === null
      ? {}
      : {
          savingThrowBonus,
          savingThrowDc: input.saveDc,
          savingThrowRoll: nextD20(deps),
        }),
    saveEffect: input.saveEffect,
  });
}

export async function planResolvedCastingEffects(
  deps: CastingEffectPlanDependencies,
  input: CastingEffectPlanInput,
): Promise<PlannedCastingEffects> {
  const profiles = await deps.db
    .select()
    .from(runtimeDnd35EffectProfiles)
    .where(
      input.sourceKind === "spell"
        ? and(
            eq(runtimeDnd35EffectProfiles.sourceKind, "spell"),
            eq(runtimeDnd35EffectProfiles.spellId, input.sourceId),
          )
        : and(
            eq(runtimeDnd35EffectProfiles.sourceKind, "power"),
            eq(runtimeDnd35EffectProfiles.powerId, input.sourceId),
          ),
    )
    .orderBy(asc(runtimeDnd35EffectProfiles.sequence))
    .all();

  if (profiles.length === 0) return { mutations: {}, results: [] };
  const saveDc = 10 + input.sourceLevel + abilityModifier(input.castingAbilityScore);
  const healthByActor = new Map<
    string,
    { kind: ActorHealthMutation["kind"]; before: Dnd35HealthPool; current: Dnd35HealthPool }
  >();
  const conditionsToApply: ResolvedCastingConditionMutation[] = [];
  const results: ResolvedCastingTargetResult[] = [];

  async function healthState(actorId: string) {
    const existing = healthByActor.get(actorId);
    if (existing) return existing;
    const snapshot = await loadActorDefenseSnapshot({
      db: deps.db,
      campaignId: input.campaignId,
      actorId,
    });
    if (!snapshot) throw new Error("GAME_TARGET_HEALTH_UNAVAILABLE");
    const state = {
      kind: snapshot.healthKind,
      before: { ...snapshot.health },
      current: { ...snapshot.health },
    };
    healthByActor.set(actorId, state);
    return state;
  }

  for (const profile of profiles) {
    const effect = profile.effect;
    if (effect.kind === "custom") {
      throw new Error(`CASTING_EFFECT_HANDLER_UNAVAILABLE:${effect.handler}`);
    }
    const targets = effect.target === "caster" ? [input.casterActorId] : [...input.targetIds];
    const saveEffect = normalizeSaveEffect(effect);

    for (const targetId of targets) {
      const gate = await targetGate(deps, {
        targetId,
        campaignId: input.campaignId,
        saveKind: input.saveKind,
        saveDc,
        saveEffect,
        resistanceApplies: input.resistanceApplies,
        casterLevel: input.casterOrManifesterLevel,
      });
      const baseResult: ResolvedCastingTargetResult = {
        actorId: targetId,
        effectSequence: profile.sequence,
        effectKind: effect.kind,
        affected: gate.affected,
        halfEffect: gate.halfEffect,
        savePassed: gate.savingThrow?.passed ?? null,
        resistancePenetrated: gate.penetratedSpellResistance,
      };
      if (!gate.affected) {
        results.push(baseResult);
        continue;
      }

      if (effect.kind === "damage") {
        const rolled = resolveScaledEffectAmount(
          effect.amount,
          input.casterOrManifesterLevel,
          deps.rollEffect,
        );
        let amount = applyHalfEffect(rolled.total, gate.halfEffect);
        amount = await mitigateActorDamage(deps, {
          campaignId: input.campaignId,
          actorId: targetId,
          damageType: effect.damageType,
          amount,
        });
        const state = await healthState(targetId);
        state.current = applyLethalDamage(state.current, amount).after;
        results.push({ ...baseResult, amount });
      } else if (effect.kind === "healing") {
        const rolled = resolveScaledEffectAmount(
          effect.amount,
          input.casterOrManifesterLevel,
          deps.rollEffect,
        );
        const amount = applyHalfEffect(rolled.total, gate.halfEffect);
        const state = await healthState(targetId);
        state.current = applyHealing(state.current, amount);
        results.push({ ...baseResult, amount });
      } else if (effect.kind === "condition") {
        if (gate.halfEffect) {
          throw new Error("CASTING_CONDITION_HALF_EFFECT_UNSUPPORTED");
        }
        const rounds = conditionRounds(effect, input.casterOrManifesterLevel);
        const anchor =
          rounds === null
            ? null
            : await conditionAnchor(deps, {
                campaignId: input.campaignId,
                sessionId: input.sessionId,
                actorId: targetId,
                rounds,
              });
        conditionsToApply.push({
          id: deps.createId?.() ?? crypto.randomUUID(),
          actorId: targetId,
          conditionId: effect.conditionId,
          sourceActorId: input.casterActorId,
          sourceDescription: `${input.sourceKind}:${input.sourceId}`,
          durationKind: effect.duration.kind,
          ...(rounds === null ? {} : { remainingRounds: rounds }),
          ...(anchor === null
            ? {}
            : {
                encounterId: anchor.encounterId,
                expiresEncounterRound: anchor.expiresEncounterRound,
                expiresTurnOrder: anchor.expiresTurnOrder,
              }),
          state: {
            data: {
              sourceKind: input.sourceKind,
              sourceId: input.sourceId,
              sourceLevel: input.sourceLevel,
              casterOrManifesterLevel: input.casterOrManifesterLevel,
              saveDc,
            },
          },
        });
        results.push({ ...baseResult, conditionId: effect.conditionId });
      }
    }
  }

  const health: ActorHealthMutation[] = [];
  for (const [actorId, state] of healthByActor) {
    if (
      state.before.currentHitPoints === state.current.currentHitPoints &&
      state.before.temporaryHitPoints === state.current.temporaryHitPoints &&
      state.before.nonlethalDamage === state.current.nonlethalDamage &&
      state.before.stable === state.current.stable
    ) {
      continue;
    }
    health.push({
      actorId,
      kind: state.kind,
      expected: {
        currentHitPoints: state.before.currentHitPoints,
        temporaryHitPoints: state.before.temporaryHitPoints,
        nonlethalDamage: state.before.nonlethalDamage,
        stable: state.before.stable,
      },
      next: {
        currentHitPoints: state.current.currentHitPoints,
        temporaryHitPoints: state.current.temporaryHitPoints,
        nonlethalDamage: state.current.nonlethalDamage,
        stable: state.current.stable,
      },
    });
  }

  return {
    mutations: {
      ...(health.length === 0 ? {} : { health }),
      ...(conditionsToApply.length === 0 ? {} : { conditions: conditionsToApply }),
    },
    results,
  };
}
