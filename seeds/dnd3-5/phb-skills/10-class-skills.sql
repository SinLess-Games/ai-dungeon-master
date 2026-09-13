-- Player's Handbook v3.5 base-class skill lists.
WITH desired(class_slug,skill_slug) AS (VALUES
  -- Barbarian
  ('barbarian','climb'),('barbarian','craft'),('barbarian','handle-animal'),('barbarian','intimidate'),
  ('barbarian','jump'),('barbarian','listen'),('barbarian','ride'),('barbarian','survival'),('barbarian','swim'),

  -- Bard
  ('bard','appraise'),('bard','balance'),('bard','bluff'),('bard','climb'),('bard','concentration'),
  ('bard','craft'),('bard','decipher-script'),('bard','diplomacy'),('bard','disguise'),('bard','escape-artist'),
  ('bard','gather-information'),('bard','hide'),('bard','jump'),('bard','knowledge-arcana'),
  ('bard','knowledge-dungeoneering'),('bard','knowledge-engineering'),('bard','knowledge-geography'),
  ('bard','knowledge-history'),('bard','knowledge-local'),('bard','knowledge-nature'),('bard','knowledge-nobility'),
  ('bard','knowledge-religion'),('bard','knowledge-planes'),('bard','listen'),('bard','move-silently'),
  ('bard','perform'),('bard','profession'),('bard','sense-motive'),('bard','sleight-of-hand'),
  ('bard','speak-language'),('bard','spellcraft'),('bard','swim'),('bard','tumble'),('bard','use-magic-device'),

  -- Cleric
  ('cleric','concentration'),('cleric','craft'),('cleric','diplomacy'),('cleric','heal'),
  ('cleric','knowledge-arcana'),('cleric','knowledge-history'),('cleric','knowledge-religion'),
  ('cleric','knowledge-planes'),('cleric','profession'),('cleric','spellcraft'),

  -- Druid
  ('druid','concentration'),('druid','craft'),('druid','diplomacy'),('druid','handle-animal'),('druid','heal'),
  ('druid','knowledge-nature'),('druid','listen'),('druid','profession'),('druid','ride'),('druid','spellcraft'),
  ('druid','spot'),('druid','survival'),('druid','swim'),

  -- Fighter
  ('fighter','climb'),('fighter','craft'),('fighter','handle-animal'),('fighter','intimidate'),
  ('fighter','jump'),('fighter','ride'),('fighter','swim'),

  -- Monk
  ('monk','balance'),('monk','climb'),('monk','concentration'),('monk','craft'),('monk','diplomacy'),
  ('monk','escape-artist'),('monk','hide'),('monk','jump'),('monk','knowledge-arcana'),
  ('monk','knowledge-religion'),('monk','listen'),('monk','move-silently'),('monk','perform'),
  ('monk','profession'),('monk','sense-motive'),('monk','spot'),('monk','swim'),('monk','tumble'),

  -- Paladin
  ('paladin','concentration'),('paladin','craft'),('paladin','diplomacy'),('paladin','handle-animal'),
  ('paladin','heal'),('paladin','knowledge-nobility'),('paladin','knowledge-religion'),('paladin','profession'),
  ('paladin','ride'),('paladin','sense-motive'),

  -- Ranger
  ('ranger','climb'),('ranger','concentration'),('ranger','craft'),('ranger','handle-animal'),('ranger','heal'),
  ('ranger','hide'),('ranger','jump'),('ranger','knowledge-dungeoneering'),('ranger','knowledge-geography'),
  ('ranger','knowledge-nature'),('ranger','listen'),('ranger','move-silently'),('ranger','profession'),
  ('ranger','ride'),('ranger','search'),('ranger','spot'),('ranger','survival'),('ranger','swim'),('ranger','use-rope'),

  -- Rogue
  ('rogue','appraise'),('rogue','balance'),('rogue','bluff'),('rogue','climb'),('rogue','craft'),
  ('rogue','decipher-script'),('rogue','diplomacy'),('rogue','disable-device'),('rogue','disguise'),
  ('rogue','escape-artist'),('rogue','forgery'),('rogue','gather-information'),('rogue','hide'),
  ('rogue','intimidate'),('rogue','jump'),('rogue','knowledge-local'),('rogue','listen'),
  ('rogue','move-silently'),('rogue','open-lock'),('rogue','perform'),('rogue','profession'),('rogue','search'),
  ('rogue','sense-motive'),('rogue','sleight-of-hand'),('rogue','spot'),('rogue','swim'),('rogue','tumble'),
  ('rogue','use-magic-device'),('rogue','use-rope'),

  -- Sorcerer
  ('sorcerer','bluff'),('sorcerer','concentration'),('sorcerer','craft'),('sorcerer','knowledge-arcana'),
  ('sorcerer','profession'),('sorcerer','spellcraft'),

  -- Wizard
  ('wizard','concentration'),('wizard','craft'),('wizard','decipher-script'),('wizard','knowledge-arcana'),
  ('wizard','knowledge-dungeoneering'),('wizard','knowledge-engineering'),('wizard','knowledge-geography'),
  ('wizard','knowledge-history'),('wizard','knowledge-local'),('wizard','knowledge-nature'),
  ('wizard','knowledge-nobility'),('wizard','knowledge-religion'),('wizard','knowledge-planes'),
  ('wizard','profession'),('wizard','spellcraft')
)
INSERT INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_sources cs ON cs.id=c.source_id AND cs.slug='players-handbook-3-5'
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL
WHERE s.source_id='phb-3.5'
ON CONFLICT(class_id,skill_id) DO NOTHING;
