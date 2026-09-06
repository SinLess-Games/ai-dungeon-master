import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuid, enumCheck, nonNegative, booleanCheck } from "./schemaUtils";
import { spells } from "./spell";

export const spellComponentCodes = ["V", "S", "M", "F", "DF", "XP"] as const;
export type SpellComponentCode = (typeof spellComponentCodes)[number];
export const spellComponents = sqliteTable(
  "dnd35_spell_components",
  {
    id: uuid(),
    spellId: text("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    code: text("code", { enum: spellComponentCodes }).notNull(),
    /** Empty group means required; alternatives with the same nonempty group are ORed (M/DF). */
    alternativeGroup: text("alternative_group").notNull().default(""),
    description: text("description"),
    costCopper: integer("cost_copper"),
    xpCost: integer("xp_cost"),
    isConsumed: integer("is_consumed", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    check(
      "dnd35_spell_components_cost_copper_integer",
      sql`${t.costCopper} is null or typeof(${t.costCopper}) = 'integer'`,
    ),
    check(
      "dnd35_spell_components_xp_cost_integer",
      sql`${t.xpCost} is null or typeof(${t.xpCost}) = 'integer'`,
    ),
    check(
      "dnd35_spell_components_is_consumed_integer",
      sql`${t.isConsumed} is null or typeof(${t.isConsumed}) = 'integer'`,
    ),
    uniqueIndex("dnd35_spell_components_code_group_uq").on(t.spellId, t.code, t.alternativeGroup),
    enumCheck("dnd35_spell_components_code_valid", t.code, spellComponentCodes),
    nonNegative("dnd35_spell_components_cost_valid", t.costCopper),
    nonNegative("dnd35_spell_components_xp_valid", t.xpCost),
    booleanCheck("dnd35_spell_components_consumed_bool", t.isConsumed),
    check("dnd35_spell_components_xp_kind_valid", sql`${t.xpCost} is null or ${t.code} = 'XP'`),
    check(
      "dnd35_spell_components_cost_kind_valid",
      sql`${t.costCopper} is null or ${t.code} in ('M', 'F', 'DF')`,
    ),
  ],
);
export type SpellComponent = typeof spellComponents.$inferSelect;
export type NewSpellComponent = typeof spellComponents.$inferInsert;
