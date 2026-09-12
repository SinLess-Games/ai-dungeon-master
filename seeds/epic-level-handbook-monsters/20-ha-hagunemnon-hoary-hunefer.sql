-- Epic Level Handbook monster stat blocks: ha-naga, hagunemnon, hoary hunter/steed, and hunefer.
-- Source: Epic Level Handbook, Chapter 5, pp. 195-200.
-- Preserve the book's 3.0 statistics and terminology.
-- Hagunemnon is a 3.0 Shapechanger; for the 3.5 schema it is represented as Aberration (shapechanger), with the source type retained in rules metadata.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

-- Ensure 3.5 subtype identities needed to represent 3.0 source classifications exist.
WITH desired(slug,name) AS (VALUES
  ('shapechanger','Shapechanger'),
  ('cold','Cold')
)
INSERT INTO dnd35_creature_subtypes
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT 'elh-subtype-'||d.slug,'elh-3.0',NULL,d.slug,d.name,
       'Subtype identity required to represent Epic Level Handbook monster data in the D&D 3.5 schema.',
       'Compatibility identity for source-backed Epic Level Handbook creature data.',0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_creature_subtypes s WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-ha-naga','195-196','ha-naga','Ha-Naga',
 'A colossal naga lord often worshiped by lesser nagas as a god, capable of flight and epic-level sorcerous magic.',
 '20d8+220 aberration (310 hp). Speed 60 ft., supernatural fly 120 ft. (perfect). AC 40 from -8 size, +14 Dexterity, and +24 natural armor. Coil whip +21 deals 4d6+8; sting +19 deals 2d8+4 plus poison; bite +13 deals 4d8+4. Charming gaze functions as mass charm to 90 ft., Will DC 33. Coil whip enables improved grab and constrict 4d6+12 against Huge or smaller foes. Sting poison is Fortitude DC 31, initial and secondary 2d8 temporary Constitution. Chameleon ability grants +8 circumstance Hide. It casts as a 21st-level sorcerer and may cast cleric spells and Chaos/Evil domain spells as arcane spells; save DC 33 + spell level. SR 30, DR 15/+7.',
 'aberration',22,20,8,220,'colossal',15,15,24,0,0,15,17,22,22,27,38,32,35,31,36,
 'Temperate and warm land or underground','Solitary or nest (2-4)','Standard','CE','Usually chaotic evil','21-40 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":30,"damageReduction":{"amount":15,"bypass":"+7","editionNotation":"3.0"},"charmingGaze":{"rangeFeet":90,"effect":"mass charm","willDc":33},"chameleonHideBonus":8,"improvedGrab":{"trigger":"coil whip","maximumTargetSize":"Huge"},"constrict":"4d6+12","poison":{"delivery":"sting","save":"Fortitude","dc":31,"initial":"2d8 temporary Constitution","secondary":"2d8 temporary Constitution"},"spellcasting":{"class":"sorcerer","casterLevel":21,"saveDc":"33 + spell level","additionalArcaneLists":["cleric","Chaos domain","Evil domain"]},"supernaturalFlight":{"speedFeet":120,"maneuverability":"perfect","moveSilentlyCircumstanceBonus":6}}}}]'),

