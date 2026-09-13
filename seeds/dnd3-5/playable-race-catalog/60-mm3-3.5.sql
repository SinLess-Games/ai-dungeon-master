-- Generated SQL mirror of docs/dnd35-playable-race-catalog/mm3-3.5.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

-- Template entries are intentionally not inserted into dnd35_races:
--   Spellwarped Creature (spellwarped-creature) -> dnd35_templates in a dedicated template seed pass.
--   Voidmind Creature (voidmind-creature) -> dnd35_templates in a dedicated template seed pass.
--   Woodling (woodling) -> dnd35_templates in a dedicated template seed pass.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('ak-chazar-rakshasa','Ak’chazar Rakshasa','monster-pc','pc',5,NULL,'source-verified'),
  ('armand','Armand','monster-pc','pc',3,NULL,'source-verified'),
  ('astral-stalker','Astral Stalker','monster-pc','pc',6,NULL,'source-verified'),
  ('blackscale-lizardfolk','Blackscale Lizardfolk','monster-pc','pc',3,NULL,'source-verified'),
  ('canoloth','Canoloth','monster-pc','pc',5,NULL,'source-verified'),
  ('cave-troll','Cave Troll','monster-pc','pc',6,NULL,'source-verified'),
  ('changeling','Changeling','monster-pc','pc',0,NULL,'source-verified'),
  ('deathshrieker','Deathshrieker','monster-pc','pc',8,NULL,'source-verified'),
  ('dracotaur','Dracotaur','monster-pc','pc',5,NULL,'source-verified'),
  ('flind','Flind','monster-pc','pc',2,NULL,'source-verified'),
  ('forest-troll','Forest Troll','monster-pc','pc',5,NULL,'source-verified'),
  ('forestkith-goblin','Forestkith Goblin','monster-pc','pc',1,NULL,'source-verified'),
  ('glaistig','Glaistig','monster-pc','pc',4,NULL,'source-verified'),
  ('goatfolk','Goatfolk (Ibixian)','monster-pc','pc',1,NULL,'source-verified'),
  ('grimwierd','Grimwierd','monster-pc','pc',3,NULL,'source-verified'),
  ('gulgar','Gulgar','monster-pc','pc',5,NULL,'source-verified'),
  ('harssaf','Harssaf','monster-pc','pc',4,NULL,'source-verified'),
  ('kenku','Kenku','monster-pc','pc',0,NULL,'source-verified'),
  ('lhosk','Lhosk','monster-pc','pc',3,NULL,'source-verified'),
  ('lumi','Lumi','monster-pc','pc',2,NULL,'source-verified'),
  ('mezzoloth','Mezzoloth','monster-pc','pc',5,NULL,'source-verified'),
  ('mountain-troll','Mountain Troll','monster-pc','pc',5,NULL,'source-verified'),
  ('naztharune-rakshasa','Naztharune Rakshasa','monster-pc','pc',5,NULL,'source-verified'),
  ('nycaloth','Nycaloth','monster-pc','pc',5,NULL,'source-verified'),
  ('nycter','Nycter','monster-pc','pc',2,NULL,'source-verified'),
  ('phoelarch','Phoelarch','monster-pc','pc',5,NULL,'source-verified'),
  ('poison-dusk-lizardfolk','Poison Dusk Lizardfolk','monster-pc','pc',1,NULL,'source-verified'),
  ('quaraphon','Quaraphon','monster-pc','pc',5,NULL,'source-verified'),
  ('redcap','Redcap','monster-pc','pc',4,NULL,'source-verified'),
  ('rejkar','Rejkar','monster-pc','pc',6,NULL,'source-verified'),
  ('salt-mummy','Salt Mummy','monster-pc','pc',6,NULL,'source-verified'),
  ('sand-giant','Sand Giant','monster-pc','pc',4,NULL,'source-verified'),
  ('shifter','Shifter','monster-pc','pc',0,NULL,'source-verified'),
  ('skullcrusher-ogre','Skullcrusher Ogre','monster-pc','pc',3,NULL,'source-verified'),
  ('splinterwaif','Splinterwaif','monster-pc','pc',4,NULL,'source-verified'),
  ('war-troll','War Troll','monster-pc','pc',6,NULL,'source-verified'),
  ('warforged','Warforged','monster-pc','pc',0,NULL,'source-verified'),
  ('warforged-charger','Warforged Charger','monster-pc','pc',4,NULL,'source-verified'),
  ('warforged-scout','Warforged Scout','monster-pc','pc',0,NULL,'source-verified'),
  ('witchknife','Witchknife','monster-pc','pc',3,NULL,'source-verified'),
  ('wood-woad','Wood Woad','monster-pc','pc',3,NULL,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-mm3-3.5-'||d.slug,'mm3-3.5','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from mm3-3.5.csv.',
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
  WHERE r.source_id='mm3-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
