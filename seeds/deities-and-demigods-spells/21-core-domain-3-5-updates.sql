-- Deities and Demigods official 3.5 update: changes to core Player's Handbook domains
-- used by the book's deities. These are not new D&Dg domains, so preserve them as revision rules
-- rather than duplicating PHB domain identities.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5',
        'Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,domain_slug,mechanics) AS (VALUES
('dd35-core-domain-strength-update','Strength Domain: D&Dg 3.5 Update','strength',
 '{"domainSlug":"strength","source":"dd-3.5-update","changes":[{"from":"endure elements","to":"enlarge person","instruction":"Replace endure elements with enlarge person in the Strength domain spell list when using Deities and Demigods with the revised core rules."}]}'),
('dd35-core-domain-travel-update','Travel Domain: D&Dg 3.5 Update','travel',
 '{"domainSlug":"travel","source":"dd-3.5-update","changes":[{"from":"expeditious retreat","to":"longstrider","instruction":"Replace expeditious retreat with longstrider."},{"from":"teleport without error","to":"greater teleport","instruction":"The revised spell name is greater teleport."}]}'),
('dd35-core-domain-trickery-update','Trickery Domain: D&Dg 3.5 Update','trickery',
 '{"domainSlug":"trickery","source":"dd-3.5-update","changes":[{"from":"change self","to":"disguise self","instruction":"The revised spell name is disguise self."}]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.5-update','update 10',d.slug,d.name,
  'Official D&D v.3.5 Accessory Update delta for the core '||d.domain_slug||' domain as used by Deities and Demigods.',
  'Apply this explicit revision when running Deities and Demigods material under D&D 3.5. Do not overwrite the original PHB 3.0 source list.',
  0,NULL,1,'domain','revision',0,1,d.domain_slug,NULL,
  '["deities-and-demigods","domain","core-domain","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.5-update' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
