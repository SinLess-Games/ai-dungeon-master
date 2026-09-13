-- Epic Level Handbook monster stat blocks: sirrushes and epic slaadi.
-- Source: Epic Level Handbook, Chapter 5, pp. 216-220.
-- Preserve the book's 3.0 statistics and terminology.
-- The chapter index supplies ECL values; these are retained in metadata and are NOT written into level_adjustment.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-sirrush','216-217','sirrush','Sirrush',
 'A dragon-hunting scaled predator of tremendous intelligence, speed, resilience, and ferocity.',
 '40d10+680 magical beast (900 hp). Speed 90 ft. AC 44 from +15 Dexterity, -1 size, and +20 natural armor. Four claws +56 deal 2d6+16/19-20 (+1d6 on critical hit) and bite +54 deals 4d6+8/19-20. Every 1d4 rounds its stunning roar affects all creatures in a 60-ft. spread; Fortitude DC 47 or stunned 1d4 rounds. On a charge or leap during the first round of combat it can pounce for a full attack after moving. Headloss resistance allows a Fortitude save against beheading effects at DC 10 + one-half the attacker''s HD + attacker Strength modifier; on a success it remains unaffected, while a normal sirrush dies if actually beheaded. Blindsight 300 ft., darkvision 60 ft., low-light vision, scent, fast healing 20, SR 39, DR 30/+5, and resistance 10 to acid, cold, electricity, fire, and sonic.',
 'magical-beast',24,40,10,680,'large',5,10,20,0,0,40,41,39,29,42,40,44,35,38,28,
 'Any','Solitary, pair, or pack (4-9 sirrushes and 1-2 three-headed sirrushes)','Standard','CN','Usually chaotic neutral','41-50 HD (Large); 51-60 HD (Huge); 61+ HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":40,"blindsightFeet":300,"darkvisionFeet":60,"lowLightVision":true,"scent":true,"fastHealing":20,"spellResistance":39,"damageReduction":{"amount":30,"bypass":"+5","editionNotation":"3.0"},"resistances":{"acid":10,"cold":10,"electricity":10,"fire":10,"sonic":10},"stunningRoar":{"frequency":"once every 1d4 rounds","radiusFeet":60,"fortitudeDc":47,"failure":"stunned 1d4 rounds"},"pounce":{"trigger":"charge or leap during first round","effect":"full attack after move"},"headlossResistance":{"save":"Fortitude","dcFormula":"10 + floor(attacker HD / 2) + attacker Strength modifier","success":"ignore beheading","failedSave":"beheaded and slain"}}}}]'),

('elh-monster-three-headed-sirrush','216-217','three-headed-sirrush','Three-Headed Sirrush',
 'A rarer and far deadlier three-headed sirrush that dominates packs of its lesser kin.',
 '45d10+855 magical beast (1,102 hp). Speed 120 ft. AC 50 from +17 Dexterity, -1 size, and +24 natural armor. Four claws +63 deal 3d6+18/19-20 (+1d6 on critical hit) and three bites +61 deal 4d6+9/19-20. Every 1d4 rounds its stunning roar affects a 60-ft. spread; Fortitude DC 51 or stunned 1d4 rounds. It pounces on a first-round charge/leap. Headloss resistance allows the same Fortitude save as a sirrush against beheading, but a three-headed sirrush continues fighting until all three heads are removed; each lost head removes one bite attack. Blindsight 350 ft., darkvision 60 ft., low-light vision, scent, fast healing 25, SR 42, DR 35/+6, and resistance 15 to acid, cold, electricity, fire, and sonic.',
 'magical-beast',28,45,10,855,'large',5,10,24,0,0,45,45,43,33,47,45,49,40,43,33,
 'Any','Solitary, pair, or pack (1-2 three-headed sirrushes and 4-9 sirrushes)','Standard','CN','Usually chaotic neutral','46-55 HD (Large); 56-65 HD (Huge); 66+ HD (Gargantuan)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":45,"blindsightFeet":350,"darkvisionFeet":60,"lowLightVision":true,"scent":true,"fastHealing":25,"spellResistance":42,"damageReduction":{"amount":35,"bypass":"+6","editionNotation":"3.0"},"resistances":{"acid":15,"cold":15,"electricity":15,"fire":15,"sonic":15},"stunningRoar":{"frequency":"once every 1d4 rounds","radiusFeet":60,"fortitudeDc":51,"failure":"stunned 1d4 rounds"},"pounce":{"trigger":"charge or leap during first round","effect":"full attack after move"},"headlossResistance":{"save":"Fortitude","dcFormula":"10 + floor(attacker HD / 2) + attacker Strength modifier","success":"ignore beheading","heads":3,"death":"when all three heads are lost","lostHeadPenalty":"one fewer bite attack per lost head"}}}}]'),

