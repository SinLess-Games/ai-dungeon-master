-- Heroes of Battle class feature grants by level.
WITH desired(class_slug,level,feature_slug,parameters,rules_text) AS (VALUES
  ('combat-medic',1,'healing-kicker','{"rank":1,"usesFormula":"class_level + wis_modifier (minimum 1)","extension":{"key":"dnd35.hob.combat-medic.healing-kicker","version":1,"parameters":{"effect":"sanctuary","saveDcFormula":"15 + class_level + wis_modifier","durationRounds":1}}}','Healing Kicker: sanctuary effect.'),
  ('combat-medic',2,'defensive-casting',NULL,NULL),
  ('combat-medic',2,'field-healer',NULL,NULL),
  ('combat-medic',3,'healing-kicker','{"rank":2,"extension":{"key":"dnd35.hob.combat-medic.healing-kicker","version":1,"parameters":{"effect":"reflex-save-bonus","bonusFormula":"class_level","durationRounds":1}}}','Healing Kicker can grant a Reflex-save bonus equal to class level for 1 round.'),
  ('combat-medic',3,'mobility','{"extension":{"key":"dnd35.grant.feat","version":1,"parameters":{"featId":"phb-feat-mobility"}}}',NULL),
  ('combat-medic',4,'evasion',NULL,NULL),
  ('combat-medic',5,'healing-kicker','{"rank":3,"extension":{"key":"dnd35.hob.combat-medic.healing-kicker","version":1,"parameters":{"effect":"aid","temporaryHitPointsFormula":"8 + class_level","duration":"1 minute or until depleted"}}}','Healing Kicker can add a maximized aid-style temporary-hit-point effect.'),
  ('combat-medic',5,'spontaneous-heal',NULL,NULL),

  ('dread-commando',1,'sudden-strike','{"dice":"1d6"}',NULL),
  ('dread-commando',1,'team-initiative-bonus','{"extension":{"key":"dnd35.hob.dread-commando.team-initiative","version":1,"parameters":{"radiusFeet":30,"bonusFormula":"class_level","bonusType":"competence"}}}',NULL),
  ('dread-commando',2,'armored-ease','{"rank":2}', 'Reduce armor check penalty by 2, minimum 0.'),
  ('dread-commando',3,'sudden-strike','{"dice":"2d6"}',NULL),
  ('dread-commando',4,'armored-ease','{"rank":4}', 'Reduce armor check penalty by 4, minimum 0.'),
  ('dread-commando',4,'stealthy-movement',NULL,NULL),
  ('dread-commando',5,'sudden-strike','{"dice":"3d6"}',NULL),

  ('legendary-leader',1,'fearless',NULL,NULL),
  ('legendary-leader',1,'heros-luck','{"rank":1}', '+1 luck bonus on saving throws.'),
  ('legendary-leader',1,'natural-commander','{"extension":{"key":"dnd35.hob.legendary-leader.natural-commander","version":1,"parameters":{"ratingFormula":"max(class_level, normal_commander_rating)"}}}',NULL),
  ('legendary-leader',1,'legendary-reputation','{"extension":{"key":"dnd35.hob.legendary-leader.legendary-reputation","version":1,"parameters":{"diplomacyBonusFormula":"class_level","eligibleAttitudes":["friendly","helpful","indifferent"]}}}',NULL),
  ('legendary-leader',2,'greater-command','{"uses":1,"period":"day","extension":{"key":"dnd35.spell-like-ability","version":1,"parameters":{"spell":"greater command","saveDcFormula":"16 + cha_modifier"}}}',NULL),
  ('legendary-leader',2,'quick-rally',NULL,NULL),
  ('legendary-leader',3,'bonus-feat','{"rank":1,"extension":{"key":"dnd35.hob.legendary-leader.leader-feat","version":1,"parameters":{"category":"leader","mustMeetPrerequisites":true}}}',NULL),
  ('legendary-leader',3,'heros-luck','{"rank":2}', '+2 luck bonus on saving throws.'),
  ('legendary-leader',4,'greater-command','{"uses":2,"period":"day"}',NULL),
  ('legendary-leader',4,'heroic-success','{"uses":1,"period":"day"}',NULL),
  ('legendary-leader',5,'additional-commander-aura',NULL,NULL),
  ('legendary-leader',5,'heros-luck','{"rank":3}', '+3 luck bonus on saving throws.'),
  ('legendary-leader',5,'to-hell-and-back',NULL,NULL),

  ('war-weaver',1,'eldritch-tapestry','{"extension":{"key":"dnd35.hob.war-weaver.eldritch-tapestry","version":1,"parameters":{"eligibleSpells":"harmless, non-personal beneficial spells","targetLimitFormula":"casting_ability_modifier"}}}',NULL),
  ('war-weaver',2,'quiescent-weaving','{"rank":1,"extension":{"key":"dnd35.hob.war-weaver.quiescent-weaving","version":1,"parameters":{"storedSpells":1,"maxSpellLevel":2,"releaseAction":"move"}}}',NULL),
  ('war-weaver',3,'quiescent-weaving','{"rank":2,"extension":{"key":"dnd35.hob.war-weaver.quiescent-weaving","version":1,"parameters":{"storedSpells":2,"maxSpellLevel":3,"releaseAction":"move"}}}',NULL),
  ('war-weaver',4,'quiescent-weaving','{"rank":3,"extension":{"key":"dnd35.hob.war-weaver.quiescent-weaving","version":1,"parameters":{"storedSpells":3,"maxSpellLevel":4,"releaseAction":"move"}}}',NULL),
  ('war-weaver',5,'quiescent-weaving','{"rank":4,"extension":{"key":"dnd35.hob.war-weaver.quiescent-weaving","version":1,"parameters":{"storedSpells":4,"maxSpellLevel":5,"releaseAction":"move"}}}',NULL),
  ('war-weaver',5,'enlarged-tapestry',NULL,NULL)
)
INSERT INTO dnd35_class_feature_grants (class_level_id,class_feature_id,parameters,rules_text)
SELECT cl.id,cf.id,d.parameters,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.level
JOIN dnd35_class_features cf ON cf.source_id=s.id AND cf.slug=d.class_slug||'-'||d.feature_slug
WHERE s.slug='heroes-of-battle-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_level_id,class_feature_id) DO UPDATE SET
  parameters=excluded.parameters,rules_text=excluded.rules_text;
