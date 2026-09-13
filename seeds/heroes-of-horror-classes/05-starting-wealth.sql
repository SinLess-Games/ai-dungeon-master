-- Starting-wealth defaults for the two Heroes of Horror base classes.
-- Heroes of Horror pp. 82-88 presents Archivist and Dread Necromancer but does not
-- print a starting-gold formula for either class. Endless Codex supplies deterministic
-- PHB-style defaults so character creation can complete without inventing money at runtime:
--   Archivist:         5d4 x 10 gp (cleric-equivalent; average 125 gp)
--   Dread Necromancer: 3d4 x 10 gp (sorcerer/wizard-equivalent; average 75 gp)
-- Prestige classes intentionally do not receive a starting-wealth formula because
-- they cannot be selected as a character's 1st-level class.
WITH desired(slug,dice_count,die_sides,multiplier_gp) AS (VALUES
  ('archivist',5,4,10),
  ('dread-necromancer',3,4,10)
)
INSERT INTO dnd35_class_starting_wealth (class_id,dice_count,die_sides,multiplier_gp)
SELECT c.id,d.dice_count,d.die_sides,d.multiplier_gp
FROM desired d
JOIN dnd35_classes c ON c.slug=d.slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  dice_count=excluded.dice_count,
  die_sides=excluded.die_sides,
  multiplier_gp=excluded.multiplier_gp;
