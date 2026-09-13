-- XPH Q-R class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('quintessence','psion',4,7,'metacreativity'),
  ('read-thoughts','psion',2,3,'telepathy'),
  ('reality-revision','psion',9,17,NULL),('reality-revision','wilder',9,17,NULL),
  ('recall-agony','psion',2,3,NULL),('recall-agony','wilder',2,3,NULL),
  ('recall-death','psion',8,15,NULL),('recall-death','wilder',8,15,NULL),
  ('reddopsi','psion',7,13,'psychokinesis'),
  ('remote-view-trap','psion',6,11,NULL),('remote-view-trap','wilder',6,11,NULL),
  ('remote-viewing','psion',4,7,'clairsentience'),
  ('restoration-psionic','psion',6,11,'psychometabolism'),
  ('restore-extremity','psion',5,9,'psychometabolism'),
  ('retrieve','psion',6,11,NULL),('retrieve','wilder',6,11,NULL)
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
