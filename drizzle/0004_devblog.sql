CREATE TABLE `devblog_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rate_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`moderated_at` integer,
	`moderated_by` text,
	FOREIGN KEY (`post_id`) REFERENCES `devblog_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`moderated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "devblog_comment_status_valid" CHECK("devblog_comments"."status" IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE INDEX `devblog_comment_public_idx` ON `devblog_comments` (`post_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `devblog_comment_moderation_idx` ON `devblog_comments` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `devblog_comment_rate_idx` ON `devblog_comments` (`rate_key`,`created_at`);--> statement-breakpoint
CREATE TABLE `devblog_media` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`owner_user_id` text,
	`object_key` text NOT NULL,
	`alt` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `devblog_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devblog_media_object_key_unique` ON `devblog_media` (`object_key`);--> statement-breakpoint
CREATE INDEX `devblog_media_post_idx` ON `devblog_media` (`post_id`);--> statement-breakpoint
CREATE TABLE `devblog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_user_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`markdown` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cover_image_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	`archived_at` integer,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "devblog_status_valid" CHECK("devblog_posts"."status" IN ('draft','published','archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devblog_slug_unique` ON `devblog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `devblog_publication_idx` ON `devblog_posts` (`status`,`published_at`);