ALTER TABLE `dnd35_characters`
ADD COLUMN `stable` integer DEFAULT 1 NOT NULL
CONSTRAINT `dnd35_characters_stable_bool` CHECK(`stable` in (0, 1));
--> statement-breakpoint
-- Preserve the pre-migration runtime semantics: nonnegative HP was treated as
-- stable, while negative HP was treated as actively dying.
UPDATE `dnd35_characters`
SET `stable` = CASE WHEN `current_hit_points` < 0 THEN 0 ELSE 1 END;
--> statement-breakpoint
-- Any new lethal HP loss while below 0 restarts dying. Healing to nonnegative
-- HP stabilizes automatically. Healing that remains below 0 preserves the
-- creature's prior stabilization state, matching D&D 3.5 health semantics.
CREATE TRIGGER `dnd35_characters_hp_stability_update`
AFTER UPDATE OF `current_hit_points` ON `dnd35_characters`
WHEN NEW.`current_hit_points` <> OLD.`current_hit_points`
BEGIN
  UPDATE `dnd35_characters`
  SET `stable` = CASE
    WHEN NEW.`current_hit_points` >= 0 THEN 1
    WHEN NEW.`current_hit_points` < OLD.`current_hit_points` THEN 0
    ELSE OLD.`stable`
  END
  WHERE `character_id` = NEW.`character_id`;
END;
