-- XPH sourcebook-only playable races that overlap Monster Manual identities.
-- Githyanki and githzerai reuse their canonical MM1 race rows; XPH-specific
-- psionic traits are overlaid in the later trait seed. Thri-kreen is materialized here.

-- Refresh the canonical gith summaries for campaigns using the Expanded Psionics Handbook.
UPDATE dnd35_races
SET description='Psionic githyanki player race using the Expanded Psionics Handbook racial package.',
    rules_text='LA +2. Medium humanoid; speed 30 ft.; +2 Dexterity, +2 Constitution, -2 Wisdom; darkvision 60 ft.; naturally psionic with 3 bonus power points; scaling psi-like abilities; power resistance equal to Hit Dice + 5.',
    level_adjustment=2,
    is_enabled=1
WHERE slug='githyanki' AND owner_user_id IS NULL;

UPDATE dnd35_races
SET description='Psionic githzerai player race using the Expanded Psionics Handbook racial package.',
    rules_text='LA +2. Medium humanoid; speed 30 ft.; +6 Dexterity, +2 Wisdom, -2 Intelligence; darkvision 60 ft.; naturally psionic with 2 bonus power points; psi-like abilities; power resistance equal to Hit Dice + 5.',
    level_adjustment=2,
    is_enabled=1
WHERE slug='githzerai' AND owner_user_id IS NULL;

-- Remove any disabled catalog placeholder before materializing the XPH thri-kreen.
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND slug='thri-kreen'
  AND is_enabled=0
  AND id<>'xph-race-thri-kreen';

INSERT INTO dnd35_races
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,favored_class_id,favored_class_rule,size,base_speed_feet,level_adjustment,
   racial_hit_dice,racial_hit_die,natural_armor,bonus_skill_points_per_level,bonus_feats_at_first_level)
SELECT
  'xph-race-thri-kreen','xph-3.5','14-15','thri-kreen','Thri-Kreen',
  'Four-armed psionic monstrous humanoid with natural attacks, poison, exceptional leaping ability, and two racial Hit Dice.',
  'LA +2 with 2d8 monstrous humanoid racial Hit Dice (ECL 4 before class levels). Medium; speed 40 ft.; +2 Strength, +4 Dexterity, -2 Intelligence, +2 Wisdom, -4 Charisma; darkvision 60 ft.; immunity to magic sleep; +3 natural armor; four arms; four claw attacks and a bite; poison 1/day; +30 Jump; gythka/chatkcha familiarity; 1 racial power point; psi-like abilities; Deflect Arrows bonus feat.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='monstrous-humanoid' AND owner_user_id IS NULL LIMIT 1),
  (SELECT id FROM dnd35_classes WHERE slug='ranger' AND owner_user_id IS NULL LIMIT 1),
  CASE WHEN EXISTS (SELECT 1 FROM dnd35_classes WHERE slug='ranger' AND owner_user_id IS NULL) THEN 'specific' ELSE 'none' END,
  'medium',40,2,2,8,3,0,0
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_races r
  WHERE r.slug='thri-kreen' AND r.owner_user_id IS NULL AND r.is_enabled=1 AND r.id<>'xph-race-thri-kreen'
)
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, name=excluded.name,
  description=excluded.description, rules_text=excluded.rules_text, is_homebrew=0,
  owner_user_id=NULL, is_enabled=1, creature_type_id=excluded.creature_type_id,
  favored_class_id=excluded.favored_class_id, favored_class_rule=excluded.favored_class_rule,
  size=excluded.size, base_speed_feet=excluded.base_speed_feet,
  level_adjustment=excluded.level_adjustment, racial_hit_dice=excluded.racial_hit_dice,
  racial_hit_die=excluded.racial_hit_die, natural_armor=excluded.natural_armor,
  bonus_skill_points_per_level=0, bonus_feats_at_first_level=0;

DELETE FROM dnd35_race_abilities WHERE race_id='xph-race-thri-kreen';
WITH mods(ability,modifier) AS (VALUES
  ('str',2),('dex',4),('int',-2),('wis',2),('cha',-4)
)
INSERT INTO dnd35_race_abilities (race_id,ability,modifier)
SELECT 'xph-race-thri-kreen',ability,modifier FROM mods
WHERE EXISTS (SELECT 1 FROM dnd35_races WHERE id='xph-race-thri-kreen')
ON CONFLICT(race_id,ability) DO UPDATE SET modifier=excluded.modifier;

-- All three sourcebook races are psionic creatures when XPH rules are active.
INSERT OR IGNORE INTO dnd35_race_subtypes (race_id,subtype_id)
SELECT r.id,s.id
FROM dnd35_races r
JOIN dnd35_creature_subtypes s ON s.slug='psionic' AND s.owner_user_id IS NULL
WHERE r.owner_user_id IS NULL AND r.slug IN ('githyanki','githzerai','thri-kreen');
