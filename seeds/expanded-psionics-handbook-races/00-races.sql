-- Expanded Psionics Handbook v3.5 playable races backed by the open SRD.
-- Githyanki, githzerai, and thri-kreen remain in the broader catalog for a
-- separate sourcebook-only materialization pass; they are not duplicated here.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('xph-3.5','expanded-psionics-handbook-3-5','Expanded Psionics Handbook','XPH',
   'Wizards of the Coast','dnd','3.5',
   'D&D 3.5 revised psionics sourcebook: psionic races, classes, feats, powers, prestige classes, items, and monsters.',
   NULL,1,0,NULL);

-- XPH-only subtypes required by these races. Reuse an existing shared subtype
-- with the same slug rather than creating a second canonical identity.
WITH desired(slug,name) AS (VALUES
  ('psionic','Psionic'),
  ('maenad','Maenad'),
  ('xeph','Xeph'),
  ('incorporeal','Incorporeal')
)
INSERT INTO dnd35_creature_subtypes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'xph-creature-subtype-'||d.slug,'xph-3.5',NULL,d.slug,d.name,
  'Expanded Psionics Handbook creature subtype used by playable race data.',
  'Source-backed subtype identity for D&D 3.5 psionic creature and race rules.',
  0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_subtypes s
  WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);

-- Racial HD for Unbodied uses the monstrous humanoid chassis.
UPDATE dnd35_creature_types
SET hit_die=8, skill_points_per_hit_die=2, bab_progression='full',
    fort_progression='poor', ref_progression='good', will_progression='good'
WHERE slug='monstrous-humanoid' AND owner_user_id IS NULL;

-- Remove old disabled catalog placeholders for rows that are materialized below.
-- Enabled shared rows, if any, are preserved and win canonicalization.
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND slug IN (
    'dromite','duergar-psionic','elan','half-giant',
    'maenad','xeph','blue','unbodied'
  )
  AND id NOT IN (
    'xph-race-dromite','xph-race-duergar-psionic','xph-race-elan','xph-race-half-giant',
    'xph-race-maenad','xph-race-xeph','xph-race-blue','xph-race-unbodied'
  );