('elh-monster-hagunemnon','196-197','hagunemnon','Hagunemnon (Protean)',
 'The ultimate shapeshifter, a constantly changing protean able to combine the physical forms and extraordinary abilities of other creatures.',
 '44d8+616 shapechanger (814 hp); represented in this 3.5 schema as Aberration (shapechanger). Speed 50 ft. AC 50 from -1 size, +13 Dexterity, and +28 natural armor. Five slams +53 deal 2d6+21/19-20. At will psionics: detect thoughts, dimension door, ethereal jaunt, knock, nondetection, plane shift, suggestion (CL 20th; save DC 22). If two or more slams hit in one round, destabilize form deals +4d6+31 damage and 2 temporary Constitution damage; a creature reduced to Constitution 0 dissolves into clear fluid. As a free action it can combine the physical forms of nondeific creatures; maintaining a specific form requires a move-equivalent action each round. It retains its own special qualities and may gain up to four extraordinary abilities from imitated forms; incorporeal traits count as one such ability. It cannot exceed five attacks in a full attack. Darkvision 120 ft., regeneration 50, SR 39, DR 25/+6, and source-listed immunities.',
 'aberration',29,44,8,616,'large',5,10,28,0,0,33,40,39,32,53,37,39,20,23,34,
 'Any','Solitary','Standard','CN','Always chaotic neutral','45-59 HD (Large); 60-74 HD (Huge); 75-89 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceCreatureType":"Shapechanger (3.0)","schemaCreatureType":"Aberration","schemaSubtype":"shapechanger","darkvisionFeet":120,"spellResistance":39,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"regeneration":50,"sourceListsImmunities":true,"psionics":{"atWill":["detect thoughts","dimension door","ethereal jaunt","knock","nondetection","plane shift","suggestion"],"casterLevel":20,"saveDc":22},"destabilizeForm":{"trigger":"two or more slam hits in one round","extraDamage":"4d6+31","temporaryConstitutionDamage":2,"constitutionZero":"body dissolves into clear fluid"},"alterShape":{"action":"free","maintainSpecificFormAction":"move-equivalent each round","minimumFormSize":"flea","maximumDimensionFeet":200,"maximumBorrowedExtraordinaryAbilities":4,"mayBorrowIncorporealTraits":true,"maximumFullAttackAttacks":5}}}}]'),

('elh-monster-hoary-hunter','197-198','hoary-hunter','Hoary Hunter',
 'A malevolent cold fey that appears on moonlit freezing nights to hunt chosen victims and carry them into the Unseelie realm.',
 '46d6+598 fey (759 hp). Speed 30 ft. AC 46 from +11 Dexterity, +10 natural armor, and +15 insight. Its +6 keen longsword of binding attacks +46/+41/+36/+31 and deals 1d8+27/15-20 plus 1d6 and binding. A critical hit, or a blow that would kill or render a foe unconscious, instead transports the victim into a diamond in the weapon as binding heightened to 16th level (DC 30). At will: discern location, true strike, fog cloud, hold monster, plane shift; 3/day: dimensional anchor, dominate monster, greater dispelling; 1/day: Mordenkainen''s disjunction and contingent recall and resurrection (CL 23rd; save DC 18 + spell level). When slain during a hunt while the contingency is available, it and its mount are returned to the fey realm, resurrected, and can resume the hunt. Cold resistance 50, SR 36, DR 20/+6.',
 'fey',25,46,6,598,'medium',5,5,10,0,0,23,28,36,31,38,33,36,31,23,26,
 'Any cold','Solitary or company (2-5)','None','NE','Always neutral evil','47+ HD (Medium-size)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"insightArmorClassBonus":15,"coldResistance":50,"spellResistance":36,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"signatureWeapon":{"name":"+6 keen longsword of binding","attackRoutine":"+46/+41/+36/+31","damage":"1d8+27/15-20 plus 1d6","bindingTrigger":"critical hit or blow that would kill/render unconscious","bindingSaveDc":30,"bindingEffectiveSpellLevel":16},"spellLikeAbilities":{"atWill":["discern location","true strike","fog cloud","hold monster","plane shift"],"threePerDay":["dimensional anchor","dominate monster","greater dispelling"],"onePerDay":["Mordenkainen''s disjunction","contingent recall and resurrection"],"casterLevel":23,"saveDc":"18 + spell level"},"huntResurrection":{"returnsWithMountToFeyRealmOnDeath":true,"resurrects":true,"requiresDailyContingencyAvailable":true,"trueDeathCondition":"defeated in home realm after contingency exhausted"}}}}]'),

