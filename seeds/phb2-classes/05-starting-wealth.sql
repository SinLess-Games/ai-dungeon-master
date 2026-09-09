-- Player's Handbook II starting wealth for its four base classes.
-- PHB II pp. 6, 12, 19, 25. Safe to re-run.
WITH desired(class_slug,dice_count,die_sides,multiplier_gp) AS (VALUES
  ('beguiler',6,4,10),
  ('dragon-shaman',4,4,10),
  ('duskblade',6,4,10),
  ('knight',6,4,10)
)
INSERT INTO dnd35_class_starting_wealth (class_id,dice_count,die_sides,multiplier_gp)
SELECT c.id,d.dice_count,d.die_sides,d.multiplier_gp
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-ii-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  dice_count=excluded.dice_count,
  die_sides=excluded.die_sides,
  multiplier_gp=excluded.multiplier_gp;
