-- Character-creation persistence for starting wealth, unresolved class choices, and companions.
CREATE TABLE `dnd35_class_starting_wealth` (
  `class_id` text PRIMARY KEY NOT NULL,
  `dice_count` integer NOT NULL,
  `die_sides` integer NOT NULL,
  `multiplier_gp` integer DEFAULT 1 NOT NULL,
  FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `dnd35_class_starting_wealth_dice_count_integer` CHECK(typeof(`dice_count`) = 'integer'),
  CONSTRAINT `dnd35_class_starting_wealth_die_sides_integer` CHECK(typeof(`die_sides`) = 'integer'),
  CONSTRAINT `dnd35_class_starting_wealth_multiplier_integer` CHECK(typeof(`multiplier_gp`) = 'integer'),
  CONSTRAINT `dnd35_class_starting_wealth_dice_count_valid` CHECK(`dice_count` > 0),
  CONSTRAINT `dnd35_class_starting_wealth_die_sides_valid` CHECK(`die_sides` > 0),
  CONSTRAINT `dnd35_class_starting_wealth_multiplier_valid` CHECK(`multiplier_gp` > 0)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_wealth` (
  `character_id` text PRIMARY KEY NOT NULL,
  `starting_wealth_copper` integer,
  `current_copper` integer DEFAULT 0 NOT NULL,
  `equipment_spent_copper` integer DEFAULT 0 NOT NULL,
  `roll_results` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `dnd35_character_wealth_start_integer` CHECK(`starting_wealth_copper` is null or typeof(`starting_wealth_copper`) = 'integer'),
  CONSTRAINT `dnd35_character_wealth_current_integer` CHECK(typeof(`current_copper`) = 'integer'),
  CONSTRAINT `dnd35_character_wealth_spent_integer` CHECK(typeof(`equipment_spent_copper`) = 'integer'),
  CONSTRAINT `dnd35_character_wealth_start_valid` CHECK(`starting_wealth_copper` is null or `starting_wealth_copper` >= 0),
  CONSTRAINT `dnd35_character_wealth_current_valid` CHECK(`current_copper` >= 0),
  CONSTRAINT `dnd35_character_wealth_spent_valid` CHECK(`equipment_spent_copper` >= 0),
  CONSTRAINT `dnd35_character_wealth_roll_results_json` CHECK(case when `roll_results` is null then 1 when json_valid(`roll_results`) then json_type(`roll_results`) = 'array' else 0 end),
  CONSTRAINT `dnd35_character_wealth_balance_valid` CHECK(`starting_wealth_copper` is null or `current_copper` + `equipment_spent_copper` <= `starting_wealth_copper`)
);
--> statement-breakpoint
CREATE TABLE `dnd35_character_creation_choices` (
  `id` text PRIMARY KEY NOT NULL,
  `character_id` text NOT NULL,
  `character_class_level_id` text,
  `class_feature_id` text,
  `choice_key` text NOT NULL,
  `kind` text NOT NULL,
  `content_id` text,
  `value_text` text,
  `parameters` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`character_class_level_id`) REFERENCES `dnd35_character_class_levels`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`class_feature_id`) REFERENCES `dnd35_class_features`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `dnd35_character_creation_choices_kind_valid` CHECK(`kind` in ('feat','language','domain','deity','spell','power','school','creature_type','companion','familiar','skill','weapon','other')),
  CONSTRAINT `dnd35_character_creation_choices_key_nonempty` CHECK(length(trim(`choice_key`)) > 0),
  CONSTRAINT `dnd35_character_creation_choices_value_present` CHECK(`content_id` is not null or `value_text` is not null or `parameters` is not null),
  CONSTRAINT `dnd35_character_creation_choices_parameters_json` CHECK(case when `parameters` is null then 1 when json_valid(`parameters`) then json_type(`parameters`) = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_creation_choices_slot_uq` ON `dnd35_character_creation_choices` (`character_id`,`class_feature_id`,`choice_key`);
--> statement-breakpoint
CREATE INDEX `dnd35_character_creation_choices_character_idx` ON `dnd35_character_creation_choices` (`character_id`);
--> statement-breakpoint
CREATE TABLE `dnd35_character_companions` (
  `id` text PRIMARY KEY NOT NULL,
  `character_id` text NOT NULL,
  `class_feature_id` text NOT NULL,
  `kind` text NOT NULL,
  `monster_id` text,
  `creature_name` text NOT NULL,
  `name` text,
  `details` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`class_feature_id`) REFERENCES `dnd35_class_features`(`id`) ON UPDATE no action ON DELETE restrict,
  FOREIGN KEY (`monster_id`) REFERENCES `dnd35_monsters`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `dnd35_character_companions_kind_valid` CHECK(`kind` in ('familiar','animal_companion','special_mount','other')),
  CONSTRAINT `dnd35_character_companions_creature_nonempty` CHECK(length(trim(`creature_name`)) > 0),
  CONSTRAINT `dnd35_character_companions_details_json` CHECK(case when `details` is null then 1 when json_valid(`details`) then json_type(`details`) = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_character_companions_feature_uq` ON `dnd35_character_companions` (`character_id`,`class_feature_id`);
--> statement-breakpoint
CREATE INDEX `dnd35_character_companions_character_idx` ON `dnd35_character_companions` (`character_id`);
