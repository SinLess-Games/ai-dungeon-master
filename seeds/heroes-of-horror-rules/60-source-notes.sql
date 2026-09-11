-- Heroes of Horror source notes represented as non-enabled guidance rows.
-- These preserve printed inconsistencies instead of silently normalizing source material.

WITH desired(slug,name,source_page,summary,tags,mechanics) AS (VALUES
('hoh-source-note-rigor-mortis-level','Source Note: Rigor Mortis Cleric Level','125,132',
 'Heroes of Horror prints Rigor Mortis as cleric 3 in its summary spell list and cleric 2 in the detailed spell entry. The spell catalog follows the detailed entry and records the conflict here.',
 '["source-note","spell","rigor-mortis","inconsistency"]',
 '{"spell":"rigor mortis","summary_list_level":{"cleric":3},"detailed_entry_level":{"cleric":2},"catalog_choice":"detailed entry","silent_reconciliation":false}'),
('hoh-source-note-resurrection-mishap-96','Source Note: Resurrection Mishap d% 96','80',
 'The Resurrection Mishaps table prints overlapping ranges at 96: the nightmare row ends at 96 and the taint-and-reroll row begins at 96. The rules seed preserves the overlap.',
 '["source-note","resurrection","table","inconsistency"]',
 '{"first_range":[93,96],"second_range":[96,100],"overlap":96,"silent_reconciliation":false}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'hoh-rule-'||d.slug,'hoh-3.5',d.source_page,d.slug,d.name,d.summary,d.summary,0,NULL,0,
       'source-note','guidance',1,0,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.slug=d.slug AND r.owner_user_id IS NULL);
