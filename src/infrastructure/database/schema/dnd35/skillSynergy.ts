import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { uuid, positive } from "./schemaUtils";
import { skills } from "./skill";

export const skillSynergies = sqliteTable(
  "dnd35_skill_synergies",
  {
    id: uuid(),
    fromSkillId: text("from_skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    toSkillId: text("to_skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    minimumRanks: real("minimum_ranks").notNull().default(5),
    bonus: integer("bonus").notNull().default(2),
    context: text("context").notNull().default(""),
  },
  (t) => [
    check(
      "dnd35_skill_synergies_bonus_integer",
      sql`${t.bonus} is null or typeof(${t.bonus}) = 'integer'`,
    ),
    uniqueIndex("dnd35_skill_synergies_edge_uq").on(t.fromSkillId, t.toSkillId, t.context),
    index("dnd35_skill_synergies_target_idx").on(t.toSkillId),
    check(
      "dnd35_skill_synergies_ranks_valid",
      sql`${t.minimumRanks} >= 0 and ${t.minimumRanks} * 2 = cast(${t.minimumRanks} * 2 as integer)`,
    ),
    positive("dnd35_skill_synergies_bonus_valid", t.bonus),
  ],
);
export type SkillSynergy = typeof skillSynergies.$inferSelect;
export type NewSkillSynergy = typeof skillSynergies.$inferInsert;
