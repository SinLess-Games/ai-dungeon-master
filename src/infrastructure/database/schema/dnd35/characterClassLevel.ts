import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { uuid, timestamps, enumCheck, nonNegative, positive } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { classLevels } from "./classLevel";
import { creatureTypes } from "./creatureType";
import { abilityKeys } from "./primitives";

export const characterClassLevels = sqliteTable(
  "dnd35_character_class_levels",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    classLevelId: text("class_level_id")
      .notNull()
      .references(() => classLevels.id, { onDelete: "restrict" }),
    /** Actual gained character level, including racial HD; not effective level (LA). */
    characterLevel: integer("character_level").notNull(),
    track: integer("track").notNull().default(1),
    /** Persist rolled/chosen HP before Constitution, never a derived maximum. */
    hitPointsGained: integer("hit_points_gained").notNull(),
    skillPointsSpent: integer("skill_points_spent").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_class_levels_character_level_integer",
      sql`${t.characterLevel} is null or typeof(${t.characterLevel}) = 'integer'`,
    ),
    check(
      "dnd35_character_class_levels_track_integer",
      sql`${t.track} is null or typeof(${t.track}) = 'integer'`,
    ),
    check(
      "dnd35_character_class_levels_hit_points_gained_integer",
      sql`${t.hitPointsGained} is null or typeof(${t.hitPointsGained}) = 'integer'`,
    ),
    check(
      "dnd35_character_class_levels_skill_points_spent_integer",
      sql`${t.skillPointsSpent} is null or typeof(${t.skillPointsSpent}) = 'integer'`,
    ),
    uniqueIndex("dnd35_character_class_levels_order_uq").on(
      t.characterId,
      t.track,
      t.characterLevel,
    ),
    uniqueIndex("dnd35_character_class_levels_class_step_uq").on(
      t.characterId,
      t.track,
      t.classLevelId,
    ),
    uniqueIndex("dnd35_character_class_levels_owner_uq").on(t.id, t.characterId),
    positive("dnd35_character_class_levels_level_valid", t.characterLevel),
    check("dnd35_character_class_levels_track_valid", sql`${t.track} in (1, 2)`),
    positive("dnd35_character_class_levels_hp_valid", t.hitPointsGained),
    nonNegative("dnd35_character_class_levels_skills_valid", t.skillPointsSpent),
  ],
);
export type CharacterClassLevel = typeof characterClassLevels.$inferSelect;
export type NewCharacterClassLevel = typeof characterClassLevels.$inferInsert;
export const characterRacialHitDice = sqliteTable(
  "dnd35_character_racial_hit_dice",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    creatureTypeId: text("creature_type_id")
      .notNull()
      .references(() => creatureTypes.id, { onDelete: "restrict" }),
    characterLevel: integer("character_level").notNull(),
    hitDie: integer("hit_die").notNull(),
    hitPointsGained: integer("hit_points_gained").notNull(),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_racial_hit_dice_character_level_integer",
      sql`${t.characterLevel} is null or typeof(${t.characterLevel}) = 'integer'`,
    ),
    check(
      "dnd35_character_racial_hit_dice_hit_die_integer",
      sql`${t.hitDie} is null or typeof(${t.hitDie}) = 'integer'`,
    ),
    check(
      "dnd35_character_racial_hit_dice_hit_points_gained_integer",
      sql`${t.hitPointsGained} is null or typeof(${t.hitPointsGained}) = 'integer'`,
    ),
    primaryKey({ columns: [t.characterId, t.characterLevel] }),
    positive("dnd35_character_rhd_level_valid", t.characterLevel),
    positive("dnd35_character_rhd_die_valid", t.hitDie),
    positive("dnd35_character_rhd_hp_valid", t.hitPointsGained),
  ],
);
export type CharacterRacialHitDie = typeof characterRacialHitDice.$inferSelect;
export type NewCharacterRacialHitDie = typeof characterRacialHitDice.$inferInsert;
export const characterAbilityIncreases = sqliteTable(
  "dnd35_character_ability_increases",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    characterLevel: integer("character_level").notNull(),
    ability: text("ability", { enum: abilityKeys }).notNull(),
    amount: integer("amount").notNull().default(1),
  },
  (t) => [
    check(
      "dnd35_character_ability_increases_character_level_integer",
      sql`${t.characterLevel} is null or typeof(${t.characterLevel}) = 'integer'`,
    ),
    check(
      "dnd35_character_ability_increases_amount_integer",
      sql`${t.amount} is null or typeof(${t.amount}) = 'integer'`,
    ),
    primaryKey({ columns: [t.characterId, t.characterLevel] }),
    positive("dnd35_character_increases_level_valid", t.characterLevel),
    enumCheck("dnd35_character_increases_ability_valid", t.ability, abilityKeys),
    positive("dnd35_character_increases_amount_valid", t.amount),
  ],
);
export type CharacterAbilityIncrease = typeof characterAbilityIncreases.$inferSelect;
export type NewCharacterAbilityIncrease = typeof characterAbilityIncreases.$inferInsert;
