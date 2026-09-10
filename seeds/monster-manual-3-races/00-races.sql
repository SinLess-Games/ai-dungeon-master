-- Curated playable races from Monster Manual III, aligned to the by-book race index.
-- Mechanical values are paraphrased from each creature's "As Characters" block.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('mm3-3.5','monster-manual-iii-3-5','Monster Manual III','MM3',
   'Wizards of the Coast','dnd','3.5',
   'D&D 3.5 Monster Manual III sourcebook, including player-character racial packages.',
   NULL,1,0,NULL);

-- Ensure MM3 subtype identities used by playable races exist without duplicating shared identities.
WITH desired(slug,name) AS (VALUES
  ('shapechanger','Shapechanger'),
  ('reptilian','Reptilian'),
  ('living-construct','Living Construct'),
  ('earth','Earth'),
  ('fire','Fire')
)
INSERT INTO dnd35_creature_subtypes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT 'mm3-subtype-'||d.slug,'mm3-3.5',NULL,d.slug,d.name,
       'Creature subtype used by a Monster Manual III playable race.',
       'Source-backed subtype identity used by playable race data.',0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_subtypes s WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);

-- Remove only disabled catalog placeholders so the verified MM3 rows can own their canonical slugs.
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL AND is_enabled=0 AND slug IN (
  'armand','changeling','dracotaur','sand-giant','flind','goatfolk','forestkith-goblin','harssaf','kenku',
  'blackscale-lizardfolk','poison-dusk-lizardfolk','lumi','nycter','skullcrusher-ogre','quaraphon',
  'naztharune-rakshasa','shifter','crystalline-troll','warforged-charger','warforged-scout','witchknife'
);

