-- Heroes of Horror: dread and fear rules.
-- Source: Heroes of Horror, Chapter 4, pp. 59-62. Mechanical text is summarized; source pages remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hoh-3.5','heroes-of-horror-3-5','Heroes of Horror','HoH','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 horror supplement covering dread campaigns, taint, horror character options, magic, and monsters.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,summary,tags,mechanics) AS (VALUES
('hoh-dread-save-dcs','Dread Effect Save DCs','60','horror','guidance',1,0,
 'Set dread-effect saving throw DCs from party level, horror severity, and immediate danger.',
 '["horror","dread","saving-throws"]',
 '{"baseline":"10 + average party level","very_horrific_known_person_modifier":{"min":2,"max":4},"clear_imminent_danger_modifier":{"min":2,"max":4},"notes":"Modifiers are guidance for adjudicating dread effects rather than a universal mandatory save."}'),
('hoh-shock','Shock','60','horror','subsystem',1,0,
 'Sudden horrific revelations can impose short-lived shock conditions, using dazed, stunned, and paralyzed as an increasing severity spectrum.',
 '["horror","dread","shock"]',
 '{"severity":["dazed","stunned","paralyzed"],"typical_save":"Will","typical_duration":"1 round","examples":[{"party_level":12,"dc":24,"failure":"dazed 1 round"},{"party_level":9,"dc":25,"success":"dazed 1 round","failure":"stunned 1 round"}],"fear_aura_variant":{"failure":"stunned","repeat_save":"each round on the creature''s turn","repeat_save_action":"full-round"}}'),
('hoh-weariness','Weariness','60','horror','subsystem',1,0,
 'Prolonged exposure to horror can produce weariness, escalating through fatigue, exhaustion, and staggered conditions.',
 '["horror","dread","weariness"]',
 '{"severity":["fatigued","exhausted","staggered"],"typical_save":"Fortitude","alternate_save":"Will when the situation is primarily mental or emotional","examples":[{"party_level":7,"dc":19,"save":"Fortitude","failure":"fatigued"},{"party_level":9,"dc":27,"save":"Will","success":"fatigued","failure":"exhausted"}]}'),
('hoh-illness-despair','Illness and Despair','60-61','horror','subsystem',1,0,
 'Overwhelming evil, gore, or despair can produce an escalating spectrum of sickness-like conditions.',
 '["horror","dread","illness","despair"]',
 '{"severity":["sickened","nauseated","disabled"],"physical_save":"Fortitude","despair_save":"Will","disabled_note":"A creature disabled by this horror-illness model does not necessarily become dying merely from damage caused by taking a standard action."}'),
('hoh-frightened-alternative','Alternative Frightened Condition','61','fear','rule',1,0,
 'An optional frightened condition keeps a character in the scene while applying stronger penalties instead of compulsory flight.',
 '["fear","frightened","variant"]',
 '{"forced_to_flee":false,"penalty":-4,"penalty_applies_to":["attack rolls","saving throws","skill checks","ability checks"],"distinct_new_fear_effect":"escalates to panicked"}'),
('hoh-escalating-fear','Escalating Fear','61','fear','subsystem',1,0,
 'Distinct fear effects escalate an existing fear state, while repeated exposure to the same spell or effect normally does not.',
 '["fear","escalation","horror"]',
 '{"transitions":[{"current":"shaken","new":"shaken","result":"frightened"},{"current":"shaken","new":"frightened","result":"panicked"},{"current":"frightened","new":"fear effect","result":"panicked"}],"same_effect_normally_escalates":false,"duration_rule":"The stronger state lasts for the duration of the effect that caused the escalation."}'),
('hoh-phobias','Phobias','61','fear','subsystem',1,0,
 'Phobias come in mild, moderate, and severe degrees and trigger fear saves when the character encounters the object of the phobia.',
 '["fear","phobia","horror"]',
 '{"cr_below_1_counts_as":0,"degrees":[{"degree":"mild","save":"Will","dc":"12 + challenge CR","failure":"shaken"},{"degree":"moderate","save":"Will","dc":"14 + challenge CR","failure":"frightened"},{"degree":"severe","save":"Will","dc":"16 + challenge CR","failure":"panicked"}]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'hoh-rule-'||d.slug,'hoh-3.5',d.source_page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       d.category,d.kind,d.is_variant,d.default_enabled,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_rules r WHERE r.slug=d.slug AND r.owner_user_id IS NULL);
