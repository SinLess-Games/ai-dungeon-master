-- XPH N-P class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('null-psionics-field','psion',6,11,'psychokinesis'),
  ('oak-body','psion',7,13,NULL),('oak-body','wilder',7,13,NULL),('oak-body','psychic-warrior',5,9,NULL),
  ('object-reading','psion',2,3,'clairsentience'),
  ('overland-flight-psionic','psion',6,11,NULL),('overland-flight-psionic','wilder',6,11,NULL),
  ('painful-strike','psychic-warrior',2,3,NULL),
  ('personality-parasite','psion',4,7,NULL),('personality-parasite','wilder',4,7,NULL),
  ('phase-door-psionic','psion',7,13,NULL),('phase-door-psionic','wilder',7,13,NULL),
  ('plane-shift-psionic','psion',5,9,NULL),('plane-shift-psionic','wilder',5,9,NULL),
  ('power-leech','psion',4,7,NULL),('power-leech','wilder',4,7,NULL),
  ('power-resistance','psion',5,9,NULL),('power-resistance','wilder',5,9,NULL),
  ('precognition','psion',1,1,'clairsentience'),
  ('precognition-defensive','psion',1,1,NULL),('precognition-defensive','wilder',1,1,NULL),('precognition-defensive','psychic-warrior',1,1,NULL),
  ('precognition-greater','psion',6,11,'clairsentience'),
  ('precognition-offensive','psion',1,1,NULL),('precognition-offensive','wilder',1,1,NULL),('precognition-offensive','psychic-warrior',1,1,NULL),
  ('prescience-offensive','psion',1,1,NULL),('prescience-offensive','wilder',1,1,NULL),('prescience-offensive','psychic-warrior',1,1,NULL),
  ('prevenom','psychic-warrior',1,1,NULL),
  ('prevenom-weapon','psychic-warrior',1,1,NULL),
  ('prowess','psychic-warrior',2,3,NULL),
  ('psionic-blast','psion',3,5,NULL),('psionic-blast','wilder',3,5,NULL),
  ('psionic-lions-charge','psychic-warrior',2,3,NULL),
  ('psionic-lock','psion',2,3,NULL),('psionic-lock','wilder',2,3,NULL),
  ('psionic-repair-damage','psion',2,3,'metacreativity'),
  ('psionic-revivify','psion',5,9,'psychometabolism'),
  ('psionic-scent','psychic-warrior',2,3,NULL),
  ('psychic-chirurgery','psion',9,17,'telepathy'),
  ('psychic-crush','psion',5,9,NULL),('psychic-crush','wilder',5,9,NULL),
  ('psychic-reformation','psion',4,7,NULL),('psychic-reformation','wilder',4,7,NULL),
  ('psychic-vampire','psion',4,7,'psychometabolism'),('psychic-vampire','psychic-warrior',4,7,NULL),
  ('psychofeedback','psion',5,9,'psychometabolism'),('psychofeedback','psychic-warrior',5,9,NULL)
)
INSERT INTO dnd35_power_class_levels
  (power_id,class_id,power_level,power_points,specialist_discipline_id)
SELECT
  p.id,
  c.id,
  d.power_level,
  d.power_points,
  CASE WHEN d.specialist IS NULL THEN NULL ELSE 'xph-power-discipline-' || d.specialist END
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
ON CONFLICT(power_id,class_id) DO UPDATE SET
  power_level=excluded.power_level,
  power_points=excluded.power_points,
  specialist_discipline_id=excluded.specialist_discipline_id;
