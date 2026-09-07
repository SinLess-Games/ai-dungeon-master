CREATE TABLE `runtime_dnd35_effect_profiles` (
  `id` text PRIMARY KEY NOT NULL,
  `source_kind` text NOT NULL,
  `spell_id` text,
  `power_id` text,
  `sequence` integer DEFAULT 0 NOT NULL,
  `effect` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `runtime_dnd35_effect_profiles_source_kind_valid` CHECK(`source_kind` IN ('spell', 'power')),
  CONSTRAINT `runtime_dnd35_effect_profiles_sequence_non_negative` CHECK(`sequence` >= 0),
  CONSTRAINT `runtime_dnd35_effect_profiles_source_link_valid` CHECK((`source_kind` = 'spell' AND `spell_id` IS NOT NULL AND `power_id` IS NULL) OR (`source_kind` = 'power' AND `power_id` IS NOT NULL AND `spell_id` IS NULL)),
  CONSTRAINT `runtime_dnd35_effect_profiles_effect_json` CHECK(json_valid(`effect`))
);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_effect_profiles_spell_idx` ON `runtime_dnd35_effect_profiles` (`spell_id`,`sequence`);
--> statement-breakpoint
CREATE INDEX `runtime_dnd35_effect_profiles_power_idx` ON `runtime_dnd35_effect_profiles` (`power_id`,`sequence`);
--> statement-breakpoint
CREATE UNIQUE INDEX `runtime_dnd35_effect_profiles_spell_sequence_uidx` ON `runtime_dnd35_effect_profiles` (`spell_id`,`sequence`);
--> statement-breakpoint
CREATE UNIQUE INDEX `runtime_dnd35_effect_profiles_power_sequence_uidx` ON `runtime_dnd35_effect_profiles` (`power_id`,`sequence`);
