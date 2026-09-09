-- D&D 3.5 SRD monster-as-character options used by the advanced creator.
-- Mechanical summaries are concise paraphrases of Open Game Content from the SRD.
-- Source: https://www.d20srd.org/srd/monstersAsRaces.htm and linked monster entries.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('srd-monster-races-3.5','srd-monster-races-3-5','D&D 3.5 SRD Monster Races','SRD','Wizards of the Coast','dnd','3.5',
   'Open Game Content monster-as-character rules and playable monster statistics for D&D 3.5.',
   'https://www.d20srd.org/srd/monstersAsRaces.htm',1,0,NULL);

-- Creature-type chassis are needed to apply racial HD to skills, BAB, and saves.
UPDATE dnd35_creature_types
SET hit_die=6, skill_points_per_hit_die=6, bab_progression='half',
    fort_progression='poor', ref_progression='good', will_progression='good'
WHERE slug='fey' AND owner_user_id IS NULL;

UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=2, bab_progression='three_quarters',
    fort_progression='good', ref_progression='poor', will_progression='poor'
WHERE slug='giant' AND owner_user_id IS NULL;

UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=2, bab_progression='full',
    fort_progression='poor', ref_progression='good', will_progression='good'
WHERE slug='monstrous-humanoid' AND owner_user_id IS NULL;

UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=8, bab_progression='full',
    fort_progression='good', ref_progression='good', will_progression='good'
WHERE slug='outsider' AND owner_user_id IS NULL;

