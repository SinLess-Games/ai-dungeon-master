-- Correct ELH wild-feat names from Table 1-36.
-- The initial catalog pass used "Magical Beast Companion"; the printed feat is "Beast Companion".
-- Beast Wild Shape is also a distinct prerequisite feat and must exist independently of Magical Beast Wild Shape.

INSERT INTO dnd35_feats
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   repeatable,choice_kind,repeatability_text,normal_text,special_text)
SELECT 'elh-feat-beast-companion','elh-3.0','46','beast-companion','Beast Companion',
       'Gain access to more powerful animal-companion-style creatures under the epic wild feat rules.',
       'Epic wild feat. Requires Beast Wild Shape, Knowledge (nature) 24 ranks, and wild shape 6/day.',
       0,NULL,1,0,'other',NULL,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM dnd35_feats WHERE slug='beast-companion' AND owner_user_id IS NULL);

INSERT INTO dnd35_feats
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   repeatable,choice_kind,repeatability_text,normal_text,special_text)
SELECT 'elh-feat-beast-wild-shape','elh-3.0','46','beast-wild-shape','Beast Wild Shape',
       'Expand wild shape to qualifying beast forms under the Epic Level Handbook wild feat rules.',
       'Epic wild feat. Requires Knowledge (nature) 24 ranks and wild shape 6/day.',
       0,NULL,1,0,'none',NULL,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM dnd35_feats WHERE slug='beast-wild-shape' AND owner_user_id IS NULL);

-- Remove the non-source alias if the first pass inserted it. Nothing references it before this file in deterministic order.
DELETE FROM dnd35_feats
WHERE id='elh-feat-magical-beast-companion'
  AND source_id='elh-3.0'
  AND slug='magical-beast-companion';