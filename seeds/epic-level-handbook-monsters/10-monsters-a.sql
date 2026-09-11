-- Epic Level Handbook monster stat blocks, batch A.
-- Source: Epic Level Handbook, Chapter 5. These rows preserve the book's 3.0 stat blocks.
-- `space_feet` records the first dimension of the source's Face/Reach entry; no silent 3.5 size-space conversion is applied.
-- `base_attack_bonus` is the creature-type BAB implied by the source Hit Dice and is stored so the typed monster schema can represent the 3.0 blocks.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,
  natural_armor,deflection,bab,fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-shadow-of-the-void','214-215','shadow-of-the-void','Shadow of the Void',
 'A towering incorporeal undead spirit of black, cold blightfire.',
 '35d12 undead. Source AC 48 includes -1 size, +9 Dexterity, +10 deflection, and +20 insight. Incorporeal touch +25 deals 2d6 plus blightfire. Blightfire forces Fortitude DC 37 and can permanently drain 6 Constitution each round for seven rounds; each successful drain heals the shadow for 30, with excess becoming temporary hit points. Humanoids slain become enslaved winterwights in 1d4 rounds. Spell-like abilities 3/day: deeper darkness and Otiluke''s freezing sphere, caster level 24, save DC 20 + spell level. Turn resistance +6, cold aura, SR 36, DR 20/+6 in the source''s 3.0 notation.',
 'undead',26,35,12,0,'large',5,10,0,10,17,13,20,26,NULL,29,NULL,21,25,31,
 'Any','Solitary or gang (2-5)','None','LE','Always lawful evil','36-42 HD (Large); 43-70 HD (Huge)',
 '[{"kind":"modifier","target":{"kind":"stat","stat":"armor_class"},"amount":20,"bonusType":"insight"},{"kind":"immunity","subject":"cold"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":36,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"turnResistance":6,"incorporeal":true,"coldAura":{"radiusFeet":10,"coldDamagePerRound":"2d10","coldCreaturesFastHealing":10,"undeadColdCreaturesTurnResistance":6}}}}]'),

('elh-monster-shape-of-fire','215-216','shape-of-fire','Shape of Fire',
 'A towering incorporeal undead spirit of white-hot blazefire.',
 '35d12 undead. Source AC 48 includes -1 size, +9 Dexterity, +10 deflection, and +20 insight. Incorporeal touch +25 deals 2d6 plus blazefire. Blazefire forces Fortitude DC 27 and permanently removes 10 hit points on each failed save for seven rounds; those hit points cannot be naturally or magically restored. The shape heals the same amount drained, with excess as temporary hit points. Humanoids slain become enslaved lavawights in 1d4 rounds. Spell-like abilities 3/day: fire storm and incendiary cloud, caster level 24, save DC 20 + spell level. Turn resistance +6, heat aura, SR 36, DR 20/+6 in the source''s 3.0 notation.',
 'undead',26,35,12,0,'large',5,10,0,10,17,13,20,26,NULL,29,NULL,21,25,31,
 'Any','Solitary or gang (2-5)','None','LE','Always lawful evil','36-42 HD (Large); 43-70 HD (Huge)',
 '[{"kind":"modifier","target":{"kind":"stat","stat":"armor_class"},"amount":20,"bonusType":"insight"},{"kind":"immunity","subject":"fire"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":36,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"turnResistance":6,"incorporeal":true,"heatAura":{"radiusFeet":10,"fireDamagePerRound":"2d10","fireCreaturesFastHealing":10,"undeadFireCreaturesTurnResistance":6},"coldVulnerability":"double damage except on a successful save"}}}]'),

('elh-monster-winterwight','227-228','winterwight','Winterwight',
 'A skeletal undead horror sheathed in supernatural ice and crowned in black flame.',
 '32d12 undead. AC 46 from +8 Dexterity and +28 natural armor. Two claws +40 melee deal 3d8+21, threaten 19-20, deal +1d6 on a critical hit, and carry blightfire; skull butt +32 deals 2d6+10 plus blightfire. Hitting with both claws rends for 6d8+31. Blightfire is Fortitude DC 35 and drains 4 Constitution on each failed save for five rounds, healing the winterwight 10 per successful drain. At-will spell-like abilities: cone of cold, control weather, dimension door, spell immunity (fireball), sleet storm, and wall of ice; caster level 23, save DC 19 + spell level. Cold aura, SR 34, DR 20/+6 in 3.0 notation, and overlapping icy hardness DR 10/-.',
 'undead',23,32,12,0,'medium',5,5,28,0,16,10,18,24,52,27,NULL,10,22,28,
 'Any','Solitary or pair','Standard','CE','Always chaotic evil','33-42 HD (Medium); 43-55 HD (Huge)',
 '[{"kind":"immunity","subject":"cold"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":34,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"icyHardness":{"amount":10,"bypass":"none","overlapsStandardDr":true},"coldAura":{"radiusFeet":10,"coldDamagePerRound":"2d10","coldCreaturesFastHealing":10,"undeadColdCreaturesTurnResistance":6},"fireVulnerability":"double damage except on a successful save"}}}]'),

