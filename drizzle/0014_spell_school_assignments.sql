-- Preserve complete school membership for dual-school spells while retaining
-- dnd35_spells.school_id as the primary/compatibility school.

CREATE TABLE `dnd35_spell_school_assignments` (
  `spell_id` text NOT NULL,
  `school_id` text NOT NULL,
  PRIMARY KEY(`spell_id`, `school_id`),
  FOREIGN KEY (`spell_id`) REFERENCES `dnd35_spells`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`school_id`) REFERENCES `dnd35_spell_schools`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `dnd35_spell_school_assignments_school_idx`
  ON `dnd35_spell_school_assignments` (`school_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `dnd35_spell_school_assignments` (`spell_id`, `school_id`)
SELECT `id`, `school_id` FROM `dnd35_spells`;
