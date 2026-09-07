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
import { resolveAuthoritativeSkillCheck } from "../domain/dnd35ActionRuntime";
import { D1CastingStore } from "./d1CastingStore";
import {
  loadActiveGameContext,
  loadEffectiveAbility,
  loadSkillActionSnapshot,
  type AbilityKey,
} from "./d1Dnd35State";
import { prepareEncounterAction } from "./encounterActionState";

export interface CastingServiceDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
  rollD20?: () => number;
}

type CastingMode = "prepared" | "spontaneous" | "psionic" | "other";
type Tradition = "arcane" | "divine" | "psionic" | "other";

interface CastingTrackRow {
  id: string;
  character_id: string;
  class_spellcasting_id: string | null;
  class_id: string | null;
  spell_list_class_id: string | null;
  track_key: string | null;
  tradition: Tradition | null;
  casting_mode: CastingMode | null;
  casting_ability: AbilityKey | null;
  caster_level_numerator: number | null;
  caster_level_denominator: number | null;
  caster_level_adjustment: number;
  manifester_level_adjustment: number;
}

interface TrackProgression {
  baseClassLevel: number;
  advancedLevels: number;
  effectiveProgressionLevel: number;
  casterOrManifesterLevel: number;
}

interface SpellDefinitionRow {
  id: string;
  action_type: string | null;
  spell_level: number;
  is_enabled: number;
}

interface PreparationRow {
  id: string;
  spell_id: string;
  slot_level: number;
  prepared_count: number;
  expended_count: number;
}

interface PowerDefinitionRow {
  id: string;
  action_type: string | null;
  power_points: number;
  augmentation: string | null;
  power_level: number;
  is_enabled: number;
}

interface PowerAugmentationDefinition {
  additionalPowerPoints: number;
  repeatable: boolean;
  description?: string;
}

export interface RequestedPowerAugmentation {
  index: number;
  applications?: number;
}

export interface CharacterCastingState {
  characterId: string;
  tracks: readonly {
    id: string;
    mode: CastingMode;
    tradition: Tradition;
    castingAbility: AbilityKey;
    effectiveProgressionLevel: number;
    casterOrManifesterLevel: number;
    prepared?: readonly {
      id: string;
      spellId: string;
      slotLevel: number;
      preparedCount: number;
      expendedCount: number;
      remaining: number;
    }[];
    spontaneous?: readonly {
      spellLevel: number;
      maximum: number;
      expended: number;
      remaining: number;
    }[];
  }[];
  psionics: {
    maximumPowerPoints: number;
    powerPointsSpent: number;
    currentPowerPoints: number;
    focused: boolean;
  };
}

function runtime(deps: CastingServiceDependencies) {
  return {
    id: deps.createId ?? (() => crypto.randomUUID()),
    now: deps.now ?? (() => new Date()),
    d20: deps.rollD20 ?? (() => Math.floor(Math.random() * 20) + 1),
    store: new D1CastingStore(deps.binding),
  };
}

function assertD20(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 20) {
    throw new RangeError("d20 roller must return an integer from 1 through 20.");
  }
  return value;
}

