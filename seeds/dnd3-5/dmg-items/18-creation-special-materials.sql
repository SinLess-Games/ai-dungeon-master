-- Dungeon Master's Guide v3.5 Chapter 7: Magic Item Creation and Special Materials, pp. 282-288.
-- Captures the pricing/creation engine tables, work-time rules, body-slot adjustments,
-- masterwork prerequisites, and the standard DMG special materials used by weapons and armor.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
 (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
 'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-magic-item-creation-prerequisites','General Magic Item Creation Prerequisites','282','rule',
 'A creator must meet the item''s listed prerequisites. A creator can set an item caster level below their own but never below the minimum needed to cast required spells; metamagic may place spells into items at higher effective spell levels.',
 '["magic-items","creation","caster-level","prerequisites"]',
 '{"mustMeetListedPrerequisites":true,"chosenCasterLevelMaximum":"creator caster level","chosenCasterLevelMinimum":"minimum level needed for required spell","metamagicMayRaiseStoredSpellLevel":true,"outsideSpellAccessMaySatisfySomePrerequisites":true}'),
('dmg-magic-item-creation-costs','General Magic Item Creation Costs','282-285','rule',
 'Magic supplies normally cost half the base price in gp and one twenty-fifth of the base price in XP. Ordinary item cost is added separately to final market price and does not increase base-price supply or XP costs.',
 '["magic-items","creation","pricing","xp"]',
 '{"magicSupplyGpFractionOfBasePrice":0.5,"xpCostFractionOfBasePrice":0.04,"itemCostAddedToMarketPrice":true,"itemCostIncludedInBasePrice":false}'),
('dmg-magic-item-expensive-components','Magic Item Spell Component Cost Adjustment','282-285','rule',
 'If an item actually casts or replicates a spell with a costly material component or XP component, add those costs according to charges/uses. Each XP point in such a spell component adds 5 gp to market price.',
 '["magic-items","creation","pricing","components"]',
 '{"xpComponentMarketGpPerXp":5,"prerequisiteOnlyCostlyComponentsDoNotAutomaticallyAddCost":true,"chargedItemsMultiplyComponentCostPerCharge":true,"unlimitedUseTreatComponentCostAsCharges":100,"dailyLimitedTreatComponentCostAsCharges":50}'),
('dmg-magic-item-work-time','Magic Item Creation Work Time','282-288','rule',
 'Creating an item normally requires one day per 1,000 gp of base price, minimum one day, at 8 hours of work per day. Potions always take one day. Days need not be consecutive, but only one item can be under construction at a time; abandoning it for a new project wastes spent materials and XP.',
 '["magic-items","creation","time"]',
 '{"days":"ceil(base price gp / 1000)","minimumDays":1,"workHoursPerDay":8,"potionsAlwaysDays":1,"daysNeedNotBeConsecutive":true,"maximumConcurrentProjects":1,"startingNewProjectWastesOldProjectSpentResources":true}'),
('dmg-artifact-creation-lost','Artifact Creation Secrets Are Lost','282','rule',
 'Artifacts cannot be created through the ordinary item-creation system; their creation secrets are lost.',
 '["magic-items","creation","artifacts"]','{"ordinaryCreationAllowed":false}'),
('dmg-masterwork-required-magic-arms','Masterwork Requirement for Magic Arms and Armor','282-286','rule',
 'Only masterwork weapons, armor, and shields can receive ordinary magical enhancement. The masterwork item cost is part of final market value but separate from magical base price.',
 '["magic-items","creation","masterwork","weapons","armor","shields"]',
 '{"magicWeaponRequiresMasterwork":true,"magicArmorRequiresMasterwork":true,"magicShieldRequiresMasterwork":true,"masterworkItemCostSeparateFromMagicBasePrice":true}'),
('dmg-caster-level-enhancement-prerequisite','Enhancement Bonus Creator Caster-Level Minimum','284-286','rule',
 'Creating magic armor, shields, or weapons with an enhancement bonus requires creator caster level at least three times the enhancement bonus; when special abilities require a higher caster level, use the higher prerequisite.',
 '["magic-items","creation","caster-level","enhancement"]',
 '{"minimumCreatorCasterLevel":"3 * enhancement bonus","specialAbilityHigherCasterLevelOverrides":true}'),
