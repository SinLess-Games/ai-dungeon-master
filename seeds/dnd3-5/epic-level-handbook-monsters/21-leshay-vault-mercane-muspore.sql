-- Epic Level Handbook monster stat blocks: leShay, living vault, mercane, and mu spore.
-- Source: Epic Level Handbook, Chapter 5, pp. 202-206.
-- Preserve the book's 3.0 statistics and terminology.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses
) AS (VALUES
('elh-monster-leshay','202-203','leshay','LeShay',
 'An immortal, pre-multiversal fey race of extraordinary grace, power, and magical sophistication.',
 '50d6+650+3 fey (828 hp). Speed 40 ft. AC 52 from +17 Dexterity, +5 natural armor, and +20 insight. A leShay manifests two +10 keen brilliant energy bastard swords from its life essence; each is treated as light for the leShay, and superior two-weapon fighting removes attack and damage penalties. Full attack with both weapons uses +53/+48/+43/+38 and deals 1d10+15/15-20 per hit. Its 30-ft. gaze functions as charm monster, Will DC 53; creatures in range save each round and it can actively gaze as an attack action. At will: alter self, detect thoughts, displacement, freedom, greater dispelling, heal, improved invisibility, knock, speak with plants, spell turning, teleport without error, water breathing (CL 28th; save DC 28 + spell level). DR 30/+7, SR 42, fast healing 10, elf traits, poison and disease immunity, low-light vision.',
 'fey',28,50,6,653,'medium',5,5,5,0,0,25,29,44,35,21,45,37,33,23,47,
 'Any','Solitary','Standard',NULL,'Any','None',50,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"printedHitPoints":828,"insightArmorClassBonus":20,"spellResistance":42,"damageReduction":{"amount":30,"bypass":"+7","editionNotation":"3.0"},"fastHealing":10,"lowLightVision":true,"immunities":["poison","disease","magic sleep"],"elfTraits":true,"gaze":{"rangeFeet":30,"effect":"charm monster","willDc":53,"saveFrequency":"each round at start of target turn","activeGazeAction":"attack action","immuneToOwnGaze":true},"leshayWeapons":{"count":2,"typicalForm":"+10 keen brilliant energy bastard sword","manifestAction":"free","treatedAsLight":true,"fullAttack":"+53/+48/+43/+38 with each weapon","damage":"1d10+15/15-20"},"superiorTwoWeaponFighting":{"attackPenalty":0,"damagePenalty":0},"spellLikeAbilities":{"atWill":["alter self","detect thoughts","displacement","freedom","greater dispelling","heal","improved invisibility","knock","speak with plants","spell turning","teleport without error","water breathing"],"casterLevel":28,"saveDc":"28 + spell level"}}}}]'),

('elh-monster-living-vault','203-205','living-vault','Living Vault',
 'A colossal construct that is itself an extradimensionally secured treasure chamber, designed by epic spellcasters to protect possessions and prisoners.',
 '96d10 construct (528 hp). Speed 10 ft.; cannot run. AC 60 from -8 size, -2 Dexterity, and +60 natural armor. The printed stat table lists two slams +99 for 10d6+35, although the combat prose says the vault has no melee attack forms; both source statements are preserved. Twice per day as a free action it projects a 60-ft. cone of imprisonment, Will DC 58, storing failed targets inside itself. Capacity scales from two Gargantuan creatures to eight Huge, thirty-two Large, one hundred twenty-eight Medium, and so on, reduced by other stored treasure. Recognition allows only its true owner to access it and pierces disguises, polymorphs, seeming, simulacrum and similar effects, though a clone of the owner is accepted. Safekeeping at will combines sequester and plane shift, transferring the vault to a random Astral location and hiding it from sight/divination until its master calls it by sending. Contents are always treated as sequestered. Construct traits, complete magic immunity except freedom suppresses its imprisonment power for 10 rounds, DR 30/+7.',
 'construct',33,96,10,0,'colossal',40,25,60,0,0,72,32,30,33,80,7,NULL,9,12,7,
 'Any','Solitary','Standard (stored contents; see text)','N','Neutral','None',NULL,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"magicImmunity":true,"damageReduction":{"amount":30,"bypass":"+7","editionNotation":"3.0"},"sourceMeleeContradiction":{"table":"2 slams +99 melee, 10d6+35","prose":"has no melee attack forms"},"imprisonment":{"usesPerDay":2,"action":"free","shape":"60-foot cone","willDc":58,"effect":"imprisonment inside vault","capacity":{"Gargantuan":2,"Huge":8,"Large":32,"Medium":128},"freedomReleaseLocation":"adjacent to the vault''s current physical location"},"recognition":{"ownerOnly":true,"penetrates":["shapechange","alter self","change self","polymorph","seeming","simulacrum","similar disguises"],"acceptsOwnerClone":true},"safekeeping":{"atWill":true,"effects":["sequester","plane shift to random Astral location"],"returnTrigger":"sending from master","contentsAlwaysSequestered":true},"magicException":{"freedom":"defers vault imprisonment ability for 10 rounds"}}}}]'),

