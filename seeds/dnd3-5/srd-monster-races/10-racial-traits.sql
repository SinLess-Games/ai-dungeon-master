-- D&D 3.5 SRD racial traits and special abilities for the monster-PC catalog.
-- This file complements 00-races.sql. It keeps the +1 through +8 sample races
-- rules-aware without copying abilities onto each character row: choosing a race
-- grants the race's catalog traits by reference.
-- Mechanical text below is a concise paraphrase of the D&D 3.5 SRD.

-- Keep the race-card summary useful in the existing Heritage step. The creator
-- already renders race.description, so these summaries expose the important
-- racial and special abilities without requiring a second UI data path.
WITH summaries(slug, description, rules_text) AS (VALUES
  ('aasimar',
   'Racial abilities: darkvision 60 ft., +2 Listen/Spot, acid/cold/electricity resistance 5. Special ability: daylight 1/day.',
   'LA +1 native outsider. +2 Wisdom and +2 Charisma; darkvision 60 ft.; +2 racial bonus on Listen and Spot; resistance 5 to acid, cold, and electricity; daylight 1/day.'),
  ('minotaur',
   'Racial abilities: Large, 6d8 racial HD, +5 natural armor, gore, darkvision, scent, +4 Listen/Search/Spot. Special: powerful charge and natural cunning.',
   'LA +2 monstrous humanoid with 6d8 racial Hit Dice. Large size, 10-ft. reach, +5 natural armor, gore 1d8, darkvision 60 ft., scent, +4 racial bonus on Listen/Search/Spot, Powerful Charge, and Natural Cunning.'),
  ('svirfneblin',
   'Racial abilities: darkvision 120 ft., low-light vision, +4 dodge AC, +2 saves, stonecunning, stealth bonuses, SR 11 + class levels. Special: innate magic and continuous nondetection.',
   'LA +3 deep gnome. Stonecunning; darkvision 120 ft. and low-light vision; spell resistance 11 + class levels; +2 racial bonus on all saves; +1 illusion save DC; +1 attacks against kobolds and goblinoids; +4 dodge AC; innate spell-like abilities; continuous nondetection; racial Craft (alchemy), Listen, and Hide bonuses.'),
  ('doppelganger',
   'Racial abilities: 4d8 racial HD, +4 natural armor, darkvision 60 ft., sleep/charm immunity, deception bonuses. Special: continuous detect thoughts and change shape.',
   'LA +4 monstrous humanoid with 4d8 racial Hit Dice. +4 natural armor, darkvision 60 ft., +4 Bluff/Disguise with additional change-shape and mind-reading bonuses, continuous detect thoughts, change shape, and immunity to sleep and charm effects.'),
  ('hound-archon',
   'Racial abilities: 6d8 racial HD, +9 natural armor, bite/slam, archon defenses, scent, DR 10/evil, SR 16 + class levels. Special: aura of menace, canine shapechange, at-will magic, teleport, tongues.',
   'LA +5 outsider with 6d8 racial Hit Dice. +9 natural armor; bite and slam; archon traits including darkvision/low-light vision, electricity and petrification immunity, poison-save bonus, magic circle against evil, greater teleport, and tongues; plus aura of menace, canine change shape, scent, DR 10/evil, SR 16 + class levels, and at-will spell-like abilities.'),
  ('pixie-irresistible-dance',
   'Racial abilities: Small, fly 60 ft. (good), low-light vision, +1 natural armor, Dodge, skill bonuses, DR 10/cold iron, SR 15 + class levels. Special: greater invisibility, pixie magic, irresistible dance 1/day.',
   'LA +6 pixie variant. The normal 1 fey HD is replaced by the first class level. Small size, fly 60 ft. (good), low-light vision, +2 Listen/Search/Spot, Dodge as a bonus feat, +1 natural armor, DR 10/cold iron, SR 15 + class levels, constant greater invisibility, standard pixie spell-like abilities, and irresistible dance 1/day.'),
  ('ogre-mage',
   'Racial abilities: Large, 5d8 racial HD, +5 natural armor, darkvision, low-light vision, fly 40 ft. (good), SR 19. Special: regeneration 5 and spell-like magic.',
   'LA +7 giant with 5d8 racial Hit Dice. Large size, 10-ft. reach, +5 natural armor, darkvision 60 ft., low-light vision, fly 40 ft. (good), spell resistance 19, regeneration 5, and innate spell-like abilities.'),
  ('trumpet-archon',
   'Racial abilities: 12d8 racial HD, +14 natural armor, fly 90 ft. (good), archon defenses, DR 10/evil, SR 29. Special: aura of menace, at-will magic, 14th-level cleric casting, teleport, tongues, supernatural trumpet.',
   'LA +8 outsider with 12d8 racial Hit Dice. +14 natural armor, fly 90 ft. (good), archon traits, DR 10/evil, spell resistance 29, aura of menace, at-will spell-like abilities, divine spellcasting as a 14th-level cleric, and a supernatural trumpet that can paralyze nearby creatures or become a +4 greatsword.')
)
UPDATE dnd35_races
SET description = (SELECT s.description FROM summaries s WHERE s.slug = dnd35_races.slug),
    rules_text = (SELECT s.rules_text FROM summaries s WHERE s.slug = dnd35_races.slug)
