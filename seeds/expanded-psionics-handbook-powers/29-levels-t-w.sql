-- XPH T-W class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('telekinetic-force','psion',3,5,NULL),('telekinetic-force','wilder',3,5,NULL),
  ('telekinetic-maneuver','psion',4,7,NULL),('telekinetic-maneuver','wilder',4,7,NULL),
  ('telekinetic-sphere-psionic','psion',8,15,'psychokinesis'),
  ('telekinetic-thrust','psion',3,5,NULL),('telekinetic-thrust','wilder',3,5,NULL),
  ('telempathic-projection','psion',1,1,NULL),('telempathic-projection','wilder',1,1,NULL),
  ('teleport-psionic','psion',5,9,'psychoportation'),
  ('teleport-psionic-greater','psion',8,15,NULL),('teleport-psionic-greater','wilder',8,15,NULL),
  ('teleportation-circle-psionic','psion',9,17,'psychoportation'),
  ('teleport-trigger','psion',5,9,'psychoportation'),
  ('temporal-acceleration','psion',6,11,NULL),('temporal-acceleration','wilder',6,11,NULL),
  ('thicken-skin','psion',1,1,'psychometabolism'),('thicken-skin','psychic-warrior',1,1,NULL),
  ('thought-shield','psion',2,3,NULL),('thought-shield','wilder',2,3,NULL),('thought-shield','psychic-warrior',2,3,NULL),
  ('time-hop','psion',3,5,NULL),('time-hop','wilder',3,5,NULL),
  ('time-hop-mass','psion',8,15,'psychoportation'),
  ('time-regression','psion',9,17,'psychoportation'),
  ('timeless-body','psion',9,17,NULL),('timeless-body','wilder',9,17,NULL),
  ('tongues-psionic','psion',2,3,NULL),('tongues-psionic','wilder',2,3,NULL),
  ('tornado-blast','psion',9,17,'psychokinesis'),
  ('touchsight','psion',3,5,NULL),('touchsight','wilder',3,5,NULL),
  ('tower-of-iron-will','psion',5,9,NULL),('tower-of-iron-will','wilder',5,9,NULL),
  ('trace-teleport','psion',4,7,NULL),('trace-teleport','wilder',4,7,NULL),
  ('true-creation','psion',9,17,'metacreativity'),
  ('true-metabolism','psion',8,15,NULL),('true-metabolism','wilder',8,15,NULL),
  ('true-seeing-psionic','psion',5,9,NULL),('true-seeing-psionic','wilder',5,9,NULL),
  ('truevenom','psychic-warrior',4,7,NULL),
  ('truevenom-weapon','psychic-warrior',4,7,NULL),
  ('ubiquitous-vision','psion',3,5,NULL),('ubiquitous-vision','wilder',3,5,NULL),('ubiquitous-vision','psychic-warrior',3,5,NULL),
  ('ultrablast','psion',7,13,NULL),('ultrablast','wilder',7,13,NULL),
  ('vampiric-blade','psychic-warrior',3,5,NULL),
  ('vigor','psion',1,1,NULL),('vigor','wilder',1,1,NULL),('vigor','psychic-warrior',1,1,NULL),
  ('wall-of-ectoplasm','psion',4,7,NULL),('wall-of-ectoplasm','wilder',4,7,NULL),
  ('wall-walker','psychic-warrior',2,3,NULL),
  ('weapon-of-energy','psychic-warrior',4,7,NULL)
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
