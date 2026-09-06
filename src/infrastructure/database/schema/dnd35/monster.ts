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
import { creatureSubtypes } from "./creatureSubtype";
import { sizes, alignments, movementModes, maneuverabilities } from "./primitives";
import type { RuleEffect } from "./primitives";

export const monsters = sqliteTable(
  "dnd35_monsters",
  {
    ...contentColumns(),
    creatureTypeId: text("creature_type_id")
      .notNull()
      .references(() => creatureTypes.id, { onDelete: "restrict" }),
    /** Rational CR and Hit Dice retain fractions such as 1/3 without rounding. */
    challengeRatingNumerator: integer("challenge_rating_numerator").notNull(),
    challengeRatingDenominator: integer("challenge_rating_denominator").notNull().default(1),
    hitDiceNumerator: integer("hit_dice_numerator").notNull(),
    hitDiceDenominator: integer("hit_dice_denominator").notNull().default(1),
    hitDie: integer("hit_die").notNull(),
    hitPointBonus: integer("hit_point_bonus").notNull().default(0),
    size: text("size", { enum: sizes }).notNull(),
    spaceFeet: real("space_feet").notNull(),
    reachFeet: real("reach_feet").notNull(),
    naturalArmor: integer("natural_armor").notNull().default(0),
    armorBonus: integer("armor_bonus").notNull().default(0),
    shieldBonus: integer("shield_bonus").notNull().default(0),
    deflectionBonus: integer("deflection_bonus").notNull().default(0),
    baseAttackBonus: integer("base_attack_bonus").notNull(),
    grappleModifier: integer("grapple_modifier"),
    fort: integer("fort").notNull(),
    ref: integer("ref").notNull(),
    will: integer("will").notNull(),
    /** NULL is a nonability, not zero or unknown (e.g. undead Constitution). */
    str: integer("str"),
    dex: integer("dex"),
    con: integer("con"),
    int: integer("int"),
    wis: integer("wis"),
    cha: integer("cha"),
    environment: text("environment"),
    organization: text("organization"),
    treasure: text("treasure"),
    alignment: text("alignment", { enum: alignments }),
    alignmentText: text("alignment_text"),
    advancement: text("advancement"),
    levelAdjustment: integer("level_adjustment"),
    /** Exceptional defenses not expressible by ordinary AC components. */
    defenses: text("defenses", { mode: "json" }).$type<RuleEffect[]>(),
  },
  (t) => [
    check(
      "dnd35_monsters_challenge_rating_numerator_integer",
      sql`${t.challengeRatingNumerator} is null or typeof(${t.challengeRatingNumerator}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_challenge_rating_denominator_integer",
      sql`${t.challengeRatingDenominator} is null or typeof(${t.challengeRatingDenominator}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_hit_dice_numerator_integer",
      sql`${t.hitDiceNumerator} is null or typeof(${t.hitDiceNumerator}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_hit_dice_denominator_integer",
      sql`${t.hitDiceDenominator} is null or typeof(${t.hitDiceDenominator}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_hit_die_integer",
      sql`${t.hitDie} is null or typeof(${t.hitDie}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_hit_point_bonus_integer",
      sql`${t.hitPointBonus} is null or typeof(${t.hitPointBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_natural_armor_integer",
      sql`${t.naturalArmor} is null or typeof(${t.naturalArmor}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_armor_bonus_integer",
      sql`${t.armorBonus} is null or typeof(${t.armorBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_shield_bonus_integer",
      sql`${t.shieldBonus} is null or typeof(${t.shieldBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_deflection_bonus_integer",
      sql`${t.deflectionBonus} is null or typeof(${t.deflectionBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_base_attack_bonus_integer",
      sql`${t.baseAttackBonus} is null or typeof(${t.baseAttackBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monsters_grapple_modifier_integer",
      sql`${t.grappleModifier} is null or typeof(${t.grappleModifier}) = 'integer'`,
    ),
    check("dnd35_monsters_fort_integer", sql`${t.fort} is null or typeof(${t.fort}) = 'integer'`),
    check("dnd35_monsters_ref_integer", sql`${t.ref} is null or typeof(${t.ref}) = 'integer'`),
    check("dnd35_monsters_will_integer", sql`${t.will} is null or typeof(${t.will}) = 'integer'`),
    check("dnd35_monsters_str_integer", sql`${t.str} is null or typeof(${t.str}) = 'integer'`),
    check("dnd35_monsters_dex_integer", sql`${t.dex} is null or typeof(${t.dex}) = 'integer'`),
    check("dnd35_monsters_con_integer", sql`${t.con} is null or typeof(${t.con}) = 'integer'`),
    check("dnd35_monsters_int_integer", sql`${t.int} is null or typeof(${t.int}) = 'integer'`),
    check("dnd35_monsters_wis_integer", sql`${t.wis} is null or typeof(${t.wis}) = 'integer'`),
    check("dnd35_monsters_cha_integer", sql`${t.cha} is null or typeof(${t.cha}) = 'integer'`),
    check(
      "dnd35_monsters_level_adjustment_integer",
      sql`${t.levelAdjustment} is null or typeof(${t.levelAdjustment}) = 'integer'`,
    ),
    ...contentChecks("dnd35_monsters", t),
    index("dnd35_monsters_type_idx").on(t.creatureTypeId),
    nonNegative("dnd35_monsters_cr_valid", t.challengeRatingNumerator),
    positive("dnd35_monsters_cr_denominator_valid", t.challengeRatingDenominator),
    positive("dnd35_monsters_hd_count_valid", t.hitDiceNumerator),
    positive("dnd35_monsters_hd_denominator_valid", t.hitDiceDenominator),
    positive("dnd35_monsters_hd_valid", t.hitDie),
    enumCheck("dnd35_monsters_size_valid", t.size, sizes),
    enumCheck("dnd35_monsters_alignment_valid", t.alignment, alignments),
    nonNegative("dnd35_monsters_space_valid", t.spaceFeet),
    nonNegative("dnd35_monsters_reach_valid", t.reachFeet),
    nonNegative("dnd35_monsters_bab_valid", t.baseAttackBonus),
    nonNegative("dnd35_monsters_la_valid", t.levelAdjustment),
    ...[t.str, t.dex, t.con, t.int, t.wis, t.cha].map((column, i) =>
      nonNegative(`dnd35_monsters_ability_${i}_valid`, column),
    ),
    jsonCheck("dnd35_monsters_defenses_json", t.defenses, "array"),
  ],
);
export type Monster = typeof monsters.$inferSelect;
export type NewMonster = typeof monsters.$inferInsert;
export const monsterSubtypes = sqliteTable(
  "dnd35_monster_subtypes",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    subtypeId: text("subtype_id")
      .notNull()
      .references(() => creatureSubtypes.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.monsterId, t.subtypeId] }),
    index("dnd35_monster_subtypes_reverse_idx").on(t.subtypeId),
  ],
);
export type MonsterSubtype = typeof monsterSubtypes.$inferSelect;
export type NewMonsterSubtype = typeof monsterSubtypes.$inferInsert;
export const monsterMovements = sqliteTable(
  "dnd35_monster_movements",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    mode: text("mode", { enum: movementModes }).notNull(),
    feet: integer("feet").notNull(),
    maneuverability: text("maneuverability", { enum: maneuverabilities }),
    rulesText: text("rules_text"),
  },
  (t) => [
    check(
      "dnd35_monster_movements_feet_integer",
      sql`${t.feet} is null or typeof(${t.feet}) = 'integer'`,
    ),
    primaryKey({ columns: [t.monsterId, t.mode] }),
    enumCheck("dnd35_monster_movements_mode_valid", t.mode, movementModes),
    enumCheck("dnd35_monster_movements_flight_valid", t.maneuverability, maneuverabilities),
    nonNegative("dnd35_monster_movements_speed_valid", t.feet),
  ],
);
export type MonsterMovement = typeof monsterMovements.$inferSelect;
export type NewMonsterMovement = typeof monsterMovements.$inferInsert;
