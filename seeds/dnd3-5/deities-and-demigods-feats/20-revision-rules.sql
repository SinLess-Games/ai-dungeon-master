-- Official Deities and Demigods D&D v.3.5 Accessory Update feat compatibility.
-- These rows keep the revised PHB definitions authoritative instead of duplicating
-- obsolete 3.0 feat definitions under the Deities source.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5',
        'Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,parent_slug,supersedes_slug,rules_text,tags,mechanics) AS (VALUES
  ('dd35-feat-use-revised-phb-eschew-materials','Use Revised PHB Eschew Materials','45','eschew-materials','dd-eschew-materials',
   'When Deities and Demigods references Eschew Materials, use the revised Player''s Handbook version rather than the older Deities and Demigods text.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"eschew-materials","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-use-revised-phb-greater-spell-focus','Use Revised PHB Greater Spell Focus','45','greater-spell-focus','dd-greater-spell-focus',
   'When Deities and Demigods references Greater Spell Focus, use the revised Player''s Handbook version.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"greater-spell-focus","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-use-revised-phb-greater-spell-penetration','Use Revised PHB Greater Spell Penetration','45','greater-spell-penetration','dd-greater-spell-penetration',
   'When Deities and Demigods references Greater Spell Penetration, use the revised Player''s Handbook version.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"greater-spell-penetration","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-use-revised-phb-greater-two-weapon-fighting','Use Revised PHB Greater Two-Weapon Fighting','45','greater-two-weapon-fighting','dd-greater-two-weapon-fighting',
   'When Deities and Demigods references Greater Two-Weapon Fighting, use the revised Player''s Handbook version.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"greater-two-weapon-fighting","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-use-revised-phb-improved-grapple','Use Revised PHB Improved Grapple','45','improved-grapple','dd-improved-grapple',
   'When Deities and Demigods references Improved Grapple, use the revised Player''s Handbook version.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"improved-grapple","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-use-revised-phb-widen-spell','Use Revised PHB Widen Spell','45','widen-spell','dd-widen-spell',
   'When Deities and Demigods references Widen Spell, use the revised Player''s Handbook version.',
   '["deities-and-demigods","3.5-update","feat","compatibility"]',
   '{"replacementSlug":"widen-spell","replacementSource":"players-handbook-3-5"}'),
  ('dd35-feat-improved-sunder-replacement','Replace Defunct Deities Improved Sunder','45','improved-sunder','dd-improved-sunder',
   'The Improved Sunder feat printed in Deities and Demigods is defunct in the revision. Use the revised Player''s Handbook Improved Sunder instead; deity stat blocks that already spent a separate slot on the obsolete feat should choose another suitable feat.',
   '["deities-and-demigods","3.5-update","feat","deprecated","compatibility"]',
   '{"replacementSlug":"improved-sunder","replacementSource":"players-handbook-3-5","obsoleteDefinition":true}'),
  ('dd35-feat-skill-focus-adjustment','Apply Revised Skill Focus Bonus','45','skill-focus',NULL,
   'For Deities and Demigods stat blocks that possess Skill Focus, use the revised feat bonus when recalculating the affected skill modifier.',
   '["deities-and-demigods","3.5-update","feat","skill-focus"]',
   '{"useRevisedFeat":true}'),
  ('dd35-feat-spell-focus-dc-adjustment','Recalculate Spell Focus Save DCs','45','spell-focus',NULL,
   'For deities with Spell Focus or Greater Spell Focus, recalculate spell saving throw DCs using the revised feat definitions.',
   '["deities-and-demigods","3.5-update","feat","spell-focus"]',
   '{"useRevisedFeat":true,"recalculateSaveDcs":true}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd35-rule-'||d.slug,'dd-3.5-update',d.source_page,d.slug,d.name,'',d.rules_text,
       0,NULL,1,'feats','rule',0,1,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.5-update' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
