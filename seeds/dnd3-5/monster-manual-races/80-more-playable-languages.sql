-- Monster Manual v3.5 languages for Tiefling, base Pixie, and Yuan-ti Pureblood.

INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   script,typical_speakers,is_secret)
SELECT
  'mm1-language-yuan-ti','mm1-3.5','263-264','yuan-ti','Yuan-ti','','',0,NULL,1,
  NULL,'Yuan-ti',0
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l WHERE l.slug='yuan-ti' AND l.owner_user_id IS NULL
);

WITH automatic(race_slug,language_slug) AS (VALUES
  ('tiefling','common'),('tiefling','infernal'),
  ('pixie','common'),('pixie','sylvan'),
  ('yuan-ti-pureblood','yuan-ti'),('yuan-ti-pureblood','common')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('tiefling','draconic'),('tiefling','dwarven'),('tiefling','elven'),('tiefling','gnome'),
  ('tiefling','goblin'),('tiefling','halfling'),('tiefling','orc'),
  ('pixie','elven'),('pixie','gnome'),('pixie','halfling'),
  ('yuan-ti-pureblood','abyssal'),('yuan-ti-pureblood','draconic')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
