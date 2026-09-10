import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { races } from "./race";
import { skills } from "./skill";

/** Monster-entry skills are class skills for the race's retained racial Hit Dice. */
export const raceClassSkills = sqliteTable(
  "dnd35_race_class_skills",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.raceId, t.skillId] }),
    index("dnd35_race_class_skills_skill_idx").on(t.skillId),
  ],
);
export type RaceClassSkill = typeof raceClassSkills.$inferSelect;
export type NewRaceClassSkill = typeof raceClassSkills.$inferInsert;
