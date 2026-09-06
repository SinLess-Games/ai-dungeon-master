import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { spells } from "./spell";
import { domains } from "./domain";

export const spellDomainLevels = sqliteTable(
  "dnd35_spell_domain_levels",
  {
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    spellLevel: integer("spell_level").notNull(),
  },
  (t) => [
    check(
      "dnd35_spell_domain_levels_spell_level_integer",
      sql`${t.spellLevel} is null or typeof(${t.spellLevel}) = 'integer'`,
    ),
    primaryKey({ columns: [t.spellId, t.domainId] }),
    check("dnd35_spell_domain_levels_level_valid", sql`${t.spellLevel} between 1 and 9`),
    uniqueIndex("dnd35_spell_domain_levels_slot_uq").on(t.domainId, t.spellLevel),
  ],
);
export type SpellDomainLevel = typeof spellDomainLevels.$inferSelect;
export type NewSpellDomainLevel = typeof spellDomainLevels.$inferInsert;
