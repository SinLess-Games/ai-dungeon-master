-- Source-backed languages and data-driven racial class skills for Grimlock,
-- Tallfellow Halfling, Deep Halfling, and Rakshasa.

INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,script,typical_speakers,is_secret)
SELECT 'mm1-language-grimlock','mm1-3.5','140-141','grimlock','Grimlock',
       'Language of grimlock communities.','Monster Manual language used by grimlocks.',
       0,NULL,1,NULL,'Grimlocks',0
WHERE NOT EXISTS (SELECT 1 FROM dnd35_languages l WHERE l.slug='grimlock' AND l.owner_user_id IS NULL);

WITH automatic(race_slug,language_slug) AS (VALUES
  ('grimlock','common'),('grimlock','grimlock'),
  ('tallfellow-halfling','common'),('tallfellow-halfling','halfling'),('tallfellow-halfling','elven'),
  ('deep-halfling','common'),('deep-halfling','halfling'),('deep-halfling','dwarven'),
  ('rakshasa','common'),('rakshasa','infernal')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('grimlock','draconic'),('grimlock','dwarven'),('grimlock','gnome'),('grimlock','terran'),('grimlock','undercommon'),
  ('tallfellow-halfling','dwarven'),('tallfellow-halfling','gnome'),('tallfellow-halfling','goblin'),('tallfellow-halfling','orc'),
  ('deep-halfling','elven'),('deep-halfling','gnome'),('deep-halfling','goblin'),('deep-halfling','orc'),
  ('rakshasa','sylvan'),('rakshasa','undercommon')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH desired(race_slug,skill_slug) AS (VALUES
  ('grimlock','climb'),('grimlock','hide'),('grimlock','listen'),('grimlock','spot'),
  ('rakshasa','bluff'),('rakshasa','disguise'),('rakshasa','listen'),('rakshasa','move-silently'),
  ('rakshasa','perform'),('rakshasa','sense-motive'),('rakshasa','spot')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL AND s.is_enabled=1;
