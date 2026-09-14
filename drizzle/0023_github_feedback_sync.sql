CREATE TABLE `github_feedback_links` (
	`id` text PRIMARY KEY NOT NULL,
	`feedback_type` text NOT NULL,
	`feedback_id` text NOT NULL,
	`repository_full_name` text NOT NULL,
	`github_issue_id` integer NOT NULL,
	`github_issue_node_id` text NOT NULL,
	`github_issue_number` integer NOT NULL,
	`github_issue_url` text NOT NULL,
	`sync_status` text DEFAULT 'synced' NOT NULL,
	`last_error` text,
	`github_updated_at` integer,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `github_feedback_links_feedback_type_valid` CHECK(`feedback_type` IN ('bug', 'feature')),
	CONSTRAINT `github_feedback_links_sync_status_valid` CHECK(`sync_status` IN ('pending', 'synced', 'error'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_feedback_links_feedback_unique` ON `github_feedback_links` (`feedback_type`,`feedback_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_feedback_links_issue_unique` ON `github_feedback_links` (`repository_full_name`,`github_issue_number`);
--> statement-breakpoint
CREATE INDEX `github_feedback_links_issue_id_idx` ON `github_feedback_links` (`github_issue_id`);
--> statement-breakpoint
CREATE INDEX `github_feedback_links_sync_status_idx` ON `github_feedback_links` (`sync_status`);
--> statement-breakpoint
CREATE TABLE `github_webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`action` text,
	`repository_full_name` text,
	`github_issue_number` integer,
	`status` text DEFAULT 'received' NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `github_webhook_deliveries_status_valid` CHECK(`status` IN ('received', 'processed', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `github_webhook_deliveries_status_idx` ON `github_webhook_deliveries` (`status`);
--> statement-breakpoint
CREATE INDEX `github_webhook_deliveries_issue_idx` ON `github_webhook_deliveries` (`repository_full_name`,`github_issue_number`);