('dmg-special-ability-requires-plus-one','Special Abilities Require +1 Enhancement','284-286','rule',
 'A magic weapon, armor, or shield must have at least a +1 enhancement bonus before ordinary magic special abilities can be added.',
 '["magic-items","creation","enhancement","special-abilities"]',
 '{"minimumEnhancementBonus":1}'),
('dmg-double-weapon-creation','Magic Double-Weapon Creation','286','rule',
 'A double weapon is treated as two weapons for magic-item cost, time, XP, enhancement bonuses, and special abilities.',
 '["magic-items","creation","weapons","double-weapons"]','{"treatAsTwoWeapons":true}'),
('dmg-weapon-glow-choice','Magic Weapon Glow Choice','286','rule',
 'At creation, the creator decides whether a magic weapon glows as a side effect. This changes neither price nor creation time and becomes fixed when construction is complete.',
 '["magic-items","creation","weapons","light"]','{"creatorChoosesGlow":true,"priceAdjustment":0,"timeAdjustment":0,"choicePermanentAfterCreation":true}'),

('dmg-table-7-32-creation-cost-summary','Table 7-32: Summary of Magic Item Creation Costs','284','table',
 'Source summary of feats, mundane item costs, spell component multipliers, magic supply costs, and base-price references for each core magic-item family.',
 '["magic-items","creation","table-7-32"]',
 '{"armor":{"feat":"Craft Magic Arms and Armor","itemCost":"masterwork armor","magicSupplies":"half Table 7-2 magical value","basePrice":"Table 7-2"},"shield":{"feat":"Craft Magic Arms and Armor","itemCost":"masterwork shield","magicSupplies":"half Table 7-2 magical value","basePrice":"Table 7-2"},"weapon":{"feat":"Craft Magic Arms and Armor","itemCost":"masterwork weapon","magicSupplies":"half Table 7-9 magical value","basePrice":"Table 7-9"},"potion":{"feat":"Brew Potion","magicSupplies":"half Table 7-17 value","basePrice":"Table 7-17"},"ring":{"feat":"Forge Ring","basePrice":"Table 7-33 or specific item"},"rod":{"feat":"Craft Rod","itemCost":"masterwork weapon cost if rod is usable as weapon","basePrice":"Table 7-33 or specific item"},"scroll":{"feat":"Scribe Scroll","magicSupplies":"half Table 7-23/7-24 value","basePrice":"Table 7-23/7-24"},"staff":{"feat":"Craft Staff","itemCostCopper":30000,"basePrice":"staff formula/source description"},"wand":{"feat":"Craft Wand","magicSuppliesFormulaGp":"375 * spell level * caster level","basePriceFormulaGp":"750 * spell level * caster level"},"wondrous":{"feat":"Craft Wondrous Item","basePrice":"Table 7-33 or specific item"},"creatorXp":"base price / 25","xpComponentMarketMultiplierGp":5}'),

('dmg-table-7-33-value-formulas','Table 7-33: Estimating Magic Item Gold Piece Values','285','table',
 'The DMG''s guideline formulas for estimating new magic-item base prices. These are starting points and should be checked against comparable printed items and actual utility.',
 '["magic-items","creation","pricing","table-7-33"]',
 '{"bonuses":{"abilityEnhancement":"bonus^2 * 1000 gp","armorEnhancement":"bonus^2 * 1000 gp","bonusSpell":"spellLevel^2 * 1000 gp","acDeflection":"bonus^2 * 2000 gp","acOther":"bonus^2 * 2500 gp","naturalArmorEnhancement":"bonus^2 * 2000 gp","saveResistance":"bonus^2 * 1000 gp","saveOther":"bonus^2 * 2000 gp","skillCompetence":"bonus^2 * 100 gp","spellResistance":"10000 gp per point above SR 12; minimum SR 13","weaponEnhancement":"bonus^2 * 2000 gp"},"spellEffects":{"singleUseSpellCompletion":"spell level * caster level * 25 gp","singleUseUseActivated":"spell level * caster level * 50 gp","fiftyChargeSpellTrigger":"spell level * caster level * 750 gp","commandWord":"spell level * caster level * 1800 gp","useActivatedOrContinuous":"spell level * caster level * 2000 gp"},"adjustments":{"chargesPerDay":"divide unlimited price by 5 then multiply uses per day","uncustomaryBodySlot":1.5,"slotless":2,"multipleDifferentAbilities":"multiply lower item ability cost by 1.5","fiftyCharges":0.5},"zeroLevelSpellLevelForPricing":0.5,"continuousDurationMultipliers":{"rounds":4,"minutesPerLevel1":2,"minutesPerLevel10":1.5,"hours24OrMore":0.5},"warning":"guidelines, not automatic final prices"}'),
