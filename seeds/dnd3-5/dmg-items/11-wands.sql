-- Dungeon Master's Guide v3.5 Chapter 7: wands, pp. 245-246.
-- Includes every Table 7-26 wand entry/caster-level variant, wand physical and activation rules,
-- construction/pricing behavior, and the complete minor/medium/major random-generation table.
-- Spell mechanics remain normalized to the spell catalog rather than duplicated here.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_wand_seed AS
SELECT
  json_extract(value,'$[0]') id,
  json_extract(value,'$[1]') slug,
  json_extract(value,'$[2]') name,
  json_extract(value,'$[3]') spell_name,
  json_extract(value,'$[4]') spell_level,
  json_extract(value,'$[5]') caster_level,
  json_extract(value,'$[6]') price_copper,
  json_extract(value,'$[7]') special_text
FROM json_each('[
 ["dmg-wand-detect-magic","wand-detect-magic","Wand of Detect Magic","detect magic",0,1,37500,null],
 ["dmg-wand-light","wand-light","Wand of Light","light",0,1,37500,null],
 ["dmg-wand-burning-hands","wand-burning-hands","Wand of Burning Hands","burning hands",1,1,75000,null],
 ["dmg-wand-charm-animal","wand-charm-animal","Wand of Charm Animal","charm animal",1,1,75000,null],
 ["dmg-wand-charm-person","wand-charm-person","Wand of Charm Person","charm person",1,1,75000,null],
 ["dmg-wand-color-spray","wand-color-spray","Wand of Color Spray","color spray",1,1,75000,null],
 ["dmg-wand-cure-light-wounds","wand-cure-light-wounds","Wand of Cure Light Wounds","cure light wounds",1,1,75000,null],
 ["dmg-wand-detect-secret-doors","wand-detect-secret-doors","Wand of Detect Secret Doors","detect secret doors",1,1,75000,null],
 ["dmg-wand-enlarge-person","wand-enlarge-person","Wand of Enlarge Person","enlarge person",1,1,75000,null],
 ["dmg-wand-magic-missile-cl1","wand-magic-missile-cl1","Wand of Magic Missile (CL 1st)","magic missile",1,1,75000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-shocking-grasp","wand-shocking-grasp","Wand of Shocking Grasp","shocking grasp",1,1,75000,null],
 ["dmg-wand-summon-monster-1","wand-summon-monster-1","Wand of Summon Monster I","summon monster I",1,1,75000,null],
 ["dmg-wand-magic-missile-cl3","wand-magic-missile-cl3","Wand of Magic Missile (CL 3rd)","magic missile",1,3,225000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-magic-missile-cl5","wand-magic-missile-cl5","Wand of Magic Missile (CL 5th)","magic missile",1,5,375000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-bears-endurance","wand-bears-endurance","Wand of Bear''s Endurance","bear''s endurance",2,3,450000,null],
 ["dmg-wand-bulls-strength","wand-bulls-strength","Wand of Bull''s Strength","bull''s strength",2,3,450000,null],
 ["dmg-wand-cats-grace","wand-cats-grace","Wand of Cat''s Grace","cat''s grace",2,3,450000,null],
 ["dmg-wand-cure-moderate-wounds","wand-cure-moderate-wounds","Wand of Cure Moderate Wounds","cure moderate wounds",2,3,450000,null],
 ["dmg-wand-darkness","wand-darkness","Wand of Darkness","darkness",2,3,450000,null],
 ["dmg-wand-daylight","wand-daylight","Wand of Daylight","daylight",2,3,450000,"Table 7-26 prices this entry as a 2nd-level, CL 3 wand; preserve the source table entry for treasure generation."],
 ["dmg-wand-delay-poison","wand-delay-poison","Wand of Delay Poison","delay poison",2,3,450000,null],
 ["dmg-wand-eagles-splendor","wand-eagles-splendor","Wand of Eagle''s Splendor","eagle''s splendor",2,3,450000,null],
 ["dmg-wand-false-life","wand-false-life","Wand of False Life","false life",2,3,450000,null],
 ["dmg-wand-foxs-cunning","wand-foxs-cunning","Wand of Fox''s Cunning","fox''s cunning",2,3,450000,null],
 ["dmg-wand-ghoul-touch","wand-ghoul-touch","Wand of Ghoul Touch","ghoul touch",2,3,450000,null],
 ["dmg-wand-hold-person","wand-hold-person","Wand of Hold Person","hold person",2,3,450000,null],
 ["dmg-wand-invisibility","wand-invisibility","Wand of Invisibility","invisibility",2,3,450000,null],
 ["dmg-wand-knock","wand-knock","Wand of Knock","knock",2,3,450000,null],
 ["dmg-wand-levitate","wand-levitate","Wand of Levitate","levitate",2,3,450000,null],
 ["dmg-wand-melfs-acid-arrow","wand-melfs-acid-arrow","Wand of Melf''s Acid Arrow","Melf''s acid arrow",2,3,450000,null],
 ["dmg-wand-mirror-image","wand-mirror-image","Wand of Mirror Image","mirror image",2,3,450000,null],
 ["dmg-wand-owls-wisdom","wand-owls-wisdom","Wand of Owl''s Wisdom","owl''s wisdom",2,3,450000,null],
 ["dmg-wand-shatter","wand-shatter","Wand of Shatter","shatter",2,3,450000,null],
 ["dmg-wand-silence","wand-silence","Wand of Silence","silence",2,3,450000,null],
 ["dmg-wand-summon-monster-2","wand-summon-monster-2","Wand of Summon Monster II","summon monster II",2,3,450000,null],
 ["dmg-wand-web","wand-web","Wand of Web","web",2,3,450000,null],
 ["dmg-wand-magic-missile-cl7","wand-magic-missile-cl7","Wand of Magic Missile (CL 7th)","magic missile",1,7,525000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-magic-missile-cl9","wand-magic-missile-cl9","Wand of Magic Missile (CL 9th)","magic missile",1,9,675000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-call-lightning-cl5","wand-call-lightning-cl5","Wand of Call Lightning (CL 5th)","call lightning",3,5,1125000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-charm-person-heightened-3","wand-charm-person-heightened-3","Wand of Charm Person, Heightened (3rd)","charm person",3,5,1125000,"Charm person heightened to a 3rd-level spell."],
 ["dmg-wand-contagion","wand-contagion","Wand of Contagion","contagion",3,5,1125000,null],
 ["dmg-wand-cure-serious-wounds","wand-cure-serious-wounds","Wand of Cure Serious Wounds","cure serious wounds",3,5,1125000,null],
 ["dmg-wand-dispel-magic","wand-dispel-magic","Wand of Dispel Magic","dispel magic",3,5,1125000,null],
 ["dmg-wand-fireball-cl5","wand-fireball-cl5","Wand of Fireball (CL 5th)","fireball",3,5,1125000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-keen-edge","wand-keen-edge","Wand of Keen Edge","keen edge",3,5,1125000,null],
 ["dmg-wand-lightning-bolt-cl5","wand-lightning-bolt-cl5","Wand of Lightning Bolt (CL 5th)","lightning bolt",3,5,1125000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-major-image","wand-major-image","Wand of Major Image","major image",3,5,1125000,null],
 ["dmg-wand-slow","wand-slow","Wand of Slow","slow",3,5,1125000,null],
 ["dmg-wand-suggestion","wand-suggestion","Wand of Suggestion","suggestion",3,5,1125000,null],
 ["dmg-wand-summon-monster-3","wand-summon-monster-3","Wand of Summon Monster III","summon monster III",3,5,1125000,null],
 ["dmg-wand-fireball-cl6","wand-fireball-cl6","Wand of Fireball (CL 6th)","fireball",3,6,1350000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-lightning-bolt-cl6","wand-lightning-bolt-cl6","Wand of Lightning Bolt (CL 6th)","lightning bolt",3,6,1350000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-searing-light-cl6","wand-searing-light-cl6","Wand of Searing Light (CL 6th)","searing light",3,6,1350000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-call-lightning-cl8","wand-call-lightning-cl8","Wand of Call Lightning (CL 8th)","call lightning",3,8,1800000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-fireball-cl8","wand-fireball-cl8","Wand of Fireball (CL 8th)","fireball",3,8,1800000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-lightning-bolt-cl8","wand-lightning-bolt-cl8","Wand of Lightning Bolt (CL 8th)","lightning bolt",3,8,1800000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-charm-monster","wand-charm-monster","Wand of Charm Monster","charm monster",4,7,2100000,null],
 ["dmg-wand-cure-critical-wounds","wand-cure-critical-wounds","Wand of Cure Critical Wounds","cure critical wounds",4,7,2100000,null],
 ["dmg-wand-dimensional-anchor","wand-dimensional-anchor","Wand of Dimensional Anchor","dimensional anchor",4,7,2100000,null],
 ["dmg-wand-fear","wand-fear","Wand of Fear","fear",4,7,2100000,null],
 ["dmg-wand-greater-invisibility","wand-greater-invisibility","Wand of Greater Invisibility","greater invisibility",4,7,2100000,null],
 ["dmg-wand-hold-person-heightened-4","wand-hold-person-heightened-4","Wand of Hold Person, Heightened (4th)","hold person",4,7,2100000,"Hold person heightened to a 4th-level spell."],
 ["dmg-wand-ice-storm","wand-ice-storm","Wand of Ice Storm","ice storm",4,7,2100000,null],
 ["dmg-wand-inflict-critical-wounds","wand-inflict-critical-wounds","Wand of Inflict Critical Wounds","inflict critical wounds",4,7,2100000,null],
 ["dmg-wand-neutralize-poison","wand-neutralize-poison","Wand of Neutralize Poison","neutralize poison",4,7,2100000,null],
 ["dmg-wand-poison","wand-poison","Wand of Poison","poison",4,7,2100000,null],
 ["dmg-wand-polymorph","wand-polymorph","Wand of Polymorph","polymorph",4,7,2100000,null],
 ["dmg-wand-ray-enfeeblement-heightened-4","wand-ray-enfeeblement-heightened-4","Wand of Ray of Enfeeblement, Heightened (4th)","ray of enfeeblement",4,7,2100000,"Ray of enfeeblement heightened to a 4th-level spell."],
 ["dmg-wand-suggestion-heightened-4","wand-suggestion-heightened-4","Wand of Suggestion, Heightened (4th)","suggestion",4,7,2100000,"Suggestion heightened to a 4th-level spell."],
 ["dmg-wand-summon-monster-4","wand-summon-monster-4","Wand of Summon Monster IV","summon monster IV",4,7,2100000,null],
 ["dmg-wand-wall-fire","wand-wall-of-fire","Wand of Wall of Fire","wall of fire",4,7,2100000,null],
 ["dmg-wand-wall-ice","wand-wall-of-ice","Wand of Wall of Ice","wall of ice",4,7,2100000,null],
 ["dmg-wand-dispel-magic-cl10","wand-dispel-magic-cl10","Wand of Dispel Magic (CL 10th)","dispel magic",3,10,2250000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-fireball-cl10","wand-fireball-cl10","Wand of Fireball (CL 10th)","fireball",3,10,2250000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-lightning-bolt-cl10","wand-lightning-bolt-cl10","Wand of Lightning Bolt (CL 10th)","lightning bolt",3,10,2250000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-chaos-hammer-cl8","wand-chaos-hammer-cl8","Wand of Chaos Hammer (CL 8th)","chaos hammer",4,8,2400000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-holy-smite-cl8","wand-holy-smite-cl8","Wand of Holy Smite (CL 8th)","holy smite",4,8,2400000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-orders-wrath-cl8","wand-orders-wrath-cl8","Wand of Order''s Wrath (CL 8th)","order''s wrath",4,8,2400000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-unholy-blight-cl8","wand-unholy-blight-cl8","Wand of Unholy Blight (CL 8th)","unholy blight",4,8,2400000,"Table 7-26 fixed caster-level variant."],
 ["dmg-wand-restoration","wand-restoration","Wand of Restoration","restoration",4,7,2600000,"Creation footnote: 10,500 gp and 840 XP, plus 5,000 gp for material components."],
 ["dmg-wand-stoneskin","wand-stoneskin","Wand of Stoneskin","stoneskin",4,7,3350000,"Creation footnote: 10,500 gp and 840 XP, plus 12,500 gp for material components."]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT
 w.id,'dmg-3.5','245-246',w.slug,w.name,
 'A 50-charge spell-trigger wand storing '||w.spell_name||'.',
 'Each activation expends one charge and produces '||w.spell_name||' at caster level '||w.caster_level||'. '
   ||COALESCE(w.special_text,''),
 0,NULL,1,'magic',w.price_copper,NULL,NULL,5,5
FROM _dmg_wand_seed w
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=w.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT
 w.id,NULL,w.caster_level,NULL,
 CASE WHEN w.caster_level<=5 THEN 'faint' WHEN w.caster_level<=11 THEN 'moderate' ELSE 'strong' END,
 'spell_trigger','Point the wand toward the target or area and activate its stored spell; normally a standard action unless the spell has a longer casting time.',
 'main_hand',50,'Charges do not recharge; at 0 charges the wand becomes a nonmagical stick.',0,
 CASE WHEN w.slug IN ('wand-restoration','wand-stoneskin') THEN 1050000 ELSE CAST(w.price_copper/2 AS INTEGER) END,
 CASE WHEN w.slug IN ('wand-restoration','wand-stoneskin') THEN 840 ELSE CAST(w.price_copper/2500 AS INTEGER) END,
 'Craft Wand; '||w.spell_name||'.'||
 CASE WHEN w.slug='wand-restoration' THEN ' Creation additionally consumes 5,000 gp of material components.'
      WHEN w.slug='wand-stoneskin' THEN ' Creation additionally consumes 12,500 gp of material components.'
      ELSE '' END,
 NULL
FROM _dmg_wand_seed w;

DROP TABLE _dmg_wand_seed;

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-wand-definition','Wand Definition and Charge Limit','245','rule',
 'A wand is a thin baton containing one spell of 4th level or lower. A newly created wand has 50 charges; each activation expends one charge, and a wand with no charges left is an ordinary stick.',
 '["magic-items","wands","charges"]',
 '{"storedSpells":1,"maximumSpellLevel":4,"initialCharges":50,"chargesPerActivation":1,"recharge":false,"atZeroCharges":"nonmagical-stick"}'),
('dmg-wand-physical-statistics','Wand Physical Statistics','245','rule',
 'A typical wand is 6 to 12 inches long and about one-quarter inch thick, commonly wood or bone. Typical object statistics are AC 7, 5 hit points, hardness 5, and break DC 16.',
 '["magic-items","wands","objects"]',
 '{"lengthInches":{"min":6,"max":12},"thicknessInches":0.25,"typicalMaximumWeightOunces":1,"armorClass":7,"hitPoints":5,"hardness":5,"breakDc":16}'),
('dmg-wand-activation','Wand Spell-Trigger Activation','245','rule',
 'Wands use spell-trigger activation. Activation is normally a standard action that does not provoke attacks of opportunity; if the stored spell takes longer, use that casting time. The user must hold the wand and point it generally toward the target or area. A wand can be used while grappling or swallowed whole.',
 '["magic-items","wands","spell-trigger","activation"]',
 '{"activationType":"spell_trigger","defaultAction":"standard","provokesAttackOfOpportunity":false,"longerStoredSpellCastingTimeOverrides":true,"mustHold":true,"mustPointGenerallyAtTarget":true,"usableWhileGrappling":true,"usableWhileSwallowedWhole":true}'),
('dmg-wand-use-magic-device','Use Magic Device with Wands','245','rule',
 'A character who cannot normally use the wand through a class spell list can attempt Use Magic Device under the standard spell-trigger item rules.',
 '["magic-items","wands","use-magic-device"]',
 '{"useMagicDeviceDc":20,"purpose":"activate spell-trigger item when normal class-list access is unavailable"}'),
('dmg-wand-special-qualities','Random Wand Special Qualities','245','table',
 'A randomly generated wand has a design, inscription, or similar clue to its function on 01-30 and no special quality on 31-100.',
 '["magic-items","wands","random-generation"]',
 '{"ranges":[[1,30,"function-clue"],[31,100,"none"]]}'),
('dmg-wand-price-formula','Wand Market Price Formula','245-246','rule',
 'A standard full 50-charge wand has base market price equal to spell level times caster level times 750 gp, with a 0-level spell treated as one-half level. Expensive components and XP costs alter creation and market price under the magic-item creation rules.',
 '["magic-items","wands","pricing","creation"]',
 '{"baseMarketPriceGp":"spell level * caster level * 750","zeroLevelPricingLevel":0.5,"fullCharges":50,"expensiveComponentsAdjustPrice":true,"xpCostsAdjustPrice":true}'),
('dmg-wand-creation','Craft Wand Construction','245,282-288','rule',
 'Craft Wand creates a 50-charge spell-trigger item containing one spell of 4th level or lower. The creator must supply the spell and meet the general magic-item creation requirements.',
 '["magic-items","wands","creation","craft-wand"]',
 '{"feat":"Craft Wand","maximumSpellLevel":4,"initialCharges":50,"baseCraftCostFraction":0.5,"baseXpCostFractionOfMarketPrice":0.04,"creatorMustSupplySpell":true}'),
('dmg-table-7-26-wands','Table 7-26: Wands','246','table',
 'Complete minor, medium, and major random-wand table, including fixed-caster-level and heightened-spell variants.',
 '["magic-items","wands","random-generation","table-7-26"]',
 '{"minor":[[1,2,"wand-detect-magic"],[3,4,"wand-light"],[5,7,"wand-burning-hands"],[8,10,"wand-charm-animal"],[11,13,"wand-charm-person"],[14,16,"wand-color-spray"],[17,19,"wand-cure-light-wounds"],[20,22,"wand-detect-secret-doors"],[23,25,"wand-enlarge-person"],[26,28,"wand-magic-missile-cl1"],[29,31,"wand-shocking-grasp"],[32,34,"wand-summon-monster-1"],[35,36,"wand-magic-missile-cl3"],[37,37,"wand-magic-missile-cl5"],[38,40,"wand-bears-endurance"],[41,43,"wand-bulls-strength"],[44,46,"wand-cats-grace"],[47,49,"wand-cure-moderate-wounds"],[50,51,"wand-darkness"],[52,54,"wand-daylight"],[55,57,"wand-delay-poison"],[58,60,"wand-eagles-splendor"],[61,63,"wand-false-life"],[64,66,"wand-foxs-cunning"],[67,68,"wand-ghoul-touch"],[69,71,"wand-hold-person"],[72,74,"wand-invisibility"],[75,77,"wand-knock"],[78,80,"wand-levitate"],[81,83,"wand-melfs-acid-arrow"],[84,86,"wand-mirror-image"],[87,89,"wand-owls-wisdom"],[90,91,"wand-shatter"],[92,94,"wand-silence"],[95,97,"wand-summon-monster-2"],[98,100,"wand-web"]],"medium":[[1,3,"wand-magic-missile-cl5"],[4,7,"wand-bears-endurance"],[8,11,"wand-bulls-strength"],[12,15,"wand-cats-grace"],[16,20,"wand-cure-moderate-wounds"],[21,22,"wand-darkness"],[23,24,"wand-daylight"],[25,27,"wand-delay-poison"],[28,31,"wand-eagles-splendor"],[32,33,"wand-false-life"],[34,37,"wand-foxs-cunning"],[38,38,"wand-ghoul-touch"],[39,39,"wand-hold-person"],[40,42,"wand-invisibility"],[43,44,"wand-knock"],[45,45,"wand-levitate"],[46,47,"wand-melfs-acid-arrow"],[48,49,"wand-mirror-image"],[50,53,"wand-owls-wisdom"],[54,54,"wand-shatter"],[55,56,"wand-silence"],[57,57,"wand-summon-monster-2"],[58,59,"wand-web"],[60,62,"wand-magic-missile-cl7"],[63,64,"wand-magic-missile-cl9"],[65,67,"wand-call-lightning-cl5"],[68,68,"wand-charm-person-heightened-3"],[69,70,"wand-contagion"],[71,74,"wand-cure-serious-wounds"],[75,77,"wand-dispel-magic"],[78,81,"wand-fireball-cl5"],[82,83,"wand-keen-edge"],[84,87,"wand-lightning-bolt-cl5"],[88,89,"wand-major-image"],[90,91,"wand-slow"],[92,94,"wand-suggestion"],[95,97,"wand-summon-monster-3"],[98,98,"wand-fireball-cl6"],[99,99,"wand-lightning-bolt-cl6"],[100,100,"wand-searing-light-cl6"]],"major":[[1,2,"wand-magic-missile-cl7"],[3,5,"wand-magic-missile-cl9"],[6,7,"wand-call-lightning-cl5"],[8,8,"wand-charm-person-heightened-3"],[9,10,"wand-contagion"],[11,13,"wand-cure-serious-wounds"],[14,15,"wand-dispel-magic"],[16,17,"wand-fireball-cl5"],[18,19,"wand-keen-edge"],[20,21,"wand-lightning-bolt-cl5"],[22,23,"wand-major-image"],[24,25,"wand-slow"],[26,27,"wand-suggestion"],[28,29,"wand-summon-monster-3"],[30,31,"wand-fireball-cl6"],[32,33,"wand-lightning-bolt-cl6"],[34,35,"wand-searing-light-cl6"],[36,37,"wand-call-lightning-cl8"],[38,39,"wand-fireball-cl8"],[40,41,"wand-lightning-bolt-cl8"],[42,45,"wand-charm-monster"],[46,50,"wand-cure-critical-wounds"],[51,52,"wand-dimensional-anchor"],[53,55,"wand-fear"],[56,59,"wand-greater-invisibility"],[60,60,"wand-hold-person-heightened-4"],[61,65,"wand-ice-storm"],[66,68,"wand-inflict-critical-wounds"],[69,72,"wand-neutralize-poison"],[73,74,"wand-poison"],[75,77,"wand-polymorph"],[78,78,"wand-ray-enfeeblement-heightened-4"],[79,79,"wand-suggestion-heightened-4"],[80,82,"wand-summon-monster-4"],[83,86,"wand-wall-of-fire"],[87,90,"wand-wall-of-ice"],[91,91,"wand-dispel-magic-cl10"],[92,92,"wand-fireball-cl10"],[93,93,"wand-lightning-bolt-cl10"],[94,94,"wand-chaos-hammer-cl8"],[95,95,"wand-holy-smite-cl8"],[96,96,"wand-orders-wrath-cl8"],[97,97,"wand-unholy-blight-cl8"],[98,99,"wand-restoration"],[100,100,"wand-stoneskin"]],"specialCreation":{"wand-restoration":{"marketPriceGp":26000,"craftBaseGp":10500,"craftXp":840,"additionalMaterialGp":5000},"wand-stoneskin":{"marketPriceGp":33500,"craftBaseGp":10500,"craftXp":840,"additionalMaterialGp":12500}}}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
