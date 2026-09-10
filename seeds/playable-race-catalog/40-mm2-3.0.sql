-- Generated SQL mirror of docs/dnd35-playable-race-catalog/mm2-3.0.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

-- Template entries are intentionally not inserted into dnd35_races:
--   Death Knight (death-knight) -> dnd35_templates in a dedicated template seed pass.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('abeil-queen','Abeil Queen','legacy-monster-pc','pc',NULL,21,'source-verified'),
  ('abeil-soldier','Abeil Soldier','legacy-monster-pc','pc',NULL,11,'source-verified'),
  ('abeil-vassal','Abeil Vassal','legacy-monster-pc','pc',NULL,3,'source-verified'),
  ('avolakia','Avolakia','legacy-monster-pc','pc',NULL,15,'source-verified'),
  ('bladeling','Bladeling','legacy-monster-pc','pc',NULL,1,'source-verified'),
  ('braxat','Braxat','legacy-monster-pc','pc',NULL,16,'source-verified'),
  ('chaond','Chaond','legacy-monster-pc','pc',NULL,1,'source-verified'),
  ('desmodu','Desmodu','legacy-monster-pc','pc',NULL,14,'source-verified'),
  ('durzagon','Durzagon','legacy-monster-pc','pc',NULL,7,'source-verified'),
  ('firbolg','Firbolg','legacy-monster-pc','pc',NULL,18,'source-verified'),
  ('fomorian','Fomorian','legacy-monster-pc','pc',NULL,17,'source-verified'),
  ('forest-giant-mm2','Forest Giant','legacy-monster-pc','pc',NULL,16,'source-verified'),
  ('glimmerskin','Glimmerskin','legacy-monster-pc','pc',NULL,15,'source-verified'),
  ('ixitxachitl','Ixitxachitl','legacy-monster-pc','pc',NULL,2,'source-verified'),
  ('loxo','Loxo','legacy-monster-pc','pc',NULL,7,'source-verified'),
  ('mountain-giant','Mountain Giant','legacy-monster-pc','pc',NULL,25,'source-verified'),
  ('neogi','Neogi','legacy-monster-pc','pc',NULL,8,'source-verified'),
  ('ocean-giant','Ocean Giant','legacy-monster-pc','pc',NULL,23,'source-verified'),
  ('ocean-strider','Ocean Strider','legacy-monster-pc','pc',NULL,35,'source-verified'),
  ('scorpionfolk','Scorpionfolk','legacy-monster-pc','pc',NULL,16,'source-verified'),
  ('sun-giant','Sun Giant','legacy-monster-pc','pc',NULL,16,'source-verified'),
  ('thri-kreen','Thri-kreen','legacy-monster-pc','pc',NULL,3,'source-verified'),
  ('thri-kreen-psionic','Thri-kreen (Psionic)','legacy-monster-pc','pc',NULL,5,'source-verified'),
  ('vampiric-ixitxachitl','Vampiric Ixitxachitl','legacy-monster-pc','pc',NULL,5,'source-verified'),
  ('yak-folk','Yak Folk','legacy-monster-pc','pc',NULL,7,'source-verified'),
  ('zenythri','Zenythri','legacy-monster-pc','pc',NULL,1,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-mm2-3.0-'||d.slug,'mm2-3.0','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from mm2-3.0.csv.',
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
  WHERE r.source_id='mm2-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
