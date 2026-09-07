CREATE TABLE `runtime_dnd35_character_spontaneous_slot_usage` (
	`casting_track_id` text NOT NULL,
	`spell_level` integer NOT NULL,
	`expended_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`casting_track_id`, `spell_level`),
	FOREIGN KEY (`casting_track_id`) REFERENCES `dnd35_character_casting_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT `runtime_dnd35_character_spontaneous_slot_usage_spell_level_integer` CHECK(typeof(`spell_level`) = 'integer'),
	CONSTRAINT `runtime_dnd35_character_spontaneous_slot_usage_spell_level_valid` CHECK(`spell_level` >= 0),
	CONSTRAINT `runtime_dnd35_character_spontaneous_slot_usage_expended_integer` CHECK(typeof(`expended_count`) = 'integer'),
	CONSTRAINT `runtime_dnd35_character_spontaneous_slot_usage_expended_valid` CHECK(`expended_count` >= 0)
);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_character_spontaneous_slot_usage_track_idx` ON `runtime_dnd35_character_spontaneous_slot_usage` (`casting_track_id`);
--> statement-breakpoint
CREATE TABLE `runtime_dnd35_character_psionic_states` (
	`character_id` text PRIMARY KEY NOT NULL,
	`focused` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT `runtime_dnd35_character_psionic_states_focused_bool` CHECK(`focused` in (0, 1))
);
