-- Jaebrin racial language access and explicit always-class-skill grant.

WITH desired(language_slug,kind) AS (VALUES
  ('common','automatic'),('sylvan','automatic'),
  ('draconic','bonus'),('elven','bonus'),('goblin','bonus'),('gnome','bonus'),('halfling','bonus')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT 'mm5-race-jaebrin',l.id,d.kind
FROM desired d
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL AND l.is_enabled=1
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm5-race-jaebrin')
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT 'mm5-race-jaebrin',s.id
FROM dnd35_skills s
WHERE s.slug='spellcraft' AND s.owner_user_id IS NULL AND s.is_enabled=1
  AND EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm5-race-jaebrin');
