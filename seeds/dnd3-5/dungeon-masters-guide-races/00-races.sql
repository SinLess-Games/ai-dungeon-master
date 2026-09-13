-- Dungeon Master's Guide v3.5 example player-race variants.
-- These are source-backed variants, not duplicate PHB rows. Gold Dwarf inherits
-- the normal dwarf chassis with the DMG substitutions; Half-Human Elf inherits
-- the normal half-elf chassis with the DMG substitutions.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
   'Wizards of the Coast','dnd','3.5',
   'D&D v.3.5 core Dungeon Master''s Guide.',NULL,1,0,NULL);

-- Remove only disabled shared placeholders for the two variants now materialized.
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN ('gold-dwarf','half-human-elf')
  AND id NOT IN ('dmg-race-gold-dwarf','dmg-race-half-human-elf');

WITH desired(
  slug,name,size,speed,favored_slug,subtype_slug,description,rules_text
) AS (VALUES
  ('gold-dwarf','Gold Dwarf','medium',20,'fighter','dwarf',
   'Dwarf subrace retaining the standard dwarf traits but trading Charisma loss and orc/goblinoid training for reduced Dexterity and aberration combat training.',
   'LA +0. Medium humanoid (dwarf); speed 20 ft. and not reduced by armor/load; +2 Constitution, -2 Dexterity; darkvision 60 ft.; stonecunning, weapon familiarity, stability, poison and magic saves, +1 attacks against aberrations, +4 dodge AC against giants, stone/metal Appraise and Craft bonuses; favored class Fighter.'),
  ('half-human-elf','Half-Human Elf','medium',30,'wizard','elf',
   'Half-elf raised in elven society, trading the half-elf social bonuses and flexible favored class for elven weapon training and Wizard as favored class.',
   'LA +0. Medium humanoid (elf); speed 30 ft.; sleep immunity; +2 saves against enchantments; low-light vision; +1 Listen/Search/Spot; elven blood; longsword, rapier, shortbow, and longbow proficiency; favored class Wizard; no half-elf Diplomacy/Gather Information racial bonus.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'dmg-race-'||d.slug,'dmg-3.5','171',d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT ct.id FROM dnd35_creature_types ct
    WHERE ct.slug='humanoid' AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c
    WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (
    SELECT 1 FROM dnd35_classes c
    WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL
  ) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,0,0,NULL,0,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r
  WHERE r.slug=d.slug
    AND r.owner_user_id IS NULL
    AND r.is_enabled=1
    AND r.id <> 'dmg-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page,
  name=excluded.name, description=excluded.description, rules_text=excluded.rules_text,
  is_homebrew=0, owner_user_id=NULL, is_enabled=1,
  creature_type_id=excluded.creature_type_id,
  favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,
  size=excluded.size, base_speed_feet=excluded.base_speed_feet,
  level_adjustment=0, racial_hit_dice=0, racial_hit_die=NULL,
  natural_armor=0, bonus_skill_points_per_level=0, bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities
WHERE race_id IN ('dmg-race-gold-dwarf','dmg-race-half-human-elf');

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('gold-dwarf','con',2),
  ('gold-dwarf','dex',-2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.id='dmg-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

WITH desired(race_slug,subtype_slug) AS (VALUES
  ('gold-dwarf','dwarf'),
  ('half-human-elf','elf')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.id='dmg-race-'||d.race_slug
JOIN dnd35_creature_subtypes s
  ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL;
