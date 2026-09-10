-- Generated SQL mirror of docs/dnd35-playable-race-catalog/xph-3.5.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('dromite','Dromite','race','pc',1,NULL,'source-verified'),
  ('duergar-psionic','Duergar (Psionic)','race','pc',1,NULL,'source-verified'),
  ('elan','Elan','race','pc',0,NULL,'source-verified'),
  ('half-giant','Half-Giant','race','pc',1,NULL,'source-verified'),
  ('maenad','Maenad','race','pc',0,NULL,'source-verified'),
  ('xeph','Xeph','race','pc',0,NULL,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-xph-3.5-'||d.slug,'xph-3.5','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from xph-3.5.csv.',
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
  WHERE r.source_id='xph-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