WHERE source_id = 'srd-monster-races-3.5'
  AND slug IN (SELECT slug FROM summaries);

-- Named extraordinary, supernatural, spell-like, and natural abilities. These are
-- reusable catalog definitions; race traits below link to them.
WITH abilities(id, slug, name, description, rules_text, category, action_type) AS (VALUES
  ('srd-sa-aasimar-daylight','aasimar-daylight','Daylight','Celestial light usable once per day.','Use daylight once per day. Caster level is 1st or the character''s class level, whichever is higher.','spell_like','standard'),

  ('srd-sa-minotaur-powerful-charge','minotaur-powerful-charge','Powerful Charge','A horn-first charge deals much greater gore damage.','When charging with its gore, the minotaur deals 4d6 damage plus 1-1/2 times its Strength modifier.','extraordinary','none'),
  ('srd-sa-minotaur-natural-cunning','minotaur-natural-cunning','Natural Cunning','Innate labyrinth sense and combat awareness.','Immune to maze effects, never becomes lost, can track enemies, and is never caught flat-footed.','extraordinary','none'),
  ('srd-sa-minotaur-scent','minotaur-scent','Scent','Tracks and locates creatures by smell.','Has the scent special quality.','natural','none'),

  ('srd-sa-svirfneblin-magic','svirfneblin-innate-magic','Svirfneblin Innate Magic','Deep-gnome spell-like magic usable once per day.','Once per day each: blindness/deafness, blur, and disguise self. Caster level equals class levels; save DCs are Charisma-based and receive the racial adjustment specified by the race.','spell_like','standard'),
  ('srd-sa-svirfneblin-nondetection','svirfneblin-nondetection','Nondetection','Continuous protection from divination.','Continuous nondetection as the spell; caster level equals class levels.','supernatural','none'),

  ('srd-sa-doppelganger-detect-thoughts','doppelganger-detect-thoughts','Detect Thoughts','Continuously reads surface thoughts.','Continuously functions as detect thoughts at caster level 18th. The ability can be suppressed or resumed as a free action; the save DC is Charisma-based.','supernatural','free'),
  ('srd-sa-doppelganger-change-shape','doppelganger-change-shape','Change Shape','Assumes a Small or Medium humanoid form.','As a standard action, assume the shape of any Small or Medium humanoid. The form persists until changed; true seeing reveals the natural form.','supernatural','standard'),

  ('srd-sa-hound-aura','hound-archon-aura-of-menace','Aura of Menace','Hostile creatures near the archon can suffer combat penalties.','Hostile creatures within 20 feet must save or take a -2 penalty on attacks, AC, and saves for 24 hours or until they successfully hit the archon. For a hound archon PC, the Will save DC is 15 + Charisma modifier.','supernatural','none'),
  ('srd-sa-hound-change-shape','hound-archon-change-shape','Canine Change Shape','Assumes doglike or wolflike animal forms.','As a standard action, assume any Small through Large canine animal form, replacing the normal bite/slam with the chosen form''s bite while transformed.','supernatural','standard'),
  ('srd-sa-hound-spell-like','hound-archon-spell-like-abilities','Hound Archon Spell-Like Abilities','A small suite of at-will celestial magic.','At will: aid, continual flame, detect evil, and message; caster level 6th.','spell_like','standard'),

  ('srd-sa-pixie-invisibility','pixie-greater-invisibility','Greater Invisibility','Remains invisible even while attacking.','Constant greater invisibility. The pixie can suppress or resume the effect as a free action.','supernatural','free'),
  ('srd-sa-pixie-magic','pixie-spell-like-abilities','Pixie Spell-Like Abilities','A broad suite of fey magic usable once per day.','Once per day each: lesser confusion, dancing lights, detect chaos, detect good, detect evil, detect law, detect thoughts, dispel magic, entangle, permanent image, and polymorph (self only); caster level 8th.','spell_like','standard'),
  ('srd-sa-pixie-dance','pixie-irresistible-dance','Irresistible Dance','The rare +6 LA pixie variant can invoke irresistible dance.','Use irresistible dance once per day at caster level 8th.','spell_like','standard'),

  ('srd-sa-ogre-mage-magic','ogre-mage-spell-like-abilities','Ogre Mage Spell-Like Abilities','Innate arcane-like magic.','At will: darkness and invisibility. Once per day each: charm person, cone of cold, gaseous form, polymorph, and sleep. Caster level 9th; save DCs are Charisma-based.','spell_like','standard'),
  ('srd-sa-ogre-mage-flight','ogre-mage-flight','Flight','Supernatural flight at the race''s listed fly speed.','Can cease or resume supernatural flight as a free action. In gaseous form it retains its fly speed and has perfect maneuverability.','supernatural','free'),
  ('srd-sa-ogre-mage-regeneration','ogre-mage-regeneration','Regeneration 5','Rapidly heals most damage.','Regeneration 5; fire and acid deal normal damage. Severed limbs can be reattached under the race''s regeneration rules.','extraordinary','none'),

  ('srd-sa-archon-magic-circle','archon-magic-circle-against-evil','Magic Circle against Evil','An always-active protective aura.','Continuously surrounded by magic circle against evil; caster level equals Hit Dice.','supernatural','none'),
  ('srd-sa-archon-teleport','archon-teleport','Greater Teleport','At-will self-only greater teleport.','Use greater teleport at will at caster level 14th, transporting only the archon and up to 50 pounds of objects.','supernatural','standard'),
  ('srd-sa-archon-tongues','archon-tongues','Tongues','Can speak with any creature that has a language.','Always-active tongues at caster level 14th.','supernatural','none'),
  ('srd-sa-trumpet-aura','trumpet-archon-aura-of-menace','Aura of Menace','Hostile creatures near the archon can suffer combat penalties.','Hostile creatures within 20 feet must save or take a -2 penalty on attacks, AC, and saves for 24 hours or until they successfully hit the archon. The save DC is Charisma-based and includes the archon racial adjustment.','supernatural','none'),
  ('srd-sa-trumpet-spell-like','trumpet-archon-spell-like-abilities','Trumpet Archon Spell-Like Abilities','At-will celestial utility magic.','At will: detect evil, continual flame, and message; caster level 12th.','spell_like','standard'),
  ('srd-sa-trumpet-spells','trumpet-archon-divine-spellcasting','Divine Spellcasting','Innate divine spellcasting beyond its racial Hit Dice.','Casts divine spells as a 14th-level cleric and has access to two appropriate domains from Air, Destruction, Good, Law, or War, plus any domains supplied by its deity.','other',NULL),
  ('srd-sa-trumpet-trumpet','trumpet-archon-trumpet','Trumpet','A supernatural instrument that can paralyze foes or become a magic weapon.','A blast can paralyze non-archons within 100 feet for 1d4 rounds on a failed Charisma-based Fortitude save. As a free action the trumpet can become a +4 greatsword and back again.','supernatural','other')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'srd-monster-races-3.5','SRD',slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
  slug=excluded.slug,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  category=excluded.category,
  action_type=excluded.action_type,
  effects=excluded.effects,
  parameters=excluded.parameters;

-- Complete race-facing traits. Passive traits stay directly on the race trait row;
-- named special abilities point at dnd35_special_abilities for later rules/runtime use.
WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  -- Aasimar, LA +1
  ('srd-rt-aasimar-darkvision','aasimar',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('srd-rt-aasimar-skills','aasimar',NULL,'Keen Senses','+2 racial bonus on Listen and Spot checks.',20),
  ('srd-rt-aasimar-resistances','aasimar',NULL,'Celestial Resistances','Resistance 5 to acid, cold, and electricity.',30),
  ('srd-rt-aasimar-daylight','aasimar','srd-sa-aasimar-daylight','Daylight','Daylight 1/day.',40),

  -- Minotaur, LA +2
  ('srd-rt-minotaur-large','minotaur',NULL,'Large Build','Large size with 10-ft. space and 10-ft. reach; normal Large size combat, Hide, grapple, lifting, and carrying adjustments apply.',10),
  ('srd-rt-minotaur-darkvision','minotaur',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('srd-rt-minotaur-skills','minotaur',NULL,'Labyrinth Hunter','+4 racial bonus on Listen, Search, and Spot checks.',30),
  ('srd-rt-minotaur-proficiency','minotaur',NULL,'Weapon Proficiency','Proficient with the greataxe and all simple weapons.',40),
  ('srd-rt-minotaur-armor','minotaur',NULL,'Natural Armor','+5 natural armor bonus.',50),
  ('srd-rt-minotaur-gore','minotaur',NULL,'Gore','Natural gore attack dealing 1d8 damage before Strength adjustments.',60),
  ('srd-rt-minotaur-charge','minotaur','srd-sa-minotaur-powerful-charge','Powerful Charge','Enhanced gore damage on a charge.',70),
  ('srd-rt-minotaur-cunning','minotaur','srd-sa-minotaur-natural-cunning','Natural Cunning','Innate maze immunity, navigation, tracking, and combat awareness.',80),
  ('srd-rt-minotaur-scent','minotaur','srd-sa-minotaur-scent','Scent','Has the scent special quality.',90),

  -- Svirfneblin, LA +3
  ('srd-rt-svirf-stonecunning','svirfneblin',NULL,'Stonecunning','+2 racial bonus on Search checks involving unusual stonework; passive checks within 10 feet; can notice stonework traps and intuit depth underground.',10),
  ('srd-rt-svirf-vision','svirfneblin',NULL,'Deep Vision','Darkvision 120 ft. and low-light vision.',20),
  ('srd-rt-svirf-sr','svirfneblin',NULL,'Spell Resistance','Spell resistance 11 + class levels.',30),
  ('srd-rt-svirf-saves','svirfneblin',NULL,'Resilient','+2 racial bonus on all saving throws.',40),
  ('srd-rt-svirf-illusion-dc','svirfneblin',NULL,'Illusion Affinity','+1 to the save DC of illusion spells cast by the svirfneblin.',50),
  ('srd-rt-svirf-goblinoid','svirfneblin',NULL,'Traditional Enemies','+1 racial bonus on attack rolls against kobolds and goblinoids.',60),
  ('srd-rt-svirf-dodge','svirfneblin',NULL,'Defensive Training','+4 dodge bonus to Armor Class.',70),
  ('srd-rt-svirf-magic','svirfneblin','srd-sa-svirfneblin-magic','Svirfneblin Innate Magic','Blindness/deafness, blur, and disguise self 1/day each.',80),
  ('srd-rt-svirf-nondetection','svirfneblin','srd-sa-svirfneblin-nondetection','Nondetection','Continuous nondetection.',90),
  ('srd-rt-svirf-skills','svirfneblin',NULL,'Subterranean Skills','+2 racial bonus on Craft (alchemy) and Listen; +2 Hide, improving to +4 underground.',100),

  -- Doppelganger, LA +4
  ('srd-rt-doppel-darkvision','doppelganger',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('srd-rt-doppel-armor','doppelganger',NULL,'Natural Armor','+4 natural armor bonus.',20),
  ('srd-rt-doppel-deception','doppelganger',NULL,'Deceptive Aptitude','+4 racial bonus on Bluff and Disguise; change shape adds +10 circumstance to Disguise, and reading a target''s thoughts can add a further +4 circumstance bonus on Bluff and Disguise.',30),
  ('srd-rt-doppel-thoughts','doppelganger','srd-sa-doppelganger-detect-thoughts','Detect Thoughts','Continuous detect thoughts.',40),
  ('srd-rt-doppel-shape','doppelganger','srd-sa-doppelganger-change-shape','Change Shape','Assume a Small or Medium humanoid form.',50),
  ('srd-rt-doppel-immunity','doppelganger',NULL,'Mental Immunities','Immune to sleep and charm effects.',60),

  -- Hound Archon, LA +5
  ('srd-rt-hound-armor','hound-archon',NULL,'Natural Armor','+9 natural armor bonus.',10),
  ('srd-rt-hound-weapons','hound-archon',NULL,'Natural Weapons','Bite 1d8 and slam 1d4.',20),
  ('srd-rt-hound-vision','hound-archon',NULL,'Archon Vision','Darkvision 60 ft. and low-light vision.',30),
  ('srd-rt-hound-aura','hound-archon','srd-sa-hound-aura','Aura of Menace','20-ft. hostile-creature aura.',40),
  ('srd-rt-hound-immunities','hound-archon',NULL,'Archon Immunities','Immune to electricity and petrification; +4 racial bonus on saves against poison.',50),
  ('srd-rt-hound-circle','hound-archon','srd-sa-archon-magic-circle','Magic Circle against Evil','Continuous magic circle against evil.',60),
  ('srd-rt-hound-teleport','hound-archon','srd-sa-archon-teleport','Greater Teleport','At-will self-only greater teleport with limited carried objects.',70),
  ('srd-rt-hound-tongues','hound-archon','srd-sa-archon-tongues','Tongues','Always-active tongues.',80),
  ('srd-rt-hound-spelllike','hound-archon','srd-sa-hound-spell-like','Spell-Like Abilities','At-will aid, continual flame, detect evil, and message.',90),
  ('srd-rt-hound-shape','hound-archon','srd-sa-hound-change-shape','Canine Change Shape','Assume Small through Large canine animal forms.',100),
  ('srd-rt-hound-dr','hound-archon',NULL,'Damage Reduction','Damage reduction 10/evil.',110),
  ('srd-rt-hound-scent','hound-archon',NULL,'Scent','Has the scent special quality.',120),
  ('srd-rt-hound-sr','hound-archon',NULL,'Spell Resistance','Spell resistance 16 + class levels.',130),
  ('srd-rt-hound-aligned','hound-archon',NULL,'Aligned Attacks','Natural weapons and wielded weapons count as good- and lawful-aligned for overcoming damage reduction.',140),

  -- Pixie with irresistible dance, LA +6
  ('srd-rt-pixie-size','pixie-irresistible-dance',NULL,'Small Fey','Small size with normal Small size combat, Hide, grapple, lifting, and carrying adjustments.',10),
  ('srd-rt-pixie-flight','pixie-irresistible-dance',NULL,'Flight','Fly speed 60 ft. with good maneuverability.',20),
  ('srd-rt-pixie-vision','pixie-irresistible-dance',NULL,'Low-Light Vision','Has low-light vision.',30),
  ('srd-rt-pixie-skills','pixie-irresistible-dance',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot.',40),
  ('srd-rt-pixie-dodge','pixie-irresistible-dance',NULL,'Dodge','Receives Dodge as a racial bonus feat.',50),
  ('srd-rt-pixie-armor','pixie-irresistible-dance',NULL,'Natural Armor','+1 natural armor bonus.',60),
  ('srd-rt-pixie-dr','pixie-irresistible-dance',NULL,'Damage Reduction','Damage reduction 10/cold iron.',70),
  ('srd-rt-pixie-sr','pixie-irresistible-dance',NULL,'Spell Resistance','Spell resistance 15 + class levels.',80),
  ('srd-rt-pixie-invisibility','pixie-irresistible-dance','srd-sa-pixie-invisibility','Greater Invisibility','Constant greater invisibility that can be suppressed or resumed.',90),
  ('srd-rt-pixie-magic','pixie-irresistible-dance','srd-sa-pixie-magic','Pixie Spell-Like Abilities','Standard pixie spell-like ability suite.',100),
  ('srd-rt-pixie-dance','pixie-irresistible-dance','srd-sa-pixie-dance','Irresistible Dance','Irresistible dance 1/day; this extra ability is what raises this pixie variant to LA +6.',110),

  -- Ogre Mage, LA +7
  ('srd-rt-ogre-mage-large','ogre-mage',NULL,'Large Build','Large size with 10-ft. space and 10-ft. reach; normal Large size adjustments apply.',10),
  ('srd-rt-ogre-mage-vision','ogre-mage',NULL,'Giant Vision','Darkvision 60 ft. and low-light vision.',20),
  ('srd-rt-ogre-mage-armor','ogre-mage',NULL,'Natural Armor','+5 natural armor bonus.',30),
  ('srd-rt-ogre-mage-flight','ogre-mage','srd-sa-ogre-mage-flight','Flight','Fly speed 40 ft. (good); can suspend or resume flight as a free action.',40),
  ('srd-rt-ogre-mage-sr','ogre-mage',NULL,'Spell Resistance','Spell resistance 19.',50),
  ('srd-rt-ogre-mage-regen','ogre-mage','srd-sa-ogre-mage-regeneration','Regeneration 5','Regeneration 5; fire and acid deal normal damage.',60),
  ('srd-rt-ogre-mage-magic','ogre-mage','srd-sa-ogre-mage-magic','Spell-Like Abilities','At-will darkness/invisibility plus the race''s once-per-day magical abilities.',70),

  -- Trumpet Archon, LA +8
  ('srd-rt-trumpet-armor','trumpet-archon',NULL,'Natural Armor','+14 natural armor bonus.',10),
  ('srd-rt-trumpet-flight','trumpet-archon',NULL,'Flight','Fly speed 90 ft. with good maneuverability.',20),
  ('srd-rt-trumpet-vision','trumpet-archon',NULL,'Archon Vision','Darkvision 60 ft. and low-light vision.',30),
  ('srd-rt-trumpet-aura','trumpet-archon','srd-sa-trumpet-aura','Aura of Menace','20-ft. hostile-creature aura.',40),
  ('srd-rt-trumpet-immunities','trumpet-archon',NULL,'Archon Immunities','Immune to electricity and petrification; +4 racial bonus on saves against poison.',50),
  ('srd-rt-trumpet-circle','trumpet-archon','srd-sa-archon-magic-circle','Magic Circle against Evil','Continuous magic circle against evil.',60),
  ('srd-rt-trumpet-teleport','trumpet-archon','srd-sa-archon-teleport','Greater Teleport','At-will self-only greater teleport with limited carried objects.',70),
  ('srd-rt-trumpet-tongues','trumpet-archon','srd-sa-archon-tongues','Tongues','Always-active tongues.',80),
  ('srd-rt-trumpet-dr','trumpet-archon',NULL,'Damage Reduction','Damage reduction 10/evil.',90),
  ('srd-rt-trumpet-sr','trumpet-archon',NULL,'Spell Resistance','Spell resistance 29 at the base racial Hit Dice.',100),
  ('srd-rt-trumpet-aligned','trumpet-archon',NULL,'Aligned Attacks','Natural weapons and wielded weapons count as good- and lawful-aligned for overcoming damage reduction.',110),
  ('srd-rt-trumpet-spelllike','trumpet-archon','srd-sa-trumpet-spell-like','Spell-Like Abilities','At-will detect evil, continual flame, and message.',120),
  ('srd-rt-trumpet-spells','trumpet-archon','srd-sa-trumpet-spells','Divine Spellcasting','Casts divine spells as a 14th-level cleric.',130),
  ('srd-rt-trumpet-trumpet','trumpet-archon','srd-sa-trumpet-trumpet','Trumpet','Paralyzing trumpet blast; the instrument can also become a +4 greatsword.',140)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT
  t.id,
  r.id,
  t.special_ability_id,
  t.name,
  t.rules_text,
  t.position,
  NULL,
  NULL
FROM traits t
JOIN dnd35_races r
  ON r.slug=t.race_slug
 AND r.source_id='srd-monster-races-3.5'
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=excluded.effects,
  parameters=excluded.parameters;
