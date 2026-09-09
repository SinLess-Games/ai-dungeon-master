-- Preserve exact XPH/PH class-list power point costs without duplicating power rows.
-- A null per-class value means use dnd35_powers.power_points as the canonical default.

CREATE TABLE `dnd35_power_class_levels_new` (
  `power_id` text NOT NULL,
  `class_id` text NOT NULL,
  `power_level` integer NOT NULL,
  `power_points` integer,
  `specialist_discipline_id` text,
  PRIMARY KEY(`power_id`, `class_id`),
  FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`class_id`) REFERENCES `dnd35_classes`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`specialist_discipline_id`) REFERENCES `dnd35_power_disciplines`(`id`) ON UPDATE no action ON DELETE restrict,
  CONSTRAINT "dnd35_power_class_levels_power_level_integer"
    CHECK(`power_level` is null or typeof(`power_level`) = 'integer'),
  CONSTRAINT "dnd35_power_class_levels_power_points_integer"
    CHECK(`power_points` is null or typeof(`power_points`) = 'integer'),
  CONSTRAINT "dnd35_power_class_levels_level_valid"
    CHECK(`power_level` between 0 and 9),
  CONSTRAINT "dnd35_power_class_levels_power_points_valid"
    CHECK(`power_points` is null or `power_points` >= 0)
);
--> statement-breakpoint
INSERT INTO `dnd35_power_class_levels_new`
  (`power_id`, `class_id`, `power_level`, `power_points`, `specialist_discipline_id`)
SELECT
  `power_id`, `class_id`, `power_level`, NULL, `specialist_discipline_id`
FROM `dnd35_power_class_levels`;
--> statement-breakpoint
DROP TABLE `dnd35_power_class_levels`;
--> statement-breakpoint
ALTER TABLE `dnd35_power_class_levels_new` RENAME TO `dnd35_power_class_levels`;
--> statement-breakpoint
CREATE INDEX `dnd35_power_class_levels_list_idx`
  ON `dnd35_power_class_levels` (`class_id`, `power_level`);