('dmg-multiple-similar-abilities','Pricing Multiple Similar Abilities','282','rule',
 'For multiple similar abilities on a slotless/non-body-space item, price the most costly ability fully, the second at 75%, and additional abilities at 50%.',
 '["magic-items","creation","pricing","multiple-abilities"]','{"mostCostlyMultiplier":1,"secondMultiplier":0.75,"remainingMultiplier":0.5,"scope":"multiple similar abilities on item not occupying body space"}'),
('dmg-multiple-different-abilities','Pricing Multiple Different Abilities','282,285','rule',
 'Different abilities are added together; when combined into a body-slot item, each additional different ability uses the source 50% increase rule for the lower/additional power.',
 '["magic-items","creation","pricing","multiple-abilities"]','{"differentAbilitiesAddValues":true,"bodySlotAdditionalAbilityMultiplier":1.5}'),
('dmg-body-slot-price-adjustments','Body Slot Pricing Adjustments','285,288','rule',
 'A power placed in an uncustomary body slot generally costs 50% more; an item using no body slot generally costs double. Body-slot affinities are guidance rather than rigid restrictions.',
 '["magic-items","creation","pricing","body-slots"]','{"uncustomarySlotMultiplier":1.5,"slotlessMultiplier":2,"affinitiesAreGuidance":true}'),
('dmg-item-use-restriction-discounts','Item Use Restriction Pricing Discounts','282','guidance',
 'After estimating price, an item requiring a specific skill may be discounted about 10%; an item restricted to a specific class or alignment may be discounted about 30%.',
 '["magic-items","creation","pricing","restrictions"]','{"specificSkillMultiplierApprox":0.9,"specificClassOrAlignmentMultiplierApprox":0.7}'),
('dmg-body-slot-affinities','Body Slot Affinities','288','table',
 'The DMG gives broad design affinities for body slots to guide creation and judge uncustomary-slot pricing.',
 '["magic-items","creation","body-slots","affinity"]','{"headband":"mental improvement, ranged attacks","helmet":"mental improvement, ranged attacks","hat":"interaction","phylactery":"morale, alignment","eyes":"vision","cloak":"transformation, protection","cape":"transformation, protection","mantle":"transformation, protection","amulet":"protection, discernment","brooch":"protection, discernment","medallion":"protection, discernment","necklace":"protection, discernment","periapt":"protection, discernment","scarab":"protection, discernment","robe":"multiple effects","shirt":"physical improvement","vest":"class ability improvement","vestment":"class ability improvement","bracers":"combat","bracelets":"allies","gloves":"quickness","gauntlets":"destructive power","belt":"physical improvement","boots":"movement"}'),

('dmg-special-material-combination','Combining Special Materials','282','rule',
 'When an armor suit or weapon contains more than one special material, only the most prevalent material normally provides its special benefit. A double weapon may have different special materials on its two heads.',
 '["equipment","special-materials"]','{"onePredominantMaterialBenefit":true,"doubleWeaponHeadsMayDiffer":true}'),
