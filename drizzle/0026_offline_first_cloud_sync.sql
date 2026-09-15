CREATE TABLE `offline_sync_mutations` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `request_method` text NOT NULL,
  `request_path` text NOT NULL,
  `response_status` integer NOT NULL,
  `response_headers` text NOT NULL DEFAULT '{}',
  `response_body` text,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  CONSTRAINT `offline_sync_mutations_method_valid` CHECK(`request_method` IN ('POST', 'PUT', 'PATCH', 'DELETE')),
  CONSTRAINT `offline_sync_mutations_user_not_empty` CHECK(length(trim(`user_id`)) > 0),
  CONSTRAINT `offline_sync_mutations_path_not_empty` CHECK(length(trim(`request_path`)) > 0)
);
--> statement-breakpoint
CREATE INDEX `offline_sync_mutations_user_created_idx` ON `offline_sync_mutations` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `world_maps` (
  `id` text PRIMARY KEY NOT NULL,
  `world_id` text NOT NULL,
  `owner_user_id` text NOT NULL,
  `name` text NOT NULL,
  `kind` text NOT NULL DEFAULT 'world',
  `data` text NOT NULL DEFAULT '{}',
  `revision` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  `updated_at` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `world_maps_name_not_empty` CHECK(length(trim(`name`)) > 0),
  CONSTRAINT `world_maps_owner_not_empty` CHECK(length(trim(`owner_user_id`)) > 0),
  CONSTRAINT `world_maps_kind_valid` CHECK(`kind` IN ('world', 'region', 'location', 'tactical')),
  CONSTRAINT `world_maps_revision_positive` CHECK(`revision` > 0)
);
--> statement-breakpoint
CREATE INDEX `world_maps_world_id_idx` ON `world_maps` (`world_id`);
--> statement-breakpoint
CREATE INDEX `world_maps_owner_user_id_idx` ON `world_maps` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `world_maps_world_updated_idx` ON `world_maps` (`world_id`, `updated_at`);