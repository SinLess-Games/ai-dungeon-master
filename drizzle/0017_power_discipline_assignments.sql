-- Preserve complete discipline membership for powers while keeping
-- dnd35_powers.discipline_id as the primary/compatibility discipline.
CREATE TABLE `dnd35_power_discipline_assignments` (
  `power_id` text NOT NULL,
  `discipline_id` text NOT NULL,
  PRIMARY KEY(`power_id`,`discipline_id`),
  FOREIGN KEY (`power_id`) REFERENCES `dnd35_powers`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`discipline_id`) REFERENCES `dnd35_power_disciplines`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `dnd35_power_discipline_assignments_discipline_idx`
  ON `dnd35_power_discipline_assignments` (`discipline_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `dnd35_power_discipline_assignments` (`power_id`,`discipline_id`)
SELECT `id`,`discipline_id` FROM `dnd35_powers`;
