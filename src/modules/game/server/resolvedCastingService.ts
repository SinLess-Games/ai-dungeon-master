/// <reference types="@cloudflare/workers-types" />

import type { Database } from "@/infrastructure/database/client";
import {
  bonusPowerPoints,
  calculateCasterLevel,
  canCastSpellLevel,
  canManifestPowerLevel,
  dailySpellSlots,
  expendPreparedSpell,
  expendSpontaneousSlot,
  planPowerManifestation,
  type Dnd35ActionKind,
  type PowerAugmentationOption,
} from "@/rulesets/dnd35";
import { loadActiveGameContext, loadEffectiveAbility, type AbilityKey } from "./d1Dnd35State";
import { prepareEncounterAction } from "./encounterActionState";
import { D1ResolvedCastingStore } from "./d1ResolvedCastingStore";
import { planResolvedCastingEffects } from "./resolvedCastingEffects";

interface TrackRow {
  id: string;
  character_id: string;
  class_id: string | null;
  spell_list_class_id: string | null;
  track_key: string | null;
  casting_mode: "prepared" | "spontaneous" | "psionic" | "other" | null;
  casting_ability: AbilityKey | null;
  caster_level_numerator: number | null;
  caster_level_denominator: number | null;
  caster_level_adjustment: number;
  manifester_level_adjustment: number;
}

interface SpellRow {
  id: string;
  action_type: string | null;
  spell_level: number;
  save: "fort" | "ref" | "will" | null;
  spell_resistance: "yes" | "no" | "conditional";
}

interface PowerRow {
  id: string;
  action_type: string | null;
  power_level: number;
  power_points: number;
  augmentation: string | null;
  save: "fort" | "ref" | "will" | null;
  power_resistance: "yes" | "no" | "conditional";
}

interface PreparationRow {
  id: string;
  spell_id: string;
  slot_level: number;
  prepared_count: number;
  expended_count: number;
}

interface PowerAugmentationDefinition {
  additionalPowerPoints: number;
  repeatable: boolean;
}

export interface ResolvedCastingDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
  rollD20?: () => number;
  rollEffect?: (expression: string) => { total: number; rolls: readonly number[] };
}

export interface RequestedResolvedPowerAugmentation {
  index: number;
  applications?: number;
}

function id(deps: ResolvedCastingDependencies): string {
  return deps.createId?.() ?? crypto.randomUUID();
}

function now(deps: ResolvedCastingDependencies): Date {
  return deps.now?.() ?? new Date();
}

