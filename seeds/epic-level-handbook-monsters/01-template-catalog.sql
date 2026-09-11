-- Epic Level Handbook template catalog.
-- Detailed mechanics live in 00-templates.sql as source-cited dnd35_rules rows; this file materializes
-- the same templates in the dedicated dnd35_templates schema for rules-engine discovery.
-- The 3.0 source does not use the later inherited/acquired label consistently for Paragon or Epic
-- Pseudonatural, so those two use schema kind 'either' and say so explicitly rather than inventing a source classification.

WITH desired(id,slug,name,page,kind,cr_adj,result_type_slug,natural_armor,description,rules_text,transformations,applicability) AS (VALUES
('elh-template-paragon-row','paragon-creature','Paragon Creature','209-210','either',NULL,NULL,5,
 'Epic Level Handbook template for an exceptional creature with extreme physical, defensive, skill, and supernatural improvements.',
 'Applies to any creature. ELH does not label this 3.0 template inherited or acquired; schema kind is therefore the noncommittal value either. Conditional CR adjustments and complete mechanics are stored in the elh-template-paragon rule row.',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.template.paragon","version":1,"parameters":{"ruleSlug":"elh-template-paragon","speedMultiplier":3,"maximumHitPointsPerHitDie":true,"bonusHitPointsPerHitDie":12,"naturalArmorAdjustment":5,"abilityScoreIncrease":15,"skillCompetenceBonus":10,"bonusFeats":2}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"Any creature.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Any creature."}}}}'),

('elh-template-pseudonatural-row','epic-pseudonatural-creature','Epic Pseudonatural Creature','212-213','either',NULL,'outsider',35,
 'Epic Level Handbook pseudonatural template for a corporeal creature transformed into an alien outsider of tremendous power.',
 'Applies to any corporeal creature. This is the Epic Level Handbook version, not the lower-powered Tome and Blood pseudonatural template. ELH does not label the template inherited or acquired; schema kind is therefore either. Conditional CR and resistance/DR scaling are stored in the elh-template-pseudonatural rule row.',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.template.epic-pseudonatural","version":1,"parameters":{"ruleSlug":"elh-template-pseudonatural","speedMultiplier":2,"maximumHitPointsPerHitDie":true,"naturalArmorAdjustment":35,"spellResistanceFormula":"Hit Dice * 5"}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"Any corporeal creature.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Any corporeal creature."}}}}'),

('elh-template-demilich-row','demilich','Demilich','174-176','acquired',NULL,'undead',0,
 'Epic transformation of a lich into a demilich, retaining spellcasting while gaining exceptional defenses, phylactery-linked equipment benefits, and greater supernatural power.',
 'Applies only to a lich. Complete mechanics are stored in the elh-template-demilich rule row; no Challenge Rating adjustment is inserted here because the retrieved source material used for this seed does not establish one.',
 '[{"kind":"custom","extension":{"key":"dnd35.elh.template.demilich","version":1,"parameters":{"ruleSlug":"elh-template-demilich","turnResistanceBonus":20,"acidResistance":20,"sonicResistance":20,"naturalFlySpeedFeet":180,"naturalFlyManeuverability":"perfect"}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"Any lich.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Any lich."}}}}'),

('elh-template-worm-that-walks-row','worm-that-walks','Worm That Walks','228-230','acquired',3,'ooze',0,
 'Epic transformation in which an evil wizard or sorcerer returns after death as a colony of worms while retaining spellcasting.',
 'Applies to an evil wizard or sorcerer that undergoes the source ritual and succeeds at the transformation chance. Detailed ritual and combat mechanics are stored in the elh-template-worm-that-walks rule row.',
 '[{"kind":"hit_die","sides":8},{"kind":"custom","extension":{"key":"dnd35.elh.template.worm-that-walks","version":1,"parameters":{"ruleSlug":"elh-template-worm-that-walks","challengeRatingAdjustment":3,"blindsightFeet":300,"spellResistanceFormula":"challenge rating + 10"}}}]',
 '{"version":1,"condition":{"kind":"custom","description":"An evil wizard or sorcerer who completes the Worm That Walks preparation and post-death transformation process.","extension":{"key":"dnd35.prerequisite.source-text","version":1,"parameters":{"text":"Evil wizard or sorcerer; see ELH Worm That Walks ritual requirements."}}}}')
)
INSERT INTO dnd35_templates
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   result_creature_type_id,kind,challenge_rating_adjustment,level_adjustment,natural_armor_adjustment,transformations,applicability)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       CASE WHEN d.result_type_slug IS NULL THEN NULL ELSE (SELECT ct.id FROM dnd35_creature_types ct WHERE ct.slug=d.result_type_slug AND ct.owner_user_id IS NULL LIMIT 1) END,
       d.kind,d.cr_adj,NULL,d.natural_armor,d.transformations,d.applicability
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_templates t WHERE t.source_id='elh-3.0' AND t.slug=d.slug AND t.owner_user_id IS NULL
);

WITH ability_data(template_slug,ability,modifier) AS (VALUES
 ('paragon-creature','str',15),('paragon-creature','dex',15),('paragon-creature','con',15),('paragon-creature','int',15),('paragon-creature','wis',15),('paragon-creature','cha',15),
 ('epic-pseudonatural-creature','str',22),('epic-pseudonatural-creature','dex',10),('epic-pseudonatural-creature','con',10),('epic-pseudonatural-creature','wis',10),
 ('demilich','int',10),('demilich','wis',10),('demilich','cha',10)
)
INSERT OR IGNORE INTO dnd35_template_ability_modifiers (template_id,ability,modifier)
SELECT t.id,d.ability,d.modifier
FROM ability_data d
JOIN dnd35_templates t ON t.source_id='elh-3.0' AND t.slug=d.template_slug AND t.owner_user_id IS NULL;