WITH desired(
  slug,name,type_slug,size,speed,la,rhd,rhd_die,natural_armor,
  favored_slug,enabled,description,rules_text
) AS (VALUES
  ('dromite','Dromite','monstrous-humanoid','small',20,1,0,NULL,3,'wilder',1,
   'Small psionic monstrous humanoid with natural armor, energy affinity, scent, and a daily energy ray.',
   'LA +1. Small; speed 20 ft.; +3 natural armor; +2 Charisma, -2 Strength, -2 Wisdom; darkvision 60 ft.; naturally psionic; one matching energy resistance and energy ray; scent; +2 Spot; Blind-Fight as a racial bonus feat.'),
  ('duergar-psionic','Duergar (Psionic)','humanoid','medium',20,1,0,NULL,0,'fighter',1,
   'Psionic gray dwarf variant replacing the standard duergar spell-like abilities with psi-like expansion and invisibility.',
   'LA +1. Medium; speed 20 ft. even in medium/heavy armor or load; +2 Constitution, -4 Charisma; darkvision 120 ft.; duergar immunities, stability, stonecunning, psionic expansion/invisibility, 3 racial power points, combat and skill bonuses, and light sensitivity.'),
  ('elan','Elan','aberration','medium',30,0,0,NULL,0,'psion',1,
   'Psionically transformed aberration sustained by an internal reserve of power points.',
   'LA +0. Medium; speed 30 ft.; -2 Charisma; naturally psionic with 2 racial power points; Repletion, Resilience, and Resistance.'),
  ('half-giant','Half-Giant','giant','medium',30,1,0,NULL,0,'psychic-warrior',1,
   'Medium giant with powerful build, fire acclimation, low-light vision, and a daily stomp.',
   'LA +1. Medium Giant; speed 30 ft.; +2 Strength, -2 Dexterity, +2 Constitution; low-light vision; 2 racial power points; fire acclimation; powerful build; stomp 1/day.'),
  ('maenad','Maenad','humanoid','medium',30,0,0,NULL,0,'wilder',1,
   'Humanoid psionic race whose disciplined emotions can erupt into temporary physical strength.',
   'LA +0. Medium; speed 30 ft.; naturally psionic with 2 racial power points; sonic energy ray 1/day; Outburst 1/day for up to 4 rounds.'),
  ('xeph','Xeph','humanoid','medium',30,0,0,NULL,0,'soulknife',1,
   'Quick psionic humanoid with darkvision and a short supernatural burst of speed.',
   'LA +0. Medium; speed 30 ft.; -2 Strength, +2 Dexterity; darkvision 60 ft.; 1 racial power point; +1 racial bonus on saves against powers, spells, and spell-like effects; Burst 3/day.'),
  ('blue','Blue','humanoid','small',30,1,0,NULL,0,'psion',1,
   'Small psionic goblinoid with an aptitude for mental disciplines and stealthy riding.',
   'LA +1. Small; speed 30 ft.; -2 Strength, +2 Intelligence, -2 Charisma; darkvision 60 ft.; 1 racial power point; +4 Move Silently and Ride.'),
  ('unbodied','Unbodied','monstrous-humanoid','medium',0,4,4,8,0,'psion',0,
   'Incorporeal psionic monstrous humanoid with 4 racial Hit Dice, flight, telepathy, and innate telepath manifesting.',
   'LA +4 with 4d8 racial Hit Dice. Medium incorporeal monstrous humanoid; no Strength score; fly 30 ft. (good); darkvision 60 ft.; Charisma-based deflection AC; 1d6 incorporeal touch; telepathy, assume likeness, telekinetic force, and 4th-level telepath manifesting. Seeded complete but disabled until character creation supports nonabilities and racial manifesting.')
)
INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'xph-race-'||d.slug,'xph-3.5',NULL,d.slug,d.name,d.description,d.rules_text,0,NULL,d.enabled,
  (SELECT ct.id FROM dnd35_creature_types ct
    WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
  (SELECT c.id FROM dnd35_classes c
    WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (
    SELECT 1 FROM dnd35_classes c
    WHERE c.slug=d.favored_slug AND c.owner_user_id IS NULL
  ) THEN 'specific' ELSE 'none' END,
  d.size,d.speed,d.la,d.rhd,d.rhd_die,d.natural_armor,0,
  CASE WHEN d.rhd > 1 THEN 1 + CAST((d.rhd + 1) / 3 AS INTEGER) ELSE 0 END
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races existing
  WHERE existing.slug=d.slug
    AND existing.owner_user_id IS NULL
    AND existing.is_enabled=1
    AND existing.id <> 'xph-race-'||d.slug
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=excluded.is_enabled,
  creature_type_id=excluded.creature_type_id,
  favored_class_id=excluded.favored_class_id,
  favored_class_rule=excluded.favored_class_rule,
  size=excluded.size,
  base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment,
  racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die,
  natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=excluded.bonus_skill_points_per_level,
  bonus_feats_at_first_level=excluded.bonus_feats_at_first_level;

-- Replace the structured racial ability modifiers for canonical XPH rows.
DELETE FROM dnd35_race_abilities
WHERE race_id IN (
  'xph-race-dromite','xph-race-duergar-psionic','xph-race-elan','xph-race-half-giant',
  'xph-race-maenad','xph-race-xeph','xph-race-blue','xph-race-unbodied'
);

WITH desired(race_slug,ability,modifier) AS (VALUES
  ('dromite','str',-2),('dromite','wis',-2),('dromite','cha',2),
  ('duergar-psionic','con',2),('duergar-psionic','cha',-4),
  ('elan','cha',-2),
  ('half-giant','str',2),('half-giant','dex',-2),('half-giant','con',2),
  ('xeph','str',-2),('xeph','dex',2),
  ('blue','str',-2),('blue','int',2),('blue','cha',-2),
  ('unbodied','dex',2),('unbodied','con',2),('unbodied','int',4),('unbodied','wis',4),('unbodied','cha',4)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT r.id,d.ability,d.modifier
FROM desired d
JOIN dnd35_races r
  ON r.slug=d.race_slug AND r.owner_user_id IS NULL
WHERE r.id='xph-race-'||d.race_slug
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

-- Additional movement: Unbodied has no land speed and flies instead.
INSERT INTO dnd35_race_movements
  (race_id,mode,feet,base_speed_multiplier,maneuverability,rules_text)
SELECT r.id,'fly',30,NULL,'good','Fly speed 30 ft. with good maneuverability.'
FROM dnd35_races r
WHERE r.id='xph-race-unbodied'
ON CONFLICT(race_id,mode) DO UPDATE SET
  feet=excluded.feet,
  base_speed_multiplier=excluded.base_speed_multiplier,
  maneuverability=excluded.maneuverability,
  rules_text=excluded.rules_text;

-- Source-backed subtypes. Existing shared subtype rows are reused by slug.
WITH desired(race_slug,subtype_slug) AS (VALUES
  ('dromite','psionic'),
  ('duergar-psionic','dwarf'),('duergar-psionic','psionic'),
  ('elan','psionic'),
  ('half-giant','psionic'),
  ('maenad','maenad'),('maenad','psionic'),
  ('xeph','xeph'),('xeph','psionic'),
  ('blue','goblinoid'),('blue','psionic'),
  ('unbodied','incorporeal'),('unbodied','psionic')
)
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r
  ON r.slug=d.race_slug AND r.owner_user_id IS NULL
JOIN dnd35_creature_subtypes s
  ON s.slug=d.subtype_slug AND s.owner_user_id IS NULL
WHERE r.id='xph-race-'||d.race_slug;
