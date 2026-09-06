import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * High-level lifecycle state of a campaign.
 */
export const campaignStatuses = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

/**
 * Determines whether a campaign is intended for one player
 * or multiple players.
 */
export const campaignPlayModes = [
  "solo",
  "multiplayer",
] as const;

export type CampaignPlayMode = (typeof campaignPlayModes)[number];

/**
 * Determines who performs the Game Master / Dungeon Master role.
 *
 * This remains system-agnostic so Endless Codex can support systems
 * that use terms other than Dungeon Master.
 */
export const campaignGameMasterModes = [
  "ai",
  "human",
  "hybrid",
] as const;

export type CampaignGameMasterMode =
  (typeof campaignGameMasterModes)[number];

/**
 * Controls how campaign time advances.
 *
 * paused:
 *   Time only changes through explicit game actions.
 *
 * session:
 *   Time advances while a session is actively being played.
 *
 * living:
 *   The world may continue progressing while players are offline.
 *
 * custom:
 *   Rules are supplied through campaign settings.
 */
export const campaignTimeModes = [
  "paused",
  "session",
  "living",
  "custom",
] as const;

export type CampaignTimeMode = (typeof campaignTimeModes)[number];

/**
 * Visibility controls who may discover or access the campaign.
 *
 * Authorization still belongs in the application/service layer.
 */
export const campaignVisibilities = [
  "private",
  "invite_only",
  "unlisted",
  "public",
] as const;

export type CampaignVisibility =
  (typeof campaignVisibilities)[number];

/**
 * Generic campaign configuration.
 *
 * Do not add D&D-specific properties here.
 *
 * Ruleset-specific configuration belongs under `ruleset`.
 * Examples:
 *
 * D&D 3.5:
 * {
 *   "epicLevels": true,
 *   "allowedSources": [...]
 * }
 *
 * Another system:
 * {
 *   "variantRules": [...]
 * }
 */
export interface CampaignSettings {
  /**
   * Arbitrary configuration owned by the selected ruleset plugin.
   */
  ruleset?: Record<string, unknown>;

  /**
   * Generic game-platform settings.
   */
  gameplay?: {
    allowHomebrew?: boolean;
    allowCharacterImport?: boolean;
    allowSpectators?: boolean;
    friendlyFire?: boolean;
  };

  /**
   * AI Game Master settings that are independent of a particular ruleset.
   */
  ai?: {
    enabled?: boolean;
    personalityId?: string;
    narrationStyle?: string;
    creativity?: number;
    strictRules?: boolean;
  };

  /**
   * Living-world/offline simulation configuration.
   */
  time?: {
    offlineProgressionEnabled?: boolean;
    offlineProgressionScale?: number;
    maximumOfflineHours?: number;
  };

  /**
   * Extension point for future generic campaign capabilities.
   */
  extensions?: Record<string, unknown>;
}

/**
 * Generic tabletop campaign.
 *
 * Campaigns belong to a world and select a ruleset, but they do not
 * contain system-specific rules data.
 *
 * System-specific character, class, feat, spell, power, etc. state belongs
 * in the appropriate ruleset schema, such as:
 *
 *   schema/dnd35/
 */
