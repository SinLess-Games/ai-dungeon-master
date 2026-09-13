-- Expanded Psionics Handbook class feature grants by level.
-- Grant parameters encode scaling values from the class tables while concise rules_text
-- preserves the human-readable table meaning.

WITH desired(class_slug, level, feature_slug, parameters, rules_text) AS (VALUES
  -- Psion
  ('psion',1,'weapon-armor-proficiency',NULL,NULL),
  ('psion',1,'powers',NULL,NULL),
  ('psion',1,'discipline',NULL,NULL),
  ('psion',1,'bonus-feat','{"rank":1}',NULL),
  ('psion',5,'bonus-feat','{"rank":2}',NULL),
  ('psion',10,'bonus-feat','{"rank":3}',NULL),
  ('psion',15,'bonus-feat','{"rank":4}',NULL),
  ('psion',20,'bonus-feat','{"rank":5}',NULL),

  -- Psychic warrior
  ('psychic-warrior',1,'weapon-armor-proficiency',NULL,NULL),
  ('psychic-warrior',1,'powers',NULL,NULL),
  ('psychic-warrior',1,'bonus-feat','{"rank":1}',NULL),
  ('psychic-warrior',2,'bonus-feat','{"rank":2}',NULL),
  ('psychic-warrior',5,'bonus-feat','{"rank":3}',NULL),
  ('psychic-warrior',8,'bonus-feat','{"rank":4}',NULL),
  ('psychic-warrior',11,'bonus-feat','{"rank":5}',NULL),
  ('psychic-warrior',14,'bonus-feat','{"rank":6}',NULL),
  ('psychic-warrior',17,'bonus-feat','{"rank":7}',NULL),
  ('psychic-warrior',20,'bonus-feat','{"rank":8}',NULL),

  -- Soulknife
  ('soulknife',1,'weapon-armor-proficiency',NULL,NULL),
  ('soulknife',1,'mind-blade','{"rank":0,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":0}}}',NULL),
  ('soulknife',1,'weapon-focus-mind-blade','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featName":"Weapon Focus","choice":"mind blade"}}}',NULL),
  ('soulknife',1,'wild-talent','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featId":"xph-feat-wild-talent"}}}',NULL),
  ('soulknife',2,'throw-mind-blade',NULL,NULL),
  ('soulknife',3,'psychic-strike','{"dice":"1d8","rank":1}', 'Psychic strike +1d8.'),
  ('soulknife',4,'mind-blade','{"rank":1,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":1}}}', '+1 mind blade.'),
  ('soulknife',5,'free-draw',NULL,NULL),
  ('soulknife',5,'shape-mind-blade',NULL,NULL),
  ('soulknife',6,'mind-blade-enhancement','{"rank":1}', 'Mind blade enhancement +1 equivalent.'),
  ('soulknife',6,'speed-of-thought','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featId":"xph-feat-speed-of-thought"}}}',NULL),
  ('soulknife',7,'psychic-strike','{"dice":"2d8","rank":2}', 'Psychic strike +2d8.'),
  ('soulknife',8,'mind-blade','{"rank":2,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":2}}}', '+2 mind blade.'),
  ('soulknife',9,'bladewind',NULL,NULL),
  ('soulknife',9,'greater-weapon-focus-mind-blade','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featName":"Greater Weapon Focus","choice":"mind blade"}}}',NULL),
  ('soulknife',10,'mind-blade-enhancement','{"rank":2}', 'Mind blade enhancement +2 equivalent.'),
  ('soulknife',11,'psychic-strike','{"dice":"3d8","rank":3}', 'Psychic strike +3d8.'),
  ('soulknife',12,'mind-blade','{"rank":3,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":3}}}', '+3 mind blade.'),
  ('soulknife',13,'knife-to-the-soul',NULL,NULL),
  ('soulknife',14,'mind-blade-enhancement','{"rank":3}', 'Mind blade enhancement +3 equivalent.'),
  ('soulknife',15,'psychic-strike','{"dice":"4d8","rank":4}', 'Psychic strike +4d8.'),
  ('soulknife',16,'mind-blade','{"rank":4,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":4}}}', '+4 mind blade.'),
  ('soulknife',17,'multiple-throw',NULL,NULL),
  ('soulknife',18,'mind-blade-enhancement','{"rank":4}', 'Mind blade enhancement +4 equivalent.'),
  ('soulknife',19,'psychic-strike','{"dice":"5d8","rank":5}', 'Psychic strike +5d8.'),
  ('soulknife',20,'mind-blade','{"rank":5,"extension":{"key":"dnd35.xph.soulknife.mind-blade","version":1,"parameters":{"enhancementBonus":5}}}', '+5 mind blade.'),

  -- Wilder
  ('wilder',1,'weapon-armor-proficiency',NULL,NULL),
  ('wilder',1,'powers',NULL,NULL),
  ('wilder',1,'wild-surge','{"rank":1}', 'Wild surge +1.'),
  ('wilder',1,'psychic-enervation',NULL,NULL),
  ('wilder',2,'elude-touch',NULL,NULL),
  ('wilder',3,'wild-surge','{"rank":2}', 'Wild surge +2.'),
  ('wilder',4,'surging-euphoria','{"rank":1}', 'Surging euphoria +1.'),
  ('wilder',5,'volatile-mind','{"rank":1,"extension":{"key":"dnd35.xph.wilder.volatile-mind","version":1,"parameters":{"additionalPowerPoints":1}}}', 'Telepathy surcharge 1 power point.'),
  ('wilder',7,'wild-surge','{"rank":3}', 'Wild surge +3.'),
  ('wilder',9,'volatile-mind','{"rank":2,"extension":{"key":"dnd35.xph.wilder.volatile-mind","version":1,"parameters":{"additionalPowerPoints":2}}}', 'Telepathy surcharge 2 power points.'),
  ('wilder',11,'wild-surge','{"rank":4}', 'Wild surge +4.'),
  ('wilder',12,'surging-euphoria','{"rank":2}', 'Surging euphoria +2.'),
  ('wilder',13,'volatile-mind','{"rank":3,"extension":{"key":"dnd35.xph.wilder.volatile-mind","version":1,"parameters":{"additionalPowerPoints":3}}}', 'Telepathy surcharge 3 power points.'),
  ('wilder',15,'wild-surge','{"rank":5}', 'Wild surge +5.'),
  ('wilder',17,'volatile-mind','{"rank":4,"extension":{"key":"dnd35.xph.wilder.volatile-mind","version":1,"parameters":{"additionalPowerPoints":4}}}', 'Telepathy surcharge 4 power points.'),
  ('wilder',19,'wild-surge','{"rank":6}', 'Wild surge +6.'),
  ('wilder',20,'surging-euphoria','{"rank":3}', 'Surging euphoria +3.'),

  -- Cerebremancer: dual progression at every level.
  ('cerebremancer',1,'dual-progression','{"rank":1}',NULL),
  ('cerebremancer',2,'dual-progression','{"rank":2}',NULL),
  ('cerebremancer',3,'dual-progression','{"rank":3}',NULL),
  ('cerebremancer',4,'dual-progression','{"rank":4}',NULL),
  ('cerebremancer',5,'dual-progression','{"rank":5}',NULL),
  ('cerebremancer',6,'dual-progression','{"rank":6}',NULL),
  ('cerebremancer',7,'dual-progression','{"rank":7}',NULL),
  ('cerebremancer',8,'dual-progression','{"rank":8}',NULL),
  ('cerebremancer',9,'dual-progression','{"rank":9}',NULL),
  ('cerebremancer',10,'dual-progression','{"rank":10}',NULL),

  -- Elocater
  ('elocater',1,'scorn-earth',NULL,NULL),
  ('elocater',1,'sidestep-charge','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featId":"xph-feat-sidestep-charge"}}}',NULL),
  ('elocater',1,'powers-known','{"rank":1}', '+1 level of existing manifesting class.'),
  ('elocater',2,'opportunistic-strike','{"rank":2}', 'Opportunistic strike +2.'),
  ('elocater',3,'dimension-step','{"uses":1,"period":"day"}',NULL),
  ('elocater',3,'powers-known','{"rank":2}', '+1 level of existing manifesting class.'),
  ('elocater',4,'flanker',NULL,NULL),
  ('elocater',4,'powers-known','{"rank":3}', '+1 level of existing manifesting class.'),
  ('elocater',5,'opportunistic-strike','{"rank":4}', 'Opportunistic strike +4.'),
  ('elocater',6,'transporter',NULL,NULL),
  ('elocater',6,'powers-known','{"rank":4}', '+1 level of existing manifesting class.'),
  ('elocater',7,'capricious-step',NULL,NULL),
  ('elocater',7,'powers-known','{"rank":5}', '+1 level of existing manifesting class.'),
  ('elocater',8,'opportunistic-strike','{"rank":6}', 'Opportunistic strike +6.'),
  ('elocater',9,'dimension-spring-attack','{"uses":1,"period":"day"}',NULL),
  ('elocater',9,'powers-known','{"rank":6}', '+1 level of existing manifesting class.'),
  ('elocater',10,'accelerated-action','{"uses":5,"period":"day"}', 'Accelerated action for a total of 5 rounds per day.'),
  ('elocater',10,'powers-known','{"rank":7}', '+1 level of existing manifesting class.'),

  -- Fist of Zuoken
  ('fist-of-zuoken',1,'monk-abilities',NULL,NULL),
  ('fist-of-zuoken',1,'powers',NULL,NULL),
  ('fist-of-zuoken',5,'bonus-psionic-feat','{"rank":1}',NULL),
  ('fist-of-zuoken',10,'bonus-psionic-feat','{"rank":2}',NULL),

  -- Illithid slayer
  ('illithid-slayer',1,'favored-enemy','{"rank":2}', 'Favored enemy +2.'),
  ('illithid-slayer',1,'enemy-sense',NULL,NULL),
  ('illithid-slayer',2,'brain-nausea',NULL,NULL),
  ('illithid-slayer',2,'powers-known','{"rank":1}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',3,'lucid-buffer','{"rank":4}', 'Gain +4 competence bonus against compulsions and mind-affecting effects.'),
  ('illithid-slayer',3,'powers-known','{"rank":2}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',4,'favored-enemy','{"rank":4}', 'Favored enemy +4.'),
  ('illithid-slayer',4,'powers-known','{"rank":3}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',5,'powers-known','{"rank":4}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',6,'cerebral-blind',NULL,NULL),
  ('illithid-slayer',6,'powers-known','{"rank":5}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',7,'favored-enemy','{"rank":6}', 'Favored enemy +6.'),
  ('illithid-slayer',7,'powers-known','{"rank":6}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',8,'breach-power-resistance',NULL,NULL),
  ('illithid-slayer',8,'powers-known','{"rank":7}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',9,'cerebral-immunity',NULL,NULL),
  ('illithid-slayer',9,'powers-known','{"rank":8}', '+1 level of existing manifesting class.'),
  ('illithid-slayer',10,'blast-feedback',NULL,NULL),
  ('illithid-slayer',10,'favored-enemy','{"rank":8}', 'Favored enemy +8.'),
  ('illithid-slayer',10,'powers-known','{"rank":9}', '+1 level of existing manifesting class.'),

  -- Metamind
  ('metamind',1,'free-manifesting','{"rank":1,"uses":3,"period":"day","extension":{"key":"dnd35.xph.metamind.free-manifesting","version":1,"parameters":{"powerLevel":1}}}', 'Free manifesting: 1st-level power, 3/day.'),
  ('metamind',2,'cognizance-psicrystal','{"rank":5}', 'Cognizance psicrystal capacity 5 power points.'),
  ('metamind',2,'powers-known','{"rank":1}', '+1 level of existing manifesting class.'),
  ('metamind',3,'free-manifesting','{"rank":2,"uses":3,"period":"day","extension":{"key":"dnd35.xph.metamind.free-manifesting","version":1,"parameters":{"powerLevel":2}}}', 'Free manifesting: 2nd-level power, 3/day.'),
  ('metamind',4,'cognizance-psicrystal','{"rank":7}', 'Cognizance psicrystal capacity 7 power points.'),
  ('metamind',4,'powers-known','{"rank":2}', '+1 level of existing manifesting class.'),
  ('metamind',5,'free-manifesting','{"rank":3,"uses":1,"period":"day","extension":{"key":"dnd35.xph.metamind.free-manifesting","version":1,"parameters":{"powerLevel":3}}}', 'Free manifesting: 3rd-level power, 1/day.'),
  ('metamind',6,'cognizance-psicrystal','{"rank":9}', 'Cognizance psicrystal capacity 9 power points.'),
  ('metamind',6,'powers-known','{"rank":3}', '+1 level of existing manifesting class.'),
  ('metamind',7,'free-manifesting','{"rank":4,"uses":1,"period":"day","extension":{"key":"dnd35.xph.metamind.free-manifesting","version":1,"parameters":{"powerLevel":4}}}', 'Free manifesting: 4th-level power, 1/day.'),
  ('metamind',8,'cognizance-psicrystal','{"rank":11}', 'Cognizance psicrystal capacity 11 power points.'),
  ('metamind',8,'powers-known','{"rank":4}', '+1 level of existing manifesting class.'),
  ('metamind',9,'free-manifesting','{"rank":5,"uses":1,"period":"day","extension":{"key":"dnd35.xph.metamind.free-manifesting","version":1,"parameters":{"powerLevel":5}}}', 'Free manifesting: 5th-level power, 1/day.'),
  ('metamind',10,'font-of-power','{"uses":1,"period":"day"}',NULL),
  ('metamind',10,'powers-known','{"rank":5}', '+1 level of existing manifesting class.'),

  -- Psion uncarnate
  ('psion-uncarnate',1,'incorporeal-touch','{"dice":"1d6","uses":3,"period":"day"}', 'Incorporeal touch 1d6, 3/day.'),
  ('psion-uncarnate',1,'uncarnate-armor',NULL,NULL),
  ('psion-uncarnate',2,'shed-body','{"uses":1,"period":"day"}',NULL),
  ('psion-uncarnate',2,'powers-known','{"rank":1}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',3,'assume-equipment',NULL,NULL),
  ('psion-uncarnate',3,'powers-known','{"rank":2}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',4,'assume-likeness',NULL,NULL),
  ('psion-uncarnate',5,'incorporeal-touch','{"dice":"2d6","uses":3,"period":"day"}', 'Incorporeal touch 2d6, 3/day.'),
  ('psion-uncarnate',5,'powers-known','{"rank":3}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',6,'shed-body','{"uses":2,"period":"day"}',NULL),
  ('psion-uncarnate',6,'powers-known','{"rank":4}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',7,'telekinetic-force',NULL,NULL),
  ('psion-uncarnate',8,'uncarnate-bridge',NULL,NULL),
  ('psion-uncarnate',8,'powers-known','{"rank":5}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',9,'incorporeal-touch','{"dice":"3d6","uses":3,"period":"day"}', 'Incorporeal touch 3d6, 3/day.'),
  ('psion-uncarnate',9,'powers-known','{"rank":6}', '+1 level of existing manifesting class.'),
  ('psion-uncarnate',10,'uncarnate',NULL,NULL),

  -- Pyrokineticist
  ('pyrokineticist',1,'fire-lash',NULL,NULL),
  ('pyrokineticist',2,'fire-adaptation','{"rank":1,"extension":{"key":"dnd35.xph.pyrokineticist.fire-adaptation","version":1,"parameters":{"saveBonus":4,"resistance":10}}}', 'Fire adaptation: +4 on saves against fire/heat, fire resistance 10.'),
  ('pyrokineticist',2,'hand-afire','{"dice":"2d6"}', 'Hand afire adds 2d6 fire damage.'),
  ('pyrokineticist',3,'bolt-of-fire',NULL,NULL),
  ('pyrokineticist',4,'weapon-afire','{"dice":"2d6"}', 'Weapon afire adds 2d6 fire damage.'),
  ('pyrokineticist',5,'nimbus','{"uses":1,"period":"day"}',NULL),
  ('pyrokineticist',6,'firewalk',NULL,NULL),
  ('pyrokineticist',7,'fear-no-fire','{"rank":2,"extension":{"key":"dnd35.xph.pyrokineticist.fire-adaptation","version":1,"parameters":{"saveBonus":8,"resistance":20}}}', 'Fear no fire: +8 on saves against fire/heat, fire resistance 20.'),
  ('pyrokineticist',8,'greater-weapon-afire','{"dice":"4d6"}', 'Hand afire, weapon afire, and nimbus touch damage increase to 4d6.'),
  ('pyrokineticist',9,'heat-death',NULL,NULL),
  ('pyrokineticist',10,'conflagration','{"uses":1,"period":"day","dice":"15d6"}', 'Conflagration 1/day; 15d6 fire damage in the class-defined burst.'),

  -- Thrallherd
  ('thrallherd',1,'thrallherd',NULL,NULL),
  ('thrallherd',2,'powers-known','{"rank":1}', '+1 level of existing manifesting class.'),
  ('thrallherd',3,'psionic-charm','{"uses":1,"period":"day"}',NULL),
  ('thrallherd',3,'powers-known','{"rank":2}', '+1 level of existing manifesting class.'),
  ('thrallherd',4,'powers-known','{"rank":3}', '+1 level of existing manifesting class.'),
  ('thrallherd',5,'psionic-dominate','{"uses":1,"period":"day"}',NULL),
  ('thrallherd',5,'powers-known','{"rank":4}', '+1 level of existing manifesting class.'),
  ('thrallherd',6,'powers-known','{"rank":5}', '+1 level of existing manifesting class.'),
  ('thrallherd',7,'greater-dominate',NULL,NULL),
  ('thrallherd',7,'powers-known','{"rank":6}', '+1 level of existing manifesting class.'),
  ('thrallherd',8,'powers-known','{"rank":7}', '+1 level of existing manifesting class.'),
  ('thrallherd',9,'superior-dominate',NULL,NULL),
  ('thrallherd',9,'powers-known','{"rank":8}', '+1 level of existing manifesting class.'),
  ('thrallherd',10,'twofold-master',NULL,NULL),

  -- War mind
  ('war-mind',1,'powers',NULL,NULL),
  ('war-mind',1,'chain-personal-superiority','{"rank":2}', 'Chain of personal superiority +2.'),
  ('war-mind',2,'chain-defensive-posture','{"rank":2}', 'Chain of defensive posture +2.'),
  ('war-mind',3,'enduring-body','{"rank":1}', 'Damage reduction 1/—.'),
  ('war-mind',5,'sweeping-strike',NULL,NULL),
  ('war-mind',6,'enduring-body','{"rank":2}', 'Damage reduction 2/—.'),
  ('war-mind',7,'chain-personal-superiority','{"rank":4}', 'Chain of personal superiority +4.'),
  ('war-mind',8,'chain-defensive-posture','{"rank":4}', 'Chain of defensive posture +4.'),
  ('war-mind',9,'enduring-body','{"rank":3}', 'Damage reduction 3/—.'),
  ('war-mind',10,'chain-overwhelming-force',NULL,NULL)
)
INSERT INTO dnd35_class_feature_grants
  (class_level_id, class_feature_id, parameters, rules_text)
SELECT
  cl.id,
  cf.id,
  d.parameters,
  d.rules_text
FROM desired d
JOIN dnd35_classes c
  ON c.id = 'xph-class-' || d.class_slug
JOIN dnd35_class_levels cl
  ON cl.class_id = c.id AND cl.level = d.level
JOIN dnd35_class_features cf
  ON cf.id = 'xph-class-feature-' || d.class_slug || '-' || d.feature_slug
ON CONFLICT(class_level_id, class_feature_id) DO UPDATE
SET parameters = excluded.parameters,
    rules_text = excluded.rules_text;
