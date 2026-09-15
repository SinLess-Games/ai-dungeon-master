CREATE TABLE `campaign_dm_actions` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text NOT NULL,
  `requested_by_message_id` text NOT NULL,
  `request_message_id` text,
  `resolution_message_id` text,
  `requested_user_id` text NOT NULL,
  `character_id` text NOT NULL,
  `actor_id` text NOT NULL,
  `kind` text NOT NULL,
  `arguments` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `result` text,
  `error` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `resolved_at` integer,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`requested_by_message_id`) REFERENCES `campaign_play_messages`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`request_message_id`) REFERENCES `campaign_play_messages`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`resolution_message_id`) REFERENCES `campaign_play_messages`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`requested_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `campaign_dm_actions_kind_valid` CHECK (`kind` IN ('check.skill', 'check.save')),
  CONSTRAINT `campaign_dm_actions_status_valid` CHECK (`status` IN ('pending', 'resolving', 'resolved', 'failed', 'cancelled')),
  CONSTRAINT `campaign_dm_actions_arguments_json_valid` CHECK (json_valid(`arguments`)),
  CONSTRAINT `campaign_dm_actions_result_json_valid` CHECK (`result` IS NULL OR json_valid(`result`))
);
--> statement-breakpoint
CREATE INDEX `campaign_dm_actions_campaign_user_status_created_idx`
  ON `campaign_dm_actions` (`campaign_id`, `requested_user_id`, `status`, `created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_dm_actions_one_outstanding_per_user_uidx`
  ON `campaign_dm_actions` (`campaign_id`, `requested_user_id`)
  WHERE `status` IN ('pending', 'resolving');
--> statement-breakpoint
CREATE INDEX `campaign_dm_actions_message_idx`
  ON `campaign_dm_actions` (`requested_by_message_id`);
--> statement-breakpoint
CREATE INDEX `campaign_dm_actions_character_idx`
  ON `campaign_dm_actions` (`character_id`);
