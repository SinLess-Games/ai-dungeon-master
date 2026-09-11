-- Epic Level Handbook monster stat blocks: genius loci, gibbering orb, gloom, and epic golems.
-- Source: Epic Level Handbook, Chapter 5, pp. 190-195.
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
('elh-monster-genius-loci','190-191','genius-loci','Genius Loci',
 'A malign section of landscape that has awakened as a single colossal ooze and can enslave a mind to emulate its sentience.',
 '70d10+1,400 plus 40 hp from epic toughness (1,825 hp). Speed 5 ft., burrow 5 ft. Printed AC 0 from -2 Dexterity and -8 size. Ten slams +64 deal 4d10+20. Its active body has 15-ft. reach even though the overall Face varies with the landscape. Once per round as a free action, until it succeeds, it can use the epic spell enslave (Will DC 53); it can maintain only one slave at a time. Slam hits against Gargantuan or smaller creatures enable improved grab, and successful grapple checks deal normal slam damage plus constrict 4d10+30. Blindsight 200 ft., fast healing 50, ooze traits.',
 'ooze',30,70,10,1440,'colossal',40,15,0,0,0,52,43,21,30,50,6,50,NULL,24,26,
 'Any','Solitary','Standard',NULL,'Usually any evil','None',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"oozeTraits":true,"blindsightFeet":200,"fastHealing":50,"variableFace":true,"activeReachFeet":15,"enslave":{"frequency":"once per round as a free action until successful","willDc":53,"maximumSlaves":1},"improvedGrab":{"maximumTargetSize":"Gargantuan"},"constrict":"4d10+30","immunities":["poison","sleep","paralysis","stunning","polymorph","critical hits","flanking","mind-affecting"]}}}]'),

('elh-monster-gibbering-orb','191-193','gibbering-orb','Gibbering Orb',
 'A huge floating aberration covered in orbiting eyes and mouths, combining beholder-like rays with an insatiable capacity to steal consumed magic.',
 '27d8+216+3 (340 hp). Speed 5 ft., fly 20 ft. (good). AC 48 from +12 Dexterity, -2 size, +16 natural armor, and +12 insight. It can project twenty-four eye rays +31 ranged touch and make up to twelve bites +28 melee for 2d8+5/19-20. Gibbering forces creatures within 60 ft. to make Will DC 40 each round or suffer insanity. A bite can initiate improved grab; a Large or smaller victim swallowed whole takes 4d8 constriction plus 3d10 acid each round. Escape requires 20 damage in a single blow against AC 16, with DR still applying. A creature it consumes yields its known/prepared spells and spell-like abilities for 24 hours; the orb may use two stolen abilities per round as free actions. Twenty-four eyes each produce one ray per round at CL 27, save DC 16 + spell level, range 150 ft.; no more than five rays can target one creature. All-around vision, extraordinary flight, amorphous body, SR 37, DR 25/+6.',
 'aberration',27,27,8,219,'huge',20,10,16,0,0,20,23,23,24,32,35,27,40,24,22,
 'Any land and underground','Solitary','Standard','CE','Usually chaotic evil','27-54 HD (Huge); 55-108 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"insightArmorClassBonus":12,"spellResistance":37,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"allAroundVision":true,"amorphous":true,"cannotBeFlanked":true,"criticalHitImmunity":true,"gibbering":{"radiusFeet":60,"willDc":40,"effect":"insanity","frequency":"each round"},"swallowWhole":{"maximumTargetSize":"Large","damagePerRound":["4d8 constriction","3d10 acid"],"escapeSingleBlowDamage":20,"interiorAc":16},"eyeRays":{"raysPerRound":24,"maximumRaysPerTarget":5,"rangeFeet":150,"casterLevel":27,"saveDc":"16 + spell level"},"stolenMagic":{"durationHours":24,"usesPerRound":2,"action":"free"}}}}]'),

