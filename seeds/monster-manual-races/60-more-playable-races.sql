-- Additional Monster Manual v3.5 playable races with creator-safe progression models.
-- Tiefling and Pixie replace their single racial HD with the first class level.
-- Yuan-ti Pureblood retains 4 monstrous-humanoid racial Hit Dice.

WITH desired(slug) AS (VALUES ('tiefling'),('pixie'),('yuan-ti-pureblood'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  favored_slug,description,rules_text
) AS (VALUES
  ('tiefling','Tiefling','209-210','outsider','medium',30,1,0,NULL,0,'rogue',
   'Fiend-touched native outsider with darkvision, minor energy resistances, innate darkness, and a talent for deception.',
   'LA +1. Medium Outsider (Native); no retained racial Hit Dice; speed 30 ft.; +2 Dexterity, +2 Intelligence, -2 Charisma; darkvision 60 ft.; +2 Bluff and Hide; cold/electricity/fire resistance 5; darkness 1/day; favored class Rogue.'),
  ('pixie','Pixie','235-236','fey','small',20,4,0,NULL,1,'sorcerer',
   'Small flying fey with constant greater invisibility, innate magic, strong spell resistance, and cold-iron defenses.',
   'LA +4. Small Fey; the normal 1 fey HD is exchanged for the first class level; land speed 20 ft., fly 60 ft. (good); -4 Strength, +8 Dexterity, +6 Intelligence, +4 Wisdom, +6 Charisma; low-light vision; +1 natural armor; DR 10/cold iron; spell resistance 15 + class levels; favored class Sorcerer.'),
  ('yuan-ti-pureblood','Yuan-ti Pureblood','263-264','monstrous-humanoid','medium',30,2,4,8,1,'ranger',
   'Mostly human-looking yuan-ti with innate serpent magic, viper transformation, poison detection, and strong spell resistance.',
   'LA +2. Medium Monstrous Humanoid; 4d8 racial Hit Dice; speed 30 ft.; +2 Dexterity, +2 Intelligence, +2 Charisma; darkvision 60 ft.; +1 natural armor; spell-like abilities; viper alternate form; detect poison; spell resistance 14 + class levels; favored class Ranger.')
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
WHERE race_id IN ('mm1-race-tiefling','mm1-race-pixie','mm1-race-yuan-ti-pureblood');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('tiefling','dex',2),('tiefling','int',2),('tiefling','cha',-2),
  ('pixie','str',-4),('pixie','dex',8),('pixie','int',6),('pixie','wis',4),('pixie','cha',6),
  ('yuan-ti-pureblood','dex',2),('yuan-ti-pureblood','int',2),('yuan-ti-pureblood','cha',2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM dnd35_races r
JOIN dnd35_creature_subtypes s ON s.slug='native' AND s.owner_user_id IS NULL
WHERE r.id='mm1-race-tiefling';

INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',60,NULL,'good','Pixie fly speed.'
FROM dnd35_races r WHERE r.id='mm1-race-pixie'
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  base_speed_multiplier=NULL,
  maneuverability=excluded.maneuverability,
  rules_text=excluded.rules_text;
