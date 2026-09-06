import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { sizes } from "./primitives";

export const items = sqliteTable(
  "dnd35_items",
  {
    ...contentColumns(),
    category: text("category", {
      enum: [
        "weapon",
        "armor",
        "shield",
        "ammunition",
        "gear",
        "consumable",
        "container",
        "magic",
        "other",
      ],
    }).notNull(),
    /** Exact prices in copper; fractional pounds are intentional. No exchange logic here. */
    priceCopper: integer("price_copper"),
    weightPounds: real("weight_pounds"),
    size: text("size", { enum: sizes }),
    hardness: integer("hardness"),
    hitPoints: integer("hit_points"),
  },
  (t) => [
    check(
      "dnd35_items_price_copper_integer",
      sql`${t.priceCopper} is null or typeof(${t.priceCopper}) = 'integer'`,
    ),
    check(
      "dnd35_items_hardness_integer",
      sql`${t.hardness} is null or typeof(${t.hardness}) = 'integer'`,
    ),
    check(
      "dnd35_items_hit_points_integer",
      sql`${t.hitPoints} is null or typeof(${t.hitPoints}) = 'integer'`,
    ),
    ...contentChecks("dnd35_items", t),
    index("dnd35_items_category_idx").on(t.category),
    enumCheck("dnd35_items_category_valid", t.category, [
      "weapon",
      "armor",
      "shield",
      "ammunition",
      "gear",
      "consumable",
      "container",
      "magic",
      "other",
    ]),
    nonNegative("dnd35_items_price_valid", t.priceCopper),
    nonNegative("dnd35_items_weight_valid", t.weightPounds),
    nonNegative("dnd35_items_hardness_valid", t.hardness),
    nonNegative("dnd35_items_hp_valid", t.hitPoints),
    enumCheck("dnd35_items_size_valid", t.size, sizes),
  ],
);
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
