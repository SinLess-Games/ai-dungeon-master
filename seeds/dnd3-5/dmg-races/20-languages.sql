-- Automatic and bonus language access inherited by the DMG example races.
WITH automatic(race_slug,language_slug) AS (VALUES
  ('gold-dwarf','common'),('gold-dwarf','dwarven'),
  ('half-human-elf','common'),('half-human-elf','elven')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='dmg-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('gold-dwarf','giant'),('gold-dwarf','gnome'),('gold-dwarf','goblin'),
  ('gold-dwarf','orc'),('gold-dwarf','terran'),('gold-dwarf','undercommon')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='dmg-race-'||d.race_slug
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

-- Half-human elves inherit the standard half-elf ability to select any non-secret core language.
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM dnd35_races r
CROSS JOIN dnd35_languages l
WHERE r.id='dmg-race-half-human-elf'
  AND l.source_id='phb-3.5'
  AND l.owner_user_id IS NULL
  AND l.is_enabled=1
  AND l.is_secret=0
  AND NOT EXISTS (
    SELECT 1 FROM dnd35_race_languages x
    WHERE x.race_id=r.id AND x.language_id=l.id AND x.kind='automatic'
  )
ON CONFLICT(race_id,language_id) DO NOTHING;
