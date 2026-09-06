import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonEmpty, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { spellSchools } from "./spellSchool";
import { actionTypes, saveKeys } from "./primitives";
import type { PrerequisiteExpression } from "./prerequisite";

export const spells = sqliteTable(
  "dnd35_spells",
  {
    ...contentColumns(),
    schoolId: text("school_id")
      .notNull()
      .references(() => spellSchools.id, { onDelete: "restrict" }),
    subschool: text("subschool"),
    castingTime: text("casting_time").notNull(),
    actionType: text("action_type", { enum: actionTypes }),
    rangeText: text("range_text").notNull(),
    targetText: text("target_text"),
    areaText: text("area_text"),
    effectText: text("effect_text"),
    durationText: text("duration_text").notNull(),
    savingThrowText: text("saving_throw_text"),
    save: text("save", { enum: saveKeys }),
    spellResistance: text("spell_resistance", { enum: ["yes", "no", "conditional"] }).notNull(),
    spellResistanceText: text("spell_resistance_text"),
  },
  (t) => [
    ...contentChecks("dnd35_spells", t),
    index("dnd35_spells_school_idx").on(t.schoolId),
    enumCheck("dnd35_spells_action_valid", t.actionType, actionTypes),
    enumCheck("dnd35_spells_save_valid", t.save, saveKeys),
    enumCheck("dnd35_spells_resistance_valid", t.spellResistance, ["yes", "no", "conditional"]),
    nonEmpty("dnd35_spells_casting_time_nonempty", t.castingTime),
    nonEmpty("dnd35_spells_range_nonempty", t.rangeText),
    nonEmpty("dnd35_spells_duration_nonempty", t.durationText),
  ],
);
export type Spell = typeof spells.$inferSelect;
export type NewSpell = typeof spells.$inferInsert;
export const spellPrerequisites = sqliteTable(
  "dnd35_spell_prerequisites",
  {
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    expression: text("expression", { mode: "json" }).$type<PrerequisiteExpression>().notNull(),
    explanation: text("explanation"),
  },
  (t) => [
    primaryKey({ columns: [t.spellId] }),
    jsonCheck("dnd35_spell_prerequisites_json", t.expression),
  ],
);
export type SpellPrerequisite = typeof spellPrerequisites.$inferSelect;
export type NewSpellPrerequisite = typeof spellPrerequisites.$inferInsert;
