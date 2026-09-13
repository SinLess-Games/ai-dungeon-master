-- Epic Level Handbook monster stat blocks, batch B.
-- Source: Epic Level Handbook, Chapter 5. These rows preserve the book's 3.0 stat blocks.
-- `space_feet` records the first dimension of the source Face/Reach entry; no silent 3.5 size-space conversion is applied.
-- `base_attack_bonus` is the creature-type BAB implied by source Hit Dice where the 3.0 stat block does not print BAB separately.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,
  natural_armor,deflection,bab,fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-ruin-swarm','213-214','ruin-swarm','Ruin Swarm',
 'A colossal flying ooze made from tens of thousands of vermin acting as one magically contaminated organism.',
 '50d10+540 ooze (815 hp). Fly 90 ft. (perfect). AC 18 from -8 size and +16 Dexterity. It has no normal attack routine: it engulfs Gargantuan or smaller creatures by moving through their area or by changing shape as a move-equivalent action. Engulf deals 6d6 damage each round, Reflex DC 46 half; engulfed creatures cannot see, move at half speed, need Concentration checks to cast, and must make Reflex DC 46 to run without falling. Blindsight 200 ft. and fast healing 15.',
 'ooze',23,50,10,540,'colossal',100,0,0,0,37,26,32,22,42,42,30,NULL,23,32,
 'Any','Solitary','None','N','Neutral','50-150 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"oozeTraits":true,"swarmTrait":"Despite originating as individual vermin, the ruin swarm is treated as one ooze organism.","blindsightFeet":200,"fastHealing":15}}}]'),

('elh-monster-brachyurus','170-171','brachyurus','Brachyurus',
 'A primordial, colossal-blooded wolf stock with supernatural senses, frightful hunting calls, and extraordinary resilience.',
 '38d10+684 magical beast (893 hp). Speed 80 ft. AC 40 from +14 Dexterity, -1 size, and +17 natural armor. Two claws +48 melee deal 2d6+10/19-20 and bite +46 deals 3d6+5/19-20. Frightful howl is a standard-action 60-ft.-radius spread affecting opponents with fewer Hit Dice or levels; Will DC 33 or shaken, and success grants one-day immunity to that brachyurus. A successfully tripped opponent is savaged for an automatic additional 15d6+25 damage. Blindsight 240 ft., darkvision 60 ft., low-light vision, scent, fast healing 10, SR 32, DR 30/+5 in the source''s 3.0 notation, and resistance 20 to acid, cold, electricity, fire, and sonic.',
 'magical-beast',23,38,10,684,'large',5,10,17,0,38,41,37,25,30,38,47,18,32,19,
 'Any','Solitary, pair, or pack (5-10)','Standard','LN','Usually lawful neutral','39-48 HD (Large); 49-58 HD (Huge); 59-66 HD (Gargantuan); 67-135 HD (Colossal)',
 '[{"kind":"resistance","damageType":"acid","amount":20},{"kind":"resistance","damageType":"cold","amount":20},{"kind":"resistance","damageType":"electricity","amount":20},{"kind":"resistance","damageType":"fire","amount":20},{"kind":"resistance","damageType":"sonic","amount":20},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":32,"damageReduction":{"amount":30,"bypass":"+5","editionNotation":"3.0"},"blindsightFeet":240,"fastHealing":10,"darkvisionFeet":60,"lowLightVision":true,"scent":true}}}]'),

('elh-monster-tayellah','220','tayellah','Tayellah',
 'A gargantuan three-headed feline hunter of supernatural origin with extreme speed, poison, pounce, and raking attacks.',
 '34d10+408 magical beast (595 hp). Speed 100 ft. AC 44 from +19 Dexterity, -4 size, +15 insight, and +4 natural armor. Two claws +44, three bites +39, and sting +37; bite 2d8+11, claw 2d6+5, sting 3d6+5 plus poison. Poison: Fortitude DC 39, initial and secondary 2d10 temporary Constitution. Pounce permits a full attack after its opening leap. Two successful claw attacks can establish improved grab; a held or pounced foe can be raked twice at +44 for 4d6+5 each. SR 34 and DR 15/+6 in the source''s 3.0 notation.',
 'magical-beast',24,34,10,408,'gargantuan',20,10,4,0,34,31,38,22,32,48,34,14,32,19,
 'Any temperate or cold land','Solitary or pair','None','N','Always neutral','35-68 HD (Gargantuan); 69-102 HD (Colossal)',
 '[{"kind":"modifier","target":{"kind":"stat","stat":"armor_class"},"amount":15,"bonusType":"insight"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":34,"damageReduction":{"amount":15,"bypass":"+6","editionNotation":"3.0"}}}}]'),

