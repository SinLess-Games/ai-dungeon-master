-- Monster Manual v3.5 automatic and bonus languages for retained-RHD races.

WITH automatic(race_slug,language_slug) AS (VALUES
  ('centaur','sylvan'),('centaur','elven'),
  ('gargoyle','common'),
  ('janni','common')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('centaur','common'),('centaur','gnome'),('centaur','halfling'),
  ('gargoyle','auran'),('gargoyle','dwarven'),('gargoyle','elven'),('gargoyle','gnome'),
  ('gargoyle','halfling'),('gargoyle','giant'),('gargoyle','terran'),
  ('janni','abyssal'),('janni','aquan'),('janni','auran'),('janni','celestial'),
  ('janni','ignan'),('janni','infernal'),('janni','terran')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
