ALTER TABLE `game_encounter_participants` RENAME TO `game_encounter_participants_actor_strict`;
--> statement-breakpoint
CREATE TABLE `game_encounter_participants` (
  `id` text PRIMARY KEY NOT NULL,
  `encounter_id` text NOT NULL,
  `actor_id` text,
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
  FOREIGN KEY (`actor_id`) REFERENCES `game_actors`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `game_encounter_participants_status_valid` CHECK(`status` IN ('active', 'defeated', 'removed')),
  CONSTRAINT `game_encounter_participants_initiative_roll_valid` CHECK(`initiative_roll` BETWEEN 1 AND 20),
  CONSTRAINT `game_encounter_participants_initiative_total_valid` CHECK(`initiative_total` = `initiative_roll` + `initiative_modifier`),
  CONSTRAINT `game_encounter_participants_turn_order_non_negative` CHECK(`turn_order` >= 0),
  CONSTRAINT `game_encounter_participants_aoo_non_negative` CHECK(`attacks_of_opportunity_per_round` >= 0 AND `attacks_of_opportunity_remaining` >= 0 AND `attacks_of_opportunity_remaining` <= `attacks_of_opportunity_per_round`),
  CONSTRAINT `game_encounter_participants_last_turn_round_non_negative` CHECK(`last_turn_round` >= 0)
);
--> statement-breakpoint
INSERT INTO `game_encounter_participants` (
  `id`, `encounter_id`, `actor_id`, `character_id`, `status`,
  `initiative_roll`, `initiative_modifier`, `initiative_total`, `tie_breaker`, `turn_order`,
  `standard_available`, `move_available`, `swift_available`, `swift_debt_next_turn`,
  `attacks_of_opportunity_per_round`, `attacks_of_opportunity_remaining`, `last_turn_round`,
  `created_at`, `updated_at`
)
SELECT `id`, `encounter_id`, `actor_id`, COALESCE(`character_id`, `actor_id`), `status`,
       `initiative_roll`, `initiative_modifier`, `initiative_total`, `tie_breaker`, `turn_order`,
       `standard_available`, `move_available`, `swift_available`, `swift_debt_next_turn`,
       `attacks_of_opportunity_per_round`, `attacks_of_opportunity_remaining`, `last_turn_round`,
       `created_at`, `updated_at`
FROM `game_encounter_participants_actor_strict`;
--> statement-breakpoint
DROP TABLE `game_encounter_participants_actor_strict`;
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_actor_uidx` ON `game_encounter_participants` (`encounter_id`,`actor_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_identity_uidx` ON `game_encounter_participants` (`encounter_id`,`character_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_turn_order_uidx` ON `game_encounter_participants` (`encounter_id`,`turn_order`);
--> statement-breakpoint
CREATE INDEX `game_encounter_participants_encounter_status_idx` ON `game_encounter_participants` (`encounter_id`,`status`);
