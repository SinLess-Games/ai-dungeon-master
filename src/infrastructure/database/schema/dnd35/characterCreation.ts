import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { dnd35Characters } from "./character";
import { characterClassLevels } from "./characterClassLevel";
import { classes } from "./class";
import { classFeatures } from "./classFeature";
import { monsters } from "./monster";
import type { JsonValue } from "./primitives";
import { enumCheck, jsonCheck, nonNegative, positive, timestamps, uuid } from "./schemaUtils";

/** Source-backed starting-wealth formula for a class. Values are kept as dice, not pre-rolled money. */
export const classStartingWealth = sqliteTable(
  "dnd35_class_starting_wealth",
  {
    classId: text("class_id")
      .primaryKey()
      .references(() => classes.id, { onDelete: "cascade" }),
    diceCount: integer("dice_count").notNull(),
    dieSides: integer("die_sides").notNull(),
    multiplierGp: integer("multiplier_gp").notNull().default(1),
  },
  (t) => [
    check(
      "dnd35_class_starting_wealth_dice_count_integer",
      sql`typeof(${t.diceCount}) = 'integer'`,
    ),
    check(
      "dnd35_class_starting_wealth_die_sides_integer",
      sql`typeof(${t.dieSides}) = 'integer'`,
    ),
    check(
      "dnd35_class_starting_wealth_multiplier_integer",
      sql`typeof(${t.multiplierGp}) = 'integer'`,
    ),
    positive("dnd35_class_starting_wealth_dice_count_valid", t.diceCount),
    positive("dnd35_class_starting_wealth_die_sides_valid", t.dieSides),
    positive("dnd35_class_starting_wealth_multiplier_valid", t.multiplierGp),
  ],
);
export type ClassStartingWealth = typeof classStartingWealth.$inferSelect;
export type NewClassStartingWealth = typeof classStartingWealth.$inferInsert;

/** Character money. Starting/spent values retain creation audit data; currentCopper may later grow. */
export const characterWealth = sqliteTable(
  "dnd35_character_wealth",
  {
    characterId: text("character_id")
      .primaryKey()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    startingWealthCopper: integer("starting_wealth_copper"),
    currentCopper: integer("current_copper").notNull().default(0),
    equipmentSpentCopper: integer("equipment_spent_copper").notNull().default(0),
    rollResults: text("roll_results", { mode: "json" }).$type<number[]>(),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_wealth_start_integer",
      sql`${t.startingWealthCopper} is null or typeof(${t.startingWealthCopper}) = 'integer'`,
    ),
    check(
      "dnd35_character_wealth_current_integer",
      sql`typeof(${t.currentCopper}) = 'integer'`,
    ),
    check(
      "dnd35_character_wealth_spent_integer",
      sql`typeof(${t.equipmentSpentCopper}) = 'integer'`,
    ),
    nonNegative("dnd35_character_wealth_start_valid", t.startingWealthCopper),
    nonNegative("dnd35_character_wealth_current_valid", t.currentCopper),
    nonNegative("dnd35_character_wealth_spent_valid", t.equipmentSpentCopper),
    jsonCheck("dnd35_character_wealth_roll_results_json", t.rollResults, "array"),
  ],
);
export type CharacterWealth = typeof characterWealth.$inferSelect;
export type NewCharacterWealth = typeof characterWealth.$inferInsert;

export const creationChoiceKinds = [
  "feat",
  "language",
  "domain",
  "deity",
  "spell",
  "power",
  "school",
  "creature_type",
  "companion",
  "familiar",
  "skill",
  "weapon",
  "other",
] as const;
export type CreationChoiceKind = (typeof creationChoiceKinds)[number];

/**
 * Persistent answer to a class/race creation decision that does not already have a dedicated
 * relational table. Dedicated selections (feats, languages, domains, spells, powers, inventory)
 * stay in their authoritative tables and may optionally be mirrored here only when a class
 * feature needs a named choice slot.
 */
export const characterCreationChoices = sqliteTable(
  "dnd35_character_creation_choices",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    characterClassLevelId: text("character_class_level_id").references(
      () => characterClassLevels.id,
      { onDelete: "cascade" },
    ),
    classFeatureId: text("class_feature_id").references(() => classFeatures.id, {
      onDelete: "restrict",
    }),
    choiceKey: text("choice_key").notNull(),
    kind: text("kind", { enum: creationChoiceKinds }).notNull(),
    contentId: text("content_id"),
    valueText: text("value_text"),
    parameters: text("parameters", { mode: "json" }).$type<Record<string, JsonValue>>(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("dnd35_character_creation_choices_slot_uq").on(
      t.characterId,
      t.classFeatureId,
      t.choiceKey,
    ),
    uniqueIndex("dnd35_character_creation_choices_generic_slot_uq")
      .on(t.characterId, t.choiceKey)
      .where(sql`${t.classFeatureId} is null`),
    index("dnd35_character_creation_choices_character_idx").on(t.characterId),
    enumCheck("dnd35_character_creation_choices_kind_valid", t.kind, creationChoiceKinds),
    check(
      "dnd35_character_creation_choices_key_nonempty",
      sql`length(trim(${t.choiceKey})) > 0`,
    ),
    check(
      "dnd35_character_creation_choices_value_present",
      sql`${t.contentId} is not null or ${t.valueText} is not null or ${t.parameters} is not null`,
    ),
    jsonCheck("dnd35_character_creation_choices_parameters_json", t.parameters),
  ],
);
export type CharacterCreationChoice = typeof characterCreationChoices.$inferSelect;
export type NewCharacterCreationChoice = typeof characterCreationChoices.$inferInsert;

/** A chosen familiar/companion is first-class state, even before a runtime actor exists. */
export const characterCompanions = sqliteTable(
  "dnd35_character_companions",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    classFeatureId: text("class_feature_id")
      .notNull()
      .references(() => classFeatures.id, { onDelete: "restrict" }),
    kind: text("kind", {
      enum: ["familiar", "animal_companion", "special_mount", "other"],
    }).notNull(),
    monsterId: text("monster_id").references(() => monsters.id, { onDelete: "restrict" }),
    creatureName: text("creature_name").notNull(),
    name: text("name"),
    details: text("details", { mode: "json" }).$type<Record<string, JsonValue>>(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("dnd35_character_companions_feature_uq").on(t.characterId, t.classFeatureId),
    index("dnd35_character_companions_character_idx").on(t.characterId),
    enumCheck("dnd35_character_companions_kind_valid", t.kind, [
      "familiar",
      "animal_companion",
      "special_mount",
      "other",
    ]),
    check(
      "dnd35_character_companions_creature_nonempty",
      sql`length(trim(${t.creatureName})) > 0`,
    ),
    jsonCheck("dnd35_character_companions_details_json", t.details),
  ],
);
export type CharacterCompanion = typeof characterCompanions.$inferSelect;
export type NewCharacterCompanion = typeof characterCompanions.$inferInsert;
