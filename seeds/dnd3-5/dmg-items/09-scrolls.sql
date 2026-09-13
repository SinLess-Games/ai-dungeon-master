-- Dungeon Master's Guide v3.5 Chapter 7: scrolls, pp. 237-243.
-- Scrolls are normalized as generated spell-completion items rather than materialized as one database row
-- for every spell/caster-level combination. The existing spell catalog remains authoritative for spell mechanics.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
  ('dmg-scroll-form','Scroll Physical Form','237','rule',
   'A scroll stores one or more written spells on heavy paper, parchment, or similar material. It is normally rolled from both ends and kept in a protective case.',
   '["magic-items","scrolls","objects"]',
   '{"activationType":"spell_completion","singleUsePerSpell":true,"containerTypical":"scroll-case","spellEntriesMayShareOneScroll":true}'),

  ('dmg-scroll-decipher','Deciphering a Scroll','237','procedure',
   'Before a character can knowingly use a scroll, its magical writing must be deciphered. Read magic succeeds automatically; otherwise use Spellcraft DC 20 + spell level. Deciphering normally does not activate the spell.',
   '["magic-items","scrolls","spellcraft","activation"]',
   '{"readMagicAutomatic":true,"spellcraftDc":"20 + spell level","decipheringActivatesSpell":false,"exception":"specially prepared cursed scroll"}'),

  ('dmg-scroll-activation-requirements','Scroll Activation Requirements','237-238','rule',
   'To activate a scroll normally, the user must be able to see and read it, the spell must be the correct arcane/divine type, the spell must appear on the user''s class spell list, and the user must have the requisite ability score.',
   '["magic-items","scrolls","spell-completion","activation"]',
   '{"mustSeeWriting":true,"mustReadWriting":true,"typeMustMatch":{"arcaneUsers":"arcane-scroll","divineUsers":"divine-scroll"},"spellMustBeOnClassList":true,"minimumAbilityScore":"10 + spell level"}'),

  ('dmg-scroll-activation-components','Scroll Activation Components and Disruption','237-238','rule',
   'The scroll creator already supplied ordinary material components and focuses. The user must still supply an item that is itself the target when the spell requires one. Scroll activation can be disrupted like ordinary spellcasting and is subject to arcane spell failure.',
   '["magic-items","scrolls","components","arcane-spell-failure"]',
   '{"ordinaryMaterialComponentsAlreadyProvided":true,"ordinaryFocusAlreadyProvided":true,"targetItemStillRequiredWhenSpellTargetsItem":true,"subjectToSpellDisruption":true,"subjectToArcaneSpellFailure":true}'),

  ('dmg-scroll-caster-level-check','Scroll Caster-Level Check','238','procedure',
   'If the user meets all scroll prerequisites and their caster level is at least the scroll spell''s caster level, activation succeeds automatically. Otherwise make a caster level check against DC scroll caster level + 1. A natural 1 always fails.',
   '["magic-items","scrolls","caster-level","activation"]',
   '{"automaticSuccessWhenUserCasterLevelAtLeastScrollCasterLevel":true,"checkWhenUserCasterLevelLower":true,"check":"1d20 + user caster level","dc":"scroll caster level + 1","naturalOneAlwaysFails":true}'),

  ('dmg-scroll-mishap-check','Scroll Mishap Check','238','procedure',
   'After failing the caster-level check to activate a higher-caster-level scroll spell, the user makes a DC 5 Wisdom check. Failure causes a scroll mishap.',
   '["magic-items","scrolls","mishap","activation"]',
   '{"trigger":"failed scroll caster-level activation check","ability":"wisdom","dc":5,"failure":"scroll-mishap"}'),

  ('dmg-scroll-mishaps','Scroll Mishaps','238','table',
   'A failed scroll mishap check releases magical energy incorrectly. The DM chooses or rolls an appropriate mishap related to the attempted spell.',
   '["magic-items","scrolls","mishap","table"]',
   '{"examples":["spell affects random target or location within range","spell has an effect contrary to its normal effect","user suffers a minor bizarre effect related to the spell","innocuous objects or phenomena appear in the spell area","spell activates after a delay of 1d12 hours"],"minorBizarreEffectDuration":"spell duration; if instantaneous, 2d10 minutes","dmMayChooseOtherAppropriateMishap":true}'),

  ('dmg-scroll-use-magic-device','Use Magic Device with Scrolls','237-238','rule',
   'Use Magic Device can emulate class-list and ability-score requirements for scroll activation under the Player''s Handbook skill rules; normal scroll mishap risk remains relevant when activation would otherwise be unsafe.',
   '["magic-items","scrolls","use-magic-device"]',
   '{"useScrollUmdDc":"20 + scroll caster level","decipherWrittenSpellUmdDc":"25 + spell level","canEmulateAbilityScore":true,"canEmulateClassListAccess":true,"scrollMishapRulesStillApply":true}'),

  ('dmg-scroll-spell-consumption','Scroll Spell Consumption','237-238','rule',
   'Once a spell is successfully activated from a scroll, its writing disappears and that stored spell is expended. Other spells written on the same scroll remain available.',
   '["magic-items","scrolls","charges","single-use"]',
   '{"consumesActivatedSpell":true,"otherSpellsOnSameScrollRemain":true}'),

  ('dmg-scroll-type-table','Table 7-20: Scroll Types','238','table',
   'Randomly generated scrolls are arcane on 01-70 and divine on 71-100.',
   '["magic-items","scrolls","random-generation","table-7-20"]',
   '{"ranges":[[1,70,"arcane"],[71,100,"divine"]]}'),

  ('dmg-scroll-spell-count-table','Table 7-21: Number of Spells on a Scroll','238','table',
   'Determine the number of spells recorded on a randomly generated scroll according to treasure strength.',
   '["magic-items","scrolls","random-generation","table-7-21"]',
   '{"minor":"1d3","medium":"1d4","major":"1d6"}'),

  ('dmg-scroll-spell-level-table','Table 7-22: Scroll Spell Levels','238','table',
   'Determine each spell''s level and default caster level by treasure strength. The printed table assumes cleric, druid, or wizard caster levels.',
   '["magic-items","scrolls","random-generation","table-7-22"]',
   '{"minor":[[1,5,{"spellLevel":0,"casterLevel":1}],[6,50,{"spellLevel":1,"casterLevel":1}],[51,95,{"spellLevel":2,"casterLevel":3}],[96,100,{"spellLevel":3,"casterLevel":5}]],"medium":[[1,5,{"spellLevel":2,"casterLevel":3}],[6,65,{"spellLevel":3,"casterLevel":5}],[66,95,{"spellLevel":4,"casterLevel":7}],[96,100,{"spellLevel":5,"casterLevel":9}]],"major":[[1,5,{"spellLevel":4,"casterLevel":7}],[6,50,{"spellLevel":5,"casterLevel":9}],[51,70,{"spellLevel":6,"casterLevel":11}],[71,85,{"spellLevel":7,"casterLevel":13}],[86,95,{"spellLevel":8,"casterLevel":15}],[96,100,{"spellLevel":9,"casterLevel":17}]],"casterLevelAssumption":["cleric","druid","wizard"],"sourceTextExtractionNote":"One extracted text layer rendered the final major row as 95-100, overlapping the preceding 86-95 row. Runtime normalization uses 96-100 to preserve an exhaustive, nonoverlapping percentile table; verify against the visual source before publication lock."}'),

  ('dmg-scroll-spell-selection','Tables 7-23 and 7-24: Scroll Spell Selection','239-243','procedure',
   'After scroll type, spell count, and spell level are known, select the stored spell from the corresponding arcane or divine scroll-spell table. Arcane entries use the sorcerer/wizard level when bard level differs; divine entries use the cleric/druid level when paladin or ranger level differs.',
   '["magic-items","scrolls","random-generation","table-7-23","table-7-24"]',
   '{"arcaneSource":"Table 7-23","divineSource":"Table 7-24","arcaneDefaultLevel":"sorcerer/wizard when bard differs","divineDefaultLevel":"cleric/druid when paladin/ranger differs","normalizedResolver":"select eligible source-backed spell from dnd35 spell catalog using source-list and spell-level metadata","materializeEverySpellVariant":false}'),

  ('dmg-scroll-market-price','Scroll Market Price Formula','237-243','rule',
   'A normal scroll spell''s base market price is spell level times caster level times 25 gp, with 0-level spells treated as one-half level for pricing, plus expensive material component and XP-cost adjustments.',
   '["magic-items","scrolls","pricing","creation"]',
   '{"basePriceGp":"spell level * caster level * 25","zeroLevelPricingLevel":0.5,"addExpensiveMaterialComponentCost":true,"addXpCostPricingAdjustment":true}'),

  ('dmg-scroll-creation','Scribe Scroll Construction','282-288','rule',
   'Creating a scroll uses Scribe Scroll and the standard magic-item creation rules. The creator must supply the spell and required components and pays the appropriate creation cost and XP.',
   '["magic-items","scrolls","creation","scribe-scroll"]',
   '{"feat":"Scribe Scroll","baseCraftCostFraction":0.5,"baseXpCostFractionOfMarketPrice":0.04,"creatorMustSupplySpell":true,"creatorSuppliesComponents":true}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
  'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

-- Generic runtime archetype. Individual generated scroll instances should reference their stored spell IDs and
-- caster levels in instance/campaign state rather than creating thousands of catalog definitions.
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT
  'dmg-item-scroll-archetype','dmg-3.5','237-243','scroll-archetype','Scroll',
  'Spell-completion magic-item archetype used by the treasure and inventory systems to instantiate source-backed scroll spells.',
  'Generated instances contain one or more spell references, scroll type (arcane or divine), caster level, and computed price. Each spell is expended when successfully activated.',
  0,NULL,1,'consumable',NULL,NULL,NULL,NULL,NULL
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug='scroll-archetype' AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
VALUES
  ('dmg-item-scroll-archetype',NULL,NULL,NULL,NULL,'spell_completion',
   'Read a deciphered stored spell using the scroll spell-completion rules. Runtime instances supply spell and caster-level metadata.',
   'slotless',NULL,'Each stored spell is single-use and does not recharge.',0,NULL,NULL,'Scribe Scroll; runtime instance supplies the stored spell prerequisites.',NULL);
