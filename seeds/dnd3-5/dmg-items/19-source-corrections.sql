-- Source-normalization corrections that intentionally run after the core DMG item files.
-- These corrections preserve source conflicts instead of silently choosing one representation.

-- 18-creation-special-materials.sql originally carried the right dragonhide mechanics but its compact VALUES
-- tuple placed the display name/page fields one column to the left. Correct the metadata after insertion.
UPDATE dnd35_rules
SET name='Dragonhide', source_page='283-284', kind='material', category='equipment'
WHERE source_id='dmg-3.5'
  AND slug='dmg-special-material-dragonhide'
  AND owner_user_id IS NULL;

-- The DMG itself contains a specific Assassin's Dagger price conflict:
-- Table 7-16 (p. 227) prints 10,302 gp, while the item description (p. 226) prints 18,302 gp
-- and a creation cost of 9,302 gp + 720 XP. Keep the table value in the generation table and the prose value
-- on the canonical item, and expose the discrepancy explicitly for deterministic consumers/UI.
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
 'dmg-rule-dmg-assassins-dagger-price-conflict','dmg-3.5','226-227',
 'dmg-assassins-dagger-price-conflict','Assassin''s Dagger Price Conflict',
 'Dungeon Master''s Guide Table 7-16 lists Assassin''s Dagger at 10,302 gp, while the adjacent specific-item description lists 18,302 gp and creation cost 9,302 gp + 720 XP. The catalog preserves the prose market price and the random-generation table preserves its printed table price.',
 'Dungeon Master''s Guide Table 7-16 lists Assassin''s Dagger at 10,302 gp, while the adjacent specific-item description lists 18,302 gp and creation cost 9,302 gp + 720 XP. The catalog preserves the prose market price and the random-generation table preserves its printed table price.',
 0,NULL,1,'magic-items','source-conflict',0,1,NULL,NULL,
 '["magic-items","weapons","assassins-dagger","source-conflict","price"]',
 '{"tablePage":227,"tableMarketPriceGp":10302,"descriptionPage":226,"descriptionMarketPriceGp":18302,"descriptionCraftCostGp":9302,"descriptionCraftXp":720,"catalogPolicy":"canonical item uses description value; generation table preserves table value"}'
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r
 WHERE r.source_id='dmg-3.5' AND r.slug='dmg-assassins-dagger-price-conflict' AND r.owner_user_id IS NULL
);
