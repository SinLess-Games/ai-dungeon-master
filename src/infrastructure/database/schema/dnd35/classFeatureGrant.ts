import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { jsonCheck } from "./schemaUtils";
import { classLevels } from "./classLevel";
import { classFeatures } from "./classFeature";
import type { GrantParameters } from "./primitives";

export const classFeatureGrants = sqliteTable(
  "dnd35_class_feature_grants",
  {
    classLevelId: text("class_level_id")
      .notNull()
      .references(() => classLevels.id, { onDelete: "cascade" }),
    classFeatureId: text("class_feature_id")
      .notNull()
      .references(() => classFeatures.id, { onDelete: "cascade" }),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
    rulesText: text("rules_text"),
  },
  (t) => [
    primaryKey({ columns: [t.classLevelId, t.classFeatureId] }),
    index("dnd35_class_feature_grants_reverse_idx").on(t.classFeatureId),
    jsonCheck("dnd35_class_feature_grants_parameters_json", t.parameters),
  ],
);
export type ClassFeatureGrant = typeof classFeatureGrants.$inferSelect;
export type NewClassFeatureGrant = typeof classFeatureGrants.$inferInsert;
