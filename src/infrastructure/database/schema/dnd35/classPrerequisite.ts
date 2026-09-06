import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { jsonCheck } from "./schemaUtils";
import { classes } from "./class";
import type { PrerequisiteExpression } from "./prerequisite";

export const classPrerequisites = sqliteTable(
  "dnd35_class_prerequisites",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    expression: text("expression", { mode: "json" }).$type<PrerequisiteExpression>().notNull(),
    explanation: text("explanation"),
  },
  (t) => [
    primaryKey({ columns: [t.classId] }),
    jsonCheck("dnd35_class_prerequisites_expression_json", t.expression),
  ],
);
export type ClassPrerequisite = typeof classPrerequisites.$inferSelect;
export type NewClassPrerequisite = typeof classPrerequisites.$inferInsert;