('elh-monster-white-slaad','218-219','white-slaad','White Slaad',
 'An ancient death slaad transformed after a century into a larger, more lethal embodiment of chaos.',
 '24d8+312+20 outsider (440 hp). Speed 40 ft. AC 40 from +8 Dexterity, -1 size, and +23 natural armor. Two claws +36 deal 5d6+13 and bite +34 deals 2d10+6 plus chaos bite; chaos spittle uses +31 ranged touch. Stun works as Stunning Fist nine times/day, Fortitude DC 30. Chaos bite adds 8d4 chaotic damage, then 4d4 each subsequent round for 9 rounds unless neutralized. Chaos spittle has 60-ft. range; the prose gives 10d4 initial damage plus 5d4 each subsequent round for 9 rounds, while the comparative stat table prints 8d4 initial damage. Both source values are retained and the prose mechanics are treated as the detailed rule. Weaponbreaker rolls Sunder damage twice and takes the higher result. At will: animate objects, circle of death, chaos hammer, cloak of chaos, deeper darkness, dispel law, fear, finger of death, fireball, fly, greater dispelling, identify, improved invisibility, magic circle against law, plane shift, power word blind, power word kill, see invisibility, shatter, teleport without error, word of chaos; 1/day: implosion, peripety, ruin (CL 21st; save DC 18 + spell level). Alternate form can assume any humanoid form at will as a standard action. Three times/day it may summon 2-4 gray slaadi with 80% success or 1-2 death slaadi with 40% success. Telepathy 100 ft., fast healing 15, DR 35/+5, resistance 20 to acid/cold/electricity/fire/sonic, immunity to its own chaos attacks.',
 'outsider',21,24,8,332,'large',5,10,23,0,0,24,27,22,22,36,26,37,26,27,27,
 'Any land and underground','Solitary or pair','Double standard','CN','Always chaotic neutral','25-29 HD (Large); 30-44 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":24,"fastHealing":15,"damageReduction":{"amount":35,"bypass":"+5","editionNotation":"3.0"},"resistances":{"acid":20,"cold":20,"electricity":20,"fire":20,"sonic":20},"immuneToOwnChaosAttacks":true,"stun":{"usesPerDay":9,"fortitudeDc":30,"basis":"as Stunning Fist"},"chaosBite":{"initialDamage":"8d4 chaotic","ongoingDamage":"4d4 chaotic","ongoingRounds":9,"endsIfNeutralized":true},"chaosSpittle":{"rangeFeet":60,"attack":"ranged touch","detailedProseInitialDamage":"10d4 chaotic","comparativeTableInitialDamage":"8d4 chaotic","ongoingDamage":"5d4 chaotic","ongoingRounds":9,"endsIfNeutralized":true,"sourceDiscrepancy":"ELH stat table prints 8d4 while detailed combat prose prints 10d4; prose is used for the mechanical summary."},"weaponbreaker":"When using Sunder, roll damage twice and use the higher result.","spellLikeAbilities":{"atWill":["animate objects","circle of death","chaos hammer","cloak of chaos","deeper darkness","dispel law","fear","finger of death","fireball","fly","greater dispelling","identify","improved invisibility","magic circle against law","plane shift","power word blind","power word kill","see invisibility","shatter","teleport without error","word of chaos"],"onePerDay":["implosion","peripety","ruin"],"casterLevel":21,"saveDc":"18 + spell level"},"alternateForm":{"atWill":true,"action":"standard","forms":"any humanoid","duration":"indefinite","basis":"alter self, caster level 21"},"summonSlaad":{"usesPerDay":3,"options":[{"creatures":"2-4 gray slaadi","successPercent":80},{"creatures":"1-2 death slaadi","successPercent":40}]},"telepathyFeet":100}}}]'),

