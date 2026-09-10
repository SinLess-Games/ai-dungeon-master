-- Source-backed automatic languages for Couatl, Lillend, Triton, and Xill.

WITH automatic(race_slug,language_slug) AS (VALUES
  ('couatl','celestial'),('couatl','common'),('couatl','draconic'),
  ('lillend','celestial'),('lillend','infernal'),('lillend','abyssal'),('lillend','common'),
  ('triton','common'),('triton','aquan'),
  ('xill','infernal')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
