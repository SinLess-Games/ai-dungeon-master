import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuid, timestamps, enumCheck, nonNegative, jsonCheck } from "./schemaUtils";
import { dnd35Characters } from "./character";
import { conditions } from "./condition";
import { spells } from "./spell";
import { powers } from "./power";
import type { RuleChoice, RuleEffect, RuleExtension } from "./primitives";

/** Small instance state for durations, variable magnitudes, and source-dependent effects. */
export interface ConditionState {
  saveDc?: number;
  casterLevel?: number;
  choices?: RuleChoice[];
  effects?: RuleEffect[];
  extension?: RuleExtension;
}
export const characterConditions = sqliteTable(
  "dnd35_character_conditions",
  {
    id: uuid(),
    characterId: text("character_id")
      .notNull()
      .references(() => dnd35Characters.characterId, { onDelete: "cascade" }),
    conditionId: text("condition_id")
      .notNull()
      .references(() => conditions.id, { onDelete: "restrict" }),
    sourceSpellId: text("source_spell_id").references(() => spells.id, { onDelete: "restrict" }),
    sourcePowerId: text("source_power_id").references(() => powers.id, { onDelete: "restrict" }),
    /** Generic source character/encounter IDs are resolved outside this ruleset. */
    sourceCharacterId: text("source_character_id"),
    encounterId: text("encounter_id"),
    /**
     * Encounter-relative expiry anchor for round-based effects.
     *
     * A condition that lasts N rounds expires immediately before the turn slot
     * at which it was applied is reached N rounds later. These fields are only
     * populated when the condition was applied to a participant in an active
     * encounter; D1 remains the persistent source of truth for the anchor.
     */
    expiresEncounterRound: integer("expires_encounter_round"),
    expiresTurnOrder: integer("expires_turn_order"),
    sourceDescription: text("source_description"),
    durationKind: text("duration_kind", {
      enum: ["rounds", "until_time", "permanent", "concentration", "special"],
    }).notNull(),
    remainingRounds: integer("remaining_rounds"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    state: text("state", { mode: "json" }).$type<ConditionState>(),
    ...timestamps(),
  },
  (t) => [
    check(
      "dnd35_character_conditions_remaining_rounds_integer",
      sql`${t.remainingRounds} is null or typeof(${t.remainingRounds}) = 'integer'`,
    ),
    check(
      "dnd35_character_conditions_expires_at_integer",
      sql`${t.expiresAt} is null or typeof(${t.expiresAt}) = 'integer'`,
    ),
    check(
      "dnd35_character_conditions_expires_encounter_round_integer",
      sql`${t.expiresEncounterRound} is null or typeof(${t.expiresEncounterRound}) = 'integer'`,
    ),
    check(
      "dnd35_character_conditions_expires_turn_order_integer",
      sql`${t.expiresTurnOrder} is null or typeof(${t.expiresTurnOrder}) = 'integer'`,
    ),
    index("dnd35_character_conditions_character_idx").on(t.characterId, t.conditionId),
    index("dnd35_character_conditions_expiry_idx").on(t.expiresAt),
    index("dnd35_character_conditions_encounter_expiry_idx").on(
      t.encounterId,
      t.expiresEncounterRound,
      t.expiresTurnOrder,
    ),
    enumCheck("dnd35_character_conditions_duration_valid", t.durationKind, [
      "rounds",
      "until_time",
      "permanent",
      "concentration",
      "special",
    ]),
    nonNegative("dnd35_character_conditions_rounds_valid", t.remainingRounds),
    nonNegative("dnd35_character_conditions_expires_turn_order_valid", t.expiresTurnOrder),
    check(
      "dnd35_character_conditions_expires_round_valid",
      sql`${t.expiresEncounterRound} is null or ${t.expiresEncounterRound} >= 1`,
    ),
    jsonCheck("dnd35_character_conditions_state_json", t.state),
    check(
      "dnd35_character_conditions_duration_state_valid",
      sql`
 (${t.durationKind} = 'rounds' and ${t.remainingRounds} is not null and ${t.expiresAt} is null) or
 (${t.durationKind} = 'until_time' and ${t.expiresAt} is not null and ${t.remainingRounds} is null) or
 (${t.durationKind} in ('permanent', 'concentration', 'special') and ${t.expiresAt} is null and ${t.remainingRounds} is null)`,
    ),
    check(
      "dnd35_character_conditions_encounter_expiry_pair_valid",
      sql`
 (${t.expiresEncounterRound} is null and ${t.expiresTurnOrder} is null) or
 (${t.durationKind} = 'rounds' and ${t.encounterId} is not null and
  ${t.expiresEncounterRound} is not null and ${t.expiresTurnOrder} is not null)`,
    ),
  ],
);
export type CharacterCondition = typeof characterConditions.$inferSelect;
export type NewCharacterCondition = typeof characterConditions.$inferInsert;
