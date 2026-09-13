-- XPH E power class/discipline levels and exact base PP costs.
WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
('ecto-protection','psion',1,1,NULL),('ecto-protection','wilder',1,1,NULL),
('ectoplasmic-cocoon','psion',3,5,'metacreativity'),
('ectoplasmic-cocoon-mass','psion',7,13,'metacreativity'),
('ectoplasmic-form','psion',3,5,'psychometabolism'),('ectoplasmic-form','psychic-warrior',3,5,NULL),
('ectoplasmic-shambler','psion',5,9,NULL),('ectoplasmic-shambler','wilder',5,9,NULL),
('ego-whip','psion',2,3,NULL),('ego-whip','wilder',2,3,NULL),
('elfsight','psion',2,3,NULL),('elfsight','wilder',2,3,NULL),('elfsight','psychic-warrior',1,1,NULL),
('empathic-feedback','psion',4,7,NULL),('empathic-feedback','wilder',4,7,NULL),('empathic-feedback','psychic-warrior',3,5,NULL),
('empathic-transfer','psion',2,3,'psychometabolism'),('empathic-transfer','psychic-warrior',2,3,NULL),
('empathic-transfer-hostile','psion',3,5,'telepathy'),('empathic-transfer-hostile','psychic-warrior',3,5,NULL),
('empathy','psion',1,1,NULL),('empathy','wilder',1,1,NULL),
('empty-mind','psion',1,1,NULL),('empty-mind','wilder',1,1,NULL),('empty-mind','psychic-warrior',1,1,NULL),
('energy-adaptation','psion',4,7,NULL),('energy-adaptation','wilder',4,7,NULL),('energy-adaptation','psychic-warrior',4,7,NULL),
('energy-adaptation-specified','psion',2,3,NULL),('energy-adaptation-specified','wilder',2,3,NULL),('energy-adaptation-specified','psychic-warrior',2,3,NULL),
('energy-ball','psion',4,7,'psychokinesis'),
('energy-bolt','psion',3,5,NULL),('energy-bolt','wilder',3,5,NULL),
('energy-burst','psion',3,5,NULL),('energy-burst','wilder',3,5,NULL),
('energy-cone','psion',3,5,'psychokinesis'),
('energy-conversion','psion',7,13,NULL),('energy-conversion','wilder',7,13,NULL),
('energy-current','psion',5,9,'psychokinesis'),
('energy-missile','psion',2,3,'psychokinesis'),
('energy-push','psion',2,3,NULL),('energy-push','wilder',2,3,NULL),
('energy-ray','psion',1,1,NULL),('energy-ray','wilder',1,1,NULL),
('energy-retort','psion',3,5,NULL),('energy-retort','wilder',3,5,NULL),
('energy-stun','psion',2,3,NULL),('energy-stun','wilder',2,3,NULL),
('energy-wall','psion',3,5,NULL),('energy-wall','wilder',3,5,NULL),
('energy-wave','psion',7,13,NULL),('energy-wave','wilder',7,13,NULL),
('entangling-ectoplasm','psion',1,1,NULL),('entangling-ectoplasm','wilder',1,1,NULL),
('eradicate-invisibility','psion',3,5,NULL),('eradicate-invisibility','wilder',3,5,NULL),
('escape-detection','psion',3,5,'clairsentience'),('escape-detection','psychic-warrior',3,5,NULL),
('ethereal-jaunt-psionic','psion',7,13,'psychoportation'),
('etherealness-psionic','psion',9,17,NULL),('etherealness-psionic','wilder',9,17,NULL),
('evade-burst','psion',7,13,NULL),('evade-burst','wilder',7,13,NULL),('evade-burst','psychic-warrior',3,5,NULL),
('exhalation-of-the-black-dragon','psychic-warrior',3,5,NULL),
('expansion','psychic-warrior',1,1,NULL)
)
INSERT INTO dnd35_power_class_levels(power_id,class_id,power_level,power_points,specialist_discipline_id)
SELECT p.id,c.id,d.power_level,d.power_points,CASE WHEN d.specialist IS NULL THEN NULL ELSE 'xph-power-discipline-'||d.specialist END
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
ON CONFLICT(power_id,class_id) DO UPDATE SET power_level=excluded.power_level,power_points=excluded.power_points,specialist_discipline_id=excluded.specialist_discipline_id;
