-- Source-backed automatic and bonus languages for Monster Manual III player races.
-- Dracotaur and witchknife explicitly allow broad bonus-language choice, so those
-- rows are expanded from the enabled non-secret language catalog at seed time.

WITH desired(slug,name,source_page,typical_speakers) AS (VALUES
  ('armandish','Armandish','10-11','Armands'),
  ('ibixian','Ibixian','63-64','Goatfolk (ibixians)'),
  ('kenku','Kenku','86-87','Kenkus'),
  ('lumi','Lumi','98-99','Lumi'),
  ('nycter','Nycter','112-113','Nycters')
)
INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,script,typical_speakers,is_secret)
SELECT
  'mm3-language-'||d.slug,'mm3-3.5',d.source_page,d.slug,d.name,
  'Language used by '||d.typical_speakers||'.','Monster Manual III racial language.',
  0,NULL,1,NULL,d.typical_speakers,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l WHERE l.slug=d.slug AND l.owner_user_id IS NULL
);

WITH desired(race_slug,language_slug,kind) AS (VALUES
  ('armand','common','automatic'),('armand','armandish','automatic'),
  ('armand','elven','bonus'),('armand','giant','bonus'),('armand','gnome','bonus'),('armand','goblin','bonus'),('armand','sylvan','bonus'),

  ('changeling','common','automatic'),
  ('changeling','auran','bonus'),('changeling','dwarven','bonus'),('changeling','elven','bonus'),('changeling','giant','bonus'),('changeling','gnome','bonus'),('changeling','halfling','bonus'),('changeling','terran','bonus'),

  ('dracotaur','draconic','automatic'),

  ('sand-giant','common','automatic'),('sand-giant','giant','automatic'),
  ('sand-giant','draconic','bonus'),('sand-giant','elven','bonus'),('sand-giant','goblin','bonus'),('sand-giant','orc','bonus'),

  ('flind','common','automatic'),('flind','gnoll','automatic'),
  ('flind','draconic','bonus'),('flind','elven','bonus'),('flind','goblin','bonus'),('flind','orc','bonus'),

  ('goatfolk','common','automatic'),('goatfolk','ibixian','automatic'),
  ('goatfolk','elven','bonus'),('goatfolk','giant','bonus'),('goatfolk','gnome','bonus'),('goatfolk','goblin','bonus'),('goatfolk','sylvan','bonus'),

  ('forestkith-goblin','goblin','automatic'),
  ('forestkith-goblin','common','bonus'),('forestkith-goblin','elven','bonus'),('forestkith-goblin','giant','bonus'),('forestkith-goblin','orc','bonus'),

  ('harssaf','common','automatic'),('harssaf','ignan','automatic'),
  ('harssaf','draconic','bonus'),('harssaf','dwarven','bonus'),('harssaf','elven','bonus'),('harssaf','giant','bonus'),('harssaf','halfling','bonus'),('harssaf','orc','bonus'),('harssaf','terran','bonus'),

  ('kenku','common','automatic'),('kenku','kenku','automatic'),
  ('kenku','auran','bonus'),('kenku','dwarven','bonus'),('kenku','gnome','bonus'),('kenku','goblin','bonus'),('kenku','halfling','bonus'),

  ('blackscale-lizardfolk','draconic','automatic'),('blackscale-lizardfolk','common','bonus'),

  ('poison-dusk-lizardfolk','draconic','automatic'),('poison-dusk-lizardfolk','common','automatic'),
  ('poison-dusk-lizardfolk','halfling','bonus'),('poison-dusk-lizardfolk','sylvan','bonus'),

  ('lumi','common','automatic'),('lumi','lumi','automatic'),
  ('lumi','abyssal','bonus'),('lumi','celestial','bonus'),('lumi','dwarven','bonus'),('lumi','infernal','bonus'),

  ('nycter','nycter','automatic'),
  ('nycter','common','bonus'),('nycter','draconic','bonus'),('nycter','dwarven','bonus'),('nycter','giant','bonus'),('nycter','goblin','bonus'),('nycter','orc','bonus'),

  ('skullcrusher-ogre','common','automatic'),('skullcrusher-ogre','giant','automatic'),
  ('skullcrusher-ogre','dwarven','bonus'),('skullcrusher-ogre','orc','bonus'),('skullcrusher-ogre','goblin','bonus'),('skullcrusher-ogre','terran','bonus'),

  ('quaraphon','giant','automatic'),

  ('naztharune-rakshasa','common','automatic'),('naztharune-rakshasa','infernal','automatic'),
  ('naztharune-rakshasa','sylvan','bonus'),('naztharune-rakshasa','undercommon','bonus'),

  ('shifter','common','automatic'),
  ('shifter','elven','bonus'),('shifter','gnome','bonus'),('shifter','halfling','bonus'),('shifter','sylvan','bonus'),

  ('crystalline-troll','giant','automatic'),
  ('crystalline-troll','common','bonus'),('crystalline-troll','orc','bonus'),

  ('warforged-charger','common','automatic'),
  ('warforged-scout','common','automatic'),

  ('witchknife','common','automatic'),('witchknife','undercommon','automatic')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,d.kind
FROM desired d
JOIN dnd35_races r ON r.id='mm3-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL AND l.is_enabled=1
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

-- Dracotaur: Bonus Languages: Any.
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM dnd35_races r
JOIN dnd35_languages l ON l.owner_user_id IS NULL AND l.is_enabled=1 AND l.is_secret=0
WHERE r.id='mm3-race-dracotaur' AND l.slug<>'draconic'
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

-- Witchknife: any non-secret language can be selected as a bonus language.
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM dnd35_races r
JOIN dnd35_languages l ON l.owner_user_id IS NULL AND l.is_enabled=1 AND l.is_secret=0
WHERE r.id='mm3-race-witchknife' AND l.slug NOT IN ('common','undercommon')
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
