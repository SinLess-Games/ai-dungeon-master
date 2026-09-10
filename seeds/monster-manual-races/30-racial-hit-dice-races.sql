-- Monster Manual v3.5 playable races that retain racial Hit Dice.
-- These races use creature-type BAB/save chassis already supported by the creator:
-- monstrous humanoid for Centaur/Gargoyle and outsider for Janni.
-- Existing enabled canonical rows win over older disabled catalog placeholders.

WITH desired(slug) AS (VALUES ('centaur'),('gargoyle'),('janni'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  favored_slug,description,rules_text
) AS (VALUES
  ('centaur','Centaur','32-33','monstrous-humanoid','large',50,2,4,8,3,'ranger',
   'Large woodland monstrous humanoid combining exceptional speed, strength, and keen senses.',
   'LA +2. Large Monstrous Humanoid; 4d8 racial Hit Dice; base speed 50 ft.; +8 Strength, +4 Dexterity, +4 Constitution, -2 Intelligence, +2 Wisdom; darkvision 60 ft.; +3 natural armor; favored class Ranger.'),
  ('gargoyle','Gargoyle','113-114','monstrous-humanoid','medium',40,5,4,8,4,'fighter',
   'Stone-skinned flying monstrous humanoid able to remain motionless like a statue.',
   'LA +5. Medium Monstrous Humanoid (Earth); 4d8 racial Hit Dice; land speed 40 ft., fly 60 ft. (average); +4 Strength, +4 Dexterity, +8 Constitution, -4 Intelligence, -4 Charisma; darkvision 60 ft.; +4 natural armor; DR 10/magic; freeze; favored class Fighter.'),
  ('janni','Janni','116','outsider','medium',30,5,6,8,1,'rogue',
   'Native genie formed from all four elements, with flight, innate magic, planar travel, and telepathy.',
   'LA +5. Medium Outsider (Native); 6d8 racial Hit Dice; land speed 30 ft., fly 20 ft. (perfect); +6 Strength, +4 Dexterity, +2 Constitution, +4 Intelligence, +4 Wisdom, +2 Charisma; darkvision 60 ft.; +1 natural armor; genie abilities; favored class Rogue.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct
   WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c
   WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (
    SELECT 1 FROM dnd35_classes c WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL
  ) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r
  WHERE r.slug=d.slug
    AND r.owner_user_id IS NULL
    AND r.is_enabled=1
    AND r.id <> 'mm1-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  creature_type_id=excluded.creature_type_id,
  favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,
  size=excluded.size,
  base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,
  racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die,
  natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0,
  bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities
WHERE race_id IN ('mm1-race-centaur','mm1-race-gargoyle','mm1-race-janni');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('centaur','str',8),('centaur','dex',4),('centaur','con',4),('centaur','int',-2),('centaur','wis',2),
  ('gargoyle','str',4),('gargoyle','dex',4),('gargoyle','con',8),('gargoyle','int',-4),('gargoyle','cha',-4),
  ('janni','str',6),('janni','dex',4),('janni','con',2),('janni','int',4),('janni','wis',4),('janni','cha',2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('gargoyle','earth'),
  ('janni','native')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;

INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',60,NULL,'average','Gargoyle fly speed.'
FROM dnd35_races r WHERE r.id='mm1-race-gargoyle'
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet, base_speed_multiplier=NULL,
  maneuverability=excluded.maneuverability, rules_text=excluded.rules_text;

INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',20,NULL,'perfect','Janni fly speed.'
FROM dnd35_races r WHERE r.id='mm1-race-janni'
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet, base_speed_multiplier=NULL,
  maneuverability=excluded.maneuverability, rules_text=excluded.rules_text;
