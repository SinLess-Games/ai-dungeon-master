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
    /** Fixed racial modifier for source average scores of 10 or higher. */
    modifier: integer("modifier").notNull(),
    /**
     * DMG monster-PC source average score for an ability below 10. When present,
     * the score is converted with the DMG p. 173 lookup table instead of using
     * the fixed modifier column.
     */
    monsterAverageScore: integer("monster_average_score"),
  },
  (t) => [
    check(
      "dnd35_race_abilities_modifier_integer",
      sql`${t.modifier} is null or typeof(${t.modifier}) = 'integer'`,
    ),
    check(
      "dnd35_race_abilities_monster_average_integer",
      sql`${t.monsterAverageScore} is null or typeof(${t.monsterAverageScore}) = 'integer'`,
    ),
    check(
      "dnd35_race_abilities_monster_average_valid",
      sql`${t.monsterAverageScore} is null or (${t.monsterAverageScore} >= 1 and ${t.monsterAverageScore} <= 9)`,
    ),
    primaryKey({ columns: [t.raceId, t.ability] }),
    enumCheck("dnd35_race_abilities_key_valid", t.ability, abilityKeys),
  ],
);
export type RaceAbility = typeof raceAbilities.$inferSelect;
export type NewRaceAbility = typeof raceAbilities.$inferInsert;
