import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, positive, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import type { RuleEffect, GrantParameters } from "./primitives";
import type { PrerequisiteExpression } from "./prerequisite";
import { items } from "./item";

export const itemProperties = sqliteTable(
  "dnd35_item_properties",
  {
    ...contentColumns(),
    kind: text("kind", { enum: ["mundane", "enhancement", "magic", "psionic", "other"] }).notNull(),
    enhancementEquivalent: integer("enhancement_equivalent").notNull().default(0),
    flatPriceCopper: integer("flat_price_copper").notNull().default(0),
    minimumCasterLevel: integer("minimum_caster_level"),
    effects: text("effects", { mode: "json" }).$type<RuleEffect[]>(),
    prerequisites: text("prerequisites", { mode: "json" }).$type<PrerequisiteExpression>(),
  },
  (t) => [
    check(
      "dnd35_item_properties_enhancement_equivalent_integer",
      sql`${t.enhancementEquivalent} is null or typeof(${t.enhancementEquivalent}) = 'integer'`,
    ),
    check(
      "dnd35_item_properties_flat_price_copper_integer",
      sql`${t.flatPriceCopper} is null or typeof(${t.flatPriceCopper}) = 'integer'`,
    ),
    check(
      "dnd35_item_properties_minimum_caster_level_integer",
      sql`${t.minimumCasterLevel} is null or typeof(${t.minimumCasterLevel}) = 'integer'`,
    ),
    ...contentChecks("dnd35_item_properties", t),
    enumCheck("dnd35_item_properties_kind_valid", t.kind, [
      "mundane",
      "enhancement",
      "magic",
      "psionic",
      "other",
    ]),
    nonNegative("dnd35_item_properties_enhancement_valid", t.enhancementEquivalent),
    nonNegative("dnd35_item_properties_price_valid", t.flatPriceCopper),
    positive("dnd35_item_properties_caster_valid", t.minimumCasterLevel),
    jsonCheck("dnd35_item_properties_effects_json", t.effects, "array"),
    jsonCheck("dnd35_item_properties_prerequisites_json", t.prerequisites),
  ],
);
export type ItemProperty = typeof itemProperties.$inferSelect;
export type NewItemProperty = typeof itemProperties.$inferInsert;
export const itemPropertyApplicability = sqliteTable(
  "dnd35_item_property_applicability",
  {
    propertyId: text("property_id")
      .notNull()
      .references(() => itemProperties.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["weapon", "armor", "shield", "ammunition", "other"],
    }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.propertyId, t.category] }),
    enumCheck("dnd35_property_applicability_category_valid", t.category, [
      "weapon",
      "armor",
      "shield",
      "ammunition",
      "other",
    ]),
  ],
);
export type ItemPropertyApplicability = typeof itemPropertyApplicability.$inferSelect;
export type NewItemPropertyApplicability = typeof itemPropertyApplicability.$inferInsert;
export const itemPropertyAssignments = sqliteTable(
  "dnd35_item_property_assignments",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => itemProperties.id, { onDelete: "cascade" }),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.propertyId] }),
    index("dnd35_item_property_assignments_reverse_idx").on(t.propertyId),
    jsonCheck("dnd35_item_property_assignments_parameters_json", t.parameters),
  ],
);
export type ItemPropertyAssignment = typeof itemPropertyAssignments.$inferSelect;
export type NewItemPropertyAssignment = typeof itemPropertyAssignments.$inferInsert;
