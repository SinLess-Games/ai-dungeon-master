import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { contentColumns, contentChecks } from "./contentReference";

export const spellSchools = sqliteTable(
  "dnd35_spell_schools",
  {
    ...contentColumns(),
    specializationText: text("specialization_text"),
  },
  (t) => [...contentChecks("dnd35_spell_schools", t)],
);
export type SpellSchool = typeof spellSchools.$inferSelect;
export type NewSpellSchool = typeof spellSchools.$inferInsert;
