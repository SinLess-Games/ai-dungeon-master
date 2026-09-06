CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limits_key_uq` ON `rate_limits` (`key`);--> statement-breakpoint
-- Add columns in place: rebuilding users would cascade-delete sessions/accounts on D1.
ALTER TABLE `users` ADD COLUMN `username` text CONSTRAINT `users_username_normalized` CHECK (`username` IS NULL OR (`username` = lower(trim(`username`)) AND length(`username`) BETWEEN 3 AND 32 AND `username` NOT GLOB '*[^a-z0-9_-]*'));
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `display_username` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_uq` ON `users` (`username`);
