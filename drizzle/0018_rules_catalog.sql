-- Source-backed rule catalog for core rules, procedures, variants, tables, and DM-facing subsystems.
CREATE TABLE `dnd35_rules` (
  `id` text PRIMARY KEY NOT NULL,
  `source_id` text NOT NULL,
  `source_page` text,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `rules_text` text DEFAULT '' NOT NULL,
  `is_homebrew` integer DEFAULT false NOT NULL,
  `owner_user_id` text,
  `is_enabled` integer DEFAULT true NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  `category` text NOT NULL,
  `kind` text DEFAULT 'rule' NOT NULL,
  `is_variant` integer DEFAULT false NOT NULL,
  `default_enabled` integer DEFAULT true NOT NULL,
  `parent_slug` text,
  `supersedes_slug` text,
  `tags` text,
  `mechanics` text,
  FOREIGN KEY (`source_id`) REFERENCES `dnd35_sources`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT `dnd35_rules_slug_nonempty` CHECK(length(trim(`slug`)) > 0),
  CONSTRAINT `dnd35_rules_name_nonempty` CHECK(length(trim(`name`)) > 0),
  CONSTRAINT `dnd35_rules_owner_nonempty` CHECK(`owner_user_id` is null OR length(trim(`owner_user_id`)) > 0),
  CONSTRAINT `dnd35_rules_category_nonempty` CHECK(length(trim(`category`)) > 0),
  CONSTRAINT `dnd35_rules_homebrew_bool` CHECK(`is_homebrew` in (0, 1)),
  CONSTRAINT `dnd35_rules_enabled_bool` CHECK(`is_enabled` in (0, 1)),
  CONSTRAINT `dnd35_rules_variant_bool` CHECK(`is_variant` in (0, 1)),
  CONSTRAINT `dnd35_rules_default_enabled_bool` CHECK(`default_enabled` in (0, 1)),
  CONSTRAINT `dnd35_rules_kind_valid` CHECK(`kind` in ('rule','procedure','subsystem','table','guidance')),
  CONSTRAINT `dnd35_rules_tags_json` CHECK(case when `tags` is null then 1 when json_valid(`tags`) then json_type(`tags`) = 'array' else 0 end),
  CONSTRAINT `dnd35_rules_mechanics_json` CHECK(case when `mechanics` is null then 1 when json_valid(`mechanics`) then json_type(`mechanics`) = 'object' else 0 end)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_rules_source_slug_owner_uq` ON `dnd35_rules` (`source_id`,`slug`,`owner_user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `dnd35_rules_source_slug_shared_uq` ON `dnd35_rules` (`source_id`,`slug`) WHERE `owner_user_id` is null;
--> statement-breakpoint
CREATE INDEX `dnd35_rules_slug_idx` ON `dnd35_rules` (`slug`);
--> statement-breakpoint
CREATE INDEX `dnd35_rules_owner_idx` ON `dnd35_rules` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `dnd35_rules_category_idx` ON `dnd35_rules` (`category`);
--> statement-breakpoint
CREATE INDEX `dnd35_rules_kind_idx` ON `dnd35_rules` (`kind`);
--> statement-breakpoint
CREATE INDEX `dnd35_rules_parent_slug_idx` ON `dnd35_rules` (`parent_slug`);
--> statement-breakpoint
CREATE INDEX `dnd35_rules_supersedes_slug_idx` ON `dnd35_rules` (`supersedes_slug`);
