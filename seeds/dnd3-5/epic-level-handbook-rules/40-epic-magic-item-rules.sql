-- Epic Level Handbook: epic magic item thresholds and creation rules.
-- Source: Epic Level Handbook, Chapter 4, pp. 123-124. Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
('elh-epic-magic-item-definition','Epic Magic Item Definition','123','epic-magic-items','rule',
 'Epic magic items are a fourth magic-item power category beyond minor, medium, and major items. They are craftable rather than unique artifacts, but one sufficiently epic characteristic generally makes an item epic.',
 '["epic","magic-item","classification","artifact"]',
 '{"artifact":false,"unique":false,"craftable":true,"typicalEpicTriggers":[{"characteristic":"attack or damage bonus","threshold":5,"comparison":"greater-than"},{"characteristic":"armor enhancement bonus","threshold":5,"comparison":"greater-than"},{"characteristic":"special ability market-price modifier","threshold":5,"comparison":"greater-than"},{"characteristic":"armor bonus excluding armor enhancement","threshold":10,"comparison":"greater-than"},{"characteristic":"natural armor bonus","threshold":5,"comparison":"greater-than"},{"characteristic":"deflection bonus","threshold":5,"comparison":"greater-than"},{"characteristic":"resistance bonus","threshold":5,"comparison":"greater-than"},{"characteristic":"enhancement bonus to an ability score","threshold":6,"comparison":"greater-than"},{"characteristic":"enhancement bonus on a skill check","threshold":30,"comparison":"greater-than"},{"characteristic":"effective spell level mimicked","threshold":9,"comparison":"greater-than"},{"characteristic":"caster level","threshold":20,"comparison":"greater-than"},{"characteristic":"market price gp","threshold":200000,"comparison":"greater-than","exclusions":["base armor or weapon material cost","material-component costs","experience-point-based costs","additional intelligent-item value"]}]}'),

('elh-epic-magic-item-hard-limits','Epic Magic Item Hard Limits','123','epic-magic-items','rule',
 'Even an epic magic item cannot grant a dodge bonus, cannot exceed the normal +5 inherent ability-score bonus limit, and cannot use or mimic an epic spell; the source notes that a major artifact might mimic an epic spell.',
 '["epic","magic-item","limits","epic-spell","inherent-bonus"]',
 '{"canGrantDodgeBonus":false,"maximumInherentAbilityBonus":5,"canUseEpicSpell":false,"canMimicEpicSpell":false,"majorArtifactMayMimicEpicSpell":true}'),

('elh-epic-item-minimum-caster-level','Epic Item Minimum Caster Level for 10th+ Spell Effects','124','epic-magic-items','rule',
 'A spell effect of effective level 10 or higher used in an item has minimum caster level equal to 11 plus effective spell level.',
 '["epic","magic-item","caster-level","spell-level"]',
 '{"appliesFromEffectiveSpellLevel":10,"formula":"11 + effectiveSpellLevel","examples":[{"effectiveSpellLevel":10,"minimumCasterLevel":21},{"effectiveSpellLevel":17,"minimumCasterLevel":28}]}'),

('elh-epic-item-creation-feat-pair','Epic Item Creation Requires Epic and Nonepic Feats','124','epic-magic-items','rule',
 'Creating an epic magic item requires the corresponding epic item-creation feat in addition to the ordinary item-creation feat.',
 '["epic","magic-item","item-creation","feat"]',
 '{"requiresBothVersions":true,"examples":[{"itemType":"staff","nonepicFeat":"Craft Staff","epicFeat":"Craft Epic Staff"},{"itemType":"rod","nonepicFeat":"Craft Rod","epicFeat":"Craft Epic Rod"},{"itemType":"wondrous item","nonepicFeat":"Craft Wondrous Item","epicFeat":"Craft Epic Wondrous Item"},{"itemType":"ring","nonepicFeat":"Forge Ring","epicFeat":"Forge Epic Ring"},{"itemType":"scroll","nonepicFeat":"Scribe Scroll","epicFeat":"Scribe Epic Scroll"},{"itemType":"magic arms and armor","nonepicFeat":"Craft Magic Arms and Armor","epicFeat":"Craft Epic Magic Arms and Armor"}]}'),

('elh-epic-item-market-price','Epic Magic Item Market Price','124','epic-magic-items','subsystem',
 'Use ordinary magic-item pricing, but multiply by ten only the market-price portion derived from a characteristic that exceeds the nonepic limit. Do not multiply unrelated nonepic qualities, and do not apply the multiplier merely because caster level is epic.',
 '["epic","magic-item","market-price","crafting"]',
 '{"base":"Dungeon Masters Guide magic-item pricing guidelines","epicCharacteristicMultiplier":10,"multiplyOnlyEpicDerivedPortion":true,"nonepicQualitiesRemainNormallyPriced":true,"casterLevelAloneTriggersMultiplier":false,"existingEpicItemComparison":"If price is derived by comparison with a listed epic item, do not multiply by ten again.","example":{"item":"belt granting Strength +8 and Constitution +6","strengthPortionGp":640000,"constitutionPortionGp":72000,"totalGp":712000}}'),

('elh-epic-item-xp-cost','Epic Magic Item XP Cost','124','epic-magic-items','subsystem',
 'Epic non-scroll items and epic scrolls use different XP-cost formulas rather than the standard nonepic creation formula.',
 '["epic","magic-item","experience","crafting","scroll"]',
 '{"nonScrollFormula":"marketPriceGp / 100 + 10000","scrollFormula":"marketPriceGp / 25 + 1000","examples":[{"item":"ring of epic protection +10","marketPriceGp":2000000,"creationXp":30000},{"item":"epic scroll containing a 10th-level spell effect","marketPriceGp":5250,"creationXp":1210}]}'),

('elh-epic-psionic-item-equivalence','Epic Psionic Item Equivalence','124','epic-magic-items','guidance',
 'Many epic magic-item bonuses and resistances can be rebuilt as psionic items at the same market value; effects granting extra spell capacity require separate treatment, with the ring of epic psionics offered as a model.',
 '["epic","magic-item","psionic-item","market-price"]',
 '{"sameValueExamples":["weapon bonuses","armor bonuses","ring resistances","ability-score bonuses"],"extraSpellCapacityRequiresSeparateModel":true,"exampleModel":"ring of epic psionics"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       d.category,d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
