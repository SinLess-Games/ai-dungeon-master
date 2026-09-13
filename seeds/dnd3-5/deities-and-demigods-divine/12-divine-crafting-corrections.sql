-- Deities and Demigods: semantic corrections/completion for divine item creation.
-- Source: Deities and Demigods (2002), pp. 27 and 34-35.
-- These statements enrich previously seeded summaries; they do not create a separate artifact subsystem
-- because the book handles artifacts through general divine item creation, Craft Artifact, and deity possessions.

UPDATE dnd35_rules
SET
  description='A deity of rank 1 or higher can create magic items related to its portfolio without the normally requisite item-creation feat if it meets the other prerequisites. Maximum market price scales by divine-rank band; greater deities can create artifacts.',
  rules_text='Rank 1-5: maximum 4,500 gp. Rank 6-10: maximum 30,000 gp. Rank 11-15: maximum 200,000 gp and the item must be nonartifact. Rank 16-20: no market-price maximum, including artifacts. Ordinary cost and creation time otherwise apply. If the deity possesses the item-creation feat appropriate to the item, gp cost, XP cost, and creation time are halved.',
  mechanics='{"minimumDivineRank":1,"portfolioRelated":true,"waivesRequisiteItemCreationFeat":true,"mustMeetOtherPrerequisites":true,"rankBands":[{"min":1,"max":5,"maximumMarketPriceGp":4500,"artifactsAllowed":false},{"min":6,"max":10,"maximumMarketPriceGp":30000,"artifactsAllowed":false},{"min":11,"max":15,"maximumMarketPriceGp":200000,"artifactsAllowed":false},{"min":16,"max":20,"maximumMarketPriceGp":null,"artifactsAllowed":true}],"normalCostAndTimeUnlessFeat":true,"matchingItemCreationFeat":{"gpCostMultiplier":0.5,"xpCostMultiplier":0.5,"creationTimeMultiplier":0.5},"sourceFidelity":"The rank-16-to-20 row explicitly says no maximum, including artifact. Do not impose the 200,000-gp intermediate-deity ceiling on greater deities."}'
WHERE source_id='dd-3.0'
  AND slug='dd-create-magic-items'
  AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET
  description='Create magic arms and armor, staffs, wands, wondrous items, rings, and scrolls that exceed the normal mortal limits for those item categories.',
  rules_text='Prerequisites: Craft Magic Arms and Armor, Craft Rod, Craft Staff, Craft Wand, Craft Wondrous Item, Forge Ring, and Scribe Scroll. The deity can craft qualifying items beyond the normal Dungeon Master''s Guide limits, such as enhancement bonuses above ordinary caps or staffs containing spells above 9th level. The source refers to the Epic Level Handbook for more information on such items.',
  parameters=json_set(
    COALESCE(parameters,'{}'),
    '$.divineSystem','salient',
    '$.minimumDivineRank',1,
    '$.prerequisitesText','Craft Magic Arms and Armor; Craft Rod; Craft Staff; Craft Wand; Craft Wondrous Item; Forge Ring; Scribe Scroll.',
    '$.requiredFeats',json('["Craft Magic Arms and Armor","Craft Rod","Craft Staff","Craft Wand","Craft Wondrous Item","Forge Ring","Scribe Scroll"]'),
    '$.exceedsNormalItemLimits',json('true'),
    '$.epicLevelHandbookCrossReference',json('true')
  )
WHERE slug='craft-artifact'
  AND owner_user_id IS NULL;
