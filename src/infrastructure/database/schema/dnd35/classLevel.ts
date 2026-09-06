import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuid, nonNegative, positive } from "./schemaUtils";
import { classes } from "./class";

export const classLevels = sqliteTable(
  "dnd35_class_levels",
  {
    id: uuid(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    /** Cumulative base results at this class level, before character modifiers. */
    baseAttackBonus: integer("base_attack_bonus").notNull(),
    fort: integer("fort").notNull(),
    ref: integer("ref").notNull(),
    will: integer("will").notNull(),
    /** Nullable overrides use the class defaults. */
    hitDie: integer("hit_die"),
    skillPoints: integer("skill_points"),
    basePowerPoints: integer("base_power_points"),
    powersKnown: integer("powers_known"),
    maxPowerLevel: integer("max_power_level"),
  },
  (t) => [
    check(
      "dnd35_class_levels_level_integer",
      sql`${t.level} is null or typeof(${t.level}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_base_attack_bonus_integer",
      sql`${t.baseAttackBonus} is null or typeof(${t.baseAttackBonus}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_fort_integer",
      sql`${t.fort} is null or typeof(${t.fort}) = 'integer'`,
    ),
    check("dnd35_class_levels_ref_integer", sql`${t.ref} is null or typeof(${t.ref}) = 'integer'`),
    check(
      "dnd35_class_levels_will_integer",
      sql`${t.will} is null or typeof(${t.will}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_hit_die_integer",
      sql`${t.hitDie} is null or typeof(${t.hitDie}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_skill_points_integer",
      sql`${t.skillPoints} is null or typeof(${t.skillPoints}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_base_power_points_integer",
      sql`${t.basePowerPoints} is null or typeof(${t.basePowerPoints}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_powers_known_integer",
      sql`${t.powersKnown} is null or typeof(${t.powersKnown}) = 'integer'`,
    ),
    check(
      "dnd35_class_levels_max_power_level_integer",
      sql`${t.maxPowerLevel} is null or typeof(${t.maxPowerLevel}) = 'integer'`,
    ),
    uniqueIndex("dnd35_class_levels_class_level_uq").on(t.classId, t.level),
    positive("dnd35_class_levels_level_valid", t.level),
    positive("dnd35_class_levels_hd_valid", t.hitDie),
    nonNegative("dnd35_class_levels_skills_valid", t.skillPoints),
    nonNegative("dnd35_class_levels_bab_valid", t.baseAttackBonus),
    nonNegative("dnd35_class_levels_fort_valid", t.fort),
    nonNegative("dnd35_class_levels_ref_valid", t.ref),
    nonNegative("dnd35_class_levels_will_valid", t.will),
    nonNegative("dnd35_class_levels_pp_valid", t.basePowerPoints),
    nonNegative("dnd35_class_levels_known_valid", t.powersKnown),
    check("dnd35_class_levels_power_level_valid", sql`${t.maxPowerLevel} between 1 and 9`),
  ],
);
export type ClassLevel = typeof classLevels.$inferSelect;
export type NewClassLevel = typeof classLevels.$inferInsert;
