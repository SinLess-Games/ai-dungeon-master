-- Deities and Demigods: named Asgardian divine companions and mounts.
-- Source: Deities and Demigods (2002), Chapter 6, pp. 169, 175-176, 190, 194, 201,
-- plus the official v3.5 Deities and Demigods revision update.
-- Creatures explicitly superseded by Monster Manual II references are kept as revision/reference rules instead of stale live monster rows.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

-- Hugin and Munin: no replacement stat block is specified by the official revision.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-hugin-munin','dd-3.0','169','hugin-and-munin','Hugin and Munin',
  'Odin''s legendary ravens, Thought and Memory, sent through the Asgardian worlds to gather news.',
  'CR 6; Small animal; 12d8+36 (132 hp); Init +8; speed 10 ft., fly 100 ft. average; printed AC 23 (touch 21, flat-footed 15); 2 claws +17 melee (1d6+2), bite +10 melee (1d8+1); Fort +11, Ref +18, Will +7; Str 14, Dex 30, Con 16, Int 2, Wis 16, Cha 12; Listen +12, Spot +12; Weapon Finesse (claws), Weapon Finesse (bite). Source anomaly: the printed AC components implied by Small size and Dex 30 can support AC 23 with +2 natural armor, but that would normally produce flat-footed AC 13 rather than the printed 15; retain the printed values as source facts rather than silently recalculating them.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='animal' AND owner_user_id IS NULL LIMIT 1),
  6,1,12,1,8,36,
  'small',5,5,2,0,0,0,
  9,7,11,18,7,14,30,16,2,16,12,
  'Asgard','Pair; Hugin and Munin are normally encountered together','None','N','Neutral',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='hugin-and-munin' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES
  ('dd-monster-hugin-munin','land',10,NULL,'Printed land speed.'),
  ('dd-monster-hugin-munin','fly',100,'average','Printed flight speed and maneuverability.');

-- Gullin-Bursti uses the explicit official 3.5 revision values where the update changes the printed boar.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-gullin-bursti','dd-3.0','175-176; official 3.5 update p. 11','gullin-bursti','Gullin-Bursti (Golden Bristles)',
  'Frey''s enormous golden-bristled divine boar, able to fly and shed torch-bright light.',
  'Original block: CR 8 Huge animal; 21d8+105 (273 hp); Init -1; speed 80 ft., fly 100 ft. good; AC 17 (touch 7, flat-footed 17); bite +25 melee (1d8+12); ferocity, light, scent; Fort +17, Ref +11, Will +8; Str 35, Dex 8, Con 21, Int 2, Wis 13, Cha 8. Ferocity lets it continue fighting while disabled or dying; its bristles shed light as a torch. Official 3.5 update: space/reach 15 ft./20 ft.; Listen +15, Spot +15; feats Alertness, Endurance, Run, Stealthy, Toughness x3, Weapon Focus (gore); revised HD 21d8+114 (282 hp); attack +26 melee (1d8+12, gore); LA -. The live chassis uses those explicit revision values.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='animal' AND owner_user_id IS NULL LIMIT 1),
  8,1,21,1,8,114,
  'huge',15,20,10,0,0,0,
  15,35,17,11,8,35,8,21,2,13,8,
  'Asgard','Solitary','None','N','Neutral',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='gullin-bursti' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES
  ('dd-monster-gullin-bursti','land',80,NULL,'Printed land speed.'),
  ('dd-monster-gullin-bursti','fly',100,'good','Printed flight speed and maneuverability.');

-- Skadi's awakened dire bear. The printed block calls it a magical beast but its attack progression reflects animal-style BAB; preserve the block as printed.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-skadi-awakened-dire-bear','dd-3.0','190','skadi-awakened-dire-bear','Skadi''s Awakened Dire Bear',
  'Skadi''s intelligent awakened dire-bear animal companion.',
  'CR 9; Large magical beast; 14d8+56 (119 hp); Init +1; speed 40 ft.; AC 17 (touch 10, flat-footed 16); 2 claws +19 melee (1d6+10), bite +14 melee (1d8+5); printed Face/Reach 10 ft. by 20 ft./10 ft.; improved grab; low-light vision, scent; Fort +13, Ref +10, Will +5; Str 31, Dex 13, Con 19, Int 11, Wis 12, Cha 12; Hide -3, Listen +7, Spot +7, Swim +13. Source-mechanics note: although the block labels the awakened bear a magical beast, the printed +19 claw attack is consistent with animal-style BAB 10 for 14 HD rather than full magical-beast BAB; base_attack_bonus therefore preserves the printed chassis rather than reverse-engineering a stronger attack routine.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='magical-beast' AND owner_user_id IS NULL LIMIT 1),
  9,1,14,1,8,56,
  'large',10,10,7,0,0,0,
  10,24,13,10,5,31,13,19,11,12,12,
  'Asgard','Solitary','None','N','Neutral',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='skadi-awakened-dire-bear' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-skadi-awakened-dire-bear','land',40,NULL,'Printed land speed.');

