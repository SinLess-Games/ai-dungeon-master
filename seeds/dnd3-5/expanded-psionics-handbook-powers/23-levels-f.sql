-- XPH F class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('fabricate-psionic','psion',4,7,'metacreativity'),
  ('fabricate-greater-psionic','psion',6,11,'metacreativity'),
  ('false-sensory-input','psion',3,5,'telepathy'),
  ('far-hand','psion',1,1,NULL),('far-hand','wilder',1,1,NULL),
  ('fate-link','psion',3,5,'clairsentience'),
  ('fate-of-one','psion',7,13,'clairsentience'),
  ('feat-leech','psion',2,3,NULL),('feat-leech','wilder',2,3,NULL),('feat-leech','psychic-warrior',2,3,NULL),
  ('fiery-discorporation','psion',5,9,'psychokinesis'),
  ('fission','psion',7,13,'psychometabolism'),
  ('float','psion',1,1,NULL),('float','wilder',1,1,NULL),('float','psychic-warrior',1,1,NULL),
  ('fly-psionic','psion',4,7,'psychoportation'),
  ('force-screen','psion',1,1,NULL),('force-screen','wilder',1,1,NULL),('force-screen','psychic-warrior',1,1,NULL),
  ('form-of-doom','psychic-warrior',6,11,NULL),
  ('freedom-of-movement-psionic','psion',4,7,NULL),('freedom-of-movement-psionic','wilder',4,7,NULL),('freedom-of-movement-psionic','psychic-warrior',4,7,NULL),
  ('fuse-flesh','psion',6,11,NULL),('fuse-flesh','wilder',6,11,NULL),
  ('fusion','psion',8,15,'psychometabolism')
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
