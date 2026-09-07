CREATE TABLE `game_actors` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text NOT NULL,
  `world_id` text NOT NULL,
  `kind` text NOT NULL,
  `character_id` text,
  `controller_user_id` text,
  `name` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `metadata` text DEFAULT '{}' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `game_actors_name_not_empty` CHECK(length(trim(`name`)) > 0),
  CONSTRAINT `game_actors_kind_valid` CHECK(`kind` IN ('character', 'monster', 'npc')),
  CONSTRAINT `game_actors_status_valid` CHECK(`status` IN ('active', 'defeated', 'removed', 'archived')),
  CONSTRAINT `game_actors_character_link_valid` CHECK((`kind` = 'character' AND `character_id` IS NOT NULL) OR (`kind` <> 'character' AND `character_id` IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_actors_character_uidx` ON `game_actors` (`character_id`);
--> statement-breakpoint
CREATE INDEX `game_actors_campaign_status_idx` ON `game_actors` (`campaign_id`,`status`);
--> statement-breakpoint
CREATE INDEX `game_actors_world_kind_idx` ON `game_actors` (`world_id`,`kind`);
--> statement-breakpoint
CREATE INDEX `game_actors_controller_idx` ON `game_actors` (`controller_user_id`);
--> statement-breakpoint
-- Character actor ids intentionally match their character ids. This preserves
-- existing event target ids while introducing a first-class runtime identity.
INSERT INTO `game_actors` (
  `id`, `campaign_id`, `world_id`, `kind`, `character_id`, `controller_user_id`,
  `name`, `status`, `metadata`, `created_at`, `updated_at`
)
SELECT c.`id`, c.`campaign_id`, camp.`world_id`, 'character', c.`id`, c.`owner_user_id`,
       c.`name`, CASE WHEN c.`status` = 'active' THEN 'active' ELSE 'archived' END,
       '{}', unixepoch(), unixepoch()
FROM `characters` c
JOIN `campaigns` camp ON camp.`id` = c.`campaign_id`
WHERE c.`campaign_id` IS NOT NULL AND camp.`world_id` IS NOT NULL
  AND c.`status` IN ('active', 'retired', 'archived');
--> statement-breakpoint
CREATE TABLE `runtime_dnd35_monster_instances` (
  `actor_id` text PRIMARY KEY NOT NULL,
  `monster_id` text NOT NULL,
  `maximum_hit_points` integer NOT NULL,
  `current_hit_points` integer NOT NULL,
  `temporary_hit_points` integer DEFAULT 0 NOT NULL,
  `nonlethal_damage` integer DEFAULT 0 NOT NULL,
  `stable` integer DEFAULT 1 NOT NULL,
  `metadata` text DEFAULT '{}' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`actor_id`) REFERENCES `game_actors`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `runtime_dnd35_monster_instances_max_hp_valid` CHECK(typeof(`maximum_hit_points`) = 'integer' AND `maximum_hit_points` > 0),
  CONSTRAINT `runtime_dnd35_monster_instances_current_hp_valid` CHECK(typeof(`current_hit_points`) = 'integer' AND `current_hit_points` <= `maximum_hit_points`),
  CONSTRAINT `runtime_dnd35_monster_instances_temp_hp_valid` CHECK(typeof(`temporary_hit_points`) = 'integer' AND `temporary_hit_points` >= 0),
  CONSTRAINT `runtime_dnd35_monster_instances_nonlethal_valid` CHECK(typeof(`nonlethal_damage`) = 'integer' AND `nonlethal_damage` >= 0),
  CONSTRAINT `runtime_dnd35_monster_instances_stable_bool` CHECK(`stable` IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_monster_instances_definition_idx` ON `runtime_dnd35_monster_instances` (`monster_id`);
--> statement-breakpoint
CREATE TRIGGER `runtime_dnd35_monster_instances_hp_stability_update`
AFTER UPDATE OF `current_hit_points` ON `runtime_dnd35_monster_instances`
WHEN NEW.`current_hit_points` <> OLD.`current_hit_points`
BEGIN
  UPDATE `runtime_dnd35_monster_instances`
  SET `stable` = CASE
    WHEN NEW.`current_hit_points` >= 0 THEN 1
    WHEN NEW.`current_hit_points` < OLD.`current_hit_points` THEN 0
    ELSE OLD.`stable`
  END
  WHERE `actor_id` = NEW.`actor_id`;
END;
--> statement-breakpoint
CREATE TABLE `runtime_dnd35_actor_conditions` (
  `id` text PRIMARY KEY NOT NULL,
  `actor_id` text NOT NULL,
  `condition_id` text NOT NULL,
  `source_actor_id` text,
  `source_description` text,
  `duration_kind` text NOT NULL,
  `remaining_rounds` integer,
  `encounter_id` text,
  `expires_encounter_round` integer,
  `expires_turn_order` integer,
  `expires_at` integer,
  `state` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`actor_id`) REFERENCES `game_actors`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`condition_id`) REFERENCES `dnd35_conditions`(`id`) ON UPDATE no action ON DELETE restrict,
  FOREIGN KEY (`source_actor_id`) REFERENCES `game_actors`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`encounter_id`) REFERENCES `game_encounters`(`id`) ON UPDATE no action ON DELETE set null,
  CONSTRAINT `runtime_dnd35_actor_conditions_duration_valid` CHECK(`duration_kind` IN ('rounds', 'until_time', 'permanent', 'concentration', 'special')),
  CONSTRAINT `runtime_dnd35_actor_conditions_round_fields_valid` CHECK((`duration_kind` = 'rounds' AND `remaining_rounds` IS NOT NULL AND `remaining_rounds` >= 1) OR (`duration_kind` <> 'rounds' AND `remaining_rounds` IS NULL)),
  CONSTRAINT `runtime_dnd35_actor_conditions_time_fields_valid` CHECK((`duration_kind` = 'until_time' AND `expires_at` IS NOT NULL) OR (`duration_kind` <> 'until_time' AND `expires_at` IS NULL))
);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_actor_conditions_actor_idx` ON `runtime_dnd35_actor_conditions` (`actor_id`);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_actor_conditions_condition_idx` ON `runtime_dnd35_actor_conditions` (`condition_id`);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_actor_conditions_expiry_idx` ON `runtime_dnd35_actor_conditions` (`encounter_id`,`expires_encounter_round`,`expires_turn_order`);
--> statement-breakpoint
ALTER TABLE `game_encounter_participants` RENAME TO `game_encounter_participants_legacy`;
--> statement-breakpoint
CREATE TABLE `game_encounter_participants` (
  `id` text PRIMARY KEY NOT NULL,
  `encounter_id` text NOT NULL,
  `actor_id` text NOT NULL,
  `character_id` text,
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
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE restrict,
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
SELECT `id`, `encounter_id`, `character_id`, `character_id`, `status`,
       `initiative_roll`, `initiative_modifier`, `initiative_total`, `tie_breaker`, `turn_order`,
       `standard_available`, `move_available`, `swift_available`, `swift_debt_next_turn`,
       `attacks_of_opportunity_per_round`, `attacks_of_opportunity_remaining`, `last_turn_round`,
       `created_at`, `updated_at`
FROM `game_encounter_participants_legacy`;
--> statement-breakpoint
DROP TABLE `game_encounter_participants_legacy`;
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_actor_uidx` ON `game_encounter_participants` (`encounter_id`,`actor_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_encounter_participants_turn_order_uidx` ON `game_encounter_participants` (`encounter_id`,`turn_order`);
--> statement-breakpoint
CREATE INDEX `game_encounter_participants_encounter_status_idx` ON `game_encounter_participants` (`encounter_id`,`status`);
--> statement-breakpoint
CREATE INDEX `game_encounter_participants_character_idx` ON `game_encounter_participants` (`character_id`);
