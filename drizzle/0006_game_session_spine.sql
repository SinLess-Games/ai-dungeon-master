CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`world_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `game_sessions_ordinal_positive` CHECK(`ordinal` > 0),
	CONSTRAINT `game_sessions_status_valid` CHECK(`status` IN ('active', 'ended', 'abandoned')),
	CONSTRAINT `game_sessions_end_timestamp_valid` CHECK(`status` = 'active' OR `ended_at` IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_sessions_campaign_ordinal_uidx` ON `game_sessions` (`campaign_id`,`ordinal`);
--> statement-breakpoint
CREATE INDEX `game_sessions_campaign_status_idx` ON `game_sessions` (`campaign_id`,`status`);
--> statement-breakpoint
CREATE INDEX `game_sessions_world_idx` ON `game_sessions` (`world_id`);
--> statement-breakpoint
CREATE TABLE `game_events` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`session_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`actor_id` text,
	`source_id` text,
	`target_ids` text NOT NULL,
	`payload` text NOT NULL,
	`deltas` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT `game_events_sequence_positive` CHECK(`sequence` > 0),
	CONSTRAINT `game_events_type_not_empty` CHECK(length(trim(`event_type`)) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_events_campaign_sequence_uidx` ON `game_events` (`campaign_id`,`sequence`);
--> statement-breakpoint
CREATE INDEX `game_events_session_sequence_idx` ON `game_events` (`session_id`,`sequence`);
--> statement-breakpoint
CREATE INDEX `game_events_type_idx` ON `game_events` (`event_type`);
