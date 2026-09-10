ALTER TABLE `dnd35_race_abilities` ADD `monster_average_score` integer;--> statement-breakpoint
CREATE TABLE `dnd35_race_class_skills` (
	`race_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`race_id`, `skill_id`),
	FOREIGN KEY (`race_id`) REFERENCES `dnd35_races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `dnd35_skills`(`id`) ON UPDATE no action ON DELETE restrict
);--> statement-breakpoint
CREATE INDEX `dnd35_race_class_skills_skill_idx` ON `dnd35_race_class_skills` (`skill_id`);