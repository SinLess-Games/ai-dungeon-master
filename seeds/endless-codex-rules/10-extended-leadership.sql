-- The Endless Codex built-in Leadership extension.
-- This is a house-rule extension of the DMG Leadership subsystem, not a claim that scores above the printed DMG table are core DMG rules.
-- It preserves the user's formula-generated fractional follower counts and extends the roster through 11th-level followers and Leadership score 313.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('endless-codex-house-rules','endless-codex-house-rules','The Endless Codex House Rules','EC-HR',
        'SinLess Games','dnd','3.5','Built-in Endless Codex campaign variants and deterministic extensions to source-backed D&D 3.5 rules.',NULL,0,1,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('endless-codex-extended-leadership','Extended Leadership','Leadership extension','leadership','subsystem',1,1,
   'dmg-leadership','dmg-leadership',
   'Extends the DMG Leadership progression beyond score 25 through score 313, using the established high-score progression and retaining raw fractional follower counts instead of rounding them away. Followers are extended through 11th level.',
   '["leadership","cohort","followers","house-rule","epic","formula"]',
   '{"extends_rule":"dmg-leadership","score":{"minimum_extended":26,"maximum":313,"base_formula":"character level + Charisma modifier + applicable Leadership modifiers"},"requirements":{"leadership_feat":true,"epic_leadership_feat_required":false},"cohort":{"leader_level_cap_offset":-2,"score_40_table_max":25,"above_40_formula":"25 + floor((leadership_score - 40) / 2)","effective_max_formula":"min(table_or_formula_cohort_level, leader_level - 2)","improved_cohort_override":{"source":"Heroes of Battle","leader_level_cap_offset":-1}},"followers":{"levels":[1,2,3,4,5,6,7,8,9,10,11],"preserve_fractional_counts":true,"rounding":"none","score_26_to_40_anchor":[{"score":26,"cohort":18,"followers":[160,16,8,4,2,2,1,0,0,0,0]},{"score":27,"cohort":18,"followers":[190,19,10,5,3,2,1,0,0,0,0]},{"score":28,"cohort":19,"followers":[220,22,11,6,3,2,1,0,0,0,0]},{"score":29,"cohort":19,"followers":[260,26,13,7,4,2,1,0,0,0,0]},{"score":30,"cohort":20,"followers":[300,30,15,8,4,2,1,0,0,0,0]},{"score":31,"cohort":20,"followers":[350,35,18,9,5,3,2,1,0,0,0]},{"score":32,"cohort":21,"followers":[400,40,20,10,5,3,2,1,0,0,0]},{"score":33,"cohort":21,"followers":[460,46,23,12,6,3,2,1,0,0,0]},{"score":34,"cohort":22,"followers":[520,52,26,13,6,3,2,1,0,0,0]},{"score":35,"cohort":22,"followers":[590,59,30,15,8,4,2,1,0,0,0]},{"score":36,"cohort":23,"followers":[660,66,33,17,9,5,3,2,1,0,0]},{"score":37,"cohort":23,"followers":[740,74,37,19,10,5,3,2,1,0,0]},{"score":38,"cohort":24,"followers":[820,82,41,21,11,6,3,2,1,0,0]},{"score":39,"cohort":24,"followers":[910,91,46,23,12,6,3,2,1,0,0]},{"score":40,"cohort":25,"followers":[1000,100,50,25,13,7,4,2,1,0,0]}],"above_40":{"first_level":"1000 + 100 * (leadership_score - 40)","second_level":"first_level / 10","successive_levels":"previous_level / 2","through_follower_level":11,"apply_from_score":41},"score_313_example":{"cohort_table_max":161,"followers":[28300,2830,1415,707.5,353.75,176.875,88.4375,44.21875,22.109375,11.0546875,5.52734375]},"extra_followers":{"source":"Heroes of Battle","multiplier":2,"applies_after_calculation":true}}}'),
  ('endless-codex-leadership-fraction-semantics','Fractional Leadership Followers','Leadership extension','leadership','guidance',1,1,
   'endless-codex-extended-leadership',NULL,
   'Fractional follower values are retained as deterministic table math. A consumer that needs discrete NPC headcounts must apply an explicit campaign-level materialization policy rather than silently rounding the rule result.',
   '["leadership","followers","fractional","house-rule"]',
   '{"stored_result":"decimal","implicit_rounding":false,"materialization_policy_required_for_discrete_npcs":true,"recommended_default_policy":"accumulate fractional entitlement until it reaches a whole follower"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'ec-rule-'||d.slug,'endless-codex-house-rules',d.source_page,d.slug,d.name,d.summary,d.summary,1,NULL,1,
       d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.source_id='endless-codex-house-rules' AND r.slug=d.slug AND r.owner_user_id IS NULL);
