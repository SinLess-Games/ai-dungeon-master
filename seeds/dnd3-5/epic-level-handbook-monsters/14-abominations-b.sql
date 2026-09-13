-- Epic Level Handbook monster stat blocks: abominations, batch B.
-- Source: Epic Level Handbook, Chapter 5, pp. 162-169.
-- Preserve the book's 3.0 statistics and terminology.
-- `space_feet` records the first source Face dimension; no automatic 3.5 space conversion is applied.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-hecatoncheires','162-164','hecatoncheires','Hecatoncheires',
 'A primordial hundred-handed abomination with fifty heads, feared even by gods.',
 '52d8+572 outsider (988 hp). Speed 100 ft. AC 70; the source lists -2 size, +30 natural armor, +20 insight, and +12 armor from +5 half plate. It can make up to one hundred greatsword attacks +71 (2d6+20/17-20) or one hundred boulder attacks +53 (2d8+20/19-20). Superior Multiweapon Fighting removes attack/damage penalties for its hundred weapons, but limits attacks against one target to 10 if Small or smaller, 15 if Medium-size, 20 if Large, and all 100 if Huge or larger. At will: greater magic weapon, fly, shield (CL 50th; save DC 17 + spell level). Once per day it can summon another hecatoncheires; a summoned one cannot use its own summon power. Abomination traits, electricity immunity, regeneration 40, fast healing 50, SR 70, DR 60/+12. Regeneration is bypassed by good weapons or weapons tempered with a deity''s blood.',
 'outsider',57,52,8,572,'huge',10,15,30,12,0,52,39,30,27,50,15,32,10,8,24,
 'Any','Solitary or pair','Standard','CE','Always chaotic evil','53-58 HD (Huge); 59-70 HD (Gargantuan); 71-140 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"insightArmorClassBonus":20,"fastHealing":50,"regeneration":{"amount":40,"bypass":["good weapons","weapons tempered with the blood of a deity"]},"spellResistance":70,"damageReduction":{"amount":60,"bypass":"+12","editionNotation":"3.0"},"immunities":["electricity","mind-affecting","form-altering"],"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]'),

('elh-monster-infernal','164-165','infernal','Infernal',
 'A fiendish abomination born from the union of a deity and a fiend; lawful specimens descend from baatezu and chaotic specimens from tanar''ri.',
 '40d8+360 outsider (680 hp). Speed 80 ft., fly 240 ft. (perfect). AC 50 from +7 Dexterity, -1 size, and +34 natural armor. Two claws +56 deal 4d6+16; bite +50 deals 4d8+8 plus spell suck; two wings +50 deal 2d6+8; tail slam +50 deals 4d8+8. Special attacks include improved grab, spell suck, learned spell immunity, spell-like abilities, and summon fiend. At will it has a broad suite of necromantic, illusion, divination, fire, teleportation, and unholy spell-like abilities; 1/day: fire storm, hellball, implosion, meteor swarm (CL 26th; save DC 19 + spell level). It can summon four balors or four pit fiends per day depending on whether it is chaotic or lawful. Abomination traits, fast healing 15, regeneration 15, SR 38, DR 35/+7. Good weapons bypass regeneration; lawful infernals also take normal damage from chaotic weapons and chaotic infernals from lawful weapons.',
 'outsider',26,40,8,360,'large',5,10,34,0,0,40,31,29,30,43,25,28,22,26,29,
 'Any','Solitary or hell brigade (1 infernal and 1d4 balors, or 1 infernal and 1d4 pit fiends)','Standard',NULL,'Lawful evil or chaotic evil','41-50 HD (Large); 51-56 HD (Huge); 57-72 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"fastHealing":15,"regeneration":{"amount":15,"bypass":["good weapons","opposed law/chaos weapon"]},"spellResistance":38,"damageReduction":{"amount":35,"bypass":"+7","editionNotation":"3.0"},"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true,"alignmentVariants":["lawful evil","chaotic evil"]}}}]'),

('elh-monster-phaethon','165-166','phaethon','Phaethon',
 'A gargantuan mass of sentient magma spawned by fire deities, often imprisoned within a world''s molten depths.',
 '62d8+806 outsider (1,302 hp). Speed 120 ft., burrow 120 ft. AC 47 from -4 size, +7 Dexterity, and +34 natural armor. Eight pseudopod slams +83 deal 4d8+24 plus 2d6 fire. Touching or being touched by it deals 2d6 fire. A successful overrun is treated as swallow whole. Improved grab works on Huge or smaller creatures; swallowed creatures take 20d6 fire plus 10d6 bludgeoning each round. At will: fireball, fire storm, delayed blast fireball, flame strike, wall of fire; 1/day: scrying (CL 34th; save DC 24 + spell level). It can summon up to ten elder fire elementals per day. Abomination traits, fire immunity, oozelike immunities, regeneration 25, fast healing 25, SR 46, DR 40/+8. Regeneration is bypassed by lawful and cold-forged weapons; cold or ice weapons deal double damage.',
 'outsider',34,62,8,806,'gargantuan',30,15,34,0,0,62,48,42,39,58,25,36,8,18,39,
 'Any','Solitary, or in company of 1-10 elder fire elementals','Standard','CE','Always chaotic evil','63-80 HD (Gargantuan); 81-186 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"oozelikeImmunities":true,"fastHealing":25,"regeneration":{"amount":25,"bypass":["lawful weapons","cold-forged weapons"],"doubleDamageFrom":["cold weapons","ice weapons"]},"spellResistance":46,"damageReduction":{"amount":40,"bypass":"+8","editionNotation":"3.0"},"immunities":["fire","poison","sleep","paralysis","stunning","mind-influencing","critical hits","flanking"],"resistances":{"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]'),

