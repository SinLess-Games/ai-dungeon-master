import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { powers } from "./power";
import { classes } from "./class";
import { powerDisciplines } from "./powerDiscipline";

export const powerClassLevels = sqliteTable(
  "dnd35_power_class_levels",
  {
    powerId: text("power_id")
      .notNull()
      .references(() => powers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    powerLevel: integer("power_level").notNull(),
    specialistDisciplineId: text("specialist_discipline_id").references(() => powerDisciplines.id, {
      onDelete: "restrict",
    }),
  },
  (t) => [
    check(
      "dnd35_power_class_levels_power_level_integer",
      sql`${t.powerLevel} is null or typeof(${t.powerLevel}) = 'integer'`,
    ),
    primaryKey({ columns: [t.powerId, t.classId] }),
    check("dnd35_power_class_levels_level_valid", sql`${t.powerLevel} between 0 and 9`),
    index("dnd35_power_class_levels_list_idx").on(t.classId, t.powerLevel),
  ],
);
export type PowerClassLevel = typeof powerClassLevels.$inferSelect;
export type NewPowerClassLevel = typeof powerClassLevels.$inferInsert;
