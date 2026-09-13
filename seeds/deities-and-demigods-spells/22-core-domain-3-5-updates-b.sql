-- Deities and Demigods official 3.5 update: remaining revised core-domain powers/spells.
-- Source: D&D v.3.5 Accessory Update for Deities and Demigods, pp. 5-6.
-- Complements 21-core-domain-3-5-updates.sql. These are revision rules, not duplicate PHB domain identities.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5',
        'Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,domain_slug,mechanics) AS (VALUES
('dd35-core-domain-animal-update','Animal Domain: D&Dg 3.5 Update','animal',
 '{"domainSlug":"animal","source":"dd-3.5-update","grantedPower":{"from":"animal friendship","to":"speak with animals"},"spellChanges":[{"from":"repel vermin","to":"summon nature''s ally IV","restriction":"Can summon animals only."},{"from":"creeping doom","to":"summon nature''s ally VIII","restriction":"Can summon animals only."}]}'),

('dd35-core-domain-destruction-update','Destruction Domain: D&Dg 3.5 Update','destruction',
 '{"domainSlug":"destruction","source":"dd-3.5-update","spellChanges":[{"from":"circle of doom","to":"mass inflict light wounds","type":"revised spell name/replacement"}]}'),

('dd35-core-domain-fire-update','Fire Domain: D&Dg 3.5 Update','fire',
 '{"domainSlug":"fire","source":"dd-3.5-update","spellChanges":[{"from":"resist elements","to":"resist energy","type":"revised spell name"}]}'),

('dd35-core-domain-healing-update','Healing Domain: D&Dg 3.5 Update','healing',
 '{"domainSlug":"healing","source":"dd-3.5-update","spellChanges":[{"from":"healing circle","to":"mass cure light wounds","type":"revised spell name/replacement"},{"from":"true resurrection","to":"mass cure critical wounds","authority":"explicit accessory-update replacement"}]}'),

('dd35-core-domain-luck-update','Luck Domain: D&Dg 3.5 Update','luck',
 '{"domainSlug":"luck","source":"dd-3.5-update","spellChanges":[{"from":"protection from elements","to":"protection from energy","type":"revised spell name"},{"from":"holy aura","to":"moment of prescience","authority":"explicit accessory-update replacement"}]}'),

('dd35-core-domain-magic-update','Magic Domain: D&Dg 3.5 Update','magic',
 '{"domainSlug":"magic","source":"dd-3.5-update","spellChanges":[{"from":"Nystul''s undetectable aura","to":"Nystul''s magic aura","type":"revised spell name"}]}'),

('dd35-core-domain-plant-update','Plant Domain: D&Dg 3.5 Update','plant',
 '{"domainSlug":"plant","source":"dd-3.5-update","spellChanges":[{"from":"changestaff","to":"animate plants","authority":"explicit accessory-update replacement"}]}'),

('dd35-core-domain-protection-update','Protection Domain: D&Dg 3.5 Update','protection',
 '{"domainSlug":"protection","source":"dd-3.5-update","spellChanges":[{"from":"protection from elements","to":"protection from energy","type":"revised spell name"}]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.5-update','update 6',d.slug,d.name,
  'Official D&D v.3.5 Accessory Update delta for the core '||d.domain_slug||' domain as used by Deities and Demigods.',
  'Apply this explicit revision when running Deities and Demigods material under D&D 3.5. Preserve the original 3.0 domain data separately.',
  0,NULL,1,'domain','revision',0,1,d.domain_slug,NULL,
  '["deities-and-demigods","domain","core-domain","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.5-update' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
