-- Racial traits and reusable special abilities for the remaining DMG-listed Monster Manual PCs.
-- Text is a concise mechanical paraphrase of the Monster Manual v3.5 entries.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-lizardfolk-hold-breath','lizardfolk-hold-breath','Hold Breath','Remain underwater much longer than a typical land creature.','Can hold its breath for a number of rounds equal to four times its Constitution score before risking drowning.','extraordinary','none'),
  ('mm1-sa-troglodyte-stench','troglodyte-stench','Stench','An angry or frightened troglodyte emits a debilitating musk.','Living non-troglodytes within 30 feet must succeed on a Constitution-based Fortitude save or become sickened for 10 rounds; a successful save grants 24-hour immunity to that troglodyte. Poison immunity prevents the effect.','extraordinary','none'),
  ('mm1-sa-kuo-amphibious','kuo-toa-amphibious','Amphibious','Kuo-toas breathe with gills but can live on land.','Can survive indefinitely on land despite breathing by means of gills.','extraordinary','none'),
  ('mm1-sa-kuo-keen-sight','kuo-toa-keen-sight','Keen Sight','Independently focusing eyes detect otherwise hidden motion.','Can notice moving invisible or ethereal creatures; remaining perfectly still can avoid this sense.','extraordinary','none'),
  ('mm1-sa-kuo-slippery','kuo-toa-slippery','Slippery','An oily secretion makes confinement unusually difficult.','Unaffected by webs and unusually difficult to grapple or otherwise confine, as described by the source ability.','extraordinary','none'),
  ('mm1-sa-drider-poison','drider-poison','Poison','Venomous bite.','Bite poison deals 1d6 Strength initial and secondary damage; the Fortitude save is Constitution-based.','extraordinary','none'),
  ('mm1-sa-drider-spell-like','drider-spell-like-abilities','Drider Spell-Like Abilities','A suite of once-daily innate magic.','Once per day each: dancing lights, clairaudience/clairvoyance, darkness, detect good, detect law, detect magic, dispel magic, faerie fire, levitate, and suggestion. Caster level 6th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-drider-spellcasting','drider-racial-spellcasting','Racial Spellcasting','Driders possess innate spellcasting equivalent to a 6th-level spellcaster.','A drider casts as a 6th-level cleric, wizard, or sorcerer as selected for that individual. This racial casting remains distinct from class levels.','other','none'),
  ('mm1-sa-mind-flayer-mind-blast','mind-flayer-mind-blast','Mind Blast','A cone-shaped psionic assault stuns creatures.','60-foot cone; creatures that fail the Charisma-based Will save are stunned for 3d4 rounds. Equivalent to a 4th-level effect.','psi_like','standard'),
  ('mm1-sa-mind-flayer-psionics','mind-flayer-psionics','Psionics','At-will innate psionic magic.','At will: charm monster, detect thoughts, levitate, plane shift, and suggestion. Effective caster level 8th; save DCs are Charisma-based.','psi_like','standard'),
  ('mm1-sa-mind-flayer-improved-grab','mind-flayer-improved-grab','Improved Grab','Tentacles can establish a grapple without exposing the illithid to a counterattack.','After hitting a Small, Medium, or Large creature with a tentacle, may attempt to start a grapple as a free action without provoking an attack of opportunity.','extraordinary','none'),
  ('mm1-sa-mind-flayer-extract','mind-flayer-extract','Extract','Four attached tentacles can remove a victim’s brain.','If all four tentacles are attached at the start of the mind flayer’s turn, a successful grapple check extracts the target’s brain and normally kills it instantly; listed creature types are immune to the instant-kill effect.','extraordinary','none'),
  ('mm1-sa-yuan-poison','yuan-ti-poison','Poison','Venomous yuan-ti bite.','Injury poison deals 1d6 Constitution initial and secondary damage; save DC is Constitution-based.','extraordinary','none'),
  ('mm1-sa-yuan-produce-acid','yuan-ti-produce-acid','Produce Acid','Exude corrosive acid through the body.','Exude acid that deals 3d6 acid damage on the next touch or bite; while grappling, pinning, or constricting a foe the grasp deals 5d6 acid damage. The yuan-ti is immune to its own acid.','spell_like','standard'),
  ('mm1-sa-yuan-chameleon','yuan-ti-chameleon-power','Chameleon Power','Psionically match body and equipment coloration to the surroundings.','Gain a +10 circumstance bonus on Hide checks while using the chameleon power.','spell_like','standard'),
  ('mm1-sa-yuan-half-spell-like','yuan-ti-halfblood-spell-like-abilities','Yuan-ti Halfblood Spell-Like Abilities','Innate serpent magic.','Three times per day: animal trance, cause fear, entangle. Once per day: deeper darkness, neutralize poison, suggestion. Caster level 8th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-yuan-abom-aversion','yuan-ti-abomination-aversion','Aversion','Create a powerful supernatural aversion to snakes and yuan-ti.','Target one creature within 30 feet; on a failed Charisma-based Will save it must avoid snakes and yuan-ti for 10 minutes, with the additional effects described by the source ability.','spell_like','standard'),
  ('mm1-sa-yuan-abom-constrict','yuan-ti-abomination-constrict','Constrict','Crush a grappled foe.','Deals 1d6 + Strength-based bonus damage after a successful grapple check.','extraordinary','none'),
  ('mm1-sa-yuan-abom-improved-grab','yuan-ti-abomination-improved-grab','Improved Grab','A successful bite can establish a constricting hold.','After hitting a Large or smaller creature with its bite, may start a grapple as a free action without provoking an attack of opportunity; a successful hold enables constrict.','extraordinary','none'),
  ('mm1-sa-yuan-abom-spell-like','yuan-ti-abomination-spell-like-abilities','Yuan-ti Abomination Spell-Like Abilities','Powerful innate serpent magic.','At will: animal trance and entangle. Three times per day: deeper darkness, neutralize poison, suggestion. Once per day: baleful polymorph into snake form and fear. Caster level 10th; save DCs are Charisma-based.','spell_like','standard')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',NULL,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
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
  ('mm1-rt-bugbear-rhd','bugbear',NULL,'Racial Hit Dice','3d8 humanoid racial Hit Dice; racial BAB +2 and base saves Fort +1, Ref +3, Will +1.',10),
  ('mm1-rt-bugbear-darkvision','bugbear',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-bugbear-natural-armor','bugbear',NULL,'Natural Armor','+3 natural armor bonus.',30),
  ('mm1-rt-bugbear-sneaky','bugbear',NULL,'Sneaky','+4 racial bonus on Move Silently checks.',40),
  ('mm1-rt-bugbear-skills','bugbear',NULL,'Racial Skills','Racial-HD class skills are Climb, Hide, Listen, Move Silently, Search, and Spot.',50),

  ('mm1-rt-gnoll-rhd','gnoll',NULL,'Racial Hit Dice','2d8 humanoid racial Hit Dice; racial BAB +1 and base saves Fort +3, Ref +0, Will +0.',10),
  ('mm1-rt-gnoll-darkvision','gnoll',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-gnoll-natural-armor','gnoll',NULL,'Natural Armor','+1 natural armor bonus.',30),
  ('mm1-rt-gnoll-skills','gnoll',NULL,'Racial Skills','Racial-HD class skills are Listen and Spot.',40),

  ('mm1-rt-lizardfolk-rhd','lizardfolk',NULL,'Racial Hit Dice','2d8 humanoid racial Hit Dice; racial BAB +1 and base saves Fort +0, Ref +3, Will +0.',10),
  ('mm1-rt-lizardfolk-darkvision','lizardfolk',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-lizardfolk-natural-armor','lizardfolk',NULL,'Natural Armor','+5 natural armor bonus.',30),
  ('mm1-rt-lizardfolk-natural-weapons','lizardfolk',NULL,'Natural Weapons','Two claws (1d4 each) and a bite (1d4).',40),
  ('mm1-rt-lizardfolk-hold-breath','lizardfolk','mm1-sa-lizardfolk-hold-breath','Hold Breath','Hold breath for four times Constitution score in rounds before drowning checks begin.',50),
  ('mm1-rt-lizardfolk-skills','lizardfolk',NULL,'Racial Skills','Racial-HD class skills are Balance, Jump, and Swim; +4 racial bonus on Balance, Jump, and Swim checks.',60),
  ('mm1-rt-lizardfolk-proficiency','lizardfolk',NULL,'Weapon Proficiency','Automatically proficient with simple weapons and shields.',70),

  ('mm1-rt-troglodyte-rhd','troglodyte',NULL,'Racial Hit Dice','2d8 humanoid racial Hit Dice; racial BAB +1 and base saves Fort +3, Ref +0, Will +0.',10),
  ('mm1-rt-troglodyte-darkvision','troglodyte',NULL,'Darkvision','Darkvision 90 ft.',20),
  ('mm1-rt-troglodyte-natural-armor','troglodyte',NULL,'Natural Armor','+6 natural armor bonus.',30),
  ('mm1-rt-troglodyte-natural-weapons','troglodyte',NULL,'Natural Weapons','Two claws (1d4 each) and a bite (1d4).',40),
  ('mm1-rt-troglodyte-stench','troglodyte','mm1-sa-troglodyte-stench','Stench','Nearby living creatures can be sickened by the troglodyte’s musk.',50),
  ('mm1-rt-troglodyte-hide','troglodyte',NULL,'Chameleon Skin','+4 racial bonus on Hide checks, increasing to +8 in rocky or underground surroundings.',60),
  ('mm1-rt-troglodyte-multiattack','troglodyte',NULL,'Bonus Feat: Multiattack','Multiattack is a fixed racial bonus feat and is recorded as a trait until fixed race-feat grants are modeled explicitly.',70),
  ('mm1-rt-troglodyte-skills','troglodyte',NULL,'Racial Skills','Racial-HD class skills are Hide and Listen.',80),

  ('mm1-rt-kuo-rhd','kuo-toa',NULL,'Racial Hit Dice','2d8 monstrous humanoid racial Hit Dice; racial BAB +2 and base saves Fort +0, Ref +3, Will +3 before ability modifiers and feats.',10),
  ('mm1-rt-kuo-darkvision','kuo-toa',NULL,'Darkvision','Darkvision 60 ft. from the monstrous humanoid type.',20),
  ('mm1-rt-kuo-natural-armor','kuo-toa',NULL,'Natural Armor','+6 natural armor bonus.',30),
  ('mm1-rt-kuo-amphibious','kuo-toa','mm1-sa-kuo-amphibious','Amphibious','Can survive indefinitely on land.',40),
  ('mm1-rt-kuo-immunities','kuo-toa',NULL,'Immunities','Immune to poison and paralysis.',50),
  ('mm1-rt-kuo-electricity','kuo-toa',NULL,'Electricity Resistance','Resistance to electricity 10.',60),
  ('mm1-rt-kuo-keen-sight','kuo-toa','mm1-sa-kuo-keen-sight','Keen Sight','Can notice moving invisible or ethereal creatures.',70),
  ('mm1-rt-kuo-light-blindness','kuo-toa',NULL,'Light Blindness','Abrupt bright light blinds for 1 round; afterward the kuo-toa is dazzled while in bright light.',80),
  ('mm1-rt-kuo-slippery','kuo-toa','mm1-sa-kuo-slippery','Slippery','Oily skin defeats webs and helps escape confinement.',90),
  ('mm1-rt-kuo-skills','kuo-toa',NULL,'Racial Skills','Racial-HD class skills include Craft or Knowledge, Escape Artist, Listen, Move Silently, Search, Spot, and Swim; the race has substantial racial bonuses to Escape Artist, Search, Spot, and Swim.',100),
  ('mm1-rt-kuo-alertness','kuo-toa',NULL,'Bonus Feat: Alertness','Alertness is a fixed racial bonus feat.',110),

  ('mm1-rt-drider-rhd','drider',NULL,'Racial Hit Dice','6d8 aberration racial Hit Dice; racial BAB +4 and base saves Fort +2, Ref +2, Will +5.',10),
  ('mm1-rt-drider-large','drider',NULL,'Large Build','Large size; 10-ft. space and 5-ft. reach.',20),
  ('mm1-rt-drider-darkvision','drider',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-drider-natural-armor','drider',NULL,'Natural Armor','+6 natural armor bonus.',40),
  ('mm1-rt-drider-poison','drider','mm1-sa-drider-poison','Poison','Venomous bite damages Strength.',50),
  ('mm1-rt-drider-spell-like','drider','mm1-sa-drider-spell-like','Spell-Like Abilities','Once-daily innate magic at caster level 6th.',60),
  ('mm1-rt-drider-spellcasting','drider','mm1-sa-drider-spellcasting','Racial Spellcasting','Casts as a 6th-level cleric, wizard, or sorcerer; this is racial casting independent of class levels.',70),
  ('mm1-rt-drider-sr','drider',NULL,'Spell Resistance','Spell resistance 17 in the base source entry.',80),
  ('mm1-rt-drider-skills','drider',NULL,'Racial Skills','Racial-HD class skills are Climb, Concentration, Hide, Listen, Move Silently, and Spot.',90),

  ('mm1-rt-yuan-half-rhd','yuan-ti-halfblood',NULL,'Racial Hit Dice','7d8 monstrous humanoid racial Hit Dice; racial BAB +7 and base saves Fort +2, Ref +5, Will +5.',10),
  ('mm1-rt-yuan-half-darkvision','yuan-ti-halfblood',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-yuan-half-natural-armor','yuan-ti-halfblood',NULL,'Natural Armor','+4 natural armor bonus.',30),
  ('mm1-rt-yuan-half-poison','yuan-ti-halfblood','mm1-sa-yuan-poison','Poison','Bite poison deals Constitution damage.',40),
  ('mm1-rt-yuan-half-acid','yuan-ti-halfblood','mm1-sa-yuan-produce-acid','Produce Acid','Exude damaging acid through touch, bite, or a grapple.',50),
  ('mm1-rt-yuan-half-spell-like','yuan-ti-halfblood','mm1-sa-yuan-half-spell-like','Spell-Like Abilities','Innate serpent magic at caster level 8th.',60),
  ('mm1-rt-yuan-half-alternate','yuan-ti-halfblood','mm1-sa-yuan-pureblood-alternate-form','Alternate Form','Assume the form of a Tiny through Large viper.',70),
  ('mm1-rt-yuan-half-detect','yuan-ti-halfblood','mm1-sa-yuan-pureblood-detect-poison','Detect Poison','Detect poison at caster level 6th.',80),
  ('mm1-rt-yuan-half-chameleon','yuan-ti-halfblood','mm1-sa-yuan-chameleon','Chameleon Power','Gain +10 circumstance bonus on Hide while matching surroundings.',90),
  ('mm1-rt-yuan-half-scent','yuan-ti-halfblood',NULL,'Scent','Scent special quality.',100),
  ('mm1-rt-yuan-half-sr','yuan-ti-halfblood',NULL,'Spell Resistance','Spell resistance 16 in the base source entry.',110),
  ('mm1-rt-yuan-half-skills','yuan-ti-halfblood',NULL,'Racial Skills','Racial-HD class skills include Concentration, Craft or Knowledge, Hide, Listen, and Spot.',120),

  ('mm1-rt-mind-rhd','mind-flayer',NULL,'Racial Hit Dice','8d8 aberration racial Hit Dice; racial BAB +6 and base saves Fort +2, Ref +2, Will +6.',10),
  ('mm1-rt-mind-darkvision','mind-flayer',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-mind-natural-armor','mind-flayer',NULL,'Natural Armor','+3 natural armor bonus.',30),
  ('mm1-rt-mind-tentacles','mind-flayer',NULL,'Natural Weapons','Four tentacle attacks, each dealing 1d4 base damage.',40),
  ('mm1-rt-mind-blast','mind-flayer','mm1-sa-mind-flayer-mind-blast','Mind Blast','60-foot cone can stun creatures for 3d4 rounds.',50),
  ('mm1-rt-mind-psionics','mind-flayer','mm1-sa-mind-flayer-psionics','Psionics','At-will charm monster, detect thoughts, levitate, plane shift, and suggestion.',60),
  ('mm1-rt-mind-grab','mind-flayer','mm1-sa-mind-flayer-improved-grab','Improved Grab','Tentacle hits can initiate grapples as a free action.',70),
  ('mm1-rt-mind-extract','mind-flayer','mm1-sa-mind-flayer-extract','Extract','Four attached tentacles can extract a victim’s brain.',80),
  ('mm1-rt-mind-sr','mind-flayer',NULL,'Spell Resistance','Spell resistance 25 + class levels.',90),
  ('mm1-rt-mind-telepathy','mind-flayer',NULL,'Telepathy','Telepathy 100 ft.',100),
  ('mm1-rt-mind-skills','mind-flayer',NULL,'Racial Skills','Racial-HD class skills are Bluff, Concentration, Hide, Intimidate, Knowledge, Listen, Move Silently, and Spot.',110),

  ('mm1-rt-yuan-abom-rhd','yuan-ti-abomination',NULL,'Racial Hit Dice','9d8 monstrous humanoid racial Hit Dice; racial BAB +9 and base saves Fort +3, Ref +6, Will +6.',10),
  ('mm1-rt-yuan-abom-large','yuan-ti-abomination',NULL,'Large Build','Large size; 10-ft. space and 10-ft. reach.',20),
  ('mm1-rt-yuan-abom-darkvision','yuan-ti-abomination',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-yuan-abom-natural-armor','yuan-ti-abomination',NULL,'Natural Armor','+10 natural armor bonus.',40),
  ('mm1-rt-yuan-abom-aversion','yuan-ti-abomination','mm1-sa-yuan-abom-aversion','Aversion','Create a supernatural aversion to snakes and yuan-ti.',50),
  ('mm1-rt-yuan-abom-constrict','yuan-ti-abomination','mm1-sa-yuan-abom-constrict','Constrict','Crush a grappled foe.',60),
  ('mm1-rt-yuan-abom-grab','yuan-ti-abomination','mm1-sa-yuan-abom-improved-grab','Improved Grab','A bite can establish a constricting hold.',70),
  ('mm1-rt-yuan-abom-poison','yuan-ti-abomination','mm1-sa-yuan-poison','Poison','Bite poison deals Constitution damage.',80),
  ('mm1-rt-yuan-abom-acid','yuan-ti-abomination','mm1-sa-yuan-produce-acid','Produce Acid','Exude damaging acid.',90),
  ('mm1-rt-yuan-abom-spell-like','yuan-ti-abomination','mm1-sa-yuan-abom-spell-like','Spell-Like Abilities','Powerful innate serpent magic at caster level 10th.',100),
  ('mm1-rt-yuan-abom-alternate','yuan-ti-abomination','mm1-sa-yuan-pureblood-alternate-form','Alternate Form','Assume Tiny through Large viper forms.',110),
  ('mm1-rt-yuan-abom-detect','yuan-ti-abomination','mm1-sa-yuan-pureblood-detect-poison','Detect Poison','Detect poison at caster level 6th.',120),
  ('mm1-rt-yuan-abom-chameleon','yuan-ti-abomination','mm1-sa-yuan-chameleon','Chameleon Power','Gain +10 circumstance bonus on Hide while matching surroundings.',130),
  ('mm1-rt-yuan-abom-scent','yuan-ti-abomination',NULL,'Scent','Scent special quality.',140),
  ('mm1-rt-yuan-abom-sr','yuan-ti-abomination',NULL,'Spell Resistance','Spell resistance 18 in the base source entry.',150),
  ('mm1-rt-yuan-abom-skills','yuan-ti-abomination',NULL,'Racial Skills','Racial-HD class skills include Concentration, Craft or Knowledge, Hide, Listen, Move Silently, and Spot; +8 racial bonus on Swim checks.',160)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
