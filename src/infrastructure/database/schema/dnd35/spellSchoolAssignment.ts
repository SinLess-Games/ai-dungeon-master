import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { spells } from "./spell";
import { spellSchools } from "./spellSchool";

/**
 * Complete school membership for a spell.
 *
 * dnd35_spells.school_id remains the primary/compatibility school for existing
 * runtime code. This table preserves every school for dual-school spells such
 * as those introduced by Player's Handbook II.
 */
export const spellSchoolAssignments = sqliteTable(
  "dnd35_spell_school_assignments",
  {
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => spellSchools.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.spellId, t.schoolId] }),
    index("dnd35_spell_school_assignments_school_idx").on(t.schoolId),
  ],
);

export type SpellSchoolAssignment = typeof spellSchoolAssignments.$inferSelect;
export type NewSpellSchoolAssignment = typeof spellSchoolAssignments.$inferInsert;
