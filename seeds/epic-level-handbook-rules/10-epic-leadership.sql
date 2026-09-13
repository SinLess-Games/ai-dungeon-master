-- Epic Level Handbook Table 1-33: Epic Leadership.
-- This is the printed ELH subsystem. Endless Codex house-rule extensions seed later and remain explicitly separate.

WITH desired(slug,name,page,category,kind,is_variant,default_enabled,parent_slug,rules_text,tags,mechanics) AS (VALUES
  ('elh-epic-leadership','Epic Leadership','36-37','leadership','subsystem',0,1,NULL,
   'Epic Leadership extends the Leadership subsystem for scores of 25 and higher. A cohort must remain lower level than the leader, while follower counts and maximum cohort level scale beyond score 40 by the source formulas.',
   '["epic","leadership","cohort","followers"]',
   '{"requiresFeat":"elh-feat-epic-leadership","leadershipScoreFormula":"character level + Charisma modifier + applicable Leadership modifiers","cohortMustBeLowerLevelThanLeader":true,"tableMinScore":25,"tableMaxScore":40,"beyond40":{"cohortLevelIncrease":"+1 per 2 Leadership points above 40","firstLevelFollowersIncrease":"+100 per Leadership point above 40","secondLevelFollowers":"ceil(firstLevelFollowers / 10)","higherLevelFollowers":"ceil(previousFollowerLevel / 2), except fractions below 1 become 0"}}'),
  ('elh-epic-leadership-feat-gate','Epic Leadership Feat Gate','54','leadership','rule',0,1,'elh-epic-leadership',
   'The Epic Leadership feat requires Charisma 25, Leadership, and Leadership score 25. Without the feat, the normal Dungeon Master''s Guide Leadership table remains the governing table.',
   '["epic","leadership","feat","prerequisite"]',
   '{"featSlug":"epic-leadership","prerequisites":{"charisma":25,"feat":"leadership","leadershipScore":25},"normalTableSource":"Dungeon Master''s Guide"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,'',d.rules_text,0,NULL,1,
       d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

-- Printed Table 1-33 values, scores 25-40. A null follower count represents the printed dash (zero followers at that level).
WITH rows(score,cohort_level,l1,l2,l3,l4,l5,l6,l7,l8,l9,l10) AS (VALUES
  (25,17,135,13,7,4,2,2,1,NULL,NULL,NULL),
  (26,18,160,16,8,4,2,2,1,NULL,NULL,NULL),
  (27,18,190,19,10,5,3,2,1,NULL,NULL,NULL),
  (28,19,220,22,11,6,3,2,1,NULL,NULL,NULL),
  (29,19,260,26,13,7,4,2,1,NULL,NULL,NULL),
  (30,20,300,30,15,8,4,2,1,NULL,NULL,NULL),
  (31,20,350,35,18,9,5,3,2,1,NULL,NULL),
  (32,21,400,40,20,10,5,3,2,1,NULL,NULL),
  (33,21,460,46,23,12,6,3,2,1,NULL,NULL),
  (34,22,520,52,26,13,6,3,2,1,NULL,NULL),
  (35,22,590,59,30,15,8,4,2,1,NULL,NULL),
  (36,23,660,66,33,17,9,5,3,2,1,NULL),
  (37,23,740,74,37,19,10,5,3,2,1,NULL),
  (38,24,820,82,41,21,11,6,3,2,1,NULL),
  (39,24,910,91,46,23,12,6,3,2,1,NULL),
  (40,25,1000,100,50,25,13,7,4,2,1,NULL)
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'elh-rule-epic-leadership-score-'||r.score,
  'elh-3.0','37','elh-epic-leadership-score-'||r.score,
  'Epic Leadership Score '||r.score,'','Printed Table 1-33 roster for Leadership score '||r.score||'.',0,NULL,1,
  'leadership','table',0,1,'elh-epic-leadership',NULL,
  '["epic","leadership","table-1-33"]',
  json_object(
    'leadershipScore',r.score,
    'maximumCohortLevel',r.cohort_level,
    'followers',json_object(
      '1',coalesce(r.l1,0),'2',coalesce(r.l2,0),'3',coalesce(r.l3,0),'4',coalesce(r.l4,0),'5',coalesce(r.l5,0),
      '6',coalesce(r.l6,0),'7',coalesce(r.l7,0),'8',coalesce(r.l8,0),'9',coalesce(r.l9,0),'10',coalesce(r.l10,0)
    )
  )
FROM rows r
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules x
  WHERE x.source_id='elh-3.0' AND x.slug='elh-epic-leadership-score-'||r.score AND x.owner_user_id IS NULL
);