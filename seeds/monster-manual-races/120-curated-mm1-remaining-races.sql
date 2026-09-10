-- Remaining source-list Monster Manual v3.5 player races: Grimlock,
-- Tallfellow Halfling, Deep Halfling, and Rakshasa.

WITH desired(slug) AS (VALUES ('grimlock'),('tallfellow-halfling'),('deep-halfling'),('rakshasa'))
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (SELECT slug FROM desired)
  AND id NOT LIKE 'mm1-race-%';

WITH desired(
  slug,name,source_page,type_slug,size,speed,la,rhd,rhd_die,natural_armor,favored_slug,description,rules_text
) AS (VALUES
  ('grimlock','Grimlock','140-141','monstrous-humanoid','medium',30,2,2,8,4,'barbarian',
   'Eyeless subterranean monstrous humanoid that navigates by extraordinary hearing and scent.',
   'LA +2. Medium Monstrous Humanoid; 2d8 racial Hit Dice; speed 30 ft.; +4 Strength, +2 Dexterity, +2 Constitution, -2 Wisdom, -4 Charisma; +4 natural armor; blindsight 40 ft.; sight-based immunities; scent; battleaxe proficiency.'),
  ('tallfellow-halfling','Tallfellow Halfling','149-150','humanoid','small',20,0,0,NULL,0,'rogue',
   'Tall, elf-friendly halfling subrace with heightened perception and an instinct for concealed doors.',
   'LA +0. Small Humanoid (Halfling); speed 20 ft.; -2 Strength, +2 Dexterity. Uses lightfoot halfling traits except that it loses the lightfoot Climb, Jump, and Move Silently bonuses and replaces the lightfoot Listen bonus with +2 Search, Spot, and Listen plus passive concealed-door noticing.'),
  ('deep-halfling','Deep Halfling','150','humanoid','small',20,0,0,NULL,0,'rogue',
   'Stocky subterranean halfling subrace with darkvision, stonecunning, and craftsmanship talent.',
   'LA +0. Small Humanoid (Halfling); speed 20 ft.; -2 Strength, +2 Dexterity. Uses lightfoot halfling traits except it loses the lightfoot Climb, Jump, and Move Silently bonuses; gains darkvision 60 ft., dwarf-like stonecunning, and +2 Appraise/Craft checks related to stone or metal.'),
  ('rakshasa','Rakshasa','211-212','outsider','medium',40,7,7,8,9,'sorcerer',
   'Native outsider shapeshifter with telepathy-like mind reading, powerful defenses, and innate sorcerer spellcasting.',
   'LA +7. Medium Outsider (Native); 7d8 racial Hit Dice; speed 40 ft.; +2 Strength, +4 Dexterity, +6 Constitution, +2 Intelligence, +2 Wisdom, +6 Charisma; +9 natural armor; darkvision 60 ft.; detect thoughts; change shape; DR 15/good and piercing; SR 27 + class levels; casts as a 7th-level sorcerer.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'mm1-race-'||d.slug,'mm1-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (SELECT 1 FROM dnd35_classes c WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL AND r.is_enabled=1 AND r.id <> 'mm1-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, name=excluded.name,
  description=excluded.description, rules_text=excluded.rules_text, is_homebrew=0, owner_user_id=NULL,
  is_enabled=1, creature_type_id=excluded.creature_type_id, favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule, size=excluded.size, base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment, racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die, natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0, bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities
WHERE race_id IN ('mm1-race-grimlock','mm1-race-tallfellow-halfling','mm1-race-deep-halfling','mm1-race-rakshasa');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('grimlock','str',4),('grimlock','dex',2),('grimlock','con',2),('grimlock','wis',-2),('grimlock','cha',-4),
  ('tallfellow-halfling','str',-2),('tallfellow-halfling','dex',2),
  ('deep-halfling','str',-2),('deep-halfling','dex',2),
  ('rakshasa','str',2),('rakshasa','dex',4),('rakshasa','con',6),('rakshasa','int',2),('rakshasa','wis',2),('rakshasa','cha',6)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier,monster_average_score)
SELECT r.id,d.ability,d.modifier,NULL
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier, monster_average_score=NULL;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('tallfellow-halfling','halfling'),('deep-halfling','halfling'),('rakshasa','native')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='mm1-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;
