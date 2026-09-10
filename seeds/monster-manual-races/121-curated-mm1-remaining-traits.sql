-- Normalized creator-facing traits and special abilities for the remaining
-- curated Monster Manual v3.5 source-list races.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-grimlock-blindsight','140','grimlock-blindsight','Blindsight 40 ft.','Sense nearby creatures without sight.','Sense creatures and objects within 40 feet as a sighted creature would. Sound- or scent-negating effects can degrade or remove this sense as described by the source entry.','extraordinary','none'),
  ('mm1-sa-rakshasa-detect-thoughts','212','rakshasa-detect-thoughts','Detect Thoughts','Continuously read nearby surface thoughts.','Continuously use detect thoughts at caster level 18th; the ability may be suppressed or resumed as a free action. The save DC is Charisma-based for a player character.','supernatural','free'),
  ('mm1-sa-rakshasa-change-shape','212','rakshasa-change-shape','Change Shape','Assume humanoid forms at will.','Assume any humanoid form or return to natural form as a standard action. Humanoid form loses the natural bite and claw attacks; true seeing reveals the natural form.','supernatural','standard'),
  ('mm1-sa-rakshasa-spellcasting','212','rakshasa-racial-sorcerer-spellcasting','Racial Sorcerer Spellcasting','Innate arcane spellcasting from racial Hit Dice.','Casts spells as a 7th-level sorcerer. Additional sorcerer class levels stack with the racial spellcasting for spells known, spells per day, caster level, and familiar progression.','other','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, slug=excluded.slug, name=excluded.name,
  description=excluded.description, rules_text=excluded.rules_text, is_homebrew=0, owner_user_id=NULL,
  is_enabled=1, category=excluded.category, action_type=excluded.action_type, effects=NULL, parameters=NULL;

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-grimlock-rhd','grimlock',NULL,'Racial Hit Dice','2d8 monstrous humanoid racial Hit Dice; racial BAB +2 and base saves Fort +0, Ref +3, Will +3.',10),
  ('mm1-rt-grimlock-blindsight','grimlock','mm1-sa-grimlock-blindsight','Blindsight','Blindsight 40 ft.',20),
  ('mm1-rt-grimlock-immunities','grimlock',NULL,'Sight-Based Immunities','Immune to gaze attacks, visual effects, visual illusions, and other attacks that rely on sight.',30),
  ('mm1-rt-grimlock-scent','grimlock',NULL,'Scent','Scent special quality.',40),
  ('mm1-rt-grimlock-natural-armor','grimlock',NULL,'Natural Armor','+4 natural armor bonus.',50),
  ('mm1-rt-grimlock-hide','grimlock',NULL,'Native Camouflage','+10 racial bonus on Hide checks in mountains or underground.',60),
  ('mm1-rt-grimlock-skills','grimlock',NULL,'Racial Skills','Racial-HD class skills are Climb, Hide, Listen, and Spot.',70),
  ('mm1-rt-grimlock-track','grimlock',NULL,'Bonus Feat: Track','Track is marked as a racial bonus feat in the source entry.',80),
  ('mm1-rt-grimlock-battleaxe','grimlock',NULL,'Battleaxe Proficiency','Automatically proficient with the battleaxe.',90),

  ('mm1-rt-tallfellow-lightfoot','tallfellow-halfling',NULL,'Lightfoot Heritage','Retains the lightfoot halfling racial package except for the explicitly replaced athletic and Listen traits.',10),
  ('mm1-rt-tallfellow-perception','tallfellow-halfling',NULL,'Keen Senses','+2 racial bonus on Search, Spot, and Listen checks, replacing the lightfoot Listen bonus.',20),
  ('mm1-rt-tallfellow-secret-doors','tallfellow-halfling',NULL,'Notice Concealed Doors','Passing within 5 feet of a secret or concealed door permits a Search check as though actively searching.',30),
  ('mm1-rt-tallfellow-less-athletic','tallfellow-halfling',NULL,'Less Athletic','Does not receive the lightfoot halfling racial bonuses on Climb, Jump, or Move Silently.',40),
  ('mm1-rt-tallfellow-halfling-saves','tallfellow-halfling',NULL,'Halfling Saving Throw Bonus','Retains the lightfoot halfling +1 racial bonus on all saving throws and +2 morale bonus on saves against fear.',50),
  ('mm1-rt-tallfellow-ranged','tallfellow-halfling',NULL,'Halfling Throwing Accuracy','Retains the lightfoot +1 racial bonus on attacks with thrown weapons and slings.',60),

  ('mm1-rt-deep-lightfoot','deep-halfling',NULL,'Lightfoot Heritage','Retains the lightfoot halfling racial package except for the explicitly removed athletic traits.',10),
  ('mm1-rt-deep-darkvision','deep-halfling',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-deep-stonecunning','deep-halfling',NULL,'Stonecunning','Dwarf-like stonecunning: +2 on checks concerning unusual stonework, automatic proximity checks, stonework trap searching, and intuitive underground depth.',30),
  ('mm1-rt-deep-craft','deep-halfling',NULL,'Stone and Metal Expertise','+2 racial bonus on Appraise and Craft checks related to stone or metal.',40),
  ('mm1-rt-deep-less-athletic','deep-halfling',NULL,'Less Athletic','Does not receive the lightfoot halfling racial bonuses on Climb, Jump, or Move Silently.',50),
  ('mm1-rt-deep-listen','deep-halfling',NULL,'Keen Hearing','Retains the lightfoot halfling +2 racial bonus on Listen checks.',60),
  ('mm1-rt-deep-halfling-saves','deep-halfling',NULL,'Halfling Saving Throw Bonus','Retains the lightfoot halfling +1 racial bonus on all saving throws and +2 morale bonus on saves against fear.',70),
  ('mm1-rt-deep-ranged','deep-halfling',NULL,'Halfling Throwing Accuracy','Retains the lightfoot +1 racial bonus on attacks with thrown weapons and slings.',80),

  ('mm1-rt-rakshasa-rhd','rakshasa',NULL,'Racial Hit Dice','7d8 outsider racial Hit Dice; racial BAB +7 and base saves Fort +5, Ref +5, Will +5.',10),
  ('mm1-rt-rakshasa-darkvision','rakshasa',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-rakshasa-natural-armor','rakshasa',NULL,'Natural Armor','+9 natural armor bonus.',30),
  ('mm1-rt-rakshasa-detect','rakshasa','mm1-sa-rakshasa-detect-thoughts','Detect Thoughts','Continuously detect thoughts with Charisma-based resistance.',40),
  ('mm1-rt-rakshasa-spellcasting','rakshasa','mm1-sa-rakshasa-spellcasting','Racial Sorcerer Spellcasting','Casts as a 7th-level sorcerer; sorcerer class levels stack.',50),
  ('mm1-rt-rakshasa-shape','rakshasa','mm1-sa-rakshasa-change-shape','Change Shape','Assume humanoid forms at will.',60),
  ('mm1-rt-rakshasa-dr','rakshasa',NULL,'Damage Reduction','Damage reduction 15/good and piercing.',70),
  ('mm1-rt-rakshasa-sr','rakshasa',NULL,'Spell Resistance','Spell resistance equals 27 + class levels.',80),
  ('mm1-rt-rakshasa-natural-weapons','rakshasa',NULL,'Natural Weapons','Bite (1d6) and two claws (1d4).',90),
  ('mm1-rt-rakshasa-skills','rakshasa',NULL,'Racial Skills','Racial-HD class skills are Bluff, Disguise, Listen, Move Silently, Perform, Sense Motive, and Spot; +4 racial bonus on Bluff and Disguise, with additional situational bonuses from change shape and detect thoughts.',100)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id, special_ability_id=excluded.special_ability_id, name=excluded.name,
  rules_text=excluded.rules_text, position=excluded.position, effects=NULL, parameters=NULL;