('dmg-special-material-adamantine','Adamantine','282-283','material',
 'Adamantine is an ultrahard metal. Adamantine weapons ignore object hardness below 20; light/medium/heavy adamantine armor grants DR 1/-, 2/-, or 3/-. Adamantine arms and armor are automatically masterwork.',
 '["equipment","special-materials","adamantine"]','{"hardness":20,"hitPointsPerInch":40,"weaponIgnoresObjectHardnessBelow":20,"armorDr":{"light":1,"medium":2,"heavy":3},"automaticallyMasterwork":true,"steelReplacementHitPointMultiplier":1.3333333333,"costModifierGp":{"ammunition":60,"shield":2000,"lightArmor":5000,"mediumArmor":10000,"heavyArmor":15000,"weapon":3000},"requiresNormallyMetalItem":true}'),
('dmg-special-material-darkwood','Darkwood','283','material',
 'Darkwood can replace wooden or mostly wooden construction. It is automatically masterwork, weighs half normal, and reduces a darkwood shield''s armor check penalty by 2.',
 '["equipment","special-materials","darkwood"]','{"hardness":5,"hitPointsPerInch":10,"weightMultiplier":0.5,"automaticallyMasterwork":true,"shieldArmorCheckPenaltyAdjustment":2,"costModifierGpPerOriginalPound":10,"requiresNormallyWoodenOrMostlyWooden":true}'),
('dmg-special-material-dragonhide','283-284','material','material',
 'Dragonhide can produce masterwork armor and shields from sufficiently large dragon hides. It is nonmetal, so druids may wear it without violating their armor restriction.',
 '["equipment","special-materials","dragonhide"]','{"hardness":10,"hitPointsPerInch":10,"automaticallyMasterwork":true,"nonmetal":true,"druidCompatible":true,"costMultiplierVsMasterworkArmor":2,"armorYield":{"hideArmor":"dragon one size larger","bandedMail":"dragon two sizes larger","halfPlate":"dragon three sizes larger","breastplateOrFullPlate":"dragon four sizes larger"}}'),
('dmg-special-material-cold-iron','Cold Iron','284','material',
 'Cold iron weapons cost twice the normal weapon component and magical enhancement adds an additional 2,000 gp. The material is used for weapons with metal parts and is especially relevant against fey damage reduction.',
 '["equipment","special-materials","cold-iron"]','{"hardness":10,"hitPointsPerInch":30,"mundaneWeaponCostMultiplier":2,"additionalMagicEnhancementCostGp":2000,"oneHeadDoubleWeaponCostIncreaseFraction":0.5,"requiresMetalParts":true}'),
('dmg-special-material-mithral','Mithral','284','material',
 'Mithral is light, strong metal. Medium armor counts as light, heavy as medium, arcane spell failure drops 10 points, maximum Dexterity rises by 2, armor check penalty improves by 3 to minimum 0, and item weight halves. Mithral arms and armor are automatically masterwork.',
 '["equipment","special-materials","mithral"]','{"hardness":15,"hitPointsPerInch":30,"weightMultiplier":0.5,"armorCategoryShift":{"heavy":"medium","medium":"light","light":"light"},"arcaneSpellFailureAdjustment":-10,"maxDexAdjustment":2,"armorCheckPenaltyAdjustment":3,"armorCheckPenaltyMinimum":0,"automaticallyMasterwork":true,"costModifierGp":{"lightArmor":1000,"mediumArmor":4000,"heavyArmor":9000,"shield":1000,"otherPerPound":500}}'),
('dmg-special-material-alchemical-silver','Alchemical Silver','284-285','material',
 'Alchemical silver can be bonded to steel weapons but not nonmetal or rare-metal weapons. A successful silvered-weapon attack takes -1 damage, minimum 1, while gaining the material property needed against relevant damage reduction.',
 '["equipment","special-materials","alchemical-silver"]','{"hardness":8,"hitPointsPerInch":10,"damagePenalty":-1,"minimumDamageOnHit":1,"cannotApplyTo":["nonmetal","adamantine","cold iron","mithral"],"costModifierGp":{"ammunition":2,"lightWeapon":20,"oneHandedOrOneDoubleHead":90,"twoHandedOrBothDoubleHeads":180}}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       CASE WHEN d.slug LIKE 'dmg-special-material-%' THEN 'equipment' ELSE 'magic-items' END,
       d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