('elh-monster-mercane','204-205','mercane','Mercane',
 'A towering lawful extraplanar merchant who travels between planes trading weapons, magic, and rare treasures.',
 '7d8+21 outsider (52 hp). Speed 30 ft. AC 15 from -1 size, +2 Dexterity, and +4 natural armor. Masterwork falchion +9/+4 deals 2d4+3. Three times per day: dimension door and invisibility; once per day: Leomund''s secret chest and plane shift (CL 14th; save DC 12 + spell level). Telepathy 100 ft. with creatures that have a language. SR 25. Mercanes have +4 racial Appraise. Player-character mercanes have level adjustment +7 and favor wizard.',
 'outsider',5,7,8,21,'large',5,10,4,0,0,7,8,7,8,15,15,16,20,17,15,
 'Any land and underground','Company (1-4 mercanes and 3-18 5th-level fighter bodyguards) or progression (1 mercane, 3 14th-level fighters, 1 21st-level fighter/2nd-level Union Sentinel)','Double standard','LN','Always lawful neutral','By character class',7,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":25,"telepathyFeet":100,"appraiseRacialBonus":4,"spellLikeAbilities":{"threePerDay":["dimension door","invisibility"],"onePerDay":["Leomund''s secret chest","plane shift"],"casterLevel":14,"saveDc":"12 + spell level"},"favoredClass":"wizard"}}}]'),

('elh-monster-mu-spore','205-206','mu-spore','Mu Spore',
 'A redwood-sized ambulatory fungus with grasping tendrils, a huge upward-facing maw, and clouds of burrowing spores.',
 '35d8+315 plant (472 hp). Speed 40 ft. AC 27 from -3 Dexterity, -8 size, and +28 natural armor. Four tendrils +31 deal 2d6+13 and bite +26 deals 4d6+6. Once every 1d4 rounds its spore cough is a 100-ft. cone dealing 20d8 damage to creatures and structures, Reflex DC 36 half. Tendril hits enable improved grab against Gargantuan or smaller creatures, with a free transfer to the mouth. A victim held in the mouth can be swallowed on a successful grapple check; swallowed victims take twice bite damage each round and can cut free by dealing 33 damage with a light piercing/slashing weapon or escape by grapple. Sticky tendrils cause any creature touching or successfully attacking it in melee to face a free improved grab; a weapon wielder may release the weapon instead, after which the weapon is swallowed next round. Acid resistance 20, blindsight 210 ft., DR 25/+5, fast healing 10, plant traits.',
 'plant',21,35,8,315,'colossal',40,25,28,0,0,26,28,8,20,36,5,29,18,28,28,
 'Any','Solitary, pair, or polyp (3-7)','Standard','CN','Usually chaotic neutral','36+ HD (Colossal)',NULL,
 '[{"kind":"resistance","damageType":"acid","amount":20},{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"plantTraits":true,"blindsightFeet":210,"fastHealing":10,"damageReduction":{"amount":25,"bypass":"+5","editionNotation":"3.0"},"sporeCough":{"frequency":"once every 1d4 rounds","shape":"100-foot cone","damage":"20d8","affectsStructures":true,"reflexDc":36,"success":"half"},"improvedGrab":{"trigger":"tendril hit","maximumTargetSize":"Gargantuan","mayTransferToMouthAsFreeAction":true},"swallowWhole":{"entry":"begin turn with opponent held in mouth, then successful grapple check","damagePerRound":"8d6","cutFreeDamage":33,"cutFreeWeapon":"light piercing or slashing","grappleEscapeReturnsToMouth":true},"sticky":{"trigger":"touch or successful melee attack against mu spore","freeImprovedGrab":true,"weaponReleaseAvoidsGrapple":true,"releasedWeaponSwallowedNextRound":true}}}}]')
)
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,base_attack_bonus,grapple_modifier,
   fort,ref,will,str,dex,con,int,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.type_slug AND ct.owner_user_id IS NULL LIMIT 1),
       d.cr,1,d.hd,1,d.die,d.hp_bonus,d.size,d.space,d.reach,d.natural_armor,d.armor_bonus,0,d.deflection_bonus,d.bab,NULL,
       d.fort,d.ref,d.will,d.str,d.dex,d.con,d.intel,d.wis,d.cha,d.environment,d.organization,d.treasure,d.alignment,d.alignment_text,d.advancement,d.level_adjustment,d.defenses
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.source_id='elh-3.0' AND m.slug=d.slug AND m.owner_user_id IS NULL
);

WITH movement(monster_slug,mode,feet,maneuverability,rules_text) AS (VALUES
 ('leshay','land',40,NULL,NULL),
 ('living-vault','land',10,NULL,'Cannot run.'),
 ('mercane','land',30,NULL,NULL),
 ('mu-spore','land',40,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('mercane','lawful')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;