async function requireDnd35Context(deps: CastingServiceDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

async function requireActiveDndCharacter(
  deps: CastingServiceDependencies,
  campaignId: string,
  characterId: string,
): Promise<void> {
  const row = await deps.binding
    .prepare(
      `SELECT character.id
       FROM characters character
       JOIN dnd35_characters dnd ON dnd.character_id = character.id
       WHERE character.id = ?
         AND character.campaign_id = ?
         AND character.status = 'active'
         AND character.ruleset_id = 'dnd35'
         AND character.ruleset_version = '3.5'`,
    )
    .bind(characterId, campaignId)
    .first<{ id: string }>();
  if (!row) throw new Error("GAME_ACTOR_NOT_FOUND");
}

async function loadCastingTrack(
  deps: CastingServiceDependencies,
  characterId: string,
  castingTrackId: string,
): Promise<CastingTrackRow> {
  const row = await deps.binding
    .prepare(
      `SELECT track.id,
              track.character_id,
              track.class_spellcasting_id,
              definition.class_id,
              definition.spell_list_class_id,
              definition.track_key,
              definition.tradition,
              definition.casting_mode,
              definition.casting_ability,
              definition.caster_level_numerator,
              definition.caster_level_denominator,
              track.caster_level_adjustment,
              track.manifester_level_adjustment
       FROM dnd35_character_casting_tracks track
       LEFT JOIN dnd35_class_spellcasting definition
         ON definition.id = track.class_spellcasting_id
       WHERE track.id = ? AND track.character_id = ?`,
    )
    .bind(castingTrackId, characterId)
    .first<CastingTrackRow>();
  if (!row) throw new Error("CASTING_TRACK_NOT_FOUND");
  return row;
}

function requireClassTrack(track: CastingTrackRow): asserts track is CastingTrackRow & {
  class_spellcasting_id: string;
  class_id: string;
  track_key: string;
  tradition: Tradition;
  casting_mode: CastingMode;
  casting_ability: AbilityKey;
  caster_level_numerator: number;
  caster_level_denominator: number;
} {
  if (
    !track.class_spellcasting_id ||
    !track.class_id ||
    !track.track_key ||
    !track.tradition ||
    !track.casting_mode ||
    !track.casting_ability ||
    track.caster_level_numerator === null ||
    track.caster_level_denominator === null
  ) {
    throw new Error("CASTING_TRACK_RUNTIME_UNSUPPORTED");
  }
}

async function trackProgression(
  deps: CastingServiceDependencies,
  track: CastingTrackRow & {
    class_id: string;
    caster_level_numerator: number;
    caster_level_denominator: number;
  },
  adjustment: number,
): Promise<TrackProgression> {
  const [base, advancement] = await Promise.all([
    deps.binding
      .prepare(
        `SELECT COALESCE(MAX(level.level), 0) AS class_level
         FROM dnd35_character_class_levels gained
         JOIN dnd35_class_levels level ON level.id = gained.class_level_id
         WHERE gained.character_id = ? AND level.class_id = ?`,
      )
      .bind(track.character_id, track.class_id)
      .first<{ class_level: number }>(),
    deps.binding
      .prepare(
        `SELECT COALESCE(SUM(definition.levels_advanced), 0) AS advanced_levels
         FROM dnd35_character_casting_advancements chosen
         JOIN dnd35_class_casting_advancements definition
           ON definition.id = chosen.advancement_id
         WHERE chosen.character_id = ? AND chosen.casting_track_id = ?`,
      )
      .bind(track.character_id, track.id)
      .first<{ advanced_levels: number }>(),
  ]);

  const baseClassLevel = base?.class_level ?? 0;
  const advancedLevels = advancement?.advanced_levels ?? 0;
  const effectiveProgressionLevel = baseClassLevel + advancedLevels;
  const casterOrManifesterLevel = calculateCasterLevel({
    classLevels: baseClassLevel,
    numerator: track.caster_level_numerator,
    denominator: track.caster_level_denominator,
    advancedLevels,
    adjustment,
  });
  return {
    baseClassLevel,
    advancedLevels,
    effectiveProgressionLevel,
    casterOrManifesterLevel,
  };
}

export function mapCastingActionType(actionType: string | null): Dnd35ActionKind {
  switch (actionType) {
    case "standard":
    case "move":
    case "full_round":
    case "swift":
    case "immediate":
    case "free":
      return actionType;
    case "none":
      return "free";
    default:
      throw new Error("CASTING_ACTION_TYPE_UNSUPPORTED");
  }
}

async function loadSpellDefinition(
  deps: CastingServiceDependencies,
  spellId: string,
  listClassId: string,
): Promise<SpellDefinitionRow> {
  const row = await deps.binding
    .prepare(
      `SELECT spell.id,
              spell.action_type,
              spell.is_enabled,
              level.spell_level
       FROM dnd35_spells spell
       JOIN dnd35_spell_class_levels level ON level.spell_id = spell.id
       WHERE spell.id = ? AND level.class_id = ?`,
    )
    .bind(spellId, listClassId)
    .first<SpellDefinitionRow>();
  if (!row || row.is_enabled !== 1) throw new Error("SPELL_NOT_AVAILABLE");
  return row;
}

async function loadPreparation(
  deps: CastingServiceDependencies,
  castingTrackId: string,
  spellId: string,
  preparationId: string,
): Promise<PreparationRow> {
  const row = await deps.binding
    .prepare(
      `SELECT id, spell_id, slot_level, prepared_count, expended_count
       FROM dnd35_character_spell_preparations
       WHERE id = ? AND casting_track_id = ? AND spell_id = ?`,
    )
    .bind(preparationId, castingTrackId, spellId)
    .first<PreparationRow>();
  if (!row) throw new Error("SPELL_PREPARATION_NOT_FOUND");
  return row;
}

async function requireKnownSpell(
  deps: CastingServiceDependencies,
  castingTrackId: string,
  spellId: string,
): Promise<void> {
  const row = await deps.binding
    .prepare(
      `SELECT 1 AS allowed
       FROM dnd35_character_spells
       WHERE casting_track_id = ? AND spell_id = ?`,
    )
    .bind(castingTrackId, spellId)
    .first<{ allowed: number }>();
  if (!row) throw new Error("SPELL_NOT_KNOWN");
}

async function spontaneousMaximum(
  deps: CastingServiceDependencies,
  input: {
    track: CastingTrackRow & {
      class_id: string;
      track_key: string;
    };
    progressionLevel: number;
    spellLevel: number;
    castingAbilityScore: number;
  },
): Promise<number> {
  if (input.spellLevel > 9) {
    throw new Error("EPIC_SPONTANEOUS_SLOT_DERIVATION_UNSUPPORTED");
  }
  const progression = await deps.binding
    .prepare(
      `SELECT slots_per_day
       FROM dnd35_class_spellcasting_progression
       WHERE class_id = ? AND track_key = ? AND class_level = ? AND spell_level = ?`,
    )
    .bind(
      input.track.class_id,
      input.track.track_key,
      input.progressionLevel,
      input.spellLevel,
    )
    .first<{ slots_per_day: number | null }>();
  if (!progression) throw new Error("SPELL_SLOT_LEVEL_UNAVAILABLE");
  const slots = dailySpellSlots({
    spellLevel: input.spellLevel,
    baseSlots: progression.slots_per_day,
    castingAbilityScore: input.castingAbilityScore,
  });
  if (!slots.accessible) throw new Error("SPELL_SLOT_LEVEL_UNAVAILABLE");
  return slots.total;
}

async function spontaneousExpended(
  deps: CastingServiceDependencies,
  castingTrackId: string,
  spellLevel: number,
): Promise<number> {
  const row = await deps.binding
    .prepare(
      `SELECT expended_count
       FROM dnd35_character_spontaneous_slot_usage
       WHERE casting_track_id = ? AND spell_level = ?`,
    )
    .bind(castingTrackId, spellLevel)
    .first<{ expended_count: number }>();
  return row?.expended_count ?? 0;
}

function parsePowerAugmentations(raw: string | null): readonly PowerAugmentationDefinition[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("POWER_AUGMENTATION_DATA_INVALID");
  }
  if (!Array.isArray(parsed)) throw new Error("POWER_AUGMENTATION_DATA_INVALID");
  return parsed.map((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("additionalPowerPoints" in entry) ||
      !("repeatable" in entry)
    ) {
      throw new Error("POWER_AUGMENTATION_DATA_INVALID");
    }
    const cost = (entry as { additionalPowerPoints?: unknown }).additionalPowerPoints;
    const repeatable = (entry as { repeatable?: unknown }).repeatable;
    const description = (entry as { description?: unknown }).description;
    if (!Number.isSafeInteger(cost) || (cost as number) < 0 || typeof repeatable !== "boolean") {
      throw new Error("POWER_AUGMENTATION_DATA_INVALID");
    }
    return {
      additionalPowerPoints: cost as number,
      repeatable,
      ...(typeof description === "string" ? { description } : {}),
    };
  });
}

