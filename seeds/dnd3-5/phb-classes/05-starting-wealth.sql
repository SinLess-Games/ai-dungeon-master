-- PHB 3.5 Table 7-1 starting gold by base class.
-- Store the authoritative roll formula; character creation performs the roll once server-side.
WITH desired(slug,dice_count,die_sides,multiplier_gp) AS (VALUES
  ('barbarian',4,4,10),
  ('bard',4,4,10),
  ('cleric',5,4,10),
  ('druid',2,4,10),
  ('fighter',6,4,10),
  ('monk',5,4,1),
  ('paladin',6,4,10),
  ('ranger',6,4,10),
  ('rogue',5,4,10),
  ('sorcerer',3,4,10),
  ('wizard',3,4,10)
)
INSERT INTO dnd35_class_starting_wealth (class_id,dice_count,die_sides,multiplier_gp)
SELECT c.id,d.dice_count,d.die_sides,d.multiplier_gp
FROM desired d
JOIN dnd35_classes c ON c.slug=d.slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  dice_count=excluded.dice_count,
  die_sides=excluded.die_sides,
  multiplier_gp=excluded.multiplier_gp;