WITH desired(
  slug,name,type_slug,size,speed,la,rhd,rhd_die,natural_armor,favored_class_slug,source_page,description,rules_text
) AS (VALUES
  ('armand','Armand','monstrous-humanoid','small',20,3,5,8,0,'monk','10-11',
   'Small desert-dwelling monstrous humanoid with plated skin, a burrowing gait, and exceptional defensive stability.',
   'LA +3; 5d8 monstrous humanoid racial Hit Dice; +6 Dexterity, +6 Constitution; speed 20 ft.; burrow 10 ft.; darkvision 60 ft.; defensive stance and stability.'),
  ('changeling','Changeling','humanoid','medium',30,0,0,NULL,0,'rogue','24-25',
   'Subtle humanoid shapechanger able to make minor physical alterations at will.',
   'LA +0; Medium humanoid (shapechanger); speed 30 ft.; minor change shape; social skill bonuses; sleep/charm resistance.'),
  ('dracotaur','Dracotaur','dragon','large',50,5,3,12,5,'sorcerer','42-43',
   'Large four-legged dragon-blooded player race with fire-spitting capability and strong physical ability scores.',
   'LA +5; 3d12 dragon racial Hit Dice; +8 Str, +2 Dex, +4 Con, +2 Int, +2 Cha; speed 50 ft.; natural armor +5; spit fire.'),
  ('sand-giant','Sand Giant','giant','large',40,4,15,8,11,'fighter','58-59',
   'Disciplined desert giant with burrowing movement, heat shimmer, fire affinity, and sand-blaster familiarity.',
   'LA +4; 15d8 giant racial Hit Dice; +16 Str, +10 Dex, +10 Con, +6 Wis, +2 Cha; speed 40 ft.; burrow 10 ft.; natural armor +11.'),
  ('flind','Flind','humanoid','medium',30,2,2,8,2,'ranger','62-63',
   'Powerful gnoll relative and tactical hunter with flindbar familiarity.',
   'LA +2; 2d8 humanoid racial Hit Dice; +6 Str, +2 Dex, +4 Con; speed 30 ft.; darkvision 60 ft.; natural armor +2.'),
  ('goatfolk','Goatfolk (Ibixian)','monstrous-humanoid','medium',30,1,3,8,2,'barbarian','63-64',
   'Goatlike monstrous humanoid whose pack fervor strengthens nearby ibixians.',
   'LA +1; 3d8 monstrous humanoid racial Hit Dice; +4 Str, +2 Con, -2 Int, -2 Wis; natural armor +2; pack fervor.'),
  ('forestkith-goblin','Forestkith Goblin','humanoid','small',30,1,0,NULL,1,'barbarian','64-65',
   'Arboreal goblinoid with strong climbing and camouflage talents, tree shape, and discordant frenzy.',
   'LA +1; Small humanoid (goblinoid); +2 Dex, -2 Int; speed 30 ft.; climb 20 ft.; natural armor +1; darkvision 60 ft.'),
  ('harssaf','Harssaf','monstrous-humanoid','medium',30,4,6,8,3,'monk','82-83',
   'Desert-born monstrous humanoid that can burrow through sand, radiate flame, and assume a mobile sand form.',
   'LA +4; 6d8 monstrous humanoid racial Hit Dice; +4 Str, +6 Dex, +6 Con, +2 Cha; burrow 10 ft.; natural armor +3.'),
  ('kenku','Kenku','humanoid','medium',30,0,0,NULL,0,'rogue','86-87',
   'Urban avian humanoid known for mimicry, stealth, and exceptional teamwork.',
   'LA +0; Medium humanoid; +2 Dex, -2 Str; speed 30 ft.; Great Ally, Mimicry, +2 Hide and Move Silently.'),
  ('blackscale-lizardfolk','Blackscale Lizardfolk','monstrous-humanoid','large',40,3,4,8,7,'barbarian','95',
   'Large reptilian lizardfolk with heavy natural armor, acid resistance, and powerful natural attacks.',
   'LA +3; 4d8 monstrous humanoid racial Hit Dice; source-stat/DMG-derived +8 Str, +4 Con, -2 Int, -4 Cha; natural armor +7; acid resistance 5.'),
  ('poison-dusk-lizardfolk','Poison Dusk Lizardfolk','humanoid','small',30,1,0,NULL,3,'ranger','96',
   'Small reptilian humanoid with chameleon skin, poison use, and strong aquatic balance.',
   'LA +1; Small humanoid (reptilian); +2 Dex, +2 Con, -2 Cha; speed 30 ft.; natural armor +3; poison use; chameleon skin.'),
  ('lumi','Lumi','outsider','medium',30,2,2,8,0,'cleric','98-99',
   'Positive-energy outsider with a floating head, radiant body, clear vision, and innate spell-like powers.',
   'LA +2; 2d8 outsider racial Hit Dice; +2 Str, -2 Dex, +4 Con, +4 Wis; speed 30 ft.; darkvision 60 ft.'),
  ('nycter','Nycter','monstrous-humanoid','small',20,2,3,8,3,'druid','112-113',
   'Small batlike monstrous humanoid with echolocation, flight, and a paralyzing sonic hunting cry.',
   'LA +2; 3d8 monstrous humanoid racial Hit Dice; -2 Str, +4 Dex, +2 Wis, -2 Cha; fly 40 ft. (good); blindsense 60 ft.; natural armor +3.'),
  ('skullcrusher-ogre','Skullcrusher Ogre','giant','large',40,3,8,8,2,'fighter','116-117',
   'Militarized ogre bred for disciplined warfare, rock throwing, armor use, and close combat.',
   'LA +3; 8d8 giant racial Hit Dice; +14 Str, +6 Con, -2 Cha; speed 40 ft.; natural armor +2; rock throwing.'),
  ('quaraphon','Quaraphon','aberration','large',40,5,9,8,7,'barbarian','128-129',
   'Large aberrant herd-hunter with powerful constitution and a deafening bellow.',
   'LA +5; 9d8 aberration racial Hit Dice; +10 Str, +12 Con, -4 Int, -4 Wis; natural armor +7; darkvision 60 ft.'),
  ('naztharune-rakshasa','Naztharune Rakshasa','outsider','medium',40,5,11,8,5,'rogue','136-137',
   'Stealth-specialized rakshasa with shadow movement, shapechanging, detect thoughts, and rogue-like defenses.',
   'LA +5; 11d8 outsider racial Hit Dice; +4 Str, +10 Dex, +8 Con, +4 Int, +4 Cha; speed 40 ft.; natural armor +5.'),
  ('shifter','Shifter','humanoid','medium',30,0,0,NULL,0,'ranger','150-151',
   'Weretouched humanoid able to manifest one of six bestial traits for short bursts of power.',
   'LA +0; Medium humanoid (shapechanger); +2 Dex, -2 Int, -2 Cha; speed 30 ft.; low-light vision; shifting 1/day.'),
  ('crystalline-troll','Crystalline Troll','giant','large',30,5,10,8,7,'fighter','178',
   'Acid-immune crystalline troll whose regeneration is overcome by sonic damage.',
   'LA +5; 10d8 giant racial Hit Dice; +12 Str, +4 Dex, +12 Con, -4 Int, -2 Wis, -2 Cha; natural armor +7; regeneration 5.'),
  ('warforged-charger','Warforged Charger','construct','large',20,4,4,10,0,'fighter','191-193',
   'Large living construct built to break defenses with adamantine fists and heavy plating.',
   'LA +4; 4d10 construct racial Hit Dice; +10 Str, +10 Con, -6 Int, -4 Wis, -8 Cha; effective speed 20 ft. with Adamantine Body; living construct.'),
  ('warforged-scout','Warforged Scout','construct','small',20,0,0,NULL,0,'rogue','193',
   'Small living construct designed for reconnaissance, with composite plating and light fortification.',
   'LA +0; Small construct (living construct); -2 Str, +2 Dex, -2 Wis, -2 Cha; speed 20 ft.; composite plating; light fortification.'),
  ('witchknife','Witchknife','monstrous-humanoid','medium',30,3,9,8,1,'rogue','194-195',
   'Psionically gifted monstrous humanoid that combines command effects with rogue-like sneak attacks.',
   'LA +3; 9d8 monstrous humanoid racial Hit Dice; +6 Dex, -2 Con, +2 Int, +4 Wis, +6 Cha; natural armor +1; sneak attack +2d6.' )
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm3-race-'||d.slug,'mm3-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c WHERE c.slug=d.favored_class_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.slug=d.favored_class_slug AND c.owner_user_id IS NULL) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r WHERE r.slug=d.slug AND r.owner_user_id IS NULL AND r.is_enabled=1 AND r.id<>'mm3-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,source_page=excluded.source_page,name=excluded.name,
  description=excluded.description,rules_text=excluded.rules_text,is_homebrew=0,owner_user_id=NULL,is_enabled=1,
  creature_type_id=excluded.creature_type_id,favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,size=excluded.size,base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die,natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0,bonus_feats_at_first_level=0;