('elh-monster-hoary-steed','197-199','hoary-steed','Hoary Steed',
 'The supernatural cold-aligned flying mount of a hoary hunter, fiercely loyal and surrounded by permanent mist.',
 '12d10+36 magical beast (102 hp). Speed 40 ft., fly 90 ft. (good). AC 23 from -1 size, +4 Dexterity, and +10 natural armor. Two hooves +17 deal 3d6+6 and bite +15 deals 5d8+3. It permanently air walks; astral projection and etherealness function as the spells at caster level 20. It continuously projects magic circle against good and cannot suppress it. Misty breath functions as constant obscuring mist. Immune to charm and hold effects; cold resistance 25, SR 20, DR 10/+3.',
 'magical-beast',9,12,10,36,'large',5,5,10,0,0,12,11,12,5,22,18,17,6,13,14,
 'Any cold','Solitary (with rider)','None','NE','Always neutral evil','13-24 HD (Large); 25-36 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"coldResistance":25,"spellResistance":20,"damageReduction":{"amount":10,"bypass":"+3","editionNotation":"3.0"},"immunities":["charm effects","hold effects"],"airWalk":"continuous","astralProjection":{"casterLevel":20},"etherealness":{"casterLevel":20},"magicCircleAgainstGood":{"continuous":true,"suppressible":false},"mistyBreath":"constant obscuring mist"}}}]'),

('elh-monster-hunefer','199-200','hunefer','Hunefer',
 'The mummified cast-off flesh of a demigod, filled with undying rage and fragments of its former divine memory.',
 '50d12+3 undead; the source prints 603 hp and that value is preserved in metadata rather than silently normalized. Speed 100 ft. AC 52 from +12 Dexterity, +20 natural armor, and +10 insight. Two slams +44 deal 3d6+18/19-20, +1d6 on critical hits, plus hunefer rot. Sight of a hunefer causes despair: Will DC 48 or paralysis with fear for 1d4 rounds; a creature is then immune to that hunefer''s despair for 24 hours. Hunefer rot is an instantaneous supernatural disease delivered by slam, Fortitude DC 35, dealing 1d6 temporary Constitution immediately and each round until cured or Constitution reaches 0. A victim dying from the rot becomes an 18-HD mummy under the hunefer''s command on round 3 unless remove disease and raise dead or better are both applied within 2 rounds. Physical attacks deal half damage before DR. At will: chain lightning, displacement, haste, knock, greater dispelling, passwall, scrying, teleport without error, true seeing, unholy aura, weird; 1/day: ruin (CL 27th; save DC 23 + spell level). Blindsight 300 ft., fast healing 30, SR 37, DR 20/+5, undead traits, fire vulnerability.',
 'undead',25,50,12,3,'medium',5,5,20,0,0,25,18,30,41,47,35,NULL,18,38,36,
 'Any','Solitary, pair, or court (5-9)','Standard','LE','Always lawful evil','51-56 HD (Medium-size); 57-60 HD (Large); 61-66 HD (Huge); 67-70 HD (Gargantuan); 71+ HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"printedHitPoints":603,"hitDiceText":"50d12+3","insightArmorClassBonus":10,"undeadTraits":true,"blindsightFeet":300,"fastHealing":30,"spellResistance":37,"damageReduction":{"amount":20,"bypass":"+5","editionNotation":"3.0"},"fireVulnerability":"double damage; if save for half is allowed, success halves and failure doubles","resistantToBlows":{"physicalDamageMultiplier":0.5,"applyBeforeDamageReduction":true},"despair":{"trigger":"sight","willDc":48,"effect":"paralyzed with fear","duration":"1d4 rounds","immunityAfterSaveOrEffectHours":24},"huneferRot":{"delivery":"slam","save":"Fortitude","dc":35,"incubation":"instantaneous","damagePerFailedSave":"1d6 temporary Constitution","repeat":"every round","endsOn":["Constitution 0","remove disease or similar magic"],"deathTransformation":{"round":3,"result":"18 HD mummy under hunefer command","prevention":"remove disease and raise dead or better within 2 rounds"}},"spellLikeAbilities":{"atWill":["chain lightning","displacement","haste","knock","greater dispelling","passwall","scrying","teleport without error","true seeing","unholy aura","weird"],"onePerDay":["ruin"],"casterLevel":27,"saveDc":"23 + spell level"}}}}]')
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
 ('ha-naga','land',60,NULL,NULL),('ha-naga','fly',120,'perfect','Supernatural flight; grants +6 circumstance on Move Silently.'),
 ('hagunemnon','land',50,NULL,NULL),
 ('hoary-hunter','land',30,NULL,NULL),
 ('hoary-steed','land',40,NULL,NULL),('hoary-steed','fly',90,'good',NULL),
 ('hunefer','land',100,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('hagunemnon','shapechanger'),
 ('hoary-hunter','cold'),
 ('hoary-steed','cold')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
