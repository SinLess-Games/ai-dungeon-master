/// <reference types="@cloudflare/workers-types" />

import { createDatabase } from "@/infrastructure/database/client";
import {
  loadCharacterSheetSnapshot,
  type RuntimeCharacterSheetSnapshot,
} from "@/modules/game/server/d1Dnd35State";
import {
  getCharacterCastingState,
  type CharacterCastingState,
} from "@/modules/game/server/castingService";

export interface DmCampaignCharacterProfile {
  character: {
    id: string;
    actorId: string | null;
    ownerUserId: string | null;
    name: string;
    status: string;
    rulesetId: string;
    rulesetVersion: string;
    pronouns: string | null;
    playerNotes: string;
    metadata: Record<string, unknown>;
  };
  dnd35: {
    race: {
      id: string;
      name: string;
      size: string;
      baseSpeedFeet: number;
      racialHitDice: number;
      racialHitDie: number | null;
      levelAdjustment: number;
    } | null;
    deity: { id: string; name: string } | null;
    alignment: string;
    experiencePoints: number;
    progressionMode: string;
    sizeOverride: string | null;
    levelAdjustmentOverride: number | null;
    stable: boolean;
    encumbranceEnabled: boolean;
    powerPointsSpent: number;
  };
  sheet: RuntimeCharacterSheetSnapshot | null;
  abilityBreakdown: readonly unknown[];
  classLevels: readonly unknown[];
  racialHitDice: readonly unknown[];
  abilityIncreases: readonly unknown[];
  skills: readonly unknown[];
  feats: readonly unknown[];
  inventory: readonly unknown[];
  languages: readonly unknown[];
  domains: readonly unknown[];
  templates: readonly unknown[];
  raceTraits: readonly unknown[];
  classFeatures: readonly unknown[];
  spellbooks: readonly unknown[];
  knownSpells: readonly unknown[];
  spellPreparations: readonly unknown[];
  knownPowers: readonly unknown[];
  casting: CharacterCastingState | null;
  alignmentState: {
    lawChaosScore: number;
    goodEvilScore: number;
    lastReason: string | null;
  } | null;
}

interface CharacterRow {
  id: string;
  actorId: string | null;
  ownerUserId: string | null;
  name: string;
  status: string;
  rulesetId: string;
  rulesetVersion: string;
  metadata: string;
  raceId: string | null;
  raceName: string | null;
  raceSize: string | null;
  raceBaseSpeedFeet: number | null;
  raceRacialHitDice: number | null;
  raceRacialHitDie: number | null;
  raceLevelAdjustment: number | null;
  deityId: string | null;
  deityName: string | null;
  experiencePoints: number;
  alignment: string;
  sizeOverride: string | null;
  levelAdjustmentOverride: number | null;
  stable: number;
  powerPointsSpent: number;
  progressionMode: string;
  encumbranceEnabled: number;
}

function safeObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function safeJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

async function rows<T>(binding: D1Database, sql: string, ...values: unknown[]): Promise<T[]> {
  const result = await binding.prepare(sql).bind(...values).all<T>();
  return result.results;
}

function groupByCharacter<T extends { characterId: string }>(values: readonly T[]) {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const current = grouped.get(value.characterId);
    if (current) current.push(value);
    else grouped.set(value.characterId, [value]);
  }
  return grouped;
}

/**
 * Loads the campaign's complete current character-sheet context for the AI DM.
 *
 * This data is informational. It deliberately does not widen the model's
 * command permissions: authoritative tool execution still uses the separate
 * acting-character context and validated game-command boundary.
 *
 * The profile contains character-owned state plus the catalog identity/rules
 * directly attached to that character (feats, race traits, class features,
 * inventory, spells, powers, etc.). It does not dump unrelated sourcebook
 * content into the model prompt.
 */
