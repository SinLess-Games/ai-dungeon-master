-- Player's Handbook II base class skill lists.
-- Dragon Shaman receives additional skills from the chosen totem; those are resolved dynamically by the creator.
WITH desired(class_slug,skill_slug) AS (VALUES
  ('beguiler','appraise'),('beguiler','balance'),('beguiler','bluff'),('beguiler','climb'),
  ('beguiler','concentration'),('beguiler','decipher-script'),('beguiler','diplomacy'),('beguiler','disable-device'),
  ('beguiler','disguise'),('beguiler','escape-artist'),('beguiler','forgery'),('beguiler','gather-information'),
  ('beguiler','hide'),('beguiler','jump'),('beguiler','knowledge-arcana'),('beguiler','knowledge-local'),
  ('beguiler','listen'),('beguiler','move-silently'),('beguiler','open-lock'),('beguiler','profession'),
  ('beguiler','search'),('beguiler','sense-motive'),('beguiler','sleight-of-hand'),('beguiler','speak-language'),
  ('beguiler','spellcraft'),('beguiler','spot'),('beguiler','swim'),('beguiler','tumble'),('beguiler','use-magic-device'),

  ('dragon-shaman','climb'),('dragon-shaman','craft'),('dragon-shaman','intimidate'),
  ('dragon-shaman','knowledge-nature'),('dragon-shaman','search'),

  ('duskblade','climb'),('duskblade','concentration'),('duskblade','craft'),('duskblade','decipher-script'),
  ('duskblade','jump'),('duskblade','knowledge-arcana'),('duskblade','knowledge-dungeoneering'),
  ('duskblade','knowledge-engineering'),('duskblade','knowledge-geography'),('duskblade','knowledge-history'),
  ('duskblade','knowledge-local'),('duskblade','knowledge-nature'),('duskblade','knowledge-nobility'),
  ('duskblade','knowledge-religion'),('duskblade','knowledge-planes'),('duskblade','ride'),
  ('duskblade','sense-motive'),('duskblade','spellcraft'),('duskblade','swim'),

  ('knight','climb'),('knight','handle-animal'),('knight','intimidate'),('knight','jump'),
  ('knight','knowledge-nobility'),('knight','ride'),('knight','swim')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources source ON source.id=c.source_id
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL
WHERE source.slug='players-handbook-ii-3-5' AND c.owner_user_id IS NULL;
