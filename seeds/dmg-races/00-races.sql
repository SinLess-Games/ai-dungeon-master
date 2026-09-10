-- Dungeon Master's Guide v3.5 Chapter 6 example player races.
INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for campaign, monster-PC, and variant character rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,favored_slug,description,rules_text) AS (VALUES
  ('gold-dwarf','Gold Dwarf','170-171','fighter',
   'Haughty, prosperous dwarf subrace from the Dungeon Master''s Guide example subrace rules.',
   'LA +0. Medium Humanoid (Dwarf); speed 20 ft.; +2 Constitution, -2 Dexterity. Uses the standard dwarf racial traits except the usual anti-orc/goblinoid attack bonus is replaced by +1 on attack rolls against aberrations.'),
  ('half-human-elf','Half-Human Elf','171','wizard',
   'Half-elf raised in elven society, trading social flexibility for elven martial training.',
   'LA +0. Medium Humanoid (Elf, Human); speed 30 ft. Uses standard half-elf racial traits except it loses the racial bonuses on Diplomacy and Gather Information, gains elven weapon proficiencies with longsword, rapier, shortbow, and longbow, and has Wizard as favored class.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'dmg-race-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug='humanoid' AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1),
  'specific',
  CASE WHEN d.slug='gold-dwarf' THEN 'medium' ELSE 'medium' END,
  CASE WHEN d.slug='gold-dwarf' THEN 20 ELSE 30 END,
  0,0,NULL,0,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r WHERE r.slug=d.slug AND r.owner_user_id IS NULL AND r.is_enabled=1
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, name=excluded.name,
  description=excluded.description, rules_text=excluded.rules_text, is_homebrew=0,
  owner_user_id=NULL, is_enabled=1, creature_type_id=excluded.creature_type_id,
  favored_class_id=excluded.favored_class_id, favored_class_rule=excluded.favored_class_rule,
  size=excluded.size, base_speed_feet=excluded.base_speed_feet, level_adjustment=0,
  racial_hit_dice=0, racial_hit_die=NULL, natural_armor=0,
  bonus_skill_points_per_level=0, bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities WHERE race_id='dmg-race-gold-dwarf';
INSERT INTO dnd35_race_abilities (race_id,ability,modifier,monster_average_score)
VALUES ('dmg-race-gold-dwarf','con',2,NULL),('dmg-race-gold-dwarf','dex',-2,NULL)
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier, monster_average_score=NULL;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('gold-dwarf','dwarf'),
  ('half-human-elf','elf'),('half-human-elf','human')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='dmg-race-'||d.race_slug
JOIN dnd35_creature_subtypes s ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;
