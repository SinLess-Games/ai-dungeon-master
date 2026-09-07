CREATE TABLE `game_encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`session_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`round_number` integer DEFAULT 1 NOT NULL,
	`active_turn_index` integer DEFAULT 0 NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT `game_encounters_round_positive` CHECK(`round_number` > 0),
	CONSTRAINT `game_encounters_turn_index_non_negative` CHECK(`active_turn_index` >= 0),
	CONSTRAINT `game_encounters_status_valid` CHECK(`status` IN ('active', 'completed', 'abandoned')),
	CONSTRAINT `game_encounters_end_timestamp_valid` CHECK(`status` = 'active' OR `ended_at` IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `game_encounters_campaign_status_idx` ON `game_encounters` (`campaign_id`,`status`);
--> statement-breakpoint
CREATE INDEX `game_encounters_session_status_idx` ON `game_encounters` (`session_id`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounters_one_active_per_session_uidx` ON `game_encounters` (`session_id`) WHERE `status` = 'active';
--> statement-breakpoint
CREATE TABLE `game_encounter_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`character_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`initiative_roll` integer NOT NULL,
	`initiative_modifier` integer NOT NULL,
	`initiative_total` integer NOT NULL,
	`tie_breaker` integer DEFAULT 0 NOT NULL,
	`turn_order` integer NOT NULL,
	`standard_available` integer DEFAULT 1 NOT NULL,
	`move_available` integer DEFAULT 1 NOT NULL,
	`swift_available` integer DEFAULT 1 NOT NULL,
	`swift_debt_next_turn` integer DEFAULT 0 NOT NULL,
	`attacks_of_opportunity_per_round` integer DEFAULT 1 NOT NULL,
	`attacks_of_opportunity_remaining` integer DEFAULT 1 NOT NULL,
	`last_turn_round` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `game_encounters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `game_encounter_participants_status_valid` CHECK(`status` IN ('active', 'defeated', 'removed')),
	CONSTRAINT `game_encounter_participants_initiative_roll_valid` CHECK(`initiative_roll` BETWEEN 1 AND 20),
	CONSTRAINT `game_encounter_participants_initiative_total_valid` CHECK(`initiative_total` = `initiative_roll` + `initiative_modifier`),
	CONSTRAINT `game_encounter_participants_turn_order_non_negative` CHECK(`turn_order` >= 0),
	CONSTRAINT `game_encounter_participants_aoo_non_negative` CHECK(`attacks_of_opportunity_per_round` >= 0 AND `attacks_of_opportunity_remaining` >= 0 AND `attacks_of_opportunity_remaining` <= `attacks_of_opportunity_per_round`),
	CONSTRAINT `game_encounter_participants_last_turn_round_non_negative` CHECK(`last_turn_round` >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_character_uidx` ON `game_encounter_participants` (`encounter_id`,`character_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_turn_order_uidx` ON `game_encounter_participants` (`encounter_id`,`turn_order`);
--> statement-breakpoint
CREATE INDEX `game_encounter_participants_encounter_status_idx` ON `game_encounter_participants` (`encounter_id`,`status`);
