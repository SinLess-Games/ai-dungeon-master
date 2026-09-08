-- XPH S class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('schism','psion',4,7,'telepathy'),
  ('second-chance','psion',5,9,'clairsentience'),
  ('sense-link','psion',1,1,NULL),('sense-link','wilder',1,1,NULL),
  ('sense-link-forced','psion',2,3,NULL),('sense-link-forced','wilder',2,3,NULL),
  ('sensitivity-to-psychic-impressions','psion',2,3,'clairsentience'),
  ('sequester-psionic','psion',7,13,NULL),('sequester-psionic','wilder',7,13,NULL),
  ('shadow-body','psion',8,15,NULL),('shadow-body','wilder',8,15,NULL),
  ('share-pain','psion',2,3,NULL),('share-pain','wilder',2,3,NULL),
  ('share-pain-forced','psion',3,5,NULL),('share-pain-forced','wilder',3,5,NULL),
  ('shatter-mind-blank','psion',5,9,NULL),('shatter-mind-blank','wilder',5,9,NULL),
  ('skate','psion',1,1,NULL),('skate','wilder',1,1,NULL),('skate','psychic-warrior',1,1,NULL),
  ('solicit-psicrystal','psion',3,5,NULL),('solicit-psicrystal','wilder',3,5,NULL),
  ('steadfast-perception','psychic-warrior',4,7,NULL),
  ('stomp','psychic-warrior',1,1,NULL),
  ('strength-of-my-enemy','psychic-warrior',2,3,NULL),
  ('suggestion-psionic','psion',2,3,'telepathy'),
  ('suspend-life','psion',6,11,NULL),('suspend-life','wilder',6,11,NULL),('suspend-life','psychic-warrior',6,11,NULL),
  ('sustenance','psion',2,3,NULL),('sustenance','wilder',2,3,NULL),('sustenance','psychic-warrior',2,3,NULL),
  ('swarm-of-crystals','psion',2,3,NULL),('swarm-of-crystals','wilder',2,3,NULL),
  ('synesthete','psion',1,1,NULL),('synesthete','wilder',1,1,NULL),('synesthete','psychic-warrior',1,1,NULL)
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
