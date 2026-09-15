CREATE TABLE `runtime_dnd35_alignment_states` (
  `character_id` text PRIMARY KEY NOT NULL,
  `law_chaos_score` integer NOT NULL,
  `good_evil_score` integer NOT NULL,
  `last_reason` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`character_id`) REFERENCES `dnd35_characters`(`character_id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `runtime_dnd35_alignment_law_chaos_integer` CHECK (typeof(`law_chaos_score`) = 'integer'),
  CONSTRAINT `runtime_dnd35_alignment_good_evil_integer` CHECK (typeof(`good_evil_score`) = 'integer'),
  CONSTRAINT `runtime_dnd35_alignment_law_chaos_range` CHECK (`law_chaos_score` BETWEEN -100 AND 100),
  CONSTRAINT `runtime_dnd35_alignment_good_evil_range` CHECK (`good_evil_score` BETWEEN -100 AND 100)
);