async function requireContext(deps: ResolvedCastingDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

async function requireCaster(
  deps: ResolvedCastingDependencies,
  campaignId: string,
  actorId: string,
): Promise<void> {
  const row = await deps.binding
    .prepare(
      `SELECT actor.id
       FROM game_actors actor
       JOIN characters character ON character.id = actor.character_id
       JOIN dnd35_characters dnd ON dnd.character_id = character.id
       WHERE actor.id = ? AND actor.campaign_id = ? AND actor.kind = 'character'
         AND actor.status = 'active' AND character.status = 'active'`,
    )
    .bind(actorId, campaignId)
    .first<{ id: string }>();
  if (!row) throw new Error("GAME_ACTOR_NOT_FOUND");
}

async function track(
  deps: ResolvedCastingDependencies,
  characterId: string,
  trackId: string,
): Promise<TrackRow> {
  const row = await deps.binding
    .prepare(
      `SELECT track.id, track.character_id,
              definition.class_id, definition.spell_list_class_id,
              definition.track_key, definition.casting_mode, definition.casting_ability,
              definition.caster_level_numerator, definition.caster_level_denominator,
              track.caster_level_adjustment, track.manifester_level_adjustment
       FROM dnd35_character_casting_tracks track
       LEFT JOIN dnd35_class_spellcasting definition ON definition.id = track.class_spellcasting_id
       WHERE track.id = ? AND track.character_id = ?`,
    )
    .bind(trackId, characterId)
    .first<TrackRow>();
  if (!row) throw new Error("CASTING_TRACK_NOT_FOUND");
  if (
    !row.class_id ||
    !row.track_key ||
    !row.casting_mode ||
    !row.casting_ability ||
    row.caster_level_numerator === null ||
    row.caster_level_denominator === null
  ) {
    throw new Error("CASTING_TRACK_RUNTIME_UNSUPPORTED");
  }
  return row;
}

async function progression(
  deps: ResolvedCastingDependencies,
  row: TrackRow,
  adjustment: number,
) {
  if (!row.class_id || row.caster_level_numerator === null || row.caster_level_denominator === null) {
    throw new Error("CASTING_TRACK_RUNTIME_UNSUPPORTED");
  }
  const [base, advanced] = await Promise.all([
    deps.binding
      .prepare(
        `SELECT COALESCE(MAX(level.level), 0) AS class_level
         FROM dnd35_character_class_levels gained
         JOIN dnd35_class_levels level ON level.id = gained.class_level_id
         WHERE gained.character_id = ? AND level.class_id = ?`,
      )
      .bind(row.character_id, row.class_id)
      .first<{ class_level: number }>(),
    deps.binding
      .prepare(
        `SELECT COALESCE(SUM(definition.levels_advanced), 0) AS levels_advanced
         FROM dnd35_character_casting_advancements chosen
         JOIN dnd35_class_casting_advancements definition ON definition.id = chosen.advancement_id
         WHERE chosen.character_id = ? AND chosen.casting_track_id = ?`,
      )
      .bind(row.character_id, row.id)
      .first<{ levels_advanced: number }>(),
  ]);
  const classLevels = base?.class_level ?? 0;
  const advancedLevels = advanced?.levels_advanced ?? 0;
  return {
    effectiveLevel: classLevels + advancedLevels,
    casterLevel: calculateCasterLevel({
      classLevels,
      numerator: row.caster_level_numerator,
      denominator: row.caster_level_denominator,
      advancedLevels,
      adjustment,
    }),
  };
}

function actionKind(value: string | null): Dnd35ActionKind {
  switch (value) {
    case "standard":
    case "move":
    case "full_round":
    case "swift":
    case "immediate":
    case "free":
      return value;
    case "none":
      return "free";
    default:
      throw new Error("CASTING_ACTION_TYPE_UNSUPPORTED");
  }
}

async function spell(
  deps: ResolvedCastingDependencies,
  spellId: string,
  classId: string,
): Promise<SpellRow> {
  const row = await deps.binding
    .prepare(
      `SELECT spell.id, spell.action_type, level.spell_level, spell.save, spell.spell_resistance
       FROM dnd35_spells spell
       JOIN dnd35_spell_class_levels level ON level.spell_id = spell.id
       WHERE spell.id = ? AND level.class_id = ? AND spell.is_enabled = 1`,
    )
    .bind(spellId, classId)
    .first<SpellRow>();
  if (!row) throw new Error("SPELL_NOT_AVAILABLE");
  return row;
}

async function power(
  deps: ResolvedCastingDependencies,
  powerId: string,
  classId: string,
): Promise<PowerRow> {
  const row = await deps.binding
    .prepare(
      `SELECT power.id, power.action_type, level.power_level, power.power_points,
              power.augmentation, power.save, power.power_resistance
       FROM dnd35_powers power
       JOIN dnd35_power_class_levels level ON level.power_id = power.id
       WHERE power.id = ? AND level.class_id = ? AND power.is_enabled = 1`,
    )
    .bind(powerId, classId)
    .first<PowerRow>();
  if (!row) throw new Error("POWER_NOT_AVAILABLE");
  return row;
}

async function preparedResource(
  deps: ResolvedCastingDependencies,
  input: { trackId: string; spellId: string; preparationId: string },
): Promise<PreparationRow> {
  const row = await deps.binding
    .prepare(
      `SELECT id, spell_id, slot_level, prepared_count, expended_count
       FROM dnd35_character_spell_preparations
       WHERE id = ? AND casting_track_id = ? AND spell_id = ?`,
    )
    .bind(input.preparationId, input.trackId, input.spellId)
    .first<PreparationRow>();
  if (!row) throw new Error("SPELL_PREPARATION_NOT_FOUND");
  return row;
}

async function requireKnownSpell(
  deps: ResolvedCastingDependencies,
  trackId: string,
  spellId: string,
) {
  const row = await deps.binding
    .prepare(`SELECT 1 AS ok FROM dnd35_character_spells WHERE casting_track_id = ? AND spell_id = ?`)
    .bind(trackId, spellId)
    .first<{ ok: number }>();
  if (!row) throw new Error("SPELL_NOT_KNOWN");
}

async function spontaneousUsage(
  deps: ResolvedCastingDependencies,
  trackId: string,
  spellLevel: number,
): Promise<number> {
  const row = await deps.binding
    .prepare(
      `SELECT expended_count FROM runtime_dnd35_character_spontaneous_slot_usage
       WHERE casting_track_id = ? AND spell_level = ?`,
    )
    .bind(trackId, spellLevel)
    .first<{ expended_count: number }>();
  return row?.expended_count ?? 0;
}

async function spontaneousMaximum(
  deps: ResolvedCastingDependencies,
  input: { track: TrackRow; effectiveLevel: number; spellLevel: number; abilityScore: number },
) {
  if (!input.track.class_id || !input.track.track_key) throw new Error("CASTING_TRACK_RUNTIME_UNSUPPORTED");
  if (input.spellLevel > 9) throw new Error("EPIC_SPONTANEOUS_SLOT_DERIVATION_UNSUPPORTED");
  const row = await deps.binding
    .prepare(
      `SELECT slots_per_day FROM dnd35_class_spellcasting_progression
       WHERE class_id = ? AND track_key = ? AND class_level = ? AND spell_level = ?`,
    )
    .bind(input.track.class_id, input.track.track_key, input.effectiveLevel, input.spellLevel)
    .first<{ slots_per_day: number | null }>();
  if (!row) throw new Error("SPELL_SLOT_LEVEL_UNAVAILABLE");
  const slots = dailySpellSlots({
    spellLevel: input.spellLevel,
    baseSlots: row.slots_per_day,
    castingAbilityScore: input.abilityScore,
  });
  if (!slots.accessible) throw new Error("SPELL_SLOT_LEVEL_UNAVAILABLE");
  return slots.total;
}

function parseAugmentations(raw: string | null): readonly PowerAugmentationDefinition[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("POWER_AUGMENTATION_DATA_INVALID");
  return parsed.map((entry) => {
    if (typeof entry !== "object" || entry === null) throw new Error("POWER_AUGMENTATION_DATA_INVALID");
    const cost = (entry as { additionalPowerPoints?: unknown }).additionalPowerPoints;
    const repeatable = (entry as { repeatable?: unknown }).repeatable;
    if (!Number.isSafeInteger(cost) || (cost as number) < 0 || typeof repeatable !== "boolean") {
      throw new Error("POWER_AUGMENTATION_DATA_INVALID");
    }
    return { additionalPowerPoints: cost as number, repeatable };
  });
}

function selectAugmentations(
  definitions: readonly PowerAugmentationDefinition[],
  requested: readonly RequestedResolvedPowerAugmentation[],
): readonly PowerAugmentationOption[] {
  const seen = new Set<number>();
  return requested.map((selection) => {
    if (!Number.isSafeInteger(selection.index) || selection.index < 0 || selection.index >= definitions.length) {
      throw new RangeError("Power augmentation index is invalid.");
    }
    if (seen.has(selection.index)) throw new RangeError("Power augmentation may only be selected once.");
    seen.add(selection.index);
    const definition = definitions[selection.index];
    if (!definition) throw new RangeError("Power augmentation index is invalid.");
    const applications = selection.applications ?? 1;
    if (!Number.isSafeInteger(applications) || applications < 1) {
      throw new RangeError("Power augmentation applications must be a positive safe integer.");
    }
    return {
      id: `augmentation:${selection.index}`,
      additionalPowerPoints: definition.additionalPowerPoints,
      repeatable: definition.repeatable,
      applications,
    };
  });
}

async function requireKnownPower(
  deps: ResolvedCastingDependencies,
  trackId: string,
  powerId: string,
) {
  const row = await deps.binding
    .prepare(`SELECT 1 AS ok FROM dnd35_character_powers WHERE casting_track_id = ? AND power_id = ?`)
    .bind(trackId, powerId)
    .first<{ ok: number }>();
  if (!row) throw new Error("POWER_NOT_KNOWN");
}

async function powerPointState(
  deps: ResolvedCastingDependencies,
  input: { characterId: string; track: TrackRow; progression: { effectiveLevel: number; casterLevel: number }; ability: number },
) {
  if (!input.track.class_id) throw new Error("CASTING_TRACK_RUNTIME_UNSUPPORTED");
  const base = await deps.binding
    .prepare(
      `SELECT base_power_points FROM dnd35_class_levels WHERE class_id = ? AND level = ?`,
    )
    .bind(input.track.class_id, input.progression.effectiveLevel)
    .first<{ base_power_points: number | null }>();
  const maximum =
    (base?.base_power_points ?? 0) + bonusPowerPoints(input.ability, input.progression.casterLevel);
  const state = await deps.binding
    .prepare(`SELECT power_points_spent FROM dnd35_characters WHERE character_id = ?`)
    .bind(input.characterId)
    .first<{ power_points_spent: number }>();
  if (!state) throw new Error("GAME_ACTOR_NOT_FOUND");
  if (state.power_points_spent > maximum) throw new Error("POWER_POINT_STATE_INVALID");
  return { maximum, spent: state.power_points_spent, current: maximum - state.power_points_spent };
}

async function planEffects(
  deps: ResolvedCastingDependencies,
  input: Parameters<typeof planResolvedCastingEffects>[1],
) {
  return planResolvedCastingEffects(
    {
      db: deps.db,
      binding: deps.binding,
      ...(deps.createId === undefined ? {} : { createId: deps.createId }),
      ...(deps.rollD20 === undefined ? {} : { rollD20: deps.rollD20 }),
      ...(deps.rollEffect === undefined ? {} : { rollEffect: deps.rollEffect }),
    },
    input,
  );
}

export async function castPreparedSpellResolved(
  deps: ResolvedCastingDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    spellId: string;
    preparationId: string;
    targetIds?: readonly string[];
  },
) {
  const context = await requireContext(deps, input.campaignId);
  await requireCaster(deps, input.campaignId, input.actorId);
  const row = await track(deps, input.actorId, input.castingTrackId);
  if (row.casting_mode !== "prepared" || !row.casting_ability || !row.class_id) {
    throw new Error("CASTING_MODE_MISMATCH");
  }
  const listClassId = row.spell_list_class_id ?? row.class_id;
  const [definition, preparation, ability, levels] = await Promise.all([
    spell(deps, input.spellId, listClassId),
    preparedResource(deps, {
      trackId: row.id,
      spellId: input.spellId,
      preparationId: input.preparationId,
    }),
    loadEffectiveAbility(deps.db, input.actorId, row.casting_ability),
    progression(deps, row, row.caster_level_adjustment),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canCastSpellLevel(ability, definition.spell_level)) throw new Error("CASTING_ABILITY_TOO_LOW");
  if (preparation.slot_level < definition.spell_level) throw new Error("SPELL_SLOT_TOO_LOW");
  const resource = expendPreparedSpell({
    id: preparation.id,
    spellId: preparation.spell_id,
    slotLevel: preparation.slot_level,
    preparedCount: preparation.prepared_count,
    expendedCount: preparation.expended_count,
  });
  if (!resource.ok) throw new Error(resource.errors[0]?.code ?? "SPELL_NOT_PREPARED");

  const kind = actionKind(definition.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const effects = await planEffects(deps, {
    campaignId: input.campaignId,
    sessionId: context.sessionId,
    casterActorId: input.actorId,
    sourceKind: "spell",
    sourceId: input.spellId,
    sourceLevel: definition.spell_level,
    casterOrManifesterLevel: levels.casterLevel,
    castingAbilityScore: ability,
    saveKind: definition.save,
    resistanceApplies: definition.spell_resistance !== "no",
    targetIds: input.targetIds ?? [],
  });

  const eventId = id(deps);
  const persisted = await new D1ResolvedCastingStore(deps.binding).commitPrepared({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "spell.cast",
      occurredAt: now(deps),
      actorId: input.actorId,
      sourceId: input.spellId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: row.id,
        castingMode: "prepared",
        preparationId: preparation.id,
        spellLevel: definition.spell_level,
        slotLevel: preparation.slot_level,
        casterLevel: levels.casterLevel,
        actionKind: kind,
        resolvedEffects: effects.results,
      },
      deltas: [
        {
          id: `${eventId}:preparation`,
          entityId: input.actorId,
          path: ["dnd35", "spellPreparations", preparation.id, "expendedCount"],
          before: preparation.expended_count,
          after: resource.value.expendedCount,
          reason: "spell.cast",
        },
      ],
    },
    characterId: input.actorId,
    preparationId: preparation.id,
    expectedExpendedCount: preparation.expended_count,
    nextExpendedCount: resource.value.expendedCount,
    ...(action === null ? {} : { action }),
    ...(Object.keys(effects.mutations).length === 0 ? {} : { effects: effects.mutations }),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    spellId: input.spellId,
    casterLevel: levels.casterLevel,
    remainingPreparations: resource.value.preparedCount - resource.value.expendedCount,
    effects: effects.results,
  };
}

export async function castSpontaneousSpellResolved(
  deps: ResolvedCastingDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    spellId: string;
    slotLevel?: number;
    targetIds?: readonly string[];
  },
) {
  const context = await requireContext(deps, input.campaignId);
  await requireCaster(deps, input.campaignId, input.actorId);
  const row = await track(deps, input.actorId, input.castingTrackId);
  if (row.casting_mode !== "spontaneous" || !row.casting_ability || !row.class_id) {
    throw new Error("CASTING_MODE_MISMATCH");
  }
  await requireKnownSpell(deps, row.id, input.spellId);
  const listClassId = row.spell_list_class_id ?? row.class_id;
  const [definition, ability, levels] = await Promise.all([
    spell(deps, input.spellId, listClassId),
    loadEffectiveAbility(deps.db, input.actorId, row.casting_ability),
    progression(deps, row, row.caster_level_adjustment),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canCastSpellLevel(ability, definition.spell_level)) throw new Error("CASTING_ABILITY_TOO_LOW");
  const slotLevel = input.slotLevel ?? definition.spell_level;
  if (!Number.isSafeInteger(slotLevel) || slotLevel < definition.spell_level) {
    throw new RangeError("Slot level must be at least the spell level.");
  }
  const [maximum, expended] = await Promise.all([
    spontaneousMaximum(deps, {
      track: row,
      effectiveLevel: levels.effectiveLevel,
      spellLevel: slotLevel,
      abilityScore: ability,
    }),
    spontaneousUsage(deps, row.id, slotLevel),
  ]);
  const resource = expendSpontaneousSlot({ spellLevel: slotLevel, maximum, expended });
  if (!resource.ok) throw new Error(resource.errors[0]?.code ?? "SPELL_SLOTS_EXHAUSTED");
  const kind = actionKind(definition.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const effects = await planEffects(deps, {
    campaignId: input.campaignId,
    sessionId: context.sessionId,
    casterActorId: input.actorId,
    sourceKind: "spell",
    sourceId: input.spellId,
    sourceLevel: definition.spell_level,
    casterOrManifesterLevel: levels.casterLevel,
    castingAbilityScore: ability,
    saveKind: definition.save,
    resistanceApplies: definition.spell_resistance !== "no",
    targetIds: input.targetIds ?? [],
  });
  const eventId = id(deps);
  const persisted = await new D1ResolvedCastingStore(deps.binding).commitSpontaneous({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "spell.cast",
      occurredAt: now(deps),
      actorId: input.actorId,
      sourceId: input.spellId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: row.id,
        castingMode: "spontaneous",
        spellLevel: definition.spell_level,
        slotLevel,
        casterLevel: levels.casterLevel,
        actionKind: kind,
        resolvedEffects: effects.results,
      },
      deltas: [
        {
          id: `${eventId}:slot`,
          entityId: input.actorId,
          path: ["dnd35", "spontaneousSlots", row.id, String(slotLevel), "expended"],
          before: expended,
          after: resource.value.expended,
          reason: "spell.cast",
        },
      ],
    },
    castingTrackId: row.id,
    spellLevel: slotLevel,
    expectedExpendedCount: expended,
    nextExpendedCount: resource.value.expended,
    ...(action === null ? {} : { action }),
    ...(Object.keys(effects.mutations).length === 0 ? {} : { effects: effects.mutations }),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    spellId: input.spellId,
    casterLevel: levels.casterLevel,
    remainingSlots: maximum - resource.value.expended,
    effects: effects.results,
  };
}

export async function manifestPowerResolved(
  deps: ResolvedCastingDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    powerId: string;
    augmentations?: readonly RequestedResolvedPowerAugmentation[];
    targetIds?: readonly string[];
  },
) {
  const context = await requireContext(deps, input.campaignId);
  await requireCaster(deps, input.campaignId, input.actorId);
  const row = await track(deps, input.actorId, input.castingTrackId);
  if (row.casting_mode !== "psionic" || !row.casting_ability || !row.class_id) {
    throw new Error("CASTING_MODE_MISMATCH");
  }
  await requireKnownPower(deps, row.id, input.powerId);
  const listClassId = row.spell_list_class_id ?? row.class_id;
  const [definition, ability, levels] = await Promise.all([
    power(deps, input.powerId, listClassId),
    loadEffectiveAbility(deps.db, input.actorId, row.casting_ability),
    progression(deps, row, row.manifester_level_adjustment),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canManifestPowerLevel(ability, definition.power_level)) {
    throw new Error("MANIFESTING_ABILITY_TOO_LOW");
  }
  const pp = await powerPointState(deps, {
    characterId: input.actorId,
    track: row,
    progression: levels,
    ability,
  });
  const selected = selectAugmentations(parseAugmentations(definition.augmentation), input.augmentations ?? []);
  const resource = planPowerManifestation({
    baseCost: definition.power_points,
    manifesterLevel: levels.casterLevel,
    currentPowerPoints: pp.current,
    augmentations: selected,
  });
  if (!resource.ok) throw new Error(resource.errors[0]?.code ?? "POWER_MANIFESTATION_INVALID");
  const kind = actionKind(definition.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const effects = await planEffects(deps, {
    campaignId: input.campaignId,
    sessionId: context.sessionId,
    casterActorId: input.actorId,
    sourceKind: "power",
    sourceId: input.powerId,
    sourceLevel: definition.power_level,
    casterOrManifesterLevel: levels.casterLevel,
    castingAbilityScore: ability,
    saveKind: definition.save,
    resistanceApplies: definition.power_resistance !== "no",
    targetIds: input.targetIds ?? [],
  });
  const nextSpent = pp.spent + resource.value.totalCost;
  const eventId = id(deps);
  const persisted = await new D1ResolvedCastingStore(deps.binding).commitPower({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "power.manifested",
      occurredAt: now(deps),
      actorId: input.actorId,
      sourceId: input.powerId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: row.id,
        powerLevel: definition.power_level,
        manifesterLevel: levels.casterLevel,
        baseCost: resource.value.baseCost,
        augmentationCost: resource.value.augmentationCost,
        totalCost: resource.value.totalCost,
        augmentations: resource.value.augmentations,
        actionKind: kind,
        resolvedEffects: effects.results,
      },
      deltas: [
        {
          id: `${eventId}:pp`,
          entityId: input.actorId,
          path: ["dnd35", "powerPointsSpent"],
          before: pp.spent,
          after: nextSpent,
          reason: "power.manifested",
        },
      ],
    },
    characterId: input.actorId,
    expectedPowerPointsSpent: pp.spent,
    nextPowerPointsSpent: nextSpent,
    ...(action === null ? {} : { action }),
    ...(Object.keys(effects.mutations).length === 0 ? {} : { effects: effects.mutations }),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    powerId: input.powerId,
    manifesterLevel: levels.casterLevel,
    powerPointsSpent: resource.value.totalCost,
    powerPointsRemaining: pp.maximum - nextSpent,
    augmentations: resource.value.augmentations,
    effects: effects.results,
  };
}
