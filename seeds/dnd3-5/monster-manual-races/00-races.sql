-- Monster Manual v3.5 class-level playable races and subraces.
-- This pack starts with races that retain no racial Hit Dice, so they can use the
-- current character-creation runtime without race-specific racial-HD save overrides.
-- Existing enabled shared races always win; only disabled placeholders are removed.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('mm1-3.5','monster-manual-3-5','Monster Manual','MM',
   'Wizards of the Coast','dnd','3.5',
   'D&D v.3.5 Monster Manual playable races, subraces, and monster-as-character rules.',
   NULL,1,0,NULL);

WITH desired(slug,name) AS (VALUES
  ('deep-dwarf','Deep Dwarf'),
  ('duergar','Duergar'),
  ('mountain-dwarf','Mountain Dwarf'),
  ('aquatic-elf','Aquatic Elf'),
  ('drow','Drow'),
  ('gray-elf','Gray Elf'),
  ('wild-elf','Wild Elf'),
  ('wood-elf','Wood Elf'),
  ('forest-gnome','Forest Gnome'),
  ('goblin','Goblin'),
  ('hobgoblin','Hobgoblin'),
  ('kobold','Kobold'),
  ('orc','Orc'),
  ('githyanki','Githyanki'),
  ('githzerai','Githzerai')
)
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,size,speed,la,type_slug,favored_slug,favored_rule,description,rules_text
) AS (VALUES
  ('deep-dwarf','Deep Dwarf','92','medium',20,0,'humanoid','fighter','specific',
   'Deep-dwelling dwarf subrace with stronger resistance to poison and magic, longer darkvision, and light sensitivity.',
   'LA +0. Medium Humanoid (Dwarf); speed 20 ft. without armor/load reduction; +2 Constitution, -2 Charisma; darkvision 90 ft.; dwarf traits with +3 saves against poison and +3 saves against spells/spell-like effects; light sensitivity; favored class Fighter.'),
  ('duergar','Duergar','92','medium',20,1,'humanoid','fighter','specific',
   'Gray dwarf subrace with deep darkvision, innate magic, strong immunities, stealth bonuses, and light sensitivity.',
   'LA +1. Medium Humanoid (Dwarf); speed 20 ft. without armor/load reduction; +2 Constitution, -4 Charisma; darkvision 120 ft.; immunity to paralysis, phantasms, and poison; +2 saves against spells/spell-like effects; enlarge person and invisibility 1/day; light sensitivity; favored class Fighter.'),
  ('mountain-dwarf','Mountain Dwarf','93','medium',20,0,'humanoid','fighter','specific',
   'Mountain dwarf subrace using the standard dwarf racial mechanics.',
   'LA +0. Medium Humanoid (Dwarf); speed 20 ft. without armor/load reduction; +2 Constitution, -2 Charisma; darkvision 60 ft.; standard dwarf racial traits; favored class Fighter.'),
  ('aquatic-elf','Aquatic Elf','103','medium',30,0,'humanoid','fighter','specific',
   'Aquatic elf subrace with a swim speed, gills, and superior low-light vision.',
   'LA +0. Medium Humanoid (Elf, Aquatic); land speed 30 ft., swim 40 ft.; +2 Dexterity, -2 Intelligence; elf racial traits with gills and superior low-light vision; favored class Fighter.'),
  ('drow','Drow','103','medium',30,2,'humanoid',NULL,'choice',
   'Subterranean elf subrace with darkvision, spell resistance, innate magic, and light blindness.',
   'LA +2. Medium Humanoid (Elf); speed 30 ft.; +2 Dexterity, -2 Constitution, +2 Intelligence, +2 Charisma; darkvision 120 ft.; spell resistance 11 + class levels; +2 Will saves against spells/spell-like abilities; innate magic; light blindness; favored class Wizard for males or Cleric for females.'),
  ('gray-elf','Gray Elf','104','medium',30,0,'humanoid','wizard','specific',
   'Highly intellectual elf subrace retaining the high elf racial chassis.',
   'LA +0. Medium Humanoid (Elf); speed 30 ft.; -2 Strength, +2 Dexterity, -2 Constitution, +2 Intelligence; standard elf racial traits; favored class Wizard.'),
  ('wild-elf','Wild Elf','104','medium',30,0,'humanoid','sorcerer','specific',
   'Tribal elf subrace trading the high elf Constitution penalty for an Intelligence penalty and favoring sorcery.',
   'LA +0. Medium Humanoid (Elf); speed 30 ft.; +2 Dexterity, -2 Intelligence; standard elf racial traits; favored class Sorcerer.'),
  ('wood-elf','Wood Elf','104','medium',30,0,'humanoid','ranger','specific',
   'Strong forest elf subrace with the standard elf chassis and ranger tradition.',
   'LA +0. Medium Humanoid (Elf); speed 30 ft.; +2 Strength, +2 Dexterity, -2 Constitution, -2 Intelligence; standard elf racial traits; favored class Ranger.'),
  ('forest-gnome','Forest Gnome','132-133','small',20,0,'humanoid','bard','specific',
   'Elusive forest gnome with pass without trace, woodland camouflage, and broader combat training against hostile small humanoids.',
   'LA +0. Small Humanoid (Gnome); speed 20 ft.; -2 Strength, +2 Constitution; rock gnome racial traits with pass without trace, +1 attacks against kobolds/goblinoids/orcs/reptilian humanoids, and +4 Hide (+8 in woods); favored class Bard.'),
  ('goblin','Goblin','134','small',30,0,'humanoid','rogue','specific',
   'Small goblinoid with darkvision, unusual speed for its size, and strong stealth and riding aptitude.',
   'LA +0. Small Humanoid (Goblinoid); speed 30 ft.; -2 Strength, +2 Dexterity, -2 Charisma; darkvision 60 ft.; +4 Move Silently and Ride; favored class Rogue.'),
  ('hobgoblin','Hobgoblin','154','medium',30,1,'humanoid','fighter','specific',
   'Disciplined goblinoid with strong Dexterity and Constitution and stealth training.',
   'LA +1. Medium Humanoid (Goblinoid); speed 30 ft.; +2 Dexterity, +2 Constitution; darkvision 60 ft.; +4 Move Silently; favored class Fighter.'),
  ('kobold','Kobold','162','small',30,0,'humanoid','sorcerer','specific',
   'Small reptilian humanoid with darkvision, natural armor, mining and trapmaking aptitude, and light sensitivity.',
   'LA +0. Small Humanoid (Reptilian); speed 30 ft.; -4 Strength, +2 Dexterity, -2 Constitution; darkvision 60 ft.; +1 natural armor; +2 Craft (trapmaking), Profession (miner), and Search; light sensitivity; favored class Sorcerer.'),
  ('orc','Orc','204','medium',30,0,'humanoid','barbarian','specific',
   'Powerful humanoid with darkvision and light sensitivity.',
   'LA +0. Medium Humanoid (Orc); speed 30 ft.; +4 Strength, -2 Intelligence, -2 Wisdom, -2 Charisma; darkvision 60 ft.; light sensitivity; favored class Barbarian.'),
  ('githyanki','Githyanki','127-128','medium',30,2,'humanoid','fighter','specific',
   'Astral humanoid with darkvision, scaling innate psionics, spell resistance, and a martial tradition.',
   'LA +2. Medium Humanoid (Extraplanar); speed 30 ft.; +2 Dexterity, +2 Constitution, -2 Wisdom; darkvision 60 ft.; scaling psionics; spell resistance class levels + 5; favored class Fighter.'),
  ('githzerai','Githzerai','129-130','medium',30,2,'humanoid','monk','specific',
   'Limbo-dwelling humanoid with exceptional agility, inertial armor, innate psionics, and spell resistance.',
   'LA +2. Medium Humanoid (Extraplanar); speed 30 ft.; +6 Dexterity, -2 Intelligence, +2 Wisdom; darkvision 60 ft.; psionics; inertial armor +4; spell resistance class levels + 5; favored class Monk.')
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
    WHEN d.favored_rule='choice' THEN 'choice'
    WHEN d.favored_slug IS NOT NULL AND EXISTS (
      SELECT 1 FROM dnd35_classes c
      WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL
    ) THEN 'specific'
    ELSE 'none'
  END,
  d.size,d.speed,d.la,0,NULL,
  CASE WHEN d.slug='kobold' THEN 1 ELSE 0 END,
  0,0
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
  racial_hit_dice=0,
  racial_hit_die=NULL,
  natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0,
  bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities
WHERE race_id IN (
  'mm1-race-deep-dwarf','mm1-race-duergar','mm1-race-mountain-dwarf',
  'mm1-race-aquatic-elf','mm1-race-drow','mm1-race-gray-elf',
  'mm1-race-wild-elf','mm1-race-wood-elf','mm1-race-forest-gnome',
  'mm1-race-goblin','mm1-race-hobgoblin','mm1-race-kobold','mm1-race-orc',
  'mm1-race-githyanki','mm1-race-githzerai'
);

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('deep-dwarf','con',2),('deep-dwarf','cha',-2),
  ('duergar','con',2),('duergar','cha',-4),
  ('mountain-dwarf','con',2),('mountain-dwarf','cha',-2),
  ('aquatic-elf','dex',2),('aquatic-elf','int',-2),
  ('drow','dex',2),('drow','con',-2),('drow','int',2),('drow','cha',2),
  ('gray-elf','str',-2),('gray-elf','dex',2),('gray-elf','con',-2),('gray-elf','int',2),
  ('wild-elf','dex',2),('wild-elf','int',-2),
  ('wood-elf','str',2),('wood-elf','dex',2),('wood-elf','con',-2),('wood-elf','int',-2),
  ('forest-gnome','str',-2),('forest-gnome','con',2),
  ('goblin','str',-2),('goblin','dex',2),('goblin','cha',-2),
  ('hobgoblin','dex',2),('hobgoblin','con',2),
  ('kobold','str',-4),('kobold','dex',2),('kobold','con',-2),
  ('orc','str',4),('orc','int',-2),('orc','wis',-2),('orc','cha',-2),
  ('githyanki','dex',2),('githyanki','con',2),('githyanki','wis',-2),
  ('githzerai','dex',6),('githzerai','int',-2),('githzerai','wis',2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

-- Reuse existing shared subtype identities by slug.
WITH desired(race_slug,subtype_slug) AS (VALUES
  ('deep-dwarf','dwarf'),
  ('duergar','dwarf'),
  ('mountain-dwarf','dwarf'),
  ('aquatic-elf','elf'),('aquatic-elf','aquatic'),
  ('drow','elf'),
  ('gray-elf','elf'),
  ('wild-elf','elf'),
  ('wood-elf','elf'),
  ('forest-gnome','gnome'),
  ('goblin','goblinoid'),
  ('hobgoblin','goblinoid'),
  ('kobold','reptilian'),
  ('orc','orc'),
  ('githyanki','extraplanar'),
  ('githzerai','extraplanar')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s
  ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;

-- Aquatic elf swim speed.
INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'swim',40,NULL,NULL,'Swim speed 40 ft.'
FROM dnd35_races r
WHERE r.id='mm1-race-aquatic-elf'
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  base_speed_multiplier=NULL,
  maneuverability=NULL,
  rules_text=excluded.rules_text;
