-- Additional Monster Manual v3.5 outsider player races whose listed ability scores
-- can be converted to fixed racial adjustments using the DMG monster-PC rule.

WITH desired(slug) AS (VALUES ('couatl'),('lillend'),('triton'),('xill'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  description,rules_text
) AS (VALUES
  ('couatl','Couatl','37-38','outsider','large',20,7,9,8,9,
   'Large native celestial serpent with flight, telepathy, psionics, poison, and powerful racial spellcasting.',
   'LA +7. Large Outsider (Native); 9d8 racial Hit Dice; land speed 20 ft., fly 60 ft. (good); +8 Strength, +6 Dexterity, +4 Constitution, +6 Intelligence, +8 Wisdom, +6 Charisma; +9 natural armor; darkvision 60 ft.; constrict, improved grab, poison, psionics, 9th-level sorcerer spellcasting, ethereal jaunt, and telepathy 90 ft.'),
  ('lillend','Lillend','168','outsider','large',20,6,7,8,5,
   'Large celestial outsider devoted to art and wilderness, combining flight, constriction, bard magic, and innate spell-like abilities.',
   'LA +6. Large Outsider (Chaotic, Extraplanar, Good); 7d8 racial Hit Dice; land speed 20 ft., fly 70 ft. (average); +10 Strength, +6 Dexterity, +4 Constitution, +4 Intelligence, +6 Wisdom, +8 Charisma; +5 natural armor; darkvision 60 ft.; immunity to poison; fire resistance 10; 6th-level bard spellcasting and bardic music.'),
  ('triton','Triton','245-246','outsider','medium',5,2,3,8,6,
   'Native aquatic outsider with strong swimming ability, heavy natural armor, and limited summoning magic.',
   'LA +2. Medium Outsider (Native, Water); 3d8 racial Hit Dice; land speed 5 ft., swim 40 ft.; +2 Strength, +2 Constitution, +2 Intelligence, +2 Wisdom; +6 natural armor; darkvision 60 ft.; summon nature''s ally IV 1/day.'),
  ('xill','Xill','259-260','outsider','medium',40,4,5,8,7,
   'Four-armed extraplanar hunter with paralytic venom, planar movement, and strong spell resistance.',
   'LA +4. Medium Outsider (Extraplanar); 5d8 racial Hit Dice; speed 40 ft.; +4 Strength, +6 Dexterity, +4 Constitution, +2 Intelligence, +2 Wisdom; +7 natural armor; darkvision 60 ft.; implant, improved grab, paralysis, planewalk, and spell resistance 21.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct
   WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  NULL,'none',d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,0
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
  favored_class_id=NULL,
  favored_class_rule='none',
  size=excluded.size,
  base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,
  racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die,
  natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0,
  bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities
WHERE race_id IN ('mm1-race-couatl','mm1-race-lillend','mm1-race-triton','mm1-race-xill');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('couatl','str',8),('couatl','dex',6),('couatl','con',4),('couatl','int',6),('couatl','wis',8),('couatl','cha',6),
  ('lillend','str',10),('lillend','dex',6),('lillend','con',4),('lillend','int',4),('lillend','wis',6),('lillend','cha',8),
  ('triton','str',2),('triton','con',2),('triton','int',2),('triton','wis',2),
  ('xill','str',4),('xill','dex',6),('xill','con',4),('xill','int',2),('xill','wis',2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('couatl','native'),
  ('lillend','chaotic'),('lillend','extraplanar'),('lillend','good'),
  ('triton','native'),('triton','water'),
  ('xill','extraplanar')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;

WITH desired(race_slug,mode,feet,maneuverability,rules_text) AS (VALUES
  ('couatl','fly',60,'good','Fly speed 60 ft. with good maneuverability.'),
  ('lillend','fly',70,'average','Fly speed 70 ft. with average maneuverability.'),
  ('triton','swim',40,NULL,'Swim speed 40 ft.')
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