('elh-monster-thorciasid','220-221','thorciasid','Thorciasid',
 'An epic insectoid parasite that immobilizes prey in hardening cocoons and feeds by draining abilities and life energy.',
 '29d8+348 aberration (478 hp). Speed 70 ft. AC 42 from +14 Dexterity and +18 natural armor. Two forelimbs +36 melee touch each drain 1d4+1 Strength, 1d4+1 Dexterity, and 1 Constitution permanently; each successful ability drain heals the thorciasid 20 hp. Two antennae +30 melee touch each bestow one negative level; each negative level grants the thorciasid +1 Constitution for 24 hours, and the victim makes Fortitude DC 34 after 24 hours to avoid permanent level loss. Cocoon is a standard-action ranged touch attack out to 60 ft.; on a hit the victim opposes a +37 cocoon grapple check, failure leaves the victim treated as grappled while the thorciasid remains free. Each standard action spent reinforcing the cocoon adds +5 to its grapple modifier. Fully cocooned victims can still breathe. DR 20/+6 in source 3.0 notation, darkvision 240 ft., scent, SR 34, fire resistance 30.',
 'aberration',22,29,8,348,'medium',5,5,18,0,21,21,25,25,22,38,34,25,29,31,
 'Any','Solitary, pair, or infestation (4-7)','Standard','N','Usually neutral','30-36 HD (Medium); 37-42 HD (Large)',
 '[{"kind":"resistance","damageType":"fire","amount":30},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":34,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"darkvisionFeet":240,"scent":true}}}]'),

('elh-monster-elder-treant','223','elder-treant','Elder Treant',
 'A colossal and exceptionally ancient treant that animates whole groves and can trample structures and epic foes.',
 '50d8+800 plant (1,025 hp). Speed 60 ft. AC 41 from -1 Dexterity, -8 size, and +40 natural armor. Two slams +49 melee deal 10d6+19/19-20. It can animate trees within 500 ft. at will, controlling up to six at once; a tree requires a full round to uproot and then fights as a treant. It can trample Gargantuan or smaller creatures for 8d20+40; a creature that declines an attack of opportunity may attempt Reflex DC 54 for half. A full attack against an object or structure deals triple damage. Plant traits, half damage, SR 29, and DR 20/+6 in source 3.0 notation.',
 'plant',25,50,8,800,'colossal',40,25,40,0,37,45,17,33,48,8,42,19,33,35,
 'Any forest','Solitary or with grove of treants','Standard','NG','Always neutral good','51-150 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":29,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"plantTraits":true,"halfDamage":"Source special quality: half damage."}}}]')
)
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,base_attack_bonus,grapple_modifier,
   fort,ref,will,str,dex,con,int,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
       d.cr,1,d.hd,1,d.die,d.hp_bonus,d.size,d.space,d.reach,d.natural_armor,0,0,d.deflection,d.bab,NULL,
       d.fort,d.ref,d.will,d.str,d.dex,d.con,d.intel,d.wis,d.cha,d.environment,d.organization,d.treasure,d.alignment,d.alignment_text,d.advancement,NULL,d.defenses
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.source_id='elh-3.0' AND m.slug=d.slug AND m.owner_user_id IS NULL
);

WITH movement(monster_slug,mode,feet,maneuverability,rules_text) AS (VALUES
 ('ruin-swarm','fly',90,'perfect','The source gives flight as the ruin swarm''s only movement mode.'),
 ('brachyurus','land',80,NULL,NULL),
 ('tayellah','land',100,NULL,NULL),
 ('thorciasid','land',70,NULL,NULL),
 ('elder-treant','land',60,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;
