import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { uuid, enumCheck, nonEmpty, nonNegative, positive } from "./schemaUtils";
import { classes } from "./class";
import { classLevels } from "./classLevel";
import { abilityKeys } from "./primitives";

export const classSpellcasting = sqliteTable(
  "dnd35_class_spellcasting",
  {
    id: uuid(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    spellListClassId: text("spell_list_class_id").references(() => classes.id, {
      onDelete: "restrict",
    }),
    trackKey: text("track_key").notNull().default("primary"),
    tradition: text("tradition", { enum: ["arcane", "divine", "psionic", "other"] }).notNull(),
    castingMode: text("casting_mode", {
      enum: ["prepared", "spontaneous", "psionic", "other"],
    }).notNull(),
    castingAbility: text("casting_ability", { enum: abilityKeys }).notNull(),
    listBehavior: text("list_behavior", { enum: ["own", "shared", "selected", "advance_existing"] })
      .notNull()
      .default("own"),
    knownBehavior: text("known_behavior", {
      enum: ["all_list", "limited", "spellbook", "none", "other"],
    }).notNull(),
    casterLevelNumerator: integer("caster_level_numerator").notNull().default(1),
    casterLevelDenominator: integer("caster_level_denominator").notNull().default(1),
    progressionKey: text("progression_key").notNull(),
    rulesText: text("rules_text"),
  },
  (t) => [
    check(
      "dnd35_class_spellcasting_caster_level_numerator_integer",
      sql`${t.casterLevelNumerator} is null or typeof(${t.casterLevelNumerator}) = 'integer'`,
    ),
    check(
      "dnd35_class_spellcasting_caster_level_denominator_integer",
      sql`${t.casterLevelDenominator} is null or typeof(${t.casterLevelDenominator}) = 'integer'`,
    ),
    uniqueIndex("dnd35_class_spellcasting_track_uq").on(t.classId, t.trackKey),
    nonEmpty("dnd35_class_spellcasting_track_nonempty", t.trackKey),
    nonEmpty("dnd35_class_spellcasting_progression_nonempty", t.progressionKey),
    enumCheck("dnd35_class_spellcasting_tradition_valid", t.tradition, [
      "arcane",
      "divine",
      "psionic",
      "other",
    ]),
    enumCheck("dnd35_class_spellcasting_mode_valid", t.castingMode, [
      "prepared",
      "spontaneous",
      "psionic",
      "other",
    ]),
    enumCheck("dnd35_class_spellcasting_ability_valid", t.castingAbility, abilityKeys),
    enumCheck("dnd35_class_spellcasting_list_valid", t.listBehavior, [
      "own",
      "shared",
      "selected",
      "advance_existing",
    ]),
    enumCheck("dnd35_class_spellcasting_known_valid", t.knownBehavior, [
      "all_list",
      "limited",
      "spellbook",
      "none",
      "other",
    ]),
    positive("dnd35_class_spellcasting_numerator_valid", t.casterLevelNumerator),
    positive("dnd35_class_spellcasting_denominator_valid", t.casterLevelDenominator),
    check(
      "dnd35_class_spellcasting_shared_list_present",
      sql`${t.listBehavior} != 'shared' or ${t.spellListClassId} is not null`,
    ),
  ],
);
export type ClassSpellcasting = typeof classSpellcasting.$inferSelect;
export type NewClassSpellcasting = typeof classSpellcasting.$inferInsert;
export const classSpellcastingProgression = sqliteTable(
  "dnd35_class_spellcasting_progression",
  {
    classId: text("class_id").notNull(),
    trackKey: text("track_key").notNull(),
    classLevel: integer("class_level").notNull(),
    spellLevel: integer("spell_level").notNull(),
    /** NULL: no access; 0: bonus slots only. Known NULL means no fixed known limit. */
    slotsPerDay: integer("slots_per_day"),
    spellsKnown: integer("spells_known"),
  },
  (t) => [
    check(
      "dnd35_class_spellcasting_progression_class_level_integer",
      sql`${t.classLevel} is null or typeof(${t.classLevel}) = 'integer'`,
    ),
    check(
      "dnd35_class_spellcasting_progression_spell_level_integer",
      sql`${t.spellLevel} is null or typeof(${t.spellLevel}) = 'integer'`,
    ),
    check(
      "dnd35_class_spellcasting_progression_slots_per_day_integer",
      sql`${t.slotsPerDay} is null or typeof(${t.slotsPerDay}) = 'integer'`,
    ),
    check(
      "dnd35_class_spellcasting_progression_spells_known_integer",
      sql`${t.spellsKnown} is null or typeof(${t.spellsKnown}) = 'integer'`,
    ),
    primaryKey({ columns: [t.classId, t.trackKey, t.classLevel, t.spellLevel] }),
    foreignKey({
      columns: [t.classId, t.trackKey],
      foreignColumns: [classSpellcasting.classId, classSpellcasting.trackKey],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.classId, t.classLevel],
      foreignColumns: [classLevels.classId, classLevels.level],
    }).onDelete("cascade"),
    check("dnd35_casting_progression_level_valid", sql`${t.spellLevel} between 0 and 9`),
    nonNegative("dnd35_casting_progression_slots_valid", t.slotsPerDay),
    nonNegative("dnd35_casting_progression_known_valid", t.spellsKnown),
  ],
);
export type ClassSpellcastingProgression = typeof classSpellcastingProgression.$inferSelect;
export type NewClassSpellcastingProgression = typeof classSpellcastingProgression.$inferInsert;
export const classCastingAdvancements = sqliteTable(
  "dnd35_class_casting_advancements",
  {
    id: uuid(),
    classLevelId: text("class_level_id")
      .notNull()
      .references(() => classLevels.id, { onDelete: "cascade" }),
    /** The character chooses an eligible prior casting track; e.g. two rows for dual progression. */
    selectionKey: text("selection_key").notNull(),
    tradition: text("tradition", {
      enum: ["arcane", "divine", "psionic", "other", "any"],
    }).notNull(),
    levelsAdvanced: integer("levels_advanced").notNull().default(1),
    rulesText: text("rules_text"),
  },
  (t) => [
    check(
      "dnd35_class_casting_advancements_levels_advanced_integer",
      sql`${t.levelsAdvanced} is null or typeof(${t.levelsAdvanced}) = 'integer'`,
    ),
    uniqueIndex("dnd35_casting_advancement_selection_uq").on(t.classLevelId, t.selectionKey),
    nonEmpty("dnd35_casting_advancement_key_nonempty", t.selectionKey),
    positive("dnd35_casting_advancement_levels_valid", t.levelsAdvanced),
    enumCheck("dnd35_casting_advancement_tradition_valid", t.tradition, [
      "arcane",
      "divine",
      "psionic",
      "other",
      "any",
    ]),
  ],
);
export type ClassCastingAdvancement = typeof classCastingAdvancements.$inferSelect;
export type NewClassCastingAdvancement = typeof classCastingAdvancements.$inferInsert;
