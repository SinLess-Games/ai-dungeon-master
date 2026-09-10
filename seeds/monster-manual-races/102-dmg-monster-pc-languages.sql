-- Languages for the remaining DMG-listed Monster Manual player races.
-- Add source languages not present in the PHB language catalog.

WITH desired(slug,name,script) AS (VALUES
  ('kuo-toan','Kuo-Toan','Undercommon'),
  ('yuan-ti','Yuan-ti','Draconic')
)
INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   script,typical_speakers,is_secret)
SELECT
  'mm1-language-'||d.slug,'mm1-3.5',NULL,d.slug,d.name,'','',0,NULL,1,
  d.script,NULL,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l WHERE l.slug=d.slug AND l.owner_user_id IS NULL
);

WITH desired(race_slug,language_slug,kind) AS (VALUES
  ('bugbear','common','automatic'),('bugbear','goblin','automatic'),
  ('bugbear','draconic','bonus'),('bugbear','elven','bonus'),('bugbear','giant','bonus'),('bugbear','gnoll','bonus'),('bugbear','orc','bonus'),

  ('gnoll','gnoll','automatic'),
  ('gnoll','common','bonus'),('gnoll','draconic','bonus'),('gnoll','elven','bonus'),('gnoll','goblin','bonus'),('gnoll','orc','bonus'),

  ('lizardfolk','common','automatic'),('lizardfolk','draconic','automatic'),
  ('lizardfolk','aquan','bonus'),('lizardfolk','goblin','bonus'),('lizardfolk','gnoll','bonus'),('lizardfolk','orc','bonus'),

  ('troglodyte','draconic','automatic'),
  ('troglodyte','common','bonus'),('troglodyte','giant','bonus'),('troglodyte','goblin','bonus'),('troglodyte','orc','bonus'),

  ('kuo-toa','kuo-toan','automatic'),('kuo-toa','undercommon','automatic'),('kuo-toa','aquan','automatic'),

  ('drider','elven','automatic'),('drider','common','automatic'),('drider','undercommon','automatic'),

  ('yuan-ti-halfblood','yuan-ti','automatic'),('yuan-ti-halfblood','common','automatic'),
  ('yuan-ti-halfblood','abyssal','bonus'),('yuan-ti-halfblood','draconic','bonus'),

  ('mind-flayer','common','automatic'),('mind-flayer','undercommon','automatic'),
  ('mind-flayer','abyssal','bonus'),('mind-flayer','aquan','bonus'),('mind-flayer','draconic','bonus'),('mind-flayer','dwarven','bonus'),('mind-flayer','elven','bonus'),('mind-flayer','gnome','bonus'),('mind-flayer','infernal','bonus'),('mind-flayer','terran','bonus'),

  ('yuan-ti-abomination','yuan-ti','automatic'),('yuan-ti-abomination','common','automatic'),
  ('yuan-ti-abomination','abyssal','bonus'),('yuan-ti-abomination','draconic','bonus')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,d.kind
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
