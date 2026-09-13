-- Monster Manual v3.5 retained-racial-HD races whose creature-type progressions
-- are already modeled by the character creator (outsider, fey, and giant).

WITH desired(slug) AS (VALUES ('azer'),('satyr'),('ogre'),('hill-giant'),('stone-giant'),('troll'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  favored_slug,description,rules_text
) AS (VALUES
  ('azer','Azer','21-22','outsider','medium',30,4,2,8,6,'fighter',
   'Fire-native outsider with a superheated body, heavy natural armor, fire immunity, and spell resistance.',
   'LA +4. Medium Outsider (Extraplanar, Fire); 2d8 racial Hit Dice; speed 30 ft.; +2 Strength, +2 Dexterity, +2 Constitution, +2 Intelligence, +2 Wisdom, -2 Charisma; darkvision 60 ft.; +6 natural armor; Heat; immunity to fire; SR 13 + class levels; vulnerability to cold; favored class Fighter.'),
  ('satyr','Satyr','219-220','fey','medium',40,2,5,6,4,'bard',
   'Woodland fey with keen senses, cold-iron defenses, a natural head butt, and magical pan pipes.',
   'LA +2. Medium Fey; 5d6 racial Hit Dice; speed 40 ft.; +2 Dexterity, +2 Constitution, +2 Intelligence, +2 Wisdom, +2 Charisma; low-light vision; +4 natural armor; DR 5/cold iron; magical pipes; favored class Bard.'),
  ('ogre','Ogre','198-200','giant','large',40,2,4,8,5,'barbarian',
   'Large giant with exceptional physical strength, thick natural armor, and straightforward martial aptitude.',
   'LA +2. Large Giant; 4d8 racial Hit Dice; speed 40 ft.; +10 Strength, -2 Dexterity, +4 Constitution, -4 Intelligence, -4 Charisma; darkvision 60 ft.; low-light vision; +5 natural armor; favored class Barbarian.'),
  ('hill-giant','Hill Giant','123-124','giant','large',40,4,12,8,9,'barbarian',
   'Massive giant able to throw and catch boulders, backed by tremendous Strength and durability.',
   'LA +4. Large Giant; 12d8 racial Hit Dice; speed 40 ft.; +14 Strength, -2 Dexterity, +8 Constitution, -4 Intelligence, -4 Charisma; low-light vision; +9 natural armor; rock throwing and rock catching; favored class Barbarian.'),
  ('stone-giant','Stone Giant','124-125','giant','large',40,4,14,8,11,'barbarian',
   'Powerful earth giant with exceptional natural armor, rocky camouflage, darkvision, and superior rock throwing.',
   'LA +4. Large Giant (Earth); 14d8 racial Hit Dice; speed 40 ft.; +16 Strength, +4 Dexterity, +8 Constitution, +2 Wisdom; darkvision 60 ft.; low-light vision; +11 natural armor; rock throwing and rock catching; favored class Barbarian.'),
  ('troll','Troll','247-248','giant','large',30,5,6,8,5,'fighter',
   'Regenerating giant with claws, bite, scent, and a devastating rend attack.',
   'LA +5. Large Giant; 6d8 racial Hit Dice; speed 30 ft.; +12 Strength, +4 Dexterity, +12 Constitution, -4 Intelligence, -2 Wisdom, -4 Charisma; darkvision; low-light vision; +5 natural armor; rend; regeneration 5; scent; favored class Fighter.')
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
WHERE race_id IN (
  'mm1-race-azer','mm1-race-satyr','mm1-race-ogre',
  'mm1-race-hill-giant','mm1-race-stone-giant','mm1-race-troll'
);

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('azer','str',2),('azer','dex',2),('azer','con',2),('azer','int',2),('azer','wis',2),('azer','cha',-2),
  ('satyr','dex',2),('satyr','con',2),('satyr','int',2),('satyr','wis',2),('satyr','cha',2),
  ('ogre','str',10),('ogre','dex',-2),('ogre','con',4),('ogre','int',-4),('ogre','cha',-4),
  ('hill-giant','str',14),('hill-giant','dex',-2),('hill-giant','con',8),('hill-giant','int',-4),('hill-giant','cha',-4),
  ('stone-giant','str',16),('stone-giant','dex',4),('stone-giant','con',8),('stone-giant','wis',2),
  ('troll','str',12),('troll','dex',4),('troll','con',12),('troll','int',-4),('troll','wis',-2),('troll','cha',-4)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('azer','fire'),('azer','extraplanar'),
  ('stone-giant','earth')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;
