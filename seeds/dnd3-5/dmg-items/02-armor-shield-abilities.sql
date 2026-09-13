-- Dungeon Master's Guide v3.5 Chapter 7: magic armor and shield special abilities, pp. 216-219.
-- These are modifier/property definitions, so they live in dnd35_rules rather than as standalone inventory items.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(
  slug,name,page,applies_to,summary,school,aura,caster_level,equivalent_bonus,added_price_copper,crafting,mechanics
) AS (VALUES
  ('dmg-armor-acid-resistance','Acid Resistance','216-218','armor,shield',
   'Absorbs the first 10 points of acid damage from each attack.','abjuration','faint',3,NULL,1800000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"acid","resistancePerAttack":10}'),
  ('dmg-armor-acid-resistance-improved','Acid Resistance, Improved','216-218','armor,shield',
   'Absorbs the first 20 points of acid damage from each attack.','abjuration','moderate',7,NULL,4200000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"acid","resistancePerAttack":20}'),
  ('dmg-armor-acid-resistance-greater','Acid Resistance, Greater','216-218','armor,shield',
   'Absorbs the first 30 points of acid damage from each attack.','abjuration','moderate',11,NULL,6600000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"acid","resistancePerAttack":30}'),
  ('dmg-armor-cold-resistance','Cold Resistance','218','armor,shield',
   'Absorbs the first 10 points of cold damage from each attack.','abjuration','faint',3,NULL,1800000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"cold","resistancePerAttack":10}'),
  ('dmg-armor-cold-resistance-improved','Cold Resistance, Improved','218','armor,shield',
   'Absorbs the first 20 points of cold damage from each attack.','abjuration','moderate',7,NULL,4200000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"cold","resistancePerAttack":20}'),
  ('dmg-armor-cold-resistance-greater','Cold Resistance, Greater','218','armor,shield',
   'Absorbs the first 30 points of cold damage from each attack.','abjuration','moderate',11,NULL,6600000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"cold","resistancePerAttack":30}'),
  ('dmg-armor-electricity-resistance','Electricity Resistance','218','armor,shield',
   'Absorbs the first 10 points of electricity damage from each attack.','abjuration','faint',3,NULL,1800000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"electricity","resistancePerAttack":10}'),
  ('dmg-armor-electricity-resistance-improved','Electricity Resistance, Improved','218','armor,shield',
   'Absorbs the first 20 points of electricity damage from each attack.','abjuration','moderate',7,NULL,4200000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"electricity","resistancePerAttack":20}'),
  ('dmg-armor-electricity-resistance-greater','Electricity Resistance, Greater','218','armor,shield',
   'Absorbs the first 30 points of electricity damage from each attack.','abjuration','moderate',11,NULL,6600000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"electricity","resistancePerAttack":30}'),
  ('dmg-armor-fire-resistance','Fire Resistance','218','armor,shield',
   'Absorbs the first 10 points of fire damage from each attack.','abjuration','faint',3,NULL,1800000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"fire","resistancePerAttack":10}'),
  ('dmg-armor-fire-resistance-improved','Fire Resistance, Improved','218','armor,shield',
   'Absorbs the first 20 points of fire damage from each attack.','abjuration','moderate',7,NULL,4200000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"fire","resistancePerAttack":20}'),
  ('dmg-armor-fire-resistance-greater','Fire Resistance, Greater','218','armor,shield',
   'Absorbs the first 30 points of fire damage from each attack.','abjuration','moderate',11,NULL,6600000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"fire","resistancePerAttack":30}'),
  ('dmg-armor-sonic-resistance','Sonic Resistance','219','armor,shield',
   'Absorbs the first 10 points of sonic damage from each attack.','abjuration','faint',3,NULL,1800000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"sonic","resistancePerAttack":10}'),
  ('dmg-armor-sonic-resistance-improved','Sonic Resistance, Improved','219','armor,shield',
   'Absorbs the first 20 points of sonic damage from each attack.','abjuration','moderate',7,NULL,4200000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"sonic","resistancePerAttack":20}'),
  ('dmg-armor-sonic-resistance-greater','Sonic Resistance, Greater','219','armor,shield',
   'Absorbs the first 30 points of sonic damage from each attack.','abjuration','moderate',11,NULL,6600000,
   'Craft Magic Arms and Armor; resist energy.',
   '{"damageType":"sonic","resistancePerAttack":30}'),

  ('dmg-armor-fortification-light','Fortification, Light','218','armor,shield',
   'When a critical hit or sneak attack is scored against the wearer, there is a 25% chance that the extra damage is negated and damage is rolled normally.','abjuration','strong',13,1,NULL,
   'Craft Magic Arms and Armor; limited wish or miracle.',
   '{"criticalAndSneakExtraDamageNegationPercent":25}'),
  ('dmg-armor-fortification-moderate','Fortification, Moderate','218','armor,shield',
   'When a critical hit or sneak attack is scored against the wearer, there is a 75% chance that the extra damage is negated and damage is rolled normally.','abjuration','strong',13,3,NULL,
   'Craft Magic Arms and Armor; limited wish or miracle.',
   '{"criticalAndSneakExtraDamageNegationPercent":75}'),
  ('dmg-armor-fortification-heavy','Fortification, Heavy','218','armor,shield',
   'Critical-hit and sneak-attack extra damage against the wearer is always negated; damage is rolled normally.','abjuration','strong',13,5,NULL,
   'Craft Magic Arms and Armor; limited wish or miracle.',
   '{"criticalAndSneakExtraDamageNegationPercent":100}'),
  ('dmg-armor-ghost-touch','Ghost Touch','218','armor,shield',
   'Armor and enhancement bonuses apply against incorporeal attacks; incorporeal creatures can pick up and wear or use the item and gain its enhancement bonus against corporeal and incorporeal attacks.','transmutation','strong',15,3,NULL,
   'Craft Magic Arms and Armor; etherealness.',
   '{"armorBonusAppliesAgainstIncorporeal":true,"enhancementBonusAppliesAgainstIncorporeal":true,"usableByIncorporeal":true}'),
  ('dmg-armor-glamered','Glamered','218','armor',
   'On command, the armor assumes the appearance of normal clothing while retaining all properties, including weight; true seeing or similar magic reveals its true nature.','illusion','moderate',10,NULL,270000,
   'Craft Magic Arms and Armor; disguise self.',
   '{"activation":"command","disguiseAsClothing":true,"retainsMechanicalProperties":true}'),
  ('dmg-armor-invulnerability','Invulnerability','218','armor',
   'Grants damage reduction 5/magic.','abjuration','strong',18,3,NULL,
   'Craft Magic Arms and Armor; stoneskin; wish or miracle.',
   '{"damageReduction":{"amount":5,"bypass":"magic"}}'),
  ('dmg-armor-etherealness','Etherealness','218','armor',
   'Once per day on command, the wearer becomes ethereal as ethereal jaunt and can remain ethereal as long as desired until returning to normal.','transmutation','strong',13,NULL,4900000,
   'Craft Magic Arms and Armor; ethereal jaunt.',
   '{"usesPerDay":1,"activation":"command","effect":"ethereal-jaunt","duration":"until wearer returns"}'),

  ('dmg-armor-slick','Slick','218-219','armor',
   'Grants +5 competence on Escape Artist checks; armor check penalty still applies normally.','conjuration','faint',4,NULL,375000,
   'Craft Magic Arms and Armor; grease.',
   '{"skill":"escape-artist","bonus":5,"bonusType":"competence"}'),
  ('dmg-armor-slick-improved','Slick, Improved','218-219','armor',
   'Grants +10 competence on Escape Artist checks; armor check penalty still applies normally.','conjuration','moderate',10,NULL,1500000,
   'Craft Magic Arms and Armor; grease.',
   '{"skill":"escape-artist","bonus":10,"bonusType":"competence"}'),
  ('dmg-armor-slick-greater','Slick, Greater','218-219','armor',
   'Grants +15 competence on Escape Artist checks; armor check penalty still applies normally.','conjuration','moderate',15,NULL,3375000,
   'Craft Magic Arms and Armor; grease.',
   '{"skill":"escape-artist","bonus":15,"bonusType":"competence"}'),
  ('dmg-armor-shadow','Shadow','218-219','armor',
   'Grants +5 competence on Hide checks; armor check penalty still applies normally.','illusion','faint',5,NULL,375000,
   'Craft Magic Arms and Armor; invisibility.',
   '{"skill":"hide","bonus":5,"bonusType":"competence"}'),
  ('dmg-armor-shadow-improved','Shadow, Improved','218-219','armor',
   'Grants +10 competence on Hide checks; armor check penalty still applies normally.','illusion','moderate',10,NULL,1500000,
   'Craft Magic Arms and Armor; invisibility.',
   '{"skill":"hide","bonus":10,"bonusType":"competence"}'),
  ('dmg-armor-shadow-greater','Shadow, Greater','218-219','armor',
   'Grants +15 competence on Hide checks; armor check penalty still applies normally.','illusion','moderate',15,NULL,3375000,
   'Craft Magic Arms and Armor; invisibility.',
   '{"skill":"hide","bonus":15,"bonusType":"competence"}'),
  ('dmg-armor-silent-moves','Silent Moves','218-219','armor',
   'Grants +5 competence on Move Silently checks; armor check penalty still applies normally.','illusion','faint',5,NULL,375000,
   'Craft Magic Arms and Armor; silence.',
   '{"skill":"move-silently","bonus":5,"bonusType":"competence"}'),
  ('dmg-armor-silent-moves-improved','Silent Moves, Improved','218-219','armor',
   'Grants +10 competence on Move Silently checks; armor check penalty still applies normally.','illusion','moderate',10,NULL,1500000,
   'Craft Magic Arms and Armor; silence.',
   '{"skill":"move-silently","bonus":10,"bonusType":"competence"}'),
  ('dmg-armor-silent-moves-greater','Silent Moves, Greater','218-219','armor',
   'Grants +15 competence on Move Silently checks; armor check penalty still applies normally.','illusion','moderate',15,NULL,3375000,
   'Craft Magic Arms and Armor; silence.',
   '{"skill":"move-silently","bonus":15,"bonusType":"competence"}'),

  ('dmg-armor-spell-resistance-13','Spell Resistance (13)','219','armor,shield',
   'Grants spell resistance 13 while worn.','abjuration','strong',15,2,NULL,
   'Craft Magic Arms and Armor; spell resistance.',
   '{"spellResistance":13}'),
  ('dmg-armor-spell-resistance-15','Spell Resistance (15)','219','armor,shield',
   'Grants spell resistance 15 while worn.','abjuration','strong',15,3,NULL,
   'Craft Magic Arms and Armor; spell resistance.',
   '{"spellResistance":15}'),
  ('dmg-armor-spell-resistance-17','Spell Resistance (17)','219','armor,shield',
   'Grants spell resistance 17 while worn.','abjuration','strong',15,4,NULL,
   'Craft Magic Arms and Armor; spell resistance.',
   '{"spellResistance":17}'),
  ('dmg-armor-spell-resistance-19','Spell Resistance (19)','219','armor,shield',
   'Grants spell resistance 19 while worn.','abjuration','strong',15,5,NULL,
   'Craft Magic Arms and Armor; spell resistance.',
   '{"spellResistance":19}'),
  ('dmg-armor-undead-controlling','Undead Controlling','219','armor,shield',
   'Lets the wearer control up to 26 HD of undead per day as control undead; control ends at dawn each day.','necromancy','strong',13,NULL,4900000,
   'Craft Magic Arms and Armor; control undead.',
   '{"controlledUndeadHdMaximum":26,"reset":"dawn","effect":"control-undead"}'),
  ('dmg-armor-wild','Wild','219','armor,shield',
   'Preserves the item''s armor bonus and enhancement bonus while the wearer is in wild shape; the item is not visible in that form.','transmutation','moderate',9,3,NULL,
   'Craft Magic Arms and Armor; baleful polymorph.',
   '{"preserveArmorBonusInWildShape":true,"preserveEnhancementBonusInWildShape":true,"hiddenInWildShape":true}'),

  ('dmg-shield-animated','Animated','218','shield',
   'On command, the shield floats within 2 feet and protects the wielder as if used normally while leaving both hands free; normal shield-use penalties still apply and only one shield can protect a creature at a time.','transmutation','strong',12,2,NULL,
   'Craft Magic Arms and Armor; animate objects.',
   '{"activation":"command","handsFreed":true,"maximumProtectingShields":1,"shieldPenaltiesStillApply":true}'),
  ('dmg-shield-arrow-catching','Arrow Catching','218','shield',
   'While active, grants +1 deflection AC against ranged weapons and diverts qualifying projectiles or thrown weapons aimed at targets within 5 feet to the shield bearer.','abjuration','moderate',8,1,NULL,
   'Craft Magic Arms and Armor; entropic shield.',
   '{"activation":"command-toggle","rangedDeflectionBonus":1,"divertTargetRadiusFeet":5,"divertOnlyIfWeaponEnhancementNotAboveShieldBaseAc":true,"totalCoverPreventsDiversion":true}'),
  ('dmg-shield-arrow-deflection','Arrow Deflection','218','shield',
   'Once per round when a qualifying ranged weapon would hit, an aware non-flat-footed bearer can attempt Reflex DC 20 plus the weapon''s enhancement bonus to deflect it; this uses no action.','abjuration','faint',5,2,NULL,
   'Craft Magic Arms and Armor; shield.',
   '{"usesPerRound":1,"reflexDcBase":20,"dcAddsWeaponEnhancement":true,"requiresAwareness":true,"failsWhileFlatFooted":true,"action":"none"}'),
  ('dmg-shield-bashing','Bashing','218','shield',
   'A light or heavy shield deals bash damage as though two size categories larger and acts as a +1 weapon when used to bash.','transmutation','moderate',8,1,NULL,
   'Craft Magic Arms and Armor; bull''s strength.',
   '{"allowedShieldCategories":["light","heavy"],"bashDamageSizeCategoriesLarger":2,"bashWeaponEnhancementBonus":1}'),
  ('dmg-shield-blinding','Blinding','218','shield',
   'Up to twice per day on command, flashes light; creatures within 20 feet other than the wielder make Reflex DC 14 or are blinded for 1d4 rounds.','evocation','moderate',7,1,NULL,
   'Craft Magic Arms and Armor; searing light.',
   '{"usesPerDay":2,"activation":"command","radiusFeet":20,"save":"reflex","dc":14,"condition":"blinded","duration":"1d4 rounds","excludesWielder":true}'),
  ('dmg-shield-reflecting','Reflecting','218-219','shield',
   'Once per day, the shield can reflect a spell back at its caster as spell turning.','abjuration','strong',14,5,NULL,
   'Craft Magic Arms and Armor; spell turning.',
   '{"usesPerDay":1,"effect":"spell-turning"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,
  d.summary || ' Aura: ' || d.aura || ' ' || d.school || '; caster level ' || d.caster_level || '. ' || d.crafting,
  0,NULL,1,'magic-item-properties','property',0,1,NULL,NULL,
  json_array('magic-items','armor-shields','special-ability',d.applies_to),
  json_patch(d.mechanics,json_object(
    'appliesTo',d.applies_to,
    'school',d.school,
    'aura',d.aura,
    'casterLevel',d.caster_level,
    'equivalentBonus',d.equivalent_bonus,
    'addedPriceCopper',d.added_price_copper,
    'crafting',d.crafting
  ))
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

-- Shared construction/generation constraints.
WITH desired(slug,name,page,summary,mechanics) AS (VALUES
  ('dmg-magic-armor-shield-special-minimum','Magic Armor/Shield Special-Ability Minimum','216',
   'Armor or a shield with a magic special ability must have at least a +1 enhancement bonus.',
   '{"minimumEnhancementBonusForSpecialAbility":1}'),
  ('dmg-magic-armor-unusual-creature-cost','Magic Armor for Unusual Creatures','216',
   'Unusual size or nonhumanoid construction changes the mundane armor cost according to the Player''s Handbook, but the masterwork and magical enhancement portions of the price remain unchanged.',
   '{"unusualCreatureAdjustsBaseArmorCost":true,"masterworkCostUnchanged":true,"magicEnhancementCostUnchanged":true}'),
  ('dmg-random-magic-armor-shield-procedure','Random Magic Armor and Shield Procedure','216',
   'Generate magic armor and shields by resolving Table 7-2, then the indicated armor/shield type table, and then any indicated special-ability or specific-item table.',
   '{"sequence":["table-7-2-armor-and-shields","table-7-3-or-7-4-random-type","table-7-5-or-7-6-abilities-or-7-7-or-7-8-specific"]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items','rule',0,1,NULL,NULL,'["magic-items","armor","shield"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

-- Exact Table 7-5 and 7-6 percentile mappings. A roll of 100 means roll twice again; duplicate abilities do not stack,
-- and when two versions of the same ability are rolled the better version is used.
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-dmg-armor-special-ability-table','dmg-3.5','217','dmg-armor-special-ability-table','Armor Special Ability Generation Table',
       'Table 7-5 maps minor, medium, and major percentile results to armor special abilities.',
       'Table 7-5 maps minor, medium, and major percentile results to armor special abilities.',0,NULL,1,
       'magic-items','table',0,1,NULL,NULL,'["magic-items","armor","random-generation"]',
       '{"duplicateAbilityCountsOnce":true,"sameFamilyUseBetterVersion":true,"minor":[[1,25,"glamered"],[26,32,"fortification-light"],[33,52,"slick"],[53,72,"shadow"],[73,92,"silent-moves"],[93,96,"spell-resistance-13"],[97,97,"slick-improved"],[98,98,"shadow-improved"],[99,99,"silent-moves-improved"],[100,100,"roll-twice"]],"medium":[[1,5,"glamered"],[6,8,"fortification-light"],[9,11,"slick"],[12,14,"shadow"],[15,17,"silent-moves"],[18,19,"spell-resistance-13"],[20,29,"slick-improved"],[30,39,"shadow-improved"],[40,49,"silent-moves-improved"],[50,54,"acid-resistance"],[55,59,"cold-resistance"],[60,64,"electricity-resistance"],[65,69,"fire-resistance"],[70,74,"sonic-resistance"],[75,79,"ghost-touch"],[80,84,"invulnerability"],[85,89,"fortification-moderate"],[90,94,"spell-resistance-15"],[95,99,"wild"],[100,100,"roll-twice"]],"major":[[1,3,"glamered"],[4,4,"fortification-light"],[5,7,"slick-improved"],[8,10,"shadow-improved"],[11,13,"silent-moves-improved"],[14,16,"acid-resistance"],[17,19,"cold-resistance"],[20,22,"electricity-resistance"],[23,25,"fire-resistance"],[26,28,"sonic-resistance"],[29,33,"ghost-touch"],[34,35,"invulnerability"],[36,40,"fortification-moderate"],[41,42,"spell-resistance-15"],[43,43,"wild"],[44,48,"slick-greater"],[49,53,"shadow-greater"],[54,58,"silent-moves-greater"],[59,63,"acid-resistance-improved"],[64,68,"cold-resistance-improved"],[69,73,"electricity-resistance-improved"],[74,78,"fire-resistance-improved"],[79,83,"sonic-resistance-improved"],[84,88,"spell-resistance-17"],[89,89,"etherealness"],[90,90,"undead-controlling"],[91,92,"fortification-heavy"],[93,94,"spell-resistance-19"],[95,95,"acid-resistance-greater"],[96,96,"cold-resistance-greater"],[97,97,"electricity-resistance-greater"],[98,98,"fire-resistance-greater"],[99,99,"sonic-resistance-greater"],[100,100,"roll-twice"]]}'
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-armor-special-ability-table' AND r.owner_user_id IS NULL);

INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-dmg-shield-special-ability-table','dmg-3.5','218','dmg-shield-special-ability-table','Shield Special Ability Generation Table',
       'Table 7-6 maps minor, medium, and major percentile results to shield special abilities.',
       'Table 7-6 maps minor, medium, and major percentile results to shield special abilities.',0,NULL,1,
       'magic-items','table',0,1,NULL,NULL,'["magic-items","shield","random-generation"]',
       '{"duplicateAbilityCountsOnce":true,"sameFamilyUseBetterVersion":true,"minor":[[1,20,"arrow-catching"],[21,40,"bashing"],[41,50,"blinding"],[51,75,"fortification-light"],[76,92,"arrow-deflection"],[93,97,"animated"],[98,99,"spell-resistance-13"],[100,100,"roll-twice"]],"medium":[[1,10,"arrow-catching"],[11,20,"bashing"],[21,25,"blinding"],[26,40,"fortification-light"],[41,50,"arrow-deflection"],[51,57,"animated"],[58,59,"spell-resistance-13"],[60,63,"acid-resistance"],[64,67,"cold-resistance"],[68,71,"electricity-resistance"],[72,75,"fire-resistance"],[76,79,"sonic-resistance"],[80,85,"ghost-touch"],[86,95,"fortification-moderate"],[96,98,"spell-resistance-15"],[99,99,"wild"],[100,100,"roll-twice"]],"major":[[1,5,"arrow-catching"],[6,8,"bashing"],[9,10,"blinding"],[11,15,"fortification-light"],[16,20,"arrow-deflection"],[21,25,"animated"],[26,28,"acid-resistance"],[29,31,"cold-resistance"],[32,34,"electricity-resistance"],[35,37,"fire-resistance"],[38,40,"sonic-resistance"],[41,46,"ghost-touch"],[47,56,"fortification-moderate"],[57,58,"spell-resistance-15"],[59,59,"wild"],[60,64,"acid-resistance-improved"],[65,69,"cold-resistance-improved"],[70,74,"electricity-resistance-improved"],[75,79,"fire-resistance-improved"],[80,84,"sonic-resistance-improved"],[85,86,"spell-resistance-17"],[87,87,"undead-controlling"],[88,91,"fortification-heavy"],[92,93,"reflecting"],[94,94,"spell-resistance-19"],[95,95,"acid-resistance-greater"],[96,96,"cold-resistance-greater"],[97,97,"electricity-resistance-greater"],[98,98,"fire-resistance-greater"],[99,99,"sonic-resistance-greater"],[100,100,"roll-twice"]]}'
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-shield-special-ability-table' AND r.owner_user_id IS NULL);
