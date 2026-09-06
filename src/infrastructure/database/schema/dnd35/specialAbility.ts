import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { abilityCategories, actionTypes } from "./primitives";
import type { RuleEffect, GrantParameters } from "./primitives";

export const specialAbilities = sqliteTable(
  "dnd35_special_abilities",
  {
    ...contentColumns(),
    category: text("category", { enum: abilityCategories }).notNull(),
    actionType: text("action_type", { enum: actionTypes }),
    effects: text("effects", { mode: "json" }).$type<RuleEffect[]>(),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
  },
  (t) => [
    ...contentChecks("dnd35_special_abilities", t),
    enumCheck("dnd35_special_abilities_category_valid", t.category, abilityCategories),
    enumCheck("dnd35_special_abilities_action_valid", t.actionType, actionTypes),
    jsonCheck("dnd35_special_abilities_effects_json", t.effects, "array"),
    jsonCheck("dnd35_special_abilities_parameters_json", t.parameters),
  ],
);
export type SpecialAbility = typeof specialAbilities.$inferSelect;
export type NewSpecialAbility = typeof specialAbilities.$inferInsert;
