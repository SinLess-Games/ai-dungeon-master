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
    /**
     * Optional per-list base cost override. Most 3.5 powers cost 2 * level - 1,
     * but XPH includes powers whose base PP cost differs by class list (for
     * example biofeedback for psion/wilder versus psychic warrior).
     *
     * When null, use dnd35_powers.power_points.
     */
    powerPoints: integer("power_points"),
    specialistDisciplineId: text("specialist_discipline_id").references(() => powerDisciplines.id, {
      onDelete: "restrict",
    }),
  },
  (t) => [
    check(
      "dnd35_power_class_levels_power_level_integer",
      sql`${t.powerLevel} is null or typeof(${t.powerLevel}) = 'integer'`,
    ),
    check(
      "dnd35_power_class_levels_power_points_integer",
      sql`${t.powerPoints} is null or typeof(${t.powerPoints}) = 'integer'`,
    ),
    primaryKey({ columns: [t.powerId, t.classId] }),
    check("dnd35_power_class_levels_level_valid", sql`${t.powerLevel} between 0 and 9`),
    check(
      "dnd35_power_class_levels_power_points_valid",
      sql`${t.powerPoints} is null or ${t.powerPoints} >= 0`,
    ),
    index("dnd35_power_class_levels_list_idx").on(t.classId, t.powerLevel),
  ],
);
export type PowerClassLevel = typeof powerClassLevels.$inferSelect;
export type NewPowerClassLevel = typeof powerClassLevels.$inferInsert;
