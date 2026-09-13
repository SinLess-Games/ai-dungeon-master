-- Epic Level Handbook monster stat blocks: abominations, batch A.
-- Source: Epic Level Handbook, Chapter 5, pp. 158-162.
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
('elh-monster-anaxim','158-159','anaxim','Anaxim',
 'A failed divine construct of whirling blades, clockwork, iron fists, and other forge-born mechanisms that gained a spark of quasi-divine life.',
 '38d10 construct/outsider (380 hp). Speed 60 ft., fly 200 ft. (perfect). AC 37 from +7 Dexterity and +20 natural armor. It attacks with two spinning blades +40 melee (2d6+12), two slams +35 (2d6+6), a shocking touch +35 melee touch (2d6+6), or at range with an electricity ray +35 ranged touch (10d6 electricity) and six spikes +30 ranged (2d6+12; 120-ft. range increment). If both spinning blades hit, rend deals 4d6+18. As a standard action its sonic blast is a 60-foot cone dealing 20d6 sonic damage, Reflex DC 29 half. At will: greater dispelling, displacement, improved invisibility, ethereal jaunt (CL 22nd; save DC 15 + spell level). It can summon an iron golem up to four times per day. Abomination traits, magic immunity, construct traits, fast healing 15, SR 34, DR 30/+6.',
 'construct',22,38,10,0,'medium',5,5,20,28,12,19,17,35,25,NULL,20,20,20,
 'Any','Solitary, binary (pair), or command line (2-5 anaxims and 5-12 iron golems)','Standard','LN','Always lawful neutral','39-48 HD (Large); 49-55 HD (Huge); 56-70 HD (Gargantuan); 71-140 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"constructTraits":true,"magicImmunity":true,"fastHealing":15,"spellResistance":34,"damageReduction":{"amount":30,"bypass":"+6","editionNotation":"3.0"},"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]'),

('elh-monster-atropal','159-160','atropal','Atropal',
 'A stillborn godling that rises as an undead abomination, radiating soul-numbing negative energy.',
 '66d12 undead/outsider (792 hp). Speed 5 ft., fly 240 ft. (perfect). AC 51 from -1 size, +2 Dexterity, and +40 natural armor. Two melee touch attacks +49 deal 2d6 Constitution drain and threaten 19-20; its eye ray is +30 ranged touch and inflicts negative levels, also threatening 19-20. Energy drain inflicts 2d4 negative levels (Fortitude DC 59). It also has spell-like abilities, can summon a nightcrawler, rebukes/commands undead, and projects a negative-energy aura. Abomination and undead traits, regeneration 20, SR 42, DR 40/+8.',
 'undead',30,66,12,0,'large',5,10,40,33,22,26,43,43,15,NULL,28,22,42,
 'Any','Solitary','Standard','LE','Always lawful evil','67-80 HD (Large); 81-100 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"undeadTraits":true,"regeneration":20,"spellResistance":42,"damageReduction":{"amount":40,"bypass":"+8","editionNotation":"3.0"},"negativeEnergyAura":true,"rebukeCommandUndead":true,"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]'),

('elh-monster-chichimec','160-161','chichimec','Chichimec',
 'A many-winged air abomination, unwanted offspring of deities associated with sky and air.',
 '27d8+189 outsider (405 hp). Speed 5 ft., fly 200 ft. (perfect). AC 39 from +7 Dexterity and +22 natural armor. Two primary wing buffets +39 deal 2d6+12, six secondary wing buffets +37 deal 1d6+6, and tail slam +37 deals 1d6+6 plus Charisma drain. Tail drain normally permanently drains 2 Charisma (4 on a critical) and heals the chichimec 10 hp (20 on a critical); Fortitude DC 33 reduces this to 1 Charisma and 5 hp healed. At will: darkness, telekinesis; 1/day: improved invisibility, control weather, call lightning, lightning bolt, chain lightning, wail of the banshee (CL 20th; save DC 20 + spell level). Three times per day it can summon an elder air elemental. Abomination traits, fast healing 10, SR 33, DR 20/+6, electricity immunity.',
 'outsider',21,27,8,189,'medium',5,5,22,27,22,22,17,34,25,24,12,14,30,
 'Any','Solitary, pair, or flock (6-9)','None','NE','Always neutral evil','28-38 HD (Medium-size); 39-50 HD (Large)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"fastHealing":10,"spellResistance":33,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"immunities":["electricity","mind-affecting","form-altering"],"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]'),

('elh-monster-dream-larva','161-162','dream-larva','Dream Larva',
 'A nightmare made flesh, appearing first as each observer’s worst fear and later as a many-limbed mass of crawling larvae.',
 '40d8+360 outsider (680 hp). Speed 80 ft., fly 240 ft. (perfect). AC 52 from -1 size, +3 Dexterity, and +40 natural armor. Bite +56 deals 4d8+16; gore +51, four pincers +51, and four claws +51 each deal 4d6+8. Special attacks include worst nightmare, improved grab, sending, spell-like abilities, and summon nightwalker. A grappled victim may be sent into nightmare (Will DC 43), returning 2d4 rounds later after 4d6 temporary Wisdom damage; excess Wisdom damage becomes temporary Constitution damage. Five times per day the larva can summon a nightwalker. Abomination traits, sonic immunity, regeneration 15, fast healing 15, SR 44, DR 40/+8. Regeneration is bypassed by good or lawful weapons or weapons forged by a sleepwalking weaponsmith.',
 'outsider',31,40,8,360,'large',5,10,40,40,31,25,29,42,17,29,16,24,36,
 'Any','Solitary, pair, or solitary plus 1-4 nightwalkers','Standard','CE','Always chaotic evil','41-65 HD (Large); 66-84 HD (Huge); 85-110 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"fastHealing":15,"regeneration":{"amount":15,"bypass":["good weapons","lawful weapons","weapons forged by a sleepwalking weaponsmith"]},"spellResistance":44,"damageReduction":{"amount":40,"bypass":"+8","editionNotation":"3.0"},"immunities":["sonic","mind-affecting","form-altering"],"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]')
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
 ('anaxim','land',60,NULL,NULL),('anaxim','fly',200,'perfect',NULL),
 ('atropal','land',5,NULL,NULL),('atropal','fly',240,'perfect',NULL),
 ('chichimec','land',5,NULL,NULL),('chichimec','fly',200,'perfect',NULL),
 ('dream-larva','land',80,NULL,NULL),('dream-larva','fly',240,'perfect',NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('anaxim','lawful'),
 ('atropal','evil'),('atropal','lawful'),
 ('chichimec','air'),('chichimec','evil'),
 ('dream-larva','chaotic'),('dream-larva','evil')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