-- Tanngrisnir and Tanngjost share one identical stat block and are represented as a paired companion entry.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-tanngrisnir-tanngjost','dd-3.0','194','tanngrisnir-and-tanngjost','Tanngrisnir and Tanngjost',
  'The legendary goats that pull Thor''s folding chariot and can be restored after being slaughtered for food.',
  'CR 6; Large animal; 8d8+24 (88 hp); Init +0; speed 80 ft., fly 100 ft. good; AC 11 (touch 9, flat-footed 11); butt +11 melee (1d8+5); Fort +9, Ref +6, Will +2; Str 21, Dex 11, Con 16, Int 2, Wis 11, Cha 4; Listen +8, Spot +8. Re-form: Thor can slaughter and eat the goats in the evening, then bless their bundled skins and bones the next morning to restore them. All skins and bones must remain present and whole; missing or damaged remains cause the restored goat to return appropriately injured. The printed attack bonus is one point above ordinary 8-HD animal BAB + Strength + size arithmetic; preserve the printed attack in rules text rather than altering the base-attack column.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='animal' AND owner_user_id IS NULL LIMIT 1),
  6,1,8,1,8,24,
  'large',10,5,2,0,0,0,
  6,15,9,6,2,21,11,16,2,11,4,
  'Asgard','Pair','None','N','Neutral',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='tanngrisnir-and-tanngjost' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES
  ('dd-monster-tanngrisnir-tanngjost','land',80,NULL,'Printed land speed.'),
  ('dd-monster-tanngrisnir-tanngjost','fly',100,'good','Printed flight speed and maneuverability.');

-- Valkyrie special mount: the source supplies an explicit CR, so it can be a concrete monster row.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-valkyrie-mount','dd-3.0','201','valkyrie-mount','Valkyrie''s Mount',
  'A powerful celestial pegasus serving as the special mount of an Asgardian valkyrie.',
  'CR 12; Large outsider; 12d8+36 (90 hp); Init +6; speed 60 ft., fly 120 ft. good; AC 21 (touch 11, flat-footed 19); 2 hooves +17 melee (1d8+6), bite +12 melee (1d8+3); spell-like abilities; command, improved evasion, scent, SR 25; alignment NG; Fort +11, Ref +10, Will +11; Str 22, Dex 15, Con 16, Int 10, Wis 13, Cha 13. Skills: Diplomacy +3, Hide -2, Intimidate +16, Intuit Direction +11, Listen +16, Search +11, Sense Motive +16, Spot +16, Wilderness Lore +16; +4 racial bonus on Listen and Spot. Feats: Flyby Attack, Improved Initiative, Iron Will, Wingover. Spell-like abilities: detect good and detect evil at will in a 60-yard radius as a 5th-level sorcerer. Under the official 3.5 paladin revision, a valkyrie''s special mount is summoned rather than treated as permanently present; this stat block remains the creature used when summoned.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  12,1,12,1,8,36,
  'large',10,5,10,0,0,0,
  12,21,11,10,11,22,15,16,10,13,13,
  'Asgard','Special mount; normally associated with one valkyrie','None','NG','Neutral good',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='valkyrie-mount' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES
  ('dd-monster-valkyrie-mount','land',60,NULL,'Printed land speed.'),
  ('dd-monster-valkyrie-mount','fly',120,'good','Printed flight speed and maneuverability.');

