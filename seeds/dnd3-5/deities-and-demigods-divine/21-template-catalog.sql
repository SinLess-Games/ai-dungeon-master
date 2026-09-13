-- Deities and Demigods dedicated template catalog.
-- Detailed source mechanics live in 20-creature-templates.sql; this file makes applicable templates discoverable
-- through dnd35_templates without misclassifying them as player races.

WITH desired(id,source_id,slug,name,page,kind,result_type_slug,description,rules_text,transformations,applicability) AS (VALUES
('dd-template-petitioner-row','dd-3.0','petitioner','Petitioner','29-30','acquired','outsider',
 'Template for a deceased soul given outsider form as a petitioner on an Outer Plane.',
 'Petitioners are NPC-only planar souls in the source. Detailed defenses, planar commitment, loss of prior supernatural abilities, optional plane-specific traits, and resurrection-memory rules are stored in dd-template-petitioner.',
 '[{"kind":"hit_die","sides":8},{"kind":"custom","extension":{"key":"dnd35.dd.template.petitioner","version":1,"parameters":{"ruleSlug":"dd-template-petitioner","fixedRacialHitDice":2,"baseAttackBonus":2,"baseFortSave":3,"baseRefSave":3,"baseWillSave":3,"challengeRating":1,"playerCharacterUse":false}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"A deceased mortal soul that becomes a petitioner on an Outer Plane under the campaign cosmology.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Deceased soul becoming a petitioner on an Outer Plane."}}}}'),

('dd-template-einherjar-row','dd-3.5-update','einherjar','Einherjar','10-11','acquired','outsider',
 'Official 3.5-update template for a good humanoid warrior elevated to divine rank 0 as an einherjar.',
 'Requires a good humanoid with at least 10 levels in barbarian, fighter, ranger, or paladin. The update changes type to outsider with good subtype, adds extraplanar on the Material Plane, increases land speed by 30 feet, and grants rank-0 quasi-deity traits.',
 '[{"kind":"custom","extension":{"key":"dnd35.dd35.template.einherjar","version":1,"parameters":{"ruleSlug":"dd-update-template-einherjar","divineRank":0,"baseLandSpeedIncreaseFeet":30,"damageReduction":{"amount":10,"bypass":"epic"},"fireResistance":5,"spellResistance":32,"immortal":true}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"Good humanoid with at least 10 levels of barbarian, fighter, ranger, or paladin.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Good humanoid; at least 10 levels of barbarian, fighter, ranger, or paladin."}}}}')
)
INSERT INTO dnd35_templates
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   result_creature_type_id,kind,challenge_rating_adjustment,level_adjustment,natural_armor_adjustment,transformations,applicability)
SELECT d.id,d.source_id,d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.result_type_slug AND ct.owner_user_id IS NULL LIMIT 1),
       d.kind,NULL,NULL,0,d.transformations,d.applicability
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_templates t WHERE t.source_id=d.source_id AND t.slug=d.slug AND t.owner_user_id IS NULL
);

-- Good and extraplanar subtype IDs are resolved only when present in the shared 3.5 creature catalog.
WITH subtype_data(template_slug,source_id,subtype_slug,operation) AS (VALUES
 ('einherjar','dd-3.5-update','good','add')
)
INSERT OR IGNORE INTO dnd35_template_subtypes (template_id,subtype_id,operation)
SELECT t.id,st.id,d.operation
FROM subtype_data d
JOIN dnd35_templates t ON t.source_id=d.source_id AND t.slug=d.template_slug AND t.owner_user_id IS NULL
JOIN dnd35_creature_subtypes st ON st.slug=d.subtype_slug AND st.owner_user_id IS NULL;