export async function loadDmCampaignCharacterProfiles(
  binding: D1Database,
  campaignId: string,
): Promise<DmCampaignCharacterProfile[]> {
  const characters = await rows<CharacterRow>(
    binding,
    `SELECT c.id,
            a.id AS actorId,
            c.owner_user_id AS ownerUserId,
            c.name,
            c.status,
            c.ruleset_id AS rulesetId,
            c.ruleset_version AS rulesetVersion,
            c.metadata,
            d.race_id AS raceId,
            r.name AS raceName,
            r.size AS raceSize,
            r.base_speed_feet AS raceBaseSpeedFeet,
            r.racial_hit_dice AS raceRacialHitDice,
            r.racial_hit_die AS raceRacialHitDie,
            r.level_adjustment AS raceLevelAdjustment,
            d.deity_id AS deityId,
            deity.name AS deityName,
            d.experience_points AS experiencePoints,
            d.alignment,
            d.size_override AS sizeOverride,
            d.level_adjustment_override AS levelAdjustmentOverride,
            d.stable,
            d.power_points_spent AS powerPointsSpent,
            d.progression_mode AS progressionMode,
            d.encumbrance_enabled AS encumbranceEnabled
     FROM characters c
     JOIN dnd35_characters d ON d.character_id = c.id
     LEFT JOIN dnd35_races r ON r.id = d.race_id
     LEFT JOIN dnd35_deities deity ON deity.id = d.deity_id
     LEFT JOIN game_actors a
       ON a.campaign_id = c.campaign_id
      AND a.character_id = c.id
     WHERE c.campaign_id = ?
       AND c.status IN ('ready', 'active', 'retired')
     ORDER BY c.created_at ASC, c.id ASC`,
    campaignId,
  );
  if (characters.length === 0) return [];

  const [
    abilityRows,
    classRows,
    racialHitDiceRows,
    increaseRows,
    skillRows,
    featRows,
    inventoryRows,
    languageRows,
    domainRows,
    templateRows,
    raceTraitRows,
    classFeatureRows,
    spellbookRows,
    knownSpellRows,
    preparationRows,
    knownPowerRows,
    alignmentRows,
  ] = await Promise.all([
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT score.character_id AS characterId,
              score.ability,
              score.base_score AS baseScore,
              score.inherent_bonus AS inherentBonus,
              score.temporary_adjustment AS temporaryAdjustment,
              score.ability_damage AS abilityDamage,
              score.ability_drain AS abilityDrain
       FROM dnd35_character_ability_scores score
       JOIN characters c ON c.id = score.character_id
       WHERE c.campaign_id = ?
       ORDER BY score.character_id, score.ability`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT gained.character_id AS characterId,
              gained.id AS gainedClassLevelId,
              class.id AS classId,
              class.name AS className,
              class.category AS classCategory,
              level.level AS classLevel,
              gained.character_level AS characterLevel,
              gained.track,
              gained.hit_points_gained AS hitPointsGained,
              gained.skill_points_spent AS skillPointsSpent,
              level.base_attack_bonus AS cumulativeClassBaseAttackBonus,
              level.fort AS cumulativeClassFort,
              level.ref AS cumulativeClassRef,
              level.will AS cumulativeClassWill,
              COALESCE(level.hit_die, class.hit_die) AS hitDie,
              COALESCE(level.skill_points, class.skill_points_per_level) AS skillPointsAtLevel
       FROM dnd35_character_class_levels gained
       JOIN dnd35_class_levels level ON level.id = gained.class_level_id
       JOIN dnd35_classes class ON class.id = level.class_id
       JOIN characters c ON c.id = gained.character_id
       WHERE c.campaign_id = ?
       ORDER BY gained.character_id, gained.track, gained.character_level`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT rhd.character_id AS characterId,
              rhd.character_level AS characterLevel,
              rhd.creature_type_id AS creatureTypeId,
              type.name AS creatureTypeName,
              rhd.hit_die AS hitDie,
              rhd.hit_points_gained AS hitPointsGained
       FROM dnd35_character_racial_hit_dice rhd
       JOIN dnd35_creature_types type ON type.id = rhd.creature_type_id
       JOIN characters c ON c.id = rhd.character_id
       WHERE c.campaign_id = ?
       ORDER BY rhd.character_id, rhd.character_level`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT inc.character_id AS characterId,
              inc.character_level AS characterLevel,
              inc.ability,
              inc.amount
       FROM dnd35_character_ability_increases inc
       JOIN characters c ON c.id = inc.character_id
       WHERE c.campaign_id = ?
       ORDER BY inc.character_id, inc.character_level`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT chosen.character_id AS characterId,
              skill.id AS skillId,
              skill.slug,
              skill.name,
              skill.ability,
              skill.trained_only AS trainedOnly,
              skill.armor_check_multiplier AS armorCheckMultiplier,
              skill.requires_specialization AS requiresSpecialization,
              chosen.specialization,
              chosen.ranks,
              chosen.notes
       FROM dnd35_character_skills chosen
       JOIN dnd35_skills skill ON skill.id = chosen.skill_id
       JOIN characters c ON c.id = chosen.character_id
       WHERE c.campaign_id = ?
       ORDER BY chosen.character_id, skill.name, chosen.specialization`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT chosen.character_id AS characterId,
              chosen.id AS characterFeatId,
              feat.id AS featId,
              feat.slug,
              feat.name,
              feat.description,
              feat.rules_text AS rulesText,
              chosen.occurrence,
              chosen.gained_at_level AS gainedAtLevel,
              chosen.grant_kind AS grantKind,
              chosen.grant_note AS grantNote,
              chosen.choices
       FROM dnd35_character_feats chosen
       JOIN dnd35_feats feat ON feat.id = chosen.feat_id
       JOIN characters c ON c.id = chosen.character_id
       WHERE c.campaign_id = ?
       ORDER BY chosen.character_id, COALESCE(chosen.gained_at_level, 0), feat.name, chosen.occurrence`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT inventory.character_id AS characterId,
              inventory.id AS inventoryId,
              inventory.item_id AS itemId,
              COALESCE(instance.custom_name, item.name) AS name,
              item.name AS catalogName,
              item.slug,
              item.category,
              item.description,
              item.rules_text AS rulesText,
              item.price_copper AS priceCopper,
              item.weight_pounds AS weightPounds,
              item.size,
              item.hardness,
              item.hit_points AS itemHitPoints,
              inventory.quantity,
              inventory.equipped,
              inventory.equipped_slot AS equippedSlot,
              inventory.container_inventory_id AS containerInventoryId,
              inventory.location,
              inventory.location_id AS locationId,
              inventory.notes,
              inventory.instance_id AS instanceId,
              instance.remaining_charges AS remainingCharges,
              instance.current_hit_points AS instanceCurrentHitPoints,
              instance.enhancement_bonus AS enhancementBonus,
              instance.notes AS instanceNotes
       FROM dnd35_character_inventory inventory
       JOIN dnd35_items item ON item.id = inventory.item_id
       LEFT JOIN dnd35_item_instances instance ON instance.id = inventory.instance_id
       JOIN characters c ON c.id = inventory.character_id
       WHERE c.campaign_id = ?
       ORDER BY inventory.character_id, inventory.location, inventory.equipped DESC, item.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT chosen.character_id AS characterId,
              language.id AS languageId,
              language.name,
              language.slug
       FROM dnd35_character_languages chosen
       JOIN dnd35_languages language ON language.id = chosen.language_id
       JOIN characters c ON c.id = chosen.character_id
       WHERE c.campaign_id = ?
       ORDER BY chosen.character_id, language.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT chosen.character_id AS characterId,
              domain.id AS domainId,
              domain.name,
              domain.slug,
              domain.description,
              domain.rules_text AS rulesText
       FROM dnd35_character_domains chosen
       JOIN dnd35_domains domain ON domain.id = chosen.domain_id
       JOIN characters c ON c.id = chosen.character_id
       WHERE c.campaign_id = ?
       ORDER BY chosen.character_id, domain.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT chosen.character_id AS characterId,
              chosen.application_order AS applicationOrder,
              template.id AS templateId,
              template.name,
              template.slug,
              template.description,
              template.rules_text AS rulesText
       FROM dnd35_character_templates chosen
       JOIN dnd35_templates template ON template.id = chosen.template_id
       JOIN characters c ON c.id = chosen.character_id
       WHERE c.campaign_id = ?
       ORDER BY chosen.character_id, chosen.application_order`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT c.id AS characterId,
              trait.id AS traitId,
              trait.name,
              trait.rules_text AS rulesText,
              trait.position,
              trait.parameters,
              trait.effects
       FROM characters c
       JOIN dnd35_characters d ON d.character_id = c.id
       JOIN dnd35_race_traits trait ON trait.race_id = d.race_id
       WHERE c.campaign_id = ?
       ORDER BY c.id, trait.position, trait.id`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT gained.character_id AS characterId,
              gained.character_level AS gainedAtCharacterLevel,
              gained.track,
              class.name AS className,
              feature.id AS classFeatureId,
              feature.name,
              feature.slug,
              feature.description,
              COALESCE(grant.rules_text, feature.rules_text) AS rulesText,
              feature.choice_kind AS choiceKind,
              grant.parameters
       FROM dnd35_character_class_levels gained
       JOIN dnd35_class_levels level ON level.id = gained.class_level_id
       JOIN dnd35_classes class ON class.id = level.class_id
       JOIN dnd35_class_feature_grants grant ON grant.class_level_id = level.id
       JOIN dnd35_class_features feature ON feature.id = grant.class_feature_id
       JOIN characters c ON c.id = gained.character_id
       WHERE c.campaign_id = ?
       ORDER BY gained.character_id, gained.track, gained.character_level, feature.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT book.character_id AS characterId,
              book.id AS spellbookId,
              book.name,
              book.inventory_id AS inventoryId,
              spell.id AS spellId,
              spell.name AS spellName,
              copied.pages
       FROM dnd35_character_spellbooks book
       JOIN characters c ON c.id = book.character_id
       LEFT JOIN dnd35_character_spellbook_spells copied ON copied.spellbook_id = book.id
       LEFT JOIN dnd35_spells spell ON spell.id = copied.spell_id
       WHERE c.campaign_id = ?
       ORDER BY book.character_id, book.name, spell.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT track.character_id AS characterId,
              chosen.casting_track_id AS castingTrackId,
              chosen.spell_id AS spellId,
              spell.name,
              spell.slug,
              chosen.access_kind AS accessKind,
              chosen.gained_at_level AS gainedAtLevel,
              chosen.notes
       FROM dnd35_character_spells chosen
       JOIN dnd35_character_casting_tracks track ON track.id = chosen.casting_track_id
       JOIN dnd35_spells spell ON spell.id = chosen.spell_id
       JOIN characters c ON c.id = track.character_id
       WHERE c.campaign_id = ?
       ORDER BY track.character_id, chosen.casting_track_id, spell.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT track.character_id AS characterId,
              prep.id AS preparationId,
              prep.casting_track_id AS castingTrackId,
              prep.spell_id AS spellId,
              spell.name,
              prep.domain_id AS domainId,
              prep.slot_level AS slotLevel,
              prep.prepared_count AS preparedCount,
              prep.expended_count AS expendedCount,
              prep.preparation_key AS preparationKey
       FROM dnd35_character_spell_preparations prep
       JOIN dnd35_character_casting_tracks track ON track.id = prep.casting_track_id
       JOIN dnd35_spells spell ON spell.id = prep.spell_id
       JOIN characters c ON c.id = track.character_id
       WHERE c.campaign_id = ?
       ORDER BY track.character_id, prep.casting_track_id, prep.slot_level, spell.name`,
      campaignId,
    ),
    rows<Record<string, unknown> & { characterId: string }>(
      binding,
      `SELECT track.character_id AS characterId,
              chosen.casting_track_id AS castingTrackId,
              chosen.power_id AS powerId,
              power.name,
              power.slug,
              chosen.access_kind AS accessKind,
              chosen.gained_at_level AS gainedAtLevel,
              chosen.notes
       FROM dnd35_character_powers chosen
       JOIN dnd35_character_casting_tracks track ON track.id = chosen.casting_track_id
       JOIN dnd35_powers power ON power.id = chosen.power_id
       JOIN characters c ON c.id = track.character_id
       WHERE c.campaign_id = ?
       ORDER BY track.character_id, chosen.casting_track_id, power.name`,
      campaignId,
    ),
    rows<{
      characterId: string;
      lawChaosScore: number;
      goodEvilScore: number;
      lastReason: string | null;
    }>(
      binding,
      `SELECT state.character_id AS characterId,
              state.law_chaos_score AS lawChaosScore,
              state.good_evil_score AS goodEvilScore,
              state.last_reason AS lastReason
       FROM runtime_dnd35_alignment_states state
       JOIN characters c ON c.id = state.character_id
       WHERE c.campaign_id = ?`,
      campaignId,
    ),
  ]);

  for (const row of featRows) row["choices"] = safeJsonValue(row["choices"]);
  for (const row of raceTraitRows) {
    row["parameters"] = safeJsonValue(row["parameters"]);
    row["effects"] = safeJsonValue(row["effects"]);
  }
  for (const row of classFeatureRows) row["parameters"] = safeJsonValue(row["parameters"]);

  const grouped = {
    abilities: groupByCharacter(abilityRows),
    classes: groupByCharacter(classRows),
    racialHitDice: groupByCharacter(racialHitDiceRows),
    increases: groupByCharacter(increaseRows),
    skills: groupByCharacter(skillRows),
    feats: groupByCharacter(featRows),
    inventory: groupByCharacter(inventoryRows),
    languages: groupByCharacter(languageRows),
    domains: groupByCharacter(domainRows),
    templates: groupByCharacter(templateRows),
    raceTraits: groupByCharacter(raceTraitRows),
    classFeatures: groupByCharacter(classFeatureRows),
    spellbooks: groupByCharacter(spellbookRows),
    spells: groupByCharacter(knownSpellRows),
    preparations: groupByCharacter(preparationRows),
    powers: groupByCharacter(knownPowerRows),
  };
  const alignmentByCharacter = new Map(alignmentRows.map((row) => [row.characterId, row]));
  const db = createDatabase(binding);

  return Promise.all(
    characters.map(async (row): Promise<DmCampaignCharacterProfile> => {
      const metadata = safeObject(row.metadata);
      const [sheet, casting] = await Promise.all([
        row.status === "active"
          ? loadCharacterSheetSnapshot({ db, campaignId, characterId: row.id }).catch(() => null)
          : Promise.resolve(null),
        row.status === "active"
          ? getCharacterCastingState(
              { db, binding },
              { campaignId, characterId: row.id },
            ).catch(() => null)
          : Promise.resolve(null),
      ]);
      const alignmentState = alignmentByCharacter.get(row.id) ?? null;

      return {
        character: {
          id: row.id,
          actorId: row.actorId,
          ownerUserId: row.ownerUserId,
          name: row.name,
          status: row.status,
          rulesetId: row.rulesetId,
          rulesetVersion: row.rulesetVersion,
          pronouns: typeof metadata["pronouns"] === "string" ? metadata["pronouns"] : null,
          playerNotes:
            typeof metadata["playerNotes"] === "string" ? metadata["playerNotes"] : "",
          metadata,
        },
        dnd35: {
          race:
            row.raceId && row.raceName && row.raceSize && row.raceBaseSpeedFeet !== null
              ? {
                  id: row.raceId,
                  name: row.raceName,
                  size: row.raceSize,
                  baseSpeedFeet: row.raceBaseSpeedFeet,
                  racialHitDice: row.raceRacialHitDice ?? 0,
                  racialHitDie: row.raceRacialHitDie,
                  levelAdjustment: row.raceLevelAdjustment ?? 0,
                }
              : null,
          deity: row.deityId && row.deityName ? { id: row.deityId, name: row.deityName } : null,
          alignment: row.alignment,
          experiencePoints: row.experiencePoints,
          progressionMode: row.progressionMode,
          sizeOverride: row.sizeOverride,
          levelAdjustmentOverride: row.levelAdjustmentOverride,
          stable: row.stable === 1,
          encumbranceEnabled: row.encumbranceEnabled === 1,
          powerPointsSpent: row.powerPointsSpent,
        },
        sheet,
        abilityBreakdown: grouped.abilities.get(row.id) ?? [],
        classLevels: grouped.classes.get(row.id) ?? [],
        racialHitDice: grouped.racialHitDice.get(row.id) ?? [],
        abilityIncreases: grouped.increases.get(row.id) ?? [],
        skills: grouped.skills.get(row.id) ?? [],
        feats: grouped.feats.get(row.id) ?? [],
        inventory: grouped.inventory.get(row.id) ?? [],
        languages: grouped.languages.get(row.id) ?? [],
        domains: grouped.domains.get(row.id) ?? [],
        templates: grouped.templates.get(row.id) ?? [],
        raceTraits: grouped.raceTraits.get(row.id) ?? [],
        classFeatures: grouped.classFeatures.get(row.id) ?? [],
        spellbooks: grouped.spellbooks.get(row.id) ?? [],
        knownSpells: grouped.spells.get(row.id) ?? [],
        spellPreparations: grouped.preparations.get(row.id) ?? [],
        knownPowers: grouped.powers.get(row.id) ?? [],
        casting,
        alignmentState: alignmentState
          ? {
              lawChaosScore: alignmentState.lawChaosScore,
              goodEvilScore: alignmentState.goodEvilScore,
              lastReason: alignmentState.lastReason,
            }
          : null,
      };
    }),
  );
}

/** Stable prompt serialization kept separate so tests can assert no party member is silently omitted. */
export function serializeDmCampaignCharacterProfiles(
  profiles: readonly DmCampaignCharacterProfile[],
): string {
  return JSON.stringify(profiles);
}