('elh-monster-black-slaad','218-220','black-slaad','Black Slaad',
 'A white slaad transformed after another century into a huge void-dark embodiment of chaos powerful enough to rival ancient monsters.',
 '29d8+406 outsider (536 hp). Speed 80 ft. AC 48 from +6 Dexterity, -2 size, and +34 natural armor. Two claws +43 deal 5d8+16, four 15-ft. tongue touches +42 deal 10d4 chaotic damage/19-20, or chaos spittle +33 ranged touch. Stun works eleven times/day, Fortitude DC 34, and can be delivered with claws or tongues. Chaos touch adds 10d4 chaotic damage on a successful tongue attack, then 5d4 each subsequent round for 11 rounds unless neutralized. Chaos spittle has 120-ft. range and deals 20d4 initially plus 10d4 each subsequent round for 11 rounds. Weaponbreaker rolls Sunder damage twice and takes the higher result. At will: animate objects, circle of death, chaos hammer, cloak of chaos, death knell, deeper darkness, dispel law, fear, finger of death, fireball, fly, greater dispelling, identify, improved invisibility, lightning bolt, magic circle against law, plane shift, power word blind, power word kill, protection from law, see invisibility, shatter, teleport without error, word of chaos; 1/day: implosion, peripety, ruin, spell worm (CL 25th; save DC 20 + spell level). Alternate form can assume any humanoid form at will; the source says the ability is otherwise like alter self cast by a 21st-level caster. Three times/day it may summon 2-4 death slaadi with 80% success or 1-2 white slaadi with 40% success. Telepathy 100 ft., darkvision 320 ft., fast healing 30, DR 45/+7, resistance 20 to acid/cold/electricity/fire/sonic, immunity to its own chaos attacks. The printed advancement jumps from 30-45 HD to 56-70 HD; the unexplained 46-55 HD gap is preserved.',
 'outsider',25,29,8,406,'huge',10,15,34,0,0,29,30,22,26,42,22,38,29,30,31,
 'Any land and underground','Solitary or pair','Double standard','CN','Usually chaotic neutral (sometimes chaotic evil)','30-45 HD (Huge); 56-70 HD (Gargantuan) [source gap: 46-55 HD not specified]',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":29,"sourceInitiative":10,"sourceInitiativeNote":"The table prints +10 (+2 Dex, +8 Superior Initiative) while Dex 22 and the AC line use +6 Dex; preserved as source inconsistency.","sourceAdvancementGap":"ELH prints 30-45 HD (Huge); 56-70 HD (Gargantuan), omitting 46-55 HD.","darkvisionFeet":320,"fastHealing":30,"damageReduction":{"amount":45,"bypass":"+7","editionNotation":"3.0"},"resistances":{"acid":20,"cold":20,"electricity":20,"fire":20,"sonic":20},"immuneToOwnChaosAttacks":true,"stun":{"usesPerDay":11,"fortitudeDc":34,"delivery":["claw","tongue"],"basis":"as Stunning Fist"},"chaosTouch":{"delivery":"tongue melee touch","initialDamage":"10d4 chaotic","ongoingDamage":"5d4 chaotic","ongoingRounds":11,"endsIfNeutralized":true},"chaosSpittle":{"rangeFeet":120,"attack":"ranged touch","initialDamage":"20d4 chaotic","ongoingDamage":"10d4 chaotic","ongoingRounds":11,"endsIfNeutralized":true},"weaponbreaker":"When using Sunder, roll damage twice and use the higher result.","spellLikeAbilities":{"atWill":["animate objects","circle of death","chaos hammer","cloak of chaos","death knell","deeper darkness","dispel law","fear","finger of death","fireball","fly","greater dispelling","identify","improved invisibility","lightning bolt","magic circle against law","plane shift","power word blind","power word kill","protection from law","see invisibility","shatter","teleport without error","word of chaos"],"onePerDay":["implosion","peripety","ruin","spell worm"],"casterLevel":25,"saveDc":"20 + spell level"},"alternateForm":{"atWill":true,"action":"standard","forms":"any humanoid","duration":"indefinite","basis":"alter self, source says caster level 21"},"summonSlaad":{"usesPerDay":3,"options":[{"creatures":"2-4 death slaadi","successPercent":80},{"creatures":"1-2 white slaadi","successPercent":40}]},"telepathyFeet":100}}}]')
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
 ('sirrush','land',90,NULL,NULL),
 ('three-headed-sirrush','land',120,NULL,NULL),
 ('white-slaad','land',40,NULL,NULL),
 ('black-slaad','land',80,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('white-slaad','chaotic'),
 ('black-slaad','chaotic')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
