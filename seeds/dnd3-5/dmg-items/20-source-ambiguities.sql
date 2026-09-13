-- Printed-source ambiguities preserved from Dungeon Master's Guide v.3.5 tables.
-- These are not silent corrections. They make overlapping percentile ranges explicit so
-- treasure-generation consumers can apply a deliberate project policy instead of guessing.

-- Table 7-18 (p. 231): the medium-ring column prints Animal Friendship at 47-51
-- and Energy Resistance, Minor at 50-56, so percentile results 50 and 51 overlap.
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
 'dmg-rule-dmg-ring-table-7-18-medium-overlap','dmg-3.5','231',
 'dmg-ring-table-7-18-medium-overlap','Table 7-18 Medium Ring Percentile Overlap',
 'Dungeon Master''s Guide Table 7-18 prints Animal Friendship at 47-51 in the medium column and Energy Resistance, Minor at 50-56. Percentile results 50 and 51 therefore match both printed entries.',
 'Preserve both printed ranges as source data. Random-treasure generation must not silently rewrite the table; a separate normalization policy may resolve percentile 50-51 when the generator is implemented.',
 0,NULL,1,'magic-items','source-conflict',0,1,NULL,NULL,
 '["magic-items","rings","table-7-18","source-conflict","percentile-overlap"]',
 '{"table":"7-18","page":231,"column":"medium","entries":[{"range":"47-51","item":"Animal Friendship","marketPriceGp":10800},{"range":"50-56","item":"Energy Resistance, Minor","marketPriceGp":12000}],"overlapValues":[50,51],"catalogPolicy":"preserve printed ranges until an explicit treasure-generation normalization rule is adopted"}'
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r
 WHERE r.source_id='dmg-3.5' AND r.slug='dmg-ring-table-7-18-medium-overlap' AND r.owner_user_id IS NULL
);

-- Table 7-22 (p. 238): the major-scroll column prints 8th-level spells at 86-95
-- and 9th-level spells at 95-100, so percentile result 95 overlaps.
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
 'dmg-rule-dmg-scroll-table-7-22-major-overlap','dmg-3.5','238',
 'dmg-scroll-table-7-22-major-overlap','Table 7-22 Major Scroll Percentile Overlap',
 'Dungeon Master''s Guide Table 7-22 prints 8th-level spells at 86-95 with caster level 15 and 9th-level spells at 95-100 with caster level 17. Percentile result 95 therefore matches both printed entries.',
 'Preserve both printed ranges as source data. Random-scroll generation must not silently rewrite the table; a separate normalization policy may resolve percentile 95 when the generator is implemented.',
 0,NULL,1,'magic-items','source-conflict',0,1,NULL,NULL,
 '["magic-items","scrolls","table-7-22","source-conflict","percentile-overlap"]',
 '{"table":"7-22","page":238,"column":"major","entries":[{"range":"86-95","spellLevel":8,"casterLevel":15},{"range":"95-100","spellLevel":9,"casterLevel":17}],"overlapValues":[95],"catalogPolicy":"preserve printed ranges until an explicit treasure-generation normalization rule is adopted"}'
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r
 WHERE r.source_id='dmg-3.5' AND r.slug='dmg-scroll-table-7-22-major-overlap' AND r.owner_user_id IS NULL
);
