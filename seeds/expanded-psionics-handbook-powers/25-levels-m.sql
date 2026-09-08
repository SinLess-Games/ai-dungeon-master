-- XPH M class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('major-creation-psionic','psion',5,9,NULL),('major-creation-psionic','wilder',5,9,NULL),
  ('matter-agitation','psion',1,1,NULL),('matter-agitation','wilder',1,1,NULL),
  ('matter-manipulation','psion',8,15,NULL),('matter-manipulation','wilder',8,15,NULL),
  ('mental-barrier','psion',3,5,NULL),('mental-barrier','wilder',3,5,NULL),('mental-barrier','psychic-warrior',3,5,NULL),
  ('mental-disruption','psion',2,3,NULL),('mental-disruption','wilder',2,3,NULL),
  ('metaconcert','psion',5,9,'telepathy'),('metaconcert','psychic-warrior',5,9,NULL),
  ('metafaculty','psion',9,17,'clairsentience'),
  ('metamorphosis','psion',4,7,'psychometabolism'),
  ('metamorphosis-greater','psion',9,17,'psychometabolism'),
  ('metaphysical-claw','psychic-warrior',1,1,NULL),
  ('metaphysical-weapon','psychic-warrior',1,1,NULL),
  ('microcosm','psion',9,17,NULL),('microcosm','wilder',9,17,NULL),
  ('mind-blank-personal','psion',7,13,NULL),('mind-blank-personal','wilder',7,13,NULL),('mind-blank-personal','psychic-warrior',6,11,NULL),
  ('mind-blank-psionic','psion',8,15,NULL),('mind-blank-psionic','wilder',8,15,NULL),
  ('mind-probe','psion',5,9,'telepathy'),
  ('mind-seed','psion',8,15,'telepathy'),
  ('mind-switch','psion',6,11,'telepathy'),
  ('mind-switch-true','psion',9,17,'telepathy'),
  ('mind-thrust','psion',1,1,NULL),('mind-thrust','wilder',1,1,NULL),
  ('mind-trap','psion',3,5,NULL),('mind-trap','wilder',3,5,NULL),
  ('mindlink','psion',1,1,'telepathy'),
  ('mindlink-thieving','psion',4,7,'telepathy'),
  ('mindwipe','psion',4,7,NULL),('mindwipe','wilder',4,7,NULL),
  ('minor-creation-psionic','psion',1,1,'metacreativity'),
  ('missive','psion',1,1,NULL),('missive','wilder',1,1,NULL),
  ('missive-mass','psion',2,3,NULL),('missive-mass','wilder',2,3,NULL),
  ('modify-memory-psionic','psion',4,7,'telepathy'),
  ('moment-of-prescience-psionic','psion',7,13,NULL),('moment-of-prescience-psionic','wilder',7,13,NULL),
  ('my-light','psion',1,1,NULL),('my-light','wilder',1,1,NULL),('my-light','psychic-warrior',1,1,NULL)
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
