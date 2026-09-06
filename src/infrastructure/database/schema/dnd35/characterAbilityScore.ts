import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { timestamps, enumCheck, nonNegative } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { abilityKeys } from "./primitives";

export const characterAbilityScores = sqliteTable(
  "dnd35_character_ability_scores",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    ability: text("ability", { enum: abilityKeys }).notNull(),
    /** NULL denotes a nonability. Character creation inserts all six keys atomically.
     * Base excludes racial modifiers, level increases, damage/drain, and effects. */
    baseScore: integer("base_score"),
    inherentBonus: integer("inherent_bonus").notNull().default(0),
    abilityDamage: integer("ability_damage").notNull().default(0),
    abilityDrain: integer("ability_drain").notNull().default(0),
    /** Manual persisted adjustment; sourced temporary effects live in characterConditions. */
    temporaryAdjustment: integer("temporary_adjustment").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_ability_scores_base_score_integer",
      sql`${t.baseScore} is null or typeof(${t.baseScore}) = 'integer'`,
    ),
    check(
      "dnd35_character_ability_scores_inherent_bonus_integer",
      sql`${t.inherentBonus} is null or typeof(${t.inherentBonus}) = 'integer'`,
    ),
    check(
      "dnd35_character_ability_scores_ability_damage_integer",
      sql`${t.abilityDamage} is null or typeof(${t.abilityDamage}) = 'integer'`,
    ),
    check(
      "dnd35_character_ability_scores_ability_drain_integer",
      sql`${t.abilityDrain} is null or typeof(${t.abilityDrain}) = 'integer'`,
    ),
    check(
      "dnd35_character_ability_scores_temporary_adjustment_integer",
      sql`${t.temporaryAdjustment} is null or typeof(${t.temporaryAdjustment}) = 'integer'`,
    ),
    primaryKey({ columns: [t.characterId, t.ability] }),
    enumCheck("dnd35_character_ability_scores_key_valid", t.ability, abilityKeys),
    nonNegative("dnd35_character_ability_scores_base_valid", t.baseScore),
    nonNegative("dnd35_character_ability_scores_inherent_valid", t.inherentBonus),
    nonNegative("dnd35_character_ability_scores_damage_valid", t.abilityDamage),
    nonNegative("dnd35_character_ability_scores_drain_valid", t.abilityDrain),
    check(
      "dnd35_character_ability_scores_nonability_valid",
      sql`${t.baseScore} is not null or (${t.inherentBonus} = 0 and ${t.abilityDamage} = 0 and ${t.abilityDrain} = 0 and ${t.temporaryAdjustment} = 0)`,
    ),
  ],
);
export type CharacterAbilityScore = typeof characterAbilityScores.$inferSelect;
export type NewCharacterAbilityScore = typeof characterAbilityScores.$inferInsert;
