-- Source-backed automatic languages for Aranea, Locathah, and Merfolk.
-- No Lamia language is added here because the MM entry used for this pass does not state one.

WITH automatic(race_slug,language_slug) AS (VALUES
  ('aranea','common'),('aranea','sylvan'),
  ('locathah','aquan'),
  ('merfolk','common'),('merfolk','aquan')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
