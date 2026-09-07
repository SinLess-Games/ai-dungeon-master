import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { worlds } from "./world";

export const gameSessionStatuses = ["active", "ended", "abandoned"] as const;
export type GameSessionStatus = (typeof gameSessionStatuses)[number];

/**
 * A play session inside an already-started campaign.
 *
 * The first session is created atomically when campaign start finishes.
 */
export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "restrict" }),
    ordinal: integer("ordinal").notNull(),
    status: text("status").$type<GameSessionStatus>().notNull().default("active"),
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
    uniqueIndex("game_sessions_campaign_ordinal_uidx").on(table.campaignId, table.ordinal),
    index("game_sessions_campaign_status_idx").on(table.campaignId, table.status),
    index("game_sessions_world_idx").on(table.worldId),
    check("game_sessions_ordinal_positive", sql`${table.ordinal} > 0`),
    check(
      "game_sessions_status_valid",
      sql`${table.status} IN ('active', 'ended', 'abandoned')`,
    ),
    check(
      "game_sessions_end_timestamp_valid",
      sql`${table.status} = 'active' OR ${table.endedAt} IS NOT NULL`,
    ),
  ],
);

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
