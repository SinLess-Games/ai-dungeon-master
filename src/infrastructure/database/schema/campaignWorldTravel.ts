import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { campaigns } from "./campaign";
import { worlds } from "./world";

export const worldWeatherKinds = [
  "clear",
  "rain",
  "snow",
  "heavy-snow",
  "sleet",
  "hail",
  "fog",
  "storm",
  "blizzard",
  "duststorm",
] as const;
export type WorldWeatherKind = (typeof worldWeatherKinds)[number];

export const worldDiscoveryEntityKinds = ["region", "place", "path"] as const;
export type WorldDiscoveryEntityKind = (typeof worldDiscoveryEntityKinds)[number];

export const travelEventStatuses = ["completed", "encounter-pending", "encounter-resolved"] as const;
export type TravelEventStatus = (typeof travelEventStatuses)[number];

/** Shared party position and current world-weather state for one active campaign world. */
export const campaignWorldStates = sqliteTable(
  "campaign_world_states",
  {
    campaignId: text("campaign_id")
      .primaryKey()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    currentPlaceId: text("current_place_id"),
    currentX: real("current_x").notNull().default(0),
    currentY: real("current_y").notNull().default(0),
    elapsedMinutes: integer("elapsed_minutes").notNull().default(0),
    weather: text("weather").$type<WorldWeatherKind>().notNull().default("clear"),
    weatherDay: integer("weather_day").notNull().default(0),
    revision: integer("revision").notNull().default(1),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("campaign_world_states_world_idx").on(table.worldId),
    check("campaign_world_states_elapsed_non_negative", sql`${table.elapsedMinutes} >= 0`),
    check("campaign_world_states_weather_day_non_negative", sql`${table.weatherDay} >= 0`),
    check("campaign_world_states_revision_positive", sql`${table.revision} > 0`),
    check(
      "campaign_world_states_weather_valid",
      sql`${table.weather} IN ('clear','rain','snow','heavy-snow','sleet','hail','fog','storm','blizzard','duststorm')`,
    ),
  ],
);

/** Per-player discovery/fog state. Owners/GMs may still choose to inspect the full atlas. */
export const campaignWorldDiscoveries = sqliteTable(
  "campaign_world_discoveries",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    entityKind: text("entity_kind").$type<WorldDiscoveryEntityKind>().notNull(),
    entityId: text("entity_id").notNull(),
    discoveredAt: integer("discovered_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.userId, table.entityKind, table.entityId] }),
    index("campaign_world_discoveries_user_idx").on(table.userId, table.campaignId),
    check("campaign_world_discoveries_entity_id_not_empty", sql`length(trim(${table.entityId})) > 0`),
    check(
      "campaign_world_discoveries_kind_valid",
      sql`${table.entityKind} IN ('region','place','path')`,
    ),
  ],
);

/** Append-only route/timing/encounter audit for completed party travel actions. */
export const campaignTravelEvents = sqliteTable(
  "campaign_travel_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    requestedUserId: text("requested_user_id").notNull(),
    fromPlaceId: text("from_place_id"),
    toPlaceId: text("to_place_id").notNull(),
    routePlaceIds: text("route_place_ids", { mode: "json" }).$type<string[]>().notNull(),
    routePathIds: text("route_path_ids", { mode: "json" }).$type<string[]>().notNull(),
    distanceMiles: real("distance_miles").notNull(),
    travelMinutes: integer("travel_minutes").notNull(),
    elapsedClockMinutes: integer("elapsed_clock_minutes").notNull(),
    partySpeedFeet: integer("party_speed_feet").notNull(),
    terrainMultiplier: real("terrain_multiplier").notNull(),
    weather: text("weather").$type<WorldWeatherKind>().notNull(),
    weatherMultiplier: real("weather_multiplier").notNull(),
    encounterRolls: text("encounter_rolls", { mode: "json" }).$type<number[]>().notNull(),
    encounterThreshold: integer("encounter_threshold").notNull(),
    encounterTriggered: integer("encounter_triggered", { mode: "boolean" }).notNull().default(false),
    status: text("status").$type<TravelEventStatus>().notNull().default("completed"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("campaign_travel_events_campaign_created_idx").on(table.campaignId, table.createdAt),
    check("campaign_travel_events_distance_positive", sql`${table.distanceMiles} > 0`),
    check("campaign_travel_events_minutes_positive", sql`${table.travelMinutes} > 0`),
    check("campaign_travel_events_clock_minutes_positive", sql`${table.elapsedClockMinutes} > 0`),
    check("campaign_travel_events_speed_positive", sql`${table.partySpeedFeet} > 0`),
    check(
      "campaign_travel_events_weather_valid",
      sql`${table.weather} IN ('clear','rain','snow','heavy-snow','sleet','hail','fog','storm','blizzard','duststorm')`,
    ),
    check(
      "campaign_travel_events_status_valid",
      sql`${table.status} IN ('completed','encounter-pending','encounter-resolved')`,
    ),
  ],
);

export type CampaignWorldState = typeof campaignWorldStates.$inferSelect;
export type CampaignWorldDiscovery = typeof campaignWorldDiscoveries.$inferSelect;
export type CampaignTravelEvent = typeof campaignTravelEvents.$inferSelect;
