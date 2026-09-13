-- Epic Level Handbook monster stat blocks: neh-thalggu, paragon mind flayer, prismasaurus, and pseudonatural troll.
-- Source: Epic Level Handbook, Chapter 5, pp. 207-213.
-- Preserve the book's 3.0 statistics and terminology.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr,hd,die,hp_bonus,size,space,reach,natural_armor,armor_bonus,deflection_bonus,bab,
  fort,ref,will,str,dex,con,intel,wis,cha,environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses
) AS (VALUES
('elh-monster-neh-thalggu','207-208','neh-thalggu','Neh-Thalggu (Brain Collector)',
 'A partially extradimensional aberration from the Far Realm that harvests and stores humanoid brains to fuel its spellcasting and knowledge.',
 '32d8+192 aberration (336 hp). Speed 60 ft., with quickened dimension door once per round and at-will teleport without error or plane shift as move-equivalent actions. AC 35 from -2 size, +4 Dexterity, +3 deflection, and +20 insight. Bite +26 deals 4d10+12 plus poison; ten incorporeal head-tentacles attack at +21 melee touch for 2d10 desiccation plus permanent drain of 1 Strength, 1 Dexterity, and 1 Constitution per hit. Bite poison Fortitude DC 32 immediately removes half current Constitution on a failed save and repeats after 1 minute for half remaining Constitution. Once every 1d4 rounds as a full-round action, extract brains targets a creature in line of sight: Will DC 31 negates extraction; on success the brain is removed and stored, while a successful save instead causes 9d6 damage and stun for 1d4+1 rounds. Dimensional anchor blocks extraction. It normally carries thirteen brains; each missing brain gives one negative level that never becomes permanent. Each stored brain grants access to its Knowledge skill ranks, and thirteen brains provide 13th-level sorcerer casting. Its incorporeal nature gives 50% miss against corporeal damage, except the manifested bite is corporeal. Amorphous physiology grants immunity to critical hits, massive-damage death, sneak attacks, and coup de grace. It can manifest its maw as a standard action, biting as Strength 35. DR 25/+6, SR 30, darkvision 60 ft.',
 'aberration',26,32,8,192,'huge',10,10,0,0,3,24,16,14,23,NULL,19,22,20,20,17,
 'Any','Solitary or troupe (1 neh-thalggu and 2d4 illithids) or pairbond (1 neh-thalggu and 1 paragon illithid)','Triple standard',NULL,'Usually chaotic neutral, neutral evil, or chaotic evil','33-66 HD (Gargantuan); 67-112 HD (Colossal)',32,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"incorporeal":true,"insightArmorClassBonus":20,"spellResistance":30,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"darkvisionFeet":60,"telepathyFeet":100,"amorphousPhysiology":{"immuneTo":["critical hits","death from massive damage","sneak attacks","coup de grace"]},"poison":{"delivery":"bite","save":"Fortitude","dc":32,"initial":"lose half current Constitution","secondaryAfter":"1 minute","secondary":"lose half remaining Constitution"},"headTentacles":{"count":10,"attackType":"incorporeal melee touch","damage":"2d10 desiccation","abilityDrain":{"strength":1,"dexterity":1,"constitution":1}},"extractBrains":{"frequency":"once every 1d4 rounds","action":"full-round","range":"line of sight","willDc":31,"failedSave":"brain extracted and stored","successfulSave":"9d6 damage and stunned 1d4+1 rounds","blockedBy":"dimensional anchor","maximumStoredBrains":13,"missingBrainPenalty":"one negative level per missing brain; never converts to level loss"},"dimensionalTravel":{"quickenedDimensionDoor":"once per round","atWillMoveEquivalent":["teleport without error","plane shift"]},"spellcasting":{"class":"sorcerer","casterLevel":"one per stored brain; normally 13"},"manifestMaw":{"action":"standard","effectiveStrength":35}}}}]'),

('elh-monster-paragon-mind-flayer','209-210','paragon-mind-flayer','Paragon Mind Flayer',
 'A mind flayer enhanced by the Epic Level Handbook paragon template, representing an exceptionally powerful specimen of its kind.',
 '8d8+64 plus 96 paragon aberration (224 hp; paragon maximum-hit-point rule is included). Speed 90 ft. AC 50 from +9 Dexterity, +7 natural armor, +12 insight, and +12 luck. Four tentacles +40 deal 1d4+28. Mind blast is a 60-ft. cone, Will DC 38 or stunned 3d4 rounds. At will psionics: astral projection, charm monster, detect thoughts, levitate, plane shift, suggestion; 3/day greater dispelling, haste, see invisibility (CL 23rd; save DC 34 + spell level). Tentacle hits enable improved grab; once all four are attached and the hold is maintained at the start of its turn, extract instantly kills by removing the brain. Telepathy 1,000 ft. SR 35, fire/cold resistance 10, DR 20/+6 plus 3/-, fast healing 23.',
 'aberration',23,8,8,160,'medium',5,5,7,0,0,6,22,21,27,27,29,27,34,32,32,
 'Any underground','Solitary, pair, or group (2 paragon mind flayers plus 4-8 mind flayers)','Standard','LE','Usually lawful evil','By character class',26,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"template":"Paragon","printedHitPoints":224,"maximumHitPointsPerHitDie":true,"insightArmorClassBonus":12,"luckArmorClassBonus":12,"spellResistance":35,"telepathyFeet":1000,"resistances":{"fire":10,"cold":10},"damageReduction":["20/+6","3/-"],"fastHealing":23,"mindBlast":{"shape":"60-foot cone","willDc":38,"failure":"stunned 3d4 rounds"},"psionics":{"atWill":["astral projection","charm monster","detect thoughts","levitate","plane shift","suggestion"],"threePerDay":["greater dispelling","haste","see invisibility"],"casterLevel":23,"saveDc":"34 + spell level"},"improvedGrab":{"trigger":"tentacle","normalTargets":"Small through Large","largerTargets":"possible if head can be reached","escapeBonusPerAttachedTentacle":2},"extract":{"requirement":"begin turn with all four tentacles attached and maintain hold","effect":"instant death by brain extraction"}}}}]'),

