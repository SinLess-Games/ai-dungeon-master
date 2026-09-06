import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import type { RuleEffect } from "./primitives";

export const conditions = sqliteTable(
  "dnd35_conditions",
  {
    ...contentColumns(),
    stacking: text("stacking", { enum: ["replace", "independent", "cumulative", "special"] })
      .notNull()
      .default("replace"),
    effects: text("effects", { mode: "json" }).$type<RuleEffect[]>(),
  },
  (t) => [
    ...contentChecks("dnd35_conditions", t),
    enumCheck("dnd35_conditions_stacking_valid", t.stacking, [
      "replace",
      "independent",
      "cumulative",
      "special",
    ]),
    jsonCheck("dnd35_conditions_effects_json", t.effects, "array"),
  ],
);
export type Condition = typeof conditions.$inferSelect;
export type NewCondition = typeof conditions.$inferInsert;
