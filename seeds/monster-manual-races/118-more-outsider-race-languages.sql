-- Source-backed automatic languages for Astral Deva, Bralani, Djinni, and Erinyes.

WITH automatic(race_slug,language_slug) AS (VALUES
  ('astral-deva','celestial'),('astral-deva','infernal'),('astral-deva','draconic'),
  ('bralani','celestial'),('bralani','infernal'),('bralani','draconic'),
  ('djinni','auran'),('djinni','celestial'),('djinni','common'),('djinni','ignan'),
  ('erinyes','infernal'),('erinyes','celestial'),('erinyes','draconic')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
