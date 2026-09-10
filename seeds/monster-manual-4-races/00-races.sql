-- Curated Monster Manual IV player races from the by-book playable-race index.
-- These rows follow the source's dedicated player-character sections where they differ
-- from the encounter stat block (notably the Varag player racial-class base speed).

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('mm4-3.5','monster-manual-iv-3-5','Monster Manual IV','MM4',
   'Wizards of the Coast','dnd','3.5','D&D 3.5 Monster Manual IV sourcebook.',NULL,1,0,NULL);

DELETE FROM dnd35_races
WHERE owner_user_id IS NULL AND is_enabled=0 AND slug IN ('varag','windrazor','windscythe');

WITH desired(
  slug,name,type_slug,size,speed,la,rhd,natural_armor,favored_class_slug,source_page,description,rules_text
) AS (VALUES
  ('varag','Varag','humanoid','medium',40,2,3,3,'scout','168-171',
   'A feral goblinoid bred for speed, stealth, scent-tracking, and relentless pursuit.',
   'Monster Manual IV player race: 3d8 humanoid racial Hit Dice, LA +2, darkvision, scent, strong stealth, and bonus mobility feats. The player racial-class base traits list a 40-foot land speed.'),
  ('windrazor','Windrazor','outsider','small',10,2,2,0,'ranger','176-179',
   'A small extraplanar windblade scout with claws, flight, keen senses, and fearsome critical strikes.',
   'Monster Manual IV player race: 2d8 outsider racial Hit Dice, LA +2, climb 10 ft., fly 40 ft. (good), keen senses, rend, and fearsome critical.'),
  ('windscythe','Windscythe','outsider','large',10,5,8,4,'fighter','177-179',
   'A large extraplanar windblade warrior with powerful claws, flight, augmented criticals, and brutal rend attacks.',
   'Monster Manual IV player race: 8d8 outsider racial Hit Dice, LA +5, climb 10 ft., fly 60 ft. (average), augmented critical, keen senses, rend, and fearsome critical.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm4-race-'||d.slug,'mm4-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c WHERE c.slug=d.favored_class_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.slug=d.favored_class_slug AND c.owner_user_id IS NULL) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,d.la,d.rhd,8,d.natural_armor,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r WHERE r.slug=d.slug AND r.owner_user_id IS NULL AND r.is_enabled=1 AND r.id<>'mm4-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,source_page=excluded.source_page,name=excluded.name,
  description=excluded.description,rules_text=excluded.rules_text,is_homebrew=0,owner_user_id=NULL,is_enabled=1,
  creature_type_id=excluded.creature_type_id,favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,size=excluded.size,base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die,natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0,bonus_feats_at_first_level=0;

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('varag','str',4),('varag','dex',4),('varag','con',2),('varag','int',-4),
  ('windrazor','str',2),('windrazor','dex',4),('windrazor','int',-2),('windrazor','wis',2),('windrazor','cha',-4),
  ('windscythe','str',10),('windscythe','dex',2),('windscythe','con',4),('windscythe','int',-2),('windscythe','cha',-2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT 'mm4-race-'||d.race_slug,d.ability,d.modifier
FROM desired d
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm4-race-'||d.race_slug)
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH movement(race_slug,mode,feet,maneuverability,rules_text) AS (VALUES
  ('windrazor','climb',10,NULL,'Windrazor climb speed 10 ft.'),
  ('windrazor','fly',40,'good','Windrazor fly speed 40 ft. with good maneuverability.'),
  ('windscythe','climb',10,NULL,'Windscythe climb speed 10 ft.'),
  ('windscythe','fly',60,'average','Windscythe fly speed 60 ft. with average maneuverability.')
)
INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT 'mm4-race-'||m.race_slug,m.mode,m.feet,NULL,m.maneuverability,m.rules_text
FROM movement m
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm4-race-'||m.race_slug)
ON CONFLICT(race_id,mode) DO UPDATE SET feet=excluded.feet,maneuverability=excluded.maneuverability,rules_text=excluded.rules_text;
