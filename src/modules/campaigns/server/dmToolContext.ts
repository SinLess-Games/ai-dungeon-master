/// <reference types="@cloudflare/workers-types" />

import { alignmentToScores, type Dnd35Alignment } from "@/rulesets/dnd35";
import { loadDmCharacterContext, type DmCharacterContext } from "./dmActionService";

export interface DmToolWeaponOption {
  inventoryId: string;
  itemId: string;
  name: string;
  attackKind: "melee" | "ranged" | "both";
  handedness: "light" | "one_handed" | "two_handed" | "ranged";
  quantity: number;
}

export interface DmToolPreparedSpell {
  preparationId: string;
  spellId: string;
  name: string;
  slotLevel: number;
  remaining: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

export interface DmToolSpontaneousSpell {
  spellId: string;
  name: string;
  spellLevel: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

export interface DmToolPower {
  powerId: string;
  name: string;
  powerLevel: number;
  powerPoints: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

export interface DmToolCastingTrack {
  id: string;
  mode: "prepared" | "spontaneous" | "psionic" | "other";
  tradition: "arcane" | "divine" | "psionic" | "other";
  trackKey: string;
  prepared: DmToolPreparedSpell[];
  spontaneous: DmToolSpontaneousSpell[];
  powers: DmToolPower[];
}

export interface DmToolInventoryOption {
  inventoryId: string;
  itemId: string;
  name: string;
  quantity: number;
  equipped: boolean;
  location: "carried" | "stored" | "party";
}

export interface DmToolActiveCondition {
  runtimeConditionId: string;
  actorId: string;
  conditionId: string;
  name: string;
  durationKind: string;
  remainingRounds: number | null;
}

export interface DmToolEncounterContext {
  id: string;
  roundNumber: number;
  activeTurnIndex: number;
  currentActorId: string | null;
  participantIds: string[];
}

export interface DmToolAlignmentContext {
  alignment: Dnd35Alignment;
  lawChaosScore: number;
  goodEvilScore: number;
}

export interface DmToolCharacterContext extends DmCharacterContext {
  weapons: DmToolWeaponOption[];
  castingTracks: DmToolCastingTrack[];
  inventory: DmToolInventoryOption[];
  alignment: DmToolAlignmentContext;
}

interface CastingTrackRow {
  id: string;
  classId: string;
  spellListClassId: string | null;
  trackKey: string;
  tradition: DmToolCastingTrack["tradition"];
  mode: DmToolCastingTrack["mode"];
}

async function loadCastingTracks(binding: D1Database, characterId: string): Promise<DmToolCastingTrack[]> {
  const tracks = await binding
    .prepare(
      `SELECT track.id,
              definition.class_id AS classId,
              definition.spell_list_class_id AS spellListClassId,
              definition.track_key AS trackKey,
              definition.tradition,
              definition.casting_mode AS mode
       FROM dnd35_character_casting_tracks track
       JOIN dnd35_class_spellcasting definition
         ON definition.id = track.class_spellcasting_id
       WHERE track.character_id = ?
       ORDER BY definition.tradition, definition.track_key, track.id`,
    )
    .bind(characterId)
    .all<CastingTrackRow>();

  return Promise.all(
    tracks.results.map(async (track) => {
      const listClassId = track.spellListClassId ?? track.classId;
      const [prepared, spontaneous, powers] = await Promise.all([
        track.mode === "prepared"
          ? binding
              .prepare(
                `SELECT preparation.id AS preparationId,
                        preparation.spell_id AS spellId,
                        spell.name,
                        preparation.slot_level AS slotLevel,
                        preparation.prepared_count - preparation.expended_count AS remaining,
                        spell.action_type AS actionType,
                        spell.range_text AS rangeText,
                        spell.target_text AS targetText
                 FROM dnd35_character_spell_preparations preparation
                 JOIN dnd35_spells spell ON spell.id = preparation.spell_id
                 WHERE preparation.casting_track_id = ?
                   AND spell.is_enabled = 1
                   AND preparation.prepared_count > preparation.expended_count
                 ORDER BY preparation.slot_level, spell.name, preparation.id`,
              )
              .bind(track.id)
              .all<DmToolPreparedSpell>()
              .then((result) => result.results)
          : Promise.resolve([] as DmToolPreparedSpell[]),
        track.mode === "spontaneous"
          ? binding
              .prepare(
                `SELECT known.spell_id AS spellId,
                        spell.name,
                        level.spell_level AS spellLevel,
                        spell.action_type AS actionType,
                        spell.range_text AS rangeText,
                        spell.target_text AS targetText
                 FROM dnd35_character_spells known
                 JOIN dnd35_spells spell ON spell.id = known.spell_id
                 JOIN dnd35_spell_class_levels level
                   ON level.spell_id = spell.id AND level.class_id = ?
                 WHERE known.casting_track_id = ? AND spell.is_enabled = 1
                 ORDER BY level.spell_level, spell.name`,
              )
              .bind(listClassId, track.id)
              .all<DmToolSpontaneousSpell>()
              .then((result) => result.results)
          : Promise.resolve([] as DmToolSpontaneousSpell[]),
        track.mode === "psionic"
          ? binding
              .prepare(
                `SELECT known.power_id AS powerId,
                        power.name,
                        level.power_level AS powerLevel,
                        COALESCE(level.power_points, power.power_points) AS powerPoints,
                        power.action_type AS actionType,
                        power.range_text AS rangeText,
                        power.target_text AS targetText
                 FROM dnd35_character_powers known
                 JOIN dnd35_powers power ON power.id = known.power_id
                 JOIN dnd35_power_class_levels level
                   ON level.power_id = power.id AND level.class_id = ?
                 WHERE known.casting_track_id = ? AND power.is_enabled = 1
                 ORDER BY level.power_level, power.name`,
              )
              .bind(track.classId, track.id)
              .all<DmToolPower>()
              .then((result) => result.results)
          : Promise.resolve([] as DmToolPower[]),
      ]);
      return {
        id: track.id,
        mode: track.mode,
        tradition: track.tradition,
        trackKey: track.trackKey,
        prepared,
        spontaneous,
        powers,
      };
    }),
  );
}

export async function loadDmToolCharacterContext(
  binding: D1Database,
  campaignId: string,
  characterId: string,
  userId: string,
): Promise<DmToolCharacterContext | null> {
  const base = await loadDmCharacterContext(binding, campaignId, characterId, userId);
  if (!base) return null;

  const [weapons, castingTracks, inventory, alignmentRow] = await Promise.all([
    binding
      .prepare(
        `SELECT inventory.id AS inventoryId,
                item.id AS itemId,
                item.name,
                weapon.attack_kind AS attackKind,
                weapon.handedness,
                inventory.quantity
         FROM dnd35_character_inventory inventory
         JOIN dnd35_items item ON item.id = inventory.item_id
         JOIN dnd35_weapons weapon ON weapon.item_id = item.id
         WHERE inventory.character_id = ?
           AND inventory.location = 'carried'
         ORDER BY item.name, inventory.id`,
      )
      .bind(characterId)
      .all<DmToolWeaponOption>()
      .then((result) => result.results),
    loadCastingTracks(binding, characterId),
    binding
      .prepare(
        `SELECT inventory.id AS inventoryId,
                inventory.item_id AS itemId,
                item.name,
                inventory.quantity,
                inventory.equipped,
                inventory.location
         FROM dnd35_character_inventory inventory
         JOIN dnd35_items item ON item.id = inventory.item_id
         WHERE inventory.character_id = ?
         ORDER BY item.name, inventory.id`,
      )
      .bind(characterId)
      .all<{
        inventoryId: string;
        itemId: string;
        name: string;
        quantity: number;
        equipped: number;
        location: "carried" | "stored" | "party";
      }>()
      .then((result) =>
        result.results.map((row) => ({ ...row, equipped: Boolean(row.equipped) })),
      ),
    binding
      .prepare(
        `SELECT character.alignment,
                runtime.law_chaos_score AS lawChaosScore,
                runtime.good_evil_score AS goodEvilScore
         FROM dnd35_characters character
         LEFT JOIN runtime_dnd35_alignment_states runtime
           ON runtime.character_id = character.character_id
         WHERE character.character_id = ?
         LIMIT 1`,
      )
      .bind(characterId)
      .first<{
        alignment: Dnd35Alignment;
        lawChaosScore: number | null;
        goodEvilScore: number | null;
      }>(),
  ]);
  if (!alignmentRow) return null;
  const seeded = alignmentToScores(alignmentRow.alignment);

  return {
    ...base,
    weapons,
    castingTracks,
    inventory,
    alignment: {
      alignment: alignmentRow.alignment,
      lawChaosScore: alignmentRow.lawChaosScore ?? seeded.lawChaos,
      goodEvilScore: alignmentRow.goodEvilScore ?? seeded.goodEvil,
    },
  };
}

export async function loadDmToolEncounterContext(
  binding: D1Database,
  campaignId: string,
): Promise<DmToolEncounterContext | null> {
  const encounter = await binding
    .prepare(
      `SELECT id, round_number AS roundNumber, active_turn_index AS activeTurnIndex
       FROM game_encounters
       WHERE campaign_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(campaignId)
    .first<{ id: string; roundNumber: number; activeTurnIndex: number }>();
  if (!encounter) return null;
  const participants = await binding
    .prepare(
      `SELECT actor_id AS actorId, turn_order AS turnOrder
       FROM game_encounter_participants
       WHERE encounter_id = ? AND status = 'active'
       ORDER BY turn_order`,
    )
    .bind(encounter.id)
    .all<{ actorId: string; turnOrder: number }>();
  return {
    ...encounter,
    currentActorId:
      participants.results.find((participant) => participant.turnOrder === encounter.activeTurnIndex)
        ?.actorId ?? null,
    participantIds: participants.results.map((participant) => participant.actorId),
  };
}

export async function loadDmToolActiveConditions(
  binding: D1Database,
  campaignId: string,
): Promise<DmToolActiveCondition[]> {
  const result = await binding
    .prepare(
      `SELECT runtime.id AS runtimeConditionId,
              runtime.actor_id AS actorId,
              runtime.condition_id AS conditionId,
              condition.name,
              runtime.duration_kind AS durationKind,
              runtime.remaining_rounds AS remainingRounds
       FROM runtime_dnd35_actor_conditions runtime
       JOIN game_actors actor ON actor.id = runtime.actor_id
       JOIN dnd35_conditions condition ON condition.id = runtime.condition_id
       WHERE actor.campaign_id = ?
       ORDER BY actor.id, condition.name, runtime.created_at`,
    )
    .bind(campaignId)
    .all<DmToolActiveCondition>();
  return result.results;
}
