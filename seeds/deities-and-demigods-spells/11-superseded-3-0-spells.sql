-- Deities and Demigods Appendix 1: printed 3.0 spell definitions superseded for revised play.
-- The official D&D v.3.5 Accessory Update explicitly says to use the revised Player's Handbook
-- Rage and Undeath to Death spells instead of the versions printed in Deities and Demigods.
-- Therefore these are source-fidelity rules, NOT active dnd35_spells rows that would compete with
-- the revised core spell catalog.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002).',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5','Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,parent_slug,description,mechanics) AS (VALUES
('dd-printed-spell-rage','Rage — Printed D&Dg 3.0 Version','217','rage',
 'Preserves the complete Rage spell printed in the 2002 book while marking it superseded for D&D 3.5 execution.',
 '{"printed3_0":{"name":"Rage","school":"Enchantment","levels":{"Madness":3},"components":["V","S"],"castingTime":"1 action","range":"Touch","target":"Creature touched","duration":"1 round/level","savingThrow":"Will negates (harmless)","spellResistance":"Yes (harmless)","effect":{"strengthBonus":4,"constitutionBonus":4,"willSaveMoraleBonus":2,"armorClassPenalty":0,"postEffectFatigue":false,"description":"Places the touched creature into a screaming blood frenzy."}},"revision3_5":{"status":"superseded","instruction":"Use the spell named rage in the revised Player''s Handbook instead of this Deities and Demigods version.","activeDnd35SpellRowCreatedHere":false},"sourceFidelity":"Do not rewrite the printed 3.0 mechanics to match the revised PHB spell; retain both concepts separately."}'),

('dd-printed-spell-undeath-to-death','Undeath to Death — Printed D&Dg 3.0 Version','218','undeath-to-death',
 'Preserves the complete Undeath to Death spell printed in the 2002 book while marking it superseded for D&D 3.5 execution.',
 '{"printed3_0":{"name":"Undeath to Death","school":"Necromancy","levels":{"Sorcerer/Wizard":6,"Cleric":6,"Repose":6},"components":["V","S","M","DF"],"castingTime":"1 action","range":"Medium (100 ft. + 10 ft./level)","area":"Several undead creatures within a 50-ft.-radius burst","duration":"Instantaneous","savingThrow":"Will negates","spellResistance":"Yes","effect":{"hitDiceSlain":"1d4 HD of undead per caster level","maximum":"20d4 HD","priority":"Fewest-HD creatures first; among equal HD, closest to origin first."},"materialComponent":"Powder of a crushed diamond worth at least 500 gp."},"revision3_5":{"status":"superseded","instruction":"Use the spell named undeath to death in the revised Player''s Handbook instead of this Deities and Demigods version.","activeDnd35SpellRowCreatedHere":false},"sourceFidelity":"Do not silently replace this printed source definition with the revised PHB mechanics."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,
  'This row preserves a printed Deities and Demigods 3.0 spell definition. For D&D 3.5 execution, use the revised Player''s Handbook spell identified in mechanics.revision3_5.',
  0,NULL,1,'spell','superseded-source-definition',0,0,d.parent_slug,NULL,
  '["deities-and-demigods","spell","source-fidelity","superseded","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);