-- Revision/reference records for named companions whose 3.0 DDG blocks are explicitly superseded,
-- plus Skirnir, whose printed block lacks a CR and therefore should not be forced into dnd35_monsters.
WITH desired(slug,name,page,summary,tags,mechanics) AS (VALUES
('dd-companion-freke-gere-reference','Freke and Gere Revision Reference','169; official 3.5 update p. 11',
 'Odin''s legendary wolves have printed Deities and Demigods statistics, but the official 3.5 update explicitly redirects revised play to the Monster Manual II legendary wolf.',
 '["deities-and-demigods","asgardian","companion","odin","freke","gere","revision-reference"]',
 '{"names":["Freke","Gere"],"owner":"Odin","printed3_0":{"challengeRating":7,"type":"Medium animal","hitDice":"14d8+70","hitPoints":182,"speedFeet":60,"armorClass":24,"touchAc":19,"flatFootedAc":15,"bite":"+17 melee, 2d6+10","specialAttack":"trip","specialQuality":"scent","alignment":"N","saves":{"fort":8,"ref":10,"will":3},"abilities":{"str":24,"dex":28,"con":20,"int":2,"wis":14,"cha":10}},"revision3_5":{"superseded":true,"replacement":"Use the Legendary Wolf in the Monster Manual II revision section referenced by the official Deities and Demigods update."},"runtimePolicy":"Do not seed the obsolete DDG 3.0 chassis as the active 3.5 monster while the MMII replacement has not yet been imported."}'),
('dd-companion-sleipnir-reference','Sleipnir Revision Reference','169; official 3.5 update p. 11',
 'Odin''s eight-legged legendary horse has a printed Deities and Demigods block, but the official 3.5 update redirects revised play to the Monster Manual II legendary horse.',
 '["deities-and-demigods","asgardian","companion","odin","sleipnir","revision-reference"]',
 '{"name":"Sleipnir","owner":"Odin","printed3_0":{"challengeRating":8,"type":"Large animal","hitDice":"18d8+144","hitPoints":288,"speed":{"land":80,"fly":100,"maneuverability":"good"},"armorClass":19,"touchAc":11,"flatFootedAc":17,"attacks":["4 hooves +22 melee, 2d6+9","bite +20 melee, 1d6+4"],"specialQuality":"scent","alignment":"N","saves":{"fort":20,"ref":13,"will":8},"abilities":{"str":28,"dex":14,"con":26,"int":2,"wis":14,"cha":10}},"revision3_5":{"superseded":true,"replacement":"Use the Legendary Horse in the Monster Manual II revision section referenced by the official Deities and Demigods update."},"runtimePolicy":"Do not seed the obsolete DDG 3.0 chassis as the active 3.5 monster while the MMII replacement has not yet been imported."}'),
('dd-companion-blodug-hofi-reference','Blodug-Hofi Revision Reference','175; official 3.5 update p. 11',
 'Frey''s legendary horse has a printed Deities and Demigods block, but the official 3.5 update redirects revised play to the Monster Manual II legendary horse.',
 '["deities-and-demigods","asgardian","companion","frey","blodug-hofi","revision-reference"]',
 '{"name":"Blodug-Hofi","owner":"Frey","printed3_0":{"challengeRating":8,"type":"Large animal","hitDice":"18d8+144","hitPoints":288,"speed":{"land":80,"fly":100,"maneuverability":"good"},"armorClass":19,"touchAc":11,"flatFootedAc":17,"attacks":["2 hooves +22 melee, 2d6+9","bite +17 melee, 1d6+4"],"specialQuality":"scent","alignment":"N","saves":{"fort":20,"ref":13,"will":8},"abilities":{"str":28,"dex":14,"con":26,"int":2,"wis":14,"cha":10}},"revision3_5":{"superseded":true,"replacement":"Use the Legendary Horse in the Monster Manual II revision section referenced by the official Deities and Demigods update."},"runtimePolicy":"Do not seed the obsolete DDG 3.0 chassis as the active 3.5 monster while the MMII replacement has not yet been imported."}'),
('dd-companion-skirnir','Skirnir, Frey''s Shield-Man','176; official 3.5 update pp. 4, 11',
 'Frey''s shield-man is a divine-rank-0 20th-level paladin. The source gives a full combat block but no CR, so it is retained as a structured rule rather than assigned an invented challenge rating.',
 '["deities-and-demigods","asgardian","companion","frey","skirnir","quasi-deity","revision-3.5"]',
 '{"name":"Skirnir","owner":"Frey","divineRank":0,"gender":"male","class":"Paladin 20","printedType":"Medium humanoid","hitDice":"20d10+120","hitPoints":320,"initiative":4,"speedFeet":120,"armorClass":32,"touchAc":12,"flatFootedAc":32,"attacks":["Frey''s sword +34/+29/+24/+19 melee, 1d8+17/15-20","animated bashing large shield +25 melee, 1d8"],"printedSmiteEvil":{"attackBonus":2,"damageBonus":20},"printedTurnUndeadUsesPerDay":5,"specialQualities":["aura of courage","detect evil","divine grace","divine health","lay on hands 40 hp/day","remove disease 6/week","quasi-deity traits"],"alignment":"LG","saves":{"fort":23,"ref":11,"will":13},"abilities":{"str":26,"dex":10,"con":22,"int":8,"wis":15,"cha":14},"skills":{"Concentration":16,"Diplomacy":22,"Handle Animal":22,"Heal":22,"Jump":2,"Knowledge (religion)":9,"Ride (horse)":20},"feats":["Cleave","Great Cleave","Improved Critical (longsword)","Improved Initiative","Power Attack","Sunder","Weapon Focus (longsword)"],"challengeRating":"not explicitly printed; intentionally not invented","revision3_5":{"quasiDeityTraits":{"immunities":["transmutation","energy drain","ability drain","ability damage","mind-affecting effects"],"damageReduction":"10/epic","fireResistance":5,"spellResistance":32,"immortal":true},"extraOutsiderSkillPoints":false,"extraOutsiderSkillPointsReason":"The official revision explicitly names Skirnir among divine beings with no monster Hit Dice that gain no additional outsider skill points unless they have bard or ranger levels.","paladin":{"smiteEvilUsesPerDay":5,"specialMount":"Use revised summoned special-mount rules if a mount is added through the class feature."}}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.summary,
       'Use the structured source and revision payload. Explicit official replacement references supersede the printed 3.0 companion chassis for 3.5 runtime use.',
       0,NULL,1,'monster','revision-note',0,1,'dd-asgardian-pantheon',NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);