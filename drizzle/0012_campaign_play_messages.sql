CREATE TABLE `campaign_play_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text NOT NULL,
  `channel` text NOT NULL,
  `author_kind` text NOT NULL,
  `author_user_id` text,
  `private_user_id` text,
  `character_id` text,
  `content` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`private_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE set null,
  CONSTRAINT `campaign_play_messages_channel_valid` CHECK (`channel` IN ('campaign', 'ooc_dm')),
  CONSTRAINT `campaign_play_messages_author_kind_valid` CHECK (`author_kind` IN ('player', 'dm', 'system')),
  CONSTRAINT `campaign_play_messages_content_valid` CHECK (length(trim(`content`)) BETWEEN 1 AND 4000),
  CONSTRAINT `campaign_play_messages_privacy_valid` CHECK (
    (`channel` = 'campaign' AND `private_user_id` IS NULL)
    OR (`channel` = 'ooc_dm' AND `private_user_id` IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE INDEX `campaign_play_messages_campaign_channel_created_idx`
  ON `campaign_play_messages` (`campaign_id`, `channel`, `created_at`);
--> statement-breakpoint
CREATE INDEX `campaign_play_messages_private_channel_created_idx`
  ON `campaign_play_messages` (`campaign_id`, `private_user_id`, `channel`, `created_at`);
--> statement-breakpoint
CREATE INDEX `campaign_play_messages_character_idx`
  ON `campaign_play_messages` (`character_id`);
