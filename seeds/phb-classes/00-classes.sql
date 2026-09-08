-- phb-classes
-- Dungeons & Dragons v3.5 Player's Handbook class seed.
-- Source of truth: rendered Chapter 3 class tables and class text from the attached PHB.
-- The PDF text layer contains table-extraction artifacts; this seed follows the rendered pages.
-- Safe to re-run. Class-skill links are intentionally deferred until the PHB skill catalog exists.

INSERT OR IGNORE INTO dnd35_sources
  (id, slug, name, abbreviation, publisher, system, edition, description, url, is_official, is_homebrew, owner_user_id)
VALUES ('phb-3.5', 'players-handbook-3-5', 'Player''s Handbook', 'PHB', 'Wizards of the Coast',
        'dnd', '3.5', 'Core Rulebook I; source for the eleven D&D v3.5 base classes.', NULL, 1, 0, NULL);

-- Base classes.
WITH desired(slug,name,source_page,description,rules_text,hit_die,skill_points,bab,fort,ref,will) AS (VALUES
  ('barbarian', 'Barbarian', '24-26', 'A martial warrior built around rage, toughness, mobility, and wilderness ability.', 'Alignment: any nonlawful. Hit Die d12. Skill points per level: 4 + Intelligence modifier.', 12, 4, 'full', 'good', 'poor', 'poor'),
  ('bard', 'Bard', '26-30', 'A versatile performer combining spontaneous arcane magic, broad skills, lore, and bardic music.', 'Alignment: any nonlawful. Hit Die d6. Skill points per level: 6 + Intelligence modifier.', 6, 6, 'three_quarters', 'poor', 'good', 'good'),
  ('cleric', 'Cleric', '30-33', 'A prepared divine spellcaster with armor training, domains, and the ability to turn or rebuke undead.', 'Alignment must be within one step of the cleric''s deity; a neutral cleric requires a neutral deity. Hit Die d8. Skill points per level: 2 + Intelligence modifier.', 8, 2, 'three_quarters', 'good', 'poor', 'good'),
  ('druid', 'Druid', '33-37', 'A prepared divine spellcaster tied to nature, animal companionship, wild shape, and wilderness abilities.', 'Alignment: neutral good, lawful neutral, neutral, chaotic neutral, or neutral evil. Hit Die d8. Skill points per level: 4 + Intelligence modifier.', 8, 4, 'three_quarters', 'good', 'poor', 'good'),
  ('fighter', 'Fighter', '37-39', 'A dedicated martial combatant with broad weapon and armor training and frequent combat bonus feats.', 'Alignment: any. Hit Die d10. Skill points per level: 2 + Intelligence modifier.', 10, 2, 'full', 'good', 'poor', 'poor'),
  ('monk', 'Monk', '39-42', 'A lawful martial artist specializing in unarmed combat, mobility, discipline, and supernatural ki abilities.', 'Alignment: any lawful. Hit Die d8. Skill points per level: 4 + Intelligence modifier.', 8, 4, 'three_quarters', 'good', 'good', 'good'),
  ('paladin', 'Paladin', '42-46', 'A lawful-good divine champion combining martial ability, healing, protection, and limited divine spellcasting.', 'Alignment: lawful good. Hit Die d10. Skill points per level: 2 + Intelligence modifier.', 10, 2, 'full', 'good', 'poor', 'poor'),
  ('ranger', 'Ranger', '46-49', 'A wilderness warrior specializing in tracking, favored enemies, combat styles, and limited divine spellcasting.', 'Alignment: any. Hit Die d8. Skill points per level: 6 + Intelligence modifier.', 8, 6, 'full', 'good', 'good', 'poor'),
  ('rogue', 'Rogue', '49-51', 'A highly skilled scout and infiltrator built around sneak attacks, traps, evasion, and special abilities.', 'Alignment: any. Hit Die d6. Skill points per level: 8 + Intelligence modifier.', 6, 8, 'three_quarters', 'poor', 'good', 'poor'),
  ('sorcerer', 'Sorcerer', '51-55', 'An innate arcane spellcaster who knows a limited repertoire and casts it spontaneously.', 'Alignment: any. Hit Die d4. Skill points per level: 2 + Intelligence modifier.', 4, 2, 'half', 'poor', 'poor', 'good'),
  ('wizard', 'Wizard', '55-58', 'A studied arcane spellcaster who prepares spells from a spellbook and may specialize in a school of magic.', 'Alignment: any. Hit Die d4. Skill points per level: 2 + Intelligence modifier.', 4, 2, 'half', 'poor', 'poor', 'good')
)
INSERT OR IGNORE INTO dnd35_classes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,hit_die,skill_points_per_level,bab_progression,fort_progression,ref_progression,will_progression)
SELECT 'phb-class-'||d.slug, s.id, d.source_page, d.slug, d.name, d.description, d.rules_text, 0, NULL, 1,
       'base', d.hit_die, d.skill_points, d.bab, d.fort, d.ref, d.will