export function selectAuthoritativePowerAugmentations(
  definitions: readonly PowerAugmentationDefinition[],
  requested: readonly RequestedPowerAugmentation[],
): readonly PowerAugmentationOption[] {
  const seen = new Set<number>();
  return requested.map((selection) => {
    if (!Number.isSafeInteger(selection.index) || selection.index < 0 || selection.index >= definitions.length) {
      throw new RangeError("Power augmentation index is invalid.");
    }
    if (seen.has(selection.index)) {
      throw new RangeError("Each power augmentation may be selected only once per request.");
    }
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

async function loadPowerDefinition(
  deps: CastingServiceDependencies,
  powerId: string,
  listClassId: string,
): Promise<PowerDefinitionRow> {
  const row = await deps.binding
    .prepare(
      `SELECT power.id,
              power.action_type,
              power.power_points,
              power.augmentation,
              power.is_enabled,
              level.power_level
       FROM dnd35_powers power
       JOIN dnd35_power_class_levels level ON level.power_id = power.id
       WHERE power.id = ? AND level.class_id = ?`,
    )
    .bind(powerId, listClassId)
    .first<PowerDefinitionRow>();
  if (!row || row.is_enabled !== 1) throw new Error("POWER_NOT_AVAILABLE");
  return row;
}

async function requireKnownPower(
  deps: CastingServiceDependencies,
  castingTrackId: string,
  powerId: string,
): Promise<void> {
  const row = await deps.binding
    .prepare(
      `SELECT 1 AS allowed
       FROM dnd35_character_powers
       WHERE casting_track_id = ? AND power_id = ?`,
    )
    .bind(castingTrackId, powerId)
    .first<{ allowed: number }>();
  if (!row) throw new Error("POWER_NOT_KNOWN");
}

async function psionicTracks(
  deps: CastingServiceDependencies,
  characterId: string,
): Promise<readonly CastingTrackRow[]> {
  return deps.binding
    .prepare(
      `SELECT track.id,
              track.character_id,
              track.class_spellcasting_id,
              definition.class_id,
              definition.spell_list_class_id,
              definition.track_key,
              definition.tradition,
              definition.casting_mode,
              definition.casting_ability,
              definition.caster_level_numerator,
              definition.caster_level_denominator,
              track.caster_level_adjustment,
              track.manifester_level_adjustment
       FROM dnd35_character_casting_tracks track
       JOIN dnd35_class_spellcasting definition
         ON definition.id = track.class_spellcasting_id
       WHERE track.character_id = ? AND definition.casting_mode = 'psionic'`,
    )
    .bind(characterId)
    .all<CastingTrackRow>()
    .then((result) => result.results);
}

async function maximumPowerPoints(
  deps: CastingServiceDependencies,
  characterId: string,
): Promise<number> {
  const tracks = await psionicTracks(deps, characterId);
  let total = 0;
  for (const track of tracks) {
    requireClassTrack(track);
    const progression = await trackProgression(
      deps,
      track,
      track.manifester_level_adjustment,
    );
    if (progression.effectiveProgressionLevel < 1) continue;
    const base = await deps.binding
      .prepare(
        `SELECT base_power_points
         FROM dnd35_class_levels
         WHERE class_id = ? AND level = ?`,
      )
      .bind(track.class_id, progression.effectiveProgressionLevel)
      .first<{ base_power_points: number | null }>();
    if (!base || base.base_power_points === null) continue;
    const ability = await loadEffectiveAbility(deps.db, characterId, track.casting_ability);
    if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
    total +=
      base.base_power_points +
      bonusPowerPoints(ability, progression.casterOrManifesterLevel);
  }
  return total;
}

async function powerPointState(
  deps: CastingServiceDependencies,
  characterId: string,
): Promise<{ maximum: number; spent: number; current: number }> {
  const [maximum, extension] = await Promise.all([
    maximumPowerPoints(deps, characterId),
    deps.binding
      .prepare(`SELECT power_points_spent FROM dnd35_characters WHERE character_id = ?`)
      .bind(characterId)
      .first<{ power_points_spent: number }>(),
  ]);
  if (!extension) throw new Error("GAME_ACTOR_NOT_FOUND");
  if (extension.power_points_spent > maximum) throw new Error("POWER_POINT_STATE_INVALID");
  return {
    maximum,
    spent: extension.power_points_spent,
    current: maximum - extension.power_points_spent,
  };
}

async function focusedState(
  deps: CastingServiceDependencies,
  characterId: string,
): Promise<boolean> {
  const row = await deps.binding
    .prepare(`SELECT focused FROM dnd35_character_psionic_states WHERE character_id = ?`)
    .bind(characterId)
    .first<{ focused: number }>();
  return row?.focused === 1;
}

export async function castPreparedSpell(
  deps: CastingServiceDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    spellId: string;
    preparationId: string;
    targetIds?: readonly string[];
  },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.actorId);
  const track = await loadCastingTrack(deps, input.actorId, input.castingTrackId);
  requireClassTrack(track);
  if (track.casting_mode !== "prepared") throw new Error("CASTING_MODE_MISMATCH");

  const listClassId = track.spell_list_class_id ?? track.class_id;
  const [spell, preparation, ability, progression] = await Promise.all([
    loadSpellDefinition(deps, input.spellId, listClassId),
    loadPreparation(deps, track.id, input.spellId, input.preparationId),
    loadEffectiveAbility(deps.db, input.actorId, track.casting_ability),
    trackProgression(deps, track, track.caster_level_adjustment),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canCastSpellLevel(ability, spell.spell_level)) throw new Error("CASTING_ABILITY_TOO_LOW");
  if (preparation.slot_level < spell.spell_level) throw new Error("SPELL_SLOT_TOO_LOW");

  const resource = expendPreparedSpell({
    id: preparation.id,
    spellId: preparation.spell_id,
    slotLevel: preparation.slot_level,
    preparedCount: preparation.prepared_count,
    expendedCount: preparation.expended_count,
  });
  if (!resource.ok) throw new Error(resource.errors[0]?.code ?? "SPELL_NOT_PREPARED");

  const actionKind = mapCastingActionType(spell.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind: actionKind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const rt = runtime(deps);
  const eventId = rt.id();
  const occurredAt = rt.now();
  const persisted = await rt.store.commitPreparedSpellCast({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "spell.cast",
      occurredAt,
      actorId: input.actorId,
      sourceId: input.spellId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: track.id,
        castingMode: "prepared",
        preparationId: preparation.id,
        spellLevel: spell.spell_level,
        slotLevel: preparation.slot_level,
        casterLevel: progression.casterOrManifesterLevel,
        actionKind,
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
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    castingTrackId: track.id,
    spellId: input.spellId,
    castingMode: "prepared" as const,
    casterLevel: progression.casterOrManifesterLevel,
    spellLevel: spell.spell_level,
    slotLevel: preparation.slot_level,
    remainingPreparations: resource.value.preparedCount - resource.value.expendedCount,
  };
}

export async function castSpontaneousSpell(
  deps: CastingServiceDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    spellId: string;
    slotLevel?: number;
    targetIds?: readonly string[];
  },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.actorId);
  const track = await loadCastingTrack(deps, input.actorId, input.castingTrackId);
  requireClassTrack(track);
  if (track.casting_mode !== "spontaneous") throw new Error("CASTING_MODE_MISMATCH");
  await requireKnownSpell(deps, track.id, input.spellId);

  const listClassId = track.spell_list_class_id ?? track.class_id;
  const [spell, ability, progression] = await Promise.all([
    loadSpellDefinition(deps, input.spellId, listClassId),
    loadEffectiveAbility(deps.db, input.actorId, track.casting_ability),
    trackProgression(deps, track, track.caster_level_adjustment),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canCastSpellLevel(ability, spell.spell_level)) throw new Error("CASTING_ABILITY_TOO_LOW");
  const slotLevel = input.slotLevel ?? spell.spell_level;
  if (!Number.isSafeInteger(slotLevel) || slotLevel < spell.spell_level) {
    throw new RangeError("Slot level must be a safe integer at least as high as the spell level.");
  }
  const maximum = await spontaneousMaximum(deps, {
    track,
    progressionLevel: progression.effectiveProgressionLevel,
    spellLevel: slotLevel,
    castingAbilityScore: ability,
  });
  const expended = await spontaneousExpended(deps, track.id, slotLevel);
  const resource = expendSpontaneousSlot({ spellLevel: slotLevel, maximum, expended });
  if (!resource.ok) throw new Error(resource.errors[0]?.code ?? "SPELL_SLOTS_EXHAUSTED");

  const actionKind = mapCastingActionType(spell.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind: actionKind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const rt = runtime(deps);
  const eventId = rt.id();
  const persisted = await rt.store.commitSpontaneousSpellCast({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "spell.cast",
      occurredAt: rt.now(),
      actorId: input.actorId,
      sourceId: input.spellId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: track.id,
        castingMode: "spontaneous",
        spellLevel: spell.spell_level,
        slotLevel,
        casterLevel: progression.casterOrManifesterLevel,
        actionKind,
      },
      deltas: [
        {
          id: `${eventId}:slot`,
          entityId: input.actorId,
          path: ["dnd35", "spontaneousSlots", track.id, String(slotLevel), "expended"],
          before: expended,
          after: resource.value.expended,
          reason: "spell.cast",
        },
      ],
    },
    castingTrackId: track.id,
    spellLevel: slotLevel,
    expectedExpendedCount: expended,
    nextExpendedCount: resource.value.expended,
    ...(action === null ? {} : { action }),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    castingTrackId: track.id,
    spellId: input.spellId,
    castingMode: "spontaneous" as const,
    casterLevel: progression.casterOrManifesterLevel,
    spellLevel: spell.spell_level,
    slotLevel,
    remainingSlots: maximum - resource.value.expended,
  };
}

export async function manifestPower(
  deps: CastingServiceDependencies,
  input: {
    campaignId: string;
    actorId: string;
    castingTrackId: string;
    powerId: string;
    augmentations?: readonly RequestedPowerAugmentation[];
    targetIds?: readonly string[];
  },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.actorId);
  const track = await loadCastingTrack(deps, input.actorId, input.castingTrackId);
  requireClassTrack(track);
  if (track.casting_mode !== "psionic") throw new Error("CASTING_MODE_MISMATCH");
  await requireKnownPower(deps, track.id, input.powerId);

  const listClassId = track.spell_list_class_id ?? track.class_id;
  const [power, ability, progression, pp] = await Promise.all([
    loadPowerDefinition(deps, input.powerId, listClassId),
    loadEffectiveAbility(deps.db, input.actorId, track.casting_ability),
    trackProgression(deps, track, track.manifester_level_adjustment),
    powerPointState(deps, input.actorId),
  ]);
  if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
  if (!canManifestPowerLevel(ability, power.power_level)) {
    throw new Error("MANIFESTING_ABILITY_TOO_LOW");
  }

  const authoritativeAugmentations = selectAuthoritativePowerAugmentations(
    parsePowerAugmentations(power.augmentation),
    input.augmentations ?? [],
  );
  const planned = planPowerManifestation({
    baseCost: power.power_points,
    manifesterLevel: progression.casterOrManifesterLevel,
    currentPowerPoints: pp.current,
    augmentations: authoritativeAugmentations,
  });
  if (!planned.ok) throw new Error(planned.errors[0]?.code ?? "POWER_MANIFESTATION_INVALID");

  const actionKind = mapCastingActionType(power.action_type);
  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind: actionKind,
    ...(input.targetIds === undefined ? {} : { requiredParticipantIds: input.targetIds }),
  });
  const rt = runtime(deps);
  const eventId = rt.id();
  const nextSpent = pp.spent + planned.value.totalCost;
  const persisted = await rt.store.commitPowerManifestation({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "power.manifested",
      occurredAt: rt.now(),
      actorId: input.actorId,
      sourceId: input.powerId,
      targetIds: input.targetIds ?? [],
      payload: {
        castingTrackId: track.id,
        powerLevel: power.power_level,
        manifesterLevel: progression.casterOrManifesterLevel,
        baseCost: planned.value.baseCost,
        augmentationCost: planned.value.augmentationCost,
        totalCost: planned.value.totalCost,
        augmentations: planned.value.augmentations,
        actionKind,
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
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    castingTrackId: track.id,
    powerId: input.powerId,
    manifesterLevel: progression.casterOrManifesterLevel,
    powerLevel: power.power_level,
    powerPointsSpent: planned.value.totalCost,
    powerPointsRemaining: pp.maximum - nextSpent,
    augmentations: planned.value.augmentations,
  };
}

async function concentrationSkillId(
  deps: CastingServiceDependencies,
): Promise<string> {
  const row = await deps.binding
    .prepare(
      `SELECT id
       FROM dnd35_skills
       WHERE lower(slug) = 'concentration' AND is_enabled = 1
       ORDER BY is_homebrew ASC, created_at ASC
       LIMIT 1`,
    )
    .first<{ id: string }>();
  if (!row) throw new Error("CONCENTRATION_SKILL_NOT_AVAILABLE");
  return row.id;
}

export async function gainPersistentPsionicFocus(
  deps: CastingServiceDependencies,
  input: { campaignId: string; actorId: string },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.actorId);
  const tracks = await psionicTracks(deps, input.actorId);
  if (tracks.length === 0) throw new Error("PSIONIC_RUNTIME_UNAVAILABLE");
  if (await focusedState(deps, input.actorId)) throw new Error("PSIONIC_ALREADY_FOCUSED");

  const skillId = await concentrationSkillId(deps);
  const snapshot = await loadSkillActionSnapshot({
    db: deps.db,
    campaignId: input.campaignId,
    characterId: input.actorId,
    skillId,
  });
  if (!snapshot) throw new Error("CONCENTRATION_SKILL_NOT_AVAILABLE");
  const rt = runtime(deps);
  const roll = assertD20(rt.d20());
  const check = resolveAuthoritativeSkillCheck({ snapshot, dc: 20, roll });
  if (!check.allowed) throw new Error(check.code);
  if (!check.check.success) {
    return {
      focused: false as const,
      success: false as const,
      roll: check.check.naturalRoll,
      total: check.check.total,
      dc: 20,
    };
  }

  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind: "full_round",
  });
  const eventId = rt.id();
  const persisted = await rt.store.commitPsionicFocusGain({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "psionic.focus.gained",
      occurredAt: rt.now(),
      actorId: input.actorId,
      targetIds: [input.actorId],
      payload: {
        skillId,
        dc: 20,
        roll: check.check.naturalRoll,
        total: check.check.total,
      },
      deltas: [
        {
          id: `${eventId}:focus`,
          entityId: input.actorId,
          path: ["dnd35", "psionicFocus"],
          before: false,
          after: true,
          reason: "psionic.focus.gained",
        },
      ],
    },
    characterId: input.actorId,
    ...(action === null ? {} : { action }),
  });
  if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  return {
    eventId,
    sessionId: context.sessionId,
    focused: true as const,
    success: true as const,
    roll: check.check.naturalRoll,
    total: check.check.total,
    dc: 20,
  };
}

