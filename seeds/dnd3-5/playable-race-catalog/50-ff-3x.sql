-- Generated SQL mirror of docs/dnd35-playable-race-catalog/ff-3x.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

-- Template entries are intentionally not inserted into dnd35_races:
--   Half-Fey (half-fey) -> dnd35_templates in a dedicated template seed pass.
--   Half-Illithid (half-illithid) -> dnd35_templates in a dedicated template seed pass.
--   Half-Troll (half-troll) -> dnd35_templates in a dedicated template seed pass.
--   Huecuva (huecuva) -> dnd35_templates in a dedicated template seed pass.
--   Ti-khana (ti-khana) -> dnd35_templates in a dedicated template seed pass.
--   Wendigo (wendigo) -> dnd35_templates in a dedicated template seed pass.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('abrian','Abrian','monster-pc','pc',1,NULL,'source-verified'),
  ('canomorph-haraknin','Canomorph (Haraknin)','monster-pc','pc',3,NULL,'source-verified'),
  ('canomorph-shadurakul','Canomorph (Shadurakul)','monster-pc','pc',4,NULL,'source-verified'),
  ('canomorph-vultivor','Canomorph (Vultivor)','monster-pc','pc',4,NULL,'source-verified'),
  ('dark-creeper','Dark Creeper','monster-pc','pc',4,NULL,'source-verified'),
  ('dark-stalker','Dark Stalker','monster-pc','pc',5,NULL,'source-verified'),
  ('ethergaunt-black','Ethergaunt (Black)','monster-pc','pc',7,NULL,'source-verified'),
  ('ethergaunt-red','Ethergaunt (Red)','monster-pc','pc',4,NULL,'source-verified'),
  ('ethergaunt-white','Ethergaunt (White)','monster-pc','pc',5,NULL,'source-verified'),
  ('fensir','Fensir','monster-pc','pc',4,NULL,'source-verified'),
  ('feytouched','Feytouched','monster-pc','pc',1,NULL,'source-verified'),
  ('jackal-lord','Jackal Lord','monster-pc','pc',4,NULL,'source-verified'),
  ('kaorti','Kaorti','monster-pc','pc',2,NULL,'source-verified'),
  ('keeper','Keeper','monster-pc','pc',3,NULL,'source-verified'),
  ('kelpie','Kelpie','monster-pc','pc',3,NULL,'source-verified'),
  ('maug','Maug','monster-pc','pc',3,NULL,'source-verified'),
  ('mongrelfolk','Mongrelfolk','monster-pc','pc',0,NULL,'source-verified'),
  ('nerra-kalareem','Nerra (Kalareem)','monster-pc','pc',6,NULL,'source-verified'),
  ('nerra-sillit','Nerra (Sillit)','monster-pc','pc',18,NULL,'source-verified'),
  ('octopus-tree','Octopus Tree','monster-pc','pc',3,NULL,'source-verified'),
  ('planetouched-adu-ja','Planetouched Variant','monster-pc','pc',1,NULL,'source-verified'),
  ('quth-maren','Quth-Maren','monster-pc','pc',3,NULL,'source-verified'),
  ('rilmani-aurumach','Rilmani (Aurumach)','monster-pc','pc',9,NULL,'source-verified'),
  ('rilmani-argental','Rilmani Variant','monster-pc','pc',5,NULL,'source-verified'),
  ('selkie','Selkie','monster-pc','pc',1,NULL,'source-verified'),
  ('shadar-kai','Shadar-kai','monster-pc','pc',1,NULL,'source-verified'),
  ('shedu','Shedu','monster-pc','pc',2,NULL,'source-verified'),
  ('spriggan','Spriggan','monster-pc','pc',2,NULL,'source-verified'),
  ('wispling','Wispling','monster-pc','pc',1,NULL,'source-verified'),
  ('yuan-ti-anathema','Yuan-ti Anathema','monster-pc','pc',6,NULL,'source-verified'),
  ('yurian','Yurian','monster-pc','pc',4,NULL,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-ff-3x-'||d.slug,'ff-3x','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from ff-3x.csv.',
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
  WHERE r.source_id='ff-3x' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