FROM desired d CROSS JOIN dnd35_sources s
WHERE s.slug='players-handbook-3-5' AND s.owner_user_id IS NULL;

-- Levels 1-20 use the reusable progressions from PHB Table 3-1.
WITH RECURSIVE levels(level) AS (SELECT 1 UNION ALL SELECT level+1 FROM levels WHERE level<20)
INSERT OR IGNORE INTO dnd35_class_levels (id,class_id,level,base_attack_bonus,fort,ref,will)
SELECT 'phb-class-level-'||c.slug||'-'||printf('%02d',levels.level), c.id, levels.level,
       CASE c.bab_progression WHEN 'full' THEN levels.level WHEN 'three_quarters' THEN (levels.level*3)/4 ELSE levels.level/2 END,
       CASE c.fort_progression WHEN 'good' THEN 2+levels.level/2 ELSE levels.level/3 END,
       CASE c.ref_progression  WHEN 'good' THEN 2+levels.level/2 ELSE levels.level/3 END,
       CASE c.will_progression WHEN 'good' THEN 2+levels.level/2 ELSE levels.level/3 END
FROM dnd35_classes c JOIN dnd35_sources s ON s.id=c.source_id CROSS JOIN levels
WHERE s.slug='players-handbook-3-5' AND s.owner_user_id IS NULL AND c.category='base';

-- Alignment prerequisites.
WITH desired(slug,expression,explanation) AS (VALUES
  ('barbarian', '{"version":1,"condition":{"kind":"alignment","allowed":["NG","CG","N","CN","NE","CE"]}}', 'Barbarians must be nonlawful.'),
  ('bard', '{"version":1,"condition":{"kind":"alignment","allowed":["NG","CG","N","CN","NE","CE"]}}', 'Bards must be nonlawful.'),
  ('cleric', '{"version":1,"condition":{"kind":"custom","description":"Cleric alignment must be within one step of the deity; a neutral cleric requires a neutral deity.","extension":{"key":"dnd35.cleric-alignment-with-deity","version":1,"parameters":{"maxSteps":1,"neutralRequiresNeutralDeity":true}}}}', 'Cleric alignment is deity-dependent.'),
  ('druid', '{"version":1,"condition":{"kind":"alignment","allowed":["NG","LN","N","CN","NE"]}}', 'Druids must have one neutral component as listed by the PHB.'),
  ('monk', '{"version":1,"condition":{"kind":"alignment","allowed":["LG","LN","LE"]}}', 'Monks must be lawful.'),
  ('paladin', '{"version":1,"condition":{"kind":"alignment","allowed":["LG"]}}', 'Paladins must be lawful good.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT c.id,d.expression,d.explanation FROM desired d
JOIN dnd35_classes c ON c.slug=d.slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='players-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET expression=excluded.expression, explanation=excluded.explanation;
