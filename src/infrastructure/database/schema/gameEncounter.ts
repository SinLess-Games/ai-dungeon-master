import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { gameSessions } from "./gameSession";

export const gameEncounterStatuses = ["active", "completed", "abandoned"] as const;
export type GameEncounterStatus = (typeof gameEncounterStatuses)[number];

/**
 * A deterministic turn cycle inside one active game session.
 *
 * Encounters are runtime state. They never exist before a campaign starts and
 * at most one encounter may be active inside a session at a time.
 */
export const gameEncounters = sqliteTable(
  "game_encounters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    status: text("status").$type<GameEncounterStatus>().notNull().default("active"),
    roundNumber: integer("round_number").notNull().default(1),
    activeTurnIndex: integer("active_turn_index").notNull().default(0),
    startedAt: integer("started_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("game_encounters_campaign_status_idx").on(table.campaignId, table.status),
    index("game_encounters_session_status_idx").on(table.sessionId, table.status),
    uniqueIndex("game_encounters_one_active_per_session_uidx")
      .on(table.sessionId)
      .where(sql`${table.status} = 'active'`),
    check("game_encounters_round_positive", sql`${table.roundNumber} > 0`),
    check("game_encounters_turn_index_non_negative", sql`${table.activeTurnIndex} >= 0`),
    check(
      "game_encounters_status_valid",
      sql`${table.status} IN ('active', 'completed', 'abandoned')`,
    ),
    check(
      "game_encounters_end_timestamp_valid",
      sql`${table.status} = 'active' OR ${table.endedAt} IS NOT NULL`,
    ),
  ],
);

export type GameEncounter = typeof gameEncounters.$inferSelect;
export type NewGameEncounter = typeof gameEncounters.$inferInsert;
