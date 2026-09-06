import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuid, nonEmpty, nonNegative, jsonCheck } from "./schemaUtils";
import { races } from "./race";
import { specialAbilities } from "./specialAbility";
import type { RuleEffect, GrantParameters } from "./primitives";

export const raceTraits = sqliteTable(
  "dnd35_race_traits",
  {
    id: uuid(),
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    specialAbilityId: text("special_ability_id").references(() => specialAbilities.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    rulesText: text("rules_text").notNull(),
    position: integer("position").notNull().default(0),
    parameters: text("parameters", { mode: "json" }).$type<GrantParameters>(),
    effects: text("effects", { mode: "json" }).$type<RuleEffect[]>(),
  },
  (t) => [
    check(
      "dnd35_race_traits_position_integer",
      sql`${t.position} is null or typeof(${t.position}) = 'integer'`,
    ),
    index("dnd35_race_traits_race_idx").on(t.raceId, t.position),
    nonEmpty("dnd35_race_traits_name_nonempty", t.name),
    nonNegative("dnd35_race_traits_position_valid", t.position),
    jsonCheck("dnd35_race_traits_parameters_json", t.parameters),
    jsonCheck("dnd35_race_traits_effects_json", t.effects, "array"),
  ],
);
export type RaceTrait = typeof raceTraits.$inferSelect;
export type NewRaceTrait = typeof raceTraits.$inferInsert;