export async function restorePersistentCastingResources(
  deps: CastingServiceDependencies,
  input: { campaignId: string; characterId: string },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.characterId);
  const rt = runtime(deps);
  const eventId = rt.id();
  await rt.store.restoreDailyResources({
    event: {
      id: eventId,
      campaignId: context.campaignId,
      sessionId: context.sessionId,
      eventType: "casting.daily_restored",
      occurredAt: rt.now(),
      actorId: input.characterId,
      targetIds: [input.characterId],
      payload: { characterId: input.characterId },
      deltas: [
        {
          id: `${eventId}:daily-resources`,
          entityId: input.characterId,
          path: ["dnd35", "dailyCastingResources"],
          before: "expended",
          after: "restored",
          reason: "casting.daily_restored",
        },
      ],
    },
    characterId: input.characterId,
  });
  return { eventId, sessionId: context.sessionId, characterId: input.characterId };
}

export async function getCharacterCastingState(
  deps: CastingServiceDependencies,
  input: { campaignId: string; characterId: string },
): Promise<CharacterCastingState> {
  await requireDnd35Context(deps, input.campaignId);
  await requireActiveDndCharacter(deps, input.campaignId, input.characterId);
  const trackRows = await deps.binding
    .prepare(
      `SELECT track.id,
              track.character_id,
              track.class_spellcasting_id,
              definition.class_id,
              definition.spell_list_class_id,
              definition.track_key,
              definition.tradition,
              definition.casting_mode,
              definition.casting_ability,
              definition.caster_level_numerator,
              definition.caster_level_denominator,
              track.caster_level_adjustment,
              track.manifester_level_adjustment
       FROM dnd35_character_casting_tracks track
       JOIN dnd35_class_spellcasting definition
         ON definition.id = track.class_spellcasting_id
       WHERE track.character_id = ?
       ORDER BY track.created_at ASC`,
    )
    .bind(input.characterId)
    .all<CastingTrackRow>();

  const tracks: CharacterCastingState["tracks"][number][] = [];
  for (const track of trackRows.results) {
    requireClassTrack(track);
    const adjustment =
      track.casting_mode === "psionic"
        ? track.manifester_level_adjustment
        : track.caster_level_adjustment;
    const progression = await trackProgression(deps, track, adjustment);
    const base = {
      id: track.id,
      mode: track.casting_mode,
      tradition: track.tradition,
      castingAbility: track.casting_ability,
      effectiveProgressionLevel: progression.effectiveProgressionLevel,
      casterOrManifesterLevel: progression.casterOrManifesterLevel,
    };

    if (track.casting_mode === "prepared") {
      const rows = await deps.binding
        .prepare(
          `SELECT id, spell_id, slot_level, prepared_count, expended_count
           FROM dnd35_character_spell_preparations
           WHERE casting_track_id = ?
           ORDER BY slot_level ASC, spell_id ASC`,
        )
        .bind(track.id)
        .all<PreparationRow>();
      tracks.push({
        ...base,
        prepared: rows.results.map((row) => ({
          id: row.id,
          spellId: row.spell_id,
          slotLevel: row.slot_level,
          preparedCount: row.prepared_count,
          expendedCount: row.expended_count,
          remaining: row.prepared_count - row.expended_count,
        })),
      });
      continue;
    }

    if (track.casting_mode === "spontaneous") {
      const ability = await loadEffectiveAbility(deps.db, input.characterId, track.casting_ability);
      if (ability === null) throw new Error("CASTING_ABILITY_UNAVAILABLE");
      const progressionRows = await deps.binding
        .prepare(
          `SELECT spell_level, slots_per_day
           FROM dnd35_class_spellcasting_progression
           WHERE class_id = ? AND track_key = ? AND class_level = ?
           ORDER BY spell_level ASC`,
        )
        .bind(track.class_id, track.track_key, progression.effectiveProgressionLevel)
        .all<{ spell_level: number; slots_per_day: number | null }>();
      const usageRows = await deps.binding
        .prepare(
          `SELECT spell_level, expended_count
           FROM dnd35_character_spontaneous_slot_usage
           WHERE casting_track_id = ?`,
        )
        .bind(track.id)
        .all<{ spell_level: number; expended_count: number }>();
      const usage = new Map(usageRows.results.map((row) => [row.spell_level, row.expended_count]));
      tracks.push({
        ...base,
        spontaneous: progressionRows.results.map((row) => {
          const daily = dailySpellSlots({
            spellLevel: row.spell_level,
            baseSlots: row.slots_per_day,
            castingAbilityScore: ability,
          });
          const expended = usage.get(row.spell_level) ?? 0;
          return {
            spellLevel: row.spell_level,
            maximum: daily.total,
            expended,
            remaining: Math.max(0, daily.total - expended),
          };
        }),
      });
      continue;
    }

    tracks.push(base);
  }

  const [pp, focused] = await Promise.all([
    powerPointState(deps, input.characterId),
    focusedState(deps, input.characterId),
  ]);
  return {
    characterId: input.characterId,
    tracks,
    psionics: {
      maximumPowerPoints: pp.maximum,
      powerPointsSpent: pp.spent,
      currentPowerPoints: pp.current,
      focused,
    },
  };
}
