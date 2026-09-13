-- Additional source-verified Monster Manual v3.5 outsider player races.
-- All listed ability scores are 10 or higher, so the DMG monster-PC conversion
-- can be represented as fixed additive racial ability modifiers.

-- Subtypes used by this batch that are not part of the PHB favored-enemy list.
WITH desired(slug,name) AS (VALUES
  ('angel','Angel'),
  ('eladrin','Eladrin'),
  ('extraplanar','Extraplanar'),
  ('baatezu','Baatezu')
)
INSERT INTO dnd35_creature_subtypes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'mm1-creature-subtype-'||d.slug,'mm1-3.5',NULL,d.slug,d.name,
  'Monster Manual v3.5 creature subtype used by playable monster-race data.',
  'Source-backed subtype identity for Monster Manual v3.5 creature and player-race rules.',
  0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_subtypes s
  WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);

WITH desired(slug) AS (VALUES ('astral-deva'),('bralani'),('djinni'),('erinyes'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,size,speed,la,rhd,natural_armor,description,rules_text
) AS (VALUES
  ('astral-deva','Astral Deva','10-11','medium',50,8,12,15,
   'Powerful angelic outsider with extraordinary defenses, flight, protective magic, innate spell-like abilities, and a stunning melee technique.',
   'LA +8. Medium Outsider (Angel, Extraplanar, Good); 12d8 racial Hit Dice; land speed 50 ft., fly 100 ft. (good); +12 Strength, +8 Dexterity, +8 Constitution, +8 Intelligence, +8 Wisdom, +10 Charisma; +15 natural armor; darkvision 60 ft.; low-light vision; DR 10/evil; immunities to acid, cold, and petrification; electricity/fire resistance 10; SR 30; protective aura; tongues; spell-like abilities; stun; uncanny dodge.'),
  ('bralani','Bralani Eladrin','93-94','medium',40,5,6,6,
   'Wild celestial eladrin able to fly with perfect maneuverability, assume whirlwind form, and wield wind and illusion magic.',
   'LA +5. Medium Outsider (Chaotic, Eladrin, Extraplanar, Good); 6d8 racial Hit Dice; land speed 40 ft., fly 100 ft. (perfect); +8 Strength, +8 Dexterity, +6 Constitution, +2 Intelligence, +4 Wisdom, +4 Charisma; +6 natural armor; darkvision 60 ft.; low-light vision; DR 10/cold iron or evil; electricity and petrification immunity; cold/fire resistance 10; SR 17; tongues; spell-like abilities; whirlwind blast; alternate form.'),
  ('djinni','Djinni','114-115','large',20,6,7,3,
   'Air genie with perfect flight, powerful innate creation and illusion magic, planar travel, telepathy, and a dangerous whirlwind form.',
   'LA +6. Large Outsider (Air, Extraplanar); 7d8 racial Hit Dice; land speed 20 ft., fly 60 ft. (perfect); +8 Strength, +8 Dexterity, +4 Constitution, +4 Intelligence, +4 Wisdom, +4 Charisma; +3 natural armor; darkvision 60 ft.; immunity to acid; air mastery; spell-like abilities; whirlwind; plane shift; telepathy 100 ft.'),
  ('erinyes','Erinyes','54','medium',30,7,9,8,
   'Winged baatezu archer with infernal defenses, entangling rope, at-will magic, summoning, telepathy, and continuous true seeing.',
   'LA +7. Medium Outsider (Baatezu, Evil, Extraplanar, Lawful); 9d8 racial Hit Dice; land speed 30 ft., fly 50 ft. (good); +10 Strength, +10 Dexterity, +10 Constitution, +4 Intelligence, +8 Wisdom, +10 Charisma; +8 natural armor; darkvision 60 ft.; DR 5/good; fire/poison immunity; acid/cold resistance 10; SR 20; see in darkness; telepathy 100 ft.; true seeing; entangle; spell-like abilities; summon baatezu.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct
   WHERE ct.slug='outsider' AND ct.owner_user_id IS NULL LIMIT 1),
  NULL,'none',d.size,d.speed,d.la,d.rhd,8,d.natural_armor,0,0
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
WHERE race_id IN ('mm1-race-astral-deva','mm1-race-bralani','mm1-race-djinni','mm1-race-erinyes');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('astral-deva','str',12),('astral-deva','dex',8),('astral-deva','con',8),('astral-deva','int',8),('astral-deva','wis',8),('astral-deva','cha',10),
  ('bralani','str',8),('bralani','dex',8),('bralani','con',6),('bralani','int',2),('bralani','wis',4),('bralani','cha',4),
  ('djinni','str',8),('djinni','dex',8),('djinni','con',4),('djinni','int',4),('djinni','wis',4),('djinni','cha',4),
  ('erinyes','str',10),('erinyes','dex',10),('erinyes','con',10),('erinyes','int',4),('erinyes','wis',8),('erinyes','cha',10)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
WHERE 1
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('astral-deva','angel'),('astral-deva','extraplanar'),('astral-deva','good'),
  ('bralani','chaotic'),('bralani','eladrin'),('bralani','extraplanar'),('bralani','good'),
  ('djinni','air'),('djinni','extraplanar'),
  ('erinyes','baatezu'),('erinyes','evil'),('erinyes','extraplanar'),('erinyes','lawful')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;

WITH desired(race_slug,feet,maneuverability,rules_text) AS (VALUES
  ('astral-deva',100,'good','Fly speed 100 ft. with good maneuverability.'),
  ('bralani',100,'perfect','Fly speed 100 ft. with perfect maneuverability.'),
  ('djinni',60,'perfect','Fly speed 60 ft. with perfect maneuverability.'),
  ('erinyes',50,'good','Fly speed 50 ft. with good maneuverability.')
)
INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',d.feet,NULL,d.maneuverability,d.rules_text
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
WHERE 1
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  base_speed_multiplier=NULL,
  maneuverability=excluded.maneuverability,
  rules_text=excluded.rules_text;