export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /**
     * User who owns/created the campaign.
     *
     * Stored as an ID rather than importing the auth schema here to keep
     * schema dependencies clean.
     */
    ownerUserId: text("owner_user_id").notNull(),

    /**
     * World in which this campaign takes place.
     *
     * Multiple campaigns may exist inside the same persistent world.
     */
    worldId: text("world_id").notNull(),

    /**
     * Ruleset/plugin identifier.
     *
     * Examples:
     *
     * dnd35
     * pathfinder1e
     * custom-fantasy
     *
     * Do not encode ruleset-specific columns into this table.
     */
    rulesetId: text("ruleset_id").notNull(),

    /**
     * Version of the ruleset used by this campaign.
     *
     * Pinning the version makes future ruleset upgrades and save
     * compatibility manageable.
     */
    rulesetVersion: text("ruleset_version").notNull(),

    name: text("name").notNull(),

    /**
     * URL/user-friendly identifier unique within the owner's campaigns.
     */
    slug: text("slug").notNull(),

    description: text("description"),

    /**
     * Optional Game Master-facing notes.
     *
     * These should not automatically be exposed to players.
     */
    notes: text("notes"),

    status: text("status")
      .$type<CampaignStatus>()
      .notNull()
      .default("draft"),

    playMode: text("play_mode")
      .$type<CampaignPlayMode>()
      .notNull()
      .default("solo"),

    gameMasterMode: text("game_master_mode")
      .$type<CampaignGameMasterMode>()
      .notNull()
      .default("ai"),

    timeMode: text("time_mode")
      .$type<CampaignTimeMode>()
      .notNull()
      .default("paused"),

    visibility: text("visibility")
      .$type<CampaignVisibility>()
      .notNull()
      .default("private"),

    /**
     * Maximum number of active player seats.
     *
     * Null means the application/ruleset determines the limit.
     */
    maxPlayers: integer("max_players"),

    /**
     * Seed used for deterministic campaign-specific generation.
     *
     * The campaign may share its world's seed while still having a
     * campaign-level generation seed for reproducibility.
     */
    generationSeed: text("generation_seed"),

    /**
     * Current in-world time represented in a system-independent manner.
     *
     * The interpretation of this value belongs to the simulation layer.
     * It is intentionally not a JavaScript Date because fantasy worlds
     * may use arbitrary calendars.
     */
    worldTime: integer("world_time")
      .notNull()
      .default(0),

    /**
     * Generic and ruleset-specific configuration.
     *
     * Frequently queried fields should become real columns instead of
     * being buried here.
     */
    settings: text("settings", {
      mode: "json",
    })
      .$type<CampaignSettings>()
      .notNull()
      .$defaultFn(() => ({})),

    /**
     * Last time meaningful game activity occurred.
     *
     * Useful for campaign dashboards and living-world simulation.
     */
    lastPlayedAt: integer("last_played_at", {
      mode: "timestamp",
    }),

    startedAt: integer("started_at", {
      mode: "timestamp",
    }),

    completedAt: integer("completed_at", {
      mode: "timestamp",
    }),

    createdAt: integer("created_at", {
      mode: "timestamp",
    })
      .notNull()
      .default(sql`(unixepoch())`),

    updatedAt: integer("updated_at", {
      mode: "timestamp",
    })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("campaigns_owner_slug_uidx").on(
      table.ownerUserId,
      table.slug,
    ),

    index("campaigns_owner_user_id_idx").on(table.ownerUserId),

    index("campaigns_world_id_idx").on(table.worldId),

    index("campaigns_ruleset_id_idx").on(table.rulesetId),

    index("campaigns_status_idx").on(table.status),

    index("campaigns_last_played_at_idx").on(table.lastPlayedAt),

    index("campaigns_world_status_idx").on(
      table.worldId,
      table.status,
    ),

    check(
      "campaigns_name_not_empty",
      sql`length(trim(${table.name})) > 0`,
    ),

    check(
      "campaigns_slug_not_empty",
      sql`length(trim(${table.slug})) > 0`,
    ),

    check(
      "campaigns_ruleset_id_not_empty",
      sql`length(trim(${table.rulesetId})) > 0`,
    ),

    check(
      "campaigns_ruleset_version_not_empty",
      sql`length(trim(${table.rulesetVersion})) > 0`,
    ),

    check(
      "campaigns_status_valid",
      sql`${table.status} IN (
        'draft',
        'active',
        'paused',
        'completed',
        'archived'
      )`,
    ),

    check(
      "campaigns_play_mode_valid",
      sql`${table.playMode} IN (
        'solo',
        'multiplayer'
      )`,
    ),

    check(
      "campaigns_game_master_mode_valid",
      sql`${table.gameMasterMode} IN (
        'ai',
        'human',
        'hybrid'
      )`,
    ),

    check(
      "campaigns_time_mode_valid",
      sql`${table.timeMode} IN (
        'paused',
        'session',
        'living',
        'custom'
      )`,
    ),

    check(
      "campaigns_visibility_valid",
      sql`${table.visibility} IN (
        'private',
        'invite_only',
        'unlisted',
        'public'
      )`,
    ),

    check(
      "campaigns_max_players_valid",
      sql`${table.maxPlayers} IS NULL OR ${table.maxPlayers} > 0`,
    ),

    check(
      "campaigns_world_time_non_negative",
      sql`${table.worldTime} >= 0`,
    ),
  ],
);

export type Campaign = typeof campaigns.$inferSelect;

export type NewCampaign = typeof campaigns.$inferInsert;