('elh-monster-prismasaurus','210-211','prismasaurus','Prismasaurus',
 'A huge magical beast whose crystalline dorsal ridge refracts sunlight into constant prismatic magical effects.',
 '60d10+540 magical beast (870 hp). Speed 30 ft. AC 55 from -2 size, +7 Dexterity, and +40 natural armor. Bite +72 deals 8d10+11/19-20 plus 1d6 on a critical; tail +65 deals 10d6+5. Its prismatic emanations resemble prismatic spray (DC 49): creatures under 8 HD within 30 ft. are automatically blinded for 2d4 rounds, while creatures within 20 ft. are randomly struck by prismatic rays as a 20th-level caster. The source describes the ray field as a 30-ft.-radius-spread-equivalent effect while separately stating the 20-ft. trigger radius; both values are retained. It takes half damage from all weapons and is immune to poison, gases, petrification, and mind-affecting attacks. Prismatic blur imposes 50% miss chance on all melee and ranged attacks. SR 38, DR 20/+6.',
 'magical-beast',28,60,10,540,'huge',10,10,40,0,0,60,41,39,24,32,25,29,4,19,10,
 'Any sunny land','Solitary or pair','None','N','Always neutral','61-90 HD (Huge); 91-150 HD (Gargantuan)',60,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"spellResistance":38,"damageReduction":{"amount":20,"bypass":"+6","editionNotation":"3.0"},"weaponDamageMultiplier":0.5,"immunities":["poison","gases","petrification","mind-affecting attacks"],"prismaticBlur":{"missChancePercent":50,"appliesTo":["melee attacks","ranged attacks"]},"prismaticEmanations":{"saveDc":49,"under8HdBlind":{"radiusFeet":30,"duration":"2d4 rounds"},"rayTriggerRadiusFeet":20,"sourceAlsoDescribesEffectAs":"prismatic spray in a 30-foot-radius spread","casterLevel":20}}}}]'),

('elh-monster-pseudonatural-troll','211-212','pseudonatural-troll','Pseudonatural Troll',
 'A troll transformed by the Epic Level Handbook pseudonatural template into an alien outsider with five tentacled limbs.',
 '6d8+66 outsider (114 hp; pseudonatural maximum-hit-point rule yields the printed total). Speed 60 ft. AC 51 from -1 size, +7 Dexterity, and +35 natural armor. Five tentacle rakes +35 deal 2d8+17. Constant insight gives +15 on attacks and grapples and ignores concealment miss chance. Tentacles can improved grab smaller creatures; two or more hits rend for 4d8+25. Successful grapple checks after gaining a hold permanently drain 2d4 Constitution and heal the pseudotroll 10 hp. Fire and acid deal normal damage to its regeneration 5; severed parts regrow in 1 minute or can be reattached immediately. At will: blur, dimension door, shield, unhallow (CL 20th; save DC 8 + spell level). Alternate form is usable at will as a standard action and changes only appearance; enemies take -1 morale on attacks against it in that form. DR 25/+6, SR 30, acid/electricity resistance 20, darkvision 90 ft., scent.',
 'outsider',21,6,8,66,'large',5,10,35,0,0,6,16,9,8,45,24,33,6,19,6,
 'Any','Solitary or gang (2-4)','Standard','CE','Always chaotic evil','By character class',24,
 '[{"kind":"custom","extension":{"key":"dnd35.elh.monster.defenses","version":1,"parameters":{"template":"Pseudonatural","maximumHitPointsPerHitDie":true,"spellResistance":30,"damageReduction":{"amount":25,"bypass":"+6","editionNotation":"3.0"},"resistances":{"acid":20,"electricity":20},"regeneration":{"amount":5,"normalDamageFrom":["fire","acid"],"lostPartRegrowth":"1 minute","reattach":"instant when held to stump"},"darkvisionFeet":90,"scent":true,"constantInsight":{"attackAndGrappleBonus":15,"ignoresConcealmentMissChance":true},"improvedGrab":{"trigger":"tentacle rake","target":"smaller opponent"},"rend":{"trigger":"two or more tentacle rake hits","damage":"4d8+25"},"rottingConstriction":{"constitutionDrain":"2d4 permanent per successful subsequent grapple","healing":10},"spellLikeAbilities":{"atWill":["blur","dimension door","shield","unhallow"],"casterLevel":20,"saveDc":"8 + spell level"},"alternateForm":{"atWill":true,"action":"standard","mechanicsUnchanged":true,"enemyAttackMoralePenalty":-1}}}}]')
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
 ('neh-thalggu','land',60,NULL,'Also uses quickened dimension door once/round and teleport without error or plane shift at will as move-equivalent actions.'),
 ('paragon-mind-flayer','land',90,NULL,NULL),
 ('prismasaurus','land',30,NULL,NULL),
 ('pseudonatural-troll','land',60,NULL,NULL)
)
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
SELECT m.id,d.mode,d.feet,d.maneuverability,d.rules_text
FROM movement d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL;

WITH subtype(monster_slug,subtype_slug) AS (VALUES
 ('neh-thalggu','incorporeal')
)
INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT m.id,st.id
FROM subtype d
JOIN dnd35_monsters m ON m.source_id='elh-3.0' AND m.slug=d.monster_slug AND m.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
