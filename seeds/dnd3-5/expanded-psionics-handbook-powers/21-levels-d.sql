-- XPH D power class/discipline levels and exact base PP costs.
WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
('danger-sense','psion',3,5,NULL),('danger-sense','wilder',3,5,NULL),('danger-sense','psychic-warrior',3,5,NULL),
('darkvision-psionic','psion',3,5,NULL),('darkvision-psionic','wilder',3,5,NULL),('darkvision-psionic','psychic-warrior',2,3,NULL),
('daze-psionic','psion',1,1,NULL),('daze-psionic','wilder',1,1,NULL),
('death-urge','psion',4,7,NULL),('death-urge','wilder',4,7,NULL),
('deceleration','psion',1,1,NULL),('deceleration','wilder',1,1,NULL),
('decerebrate','psion',7,13,NULL),('decerebrate','wilder',7,13,NULL),
('deja-vu','psion',1,1,NULL),('deja-vu','wilder',1,1,NULL),
('demoralize','psion',1,1,NULL),('demoralize','wilder',1,1,NULL),
('destiny-dissonance','psion',1,1,'clairsentience'),
('detect-hostile-intent','psion',2,3,NULL),('detect-hostile-intent','wilder',2,3,NULL),('detect-hostile-intent','psychic-warrior',2,3,NULL),
('detect-psionics','psion',1,1,NULL),('detect-psionics','wilder',1,1,NULL),('detect-psionics','psychic-warrior',1,1,NULL),
('detect-remote-viewing','psion',4,7,NULL),('detect-remote-viewing','wilder',4,7,NULL),
('detect-teleportation','psion',1,1,'psychoportation'),
('dimension-door-psionic','psion',4,7,NULL),('dimension-door-psionic','wilder',4,7,NULL),('dimension-door-psionic','psychic-warrior',4,7,NULL),
('dimension-slide','psychic-warrior',3,5,NULL),
('dimension-swap','psion',2,3,'psychoportation'),('dimension-swap','psychic-warrior',2,3,NULL),
('dimensional-anchor-psionic','psion',4,7,'psychoportation'),
('disable','psion',1,1,NULL),('disable','wilder',1,1,NULL),
('disintegrate-psionic','psion',6,11,NULL),('disintegrate-psionic','wilder',6,11,NULL),
('dismissal-psionic','psion',4,7,'psychoportation'),
('dismiss-ectoplasm','psion',3,5,NULL),('dismiss-ectoplasm','wilder',3,5,NULL),
('dispel-psionics','psion',3,5,NULL),('dispel-psionics','wilder',3,5,NULL),
('dispelling-buffer','psion',6,11,'psychokinesis'),('dispelling-buffer','psychic-warrior',6,11,NULL),
('dissipating-touch','psion',1,1,NULL),('dissipating-touch','wilder',1,1,NULL),('dissipating-touch','psychic-warrior',1,1,NULL),
('dissolving-touch','psychic-warrior',2,3,NULL),
('dissolving-weapon','psychic-warrior',2,3,NULL),
('distract','psion',1,1,NULL),('distract','wilder',1,1,NULL),('distract','psychic-warrior',1,1,NULL),
('divert-teleport','psion',7,13,NULL),('divert-teleport','wilder',7,13,NULL),
('divination-psionic','psion',4,7,NULL),('divination-psionic','wilder',4,7,NULL),
('dominate-psionic','psion',4,7,'telepathy'),
('dream-travel','psion',7,13,'psychoportation'),
('duodimensional-claw','psychic-warrior',3,5,NULL)
)
INSERT INTO dnd35_power_class_levels(power_id,class_id,power_level,power_points,specialist_discipline_id)
SELECT p.id,c.id,d.power_level,d.power_points,
CASE WHEN d.specialist IS NULL THEN NULL ELSE 'xph-power-discipline-'||d.specialist END
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
ON CONFLICT(power_id,class_id) DO UPDATE SET power_level=excluded.power_level,power_points=excluded.power_points,specialist_discipline_id=excluded.specialist_discipline_id;
