import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { gameSessions } from "./gameSession";

export interface PersistedGameEventDelta {
  id: string;
  entityId: string;
  path: string[];
  before: unknown;
  after: unknown;
  sourceId?: string;
  reason?: string;
}

export type PersistedGameEventPayload = Record<string, unknown>;

/**
 * Append-only authoritative campaign history.
 *
 * Event shape mirrors the generic engine event contract without importing the
 * engine into the persistence schema. Campaign sequence numbers are monotonic
 * and unique so replay order is unambiguous.
 */
export const gameEvents = sqliteTable(
  "game_events",
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
    sequence: integer("sequence").notNull(),
    eventType: text("event_type").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    actorId: text("actor_id"),
    sourceId: text("source_id"),
    targetIds: text("target_ids", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    payload: text("payload", { mode: "json" })
      .$type<PersistedGameEventPayload>()
      .notNull()
      .$defaultFn(() => ({})),
    deltas: text("deltas", { mode: "json" })
      .$type<PersistedGameEventDelta[]>()
      .notNull()
      .$defaultFn(() => []),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("game_events_campaign_sequence_uidx").on(table.campaignId, table.sequence),
    index("game_events_session_sequence_idx").on(table.sessionId, table.sequence),
    index("game_events_type_idx").on(table.eventType),
    check("game_events_sequence_positive", sql`${table.sequence} > 0`),
    check("game_events_type_not_empty", sql`length(trim(${table.eventType})) > 0`),
  ],
);

export type GameEvent = typeof gameEvents.$inferSelect;
export type NewGameEvent = typeof gameEvents.$inferInsert;
