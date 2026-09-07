PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `worlds` (
  `id` text PRIMARY KEY NOT NULL,
  `status` text DEFAULT 'generating' NOT NULL,
  `name` text,
  `generation_seed` text NOT NULL,
  `generator_version` text,
  `settings` text DEFAULT '{}' NOT NULL,
  `generated_at` integer,
  `failed_at` integer,
  `failure_reason` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  CONSTRAINT `worlds_seed_not_empty` CHECK(length(trim(`generation_seed`)) > 0),
  CONSTRAINT `worlds_status_valid` CHECK(`status` IN ('generating', 'ready', 'failed', 'archived')),
  CONSTRAINT `worlds_ready_has_generated_at` CHECK(`status` <> 'ready' OR `generated_at` IS NOT NULL),
  CONSTRAINT `worlds_failed_has_failed_at` CHECK(`status` <> 'failed' OR `failed_at` IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `worlds_status_idx` ON `worlds` (`status`);
--> statement-breakpoint
CREATE INDEX `worlds_generated_at_idx` ON `worlds` (`generated_at`);
--> statement-breakpoint

/*
 * Before this migration campaigns carried an unconstrained world_id even
 * though no generic worlds table existed. Preserve already-started campaign
 * data by materializing one runtime world per campaign. Draft campaigns lose
 * the placeholder world reference because worlds are now created at start.
 */
INSERT INTO `worlds` (
  `id`,
  `status`,
  `generation_seed`,
  `settings`,
  `generated_at`,
  `created_at`,
  `updated_at`
)
SELECT
  'legacy-world:' || `id`,
  CASE WHEN `status` = 'archived' THEN 'archived' ELSE 'ready' END,
  COALESCE(NULLIF(trim(`generation_seed`), ''), NULLIF(trim(`world_id`), ''), `id`),
  '{}',
  CASE WHEN `status` = 'archived' THEN NULL ELSE COALESCE(`started_at`, `created_at`) END,
  `created_at`,
  `updated_at`
FROM `campaigns`
WHERE `status` <> 'draft';
--> statement-breakpoint

CREATE TABLE `__new_campaigns` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL,
  `world_id` text REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE restrict,
  `ruleset_id` text NOT NULL,
  `ruleset_version` text NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `notes` text,
  `status` text DEFAULT 'draft' NOT NULL,
  `play_mode` text DEFAULT 'solo' NOT NULL,
  `game_master_mode` text DEFAULT 'ai' NOT NULL,
  `time_mode` text DEFAULT 'paused' NOT NULL,
  `visibility` text DEFAULT 'private' NOT NULL,
  `max_players` integer,
  `generation_seed` text,
  `world_time` integer DEFAULT 0 NOT NULL,
  `settings` text NOT NULL,
  `last_played_at` integer,
  `ready_at` integer,
  `start_requested_at` integer,
  `started_at` integer,
  `completed_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  CONSTRAINT `campaigns_name_not_empty` CHECK(length(trim(`name`)) > 0),
  CONSTRAINT `campaigns_slug_not_empty` CHECK(length(trim(`slug`)) > 0),
  CONSTRAINT `campaigns_owner_not_empty` CHECK(length(trim(`owner_user_id`)) > 0),
  CONSTRAINT `campaigns_ruleset_id_not_empty` CHECK(length(trim(`ruleset_id`)) > 0),
  CONSTRAINT `campaigns_ruleset_version_not_empty` CHECK(length(trim(`ruleset_version`)) > 0),
  CONSTRAINT `campaigns_status_valid` CHECK(`status` IN ('draft', 'ready', 'starting', 'active', 'paused', 'completed', 'archived')),
  CONSTRAINT `campaigns_play_mode_valid` CHECK(`play_mode` IN ('solo', 'multiplayer')),
  CONSTRAINT `campaigns_game_master_mode_valid` CHECK(`game_master_mode` IN ('ai', 'human', 'hybrid')),
  CONSTRAINT `campaigns_time_mode_valid` CHECK(`time_mode` IN ('paused', 'session', 'living', 'custom')),
  CONSTRAINT `campaigns_visibility_valid` CHECK(`visibility` IN ('private', 'invite_only', 'unlisted', 'public')),
  CONSTRAINT `campaigns_max_players_valid` CHECK(`max_players` IS NULL OR `max_players` > 0),
  CONSTRAINT `campaigns_world_time_non_negative` CHECK(`world_time` >= 0),
  CONSTRAINT `campaigns_world_lifecycle_valid` CHECK(
    (`status` IN ('draft', 'ready') AND `world_id` IS NULL)
    OR (`status` = 'starting')
    OR (`status` IN ('active', 'paused', 'completed') AND `world_id` IS NOT NULL)
    OR (`status` = 'archived')
  ),
  CONSTRAINT `campaigns_started_timestamp_valid` CHECK(
    `status` NOT IN ('active', 'paused', 'completed') OR `started_at` IS NOT NULL
  )
);
--> statement-breakpoint
INSERT INTO `__new_campaigns` (
  `id`,
  `owner_user_id`,
  `world_id`,
  `ruleset_id`,
  `ruleset_version`,
  `name`,
  `slug`,
  `description`,
  `notes`,
  `status`,
  `play_mode`,
  `game_master_mode`,
  `time_mode`,
  `visibility`,
  `max_players`,
  `generation_seed`,
  `world_time`,
  `settings`,
  `last_played_at`,
  `ready_at`,
  `start_requested_at`,
  `started_at`,
  `completed_at`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  `owner_user_id`,
  CASE WHEN `status` = 'draft' THEN NULL ELSE 'legacy-world:' || `id` END,
  `ruleset_id`,
  `ruleset_version`,
  `name`,
  `slug`,
  `description`,
  `notes`,
  `status`,
  `play_mode`,
  `game_master_mode`,
  `time_mode`,
  `visibility`,
  `max_players`,
  `generation_seed`,
  `world_time`,
  `settings`,
  `last_played_at`,
  NULL,
  NULL,
  CASE
    WHEN `status` IN ('active', 'paused', 'completed') THEN COALESCE(`started_at`, `created_at`)
    ELSE `started_at`
  END,
  `completed_at`,
  `created_at`,
  `updated_at`
FROM `campaigns`;
--> statement-breakpoint
DROP TABLE `campaigns`;
--> statement-breakpoint
ALTER TABLE `__new_campaigns` RENAME TO `campaigns`;
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_owner_slug_uidx` ON `campaigns` (`owner_user_id`, `slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_world_id_uidx` ON `campaigns` (`world_id`);
--> statement-breakpoint
CREATE INDEX `campaigns_owner_user_id_idx` ON `campaigns` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `campaigns_ruleset_id_idx` ON `campaigns` (`ruleset_id`);
--> statement-breakpoint
CREATE INDEX `campaigns_status_idx` ON `campaigns` (`status`);
--> statement-breakpoint
CREATE INDEX `campaigns_last_played_at_idx` ON `campaigns` (`last_played_at`);
--> statement-breakpoint
CREATE INDEX `campaigns_world_status_idx` ON `campaigns` (`world_id`, `status`);
--> statement-breakpoint

CREATE TABLE `characters` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  `owner_user_id` text,
  `ruleset_id` text NOT NULL,
  `ruleset_version` text NOT NULL,
  `name` text NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `metadata` text DEFAULT '{}' NOT NULL,
  `ready_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  CONSTRAINT `characters_name_not_empty` CHECK(length(trim(`name`)) > 0),
  CONSTRAINT `characters_ruleset_id_not_empty` CHECK(length(trim(`ruleset_id`)) > 0),
  CONSTRAINT `characters_ruleset_version_not_empty` CHECK(length(trim(`ruleset_version`)) > 0),
  CONSTRAINT `characters_status_valid` CHECK(`status` IN ('draft', 'ready', 'active', 'retired', 'archived')),
  CONSTRAINT `characters_ready_requires_campaign_owner` CHECK(
    `status` = 'draft' OR (`campaign_id` IS NOT NULL AND `owner_user_id` IS NOT NULL)
  ),
  CONSTRAINT `characters_ready_timestamp_valid` CHECK(
    `status` = 'draft' OR `ready_at` IS NOT NULL OR `status` IN ('retired', 'archived')
  )
);
--> statement-breakpoint
CREATE INDEX `characters_campaign_id_idx` ON `characters` (`campaign_id`);
--> statement-breakpoint
CREATE INDEX `characters_owner_user_id_idx` ON `characters` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `characters_campaign_status_idx` ON `characters` (`campaign_id`, `status`);
--> statement-breakpoint
CREATE INDEX `characters_ruleset_idx` ON `characters` (`ruleset_id`, `ruleset_version`);
--> statement-breakpoint

/* Backfill generic roots for any pre-existing D&D extension rows without inventing ownership. */
INSERT INTO `characters` (
  `id`,
  `campaign_id`,
  `owner_user_id`,
  `ruleset_id`,
  `ruleset_version`,
  `name`,
  `status`,
  `metadata`,
  `ready_at`,
  `created_at`,
  `updated_at`
)
SELECT
  `character_id`,
  NULL,
  NULL,
  'dnd35',
  '3.5',
  `character_id`,
  'draft',
  '{}',
  NULL,
  `created_at`,
  `updated_at`
FROM `dnd35_characters`;
--> statement-breakpoint

CREATE TABLE `campaign_memberships` (
  `campaign_id` text NOT NULL REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  `user_id` text NOT NULL,
  `role` text DEFAULT 'player' NOT NULL,
  `status` text DEFAULT 'invited' NOT NULL,
  `invited_at` integer DEFAULT (unixepoch()) NOT NULL,
  `joined_at` integer,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  PRIMARY KEY (`campaign_id`, `user_id`),
  CONSTRAINT `campaign_memberships_user_not_empty` CHECK(length(trim(`user_id`)) > 0),
  CONSTRAINT `campaign_memberships_role_valid` CHECK(`role` IN ('owner', 'gm', 'player', 'observer')),
  CONSTRAINT `campaign_memberships_status_valid` CHECK(`status` IN ('invited', 'active', 'left', 'removed')),
  CONSTRAINT `campaign_memberships_active_joined` CHECK(`status` <> 'active' OR `joined_at` IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `campaign_memberships_user_idx` ON `campaign_memberships` (`user_id`);
--> statement-breakpoint
CREATE INDEX `campaign_memberships_campaign_status_idx` ON `campaign_memberships` (`campaign_id`, `status`);
--> statement-breakpoint
INSERT INTO `campaign_memberships` (
  `campaign_id`,
  `user_id`,
  `role`,
  `status`,
  `invited_at`,
  `joined_at`,
  `updated_at`
)
SELECT
  `id`,
  `owner_user_id`,
  'owner',
  'active',
  `created_at`,
  `created_at`,
  `updated_at`
FROM `campaigns`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
