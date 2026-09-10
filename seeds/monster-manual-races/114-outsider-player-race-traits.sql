-- Normalized racial traits and named abilities for Couatl, Lillend, Triton, and Xill.
-- Rules text is concise source-backed paraphrase for creator display and rules lookup.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-couatl-constrict','37','couatl-constrict','Constrict','Crush a creature held in a grapple.','A couatl that has established a grapple can deal its listed constrict damage with a successful grapple check.','extraordinary','none'),
  ('mm1-sa-couatl-improved-grab','37','couatl-improved-grab','Improved Grab','Start a grapple after a successful bite.','After hitting with its bite, a couatl can attempt to start a grapple as a free action without provoking an attack of opportunity; a successful hold allows constriction.','extraordinary','free'),
  ('mm1-sa-couatl-poison','37','couatl-poison','Poison','Strength-damaging venom delivered by the bite.','Injury poison; Fortitude save is Constitution-based. A failed save deals Strength damage initially and greater Strength damage as secondary damage.','extraordinary','none'),
  ('mm1-sa-couatl-psionics','37','couatl-psionics','Psionics','At-will innate magical effects described as psionics in the source entry.','At will: detect chaos, detect evil, detect good, detect law, detect thoughts, invisibility, plane shift, and self-only polymorph. Effective caster level 9th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-couatl-spellcasting','38','couatl-racial-spellcasting','Racial Sorcerer Spellcasting','Powerful innate arcane spellcasting from racial Hit Dice.','A couatl casts as a 9th-level sorcerer and can choose spells known from the sorcerer list plus the cleric list and the Air, Good, and Law domain lists as described by the source.','other','none'),
  ('mm1-sa-couatl-ethereal-jaunt','38','couatl-ethereal-jaunt','Ethereal Jaunt','Enter the Ethereal Plane innately.','Functions like ethereal jaunt at caster level 16th.','supernatural','standard'),
  ('mm1-sa-couatl-telepathy','38','couatl-telepathy','Telepathy 90 ft.','Mental communication with intelligent creatures.','Communicate telepathically with creatures within 90 feet that have an Intelligence score; no shared language is required.','supernatural','none'),

  ('mm1-sa-lillend-constrict','168','lillend-constrict','Constrict','Crush a grappled opponent with the serpentine lower body.','After establishing a hold with the tail, a lillend can deal its listed constrict damage on a successful grapple check.','extraordinary','none'),
  ('mm1-sa-lillend-improved-grab','168','lillend-improved-grab','Improved Grab','Start a grapple after a tail slap.','After hitting with its tail slap, a lillend can attempt to start a grapple as a free action without provoking; a successful hold enables constrict.','extraordinary','free'),
  ('mm1-sa-lillend-spellcasting','168','lillend-racial-bard-spellcasting','Racial Bard Spellcasting','Arcane bard spellcasting from racial Hit Dice.','A lillend casts arcane spells as a 6th-level bard.','other','none'),
  ('mm1-sa-lillend-spell-like','168','lillend-spell-like-abilities','Spell-Like Abilities','Innate utility, illusion, and communication magic.','Three times per day: darkness, hallucinatory terrain, knock, and light. Once per day: charm person, speak with animals, and speak with plants. Caster level 10th; save DCs are Charisma-based.','spell_like','standard'),

  ('mm1-sa-triton-summon','246','triton-summon-natures-ally','Summon Nature''s Ally IV','Call an allied natural creature once per day.','Use summon nature''s ally IV once per day at caster level 7th; tritons often summon water elementals.','spell_like','standard'),

  ('mm1-sa-xill-implant','260','xill-implant','Implant','Implant eggs in a helpless paralyzed creature.','As a standard action, implant eggs in a paralyzed creature. The infestation can be removed by the source-listed disease-removal magic or Heal check before the young emerge.','extraordinary','standard'),
  ('mm1-sa-xill-improved-grab','260','xill-improved-grab','Improved Grab','Use claw hits to seize an opponent.','After one or more claw hits, attempt a grapple as a free action without provoking. Multiple claw hits improve the grapple attempt; maintaining the hold allows the bite that delivers paralysis.','extraordinary','free'),
  ('mm1-sa-xill-paralysis','260','xill-paralysis','Paralysis','The xill bite delivers long-lasting paralytic venom.','A creature bitten by a xill must make a Constitution-based Fortitude save or become paralyzed for 1d4 hours.','extraordinary','none'),
  ('mm1-sa-xill-planewalk','260','xill-planewalk','Planewalk','Move between the Ethereal and Material Planes.','Cross from the Ethereal Plane with a move action. Returning takes two rounds during which the xill is immobile and increasingly difficult to hit; a willing or helpless creature can be brought along.','supernatural','move')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
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

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-couatl-large','couatl',NULL,'Large Build','Large size with the normal Large combat, Hide, grapple, lifting, carrying, space, and reach adjustments.',10),
  ('mm1-rt-couatl-rhd','couatl',NULL,'Racial Hit Dice','9d8 outsider racial Hit Dice; racial BAB +9 and base saves Fort +6, Ref +6, Will +6.',20),
  ('mm1-rt-couatl-flight','couatl',NULL,'Flight','Fly speed 60 ft. with good maneuverability.',30),
  ('mm1-rt-couatl-darkvision','couatl',NULL,'Darkvision','Darkvision 60 ft.',40),
  ('mm1-rt-couatl-natural-armor','couatl',NULL,'Natural Armor','+9 natural armor bonus.',50),
  ('mm1-rt-couatl-constrict','couatl','mm1-sa-couatl-constrict','Constrict','Constrict after establishing a grapple.',60),
  ('mm1-rt-couatl-grab','couatl','mm1-sa-couatl-improved-grab','Improved Grab','Bite can initiate a grapple without provoking.',70),
  ('mm1-rt-couatl-poison','couatl','mm1-sa-couatl-poison','Poison','Bite delivers Strength-damaging venom.',80),
  ('mm1-rt-couatl-psionics','couatl','mm1-sa-couatl-psionics','Psionics','At-will source-entry psionic spell-like abilities.',90),
  ('mm1-rt-couatl-spellcasting','couatl','mm1-sa-couatl-spellcasting','Racial Sorcerer Spellcasting','Casts as a 9th-level sorcerer using the expanded source-listed spell access.',100),
  ('mm1-rt-couatl-ethereal','couatl','mm1-sa-couatl-ethereal-jaunt','Ethereal Jaunt','Innate ethereal travel.',110),
  ('mm1-rt-couatl-telepathy','couatl','mm1-sa-couatl-telepathy','Telepathy','Telepathy 90 ft.',120),
  ('mm1-rt-couatl-skills','couatl',NULL,'Racial Skills','Monster-entry racial-HD class skills are Concentration, Diplomacy, Jump, Knowledge, Listen, Search, Sense Motive, Spellcraft, Spot, Survival, Tumble, and Use Magic Device.',130),
  ('mm1-rt-couatl-eschew','couatl',NULL,'Bonus Feat: Eschew Materials','Eschew Materials is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',140),

  ('mm1-rt-lillend-large','lillend',NULL,'Large Build','Large size with the normal Large combat, Hide, grapple, lifting, carrying, space, and reach adjustments.',10),
  ('mm1-rt-lillend-rhd','lillend',NULL,'Racial Hit Dice','7d8 outsider racial Hit Dice; racial BAB +7 and base saves Fort +5, Ref +5, Will +5.',20),
  ('mm1-rt-lillend-flight','lillend',NULL,'Flight','Fly speed 70 ft. with average maneuverability.',30),
  ('mm1-rt-lillend-darkvision','lillend',NULL,'Darkvision','Darkvision 60 ft.',40),
  ('mm1-rt-lillend-natural-armor','lillend',NULL,'Natural Armor','+5 natural armor bonus.',50),
  ('mm1-rt-lillend-poison-immunity','lillend',NULL,'Poison Immunity','Immune to poison.',60),
  ('mm1-rt-lillend-fire-resistance','lillend',NULL,'Fire Resistance','Resistance to fire 10.',70),
  ('mm1-rt-lillend-constrict','lillend','mm1-sa-lillend-constrict','Constrict','Constrict a creature held with the tail.',80),
  ('mm1-rt-lillend-grab','lillend','mm1-sa-lillend-improved-grab','Improved Grab','Tail slap can initiate a grapple without provoking.',90),
  ('mm1-rt-lillend-spellcasting','lillend','mm1-sa-lillend-spellcasting','Racial Bard Spellcasting','Casts as a 6th-level bard.',100),
  ('mm1-rt-lillend-spell-like','lillend','mm1-sa-lillend-spell-like','Spell-Like Abilities','Innate spell-like abilities at caster level 10th.',110),
  ('mm1-rt-lillend-bardic-music','lillend',NULL,'Bardic Music','Has bardic music as a 6th-level bard.',120),
  ('mm1-rt-lillend-aligned-weapons','lillend',NULL,'Aligned Natural Weapons','Natural weapons and wielded weapons count as chaotic-aligned and good-aligned for overcoming damage reduction.',130),
  ('mm1-rt-lillend-skills','lillend',NULL,'Racial Skills','Monster-entry racial-HD class skills are Appraise, Concentration, Diplomacy, Knowledge (arcana), Listen, Perform, Sense Motive, Spellcraft, Spot, and Survival. Lillends also have a racial Survival bonus.',140),

  ('mm1-rt-triton-rhd','triton',NULL,'Racial Hit Dice','3d8 outsider racial Hit Dice; racial BAB +3 and base saves Fort +3, Ref +3, Will +3.',10),
  ('mm1-rt-triton-aquatic','triton',NULL,'Native Water Outsider','Native and Water outsider subtypes.',20),
  ('mm1-rt-triton-darkvision','triton',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-triton-natural-armor','triton',NULL,'Natural Armor','+6 natural armor bonus.',40),
  ('mm1-rt-triton-swim','triton',NULL,'Powerful Swimmer','Swim speed 40 ft.; +8 racial bonus on Swim checks, may take 10 even when distracted or endangered, and may run while swimming in a straight line.',50),
  ('mm1-rt-triton-summon','triton','mm1-sa-triton-summon','Summon Nature''s Ally IV','Summon nature''s ally IV once per day at caster level 7th.',60),
  ('mm1-rt-triton-skills','triton',NULL,'Racial Skills','Monster-entry racial-HD class skills are Craft, Diplomacy, Hide, Listen, Move Silently, Ride, Search, Sense Motive, Spot, Survival, and Swim.',70),

  ('mm1-rt-xill-rhd','xill',NULL,'Racial Hit Dice','5d8 outsider racial Hit Dice; racial BAB +5 and base saves Fort +4, Ref +4, Will +4.',10),
  ('mm1-rt-xill-darkvision','xill',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-xill-natural-armor','xill',NULL,'Natural Armor','+7 natural armor bonus.',30),
  ('mm1-rt-xill-sr','xill',NULL,'Spell Resistance','Spell resistance 21.',40),
  ('mm1-rt-xill-implant','xill','mm1-sa-xill-implant','Implant','Can implant eggs in a paralyzed creature.',50),
  ('mm1-rt-xill-grab','xill','mm1-sa-xill-improved-grab','Improved Grab','Claw attacks can initiate a grapple without provoking.',60),
  ('mm1-rt-xill-paralysis','xill','mm1-sa-xill-paralysis','Paralysis','Bite can paralyze for 1d4 hours.',70),
  ('mm1-rt-xill-planewalk','xill','mm1-sa-xill-planewalk','Planewalk','Move between the Ethereal and Material Planes.',80),
  ('mm1-rt-xill-skills','xill',NULL,'Racial Skills','Monster-entry racial-HD class skills are Balance, Climb, Diplomacy, Escape Artist, Intimidate, Listen, Move Silently, Sense Motive, Spot, Tumble, and Use Rope.',90),
  ('mm1-rt-xill-multiattack','xill',NULL,'Bonus Feat: Multiattack','Multiattack is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',100)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
