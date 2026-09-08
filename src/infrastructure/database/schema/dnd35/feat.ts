import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, booleanCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";

export const feats = sqliteTable(
  "dnd35_feats",
  {
    ...contentColumns(),
    repeatable: integer("repeatable", { mode: "boolean" }).notNull().default(false),
    choiceKind: text("choice_kind", {
      enum: ["none", "skill", "weapon", "school", "spell", "other"],
    })
      .notNull()
      .default("none"),
    repeatabilityText: text("repeatability_text"),
    normalText: text("normal_text"),
    specialText: text("special_text"),
  },
  (t) => [
    check(
      "dnd35_feats_repeatable_integer",
      sql`${t.repeatable} is null or typeof(${t.repeatable}) = 'integer'`,
    ),
    ...contentChecks("dnd35_feats", t),
    booleanCheck("dnd35_feats_repeatable_bool", t.repeatable),
    enumCheck("dnd35_feats_choice_valid", t.choiceKind, [
      "none",
      "skill",
      "weapon",
      "school",
      "spell",
      "other",
    ]),
  ],
);
export type Feat = typeof feats.$inferSelect;
export type NewFeat = typeof feats.$inferInsert;

export const featCategories = [
  "general",
  "fighter",
  "metamagic",
  "item_creation",
  "psionic",
  "epic",
  "racial",
  "divine",
  "wild",
  "heritage",
  "ceremony",
  "combat_form",
  "tactical",
  "reserve",
  "incarnum",
  "vile",
  "exalted",
  "other",
] as const;
export type FeatCategory = (typeof featCategories)[number];
export const featCategoryAssignments = sqliteTable(
  "dnd35_feat_category_assignments",
  {
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "cascade" }),
    category: text("category", { enum: featCategories }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.featId, t.category] }),
    index("dnd35_feat_categories_category_idx").on(t.category),
    enumCheck("dnd35_feat_categories_valid", t.category, featCategories),
  ],
);
export type FeatCategoryAssignment = typeof featCategoryAssignments.$inferSelect;
export type NewFeatCategoryAssignment = typeof featCategoryAssignments.$inferInsert;
