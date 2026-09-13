-- Deities and Demigods: divine encounters and story-based XP guidance.
-- Source: Deities and Demigods, Chapter 2, p. 53. Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0','Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(slug,name,page,summary,tags,mechanics) AS (VALUES
('dd-divine-encounter-experience','Divine Encounters and Experience Points','53',
 'Experience for encounters with deities is normally story-based rather than calculated from a deity Challenge Rating. Routine divine contact earns no encounter XP; meaningful negotiation, thwarting divine plans, or escaping divine wrath can be assigned encounter-equivalent rewards from the circumstances.',
 '["deity","encounter","experience","story-award","challenge-rating"]',
 '{"deityChallengeRatingNotUsedForXp":true,"routineContacts":{"xp":0,"examples":["cleric praying for spells","casting commune","deity appearing in a dream or waking vision to assign a quest"]},"guidelines":[{"encounter":"negotiate with a deity","equivalentCrRelativeToAveragePartyLevel":{"min":-2,"max":1},"xpMultiplierTimesAveragePartyLevel":{"min":150,"max":450}},{"encounter":"thwart a deity plans","equivalentCrRelativeToAveragePartyLevel":{"min":0,"max":3},"xpMultiplierTimesAveragePartyLevel":{"min":300,"max":900}},{"encounter":"escape the wrath of a deity","equivalentCrRelativeToAveragePartyLevel":{"min":4,"max":7},"xpMultiplierTimesAveragePartyLevel":{"min":1200,"max":3600}}],"judgmentPriority":"Circumstances, campaign importance, and actual result take precedence over formulaic award selection."}'),

('dd-deity-statblock-challenge-rating','Deities and Challenge Rating','26-27',
 'Deities are presented without Challenge Ratings because ordinary mortal CR comparisons are not considered meaningful. If a DM needs a rough estimate for encounter planning, the book suggests total Hit Dice plus divine rank, but explicitly says not to use that estimate for XP awards.',
 '["deity","challenge-rating","hit-dice","divine-rank"]',
 '{"printedChallengeRating":null,"optionalEstimate":"total Hit Dice + divine rank","estimateIsApproximate":true,"useEstimateForExperienceAwards":false}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'divine-encounters','guidance',0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
