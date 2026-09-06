import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, positive } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";

export const classes = sqliteTable(
  "dnd35_classes",
  {
    ...contentColumns(),
    category: text("category", { enum: ["base", "prestige", "npc"] }).notNull(),
    hitDie: integer("hit_die").notNull(),
    skillPointsPerLevel: integer("skill_points_per_level").notNull(),
    babProgression: text("bab_progression", {
      enum: ["full", "three_quarters", "half", "custom"],
    }).notNull(),
    fortProgression: text("fort_progression", { enum: ["good", "poor", "custom"] }).notNull(),
    refProgression: text("ref_progression", { enum: ["good", "poor", "custom"] }).notNull(),
    willProgression: text("will_progression", { enum: ["good", "poor", "custom"] }).notNull(),
  },
  (t) => [
    check(
      "dnd35_classes_hit_die_integer",
      sql`${t.hitDie} is null or typeof(${t.hitDie}) = 'integer'`,
    ),
    check(
      "dnd35_classes_skill_points_per_level_integer",
      sql`${t.skillPointsPerLevel} is null or typeof(${t.skillPointsPerLevel}) = 'integer'`,
    ),
    ...contentChecks("dnd35_classes", t),
    enumCheck("dnd35_classes_category_valid", t.category, ["base", "prestige", "npc"]),
    positive("dnd35_classes_hd_positive", t.hitDie),
    nonNegative("dnd35_classes_skill_points_valid", t.skillPointsPerLevel),
    enumCheck("dnd35_classes_bab_valid", t.babProgression, [
      "full",
      "three_quarters",
      "half",
      "custom",
    ]),
    ...[t.fortProgression, t.refProgression, t.willProgression].map((column, i) =>
      enumCheck(`dnd35_classes_save_${i}_valid`, column, ["good", "poor", "custom"]),
    ),
  ],
);
export type DndClass = typeof classes.$inferSelect;
export type NewDndClass = typeof classes.$inferInsert;
