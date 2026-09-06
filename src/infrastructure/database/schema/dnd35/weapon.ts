import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { enumCheck, nonEmpty, nonNegative, positive, booleanCheck } from "./schemaUtils";
import { items } from "./item";
import { sizes, damageTypes } from "./primitives";

export const weapons = sqliteTable(
  "dnd35_weapons",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    proficiency: text("proficiency", { enum: ["simple", "martial", "exotic"] }).notNull(),
    handedness: text("handedness", {
      enum: ["light", "one_handed", "two_handed", "ranged"],
    }).notNull(),
    attackKind: text("attack_kind", { enum: ["melee", "ranged", "both"] }).notNull(),
    criticalThreatMinimum: integer("critical_threat_minimum").notNull().default(20),
    criticalMultiplier: integer("critical_multiplier").notNull().default(2),
    rangeIncrementFeet: integer("range_increment_feet"),
    reachFeet: integer("reach_feet"),
    isReach: integer("is_reach", { mode: "boolean" }).notNull().default(false),
    damageTypeMode: text("damage_type_mode", { enum: ["and", "or"] })
      .notNull()
      .default("and"),
    specialText: text("special_text"),
  },
  (t) => [
    check(
      "dnd35_weapons_critical_threat_minimum_integer",
      sql`${t.criticalThreatMinimum} is null or typeof(${t.criticalThreatMinimum}) = 'integer'`,
    ),
    check(
      "dnd35_weapons_critical_multiplier_integer",
      sql`${t.criticalMultiplier} is null or typeof(${t.criticalMultiplier}) = 'integer'`,
    ),
    check(
      "dnd35_weapons_range_increment_feet_integer",
      sql`${t.rangeIncrementFeet} is null or typeof(${t.rangeIncrementFeet}) = 'integer'`,
    ),
    check(
      "dnd35_weapons_reach_feet_integer",
      sql`${t.reachFeet} is null or typeof(${t.reachFeet}) = 'integer'`,
    ),
    check(
      "dnd35_weapons_is_reach_integer",
      sql`${t.isReach} is null or typeof(${t.isReach}) = 'integer'`,
    ),
    primaryKey({ columns: [t.itemId] }),
    enumCheck("dnd35_weapons_proficiency_valid", t.proficiency, ["simple", "martial", "exotic"]),
    enumCheck("dnd35_weapons_handedness_valid", t.handedness, [
      "light",
      "one_handed",
      "two_handed",
      "ranged",
    ]),
    enumCheck("dnd35_weapons_kind_valid", t.attackKind, ["melee", "ranged", "both"]),
    enumCheck("dnd35_weapons_damage_mode_valid", t.damageTypeMode, ["and", "or"]),
    check(
      "dnd35_weapons_critical_valid",
      sql`${t.criticalThreatMinimum} between 2 and 20 and ${t.criticalMultiplier} >= 2`,
    ),
    positive("dnd35_weapons_range_valid", t.rangeIncrementFeet),
    nonNegative("dnd35_weapons_reach_valid", t.reachFeet),
    booleanCheck("dnd35_weapons_reach_bool", t.isReach),
  ],
);
export type Weapon = typeof weapons.$inferSelect;
export type NewWeapon = typeof weapons.$inferInsert;
export const weaponDamage = sqliteTable(
  "dnd35_weapon_damage",
  {
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.itemId, { onDelete: "cascade" }),
    size: text("size", { enum: sizes }).notNull(),
    /** End 1 is the main end; end 2 supports double weapons. */
    weaponEnd: integer("weapon_end").notNull().default(1),
    dice: text("dice").notNull(),
  },
  (t) => [
    check(
      "dnd35_weapon_damage_weapon_end_integer",
      sql`${t.weaponEnd} is null or typeof(${t.weaponEnd}) = 'integer'`,
    ),
    primaryKey({ columns: [t.weaponId, t.size, t.weaponEnd] }),
    enumCheck("dnd35_weapon_damage_size_valid", t.size, sizes),
    positive("dnd35_weapon_damage_end_valid", t.weaponEnd),
    nonEmpty("dnd35_weapon_damage_dice_nonempty", t.dice),
  ],
);
export type WeaponDamage = typeof weaponDamage.$inferSelect;
export type NewWeaponDamage = typeof weaponDamage.$inferInsert;
export const weaponDamageTypes = sqliteTable(
  "dnd35_weapon_damage_types",
  {
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.itemId, { onDelete: "cascade" }),
    damageType: text("damage_type", { enum: damageTypes }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.weaponId, t.damageType] }),
    enumCheck("dnd35_weapon_damage_types_valid", t.damageType, damageTypes),
  ],
);
export type WeaponDamageType = typeof weaponDamageTypes.$inferSelect;
export type NewWeaponDamageType = typeof weaponDamageTypes.$inferInsert;
