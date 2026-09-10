-- Generated SQL mirror of docs/dnd35-playable-race-catalog/mm1-3.5.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

-- Template entries are intentionally not inserted into dnd35_races:
--   Half-Celestial (half-celestial) -> dnd35_templates in a dedicated template seed pass.
--   Half-Dragon (half-dragon) -> dnd35_templates in a dedicated template seed pass.
--   Half-Fiend (half-fiend) -> dnd35_templates in a dedicated template seed pass.
--   Lich (lich) -> dnd35_templates in a dedicated template seed pass.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('aranea','Aranea','monster-pc','pc',4,NULL,'source-verified'),
  ('astral-deva','Astral Deva','monster-pc','pc',8,NULL,'source-verified'),
  ('azer','Azer','monster-pc','pc',4,NULL,'source-verified'),
  ('bearded-devil','Bearded Devil','monster-pc','pc',6,NULL,'source-verified'),
  ('bralani','Bralani Eladrin','monster-pc','pc',5,NULL,'source-verified'),
  ('chain-devil','Chain Devil','monster-pc','pc',6,NULL,'source-verified'),
  ('couatl','Couatl','monster-pc','pc',7,NULL,'source-verified'),
  ('displacer-beast','Displacer Beast','monster-pc','pc',4,NULL,'source-verified'),
  ('djinni','Djinni','monster-pc','pc',6,NULL,'source-verified'),
  ('dretch','Dretch','monster-pc','pc',2,NULL,'source-verified'),
  ('erinyes','Erinyes','monster-pc','pc',7,NULL,'source-verified'),
  ('ettercap','Ettercap','monster-pc','pc',4,NULL,'source-verified'),
  ('ettin','Ettin','monster-pc','pc',5,NULL,'source-verified'),
  ('fire-giant','Fire Giant','monster-pc','pc',4,NULL,'source-verified'),
  ('frost-giant','Frost Giant','monster-pc','pc',4,NULL,'source-verified'),
  ('harpy','Harpy','monster-pc','pc',3,NULL,'source-verified'),
  ('hound-archon','Hound Archon','monster-pc','pc',5,NULL,'source-verified'),
  ('invisible-stalker','Invisible Stalker','monster-pc','pc',7,NULL,'source-verified'),
  ('lamia','Lamia','monster-pc','pc',4,NULL,'source-verified'),
  ('lammasu','Lammasu','monster-pc','pc',5,NULL,'source-verified'),
  ('lillend','Lillend','monster-pc','pc',6,NULL,'source-verified'),
  ('locathah','Locathah','monster-pc','pc',1,NULL,'source-verified'),
  ('medusa','Medusa','monster-pc','pc',3,NULL,'source-verified'),
  ('merfolk','Merfolk','monster-pc','pc',1,NULL,'source-verified'),
  ('rakshasa','Rakshasa','monster-pc','pc',7,NULL,'source-verified'),
  ('stone-giant','Stone Giant','monster-pc','pc',4,NULL,'source-verified'),
  ('succubus','Succubus','monster-pc','pc',6,NULL,'source-verified'),
  ('triton','Triton','monster-pc','pc',2,NULL,'source-verified'),
  ('trumpet-archon','Trumpet Archon','monster-pc','pc',8,NULL,'source-verified'),
  ('vrock','Vrock','monster-pc','pc',8,NULL,'source-verified'),
  ('xill','Xill','monster-pc','pc',4,NULL,'source-verified'),
  ('yuan-ti-abomination','Yuan-ti Abomination','monster-pc','pc',7,NULL,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-mm1-3.5-'||d.slug,'mm1-3.5','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from mm1-3.5.csv.',
  'Catalog metadata only; this row is disabled until its complete source-backed racial mechanics are materialized. '||
    'Kind: '||d.kind||'; eligibility: '||d.eligibility||'; verification: '||d.verification||
    CASE WHEN d.level_adjustment IS NOT NULL THEN '; level adjustment: +'||d.level_adjustment ELSE '' END ||
    CASE WHEN d.legacy_ecl_offset IS NOT NULL THEN '; legacy ECL offset: +'||d.legacy_ecl_offset ELSE '' END ||'.',
  0,NULL,0,
  NULL,NULL,'none','medium',0,d.level_adjustment,
  0,NULL,0,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1
  FROM dnd35_races r
  WHERE r.source_id='mm1-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
