-- Epic Level Handbook source-fidelity notes.
-- Printed contradictions are preserved instead of silently normalized.
WITH desired(slug,name,page,rules_text,mechanics) AS (VALUES
  ('elh-source-note-rapid-inspiration-prerequisite','Rapid Inspiration prerequisite discrepancy','49, 66',
   'Table 1-36 lists Rapid Inspiration as requiring Perform 30 ranks plus bardic music, while the detailed feat entry on page 66 lists Perform 25 ranks plus bardic music. The feat prerequisite seed preserves the table value and records this conflict explicitly rather than silently choosing one as an erratum.',
   '{"entity":"rapid-inspiration","tablePrerequisite":"Perform 30 ranks; bardic music class feature","detailedFeatPrerequisite":"Perform 25 ranks; bardic music class feature","resolution":"preserve printed discrepancy; table value retained in prerequisite row pending explicit erratum or project adjudication"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,'',d.rules_text,0,NULL,1,
       'source-notes','guidance',0,1,NULL,NULL,'["epic","source-fidelity","printed-inconsistency"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);