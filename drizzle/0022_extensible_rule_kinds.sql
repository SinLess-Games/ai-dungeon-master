-- dnd35_rules is the extensibility catalog for source-backed material that does not
-- naturally fit a more specific entity table. Source imports need semantic kinds
-- such as divine-stat-block, pantheon-catalog, revision-note, and spell-list.
-- Keep kind indexed and non-empty, but do not constrain it to a closed enum.
CREATE TABLE `__new_dnd35_rules` (
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
  CONSTRAINT `dnd35_rules_kind_nonempty` CHECK(length(trim(`kind`)) > 0),
  CONSTRAINT `dnd35_rules_homebrew_bool` CHECK(`is_homebrew` in (0, 1)),
  CONSTRAINT `dnd35_rules_enabled_bool` CHECK(`is_enabled` in (0, 1)),
  CONSTRAINT `dnd35_rules_variant_bool` CHECK(`is_variant` in (0, 1)),
  CONSTRAINT `dnd35_rules_default_enabled_bool` CHECK(`default_enabled` in (0, 1)),
  CONSTRAINT `dnd35_rules_tags_json` CHECK(case when `tags` is null then 1 when json_valid(`tags`) then json_type(`tags`) = 'array' else 0 end),
  CONSTRAINT `dnd35_rules_mechanics_json` CHECK(case when `mechanics` is null then 1 when json_valid(`mechanics`) then json_type(`mechanics`) = 'object' else 0 end)
);
--> statement-breakpoint
INSERT INTO `__new_dnd35_rules` (
  `id`,`source_id`,`source_page`,`slug`,`name`,`description`,`rules_text`,`is_homebrew`,`owner_user_id`,`is_enabled`,
  `created_at`,`updated_at`,`category`,`kind`,`is_variant`,`default_enabled`,`parent_slug`,`supersedes_slug`,`tags`,`mechanics`
)
SELECT
  `id`,`source_id`,`source_page`,`slug`,`name`,`description`,`rules_text`,`is_homebrew`,`owner_user_id`,`is_enabled`,
  `created_at`,`updated_at`,`category`,`kind`,`is_variant`,`default_enabled`,`parent_slug`,`supersedes_slug`,`tags`,`mechanics`
FROM `dnd35_rules`;
--> statement-breakpoint
DROP TABLE `dnd35_rules`;
--> statement-breakpoint
ALTER TABLE `__new_dnd35_rules` RENAME TO `dnd35_rules`;
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