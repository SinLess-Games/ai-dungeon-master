-- Epic Level Handbook sample dragon stat blocks.
-- Source: Epic Level Handbook, Chapter 5, pp. 181-186.
-- Preserve the book's 3.0 statistics and terminology.
-- Colossal+ is represented as size=colossal with the source's Colossal+ state retained in defenses JSON.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-advanced-red-great-wyrm','181-182','advanced-red-great-wyrm','Red Great Wyrm, Advanced',
 'The handbook''s sample standard dragon advanced seven virtual age categories beyond great wyrm to 61 Hit Dice.',
 '61d12+1,037 dragon (1,433 hp). Speed 40 ft., fly 250 ft. (clumsy). AC 70 from -8 size, +3 Dexterity, +60 natural armor, and +5 bracers of armor. Bite +77 deals 8d6+24; two claws +73 deal 4d8+12; two wings +72 deal 4d6+12; tail slap +72 deals 4d8+36. Crush 8d6+36 (DC 57), tail sweep 4d6+36 (DC 57), 80-ft. cone breath weapon for 38d10 fire (Reflex DC 57 half), frightful presence DC 51, caster level 33rd, and spell-like abilities. DR 35/+6, SR 46, blindsight, keen senses with darkvision 7,600 ft., sleep/paralysis immunity, and fire subtype.',
 'dragon',39,61,12,1037,'colossal',40,20,60,5,0,61,49,35,43,59,16,45,32,33,32,
 'Warm mountains','Solitary, pair, or family (1-2 and 2-5 offspring)','Triple standard','CE','Always chaotic evil','61 HD sample; advanced from red great wyrm by seven virtual age categories',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"colossalPlus":true,"damageReduction":{"amount":35,"bypass":"+6","editionNotation":"3.0"},"spellResistance":46,"blindsight":true,"keenSenses":{"darkvisionFeet":7600},"immunities":["sleep","paralysis","fire"],"coldVulnerability":"double damage except on successful save","casterLevel":33,"breathWeapon":{"shape":"cone","lengthFeet":80,"damage":"38d10 fire","reflexDc":57,"success":"half"},"frightfulPresenceDc":51}}}}]'),

('elh-monster-force-dragon-adult','184','force-dragon-adult','Force Dragon, Adult',
 'The handbook''s sample adult force dragon, a Gargantuan neutral epic dragon protected by a sheath of force.',
 '45d12+585 dragon (877 hp). Speed 60 ft., fly 300 ft. (clumsy). AC 64 from -4 size, +14 deflection, and +44 natural armor. Bite +61 deals 4d6+20; two claws +56 deal 2d8+10; two wings +56 deal 2d6+10; tail slap +56 deals 2d8+30. Crush 4d6+30 (DC 45), tail sweep 2d6+30 (DC 45), 60-ft. cone of force for 30d12 (Reflex DC 45 half), frightful presence DC 46, caster level 18th, and spell-like abilities. DR 30/+6, SR 39, blindsight, keen senses, force immunity, deflecting force equal to Charisma bonus, and continuous blur for 20% miss chance.',
 'dragon',31,45,12,585,'gargantuan',20,15,44,0,14,45,37,24,38,51,10,37,38,39,38,
 'Any land and underground','Solitary, pair, or family (1-2 and 2-5 offspring)','Double standard','N','Usually neutral','46-49 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"dragonSubtype":"force","damageReduction":{"amount":30,"bypass":"+6","editionNotation":"3.0"},"spellResistance":39,"blindsight":true,"keenSenses":true,"immunities":["sleep","paralysis","force effects"],"passesThroughForceBarriers":true,"deflectingForce":14,"blurMissChancePercent":20,"casterLevel":18,"breathWeapon":{"shape":"cone","lengthFeet":60,"damage":"30d12 force","reflexDc":45,"success":"half"},"frightfulPresenceDc":46,"spellLikeAbilities":{"usesPerDay":3,"abilities":["Otiluke''s resilient sphere","wall of force"]}}}}]'),

('elh-monster-prismatic-dragon-old','186','prismatic-dragon-old','Prismatic Dragon, Old',
 'The handbook''s sample old prismatic dragon, a Colossal neutral dragon wrapped in a shimmering shield of multicolored light.',
 '58d12+1,102 dragon (1,479 hp). Speed 60 ft., fly 300 ft. (clumsy). AC 78 from -8 size, +19 deflection, and +57 natural armor. Bite +74 deals 4d8+23; two claws +69 deal 4d6+11; two wings +68 deal 2d8+11; tail slap +69 deals 4d6+34. Crush 4d8+34 (DC 58), tail sweep 2d8+34 (DC 58), 70-ft. cone of prismatic spray (Reflex DC 58 half), frightful presence DC 58, caster level 26th, and spell-like abilities. DR 40/+10, SR 66, blindsight, keen senses, deflecting force +19, sleep/paralysis immunity, and immunity to light and blindness effects.',
 'dragon',48,58,12,1102,'colossal',40,15,57,0,19,58,50,31,50,57,10,49,48,49,48,
 'Any land and underground','Solitary, pair, or family (1-2 and 2-5 offspring)','Double standard','N','Usually neutral','59-62 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"dragonSubtype":"light","damageReduction":{"amount":40,"bypass":"+10","editionNotation":"3.0"},"spellResistance":66,"blindsight":true,"keenSenses":true,"immunities":["sleep","paralysis","light effects","blindness effects"],"deflectingForce":19,"casterLevel":26,"breathWeapon":{"shape":"cone","lengthFeet":70,"effect":"prismatic spray","reflexDc":58,"success":"half"},"frightfulPresenceDc":58,"spellLikeAbilities":{"atWill":["hypnotic pattern","rainbow pattern"],"threePerDay":["sunbeam","sunburst"]}}}}]')
)
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,base_attack_bonus,grapple_modifier,
   fort,ref,will,str,dex,con,int,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
       d.cr,1,d.hd,1,d.die,d.hp_bonus,d.size,d.space,d.reach,d.natural_armor,d.armor_bonus,0,d.deflection_bonus,d.bab,NULL,
       d.fort,d.ref,d.will,d.str,d.dex,d.con,d.intel,d.wis,d.cha,d.environment,d.organization,d.treasure,d.alignment,d.alignment_text,d.advancement,NULL,d.defenses
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.source_id='elh-3.0' AND m.slug=d.slug AND m.owner_user_id IS NULL
);

WITH movement(monster_slug,mode,feet,maneuverability,rules_text) AS (VALUES
 ('advanced-red-great-wyrm','land',40,NULL,NULL),('advanced-red-great-wyrm','fly',250,'clumsy',NULL),
 ('force-dragon-adult','land',60,NULL,NULL),('force-dragon-adult','fly',300,'clumsy',NULL),
 ('prismatic-dragon-old','land',60,NULL,NULL),('prismatic-dragon-old','fly',300,'clumsy',NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('advanced-red-great-wyrm','fire')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
