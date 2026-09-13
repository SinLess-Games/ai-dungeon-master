-- Epic Level Handbook monster stat blocks: primal elementals.
-- Source: Epic Level Handbook, Chapter 5, pp. 187-189.
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
('elh-monster-primal-air-elemental','187-188','primal-air-elemental','Primal Air Elemental',
 'The most potent incarnation of elemental air, moving with the speed and force of an entire storm.',
 '96d8+864 elemental (1,296 hp). Fly 100 ft. (perfect). AC 66 from -8 size, +16 Dexterity, and +48 natural armor. Slam attacks +81/+76/+71/+66 deal 4d8+16. Air mastery imposes -1 on airborne creatures'' attack and damage rolls against it. Once every 10 minutes it can become a whirlwind for up to 48 rounds, moving at its fly speed and using the standard air-elemental whirlwind rules scaled to its size and Hit Dice. Elemental traits, DR 35/+8, SR 42, air subtype.',
 'elemental',35,96,8,864,'colossal',40,25,48,72,43,68,35,32,43,28,8,13,13,
 'Any land','Solitary','None','N','Usually neutral','97-288 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"elementalTraits":true,"spellResistance":42,"damageReduction":{"amount":35,"bypass":"+8","editionNotation":"3.0"},"airMastery":{"airborneOpponentAttackPenalty":-1,"airborneOpponentDamagePenalty":-1},"whirlwind":{"frequency":"once every 10 minutes","maximumRounds":48},"immunities":["poison","sleep","paralysis","stunning","critical hits"]}}}]'),

('elh-monster-primal-earth-elemental','187-188','primal-earth-elemental','Primal Earth Elemental',
 'The most potent incarnation of elemental earth, a continent-shaking mass of stone and mineral.',
 '96d8+960 elemental (1,392 hp). Speed 20 ft., burrow 40 ft. AC 49 from -8 size, -1 Dexterity, and +48 natural armor. Slam attacks +83/+78/+73/+68 deal 4d10+24 and threaten 19-20. Earth mastery and push function as for an earth elemental. Elemental traits, DR 35/+8 plus an additional 9/- from epic Damage Reduction feats, SR 42, earth subtype.',
 'elemental',35,96,8,960,'colossal',40,25,48,72,60,33,35,43,8,31,8,13,13,
 'Any land','Solitary','None','N','Usually neutral','97-288 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"elementalTraits":true,"spellResistance":42,"damageReduction":{"amount":35,"bypass":"+8","editionNotation":"3.0"},"secondaryDamageReduction":"9/-","earthMastery":true,"push":true,"immunities":["poison","sleep","paralysis","stunning","critical hits"]}}}]'),

('elh-monster-primal-fire-elemental','187-189','primal-fire-elemental','Primal Fire Elemental',
 'The most potent incarnation of elemental fire, a colossal inferno that burns everything around it.',
 '96d8+864 elemental (1,296 hp). Speed 50 ft. AC 64 from -8 size, +14 Dexterity, and +48 natural armor. Slam attacks +79/+74/+69/+64 deal 4d8+16 plus 4d8 fire. It has the standard fire-elemental burn ability scaled by this stat block. Elemental traits, DR 35/+8, SR 42, fire subtype.',
 'elemental',35,96,8,864,'colossal',40,25,48,72,43,66,39,32,39,28,8,13,13,
 'Any land','Solitary','None','N','Usually neutral','97-288 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"elementalTraits":true,"spellResistance":42,"damageReduction":{"amount":35,"bypass":"+8","editionNotation":"3.0"},"fireSubtype":true,"burn":true,"immunities":["poison","sleep","paralysis","stunning","critical hits","fire"],"coldVulnerability":true}}}]'),

('elh-monster-primal-water-elemental','187-189','primal-water-elemental','Primal Water Elemental',
 'The most potent incarnation of elemental water, a moving mass of oceanic force.',
 '96d8+960 elemental (1,392 hp). Speed 20 ft., swim 90 ft. AC 64 from -8 size, +14 Dexterity, and +48 natural armor. Slam attacks +81/+76/+71/+66 deal 4d10+24 and threaten 19-20. Water mastery, drench, and vortex function as for a water elemental, scaled to this stat block. Elemental traits, DR 35/+8 plus an additional 9/- from epic Damage Reduction feats, SR 42, water subtype.',
 'elemental',35,96,8,960,'colossal',40,25,48,72,60,48,35,42,38,31,8,13,13,
 'Any land','Solitary','None','N','Usually neutral','97-288 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"elementalTraits":true,"spellResistance":42,"damageReduction":{"amount":35,"bypass":"+8","editionNotation":"3.0"},"secondaryDamageReduction":"9/-","waterMastery":true,"drench":true,"vortex":true,"immunities":["poison","sleep","paralysis","stunning","critical hits"]}}}]')
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
 ('primal-air-elemental','fly',100,'perfect',NULL),
 ('primal-earth-elemental','land',20,NULL,NULL),('primal-earth-elemental','burrow',40,NULL,NULL),
 ('primal-fire-elemental','land',50,NULL,NULL),
 ('primal-water-elemental','land',20,NULL,NULL),('primal-water-elemental','swim',90,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('primal-air-elemental','air'),
 ('primal-earth-elemental','earth'),
 ('primal-fire-elemental','fire'),
 ('primal-water-elemental','water')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
