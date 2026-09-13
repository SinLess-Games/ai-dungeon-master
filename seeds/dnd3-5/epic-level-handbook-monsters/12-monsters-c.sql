-- Epic Level Handbook monster stat blocks, batch C.
-- Source: Epic Level Handbook, Chapter 5. Preserve the book's 3.0 statistics and terminology.
-- `space_feet` records the first source Face dimension; no automatic 3.5 space conversion is applied.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-behemoth-eagle','169-170','behemoth-eagle','Behemoth Eagle',
 'An intelligent, otherworldly eagle of truly colossal proportions.',
 '21d8+126 outsider (220 hp). Speed 20 ft., fly 160 ft. (poor). AC 24 from +12 Dexterity, -8 size, and +10 natural armor. Two claws +25 melee deal 5d10+7 and bite +15 deals 4d12+3. Evasion. SR 30 and DR 20/+6 in the source''s 3.0 notation. A behemoth eagle has a +8 racial bonus on Spot checks during daylight. Light load up to 2,400 lb.; medium 2,401-4,800 lb.; heavy 4,801-7,200 lb.',
 'outsider',18,21,8,126,'colossal',40,15,10,21,18,24,16,25,34,23,17,19,16,
 'Any forest, hills, mountains, and plains','Solitary or pair','None','N','Always neutral','21-42 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":30,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"evasion":true}}}]'),

('elh-monster-behemoth-gorilla','169-170','behemoth-gorilla','Behemoth Gorilla',
 'A huge extraplanar gorilla with massive claws, prodigious strength, and rending attacks.',
 '21d8+252 outsider (346 hp). Speed 60 ft., climb 30 ft. AC 38 from +8 Dexterity, -2 size, and +22 natural armor. Two claws +29 melee deal 4d8+10 and bite +24 deals 3d10+5. If both claw attacks hit, rend automatically deals an additional 8d8+20. Scent. SR 30 and DR 20/+6 in source 3.0 notation.',
 'outsider',19,21,8,252,'huge',10,10,22,21,24,20,16,31,26,35,6,15,12,
 'Warm forest and warm mountains','Solitary or company (5-8)','None','N','Always neutral','22-42 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":30,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"scent":true}}}]'),

('elh-monster-legendary-bear','201-202','legendary-bear','Legendary Bear',
 'An extraordinarily powerful but generally nonaggressive bear presented as an epic animal companion option.',
 '20d8+140 animal (230 hp). Speed 50 ft. AC 21 from +2 Dexterity, -1 size, and +10 natural armor. Two claws +27 melee deal 2d6+13 and bite +22 deals 4d6+6. Improved grab: a successful claw hit can start a grapple; successful later grapple checks deal claw damage. Scent.',
 'animal',9,20,8,140,'large',5,5,10,15,19,14,9,36,14,24,2,16,12,
 'Any forest, hills, mountains, plains, or underground','Solitary or pair','None','N','Always neutral','21-40 HD (Large)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"scent":true}}}]'),

('elh-monster-legendary-tiger','201-202','legendary-tiger','Legendary Tiger',
 'An exceptionally fierce legendary predator capable of pouncing, grappling, and raking prey.',
 '26d8+182 animal (299 hp). Speed 50 ft. AC 23 from +4 Dexterity, -1 size, and +10 natural armor. Two claws +29 melee deal 2d6+11 and bite +24 deals 2d8+5. Pounce allows a full attack after its opening leap. A bite can establish improved grab; a held or pounced foe can be raked twice at +30 for 2d6+5 each. Scent. Legendary tigers have +8 racial bonuses on Hide and Move Silently, with the Hide bonus improving to +16 in tall grass or heavy undergrowth.',
 'animal',10,26,8,182,'large',5,5,10,19,22,19,10,32,18,24,2,14,10,
 'Any forest, hills, mountains, plains, and underground','Solitary or pair','None','N','Always neutral','27-48 HD (Large)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"scent":true}}}]')
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
 ('behemoth-eagle','land',20,NULL,NULL),('behemoth-eagle','fly',160,'poor',NULL),
 ('behemoth-gorilla','land',60,NULL,NULL),('behemoth-gorilla','climb',30,NULL,NULL),
 ('legendary-bear','land',50,NULL,NULL),('legendary-tiger','land',50,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;