('elh-monster-gloom','193-194','gloom','Gloom',
 'A supernatural assassin that hunts from absolute silence and moves through shadow to strike before companions can react.',
 '25d8+225 (337 hp). Speed 30 ft. AC 40 from +18 Dexterity and +12 insight. Its signature +10 keen dagger of human dread attacks at +54/+49/+44/+39 and deals 1d4+21 with 15-20 threat; in any nongloom hand the weapon is only a +5 keen dagger. Fear gaze is Will DC 32 or fear as CL 20. It has opportunist as the rogue ability and sneak attack +13d6 as a 25th-level rogue. Quiescence keeps the gloom personally silent as silence, grants +20 racial Move Silently, and can be lowered at will. At will: shadow walk; 3/day: true strike (CL 20, save DC 20 + spell level). Blindsight 60 ft., SR 35, DR 25/+6.',
 'monstrous-humanoid',25,25,8,225,'medium',5,5,0,0,0,25,17,32,21,32,46,29,26,25,30,
 'Any urban','Solitary','Nonstandard (just its dagger)','LE','Usually lawful evil','25+ HD (Medium-size)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"insightArmorClassBonus":12,"blindsightFeet":60,"spellResistance":35,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"fearGaze":{"willDc":32,"effect":"fear","casterLevel":20},"sneakAttack":"+13d6","opportunist":true,"quiescence":{"personalSilence":true,"moveSilentlyRacialBonus":20,"suppressAtWill":true},"spellLikeAbilities":{"atWill":["shadow walk"],"threePerDay":["true strike"],"casterLevel":20,"saveDc":"20 + spell level"},"signatureWeapon":{"name":"+10 keen dagger of human dread","nongloomForm":"+5 keen dagger"}}}}]'),

('elh-monster-mithral-golem','194-195','mithral-golem','Mithral Golem',
 'An eighteen-foot golem of transformed mithral whose supernatural alacrity makes it far faster than ordinary constructs.',
 '36d10 construct (198 hp). Speed 40 ft. AC 42 from -2 size, +4 Dexterity, +26 natural armor, and +4 haste. Slam +39 deals 4d10+14. Once per round, alacrity grants one extra partial action before or after its normal actions. Construct traits, magic immunity, DR 50/+5. Slow suppresses alacrity for 1d4 rounds; multiple slow effects extend duration. Haste restores 1d6 hp per caster level (maximum 10d6) or restores alacrity if slow suppressed it.',
 'construct',21,36,10,0,'huge',10,10,26,4,0,27,12,16,12,39,19,NULL,NULL,11,1,
 'Any land','Solitary','None','N','Always neutral','37-54 HD (Huge); 55-72 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"hasteArmorClassBonus":4,"magicImmunity":true,"damageReduction":{"amount":50,"bypass":"+5","editionNotation":"3.0"},"alacrity":{"extraPartialActionsPerRound":1},"magicExceptions":{"slow":"negates alacrity for 1d4 rounds; multiple castings extend duration","haste":"heals 1d6 hp per caster level, max 10d6, or restores suppressed alacrity"},"construction":{"costGp":250000,"bodyGp":5000,"craftDc":30,"creatorMinimumLevel":25,"xpCost":5000,"feat":"Craft Epic Magic Arms and Armor","spells":["geas/quest","haste","polymorph any object","wish"]}}}}]'),

('elh-monster-adamantine-golem','194-195','adamantine-golem','Adamantine Golem',
 'A thirty-foot, 32,000-pound adamantine construct whose every step shakes the ground.',
 '54d10 construct (297 hp). Speed 20 ft.; cannot run. AC 37 from -2 size, -1 Dexterity, and +30 natural armor. Two slams +58 deal 6d10+20. As a standard action each round it can trample a creature at least one size category smaller for 8d10+30; targets may either make attacks of opportunity at -4 or attempt Reflex DC 57 for half. Construct traits, complete magic immunity, DR 50/+7.',
 'construct',25,54,10,0,'huge',10,10,30,0,0,40,18,17,18,51,9,NULL,NULL,11,1,
 'Any land','Solitary','None','N','Always neutral','55-82 HD (Huge); 83-108 HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"magicImmunity":true,"damageReduction":{"amount":50,"bypass":"+7","editionNotation":"3.0"},"trample":{"minimumVictimSizeDifference":1,"damage":"8d10+30","reflexDc":57,"success":"half","alternative":"attack of opportunity at -4"},"construction":{"costGp":500000,"bodyGp":25000,"craftDc":40,"creatorMinimumLevel":30,"xpCost":10000,"feat":"Craft Epic Magic Arms and Armor","spells":["Bigby's crushing hand","geas/quest","polymorph any object","wish"]}}}}]')
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
 ('genius-loci','land',5,NULL,NULL),('genius-loci','burrow',5,NULL,NULL),
 ('gibbering-orb','land',5,NULL,NULL),('gibbering-orb','fly',20,'good','Extraordinary buoyant flight; also grants personal feather fall.'),
 ('gloom','land',30,NULL,NULL),
 ('mithral-golem','land',40,NULL,'Can run normally despite being a golem.'),
 ('adamantine-golem','land',20,NULL,'Cannot run.')
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;
