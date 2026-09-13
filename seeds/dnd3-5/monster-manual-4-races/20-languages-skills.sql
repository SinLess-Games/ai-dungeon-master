-- MM4 racial languages and data-driven class skills.

INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,script,typical_speakers,is_secret)
SELECT
  'mm4-language-windsong','mm4-3.5','176-179','windsong','Windsong',
  'The racial language of the windblades.','Monster Manual IV windblade language.',
  0,NULL,1,NULL,'Windrazors and windscythes',0
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l WHERE l.slug='windsong' AND l.owner_user_id IS NULL
);

WITH desired(race_slug,language_slug,kind) AS (VALUES
  ('varag','goblin','automatic'),
  ('varag','common','bonus'),('varag','draconic','bonus'),('varag','dwarven','bonus'),
  ('varag','infernal','bonus'),('varag','giant','bonus'),('varag','orc','bonus'),

  ('windrazor','auran','automatic'),('windrazor','windsong','automatic'),
  ('windrazor','abyssal','bonus'),('windrazor','common','bonus'),('windrazor','undercommon','bonus'),

  ('windscythe','windsong','automatic'),('windscythe','auran','automatic'),
  ('windscythe','abyssal','bonus'),('windscythe','common','bonus'),('windscythe','undercommon','bonus')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT 'mm4-race-'||d.race_slug,l.id,d.kind
FROM desired d
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL AND l.is_enabled=1
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm4-race-'||d.race_slug)
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH desired(race_slug,skill_slug) AS (VALUES
  ('varag','jump'),('varag','move-silently'),('varag','survival'),

  ('windrazor','climb'),('windrazor','knowledge-planes'),('windrazor','listen'),
  ('windrazor','move-silently'),('windrazor','spot'),('windrazor','survival'),('windrazor','tumble'),

  ('windscythe','climb'),('windscythe','intimidate'),('windscythe','knowledge-planes'),
  ('windscythe','listen'),('windscythe','move-silently'),('windscythe','spot'),
  ('windscythe','survival'),('windscythe','tumble')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT 'mm4-race-'||d.race_slug,s.id
FROM desired d
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL AND s.is_enabled=1
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm4-race-'||d.race_slug);