('elh-monster-lavawight','200-201','lavawight','Lavawight',
 'A skeletal undead horror sheathed in molten rock and crowned in white flame.',
 '32d12 undead. AC 46 from +8 Dexterity and +28 natural armor. Two claws +38 melee deal 3d8+21, threaten 19-20, deal +1d6 on a critical hit, and carry blazefire; skull butt +32 deals 2d6+10 plus blazefire. Hitting with both claws rends for 6d8+31. Blazefire is Fortitude DC 35 and permanently removes 4 hit points on each failed save for seven rounds; those hit points cannot be restored naturally or magically, and each drain heals the lavawight by the same amount. At-will spell-like abilities: dimension door, flame arrow, spell immunity (sleet storm), fireball, and wall of fire; caster level 22, save DC 19 + spell level. Heat aura, SR 34, DR 20/+6 in 3.0 notation, and overlapping fiery hardness DR 10/-.',
 'undead',23,32,12,0,'medium',5,5,28,0,16,10,18,24,52,27,NULL,10,22,28,
 'Any','Solitary or pair','Standard','CE','Chaotic evil','33-42 HD (Medium); 43-55 HD (Huge)',
 '[{"kind":"immunity","subject":"fire"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":34,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"fieryHardness":{"amount":10,"bypass":"none","overlapsStandardDr":true},"heatAura":{"radiusFeet":10,"fireDamagePerRound":"2d10","fireCreaturesFastHealing":10,"undeadFireCreaturesTurnResistance":6},"coldVulnerability":"double damage except on a successful save"}}}]'),

('elh-monster-umbral-blot','223-224','umbral-blot','Umbral Blot (Blackball)',
 'A silent sphere of annihilating void created as a construct of extraordinary epic power.',
 '57d10 construct. Fly 90 feet with perfect maneuverability. AC 40 from +10 Dexterity and +20 natural armor. Disintegrating touch +42 melee touch deals 5d6 and disintegrates material on a failed Fortitude DC 38 save. Vortex pulls flying creatures within 30 feet into contact on Reflex DC 38 and nonflying creatures on Reflex DC 19. Immune to disintegration effects in addition to construct immunities. Can use ethereal jaunt, dimension door, teleport without error, or plane shift at will as a standard action. Blindsight 200 feet, fast healing 10, SR 44, and acid/cold/electricity/fire/sonic resistance 30.',
 'construct',32,57,10,0,'medium',5,5,20,0,42,19,29,29,10,30,NULL,20,30,30,
 'Any','Solitary','None','N','Always neutral','58-63 HD (Medium); 64-79 HD (Large); 80-95 HD (Huge); 96-171 HD (Gargantuan)',
 '[{"kind":"resistance","damageType":"acid","amount":30},{"kind":"resistance","damageType":"cold","amount":30},{"kind":"resistance","damageType":"electricity","amount":30},{"kind":"resistance","damageType":"fire","amount":30},{"kind":"resistance","damageType":"sonic","amount":30},{"kind":"immunity","subject":"disintegration spells and variations"},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":44,"blindsightFeet":200,"fastHealing":10,"constructTraits":true}}}]')
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
 ('shadow-of-the-void','land',30,NULL,NULL),('shadow-of-the-void','fly',60,'good','Source supernatural/incorporeal flight.'),
 ('shape-of-fire','land',30,NULL,NULL),('shape-of-fire','fly',60,'good','Source supernatural/incorporeal flight.'),
 ('winterwight','land',60,NULL,NULL),
 ('lavawight','land',60,NULL,NULL),
 ('umbral-blot','fly',90,'perfect','The source gives no land speed; movement is flight only.')
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype_data(monster_slug,subtype_slug) AS (VALUES
 ('shadow-of-the-void','incorporeal'),('shadow-of-the-void','cold'),
 ('shape-of-fire','incorporeal'),('shape-of-fire','fire'),
 ('winterwight','cold'),('lavawight','fire')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype_data d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
