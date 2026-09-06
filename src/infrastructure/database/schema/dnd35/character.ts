import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { timestamps, enumCheck, nonEmpty, nonNegative, booleanCheck } from "./schemaUtils";
import { races } from "./race";
import { deities } from "./deity";
import { domains } from "./domain";
import { languages } from "./language";
import { templates } from "./template";
import { alignments, sizes } from "./primitives";

/** D&D extension only. The generic character module supplies characterId.
 * No generic character table currently exists, so there is deliberately no fake FK,
 * UUID default, name, portrait, campaign membership, or duplicate auth ownership.
 * Generic deletion must delete this extension; all owned state cascades from it. */
export const dnd35Characters = sqliteTable(
  "dnd35_characters",
  {
    characterId: text("character_id").primaryKey().notNull(),
    raceId: text("race_id").references(() => races.id, { onDelete: "restrict" }),
    deityId: text("deity_id").references(() => deities.id, { onDelete: "restrict" }),
    experiencePoints: integer("experience_points").notNull().default(0),
    alignment: text("alignment", { enum: alignments }).notNull().default("N"),
    /** Permanent overrides only; temporary transformations belong to conditions. */
    sizeOverride: text("size_override", { enum: sizes }),
    levelAdjustmentOverride: integer("level_adjustment_override"),
    currentHitPoints: integer("current_hit_points").notNull().default(0),
    temporaryHitPoints: integer("temporary_hit_points").notNull().default(0),
    nonlethalDamage: integer("nonlethal_damage").notNull().default(0),
    /** Shared power-point expenditure; maximum is derived from progression and abilities. */
    powerPointsSpent: integer("power_points_spent").notNull().default(0),
    progressionMode: text("progression_mode", { enum: ["standard", "gestalt"] })
      .notNull()
      .default("standard"),
    encumbranceEnabled: integer("encumbrance_enabled", { mode: "boolean" }).notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_characters_experience_points_integer",
      sql`${t.experiencePoints} is null or typeof(${t.experiencePoints}) = 'integer'`,
    ),
    check(
      "dnd35_characters_level_adjustment_override_integer",
      sql`${t.levelAdjustmentOverride} is null or typeof(${t.levelAdjustmentOverride}) = 'integer'`,
    ),
    check(
      "dnd35_characters_current_hit_points_integer",
      sql`${t.currentHitPoints} is null or typeof(${t.currentHitPoints}) = 'integer'`,
    ),
    check(
      "dnd35_characters_temporary_hit_points_integer",
      sql`${t.temporaryHitPoints} is null or typeof(${t.temporaryHitPoints}) = 'integer'`,
    ),
    check(
      "dnd35_characters_nonlethal_damage_integer",
      sql`${t.nonlethalDamage} is null or typeof(${t.nonlethalDamage}) = 'integer'`,
    ),
    check(
      "dnd35_characters_power_points_spent_integer",
      sql`${t.powerPointsSpent} is null or typeof(${t.powerPointsSpent}) = 'integer'`,
    ),
    check(
      "dnd35_characters_encumbrance_enabled_integer",
      sql`${t.encumbranceEnabled} is null or typeof(${t.encumbranceEnabled}) = 'integer'`,
    ),
    nonEmpty("dnd35_characters_id_nonempty", t.characterId),
    index("dnd35_characters_race_idx").on(t.raceId),
    nonNegative("dnd35_characters_xp_valid", t.experiencePoints),
    enumCheck("dnd35_characters_alignment_valid", t.alignment, alignments),
    enumCheck("dnd35_characters_size_valid", t.sizeOverride, sizes),
    nonNegative("dnd35_characters_la_valid", t.levelAdjustmentOverride),
    nonNegative("dnd35_characters_temp_hp_valid", t.temporaryHitPoints),
    nonNegative("dnd35_characters_nonlethal_valid", t.nonlethalDamage),
    nonNegative("dnd35_characters_pp_valid", t.powerPointsSpent),
    enumCheck("dnd35_characters_progression_valid", t.progressionMode, ["standard", "gestalt"]),
    booleanCheck("dnd35_characters_encumbrance_bool", t.encumbranceEnabled),
  ],
);
export type Dnd35Character = typeof dnd35Characters.$inferSelect;
export type NewDnd35Character = typeof dnd35Characters.$inferInsert;
export const characterDomains = sqliteTable(
  "dnd35_character_domains",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.domainId] })],
);
export type CharacterDomain = typeof characterDomains.$inferSelect;
export type NewCharacterDomain = typeof characterDomains.$inferInsert;
export const characterLanguages = sqliteTable(
  "dnd35_character_languages",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    languageId: text("language_id")
      .notNull()
      .references(() => languages.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.languageId] })],
);
export type CharacterLanguage = typeof characterLanguages.$inferSelect;
export type NewCharacterLanguage = typeof characterLanguages.$inferInsert;
export const characterTemplates = sqliteTable(
  "dnd35_character_templates",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    applicationOrder: integer("application_order").notNull(),
  },
  (t) => [
    check(
      "dnd35_character_templates_application_order_integer",
      sql`${t.applicationOrder} is null or typeof(${t.applicationOrder}) = 'integer'`,
    ),
    primaryKey({ columns: [t.characterId, t.templateId] }),
    uniqueIndex("dnd35_character_templates_order_uq").on(t.characterId, t.applicationOrder),
    nonNegative("dnd35_character_templates_order_valid", t.applicationOrder),
  ],
);
export type CharacterTemplate = typeof characterTemplates.$inferSelect;
export type NewCharacterTemplate = typeof characterTemplates.$inferInsert;
