import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { characters } from "./character";
import { gameActors } from "./gameActor";
import { gameEncounters } from "./gameEncounter";

export const gameEncounterParticipantStatuses = ["active", "defeated", "removed"] as const;
export type GameEncounterParticipantStatus = (typeof gameEncounterParticipantStatuses)[number];

/**
 * Initiative order plus persistent per-turn action economy for any runtime actor.
 * `actorId` is the canonical runtime identity. `characterId` is retained only as
 * an optional compatibility/read convenience for actors backed by characters.
 */
export const gameEncounterParticipants = sqliteTable(
  "game_encounter_participants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    encounterId: text("encounter_id")
      .notNull()
      .references(() => gameEncounters.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => gameActors.id, { onDelete: "restrict" }),
    characterId: text("character_id").references(() => characters.id, { onDelete: "restrict" }),
    status: text("status").$type<GameEncounterParticipantStatus>().notNull().default("active"),
    initiativeRoll: integer("initiative_roll").notNull(),
    initiativeModifier: integer("initiative_modifier").notNull(),
    initiativeTotal: integer("initiative_total").notNull(),
    tieBreaker: integer("tie_breaker").notNull().default(0),
    turnOrder: integer("turn_order").notNull(),
    standardAvailable: integer("standard_available", { mode: "boolean" }).notNull().default(true),
    moveAvailable: integer("move_available", { mode: "boolean" }).notNull().default(true),
    swiftAvailable: integer("swift_available", { mode: "boolean" }).notNull().default(true),
    swiftDebtNextTurn: integer("swift_debt_next_turn", { mode: "boolean" }).notNull().default(false),
    attacksOfOpportunityPerRound: integer("attacks_of_opportunity_per_round").notNull().default(1),
    attacksOfOpportunityRemaining: integer("attacks_of_opportunity_remaining").notNull().default(1),
    lastTurnRound: integer("last_turn_round").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("game_encounter_participants_actor_uidx").on(table.encounterId, table.actorId),
    uniqueIndex("game_encounter_participants_turn_order_uidx").on(
      table.encounterId,
      table.turnOrder,
    ),
    index("game_encounter_participants_encounter_status_idx").on(table.encounterId, table.status),
    index("game_encounter_participants_character_idx").on(table.characterId),
    check(
      "game_encounter_participants_status_valid",
      sql`${table.status} IN ('active', 'defeated', 'removed')`,
    ),
    check(
      "game_encounter_participants_initiative_roll_valid",
      sql`${table.initiativeRoll} BETWEEN 1 AND 20`,
    ),
    check(
      "game_encounter_participants_initiative_total_valid",
      sql`${table.initiativeTotal} = ${table.initiativeRoll} + ${table.initiativeModifier}`,
    ),
    check("game_encounter_participants_turn_order_non_negative", sql`${table.turnOrder} >= 0`),
    check(
      "game_encounter_participants_aoo_non_negative",
      sql`${table.attacksOfOpportunityPerRound} >= 0 AND ${table.attacksOfOpportunityRemaining} >= 0 AND ${table.attacksOfOpportunityRemaining} <= ${table.attacksOfOpportunityPerRound}`,
    ),
    check("game_encounter_participants_last_turn_round_non_negative", sql`${table.lastTurnRound} >= 0`),
  ],
);

export type GameEncounterParticipant = typeof gameEncounterParticipants.$inferSelect;
export type NewGameEncounterParticipant = typeof gameEncounterParticipants.$inferInsert;
