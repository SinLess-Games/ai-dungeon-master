import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { spells } from "./spell";
import { classes } from "./class";

export const spellClassLevels = sqliteTable(
  "dnd35_spell_class_levels",
  {
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    spellLevel: integer("spell_level").notNull(),
  },
  (t) => [
    check(
      "dnd35_spell_class_levels_spell_level_integer",
      sql`${t.spellLevel} is null or typeof(${t.spellLevel}) = 'integer'`,
    ),
    primaryKey({ columns: [t.spellId, t.classId] }),
    check("dnd35_spell_class_levels_level_valid", sql`${t.spellLevel} between 0 and 9`),
    index("dnd35_spell_class_levels_list_idx").on(t.classId, t.spellLevel),
  ],
);
export type SpellClassLevel = typeof spellClassLevels.$inferSelect;
export type NewSpellClassLevel = typeof spellClassLevels.$inferInsert;
