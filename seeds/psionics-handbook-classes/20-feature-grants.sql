-- D&D 3.0 Psionics Handbook class feature grants.
WITH desired(class_slug,class_level,feature_slug,parameters,rules_text) AS (VALUES
('psion',1,'weapon-armor-proficiency',NULL,NULL),
('psion',1,'discipline',NULL,NULL),
('psion',1,'powers',NULL,NULL),
('psion',1,'psicrystal',NULL,NULL),
('psion',1,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 5}}}','Psion combat-mode progression at level 1.'),
('psion',3,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 6}}}','Psion combat-mode progression at level 3.'),
('psion',5,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 7}}}','Psion combat-mode progression at level 5.'),
('psion',7,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 8}}}','Psion combat-mode progression at level 7.'),
('psion',9,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 9}}}','Psion combat-mode progression at level 9.'),
('psion',11,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 10}}}','Psion combat-mode progression at level 11.'),
('psychic-warrior',1,'weapon-armor-proficiency',NULL,NULL),
('psychic-warrior',1,'powers',NULL,NULL),
('psychic-warrior',1,'bonus-feat',NULL,NULL),
('psychic-warrior',2,'bonus-feat',NULL,NULL),
('psychic-warrior',5,'bonus-feat',NULL,NULL),
('psychic-warrior',8,'bonus-feat',NULL,NULL),
('psychic-warrior',11,'bonus-feat',NULL,NULL),
('psychic-warrior',14,'bonus-feat',NULL,NULL),
('psychic-warrior',17,'bonus-feat',NULL,NULL),
('psychic-warrior',20,'bonus-feat',NULL,NULL),
('psychic-warrior',6,'weapon-specialization',NULL,NULL),
('psychic-warrior',1,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 2}}}',NULL),
('psychic-warrior',3,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 3}}}',NULL),
('psychic-warrior',7,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 4}}}',NULL),
('psychic-warrior',9,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 5}}}',NULL),
('psychic-warrior',10,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 6}}}',NULL),
('psychic-warrior',12,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 7}}}',NULL),
('psychic-warrior',13,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 8}}}',NULL),
('psychic-warrior',15,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 9}}}',NULL),
('psychic-warrior',16,'psionic-combat-modes','{"extension": {"key": "dnd35.ph3e.psionic-combat-modes", "version": 1, "parameters": {"modesKnown": 10}}}',NULL),
('metamind',1,'inner-strength',NULL,NULL),('metamind',2,'inner-strength',NULL,NULL),('metamind',4,'inner-strength',NULL,NULL),('metamind',6,'inner-strength',NULL,NULL),
('metamind',1,'power-psicrystal',NULL,NULL),('metamind',3,'trigger-power',NULL,NULL),('metamind',5,'trigger-power',NULL,NULL),('metamind',7,'trigger-power',NULL,NULL),('metamind',9,'trigger-power',NULL,NULL),('metamind',8,'psychic-vampire',NULL,NULL),('metamind',10,'apotheosis',NULL,NULL),
('pyrokineticist',1,'touch-aflame',NULL,NULL),('pyrokineticist',1,'fire-lash',NULL,NULL),('pyrokineticist',2,'fire-adaptation',NULL,NULL),('pyrokineticist',2,'hand-afire',NULL,NULL),('pyrokineticist',3,'bolt-of-fire',NULL,NULL),('pyrokineticist',4,'weapon-afire',NULL,NULL),('pyrokineticist',5,'breath-of-the-dragon',NULL,NULL),('pyrokineticist',6,'nimbus',NULL,NULL),('pyrokineticist',7,'firewalk',NULL,NULL),('pyrokineticist',8,'fear-no-fire',NULL,NULL),('pyrokineticist',9,'heat-death',NULL,NULL),('pyrokineticist',10,'fire-lord',NULL,NULL),
('slayer',1,'weapon-armor-proficiency',NULL,NULL),('slayer',1,'favored-enemy-illithid',NULL,NULL),('slayer',1,'illithid-sense',NULL,NULL),('slayer',2,'brain-nausea',NULL,NULL),('slayer',4,'lucid-buffer',NULL,NULL),('slayer',6,'cerebral-blind',NULL,NULL),('slayer',8,'breach-power-resistance',NULL,NULL),('slayer',10,'blast-feedback',NULL,NULL),('slayer',3,'bonus-feat',NULL,NULL),('slayer',5,'bonus-feat',NULL,NULL),('slayer',7,'bonus-feat',NULL,NULL),('slayer',9,'bonus-feat',NULL,NULL),
('soulknife',1,'weapon-armor-proficiency',NULL,NULL),
('soulknife',1,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 0}}}',NULL),
('soulknife',1,'sneak-attack','{"dice": {"count": 1, "size": 6}}',NULL),('soulknife',2,'imbed-power',NULL,NULL),('soulknife',2,'throw-mind-blade',NULL,NULL),('soulknife',3,'sneak-attack','{"dice": {"count": 2, "size": 6}}',NULL),('soulknife',4,'imbed-psionic-attack',NULL,NULL),('soulknife',5,'sneak-attack','{"dice": {"count": 3, "size": 6}}',NULL),('soulknife',6,'sever-life',NULL,NULL),('soulknife',6,'free-draw',NULL,NULL),('soulknife',7,'sneak-attack','{"dice": {"count": 4, "size": 6}}',NULL),('soulknife',8,'upgrade',NULL,NULL),('soulknife',9,'sneak-attack','{"dice": {"count": 5, "size": 6}}',NULL),('soulknife',10,'knife-to-the-soul',NULL,NULL),
('soulknife',2,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 1}}}',NULL),('soulknife',4,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 2}}}',NULL),('soulknife',6,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 3}}}',NULL),('soulknife',8,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 4}}}',NULL),('soulknife',10,'mind-blade','{"extension": {"key": "dnd35.ph3e.mind-blade", "version": 1, "parameters": {"enhancementBonus": 5}}}',NULL))
INSERT INTO dnd35_class_feature_grants(class_level_id,class_feature_id,parameters,rules_text)
SELECT cl.id,cf.id,d.parameters,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.id='ph3e-class-'||d.class_slug
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.class_level
JOIN dnd35_class_features cf ON cf.id='ph3e-class-feature-'||d.class_slug||'-'||d.feature_slug
ON CONFLICT(class_level_id,class_feature_id) DO UPDATE SET parameters=excluded.parameters,rules_text=excluded.rules_text;
