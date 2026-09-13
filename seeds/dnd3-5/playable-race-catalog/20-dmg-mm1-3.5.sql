-- Generated SQL mirror of docs/dnd35-playable-race-catalog/dmg-mm1-3.5.csv.
-- IMPORTANT: the CSV catalog does not contain enough mechanics to create a rules-complete race.
-- New catalog-only rows are therefore inserted DISABLED with sentinel speed 0.
-- `size = medium` is a schema placeholder only; do not enable a row until source-backed
-- size, movement, type, RHD, ability modifiers, languages, traits, and special abilities are materialized.
-- Existing source+slug race rows are left untouched.

-- Template entries are intentionally not inserted into dnd35_races:
--   Lycanthrope (Afflicted) (lycanthrope-afflicted) -> dnd35_templates in a dedicated template seed pass.
--   Lycanthrope (Natural) (lycanthrope-natural) -> dnd35_templates in a dedicated template seed pass.

WITH desired(slug,name,kind,eligibility,level_adjustment,legacy_ecl_offset,verification) AS (VALUES
  ('aasimar','Aasimar','monster-pc','pc',1,NULL,'source-verified'),
  ('aquatic-elf','Aquatic Elf','subrace','pc',0,NULL,'source-verified'),
  ('bugbear','Bugbear','monster-pc','pc',1,NULL,'source-verified'),
  ('centaur','Centaur','monster-pc','pc',2,NULL,'source-verified'),
  ('deep-dwarf','Deep Dwarf','subrace','pc',0,NULL,'source-verified'),
  ('deep-halfling','Deep Halfling','subrace','pc',0,NULL,'source-verified'),
  ('drider','Drider','monster-pc','pc',4,NULL,'source-verified'),
  ('drow','Drow','subrace','pc',2,NULL,'source-verified'),
  ('duergar','Duergar','subrace','pc',1,NULL,'source-verified'),
  ('forest-gnome','Forest Gnome','subrace','pc',0,NULL,'source-verified'),
  ('gargoyle','Gargoyle','monster-pc','pc',5,NULL,'source-verified'),
  ('githyanki','Githyanki','monster-pc','pc',2,NULL,'source-verified'),
  ('githzerai','Githzerai','monster-pc','pc',2,NULL,'source-verified'),
  ('gnoll','Gnoll','monster-pc','pc',1,NULL,'source-verified'),
  ('goblin','Goblin','monster-pc','pc',0,NULL,'source-verified'),
  ('gray-elf','Gray Elf','subrace','pc',0,NULL,'source-verified'),
  ('hill-giant','Hill Giant','monster-pc','pc',4,NULL,'source-verified'),
  ('hobgoblin','Hobgoblin','monster-pc','pc',1,NULL,'source-verified'),
  ('janni','Janni','monster-pc','pc',5,NULL,'source-verified'),
  ('kobold','Kobold','monster-pc','pc',0,NULL,'source-verified'),
  ('kuo-toa','Kuo-toa','monster-pc','pc',3,NULL,'source-verified'),
  ('lizardfolk','Lizardfolk','monster-pc','pc',1,NULL,'source-verified'),
  ('mind-flayer','Mind Flayer','monster-pc','pc',7,NULL,'source-verified'),
  ('minotaur','Minotaur','monster-pc','pc',2,NULL,'source-verified'),
  ('mountain-dwarf','Mountain Dwarf','subrace','pc',0,NULL,'source-verified'),
  ('ogre','Ogre','monster-pc','pc',2,NULL,'source-verified'),
  ('ogre-mage','Ogre Mage','monster-pc','pc',7,NULL,'source-verified'),
  ('orc','Orc','monster-pc','pc',0,NULL,'source-verified'),
  ('pixie','Pixie','monster-pc','pc',4,NULL,'source-verified'),
  ('satyr','Satyr','monster-pc','pc',2,NULL,'source-verified'),
  ('svirfneblin','Svirfneblin','subrace','pc',3,NULL,'source-verified'),
  ('tallfellow-halfling','Tallfellow Halfling','subrace','pc',0,NULL,'source-verified'),
  ('tiefling','Tiefling','monster-pc','pc',1,NULL,'source-verified'),
  ('troglodyte','Troglodyte','monster-pc','pc',2,NULL,'source-verified'),
  ('troll','Troll','monster-pc','pc',5,NULL,'source-verified'),
  ('vampire','Vampire','monster-pc','pc',8,NULL,'source-verified'),
  ('wild-elf','Wild Elf','subrace','pc',0,NULL,'source-verified'),
  ('wood-elf','Wood Elf','subrace','pc',0,NULL,'source-verified'),
  ('yuan-ti-halfblood','Yuan-ti Halfblood','monster-pc','pc',5,NULL,'source-verified'),
  ('yuan-ti-pureblood','Yuan-ti Pureblood','monster-pc','pc',2,NULL,'source-verified')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'catalog-race-dmg-mm1-3.5-'||d.slug,'dmg-mm1-3.5','catalog-pending',d.slug,d.name,
  'Catalog seed placeholder for '||d.name||' from dmg-mm1-3.5.csv.',
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
  WHERE r.source_id='dmg-mm1-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
