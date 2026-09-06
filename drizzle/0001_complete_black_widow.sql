CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`world_id` text NOT NULL,
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
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "campaigns_name_not_empty" CHECK(length(trim("campaigns"."name")) > 0),
	CONSTRAINT "campaigns_slug_not_empty" CHECK(length(trim("campaigns"."slug")) > 0),
	CONSTRAINT "campaigns_ruleset_id_not_empty" CHECK(length(trim("campaigns"."ruleset_id")) > 0),
	CONSTRAINT "campaigns_ruleset_version_not_empty" CHECK(length(trim("campaigns"."ruleset_version")) > 0),
	CONSTRAINT "campaigns_status_valid" CHECK("campaigns"."status" IN (
        'draft',
        'active',
        'paused',
        'completed',
        'archived'
      )),
	CONSTRAINT "campaigns_play_mode_valid" CHECK("campaigns"."play_mode" IN (
        'solo',
        'multiplayer'
      )),
	CONSTRAINT "campaigns_game_master_mode_valid" CHECK("campaigns"."game_master_mode" IN (
        'ai',
        'human',
        'hybrid'
      )),
	CONSTRAINT "campaigns_time_mode_valid" CHECK("campaigns"."time_mode" IN (
        'paused',
        'session',
        'living',
        'custom'
      )),
	CONSTRAINT "campaigns_visibility_valid" CHECK("campaigns"."visibility" IN (
        'private',
        'invite_only',
        'unlisted',
        'public'
      )),
	CONSTRAINT "campaigns_max_players_valid" CHECK("campaigns"."max_players" IS NULL OR "campaigns"."max_players" > 0),
	CONSTRAINT "campaigns_world_time_non_negative" CHECK("campaigns"."world_time" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_owner_slug_uidx` ON `campaigns` (`owner_user_id`,`slug`);--> statement-breakpoint
CREATE INDEX `campaigns_owner_user_id_idx` ON `campaigns` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `campaigns_world_id_idx` ON `campaigns` (`world_id`);--> statement-breakpoint
CREATE INDEX `campaigns_ruleset_id_idx` ON `campaigns` (`ruleset_id`);--> statement-breakpoint
CREATE INDEX `campaigns_status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `campaigns_last_played_at_idx` ON `campaigns` (`last_played_at`);--> statement-breakpoint
CREATE INDEX `campaigns_world_status_idx` ON `campaigns` (`world_id`,`status`);