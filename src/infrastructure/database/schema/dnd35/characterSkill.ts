import { sql } from "drizzle-orm";
import { check, real, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { timestamps } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { skills } from "./skill";

export const characterSkills = sqliteTable(
  "dnd35_character_skills",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    /** Empty for unspecialized skills; Craft/Perform/Profession use separate keys. */
    specialization: text("specialization").notNull().default(""),
    ranks: real("ranks").notNull().default(0),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.characterId, t.skillId, t.specialization] }),
    check(
      "dnd35_character_skills_ranks_valid",
      sql`${t.ranks} >= 0 and ${t.ranks} * 2 = cast(${t.ranks} * 2 as integer)`,
    ),
  ],
);
export type CharacterSkill = typeof characterSkills.$inferSelect;
export type NewCharacterSkill = typeof characterSkills.$inferInsert;
