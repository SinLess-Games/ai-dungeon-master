import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative } from "./schemaUtils";
import { items } from "./item";

export const shields = sqliteTable(
  "dnd35_shields",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    category: text("category", { enum: ["buckler", "light", "heavy", "tower", "other"] }).notNull(),
    acBonus: integer("ac_bonus").notNull(),
    maxDexBonus: integer("max_dex_bonus"),
    armorCheckPenalty: integer("armor_check_penalty").notNull().default(0),
    arcaneSpellFailurePercent: integer("arcane_spell_failure_percent").notNull().default(0),
    speedAt30Feet: integer("speed_at_30_feet"),
    speedAt20Feet: integer("speed_at_20_feet"),
    specialText: text("special_text"),
  },
  (t) => [
    check(
      "dnd35_shields_ac_bonus_integer",
      sql`${t.acBonus} is null or typeof(${t.acBonus}) = 'integer'`,
    ),
    check(
      "dnd35_shields_max_dex_bonus_integer",
      sql`${t.maxDexBonus} is null or typeof(${t.maxDexBonus}) = 'integer'`,
    ),
    check(
      "dnd35_shields_armor_check_penalty_integer",
      sql`${t.armorCheckPenalty} is null or typeof(${t.armorCheckPenalty}) = 'integer'`,
    ),
    check(
      "dnd35_shields_arcane_spell_failure_percent_integer",
      sql`${t.arcaneSpellFailurePercent} is null or typeof(${t.arcaneSpellFailurePercent}) = 'integer'`,
    ),
    check(
      "dnd35_shields_speed_at_30_feet_integer",
      sql`${t.speedAt30Feet} is null or typeof(${t.speedAt30Feet}) = 'integer'`,
    ),
    check(
      "dnd35_shields_speed_at_20_feet_integer",
      sql`${t.speedAt20Feet} is null or typeof(${t.speedAt20Feet}) = 'integer'`,
    ),
    primaryKey({ columns: [t.itemId] }),
    enumCheck("dnd35_shields_category_valid", t.category, [
      "buckler",
      "light",
      "heavy",
      "tower",
      "other",
    ]),
    nonNegative("dnd35_shields_ac_valid", t.acBonus),
    nonNegative("dnd35_shields_dex_valid", t.maxDexBonus),
    check("dnd35_shields_penalty_valid", sql`${t.armorCheckPenalty} <= 0`),
    check("dnd35_shields_failure_valid", sql`${t.arcaneSpellFailurePercent} between 0 and 100`),
    nonNegative("dnd35_shields_speed30_valid", t.speedAt30Feet),
    nonNegative("dnd35_shields_speed20_valid", t.speedAt20Feet),
  ],
);
export type Shield = typeof shields.$inferSelect;
export type NewShield = typeof shields.$inferInsert;
