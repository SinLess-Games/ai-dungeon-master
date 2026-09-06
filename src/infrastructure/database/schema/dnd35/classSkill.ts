import { index, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { classes } from "./class";
import { skills } from "./skill";

export const classSkills = sqliteTable(
  "dnd35_class_skills",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.skillId] }),
    index("dnd35_class_skills_reverse_idx").on(t.skillId),
  ],
);
export type ClassSkill = typeof classSkills.$inferSelect;
export type NewClassSkill = typeof classSkills.$inferInsert;
