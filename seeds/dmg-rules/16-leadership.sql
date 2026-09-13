-- Dungeon Master's Guide v3.5 Leadership rules.
-- Source: Dungeon Master's Guide, Chapter 4, pp. 104-106. Mechanical text is summarized; the supplied source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 core Dungeon Master''s Guide, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,summary,tags,mechanics) AS (VALUES
  ('dmg-leadership','Leadership','106','leadership','subsystem',0,1,
   'Leadership uses character level plus Charisma modifier and situational modifiers to determine a cohort limit and follower roster; the printed table provides results through Leadership score 25.',
   '["leadership","cohort","followers","reputation","feat"]',
   '{"minimum_character_level":6,"base_score":"character level + Charisma modifier","cohort_character_level_cap_offset":-2,"reputation_modifiers":{"great_renown":2,"fairness_and_generosity":1,"special_power":1,"failure":-1,"aloofness":-1,"cruelty":-2},"cohort_modifiers":{"has_familiar_special_mount_or_animal_companion":-2,"different_alignment":-1,"caused_cohort_death_each":-2},"follower_modifiers":{"stronghold_base_guildhouse_or_similar":2,"moves_around_a_lot":-1,"caused_death_of_other_followers":-1},"table":[{"score_max":1,"cohort":null,"followers":[0,0,0,0,0,0]},{"score":2,"cohort":1,"followers":[0,0,0,0,0,0]},{"score":3,"cohort":2,"followers":[0,0,0,0,0,0]},{"score":4,"cohort":3,"followers":[0,0,0,0,0,0]},{"score":5,"cohort":3,"followers":[0,0,0,0,0,0]},{"score":6,"cohort":4,"followers":[0,0,0,0,0,0]},{"score":7,"cohort":5,"followers":[0,0,0,0,0,0]},{"score":8,"cohort":5,"followers":[0,0,0,0,0,0]},{"score":9,"cohort":6,"followers":[0,0,0,0,0,0]},{"score":10,"cohort":7,"followers":[5,0,0,0,0,0]},{"score":11,"cohort":7,"followers":[6,0,0,0,0,0]},{"score":12,"cohort":8,"followers":[8,0,0,0,0,0]},{"score":13,"cohort":9,"followers":[10,1,0,0,0,0]},{"score":14,"cohort":10,"followers":[15,1,0,0,0,0]},{"score":15,"cohort":10,"followers":[20,2,1,0,0,0]},{"score":16,"cohort":11,"followers":[25,2,1,0,0,0]},{"score":17,"cohort":12,"followers":[30,3,1,1,0,0]},{"score":18,"cohort":12,"followers":[35,3,1,1,0,0]},{"score":19,"cohort":13,"followers":[40,4,2,1,1,0]},{"score":20,"cohort":14,"followers":[50,5,3,2,1,0]},{"score":21,"cohort":15,"followers":[60,6,3,2,1,1]},{"score":22,"cohort":15,"followers":[75,7,4,2,2,1]},{"score":23,"cohort":16,"followers":[90,9,5,3,2,1]},{"score":24,"cohort":17,"followers":[110,11,6,3,2,1]},{"score_min":25,"cohort":17,"followers":[135,13,7,4,2,2]}],"follower_level_columns":[1,2,3,4,5,6]}'),
  ('dmg-cohort-experience','Cohort Experience','104-105','leadership','rule',0,1,
   'A cohort earns a proportional share of the associated leader''s XP based on cohort level divided by leader level and cannot advance to the leader''s level.',
   '["leadership","cohort","experience"]',
   '{"xp_formula":"leader XP award * cohort level / leader level","maximum_advancement":"one XP short of the level that would make the cohort only one level below the leader"}'),
  ('dmg-followers','Followers','105-106','leadership','rule',0,1,
   'Followers normally do not earn experience or advance by earning XP; the leader consults Leadership again when gaining levels to determine the current follower roster.',
   '["leadership","followers","experience"]',
   '{"followers_gain_xp":false,"followers_gain_levels_from_xp":false,"refresh_trigger":"leader gains a level","treasure_share_required":false}'),
  ('dmg-replacing-cohorts-followers','Replacing Cohorts and Followers','105','leadership','procedure',0,1,
   'Lost cohorts or followers can normally be replaced according to the current Leadership score, with recruitment taking longer when the leader caused their deaths.',
   '["leadership","cohort","followers","recruitment"]',
   '{"normal_replacement_time":"1d4 months","leader_caused_deaths":"up to 1 year","failure_reputation_penalty_applies":true}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.source_page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       d.category,d.kind,d.is_variant,d.default_enabled,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.slug=d.slug AND r.owner_user_id IS NULL);
