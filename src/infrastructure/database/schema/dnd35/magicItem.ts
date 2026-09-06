import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, positive, jsonCheck } from "./schemaUtils";
import { items } from "./item";
import { spellSchools } from "./spellSchool";
import { equipmentSlots } from "./primitives";
import type { PrerequisiteExpression } from "./prerequisite";

export const magicItems = sqliteTable(
  "dnd35_magic_items",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    auraSchoolId: text("aura_school_id").references(() => spellSchools.id, {
      onDelete: "restrict",
    }),
    casterLevel: integer("caster_level"),
    manifesterLevel: integer("manifester_level"),
    auraStrength: text("aura_strength", {
      enum: ["faint", "moderate", "strong", "overwhelming", "special"],
    }),
    activation: text("activation", {
      enum: [
        "spell_completion",
        "spell_trigger",
        "command_word",
        "use_activated",
        "continuous",
        "other",
      ],
    }).notNull(),
    activationText: text("activation_text"),
    slot: text("slot", { enum: equipmentSlots }).notNull().default("slotless"),
    maximumCharges: integer("maximum_charges"),
    rechargeText: text("recharge_text"),
    enhancementBonus: integer("enhancement_bonus").notNull().default(0),
    craftCostCopper: integer("craft_cost_copper"),
    craftXpCost: integer("craft_xp_cost"),
    craftingText: text("crafting_text"),
    craftingPrerequisites: text("crafting_prerequisites", {
      mode: "json",
    }).$type<PrerequisiteExpression>(),
  },
  (t) => [
    check(
      "dnd35_magic_items_caster_level_integer",
      sql`${t.casterLevel} is null or typeof(${t.casterLevel}) = 'integer'`,
    ),
    check(
      "dnd35_magic_items_manifester_level_integer",
      sql`${t.manifesterLevel} is null or typeof(${t.manifesterLevel}) = 'integer'`,
    ),
    check(
      "dnd35_magic_items_maximum_charges_integer",
      sql`${t.maximumCharges} is null or typeof(${t.maximumCharges}) = 'integer'`,
    ),
    check(
      "dnd35_magic_items_enhancement_bonus_integer",
      sql`${t.enhancementBonus} is null or typeof(${t.enhancementBonus}) = 'integer'`,
    ),
    check(
      "dnd35_magic_items_craft_cost_copper_integer",
      sql`${t.craftCostCopper} is null or typeof(${t.craftCostCopper}) = 'integer'`,
    ),
    check(
      "dnd35_magic_items_craft_xp_cost_integer",
      sql`${t.craftXpCost} is null or typeof(${t.craftXpCost}) = 'integer'`,
    ),
    primaryKey({ columns: [t.itemId] }),
    positive("dnd35_magic_items_caster_valid", t.casterLevel),
    positive("dnd35_magic_items_manifester_valid", t.manifesterLevel),
    enumCheck("dnd35_magic_items_aura_valid", t.auraStrength, [
      "faint",
      "moderate",
      "strong",
      "overwhelming",
      "special",
    ]),
    enumCheck("dnd35_magic_items_activation_valid", t.activation, [
      "spell_completion",
      "spell_trigger",
      "command_word",
      "use_activated",
      "continuous",
      "other",
    ]),
    enumCheck("dnd35_magic_items_slot_valid", t.slot, equipmentSlots),
    nonNegative("dnd35_magic_items_charges_valid", t.maximumCharges),
    nonNegative("dnd35_magic_items_enhancement_valid", t.enhancementBonus),
    nonNegative("dnd35_magic_items_cost_valid", t.craftCostCopper),
    nonNegative("dnd35_magic_items_xp_valid", t.craftXpCost),
    jsonCheck("dnd35_magic_items_prerequisites_json", t.craftingPrerequisites),
  ],
);
export type MagicItem = typeof magicItems.$inferSelect;
export type NewMagicItem = typeof magicItems.$inferInsert;
