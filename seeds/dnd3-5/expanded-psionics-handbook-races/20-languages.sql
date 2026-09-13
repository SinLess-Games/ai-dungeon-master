-- Expanded Psionics Handbook race languages. Existing shared PHB languages are
-- reused by slug; only XPH-specific language identities are added here.

WITH desired(slug,name,typical_speakers) AS (VALUES
  ('maenad','Maenad','Maenads'),
  ('xeph','Xeph','Xephs')
)
INSERT INTO dnd35_languages
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   script,typical_speakers,is_secret)
SELECT
  'xph-language-'||d.slug,'xph-3.5',NULL,d.slug,d.name,
  'Language associated with the '||d.typical_speakers||' of the Expanded Psionics Handbook.',
  'Automatic racial language for the associated XPH race.',
  0,NULL,1,NULL,d.typical_speakers,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_languages l
  WHERE l.slug=d.slug AND l.owner_user_id IS NULL
);

WITH automatic(race_slug,language_slug) AS (VALUES
  ('dromite','common'),
  ('duergar-psionic','common'),('duergar-psionic','dwarven'),('duergar-psionic','undercommon'),
  ('elan','common'),
  ('half-giant','common'),
  ('maenad','common'),('maenad','maenad'),
  ('xeph','common'),('xeph','xeph'),
  ('blue','common'),('blue','goblin')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r
  ON r.slug=d.race_slug AND r.owner_user_id IS NULL
JOIN dnd35_languages l
  ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE r.id='xph-race-'||d.race_slug
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('dromite','dwarven'),('dromite','gnome'),('dromite','goblin'),('dromite','terran'),
  ('duergar-psionic','draconic'),('duergar-psionic','giant'),('duergar-psionic','goblin'),
  ('duergar-psionic','orc'),('duergar-psionic','terran'),
  ('half-giant','draconic'),('half-giant','giant'),('half-giant','gnoll'),('half-giant','ignan'),
  ('maenad','aquan'),('maenad','draconic'),('maenad','dwarven'),('maenad','elven'),('maenad','goblin'),
  ('xeph','draconic'),('xeph','elven'),('xeph','gnoll'),('xeph','goblin'),('xeph','halfling'),('xeph','sylvan'),
  ('blue','draconic'),('blue','elven'),('blue','giant'),('blue','gnoll'),('blue','orc')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r
  ON r.slug=d.race_slug AND r.owner_user_id IS NULL
JOIN dnd35_languages l
  ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE r.id='xph-race-'||d.race_slug
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
