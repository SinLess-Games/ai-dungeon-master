-- Support source-faithful psionics imports.
-- Expanded Psionics Handbook has a distinct Metapsionic feat category, while
-- the original Psionics Handbook includes 0-level powers (talents).

CREATE TABLE `dnd35_feat_category_assignments_new` (
  `feat_id` text NOT NULL,
  `category` text NOT NULL,
  PRIMARY KEY(`feat_id`, `category`),
  FOREIGN KEY (`feat_id`) REFERENCES `dnd35_feats`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT "dnd35_feat_categories_valid" CHECK(`category` in (
    'general', 'fighter', 'metamagic', 'metapsionic', 'item_creation', 'psionic',
    'epic', 'racial', 'divine', 'wild', 'heritage', 'ceremony', 'combat_form',
    'tactical', 'reserve', 'incarnum', 'vile', 'exalted', 'other'
  ))
);
--> statement-breakpoint
INSERT INTO `dnd35_feat_category_assignments_new` (`feat_id`, `category`)
SELECT `feat_id`, `category` FROM `dnd35_feat_category_assignments`;
--> statement-breakpoint
DROP TABLE `dnd35_feat_category_assignments`;
--> statement-breakpoint
ALTER TABLE `dnd35_feat_category_assignments_new` RENAME TO `dnd35_feat_category_assignments`;
--> statement-breakpoint
CREATE INDEX `dnd35_feat_categories_category_idx`
  ON `dnd35_feat_category_assignments` (`category`);
--> statement-breakpoint

CREATE TABLE `dnd35_power_class_levels_new` (
  `power_id` text NOT NULL,
  `class_id` text NOT NULL,
  `power_level` integer NOT NULL,
  `specialist_discipline_id` text,
  PRIMARY KEY(`power_id`, `class_id`),
  FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`specialist_discipline_id`) REFERENCES `dnd35_power_disciplines`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT "dnd35_power_class_levels_power_level_integer" CHECK(`power_level` is null or typeof(`power_level`) = 'integer'),
  CONSTRAINT "dnd35_power_class_levels_level_valid" CHECK(`power_level` between 0 and 9)
);
--> statement-breakpoint
INSERT INTO `dnd35_power_class_levels_new` (`power_id`, `class_id`, `power_level`, `specialist_discipline_id`)
SELECT `power_id`, `class_id`, `power_level`, `specialist_discipline_id`
FROM `dnd35_power_class_levels`;
--> statement-breakpoint
DROP TABLE `dnd35_power_class_levels`;
--> statement-breakpoint
ALTER TABLE `dnd35_power_class_levels_new` RENAME TO `dnd35_power_class_levels`;
--> statement-breakpoint
CREATE INDEX `dnd35_power_class_levels_list_idx`
  ON `dnd35_power_class_levels` (`class_id`, `power_level`);