-- One source-backed player option at each level adjustment from +1 through +8.
-- Creatures with 1 racial HD or less replace that racial HD with their first class level,
-- so retained racial_hit_dice is zero for Aasimar, Svirfneblin, and the Pixie variant.
WITH desired(
  slug,name,type_slug,size,speed,la,rhd,rhd_die,natural_armor,favored_class_id,description,rules_text
) AS (VALUES
  ('aasimar','Aasimar','outsider','medium',30,1,0,NULL,0,'phb-class-paladin',
   'Planetouched descendant with celestial heritage and heightened perception.',
   'SRD monster PC: +1 level adjustment; no retained racial Hit Dice; darkvision, minor energy resistances, and a daily daylight ability.'),
  ('minotaur','Minotaur','monstrous-humanoid','large',30,2,6,8,5,'phb-class-barbarian',
   'Powerful labyrinth-dwelling monstrous humanoid built for close combat.',
   'SRD monster PC: +2 level adjustment and 6d8 racial Hit Dice; natural armor, scent, natural cunning, gore, and a powerful charge.'),
  ('svirfneblin','Svirfneblin','humanoid','small',20,3,0,NULL,0,'phb-class-rogue',
   'Deep gnome adapted to subterranean life, stealth, and resisting hostile magic.',
   'SRD subrace: +3 level adjustment; no retained racial Hit Dice; deep darkvision, spell resistance, defensive bonuses, and innate magic.'),
  ('doppelganger','Doppelganger','monstrous-humanoid','medium',30,4,4,8,4,'phb-class-rogue',
   'Shapechanging infiltrator with strong perception and social deception abilities.',
   'SRD monster PC: +4 level adjustment and 4d8 racial Hit Dice; natural armor, detect thoughts, and change shape.'),
  ('hound-archon','Hound Archon','outsider','medium',40,5,6,8,9,'phb-class-ranger',
   'Lawful-good celestial hunter with archon defenses, scent, and canine shapechanging.',
   'SRD monster PC: +5 level adjustment and 6d8 outsider Hit Dice; substantial natural armor plus archon traits and spell-like abilities.'),
  ('pixie-irresistible-dance','Pixie (Irresistible Dance)','fey','small',20,6,0,NULL,1,'phb-class-sorcerer',
   'Rare pixie variant with the irresistible-dance spell-like ability.',
   'SRD Pixie variant: +6 level adjustment. Its normal 1 fey HD is exchanged for the first class level; fly speed, greater invisibility, and innate magic remain racial traits.'),
  ('ogre-mage','Ogre Mage','giant','large',40,7,5,8,5,'phb-class-sorcerer',
   'Large magical giant with flight, regeneration, shapechanging, and innate spell-like abilities.',
   'SRD monster PC: +7 level adjustment and 5d8 giant Hit Dice; natural armor, flight, regeneration, and spell resistance.'),
  ('trumpet-archon','Trumpet Archon','outsider','medium',40,8,12,8,14,NULL,
   'Powerful lawful-good celestial herald with archon traits, divine magic, and a supernatural trumpet.',
   'SRD monster PC option: +8 level adjustment and 12d8 outsider Hit Dice; high natural armor, flight, archon traits, divine spellcasting, and trumpet abilities.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'srd-race-'||d.slug,'srd-monster-races-3.5','SRD',d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  d.favored_class_id,
  CASE WHEN d.favored_class_id IS NULL THEN 'none' ELSE 'specific' END,
  d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,
  CASE WHEN d.rhd > 1 THEN 1 + CAST((d.rhd + 1) / 3 AS INTEGER) ELSE 0 END
FROM desired d
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, name=excluded.name,
  description=excluded.description, rules_text=excluded.rules_text, is_enabled=1,
  creature_type_id=excluded.creature_type_id, favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule, size=excluded.size,
  base_speed_feet=excluded.base_speed_feet, level_adjustment=excluded.level_adjustment,
  racial_hit_dice=excluded.racial_hit_dice, racial_hit_die=excluded.racial_hit_die,
  natural_armor=excluded.natural_armor,
  bonus_feats_at_first_level=excluded.bonus_feats_at_first_level;

-- Retained racial Hit Dice grant general feat slots by total Hit Dice. The creator stores
-- these as race-granted feat selections so monster PCs can choose all feats earned before play.

-- Racial ability adjustments. Trumpet Archon modifiers use the SRD monster-PC
-- conversion rule (subtract 10 from even scores or 11 from odd scores).
WITH desired(race_slug,ability,modifier) AS (VALUES
  ('aasimar','wis',2),('aasimar','cha',2),
  ('minotaur','str',8),('minotaur','con',4),('minotaur','int',-4),('minotaur','cha',-2),
  ('svirfneblin','str',-2),('svirfneblin','dex',2),('svirfneblin','wis',2),('svirfneblin','cha',-4),
  ('doppelganger','str',2),('doppelganger','dex',2),('doppelganger','con',2),('doppelganger','int',2),('doppelganger','wis',4),('doppelganger','cha',2),
  ('hound-archon','str',4),('hound-archon','con',2),('hound-archon','wis',2),('hound-archon','cha',2),
  ('pixie-irresistible-dance','str',-4),('pixie-irresistible-dance','dex',8),('pixie-irresistible-dance','int',6),('pixie-irresistible-dance','wis',4),('pixie-irresistible-dance','cha',6),
  ('ogre-mage','str',10),('ogre-mage','con',6),('ogre-mage','int',4),('ogre-mage','wis',4),('ogre-mage','cha',6),
  ('trumpet-archon','str',10),('trumpet-archon','dex',6),('trumpet-archon','con',12),('trumpet-archon','int',6),('trumpet-archon','wis',6),('trumpet-archon','cha',6)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.source_id='srd-monster-races-3.5'
WHERE 1
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

-- Additional movement modes represented by the SRD race entries.
INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',60,NULL,'good','SRD Pixie fly speed.'
FROM dnd35_races r WHERE r.slug='pixie-irresistible-dance' AND r.source_id='srd-monster-races-3.5'
ON CONFLICT(race_id,mode) DO UPDATE SET feet=excluded.feet, maneuverability=excluded.maneuverability, rules_text=excluded.rules_text;

INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',40,NULL,'good','SRD Ogre Mage supernatural fly speed.'
FROM dnd35_races r WHERE r.slug='ogre-mage' AND r.source_id='srd-monster-races-3.5'
ON CONFLICT(race_id,mode) DO UPDATE SET feet=excluded.feet, maneuverability=excluded.maneuverability, rules_text=excluded.rules_text;

INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',90,NULL,'good','SRD Trumpet Archon fly speed.'
FROM dnd35_races r WHERE r.slug='trumpet-archon' AND r.source_id='srd-monster-races-3.5'
ON CONFLICT(race_id,mode) DO UPDATE SET feet=excluded.feet, maneuverability=excluded.maneuverability, rules_text=excluded.rules_text;

-- Automatic and bonus language access.
WITH automatic(race_slug,language_slug) AS (VALUES
  ('aasimar','common'),('aasimar','celestial'),
  ('minotaur','common'),('minotaur','giant'),
  ('svirfneblin','undercommon'),('svirfneblin','gnome'),('svirfneblin','common'),
  ('doppelganger','common'),
  ('hound-archon','celestial'),
  ('pixie-irresistible-dance','common'),('pixie-irresistible-dance','sylvan'),
  ('ogre-mage','common'),('ogre-mage','giant'),
  ('trumpet-archon','celestial'),('trumpet-archon','infernal'),('trumpet-archon','draconic')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'automatic'
FROM automatic d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.source_id='srd-monster-races-3.5'
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;

WITH bonus(race_slug,language_slug) AS (VALUES
  ('aasimar','draconic'),('aasimar','dwarven'),('aasimar','elven'),('aasimar','gnome'),('aasimar','halfling'),('aasimar','sylvan'),
  ('minotaur','orc'),('minotaur','goblin'),('minotaur','terran'),
  ('svirfneblin','dwarven'),('svirfneblin','elven'),('svirfneblin','giant'),('svirfneblin','goblin'),('svirfneblin','orc'),('svirfneblin','terran'),
  ('doppelganger','auran'),('doppelganger','dwarven'),('doppelganger','elven'),('doppelganger','gnome'),('doppelganger','halfling'),('doppelganger','giant'),('doppelganger','terran'),
  ('hound-archon','common'),('hound-archon','draconic'),('hound-archon','infernal'),
  ('pixie-irresistible-dance','elven'),('pixie-irresistible-dance','gnome'),('pixie-irresistible-dance','halfling'),
  ('ogre-mage','dwarven'),('ogre-mage','goblin'),('ogre-mage','infernal'),('ogre-mage','orc')
)
INSERT INTO dnd35_race_languages (race_id,language_id,kind)
SELECT r.id,l.id,'bonus'
FROM bonus d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.source_id='srd-monster-races-3.5'
JOIN dnd35_languages l ON l.slug=d.language_slug AND l.owner_user_id IS NULL
WHERE 1
ON CONFLICT(race_id,language_id) DO UPDATE SET kind=excluded.kind;
