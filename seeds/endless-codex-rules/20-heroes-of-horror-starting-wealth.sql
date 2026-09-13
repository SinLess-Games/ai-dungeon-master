-- Endless Codex starting-wealth defaults for the two Heroes of Horror base classes.
-- Heroes of Horror pp. 82-88 presents Archivist and Dread Necromancer but does not print
-- starting-gold formulas for either class. Do not misattribute these values to the sourcebook.
--
-- Project defaults:
--   Archivist:        5d4 x 10 gp (cleric-equivalent wealth; prepared divine caster with medium armor)
--   Dread Necromancer: 4d4 x 10 gp (bard-equivalent wealth; armored spontaneous arcane caster)
--
-- The PHB 3.5 baseline formulas used for those analogues are Cleric 5d4 x10 and Bard 4d4 x10.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('endless-codex-house-rules','endless-codex-house-rules','The Endless Codex House Rules','EC-HR',
        'SinLess Games','dnd','3.5','Built-in Endless Codex campaign variants and deterministic extensions to source-backed D&D 3.5 rules.',NULL,0,1,NULL);

WITH desired(slug,name,summary,mechanics) AS (VALUES
  ('endless-codex-archivist-starting-wealth','Archivist Starting Wealth',
   'Because Heroes of Horror omits a starting-gold formula for the Archivist, Endless Codex uses the PHB cleric-equivalent formula: 5d4 × 10 gp.',
   '{"classSlug":"archivist","formula":{"diceCount":5,"dieSides":4,"multiplierGp":10},"averageGp":125,"basis":"PHB cleric-equivalent starting wealth","sourcebookPrintedFormula":false}'),
  ('endless-codex-dread-necromancer-starting-wealth','Dread Necromancer Starting Wealth',
   'Because Heroes of Horror omits a starting-gold formula for the Dread Necromancer, Endless Codex uses the PHB bard-equivalent formula: 4d4 × 10 gp.',
   '{"classSlug":"dread-necromancer","formula":{"diceCount":4,"dieSides":4,"multiplierGp":10},"averageGp":100,"basis":"PHB bard-equivalent starting wealth","sourcebookPrintedFormula":false}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'ec-rule-'||d.slug,'endless-codex-house-rules','Heroes of Horror pp. 82-88',d.slug,d.name,d.summary,d.summary,
       1,NULL,1,'character-creation','rule',1,1,NULL,NULL,
       '["starting-wealth","character-creation","heroes-of-horror","house-rule"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='endless-codex-house-rules' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

WITH desired(class_slug,dice_count,die_sides,multiplier_gp) AS (VALUES
  ('archivist',5,4,10),
  ('dread-necromancer',4,4,10)
)
INSERT INTO dnd35_class_starting_wealth (class_id,dice_count,die_sides,multiplier_gp)
SELECT c.id,d.dice_count,d.die_sides,d.multiplier_gp
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  dice_count=excluded.dice_count,
  die_sides=excluded.die_sides,
  multiplier_gp=excluded.multiplier_gp;
