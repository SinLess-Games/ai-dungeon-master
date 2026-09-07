import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { worlds } from "./world";

/** High-level lifecycle state of a campaign. */
export const campaignStatuses = [
  "draft",
  "ready",
  "starting",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

/** Determines whether a campaign is intended for one player or multiple players. */
export const campaignPlayModes = ["solo", "multiplayer"] as const;
export type CampaignPlayMode = (typeof campaignPlayModes)[number];

/** Determines who performs the Game Master / Dungeon Master role. */
export const campaignGameMasterModes = ["ai", "human", "hybrid"] as const;
export type CampaignGameMasterMode = (typeof campaignGameMasterModes)[number];

/** Controls how campaign time advances. */
export const campaignTimeModes = ["paused", "session", "living", "custom"] as const;
export type CampaignTimeMode = (typeof campaignTimeModes)[number];

/** Visibility controls who may discover or access the campaign. */
export const campaignVisibilities = ["private", "invite_only", "unlisted", "public"] as const;
export type CampaignVisibility = (typeof campaignVisibilities)[number];

/** Generic campaign configuration. Do not add ruleset-specific properties here. */
export interface CampaignSettings {
  ruleset?: Record<string, unknown>;
  gameplay?: {
    allowHomebrew?: boolean;
    allowCharacterImport?: boolean;
    allowSpectators?: boolean;
    friendlyFire?: boolean;
  };
  ai?: {
    enabled?: boolean;
    personalityId?: string;
    narrationStyle?: string;
    creativity?: number;
    strictRules?: boolean;
  };
  time?: {
    offlineProgressionEnabled?: boolean;
    offlineProgressionScale?: number;
    maximumOfflineHours?: number;
  };
  extensions?: Record<string, unknown>;
}

/**
 * Generic tabletop campaign.
 *
 * A campaign exists before its world. Users configure a draft campaign and
 * create at least one rules-valid character first. When start is requested the
 * application creates a `generating` world, attaches it to the campaign while
 * status is `starting`, then activates the campaign only after generation
 * completes successfully.
 */
export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /** User who owns/created the campaign. */
    ownerUserId: text("owner_user_id").notNull(),

    /**
     * Runtime world allocated only when campaign start begins.
     * Draft and ready campaigns must keep this null.
     */
    worldId: text("world_id").references(() => worlds.id, { onDelete: "restrict" }),

    /** Ruleset/plugin identifier, for example `dnd35`. */
    rulesetId: text("ruleset_id").notNull(),

    /** Pinned ruleset version for save compatibility. */
    rulesetVersion: text("ruleset_version").notNull(),

    name: text("name").notNull(),

    /** URL/user-friendly identifier unique within the owner's campaigns. */
    slug: text("slug").notNull(),

    description: text("description"),

    /** Optional Game Master-facing notes. */
    notes: text("notes"),

    status: text("status").$type<CampaignStatus>().notNull().default("draft"),

    playMode: text("play_mode").$type<CampaignPlayMode>().notNull().default("solo"),

    gameMasterMode: text("game_master_mode")
      .$type<CampaignGameMasterMode>()
      .notNull()
      .default("ai"),

    timeMode: text("time_mode").$type<CampaignTimeMode>().notNull().default("paused"),

    visibility: text("visibility")
      .$type<CampaignVisibility>()
      .notNull()
      .default("private"),

    /** Maximum number of active player seats; null delegates to application/ruleset policy. */
    maxPlayers: integer("max_players"),

    /** Seed for deterministic campaign/world generation. */
    generationSeed: text("generation_seed"),

    /** System-independent current in-world time. */
    worldTime: integer("world_time").notNull().default(0),

    settings: text("settings", { mode: "json" })
      .$type<CampaignSettings>()
      .notNull()
      .$defaultFn(() => ({})),

    lastPlayedAt: integer("last_played_at", { mode: "timestamp" }),

    /** Set when pre-start validation first reaches a ready state. */
    readyAt: integer("ready_at", { mode: "timestamp" }),

    /** Set when world generation/start orchestration begins. */
    startRequestedAt: integer("start_requested_at", { mode: "timestamp" }),

    /** Set only after the generated world is ready and the campaign becomes active. */
    startedAt: integer("started_at", { mode: "timestamp" }),

    completedAt: integer("completed_at", { mode: "timestamp" }),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),

    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("campaigns_owner_slug_uidx").on(table.ownerUserId, table.slug),

    /** A generated runtime world belongs to at most one campaign. */
    uniqueIndex("campaigns_world_id_uidx").on(table.worldId),

    index("campaigns_owner_user_id_idx").on(table.ownerUserId),
    index("campaigns_ruleset_id_idx").on(table.rulesetId),
    index("campaigns_status_idx").on(table.status),
    index("campaigns_last_played_at_idx").on(table.lastPlayedAt),
    index("campaigns_world_status_idx").on(table.worldId, table.status),

    check("campaigns_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("campaigns_slug_not_empty", sql`length(trim(${table.slug})) > 0`),
    check("campaigns_owner_not_empty", sql`length(trim(${table.ownerUserId})) > 0`),
    check("campaigns_ruleset_id_not_empty", sql`length(trim(${table.rulesetId})) > 0`),
    check(
      "campaigns_ruleset_version_not_empty",
      sql`length(trim(${table.rulesetVersion})) > 0`,
    ),
    check(
      "campaigns_status_valid",
      sql`${table.status} IN ('draft', 'ready', 'starting', 'active', 'paused', 'completed', 'archived')`,
    ),
    check("campaigns_play_mode_valid", sql`${table.playMode} IN ('solo', 'multiplayer')`),
    check(
      "campaigns_game_master_mode_valid",
      sql`${table.gameMasterMode} IN ('ai', 'human', 'hybrid')`,
    ),
    check(
      "campaigns_time_mode_valid",
      sql`${table.timeMode} IN ('paused', 'session', 'living', 'custom')`,
    ),
    check(
      "campaigns_visibility_valid",
      sql`${table.visibility} IN ('private', 'invite_only', 'unlisted', 'public')`,
    ),
    check(
      "campaigns_max_players_valid",
      sql`${table.maxPlayers} IS NULL OR ${table.maxPlayers} > 0`,
    ),
    check("campaigns_world_time_non_negative", sql`${table.worldTime} >= 0`),
    check(
      "campaigns_world_lifecycle_valid",
      sql`(
        ${table.status} IN ('draft', 'ready') AND ${table.worldId} IS NULL
      ) OR (
        ${table.status} = 'starting'
      ) OR (
        ${table.status} IN ('active', 'paused', 'completed') AND ${table.worldId} IS NOT NULL
      ) OR (
        ${table.status} = 'archived'
      )`,
    ),
    check(
      "campaigns_started_timestamp_valid",
      sql`${table.status} NOT IN ('active', 'paused', 'completed') OR ${table.startedAt} IS NOT NULL`,
    ),
  ],
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
