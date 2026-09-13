-- XPH language mappings for the three sourcebook-only race cases.

INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,script,typical_speakers,is_secret)
SELECT 'xph-language-gith','xph-3.5','10-11','gith','Gith',
       'Shared language of the githyanki and githzerai.',
       'Automatic racial language for githyanki and githzerai.',
       0,NULL,1,NULL,'Githyanki and githzerai',0
WHERE NOT EXISTS (SELECT 1 FROM dnd35_languages WHERE slug='gith' AND owner_user_id IS NULL);

INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,script,typical_speakers,is_secret)
SELECT 'xph-language-thri-kreen','xph-3.5','14-15','thri-kreen','Thri-Kreen',
       'Clicking, whistling, and mandible-snap language of thri-kreen communities.',
       'Automatic racial language for thri-kreen.',
       0,NULL,1,NULL,'Thri-kreen',0
WHERE NOT EXISTS (SELECT 1 FROM dnd35_languages WHERE slug='thri-kreen' AND owner_user_id IS NULL);

WITH automatic(race_slug,language_slug) AS (VALUES
  ('githyanki','common'),('githyanki','gith'),
  ('githzerai','common'),('githzerai','gith'),
  ('thri-kreen','common'),('thri-kreen','thri-kreen')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('githyanki','abyssal'),('githyanki','celestial'),('githyanki','draconic'),('githyanki','infernal'),('githyanki','undercommon'),
  ('githzerai','abyssal'),('githzerai','celestial'),('githzerai','draconic'),('githzerai','slaad'),('githzerai','undercommon'),
  ('thri-kreen','elven'),('thri-kreen','giant'),('thri-kreen','gnoll'),('thri-kreen','goblin'),('thri-kreen','halfling')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
