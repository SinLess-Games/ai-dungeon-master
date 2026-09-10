-- Monster Manual v3.5 race languages. Existing shared PHB language rows are
-- reused; only Monster Manual-specific language identities are created here.

WITH desired(slug,name,typical_speakers,is_secret) AS (VALUES
  ('githyanki','Githyanki','Githyanki',1),
  ('githzerai','Githzerai','Githzerai',0),
  ('slaad','Slaad','Slaadi',0),
  ('drow-sign-language','Drow Sign Language','Drow',0),
  ('kuo-toan','Kuo-toan','Kuo-toa',0)
)
INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   script,typical_speakers,is_secret)
SELECT
  'mm1-language-'||d.slug,'mm1-3.5',NULL,d.slug,d.name,
  'Language used by '||d.typical_speakers||' in the Monster Manual.',
  'Source-backed language identity used by playable Monster Manual races.',
  0,NULL,1,NULL,d.typical_speakers,d.is_secret
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l
  WHERE l.slug=d.slug AND l.owner_user_id IS NULL
);

WITH automatic(race_slug,language_slug) AS (VALUES
  ('deep-dwarf','common'),('deep-dwarf','dwarven'),
  ('duergar','common'),('duergar','dwarven'),('duergar','undercommon'),
  ('mountain-dwarf','common'),('mountain-dwarf','dwarven'),
  ('aquatic-elf','common'),('aquatic-elf','elven'),
  ('drow','common'),('drow','elven'),('drow','undercommon'),
  ('gray-elf','common'),('gray-elf','elven'),
  ('wild-elf','common'),('wild-elf','elven'),
  ('wood-elf','common'),('wood-elf','elven'),
  ('forest-gnome','gnome'),('forest-gnome','elven'),('forest-gnome','sylvan'),
  ('goblin','common'),('goblin','goblin'),
  ('hobgoblin','common'),('hobgoblin','goblin'),
  ('kobold','draconic'),
  ('orc','common'),('orc','orc'),
  ('githyanki','githyanki'),
  ('githzerai','githzerai')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l
  ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('deep-dwarf','giant'),('deep-dwarf','gnome'),('deep-dwarf','goblin'),
  ('deep-dwarf','orc'),('deep-dwarf','terran'),('deep-dwarf','undercommon'),
  ('duergar','draconic'),('duergar','giant'),('duergar','goblin'),('duergar','orc'),('duergar','terran'),
  ('mountain-dwarf','giant'),('mountain-dwarf','gnome'),('mountain-dwarf','goblin'),
  ('mountain-dwarf','orc'),('mountain-dwarf','terran'),('mountain-dwarf','undercommon'),
  ('aquatic-elf','draconic'),('aquatic-elf','gnoll'),('aquatic-elf','gnome'),
  ('aquatic-elf','goblin'),('aquatic-elf','orc'),('aquatic-elf','sylvan'),
  ('drow','abyssal'),('drow','aquan'),('drow','draconic'),('drow','drow-sign-language'),
  ('drow','gnome'),('drow','goblin'),('drow','kuo-toan'),
  ('gray-elf','draconic'),('gray-elf','gnoll'),('gray-elf','gnome'),
  ('gray-elf','goblin'),('gray-elf','orc'),('gray-elf','sylvan'),
  ('wild-elf','draconic'),('wild-elf','gnoll'),('wild-elf','gnome'),
  ('wild-elf','goblin'),('wild-elf','orc'),('wild-elf','sylvan'),
  ('wood-elf','draconic'),('wood-elf','gnoll'),('wood-elf','gnome'),
  ('wood-elf','goblin'),('wood-elf','orc'),('wood-elf','sylvan'),
  ('forest-gnome','common'),('forest-gnome','draconic'),('forest-gnome','dwarven'),
  ('forest-gnome','giant'),('forest-gnome','goblin'),('forest-gnome','orc'),
  ('goblin','draconic'),('goblin','elven'),('goblin','giant'),('goblin','gnoll'),('goblin','orc'),
  ('hobgoblin','draconic'),('hobgoblin','dwarven'),('hobgoblin','infernal'),('hobgoblin','giant'),('hobgoblin','orc'),
  ('kobold','common'),('kobold','undercommon'),
  ('orc','dwarven'),('orc','giant'),('orc','gnoll'),('orc','goblin'),('orc','undercommon'),
  ('githyanki','common'),('githyanki','infernal'),('githyanki','draconic'),('githyanki','undercommon'),
  ('githzerai','common'),('githzerai','slaad'),('githzerai','undercommon')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_languages l
  ON l.slug=d.language_slug AND l.owner_user_id IS NULL
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
