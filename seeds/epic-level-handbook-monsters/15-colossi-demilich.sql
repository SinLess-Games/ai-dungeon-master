-- Epic Level Handbook monster stat blocks: colossi and demilich.
-- Source: Epic Level Handbook, Chapter 5, pp. 171-176.
-- Preserve the book's 3.0 statistics and terminology.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-stone-colossus','171-172','stone-colossus','Stone Colossus',
 'A seventy-foot construct chiseled from a single immense block of stone.',
 '64d10 construct (352 hp). Speed 40 ft.; cannot run. AC 44 from -8 size, -3 Dexterity, and +45 natural armor. Two slams +70 deal 8d6+30. As a free action once every 2 rounds it can use shatter against an opponent''s weapon or item as a 24th-level caster. Construct traits, DR 30/+6, darkvision 60 ft., and constant 100-ft.-radius antimagic field as a 25th-level caster. Magic immunity blocks spells, spell-like abilities, and supernatural effects except transmute rock to mud slows it for 1 round without a save and transmute mud to rock restores all lost hit points; stone to flesh has no effect.',
 'construct',24,64,10,0,'colossal',40,25,45,0,0,48,21,18,21,70,5,NULL,7,10,5,
 'Any','Solitary','None','N','Usually neutral','65-192 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"darkvisionFeet":60,"magicImmunity":true,"antimagicField":{"radiusFeet":100,"casterLevel":25},"damageReduction":{"amount":30,"bypass":"+6","editionNotation":"3.0"},"magicExceptions":{"transmuteRockToMud":"slowed 1 round, no save","transmuteMudToRock":"heals all lost hit points","stoneToFlesh":"no effect"}}}}]'),

('elh-monster-flesh-colossus','172-173','flesh-colossus','Flesh Colossus',
 'A colossal necromantic construct assembled from hundreds of humanoid corpses and animated by a bound ghost.',
 '100d10 construct (550 hp). Speed 40 ft.; cannot run. AC 45 from -8 size, -2 Dexterity, +25 natural armor, and +20 profane. A Colossal club +79 deals 6d6+18; two slams +79 deal 4d6+12; a thrown object up to 10 tons uses +65 ranged and deals 4d6+12. Frightful presence extends 1 mile (Will DC 56), horrific appearance 1/day affects viewers within 300 ft. (Fort DC 56 or 2d4 temporary Str, Dex, and Con damage), stomp is a full-round attack that uses +65, deals 8d6+24, and pins, and its 300-ft. stench forces Fort DC 60 or nausea. Construct traits, DR 20/+7, magic immunity except negative-energy effects, and negative-energy affinity: targeted negative-energy spells repair 1d10 hp per spell level. Intelligence, Wisdom, and Charisma may instead use the bound controlling spirit''s scores.',
 'construct',27,100,10,0,'colossal',40,25,25,0,0,75,33,31,33,35,6,NULL,1,11,3,
 'Any','Solitary','None','NE','Neutral evil or neutral; mental abilities may vary with controlling spirit','None; abilities may vary by level of possessing spirit',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"profaneArmorClassBonus":20,"magicImmunity":true,"damageReduction":{"amount":20,"bypass":"+7","editionNotation":"3.0"},"negativeEnergyAffinity":{"healingPerSpellLevel":"1d10"},"controllingSpiritCanReplaceMentalScores":true}}}]'),

('elh-monster-iron-colossus','173-174','iron-colossus','Iron Colossus',
 'An eighty-foot construct sculpted from enormous quantities of pure iron.',
 '96d10 construct (528 hp). Speed 50 ft.; cannot run. AC 60 from -8 size, -2 Dexterity, and +60 natural armor. Two slams +99 deal 12d6+35. Every 1d4 rounds, as a free action, it exhales an 80-ft. cone of poisonous gas: initial 3d6 temporary Constitution and secondary 2d6 temporary Constitution, Fortitude DC 58 half. Construct traits, DR 30/+7, rustproof, darkvision 60 ft., and constant 100-ft.-radius antimagic field. It is immune to magical and supernatural effects; electricity instead restores 1 hp per 3 points of damage it would have dealt.',
 'construct',33,96,10,0,'colossal',40,25,60,0,0,72,32,30,33,80,7,NULL,9,12,7,
 'Any','Solitary','None','N','Usually neutral','97-288 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"constructTraits":true,"darkvisionFeet":60,"magicImmunity":true,"antimagicField":{"radiusFeet":100},"rustproof":true,"damageReduction":{"amount":30,"bypass":"+7","editionNotation":"3.0"},"electricityHealing":"1 hp per 3 damage prevented"}}}]'),

('elh-monster-demilich','174-176','demilich','Demilich',
 'An ancient lich whose body has decayed to a gem-studded skull and whose soul has become extraordinarily difficult to threaten.',
 '21d12 undead (130 hp). Fly 180 ft. (perfect). AC 51; the source lists +4 size, +3 Dexterity, +5 natural armor, +8 bracers of armor, +2 ring of protection, and +21 insight. Touch +21 deals 10d6+20 plus paralyzing touch. Special attacks include trap the soul, fear aura, paralyzing touch, 21st-level wizard spellcasting, Perfect Automatic Still Spell, and spell-like abilities. Magic immunity, phylactery transference, turn resistance +20, DR 30/-, undead traits, acid/fire/sonic resistance 20, and immunity to cold, electricity, polymorph, and mind-affecting attacks. The demilich has natural 180-ft. perfect flight even when antimagic suppresses supernatural effects.',
 'undead',29,21,12,0,'diminutive',1,0,5,8,2,10,10,12,17,10,16,NULL,39,24,20,
 'Any','Solitary','Standard','NE','Neutral evil','By character class',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"undeadTraits":true,"insightArmorClassBonus":21,"magicImmunity":true,"turnResistance":20,"damageReduction":{"amount":30,"bypass":"none","editionNotation":"3.0"},"resistances":{"acid":20,"fire":20,"sonic":20},"immunities":["cold","electricity","polymorph","mind-affecting"],"phylacteryTransference":true,"naturalFlightPersistsInAntimagic":true}}}]')
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
 ('stone-colossus','land',40,NULL,'Cannot run.'),
 ('flesh-colossus','land',40,NULL,'Cannot run.'),
 ('iron-colossus','land',50,NULL,'Cannot run.'),
 ('demilich','fly',180,'perfect','Natural flight; remains available in antimagic.')
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;
