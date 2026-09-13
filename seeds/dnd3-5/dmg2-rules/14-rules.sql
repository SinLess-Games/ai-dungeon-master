-- Dungeon Master's Guide II source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg2-3.5','dungeon-masters-guide-ii-3-5','Dungeon Master''s Guide II','DMG II',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 Dungeon Master''s Guide II: expanded DM procedures, encounter subsystems, campaign tools, character teamwork systems, and magic-item options.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg2-weapon-armor-templates','Weapon and Armor Templates','273','equipment','subsystem',1,0,NULL,NULL,'A mundane item template modifies construction, material, cost, weight, hardness, masterwork properties, or special benefits before later magical enhancement.','["templates","equipment"]','{}'),
  ('dmg2-template-crafting','Crafting Templated Items','274','equipment','procedure',1,0,'dmg2-weapon-armor-templates',NULL,'To craft an item with a template, use the template''s materials, Craft requirements, added cost, and other construction restrictions in addition to ordinary crafting rules.','["crafting","templates"]','{}'),
  ('dmg2-artifacts-in-campaign','Artifacts in Your Campaign','279','magic-items','guidance',0,1,NULL,NULL,'Introduce artifacts for specific campaign purposes, make their effects and consequences significant, and give removal/destruction methods that support adventure play.','["artifacts","campaign"]','{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg2-3.5-rule-' || d.slug, 'dmg2-3.5', d.source_page, d.slug, d.name, d.summary, d.summary,
  0,NULL,1,d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);
