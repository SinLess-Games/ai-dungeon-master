import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { monsters } from "./monster";
import { skills } from "./skill";

export const monsterSkills = sqliteTable(
  "dnd35_monster_skills",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    specialization: text("specialization").notNull().default(""),
    ranks: real("ranks"),
    /** Published total may be supplied when source ranks are unknown. */
    publishedModifier: integer("published_modifier"),
    racialBonus: integer("racial_bonus").notNull().default(0),
    context: text("context"),
  },
  (t) => [
    check(
      "dnd35_monster_skills_published_modifier_integer",
      sql`${t.publishedModifier} is null or typeof(${t.publishedModifier}) = 'integer'`,
    ),
    check(
      "dnd35_monster_skills_racial_bonus_integer",
      sql`${t.racialBonus} is null or typeof(${t.racialBonus}) = 'integer'`,
    ),
    primaryKey({ columns: [t.monsterId, t.skillId, t.specialization] }),
    check(
      "dnd35_monster_skills_ranks_valid",
      sql`${t.ranks} >= 0 and ${t.ranks} * 2 = cast(${t.ranks} * 2 as integer)`,
    ),
    check(
      "dnd35_monster_skills_value_present",
      sql`${t.ranks} is not null or ${t.publishedModifier} is not null`,
    ),
  ],
);
export type MonsterSkill = typeof monsterSkills.$inferSelect;
export type NewMonsterSkill = typeof monsterSkills.$inferInsert;
