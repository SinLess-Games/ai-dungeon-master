import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { enumCheck, nonNegative, positive, jsonCheck } from "./schemaUtils";
import { contentColumns, contentChecks } from "./contentReference";
import { creatureTypes } from "./creatureType";
import { classes } from "./class";
import { sizes, movementModes, maneuverabilities } from "./primitives";
import { creatureSubtypes } from "./creatureSubtype";
import type { PrerequisiteExpression } from "./prerequisite";

export const races = sqliteTable(
  "dnd35_races",
  {
    ...contentColumns(),
    creatureTypeId: text("creature_type_id").references(() => creatureTypes.id, {
      onDelete: "restrict",
    }),
    favoredClassId: text("favored_class_id").references(() => classes.id, { onDelete: "restrict" }),
    favoredClassRule: text("favored_class_rule", {
      enum: ["specific", "highest", "choice", "none"],
    })
      .notNull()
      .default("none"),
    size: text("size", { enum: sizes }).notNull(),
    baseSpeedFeet: integer("base_speed_feet").notNull(),
    levelAdjustment: integer("level_adjustment"),
    racialHitDice: integer("racial_hit_dice").notNull().default(0),
    racialHitDie: integer("racial_hit_die"),
    naturalArmor: integer("natural_armor").notNull().default(0),
    bonusSkillPointsPerLevel: integer("bonus_skill_points_per_level").notNull().default(0),
    bonusFeatsAtFirstLevel: integer("bonus_feats_at_first_level").notNull().default(0),
  },
  (t) => [
    check(
      "dnd35_races_base_speed_feet_integer",
      sql`${t.baseSpeedFeet} is null or typeof(${t.baseSpeedFeet}) = 'integer'`,
    ),
    check(
      "dnd35_races_level_adjustment_integer",
      sql`${t.levelAdjustment} is null or typeof(${t.levelAdjustment}) = 'integer'`,
    ),
    check(
      "dnd35_races_racial_hit_dice_integer",
      sql`${t.racialHitDice} is null or typeof(${t.racialHitDice}) = 'integer'`,
    ),
    check(
      "dnd35_races_racial_hit_die_integer",
      sql`${t.racialHitDie} is null or typeof(${t.racialHitDie}) = 'integer'`,
    ),
    check(
      "dnd35_races_natural_armor_integer",
      sql`${t.naturalArmor} is null or typeof(${t.naturalArmor}) = 'integer'`,
    ),
    check(
      "dnd35_races_bonus_skill_points_per_level_integer",
      sql`${t.bonusSkillPointsPerLevel} is null or typeof(${t.bonusSkillPointsPerLevel}) = 'integer'`,
    ),
    check(
      "dnd35_races_bonus_feats_at_first_level_integer",
      sql`${t.bonusFeatsAtFirstLevel} is null or typeof(${t.bonusFeatsAtFirstLevel}) = 'integer'`,
    ),
    ...contentChecks("dnd35_races", t),
    index("dnd35_races_type_idx").on(t.creatureTypeId),
    enumCheck("dnd35_races_size_valid", t.size, sizes),
    enumCheck("dnd35_races_favored_rule_valid", t.favoredClassRule, [
      "specific",
      "highest",
      "choice",
      "none",
    ]),
    check(
      "dnd35_races_favored_class_valid",
      sql`(${t.favoredClassRule} = 'specific' and ${t.favoredClassId} is not null) or (${t.favoredClassRule} != 'specific' and ${t.favoredClassId} is null)`,
    ),
    nonNegative("dnd35_races_speed_valid", t.baseSpeedFeet),
    nonNegative("dnd35_races_la_valid", t.levelAdjustment),
    nonNegative("dnd35_races_rhd_valid", t.racialHitDice),
    positive("dnd35_races_hd_valid", t.racialHitDie),
    check("dnd35_races_hd_present", sql`${t.racialHitDice} = 0 or ${t.racialHitDie} is not null`),
    nonNegative("dnd35_races_bonus_skills_valid", t.bonusSkillPointsPerLevel),
    nonNegative("dnd35_races_bonus_feats_valid", t.bonusFeatsAtFirstLevel),
  ],
);
export type Race = typeof races.$inferSelect;
export type NewRace = typeof races.$inferInsert;
export const raceSubtypes = sqliteTable(
  "dnd35_race_subtypes",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    subtypeId: text("subtype_id")
      .notNull()
      .references(() => creatureSubtypes.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.raceId, t.subtypeId] }),
    index("dnd35_race_subtypes_reverse_idx").on(t.subtypeId),
  ],
);
export type RaceSubtype = typeof raceSubtypes.$inferSelect;
export type NewRaceSubtype = typeof raceSubtypes.$inferInsert;
export const racePrerequisites = sqliteTable(
  "dnd35_race_prerequisites",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    expression: text("expression", { mode: "json" }).$type<PrerequisiteExpression>().notNull(),
    explanation: text("explanation"),
  },
  (t) => [
    primaryKey({ columns: [t.raceId] }),
    jsonCheck("dnd35_race_prerequisites_json", t.expression),
  ],
);
export type RacePrerequisite = typeof racePrerequisites.$inferSelect;
export type NewRacePrerequisite = typeof racePrerequisites.$inferInsert;
export const raceMovements = sqliteTable(
  "dnd35_race_movements",
  {
    raceId: text("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    /** Additional modes; base land speed is on the race definition. */
    mode: text("mode", { enum: movementModes }).notNull(),
    feet: integer("feet"),
    baseSpeedMultiplier: real("base_speed_multiplier"),
    maneuverability: text("maneuverability", { enum: maneuverabilities }),
    rulesText: text("rules_text"),
  },
  (t) => [
    check(
      "dnd35_race_movements_feet_integer",
      sql`${t.feet} is null or typeof(${t.feet}) = 'integer'`,
    ),
    primaryKey({ columns: [t.raceId, t.mode] }),
    enumCheck("dnd35_race_movements_mode_valid", t.mode, movementModes),
    check("dnd35_race_movements_no_land", sql`${t.mode} != 'land'`),
    enumCheck("dnd35_race_movements_flight_valid", t.maneuverability, maneuverabilities),
    nonNegative("dnd35_race_movements_feet_valid", t.feet),
    positive("dnd35_race_movements_multiplier_valid", t.baseSpeedMultiplier),
    check(
      "dnd35_race_movements_speed_present",
      sql`(${t.feet} is not null and ${t.baseSpeedMultiplier} is null) or (${t.feet} is null and ${t.baseSpeedMultiplier} is not null)`,
    ),
  ],
);
export type RaceMovement = typeof raceMovements.$inferSelect;
export type NewRaceMovement = typeof raceMovements.$inferInsert;
