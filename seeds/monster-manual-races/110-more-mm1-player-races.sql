-- Additional Monster Manual v3.5 player races with source-safe ability conversions.
-- These entries avoid creatures whose source ability scores below 10 require the DMG
-- lookup-table conversion rather than a fixed additive racial modifier.

WITH desired(slug) AS (VALUES ('aranea'),('locathah'),('merfolk'),('lamia'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  favored_slug,description,rules_text
) AS (VALUES
  ('aranea','Aranea','15-16','magical-beast','medium',50,4,3,10,1,NULL,
   'Intelligent shapechanging spider with sorcerous spellcasting, venom, webs, and multiple forms.',
   'LA +4. Medium Magical Beast (Shapechanger); 3d10 racial Hit Dice; land speed 50 ft., climb 25 ft.; +4 Dexterity, +4 Constitution, +4 Intelligence, +2 Wisdom, +4 Charisma; darkvision 60 ft.; low-light vision; +1 natural armor; poison; web; change shape; casts as a 3rd-level sorcerer.'),
  ('locathah','Locathah','169-170','humanoid','medium',10,1,2,8,3,'barbarian',
   'Aquatic humanoid with strong swimming ability, keen senses, and a thick scaled hide.',
   'LA +1. Medium Humanoid (Aquatic); 2d8 racial Hit Dice; land speed 10 ft., swim 60 ft.; +2 Dexterity, +2 Intelligence, +2 Wisdom; +3 natural armor; +8 racial bonus on Swim checks; favored class Barbarian.'),
  ('merfolk','Merfolk','185-186','humanoid','medium',5,1,0,NULL,0,'bard',
   'Amphibious aquatic humanoid adapted for fast swimming but very slow movement on land.',
   'LA +1. Medium Humanoid (Aquatic); its 1-HD warrior presentation is replaced by the first class level; land speed 5 ft., swim 50 ft.; +2 Dexterity, +2 Constitution, +2 Charisma; amphibious; low-light vision; +8 racial bonus on Swim checks; favored class Bard.'),
  ('lamia','Lamia','165','magical-beast','large',60,4,9,10,7,NULL,
   'Large magical beast with deceptive innate magic and a supernatural touch that drains Wisdom.',
   'LA +4. Large Magical Beast; 9d10 racial Hit Dice; speed 60 ft.; +8 Strength, +4 Dexterity, +2 Constitution, +2 Intelligence, +4 Wisdom, +2 Charisma; darkvision 60 ft.; low-light vision; +7 natural armor; spell-like abilities; Wisdom drain.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct
   WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  CASE WHEN d.favored_slug IS NULL THEN NULL ELSE
    (SELECT c.id FROM dnd35_classes c
     WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1)
  END,
  CASE
    WHEN d.favored_slug IS NOT NULL AND EXISTS (
      SELECT 1 FROM dnd35_classes c WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL
    ) THEN 'specific'
    ELSE 'none'
  END,
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
WHERE race_id IN ('mm1-race-aranea','mm1-race-locathah','mm1-race-merfolk','mm1-race-lamia');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('aranea','dex',4),('aranea','con',4),('aranea','int',4),('aranea','wis',2),('aranea','cha',4),
  ('locathah','dex',2),('locathah','int',2),('locathah','wis',2),
  ('merfolk','dex',2),('merfolk','con',2),('merfolk','cha',2),
  ('lamia','str',8),('lamia','dex',4),('lamia','con',2),('lamia','int',2),('lamia','wis',4),('lamia','cha',2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('aranea','shapechanger'),
  ('locathah','aquatic'),
  ('merfolk','aquatic')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;

WITH desired(race_slug,mode,feet,maneuverability,rules_text) AS (VALUES
  ('aranea','climb',25,NULL,'Climb speed 25 ft.'),
  ('locathah','swim',60,NULL,'Swim speed 60 ft.'),
  ('merfolk','swim',50,NULL,'Swim speed 50 ft.')
)
INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,d.mode,d.feet,NULL,d.maneuverability,d.rules_text
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  base_speed_multiplier=NULL,
  maneuverability=excluded.maneuverability,
  rules_text=excluded.rules_text;
