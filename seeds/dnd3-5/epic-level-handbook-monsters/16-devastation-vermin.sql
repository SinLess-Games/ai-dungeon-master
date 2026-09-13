-- Epic Level Handbook monster stat blocks: devastation vermin.
-- Source: Epic Level Handbook, Chapter 5, pp. 177-179.
-- Preserve the book's 3.0 statistics and terminology.
-- `space_feet` records the first source Face dimension; no automatic 3.5 space conversion is applied.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-devastation-centipede','177-179','devastation-centipede','Devastation Centipede',
 'A colossal, mindless centipede from an alternate multiverse, capable of consuming creatures as it crosses enormous distances.',
 '128d8+1,152 vermin (1,728 hp). Speed 80 ft. AC 55 from -8 size, +13 Dexterity, and +40 natural armor. Bite +99 deals 20d10+16 plus poison. Bite poison: Fortitude DC 93; initial and secondary damage 2d12 temporary Dexterity. Darkvision 300 ft., SR 50, DR 40/+9, and vermin traits.',
 'vermin',39,128,8,1152,'colossal',50,20,40,96,75,55,42,33,37,29,NULL,10,2,
 'Any land','Solitary or cluster (2-5)','None','N','Always neutral','None',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"verminTraits":true,"darkvisionFeet":300,"spellResistance":50,"damageReduction":{"amount":40,"bypass":"+9","editionNotation":"3.0"},"poison":{"delivery":"bite","save":"Fortitude","dc":93,"initial":"2d12 temporary Dexterity","secondary":"2d12 temporary Dexterity"}}}}]'),

('elh-monster-devastation-spider','177-179','devastation-spider','Devastation Spider',
 'A colossal devastation spider appearing as either a faster hunter or a web-spinner that traps prey in gigantic sheets of silk.',
 '128d8+1,280 vermin (1,856 hp). Web-spinner speed 60 ft., climb 40 ft.; hunter speed 80 ft., climb 40 ft. AC 58 from -8 size, +14 Dexterity, and +42 natural armor. Bite +101 deals 18d10+19 plus poison. Poison: Fortitude DC 94; initial and secondary damage 2d12 temporary Constitution. A web-spinner can throw web eight times/day to 150 ft. with 30-ft. range increment against targets up to Gargantuan; Escape Artist DC 38 or Strength DC 44 escapes/breaks it. Sheet webs can cover roughly 1,000 square feet, require Spot DC 20 to notice, each 5-ft. section has 24 hp and DR 20/fire. Darkvision 300 ft., SR 50, DR 35/+8, vermin traits.',
 'vermin',41,128,8,1280,'colossal',120,20,42,96,76,56,42,37,39,30,NULL,10,2,
 'Any land','Solitary or cluster (2-5)','None','N','Always neutral','None',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"verminTraits":true,"darkvisionFeet":300,"spellResistance":50,"damageReduction":{"amount":35,"bypass":"+8","editionNotation":"3.0"},"variants":{"webSpinner":{"landSpeedFeet":60,"climbSpeedFeet":40,"webUsesPerDay":8,"webMaxRangeFeet":150,"webRangeIncrementFeet":30,"escapeArtistDc":38,"breakDc":44,"sheetWebSpotDc":20,"sheetWebHpPerFiveFeet":24,"sheetWebDamageReduction":"20/fire"},"hunter":{"landSpeedFeet":80,"climbSpeedFeet":40}},"poison":{"delivery":"bite","save":"Fortitude","dc":94,"initial":"2d12 temporary Constitution","secondary":"2d12 temporary Constitution"}}}}]'),

('elh-monster-devastation-scorpion','178-179','devastation-scorpion','Devastation Scorpion',
 'A colossal devastation scorpion built to seize, crush, and poison even enormous prey.',
 '128d8+1,408 vermin (1,984 hp). Speed 100 ft. AC 60 from -8 size, +12 Dexterity, and +46 natural armor. Two claws +102 deal 10d10+14 and sting +97 deals 8d10+7 plus poison. Improved grab begins with a claw hit; after gaining a hold on a Gargantuan or smaller foe, squeeze automatically deals both claw attacks and the sting. Sting poison: Fortitude DC 95; initial and secondary damage 2d12 temporary Strength. Darkvision 300 ft., SR 50, DR 45/+8, vermin traits.',
 'vermin',42,128,8,1408,'colossal',120,20,46,96,77,54,42,38,35,32,NULL,10,2,
 'Any land','Solitary or cluster (2-5)','None','N','Always neutral','None',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"verminTraits":true,"darkvisionFeet":300,"spellResistance":50,"damageReduction":{"amount":45,"bypass":"+8","editionNotation":"3.0","sourceNote":"OCR renders the printed 45 as 4S in some text extraction."},"improvedGrab":true,"squeeze":"automatic two-claw and sting damage against held Gargantuan or smaller opponent","poison":{"delivery":"sting","save":"Fortitude","dc":95,"initial":"2d12 temporary Strength","secondary":"2d12 temporary Strength"}}}}]'),

('elh-monster-devastation-beetle','178-179','devastation-beetle','Devastation Beetle',
 'The largest devastation vermin, a colossal beetle surrounded by a constant cloud of corrosive vapor.',
 '128d8+2,304 vermin (2,880 hp). Speed 70 ft. AC 72 from -8 size, +10 Dexterity, and +60 natural armor. Bite +104 deals 25d10+24. It can trample Gargantuan and smaller creatures for 30d10+24; creatures that forgo attacks of opportunity may attempt Reflex DC 90 for half. Its constant acid cloud extends 60 ft. in every direction and deals 6d6 acid damage each round. Darkvision 300 ft., SR 60, DR 50/+10, vermin traits.',
 'vermin',50,128,8,2304,'colossal',100,20,60,96,84,52,42,42,31,46,NULL,10,9,
 'Any land','Solitary or cluster (2-5)','None','N','Always neutral','None',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"verminTraits":true,"darkvisionFeet":300,"spellResistance":60,"damageReduction":{"amount":50,"bypass":"+10","editionNotation":"3.0"},"trample":{"maximumVictimSize":"Gargantuan","damage":"30d10+24","reflexDc":90,"success":"half","saveAvailableIfVictimDoesNotTakeAttackOfOpportunity":true},"acidCloud":{"radiusFeet":60,"damagePerRound":"6d6 acid"}}}}]')
)
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,base_attack_bonus,grapple_modifier,
   fort,ref,will,str,dex,con,int,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
       d.cr,1,d.hd,1,d.die,d.hp_bonus,d.size,d.space,d.reach,d.natural_armor,0,0,0,d.bab,NULL,
       d.fort,d.ref,d.will,d.str,d.dex,d.con,d.intel,d.wis,d.cha,d.environment,d.organization,d.treasure,d.alignment,d.alignment_text,d.advancement,NULL,d.defenses
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.source_id='elh-3.0' AND m.slug=d.slug AND m.owner_user_id IS NULL
);

WITH movement(monster_slug,mode,feet,maneuverability,rules_text) AS (VALUES
 ('devastation-centipede','land',80,NULL,NULL),
 ('devastation-spider','land',60,NULL,'Web-spinner speed; hunter variant has land speed 80 ft.'),
 ('devastation-spider','climb',40,NULL,'Both web-spinner and hunter variants.'),
 ('devastation-scorpion','land',100,NULL,NULL),
 ('devastation-beetle','land',70,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;
