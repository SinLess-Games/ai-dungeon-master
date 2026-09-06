import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, positive } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";

export const creatureTypes = sqliteTable(
  "dnd35_creature_types",
  {
    ...contentColumns(),
    hitDie: integer("hit_die"),
    skillPointsPerHitDie: integer("skill_points_per_hit_die"),
    babProgression: text("bab_progression", { enum: ["full", "three_quarters", "half", "custom"] }),
    fortProgression: text("fort_progression", { enum: ["good", "poor", "custom"] }),
    refProgression: text("ref_progression", { enum: ["good", "poor", "custom"] }),
    willProgression: text("will_progression", { enum: ["good", "poor", "custom"] }),
  },
  (t) => [
    check(
      "dnd35_creature_types_hit_die_integer",
      sql`${t.hitDie} is null or typeof(${t.hitDie}) = 'integer'`,
    ),
    check(
      "dnd35_creature_types_skill_points_per_hit_die_integer",
      sql`${t.skillPointsPerHitDie} is null or typeof(${t.skillPointsPerHitDie}) = 'integer'`,
    ),
    ...contentChecks("dnd35_creature_types", t),
    positive("dnd35_creature_types_hd_valid", t.hitDie),
    nonNegative("dnd35_creature_types_skills_valid", t.skillPointsPerHitDie),
    enumCheck("dnd35_creature_types_bab_valid", t.babProgression, [
      "full",
      "three_quarters",
      "half",
      "custom",
    ]),
    ...[t.fortProgression, t.refProgression, t.willProgression].map((column, i) =>
      enumCheck(`dnd35_creature_types_save_${i}_valid`, column, ["good", "poor", "custom"]),
    ),
  ],
);
export type CreatureType = typeof creatureTypes.$inferSelect;
export type NewCreatureType = typeof creatureTypes.$inferInsert;
