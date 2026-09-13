-- Expanded Psionics Handbook Table 2-2: Random Starting Gold.
-- Amounts are stored as dice formulas so the creator rolls once server-side.
WITH desired(class_slug,dice_count,die_sides,multiplier_gp) AS (VALUES
  ('psion',3,4,10),
  ('psychic-warrior',5,4,10),
  ('soulknife',5,4,10),
  ('wilder',4,4,10)
)
INSERT INTO dnd35_class_starting_wealth (class_id,dice_count,die_sides,multiplier_gp)
SELECT c.id,d.dice_count,d.die_sides,d.multiplier_gp
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='expanded-psionics-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  dice_count=excluded.dice_count,
  die_sides=excluded.die_sides,
  multiplier_gp=excluded.multiplier_gp;