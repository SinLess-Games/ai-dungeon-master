import { sql } from "drizzle-orm";
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { uuid, enumCheck, nonEmpty, nonNegative, positive, booleanCheck } from "./schemaUtils";
import { monsters } from "./monster";
import { weapons } from "./weapon";
import { damageTypes } from "./primitives";

export const monsterAttacks = sqliteTable(
  "dnd35_monster_attacks",
  {
    id: uuid(),
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, { onDelete: "cascade" }),
    weaponId: text("weapon_id").references(() => weapons.itemId, { onDelete: "restrict" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["natural", "manufactured", "special"] }).notNull(),
    attackMode: text("attack_mode", {
      enum: ["melee", "ranged", "melee_touch", "ranged_touch"],
    }).notNull(),
    /** Rows sharing a routine are used together; different routines are alternatives. */
    routineKey: text("routine_key").notNull().default("primary"),
    sequence: integer("sequence").notNull().default(0),
    attackCount: integer("attack_count").notNull().default(1),
    canUseAsStandard: integer("can_use_as_standard", { mode: "boolean" }).notNull().default(true),
    attackBonus: integer("attack_bonus").notNull(),
    damageDice: text("damage_dice").notNull(),
    damageBonus: integer("damage_bonus").notNull().default(0),
    criticalThreatMinimum: integer("critical_threat_minimum").notNull().default(20),
    criticalMultiplier: integer("critical_multiplier").notNull().default(2),
    reachFeet: real("reach_feet"),
    rangeIncrementFeet: integer("range_increment_feet"),
    specialText: text("special_text"),
  },
  (t) => [
    check(
      "dnd35_monster_attacks_sequence_integer",
      sql`${t.sequence} is null or typeof(${t.sequence}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_attack_count_integer",
      sql`${t.attackCount} is null or typeof(${t.attackCount}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_can_use_as_standard_integer",
      sql`${t.canUseAsStandard} is null or typeof(${t.canUseAsStandard}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_attack_bonus_integer",
      sql`${t.attackBonus} is null or typeof(${t.attackBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_damage_bonus_integer",
      sql`${t.damageBonus} is null or typeof(${t.damageBonus}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_critical_threat_minimum_integer",
      sql`${t.criticalThreatMinimum} is null or typeof(${t.criticalThreatMinimum}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_critical_multiplier_integer",
      sql`${t.criticalMultiplier} is null or typeof(${t.criticalMultiplier}) = 'integer'`,
    ),
    check(
      "dnd35_monster_attacks_range_increment_feet_integer",
      sql`${t.rangeIncrementFeet} is null or typeof(${t.rangeIncrementFeet}) = 'integer'`,
    ),
    uniqueIndex("dnd35_monster_attacks_routine_uq").on(t.monsterId, t.routineKey, t.sequence),
    nonEmpty("dnd35_monster_attacks_name_nonempty", t.name),
    nonEmpty("dnd35_monster_attacks_routine_nonempty", t.routineKey),
    nonEmpty("dnd35_monster_attacks_damage_nonempty", t.damageDice),
    enumCheck("dnd35_monster_attacks_kind_valid", t.kind, ["natural", "manufactured", "special"]),
    enumCheck("dnd35_monster_attacks_mode_valid", t.attackMode, [
      "melee",
      "ranged",
      "melee_touch",
      "ranged_touch",
    ]),
    nonNegative("dnd35_monster_attacks_sequence_valid", t.sequence),
    positive("dnd35_monster_attacks_count_valid", t.attackCount),
    booleanCheck("dnd35_monster_attacks_standard_bool", t.canUseAsStandard),
    check(
      "dnd35_monster_attacks_critical_valid",
      sql`${t.criticalThreatMinimum} between 2 and 20 and ${t.criticalMultiplier} >= 2`,
    ),
    nonNegative("dnd35_monster_attacks_reach_valid", t.reachFeet),
    positive("dnd35_monster_attacks_range_valid", t.rangeIncrementFeet),
  ],
);
export type MonsterAttack = typeof monsterAttacks.$inferSelect;
export type NewMonsterAttack = typeof monsterAttacks.$inferInsert;
export const monsterAttackDamageTypes = sqliteTable(
  "dnd35_monster_attack_damage_types",
  {
    attackId: text("attack_id")
      .notNull()
      .references(() => monsterAttacks.id, { onDelete: "cascade" }),
    damageType: text("damage_type", { enum: damageTypes }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.attackId, t.damageType] }),
    enumCheck("dnd35_monster_attack_damage_types_valid", t.damageType, damageTypes),
  ],
);
export type MonsterAttackDamageType = typeof monsterAttackDamageTypes.$inferSelect;
export type NewMonsterAttackDamageType = typeof monsterAttackDamageTypes.$inferInsert;
