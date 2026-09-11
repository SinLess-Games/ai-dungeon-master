-- Epic Level Handbook monster stat blocks: final Chapter 5 batch.
-- Source: Epic Level Handbook, Chapter 5, pp. 221-230.
-- Includes Elder Titan, Uvuudaum, Vermiurge, and the sample Worm That Walks.
-- The chapter's CR index supplies ECL values; these are retained in metadata and are NOT written into level_adjustment.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,defenses
) AS (VALUES
('elh-monster-elder-titan','221-222','elder-titan','Elder Titan',
 'A colossal primeval forefather of ordinary titans, withdrawn into ancient contemplation and epic magical study.',
 '70d8+700 outsider (1,015 hp). Speed 150 ft. AC 58 from -8 size, +32 natural armor, and +24 insight. A Colossal +5 warhammer attacks at +87/+82/+77/+72 and deals 4d8+30/19-20 (+2d6 on a critical); a Colossal +5 javelin attacks at +70/+65/+60/+55 and deals 2d10+22/19-20. At will: alter self, analyze dweomer, commune with nature, cure critical wounds, eyebite, freedom of movement, fly, fog cloud, produce flame, protection from elements, read magic, remove curse, sanctuary, sending, speak with animals, soften earth and stone, speak with plants, summon monster VI, teleport without error, wind wall; 3/day: antilife shell, astral projection, contact other plane, greater dispelling, greater scrying, invisibility purge, plane shift (CL 29th; save DC 18 + spell level). An elder titan also casts either arcane spells as a 29th-level wizard or divine spells as a 29th-level cleric using the cleric list plus Knowledge and Magic domains, and knows at least three epic spells. SR 40, DR 45/+7.',
 'outsider',30,70,8,700,'colossal',40,25,32,0,0,70,47,37,50,45,10,31,33,37,26,
 'Any','Solitary','Standard','N','Always neutral','71-140 HD (Colossal)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":70,"insightArmorClassBonus":24,"spellResistance":40,"damageReduction":{"amount":45,"bypass":"+7","editionNotation":"3.0"},"spellLikeAbilities":{"atWill":["alter self","analyze dweomer","commune with nature","cure critical wounds","eyebite","freedom of movement","fly","fog cloud","produce flame","protection from elements","read magic","remove curse","sanctuary","sending","speak with animals","soften earth and stone","speak with plants","summon monster VI","teleport without error","wind wall"],"threePerDay":["antilife shell","astral projection","contact other plane","greater dispelling","greater scrying","invisibility purge","plane shift"],"casterLevel":29,"saveDc":"18 + spell level"},"spellcasting":{"choice":["29th-level wizard","29th-level cleric"],"clericDomains":["Knowledge","Magic"],"minimumEpicSpellsKnown":3}}}}]'),

('elh-monster-uvuudaum','224-226','uvuudaum','Uvuudaum',
 'An alien lord from a realm beyond conventional planar geometry whose presence and thoughts carry madness into ordinary reality.',
 '38d8+646 outsider (817 hp). Speed 80 ft., climb 40 ft. AC 52 from +14 Dexterity, -1 size, and +29 natural armor. Head spike +51 deals 10d6+21/19-20 plus Wisdom drain. A continuous 30-ft. confusion aura allows Will DC 47; affected creatures may retry every 4 rounds, and a creature that successfully resists becomes immune to that uvuudaum for 24 hours. The head spike permanently drains 2d4 Wisdom, doubled on a critical; Fortitude DC 47 negates. Each successful drain heals 5 hp, or 10 on a critical, with excess as temporary hp lasting up to 1 hour. At will: confusion, dimension door, greater dispelling, displacement, haste, invisibility, lightning bolt, magic missile, mage armor, polymorph self, shield, stoneskin, true strike, web; 3/day: chain lightning, cone of cold, disintegrate, dominate person, plane shift, prismatic spray, scrying, teleport without error, wall of force; 1/day: contingent resurrection, nailed to the sky, time duplicate, time stop (CL 27th; save DC 28 + spell level). Blindsight 500 ft., telepathy 500 ft., electricity resistance 30, fast healing 20, regeneration 5, SR 39, DR 25/+6. Holy weapons, cold, and fire deal normal damage to its regeneration.',
 'outsider',27,38,8,646,'large',5,15,29,0,0,38,40,37,41,39,38,44,42,38,46,
 'Any','Solitary, pair, or madness (3-6)','Standard','NE','Usually neutral evil','By character class',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":30,"blindsightFeet":500,"telepathyFeet":500,"electricityResistance":30,"fastHealing":20,"regeneration":{"amount":5,"normalDamageFrom":["holy weapons","cold","fire"]},"spellResistance":39,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"confusionAura":{"radiusFeet":30,"willDc":47,"effect":"as confusion","resaveEveryRounds":4,"immunityAfterSuccessfulSaveHours":24},"wisdomDrain":{"delivery":"head spike","amount":"2d4 permanent Wisdom","criticalAmount":"4d4 permanent Wisdom","fortitudeDc":47,"healing":5,"criticalHealing":10,"temporaryHitPointDurationHours":1},"spellLikeAbilities":{"atWill":["confusion","dimension door","greater dispelling","displacement","haste","invisibility","lightning bolt","magic missile","mage armor","polymorph self","shield","stoneskin","true strike","web"],"threePerDay":["chain lightning","cone of cold","disintegrate","dominate person","plane shift","prismatic spray","scrying","teleport without error","wall of force"],"onePerDay":["contingent resurrection","nailed to the sky","time duplicate","time stop"],"casterLevel":27,"saveDc":"28 + spell level"}}}}]'),

('elh-monster-vermiurge','226-227','vermiurge','Vermiurge',
 'A vast scorpionlike aberration surrounded by a perpetually replenishing divine-scale swarm of deadly vermin.',
 '42d8+546 aberration (735 hp). Speed 50 ft., fly 90 ft. (perfect). Printed AC 40 lists +3 Dexterity, -1 size, and +24 natural armor, while the same stat block gives Dexterity 25 and initiative +11 (+7 Dexterity, +4 Improved Initiative); the discrepancy is preserved. Sting +43 deals 1d6+12/19-20 plus poison, four pincers +41 deal 2d8+6/19-20, and bite +40 deals 3d6+6 plus poison. Aura of doom continuously functions as crown of vermin cast at CL 42; it may be suppressed at will and replenishes 200 vermin per round without duration limit, even after all 1,000 vermin are depleted. The aura also grants nine-tenths concealment; the source explicitly states this produces a 40% miss chance. When the aura is first engaged, frightful presence affects lower-HD opponents, Will DC 48 or shaken; success grants 24-hour immunity. Sting or bite poison is Fortitude DC 44, initial 1d6 temporary Constitution, secondary 2d6 temporary Constitution. Darkvision 60 ft., low-light vision, scent, fast healing 10, SR 34, DR 30/+5, immunity to all mind-affecting effects.',
 'aberration',24,42,8,546,'large',5,10,24,0,0,31,27,21,38,34,25,36,18,40,44,
 'Any','Solitary','Standard','LN','Usually lawful neutral','43-52 HD (Large); 53-70 HD (Huge)',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":42,"sourceArmorClass":40,"sourceArmorClassDexterityComponent":3,"calculatedDexterityModifierFromPrintedDexterity":7,"sourceInitiative":11,"sourceInitiativeDexterityComponent":7,"sourceDiscrepancy":"The AC line prints +3 Dex despite Dex 25 and the initiative line using +7 Dex; no silent correction is applied to source prose.","darkvisionFeet":60,"lowLightVision":true,"scent":true,"fastHealing":10,"spellResistance":34,"damageReduction":{"amount":30,"bypass":"+5","editionNotation":"3.0"},"immunities":["all mind-affecting effects"],"auraOfDoom":{"basis":"crown of vermin","casterLevel":42,"suppressAtWill":true,"maximumVermin":1000,"replenishPerRound":200,"duration":"unlimited","doesNotPermanentlyCollapseWhenDepleted":true},"concealingAura":{"sourceConcealment":"nine-tenths concealment","sourceMissChancePercent":40},"frightfulPresence":{"trigger":"first engages aura of doom","targets":"opponents with fewer Hit Dice or levels","willDc":48,"failure":"shaken","successfulSaveImmunityHours":24},"poison":{"delivery":["sting","bite"],"save":"Fortitude","dc":44,"initial":"1d6 temporary Constitution","secondary":"2d6 temporary Constitution"},"sourceSpecialAttacksAlsoListsSpellLikeAbilities":true,"sourceNote":"No separate spell-like-ability list appears before the next monster entry in the retrieved ELH text; no abilities are invented here."}}}}]'),

('elh-monster-worm-that-walks','228-229','worm-that-walks','Worm That Walks',
 'The handbook’s sample worm that walks: the surviving will of a 23rd-level evil wizard inhabiting a humanoid mass of worms.',
 '23d8+46+10 (159 hp). The sample stat block prints Medium-Size Aberration, while the immediately following template says a worm that walks changes type to ooze; this source contradiction is preserved. Speed 30 ft. AC 47 from +4 effective Dexterity, +8 bracers of armor, +3 ring of protection, +2 amulet of natural armor, and +20 insight. A +4 staff attacks +15/+10 for 1d6+4. The sample retains 23rd-level wizard casting (4/12/6/6/6/5/5/5/5/4/1/1 spell slots, with the final slots being 10th- and 11th-level metamagic slots). Once/day: animal friendship (vermin), animal growth (vermin), animal messenger (vermin), animal shapes (vermin), animal trance (vermin), colossal vermin, creeping doom, giant vermin, summon swarm (vermin), summon vermin, vermin plague (CL 20th; save DC 9 + spell level). Engulf may target up to one size category larger: melee touch, 100 damage immediately and each round until the victim spends a full-round action to escape; constructs are immune. Frightful presence triggers when it engulfs. As a free action it can discorporate into ordinary component vermin; if any survive, they can breed a new body. Blindsight 300 ft., SR 36. The printed character has base Str 10, Dex 14, Con 13, Int 20, Wis 12, Cha 8, modified by gloves of Dexterity +4, pink Ioun stone, and headband of intellect +6.',
 'aberration',26,23,8,56,'medium',5,5,2,8,3,11,11,14,17,10,14,13,20,12,8,
 'Any','Solitary','As character',NULL,'Any evil','By character class',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"sourceEcl":27,"sourceCreatureType":"Aberration","templateCreatureType":"Ooze","sourceTypeDiscrepancy":"The sample on p. 228 is Aberration; the template on p. 229 explicitly changes type to ooze.","insightArmorClassBonus":20,"blindsightFeet":300,"spellResistance":36,"effectiveAbilityScoresWithGear":{"dexterity":18,"constitution":15,"intelligence":26},"equipmentArmorClass":{"bracersArmor":8,"ringDeflection":3,"amuletNaturalArmor":2},"spellcasting":{"class":"wizard","casterLevel":23,"spellsPerDay":"4/12/6/6/6/5/5/5/5/4/1/1","highestSlots":"10th and 11th, usable for metamagic 0-9th-level spells"},"spellLikeAbilities":{"usesPerDay":1,"abilities":["animal friendship (vermin)","animal growth (vermin)","animal messenger (vermin)","animal shapes (vermin)","animal trance (vermin)","colossal vermin","creeping doom","giant vermin","summon swarm (vermin)","summon vermin","vermin plague"],"casterLevel":20,"saveDc":"9 + spell level"},"engulf":{"maximumTargetSize":"one category larger","attack":"melee touch","damageInitial":100,"damagePerRound":100,"escape":"full-round action, then may move up to half speed and do nothing else","constructsImmune":true},"frightfulPresence":{"trigger":"engulf","willDc":"10 + floor(HD/2) + Charisma modifier","successfulSave":"shaken","failureByUpTo5":"frightened","failureBy6To10":"panicked","failureBy11OrMore":"cowering","duration":"1d4 rounds","priorWitnessSaveBonus":5,"engulfedVictimSavePenalty":-5},"discorporate":{"action":"free","survival":"new body can form if any component vermin survive","componentVerminBecomeOrdinary":true,"equipmentMayBeLost":true}}}}]')
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
 ('elder-titan','land',150,NULL,NULL),
 ('uvuudaum','land',80,NULL,NULL),('uvuudaum','climb',40,NULL,NULL),
 ('vermiurge','land',50,NULL,NULL),('vermiurge','fly',90,'perfect',NULL),
 ('worm-that-walks','land',30,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('uvuudaum','evil')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
