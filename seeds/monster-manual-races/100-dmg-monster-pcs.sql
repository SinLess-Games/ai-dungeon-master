-- Monster Manual v3.5 races explicitly listed by the DMG monster-PC guidance that were
-- not yet materialized by earlier race batches. Mechanical values are source-backed.

-- Humanoids share d8 HD / 2 skill points / 3/4 BAB, but their good save varies by race.
-- The character runtime carries source-specific save overrides for retained humanoid RHD.
UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=2, bab_progression='three_quarters',
    fort_progression='custom', ref_progression='custom', will_progression='custom'
WHERE slug='humanoid' AND owner_user_id IS NULL;

UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=2, bab_progression='three_quarters',
    fort_progression='poor', ref_progression='poor', will_progression='good'
WHERE slug='aberration' AND owner_user_id IS NULL;

WITH desired(
  slug,name,type_slug,size,speed,la,rhd,natural_armor,favored_class_id,source_page,description,rules_text
) AS (VALUES
  ('bugbear','Bugbear','humanoid','medium',30,1,3,3,'phb-class-rogue','29',
   'A powerful goblinoid hunter with strong stealth instincts.',
   'Monster Manual player race: 3d8 humanoid racial Hit Dice and level adjustment +1.'),
  ('gnoll','Gnoll','humanoid','medium',30,1,2,1,'phb-class-ranger','130-131',
   'A strong hyena-headed humanoid suited to hunting and martial roles.',
   'Monster Manual player race: 2d8 humanoid racial Hit Dice and level adjustment +1.'),
  ('lizardfolk','Lizardfolk','humanoid','medium',30,1,2,5,'phb-class-druid','169',
   'A hardy reptilian humanoid with natural armor, claws, bite, and strong swimming ability.',
   'Monster Manual player race: 2d8 humanoid racial Hit Dice and level adjustment +1.'),
  ('troglodyte','Troglodyte','humanoid','medium',30,2,2,6,'phb-class-cleric','247',
   'A subterranean reptilian humanoid with heavy natural armor, natural weapons, and a debilitating stench.',
   'Monster Manual player race: 2d8 humanoid racial Hit Dice and level adjustment +2.'),
  ('kuo-toa','Kuo-toa','monstrous-humanoid','medium',20,3,2,6,'phb-class-rogue','163-165',
   'An amphibious aquatic monstrous humanoid with keen sight, slippery skin, and unusual defenses.',
   'Monster Manual monster-PC option: 2d8 monstrous humanoid racial Hit Dice and level adjustment +3.'),
  ('drider','Drider','aberration','large',30,4,6,6,NULL,'89-90',
   'A Large spider-bodied aberration with innate magic, poison, spell resistance, and racial spellcasting.',
   'DMG monster-PC option: 6d8 aberration racial Hit Dice and level adjustment +4; racial spellcasting is recorded as a trait.'),
  ('yuan-ti-halfblood','Yuan-ti Halfblood','monstrous-humanoid','medium',30,5,7,4,'phb-class-ranger','264',
   'A serpent-blooded monstrous humanoid with venom, acid, innate magic, shapechanging, and camouflage.',
   'DMG monster-PC option: 7d8 monstrous humanoid racial Hit Dice and level adjustment +5.'),
  ('mind-flayer','Mind Flayer','aberration','medium',30,7,8,3,'phb-class-wizard','188-189',
   'A psionic aberration with telepathy, mind blast, tentacles, and formidable mental abilities.',
   'DMG monster-PC option: 8d8 aberration racial Hit Dice and level adjustment +7.'),
  ('yuan-ti-abomination','Yuan-ti Abomination','monstrous-humanoid','large',30,7,9,10,'phb-class-cleric','264-265',
   'A massive serpentine yuan-ti with constriction, venom, acid, innate magic, and strong defenses.',
   'Monster Manual player option: 9d8 monstrous humanoid racial Hit Dice and level adjustment +7.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  d.favored_class_id,
  CASE WHEN d.favored_class_id IS NULL THEN 'none' ELSE 'specific' END,
  d.size,d.speed,d.la,d.rhd,8,d.natural_armor,0,0
FROM desired d
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
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

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('bugbear','str',4),('bugbear','dex',2),('bugbear','con',2),('bugbear','cha',-2),
  ('gnoll','str',4),('gnoll','con',2),('gnoll','int',-2),('gnoll','cha',-2),
  ('lizardfolk','str',2),('lizardfolk','con',2),('lizardfolk','int',-2),
  ('troglodyte','dex',-2),('troglodyte','con',4),('troglodyte','int',-2),
  ('kuo-toa','str',2),('kuo-toa','con',2),('kuo-toa','int',2),('kuo-toa','wis',4),('kuo-toa','cha',-2),
  ('drider','str',4),('drider','dex',4),('drider','con',6),('drider','int',4),('drider','wis',6),('drider','cha',6),
  ('yuan-ti-halfblood','str',4),('yuan-ti-halfblood','dex',2),('yuan-ti-halfblood','con',2),('yuan-ti-halfblood','int',8),('yuan-ti-halfblood','wis',8),('yuan-ti-halfblood','cha',6),
  ('mind-flayer','str',2),('mind-flayer','dex',4),('mind-flayer','con',2),('mind-flayer','int',8),('mind-flayer','wis',6),('mind-flayer','cha',6),
  ('yuan-ti-abomination','str',8),('yuan-ti-abomination','dex',2),('yuan-ti-abomination','con',6),('yuan-ti-abomination','int',10),('yuan-ti-abomination','wis',10),('yuan-ti-abomination','cha',8)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
WHERE 1
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

-- Non-land movement modes.
WITH movement(race_slug,mode,feet,maneuverability,rules_text) AS (VALUES
  ('kuo-toa','swim',50,NULL,'Kuo-toa swim speed 50 ft.'),
  ('drider','climb',15,NULL,'Drider climb speed 15 ft.'),
  ('yuan-ti-abomination','climb',20,NULL,'Yuan-ti abomination climb speed 20 ft.'),
  ('yuan-ti-abomination','swim',20,NULL,'Yuan-ti abomination swim speed 20 ft.')
)
INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,m.mode,m.feet,NULL,m.maneuverability,m.rules_text
FROM movement m
JOIN dnd35_races r ON r.id='mm1-race-'||m.race_slug
WHERE 1
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  maneuverability=excluded.maneuverability,
  rules_text=excluded.rules_text;