('elh-monster-phane','166-167','phane','Phane',
 'An incorporeal abomination untethered from ordinary time, born from deities of time or fate.',
 '36d8+324 outsider (612 hp). Speed 80 ft., fly 120 ft. (perfect). Source AC is 50 and lists -1 size, +3 Dexterity, +11 deflection, and +23 insight; the printed components do not arithmetically reproduce the printed total, so both are preserved rather than silently corrected. Incorporeal touch +43 deals 1d6 plus stasis touch. At will: detect good, detect magic, improved invisibility (self only); 5/day: haste, mass haste, slow, teleport without error, tongues, trap the soul, true strike, unholy aura; 2/day: safe time and time duplicate; 1/day: time stop (CL 21st; save DC 21 + spell level). Stasis touch functions at will as temporal stasis (CL 25th). Chronal blast is a 100-ft. ranged touch attack for 15d6. Its 30-ft. null time field forces Will DC 30 each round to act. Time regression lets it spend four rounds concentrating, then return to the first of those rounds and choose different actions with foreknowledge. Abomination traits, fast healing 15, regeneration 15, SR 37, DR 30/+6, sonic immunity. Regeneration is bypassed by holy/good weapons or weapons forged in the future or an alternate timeline.',
 'outsider',25,36,8,324,'large',5,10,0,0,11,36,31,29,25,NULL,25,28,24,16,33,
 'Any land and underground','Solitary or pair','None','CE','Always chaotic evil','37-50 HD (Large); 51-65 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"incorporeal":true,"printedArmorClass":50,"printedDexterityArmorClassBonus":3,"insightArmorClassBonus":23,"fastHealing":15,"regeneration":{"amount":15,"bypass":["holy weapons","good weapons","weapons forged in the future","weapons forged in an alternate reality"]},"spellResistance":37,"damageReduction":{"amount":30,"bypass":"+6","editionNotation":"3.0"},"immunities":["sonic","mind-affecting","form-altering"],"resistances":{"fire":20,"cold":20},"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true,"nullTimeField":{"radiusFeet":30,"willDc":30}}}}]'),

('elh-monster-xixecal','167-169','xixecal','Xixecal',
 'A colossal walking glacier born from gods of evil, ice, and chaos, permanently surrounded by supernatural winter.',
 '72d8+1,080 outsider (1,656 hp). Speed 140 ft. AC 64 from -8 size, +7 Dexterity, and +55 natural armor. Two claws +93 deal 2d8+28/19-20, bite +87 and stamp +87 each deal 4d6+14; two claw hits rend for 4d8+42. Each melee hit can slow a foe for 10 rounds unless Fortitude DC 58 succeeds. At will: blasphemy, cone of cold, desecrate, greater dispelling, dominate monster, hold person, improved invisibility, unholy aura, wall of ice; 5/day: haste, meteor swarm (CL 36th; save DC 22 + spell level). Breath weapon 3/day is a 300-ft. cone of cold for 12d6, Fortitude DC 61 half. Five times per day it can summon an old white dragon. Its attacks drain 4 Constitution, doubled on rend or critical hit, Fortitude DC 58; this also heals the xixecal. It continually generates dire winter, returning 1 minute after dispelling. Abomination traits, cold subtype, fast healing 30, regeneration 30, SR 48, DR 45/+9. Regeneration is bypassed by lawful weapons; burning or fiery weapons deal double damage.',
 'outsider',36,72,8,1080,'colossal',40,25,55,0,0,72,55,47,39,66,13,40,12,8,34,
 'Any','Solitary or in the company of 1d4+1 old white dragons','Standard','CE','Always chaotic evil','73-150 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"abominationTraits":true,"coldSubtype":true,"direWinter":true,"fastHealing":30,"regeneration":{"amount":30,"bypass":["lawful weapons"],"doubleDamageFrom":["burning weapons","fiery weapons"]},"spellResistance":48,"damageReduction":{"amount":45,"bypass":"+9","editionNotation":"3.0"},"immunities":["cold","mind-affecting","form-altering"],"fireVulnerability":true,"blindsightFeet":500,"telepathyFeet":1000,"nondetection":true,"trueSeeingAtWill":true}}}]')
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
 ('hecatoncheires','land',100,NULL,NULL),
 ('infernal','land',80,NULL,NULL),('infernal','fly',240,'perfect',NULL),
 ('phaethon','land',120,NULL,NULL),('phaethon','burrow',120,NULL,NULL),
 ('phane','land',80,NULL,NULL),('phane','fly',120,'perfect',NULL),
 ('xixecal','land',140,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('hecatoncheires','evil'),('hecatoncheires','chaotic'),
 ('infernal','evil'),
 ('phaethon','evil'),('phaethon','chaotic'),('phaethon','fire'),
 ('phane','evil'),('phane','chaotic'),('phane','incorporeal'),
 ('xixecal','evil'),('xixecal','chaotic'),('xixecal','cold')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
