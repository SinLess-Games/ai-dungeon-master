-- Monster Manual v3.5 racial traits and reusable special abilities for the
-- no-retained-RHD playable-race batch.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-duergar-spell-like','duergar-spell-like-abilities','Duergar Spell-Like Abilities',
   'Innate magic available to duergar characters.',
   '1/day each: enlarge person and invisibility, affecting only the duergar and carried gear. Caster level equals twice class level, minimum 3rd.',
   'spell_like','standard'),
  ('mm1-sa-drow-spell-like','drow-spell-like-abilities','Drow Spell-Like Abilities',
   'Innate drow magic.',
   '1/day each: dancing lights, darkness, and faerie fire. Caster level equals class levels.',
   'spell_like','standard'),
  ('mm1-sa-forest-gnome-pass-without-trace','forest-gnome-pass-without-trace','Pass without Trace',
   'Forest gnomes can conceal their passage through natural terrain.',
   'Use pass without trace on self as a free action; caster level equals class levels.',
   'supernatural','free'),
  ('mm1-sa-forest-gnome-magic','forest-gnome-magic','Forest Gnome Magic',
   'Forest gnomes retain the non-animal portion of rock gnome innate illusion magic.',
   'With Charisma 10 or higher: 1/day each dancing lights, ghost sound, and prestidigitation; caster level 1st and save DC is Charisma-based.',
   'spell_like','standard'),
  ('mm1-sa-githyanki-psionics','githyanki-psionics','Githyanki Psionics',
   'Scaling innate psionic spell-like abilities.',
   '3/day: daze and mage hand. At 3rd level add blur 3/day; at 6th add dimension door 3/day; at 9th add telekinesis 3/day and plane shift 1/day. Caster level equals class levels; save DCs are Charisma-based.',
   'spell_like','standard'),
  ('mm1-sa-githzerai-psionics','githzerai-psionics','Githzerai Psionics',
   'Innate psionic spell-like abilities.',
   '3/day each: daze, feather fall, and shatter. At 11th level or higher, plane shift 1/day. Caster level equals class levels; save DCs are Charisma-based.',
   'spell_like','standard'),
  ('mm1-sa-githzerai-inertial-armor','githzerai-inertial-armor','Inertial Armor',
   'Psychic force protects a conscious githzerai.',
   'Gain a +4 armor bonus to Armor Class while conscious.',
   'spell_like','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,action_type,effects,parameters)
SELECT
  a.id,'mm1-3.5',NULL,a.slug,a.name,a.description,a.rules_text,0,NULL,1,
  a.category,a.action_type,NULL,NULL
FROM abilities a
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
  effects=NULL,
  parameters=NULL;

DELETE FROM dnd35_race_traits
WHERE id LIKE 'mm1-rt-%'
  AND race_id IN (
    SELECT id FROM dnd35_races
    WHERE owner_user_id IS NULL
      AND slug IN (
        'deep-dwarf','duergar','mountain-dwarf','aquatic-elf','drow',
        'gray-elf','wild-elf','wood-elf','forest-gnome','goblin',
        'hobgoblin','kobold','orc','githyanki','githzerai'
      )
  );

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-deep-dwarf-speed','deep-dwarf',NULL,'Steady Speed','Base speed 20 ft.; medium/heavy armor and medium/heavy loads do not reduce this speed.',10),
  ('mm1-rt-deep-dwarf-darkvision','deep-dwarf',NULL,'Darkvision','Darkvision 90 ft.',20),
  ('mm1-rt-deep-dwarf-stonecunning','deep-dwarf',NULL,'Stonecunning','+2 Search involving unusual stonework, passive checks within 10 ft., stonework-trap searching, and intuitive depth underground.',30),
  ('mm1-rt-deep-dwarf-weapons','deep-dwarf',NULL,'Weapon Familiarity','Treat dwarven waraxes and dwarven urgroshes as martial rather than exotic weapons.',40),
  ('mm1-rt-deep-dwarf-stability','deep-dwarf',NULL,'Stability','+4 on ability checks to resist bull rush or trip while standing firmly on the ground.',50),
  ('mm1-rt-deep-dwarf-poison','deep-dwarf',NULL,'Deep Poison Resistance','+3 racial bonus on saving throws against poison.',60),
  ('mm1-rt-deep-dwarf-magic','deep-dwarf',NULL,'Deep Magic Resistance','+3 racial bonus on saving throws against spells and spell-like effects.',70),
  ('mm1-rt-deep-dwarf-enemies','deep-dwarf',NULL,'Orc and Goblinoid Combat Training','+1 racial bonus on attack rolls against orcs, half-orcs, and goblinoids.',80),
  ('mm1-rt-deep-dwarf-giants','deep-dwarf',NULL,'Giant Dodging','+4 dodge bonus to Armor Class against creatures of the giant type.',90),
  ('mm1-rt-deep-dwarf-craft','deep-dwarf',NULL,'Stone and Metal Expertise','+2 racial bonus on Appraise and Craft checks related to stone or metal.',100),
  ('mm1-rt-deep-dwarf-light','deep-dwarf',NULL,'Light Sensitivity','Dazzled in bright sunlight or within a daylight effect.',110),

  ('mm1-rt-duergar-speed','duergar',NULL,'Steady Speed','Base speed 20 ft.; medium/heavy armor and medium/heavy loads do not reduce this speed.',10),
  ('mm1-rt-duergar-darkvision','duergar',NULL,'Darkvision','Darkvision 120 ft.',20),
  ('mm1-rt-duergar-stonecunning','duergar',NULL,'Stonecunning','+2 Search involving unusual stonework, passive checks within 10 ft., stonework-trap searching, and intuitive depth underground.',30),
  ('mm1-rt-duergar-stability','duergar',NULL,'Stability','+4 on ability checks to resist bull rush or trip while standing firmly on the ground.',40),
  ('mm1-rt-duergar-immunities','duergar',NULL,'Duergar Immunities','Immune to paralysis, phantasms, and poison.',50),
  ('mm1-rt-duergar-magic','duergar',NULL,'Magic Resistance','+2 racial bonus on saving throws against spells and spell-like effects.',60),
  ('mm1-rt-duergar-spell-like','duergar','mm1-sa-duergar-spell-like','Spell-Like Abilities','Enlarge person and invisibility 1/day each.',70),
  ('mm1-rt-duergar-enemies','duergar',NULL,'Orc and Goblinoid Combat Training','+1 racial bonus on attack rolls against orcs, half-orcs, and goblinoids.',80),
  ('mm1-rt-duergar-giants','duergar',NULL,'Giant Dodging','+4 dodge bonus to Armor Class against creatures of the giant type.',90),
  ('mm1-rt-duergar-craft','duergar',NULL,'Stone and Metal Expertise','+2 racial bonus on Appraise and Craft checks related to stone or metal.',100),
  ('mm1-rt-duergar-skills','duergar',NULL,'Duergar Skills','+4 Move Silently and +1 Listen and Spot.',110),
  ('mm1-rt-duergar-light','duergar',NULL,'Light Sensitivity','Dazzled in bright sunlight or within a daylight effect.',120),
  ('mm1-rt-duergar-no-familiarity','duergar',NULL,'No Dwarven Weapon Familiarity','Unlike other dwarves, duergar do not gain weapon familiarity with the dwarven waraxe or dwarven urgrosh.',130),

  ('mm1-rt-mountain-dwarf-speed','mountain-dwarf',NULL,'Steady Speed','Base speed 20 ft.; medium/heavy armor and medium/heavy loads do not reduce this speed.',10),
  ('mm1-rt-mountain-dwarf-darkvision','mountain-dwarf',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-mountain-dwarf-stonecunning','mountain-dwarf',NULL,'Stonecunning','+2 Search involving unusual stonework, passive checks within 10 ft., stonework-trap searching, and intuitive depth underground.',30),
  ('mm1-rt-mountain-dwarf-weapons','mountain-dwarf',NULL,'Weapon Familiarity','Treat dwarven waraxes and dwarven urgroshes as martial rather than exotic weapons.',40),
  ('mm1-rt-mountain-dwarf-stability','mountain-dwarf',NULL,'Stability','+4 on ability checks to resist bull rush or trip while standing firmly on the ground.',50),
  ('mm1-rt-mountain-dwarf-poison','mountain-dwarf',NULL,'Poison Resistance','+2 racial bonus on saving throws against poison.',60),
  ('mm1-rt-mountain-dwarf-magic','mountain-dwarf',NULL,'Magic Resistance','+2 racial bonus on saving throws against spells and spell-like effects.',70),
  ('mm1-rt-mountain-dwarf-enemies','mountain-dwarf',NULL,'Orc and Goblinoid Combat Training','+1 racial bonus on attack rolls against orcs, half-orcs, and goblinoids.',80),
  ('mm1-rt-mountain-dwarf-giants','mountain-dwarf',NULL,'Giant Dodging','+4 dodge bonus to Armor Class against creatures of the giant type.',90),
  ('mm1-rt-mountain-dwarf-craft','mountain-dwarf',NULL,'Stone and Metal Expertise','+2 racial bonus on Appraise and Craft checks related to stone or metal.',100),

  ('mm1-rt-aquatic-elf-sleep','aquatic-elf',NULL,'Sleep Immunity','Immune to magical sleep spells and effects.',10),
  ('mm1-rt-aquatic-elf-enchantment','aquatic-elf',NULL,'Enchantment Resistance','+2 racial bonus on saving throws against enchantment spells and effects.',20),
  ('mm1-rt-aquatic-elf-weapons','aquatic-elf',NULL,'Elven Weapon Proficiency','Proficient with longsword, rapier, longbow, composite longbow, shortbow, and composite shortbow.',30),
  ('mm1-rt-aquatic-elf-senses','aquatic-elf',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot; passive Search for secret/concealed doors within 5 ft.',40),
  ('mm1-rt-aquatic-elf-gills','aquatic-elf',NULL,'Gills','Can survive out of water for 1 hour per point of Constitution before suffocation rules apply.',50),
  ('mm1-rt-aquatic-elf-lowlight','aquatic-elf',NULL,'Superior Low-Light Vision','Can see four times as far as a human in low-light conditions.',60),

  ('mm1-rt-drow-sleep','drow',NULL,'Sleep Immunity','Immune to magical sleep spells and effects.',10),
  ('mm1-rt-drow-enchantment','drow',NULL,'Enchantment Resistance','+2 racial bonus on saving throws against enchantment spells and effects.',20),
  ('mm1-rt-drow-darkvision','drow',NULL,'Darkvision','Darkvision 120 ft.',30),
  ('mm1-rt-drow-senses','drow',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot; passive Search for secret/concealed doors within 5 ft.',40),
  ('mm1-rt-drow-sr','drow',NULL,'Spell Resistance','Spell resistance equals 11 + class levels.',50),
  ('mm1-rt-drow-will','drow',NULL,'Spell Will Resistance','+2 racial bonus on Will saves against spells and spell-like abilities.',60),
  ('mm1-rt-drow-spell-like','drow','mm1-sa-drow-spell-like','Spell-Like Abilities','Dancing lights, darkness, and faerie fire 1/day each.',70),
  ('mm1-rt-drow-weapons','drow',NULL,'Drow Weapon Proficiency','Proficient with hand crossbow, rapier, and short sword.',80),
  ('mm1-rt-drow-light','drow',NULL,'Light Blindness','Abrupt exposure to bright light blinds for 1 round; thereafter dazzled while exposure continues.',90),
  ('mm1-rt-drow-favored','drow',NULL,'Favored Class by Sex','Favored class is Wizard for male drow and Cleric for female drow.',100),

  ('mm1-rt-gray-elf-sleep','gray-elf',NULL,'Sleep Immunity','Immune to magical sleep spells and effects.',10),
  ('mm1-rt-gray-elf-enchantment','gray-elf',NULL,'Enchantment Resistance','+2 racial bonus on saving throws against enchantment spells and effects.',20),
  ('mm1-rt-gray-elf-lowlight','gray-elf',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-gray-elf-weapons','gray-elf',NULL,'Elven Weapon Proficiency','Proficient with longsword, rapier, longbow, composite longbow, shortbow, and composite shortbow.',40),
  ('mm1-rt-gray-elf-senses','gray-elf',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot; passive Search for secret/concealed doors within 5 ft.',50),

  ('mm1-rt-wild-elf-sleep','wild-elf',NULL,'Sleep Immunity','Immune to magical sleep spells and effects.',10),
  ('mm1-rt-wild-elf-enchantment','wild-elf',NULL,'Enchantment Resistance','+2 racial bonus on saving throws against enchantment spells and effects.',20),
  ('mm1-rt-wild-elf-lowlight','wild-elf',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-wild-elf-weapons','wild-elf',NULL,'Elven Weapon Proficiency','Proficient with longsword, rapier, longbow, composite longbow, shortbow, and composite shortbow.',40),
  ('mm1-rt-wild-elf-senses','wild-elf',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot; passive Search for secret/concealed doors within 5 ft.',50),

  ('mm1-rt-wood-elf-sleep','wood-elf',NULL,'Sleep Immunity','Immune to magical sleep spells and effects.',10),
  ('mm1-rt-wood-elf-enchantment','wood-elf',NULL,'Enchantment Resistance','+2 racial bonus on saving throws against enchantment spells and effects.',20),
  ('mm1-rt-wood-elf-lowlight','wood-elf',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-wood-elf-weapons','wood-elf',NULL,'Elven Weapon Proficiency','Proficient with longsword, rapier, longbow, composite longbow, shortbow, and composite shortbow.',40),
  ('mm1-rt-wood-elf-senses','wood-elf',NULL,'Keen Senses','+2 racial bonus on Listen, Search, and Spot; passive Search for secret/concealed doors within 5 ft.',50),

  ('mm1-rt-forest-gnome-lowlight','forest-gnome',NULL,'Low-Light Vision','Low-light vision.',10),
  ('mm1-rt-forest-gnome-weapons','forest-gnome',NULL,'Weapon Familiarity','Treat the gnome hooked hammer as a martial rather than exotic weapon.',20),
  ('mm1-rt-forest-gnome-illusion-save','forest-gnome',NULL,'Illusion Resistance','+2 racial bonus on saving throws against illusions.',30),
  ('mm1-rt-forest-gnome-illusion-dc','forest-gnome',NULL,'Illusion Affinity','+1 to the save DC of illusion spells cast by the forest gnome.',40),
  ('mm1-rt-forest-gnome-giants','forest-gnome',NULL,'Giant Dodging','+4 dodge bonus to Armor Class against creatures of the giant type.',50),
  ('mm1-rt-forest-gnome-skills','forest-gnome',NULL,'Gnome Skills','+2 racial bonus on Listen and Craft (alchemy).',60),
  ('mm1-rt-forest-gnome-pass','forest-gnome','mm1-sa-forest-gnome-pass-without-trace','Pass without Trace','Pass without trace on self as a free action.',70),
  ('mm1-rt-forest-gnome-enemies','forest-gnome',NULL,'Forest Combat Training','+1 racial bonus on attacks against kobolds, goblinoids, orcs, and reptilian humanoids.',80),
  ('mm1-rt-forest-gnome-hide','forest-gnome',NULL,'Woodland Camouflage','+4 racial bonus on Hide checks, increasing to +8 in wooded areas.',90),
  ('mm1-rt-forest-gnome-animal-speech','forest-gnome',NULL,'Forest Animal Speech','Can communicate at a very basic level with forest animals; this replaces the rock gnome speak-with-animals ability.',100),
  ('mm1-rt-forest-gnome-magic','forest-gnome','mm1-sa-forest-gnome-magic','Gnome Magic','With Charisma 10 or higher, retains dancing lights, ghost sound, and prestidigitation 1/day each.',110),

  ('mm1-rt-goblin-darkvision','goblin',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-goblin-skills','goblin',NULL,'Goblin Skills','+4 racial bonus on Move Silently and Ride checks.',20),
  ('mm1-rt-hobgoblin-darkvision','hobgoblin',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-hobgoblin-stealth','hobgoblin',NULL,'Hobgoblin Stealth','+4 racial bonus on Move Silently checks.',20),
  ('mm1-rt-kobold-darkvision','kobold',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-kobold-skills','kobold',NULL,'Kobold Skills','+2 racial bonus on Craft (trapmaking), Profession (miner), and Search checks.',20),
  ('mm1-rt-kobold-natural-armor','kobold',NULL,'Natural Armor','+1 natural armor bonus.',30),
  ('mm1-rt-kobold-light','kobold',NULL,'Light Sensitivity','Dazzled in bright sunlight or within a daylight effect.',40),
  ('mm1-rt-orc-darkvision','orc',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-orc-light','orc',NULL,'Light Sensitivity','Dazzled in bright sunlight or within a daylight effect.',20),

  ('mm1-rt-githyanki-darkvision','githyanki',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-githyanki-psionics','githyanki','mm1-sa-githyanki-psionics','Psionics','Scaling innate psionic spell-like abilities based on class level.',20),
  ('mm1-rt-githyanki-sr','githyanki',NULL,'Spell Resistance','Spell resistance equals class levels + 5.',30),
  ('mm1-rt-githyanki-dragon-pact','githyanki',NULL,'Red Dragon Pact','+4 racial bonus on Diplomacy checks when dealing with red dragons.',40),
  ('mm1-rt-githzerai-darkvision','githzerai',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-githzerai-psionics','githzerai','mm1-sa-githzerai-psionics','Psionics','Innate psionic spell-like abilities, with plane shift added at 11th level.',20),
  ('mm1-rt-githzerai-inertial','githzerai','mm1-sa-githzerai-inertial-armor','Inertial Armor','+4 armor bonus to Armor Class while conscious.',30),
  ('mm1-rt-githzerai-sr','githzerai',NULL,'Spell Resistance','Spell resistance equals class levels + 5.',40)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,parameters,effects)
SELECT
  t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r
  ON r.id='mm1-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  parameters=NULL,
  effects=NULL;