WITH mods(race_slug,ability,modifier) AS (VALUES
  ('armand','dex',6),('armand','con',6),
  ('dracotaur','str',8),('dracotaur','dex',2),('dracotaur','con',4),('dracotaur','int',2),('dracotaur','cha',2),
  ('sand-giant','str',16),('sand-giant','dex',10),('sand-giant','con',10),('sand-giant','wis',6),('sand-giant','cha',2),
  ('flind','str',6),('flind','dex',2),('flind','con',4),
  ('goatfolk','str',4),('goatfolk','con',2),('goatfolk','int',-2),('goatfolk','wis',-2),
  ('forestkith-goblin','dex',2),('forestkith-goblin','int',-2),
  ('harssaf','str',4),('harssaf','dex',6),('harssaf','con',6),('harssaf','cha',2),
  ('kenku','str',-2),('kenku','dex',2),
  ('blackscale-lizardfolk','str',8),('blackscale-lizardfolk','con',4),('blackscale-lizardfolk','int',-2),('blackscale-lizardfolk','cha',-4),
  ('poison-dusk-lizardfolk','dex',2),('poison-dusk-lizardfolk','con',2),('poison-dusk-lizardfolk','cha',-2),
  ('lumi','str',2),('lumi','dex',-2),('lumi','con',4),('lumi','wis',4),
  ('nycter','str',-2),('nycter','dex',4),('nycter','wis',2),('nycter','cha',-2),
  ('skullcrusher-ogre','str',14),('skullcrusher-ogre','con',6),('skullcrusher-ogre','cha',-2),
  ('quaraphon','str',10),('quaraphon','con',12),('quaraphon','int',-4),('quaraphon','wis',-4),
  ('naztharune-rakshasa','str',4),('naztharune-rakshasa','dex',10),('naztharune-rakshasa','con',8),('naztharune-rakshasa','int',4),('naztharune-rakshasa','cha',4),
  ('shifter','dex',2),('shifter','int',-2),('shifter','cha',-2),
  ('crystalline-troll','str',12),('crystalline-troll','dex',4),('crystalline-troll','con',12),('crystalline-troll','int',-4),('crystalline-troll','wis',-2),('crystalline-troll','cha',-2),
  ('warforged-charger','str',10),('warforged-charger','con',10),('warforged-charger','int',-6),('warforged-charger','wis',-4),('warforged-charger','cha',-8),
  ('warforged-scout','str',-2),('warforged-scout','dex',2),('warforged-scout','wis',-2),('warforged-scout','cha',-2),
  ('witchknife','dex',6),('witchknife','con',-2),('witchknife','int',2),('witchknife','wis',4),('witchknife','cha',6)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,m.ability,m.modifier
FROM mods m
JOIN dnd35_races r ON r.slug=m.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
WHERE 1
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH movement(race_slug,mode,feet,maneuverability,rules_text) AS (VALUES
  ('armand','burrow',10,NULL,'Burrow speed 10 ft.'),
  ('sand-giant','burrow',10,NULL,'Burrow speed 10 ft.'),
  ('forestkith-goblin','climb',20,NULL,'Climb speed 20 ft.'),
  ('harssaf','burrow',10,NULL,'Burrow speed 10 ft.'),
  ('nycter','fly',40,'good','Fly speed 40 ft. with good maneuverability')
)
INSERT INTO dnd35_race_movements (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,m.mode,m.feet,NULL,m.maneuverability,m.rules_text
FROM movement m
JOIN dnd35_races r ON r.slug=m.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
WHERE 1
ON CONFLICT(race_id,mode) DO UPDATE SET feet=excluded.feet,maneuverability=excluded.maneuverability,rules_text=excluded.rules_text;

WITH subtype_map(race_slug,subtype_slug) AS (VALUES
  ('changeling','shapechanger'),('shifter','shapechanger'),
  ('blackscale-lizardfolk','reptilian'),('poison-dusk-lizardfolk','reptilian'),
  ('warforged-charger','living-construct'),('warforged-scout','living-construct'),
  ('sand-giant','earth'),('sand-giant','fire')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM subtype_map m
JOIN dnd35_races r ON r.slug=m.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_creature_subtypes s ON s.slug=m.subtype_slug AND s.owner_user_id IS NULL;
