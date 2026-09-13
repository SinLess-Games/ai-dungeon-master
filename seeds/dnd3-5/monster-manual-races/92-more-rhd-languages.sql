-- Monster Manual v3.5 automatic and bonus languages for the second retained-RHD batch.

WITH automatic(race_slug,language_slug) AS (VALUES
  ('azer','common'),('azer','ignan'),
  ('satyr','sylvan'),
  ('ogre','common'),('ogre','giant'),
  ('hill-giant','giant'),
  ('stone-giant','giant'),
  ('troll','giant')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('azer','abyssal'),('azer','aquan'),('azer','auran'),('azer','celestial'),('azer','infernal'),('azer','terran'),
  ('satyr','common'),('satyr','elven'),('satyr','gnome'),
  ('ogre','dwarven'),('ogre','orc'),('ogre','goblin'),('ogre','terran'),
  ('hill-giant','common'),('hill-giant','draconic'),('hill-giant','elven'),('hill-giant','goblin'),('hill-giant','orc'),
  ('stone-giant','common'),('stone-giant','draconic'),('stone-giant','elven'),('stone-giant','goblin'),('stone-giant','orc'),
  ('troll','common'),('troll','orc')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
