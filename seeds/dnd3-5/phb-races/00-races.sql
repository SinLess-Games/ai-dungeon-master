-- Player's Handbook v3.5 Chapter 2 core player races.
INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player-facing character, skill, combat, adventuring, and spellcasting rules.',NULL,1,0,NULL);

WITH desired(slug,name,size,speed,favored_slug,favored_rule,bonus_skill_points,bonus_feats) AS (VALUES
  ('human','Human','medium',30,NULL,'highest',1,1),
  ('dwarf','Dwarf','medium',20,'fighter','specific',0,0),
  ('elf','Elf','medium',30,'wizard','specific',0,0),
  ('gnome','Gnome','small',20,'bard','specific',0,0),
  ('half-elf','Half-Elf','medium',30,NULL,'highest',0,0),
  ('half-orc','Half-Orc','medium',30,'barbarian','specific',0,0),
  ('halfling','Halfling','small',20,'rogue','specific',0,0)
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,racial_hit_dice,natural_armor,
   bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'phb-race-'||d.slug,'phb-3.5','12-20',d.slug,d.name,'','',0,NULL,1,
  c.id,d.favored_rule,d.size,d.speed,0,0,0,d.bonus_skill_points,d.bonus_feats
FROM desired d
LEFT JOIN dnd35_classes c
  ON c.slug=d.favored_slug AND c.source_id='phb-3.5' AND c.owner_user_id IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('dwarf','con',2),('dwarf','cha',-2),
  ('elf','dex',2),('elf','con',-2),
  ('gnome','con',2),('gnome','str',-2),
  ('half-orc','str',2),('half-orc','int',-2),('half-orc','cha',-2),
  ('halfling','dex',2),('halfling','str',-2)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r ON r.slug=d.race_slug AND r.owner_user_id IS NULL
WHERE r.source_id='phb-3.5'
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;
