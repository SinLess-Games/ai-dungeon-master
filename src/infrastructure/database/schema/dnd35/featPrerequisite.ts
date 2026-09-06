import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { jsonCheck } from "./schemaUtils";
import { feats } from "./feat";
import type { PrerequisiteExpression } from "./prerequisite";

export const featPrerequisites = sqliteTable(
  "dnd35_feat_prerequisites",
  {
    featId: text("feat_id")
      .notNull()
      .references(() => feats.id, { onDelete: "cascade" }),
    expression: text("expression", { mode: "json" }).$type<PrerequisiteExpression>().notNull(),
    explanation: text("explanation"),
  },
  (t) => [
    primaryKey({ columns: [t.featId] }),
    jsonCheck("dnd35_feat_prerequisites_expression_json", t.expression),
  ],
);
export type FeatPrerequisite = typeof featPrerequisites.$inferSelect;
export type NewFeatPrerequisite = typeof featPrerequisites.$inferInsert;
