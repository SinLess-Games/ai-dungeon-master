CREATE TABLE `campaign_world_states` (
  `campaign_id` text PRIMARY KEY NOT NULL,
  `world_id` text NOT NULL,
  `current_place_id` text,
  `current_x` real DEFAULT 0 NOT NULL,
  `current_y` real DEFAULT 0 NOT NULL,
  `elapsed_minutes` integer DEFAULT 0 NOT NULL,
  `weather` text DEFAULT 'clear' NOT NULL,
  `weather_day` integer DEFAULT 0 NOT NULL,
  `revision` integer DEFAULT 1 NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `campaign_world_states_elapsed_non_negative` CHECK (`elapsed_minutes` >= 0),
  CONSTRAINT `campaign_world_states_weather_day_non_negative` CHECK (`weather_day` >= 0),
  CONSTRAINT `campaign_world_states_revision_positive` CHECK (`revision` > 0),
  CONSTRAINT `campaign_world_states_weather_valid` CHECK (`weather` IN ('clear','rain','snow','heavy-snow','sleet','hail','fog','storm','blizzard','duststorm'))
);
--> statement-breakpoint
CREATE INDEX `campaign_world_states_world_idx` ON `campaign_world_states` (`world_id`);
--> statement-breakpoint
CREATE TABLE `campaign_world_discoveries` (
  `campaign_id` text NOT NULL,
  `user_id` text NOT NULL,
  `entity_kind` text NOT NULL,
  `entity_id` text NOT NULL,
  `discovered_at` integer DEFAULT (unixepoch()) NOT NULL,
  PRIMARY KEY (`campaign_id`, `user_id`, `entity_kind`, `entity_id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `campaign_world_discoveries_entity_id_not_empty` CHECK (length(trim(`entity_id`)) > 0),
  CONSTRAINT `campaign_world_discoveries_kind_valid` CHECK (`entity_kind` IN ('region','place','path'))
);
--> statement-breakpoint
CREATE INDEX `campaign_world_discoveries_user_idx` ON `campaign_world_discoveries` (`user_id`, `campaign_id`);
--> statement-breakpoint
CREATE TABLE `campaign_travel_events` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text NOT NULL,
  `requested_user_id` text NOT NULL,
  `from_place_id` text,
  `to_place_id` text NOT NULL,
  `route_place_ids` text NOT NULL,
  `route_path_ids` text NOT NULL,
  `distance_miles` real NOT NULL,
  `travel_minutes` integer NOT NULL,
  `elapsed_clock_minutes` integer NOT NULL,
  `party_speed_feet` integer NOT NULL,
  `terrain_multiplier` real NOT NULL,
  `weather` text NOT NULL,
  `weather_multiplier` real NOT NULL,
  `encounter_rolls` text NOT NULL,
  `encounter_threshold` integer NOT NULL,
  `encounter_triggered` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'completed' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `campaign_travel_events_route_places_json` CHECK (json_valid(`route_place_ids`)),
  CONSTRAINT `campaign_travel_events_route_paths_json` CHECK (json_valid(`route_path_ids`)),
  CONSTRAINT `campaign_travel_events_encounter_rolls_json` CHECK (json_valid(`encounter_rolls`)),
  CONSTRAINT `campaign_travel_events_distance_positive` CHECK (`distance_miles` > 0),
  CONSTRAINT `campaign_travel_events_minutes_positive` CHECK (`travel_minutes` > 0),
  CONSTRAINT `campaign_travel_events_clock_minutes_positive` CHECK (`elapsed_clock_minutes` > 0),
  CONSTRAINT `campaign_travel_events_speed_positive` CHECK (`party_speed_feet` > 0),
  CONSTRAINT `campaign_travel_events_weather_valid` CHECK (`weather` IN ('clear','rain','snow','heavy-snow','sleet','hail','fog','storm','blizzard','duststorm')),
  CONSTRAINT `campaign_travel_events_status_valid` CHECK (`status` IN ('completed','encounter-pending','encounter-resolved'))
);
--> statement-breakpoint
CREATE INDEX `campaign_travel_events_campaign_created_idx` ON `campaign_travel_events` (`campaign_id`, `created_at`);
