-- XPH G-L class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('genesis','psion',9,17,'metacreativity'),
  ('graft-weapon','psychic-warrior',3,5,NULL),
  ('grease-psionic','psion',1,1,NULL),('grease-psionic','wilder',1,1,NULL),
  ('grip-of-iron','psychic-warrior',1,1,NULL),
  ('hail-of-crystals','psion',5,9,'metacreativity'),
  ('hammer','psion',1,1,NULL),('hammer','wilder',1,1,NULL),('hammer','psychic-warrior',1,1,NULL),
  ('hustle','psion',3,5,'psychometabolism'),('hustle','psychic-warrior',2,3,NULL),
  ('hypercognition','psion',8,15,'clairsentience'),
  ('id-insinuation','psion',2,3,NULL),('id-insinuation','wilder',2,3,NULL),
  ('identify-psionic','psion',2,3,NULL),('identify-psionic','wilder',2,3,NULL),
  ('immovability','psychic-warrior',4,7,NULL),
  ('incarnate','psion',5,9,NULL),('incarnate','wilder',5,9,NULL),
  ('inertial-armor','psion',1,1,NULL),('inertial-armor','wilder',1,1,NULL),('inertial-armor','psychic-warrior',1,1,NULL),
  ('inertial-barrier','psion',4,7,'psychokinesis'),('inertial-barrier','psychic-warrior',4,7,NULL),
  ('inflict-pain','psion',2,3,NULL),('inflict-pain','wilder',2,3,NULL),
  ('insanity','psion',7,13,NULL),('insanity','wilder',7,13,NULL),
  ('intellect-fortress','psion',4,7,NULL),('intellect-fortress','wilder',4,7,NULL),
  ('iron-body-psionic','psion',8,15,NULL),('iron-body-psionic','wilder',8,15,NULL),
  ('keen-edge-psionic','psion',3,5,NULL),('keen-edge-psionic','wilder',3,5,NULL),('keen-edge-psionic','psychic-warrior',3,5,NULL),
  ('knock-psionic','psion',2,3,NULL),('knock-psionic','wilder',2,3,NULL),
  ('know-direction-and-location','psion',1,1,NULL),('know-direction-and-location','wilder',1,1,NULL),
  ('leech-field','psion',5,9,NULL),('leech-field','wilder',5,9,NULL),
  ('levitate-psionic','psion',2,3,NULL),('levitate-psionic','wilder',2,3,NULL),('levitate-psionic','psychic-warrior',2,3,NULL)
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
