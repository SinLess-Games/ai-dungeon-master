import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { dnd35Characters } from "./character";
import { booleanCheck, timestamps } from "./schemaUtils";

/**
 * A zero-choice step still has to be explicitly completed. These flags distinguish
 * "the player chose none" from "the player has not visited this step yet" and let
 * the server enforce a complete character-creation workflow without UI assumptions.
 */
export const characterCreationProgress = sqliteTable(
  "dnd35_character_creation_progress",
  {
    characterId: text("character_id")
      .primaryKey()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    skillsFinalized: integer("skills_finalized", { mode: "boolean" }).notNull().default(false),
    featsFinalized: integer("feats_finalized", { mode: "boolean" }).notNull().default(false),
    languagesFinalized: integer("languages_finalized", { mode: "boolean" }).notNull().default(false),
    wealthFinalized: integer("wealth_finalized", { mode: "boolean" }).notNull().default(false),
    equipmentFinalized: integer("equipment_finalized", { mode: "boolean" }).notNull().default(false),
    spellsFinalized: integer("spells_finalized", { mode: "boolean" }).notNull().default(false),
    powersFinalized: integer("powers_finalized", { mode: "boolean" }).notNull().default(false),
    divineFinalized: integer("divine_finalized", { mode: "boolean" }).notNull().default(false),
    companionsFinalized: integer("companions_finalized", { mode: "boolean" }).notNull().default(false),
    classChoicesFinalized: integer("class_choices_finalized", { mode: "boolean" }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    booleanCheck("dnd35_character_creation_progress_skills_bool", t.skillsFinalized),
    booleanCheck("dnd35_character_creation_progress_feats_bool", t.featsFinalized),
    booleanCheck("dnd35_character_creation_progress_languages_bool", t.languagesFinalized),
    booleanCheck("dnd35_character_creation_progress_wealth_bool", t.wealthFinalized),
    booleanCheck("dnd35_character_creation_progress_equipment_bool", t.equipmentFinalized),
    booleanCheck("dnd35_character_creation_progress_spells_bool", t.spellsFinalized),
    booleanCheck("dnd35_character_creation_progress_powers_bool", t.powersFinalized),
    booleanCheck("dnd35_character_creation_progress_divine_bool", t.divineFinalized),
    booleanCheck("dnd35_character_creation_progress_companions_bool", t.companionsFinalized),
    booleanCheck("dnd35_character_creation_progress_class_choices_bool", t.classChoicesFinalized),
  ],
);
export type CharacterCreationProgress = typeof characterCreationProgress.$inferSelect;
export type NewCharacterCreationProgress = typeof characterCreationProgress.$inferInsert;
