ALTER TABLE `dnd35_characters`
ADD COLUMN `stable` integer DEFAULT 1 NOT NULL
CONSTRAINT `dnd35_characters_stable_bool` CHECK(`stable` in (0, 1));
--> statement-breakpoint
-- Preserve the pre-migration runtime semantics: nonnegative HP was treated as
-- stable, while negative HP was treated as actively dying.
UPDATE `dnd35_characters`
SET `stable` = CASE WHEN `current_hit_points` < 0 THEN 0 ELSE 1 END;
