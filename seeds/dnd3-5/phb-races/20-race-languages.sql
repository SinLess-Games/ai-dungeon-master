-- Player's Handbook v3.5 racial automatic and bonus language access.
WITH automatic(race_slug,language_slug) AS (VALUES
  ('human','common'),
  ('dwarf','common'),('dwarf','dwarven'),
  ('elf','common'),('elf','elven'),
  ('gnome','common'),('gnome','gnome'),
  ('half-elf','common'),('half-elf','elven'),
  ('half-orc','common'),('half-orc','orc'),
  ('halfling','common'),('halfling','halfling')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.source_id='phb-3.5' AND r.owner_user_id IS NULL
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('dwarf','giant'),('dwarf','gnome'),('dwarf','goblin'),('dwarf','orc'),('dwarf','terran'),('dwarf','undercommon'),
  ('elf','draconic'),('elf','gnoll'),('elf','gnome'),('elf','goblin'),('elf','orc'),('elf','sylvan'),
  ('gnome','draconic'),('gnome','dwarven'),('gnome','elven'),('gnome','giant'),('gnome','goblin'),('gnome','orc'),
  ('half-orc','abyssal'),('half-orc','draconic'),('half-orc','giant'),('half-orc','gnoll'),('half-orc','goblin'),
  ('halfling','dwarven'),('halfling','elven'),('halfling','gnome'),('halfling','goblin'),('halfling','orc')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.source_id='phb-3.5' AND r.owner_user_id IS NULL
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

-- Humans and half-elves may choose any non-secret language available in the core language catalog.
WITH broad(race_slug) AS (VALUES ('human'),('half-elf'))
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM broad b
JOIN dnd35_races r ON r.slug=b.race_slug AND r.source_id='phb-3.5' AND r.owner_user_id IS NULL
CROSS JOIN dnd35_languages l
WHERE l.source_id='phb-3.5'
  AND l.owner_user_id IS NULL
  AND l.is_enabled=1
  AND l.is_secret=0
  AND NOT EXISTS (
    SELECT 1 FROM dnd35_race_languages x
    WHERE x.race_id=r.id AND x.language_id=l.id AND x.kind='automatic'
  )
ON CONFLICT(race_id,language_id) DO NOTHING;
