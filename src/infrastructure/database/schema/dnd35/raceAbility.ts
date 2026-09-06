import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck } from "./schemaUtils";
import { races } from "./race";
import { abilityKeys } from "./primitives";

export const raceAbilities = sqliteTable(
  "dnd35_race_abilities",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    ability: text("ability", { enum: abilityKeys }).notNull(),
    modifier: integer("modifier").notNull(),
  },
  (t) => [
    check(
      "dnd35_race_abilities_modifier_integer",
      sql`${t.modifier} is null or typeof(${t.modifier}) = 'integer'`,
    ),
    primaryKey({ columns: [t.raceId, t.ability] }),
    enumCheck("dnd35_race_abilities_key_valid", t.ability, abilityKeys),
  ],
);
export type RaceAbility = typeof raceAbilities.$inferSelect;
export type NewRaceAbility = typeof raceAbilities.$inferInsert;
