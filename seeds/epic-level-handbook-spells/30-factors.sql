-- Epic Level Handbook Tables 2-2 through 2-4 (pp. 91-92).
-- These rows provide machine-readable spell-development math without flattening source footnotes.

WITH desired(slug,name,page,rules_text,mechanics) AS (VALUES
  ('elh-epic-spell-factor-school','Epic Spell Factor: Spell School','91',
   'A seed from the caster''s specialist school reduces the Spellcraft DC by 5; a seed from a banned school increases it by 15.',
   '{"factors":[{"condition":"seed within specialist school","dcModifier":-5},{"condition":"seed within banned school","dcModifier":15}]}'),
  ('elh-epic-spell-factor-casting-time','Epic Spell Factor: Casting Time','91',
   'Casting time can be shortened by factors. Reducing casting time by one round adds +2 DC per round to a minimum of 1 round; a 1-action casting time adds +20; a quickened epic spell adds +28 and remains limited to one quickened action per round; a contingent trigger adds +25.',
   '{"factors":[{"operation":"reduce-by-round","minimum":"1 round","dcModifierPerRound":2},{"result":"1 action","dcModifier":20},{"result":"quickened","dcModifier":28,"limit":"one quickened action per round"},{"result":"contingent on specific trigger","dcModifier":25,"usesEpicSlotWhileContingent":true}]}'),
  ('elh-epic-spell-factor-components','Epic Spell Factor: Components','91',
   'Removing a verbal component adds +2 DC; removing a somatic component adds +2 DC.',
   '{"factors":[{"remove":"verbal","dcModifier":2},{"remove":"somatic","dcModifier":2}]}'),
  ('elh-epic-spell-factor-duration','Epic Spell Factor: Duration','91',
   'Increasing duration by 100% adds +2 DC. Making an eligible duration permanent multiplies the DC by 5 after all other epic spell factors but before mitigating factors. Making a spell dismissible when it is not already dismissible adds +2 DC.',
   '{"factors":[{"operation":"increase duration by 100%","dcModifier":2,"repeatable":true},{"operation":"make permanent","multiplier":5,"applicationOrder":"after all additive epic spell factors and before mitigating factors"},{"operation":"make dismissible","dcModifier":2}],"restriction":"seeds already instantaneous or permanent cannot have duration increased"}'),
  ('elh-epic-spell-factor-range','Epic Spell Factor: Range','91',
   'Increasing range by 100% adds +2 DC and can be applied repeatedly unless the source says otherwise.',
   '{"factors":[{"operation":"increase range by 100%","dcModifier":2,"repeatable":true}]}'),
  ('elh-epic-spell-factor-target','Epic Spell Factor: Target','91',
   'Target factors add extra targets or convert among target, area, touch, and ray forms. Converting a target to an area also requires paying for an area option.',
   '{"factors":[{"operation":"add extra target within 300 ft","dcModifier":10},{"operation":"target to area","dcModifier":10,"requiresAreaFactor":true},{"operation":"personal to area","dcModifier":15,"requiresAreaFactor":true},{"operation":"target to touch or ray","range":"300 ft","dcModifier":4},{"operation":"touch or ranged touch to target","dcModifier":4}],"damageSaveConversion":"A damaging targeted/area seed changed to touch or ranged attack uses an attack roll instead of a save; nondamaging effects still allow their save. A damaging touch/ranged-touch seed changed to target uses a save instead of an attack roll, with half damage on a successful save; DM determines the save type."}'),
  ('elh-epic-spell-factor-area','Epic Spell Factor: Area','91',
   'Area shape changes add the modifiers printed in Table 2-2; area can also be converted to target, touch, or ray. Increasing area by 100% adds +4 DC.',
   '{"factors":[{"area":"bolt 5 ft x 300 ft or 10 ft x 150 ft","dcModifier":2},{"area":"cylinder 10-ft radius, 30 ft high","dcModifier":2},{"area":"40-ft cone","dcModifier":2},{"area":"four 10-ft cubes","dcModifier":2},{"area":"20-ft radius","dcModifier":2},{"operation":"area to target","dcModifier":4},{"operation":"area to touch or ray","range":"close","dcModifier":4},{"operation":"increase area by 100%","dcModifier":4,"repeatable":true}]}'),
  ('elh-epic-spell-factor-saving-throw','Epic Spell Factor: Saving Throw','91',
   'Each +1 increase to an epic spell''s saving throw DC adds +2 to the Spellcraft DC.',
   '{"factors":[{"operation":"increase saving throw DC by +1","dcModifier":2,"repeatable":true}]}'),
  ('elh-epic-spell-factor-spell-resistance','Epic Spell Factor: Spell Resistance and Dispel','91',
   'Each +1 bonus on the caster-level check to overcome spell resistance adds +2 DC. Each +1 bonus on a caster-level check to beat a foe''s dispel effect also adds +2 DC.',
   '{"factors":[{"operation":"+1 caster-level check vs spell resistance","dcModifier":2,"repeatable":true},{"operation":"+1 caster-level check vs dispel effect","dcModifier":2,"repeatable":true}]}'),
  ('elh-epic-spell-factor-other','Epic Spell Factor: Other','91',
   'Recording an epic spell on a stone tablet doubles its Spellcraft DC. Increasing a damage die by one step, to a maximum of d20, adds +10 DC.',
   '{"factors":[{"operation":"record on stone tablet or equally hard substance","multiplier":2,"consumedWhenLearned":true},{"operation":"increase damage die one step","maximum":"d20","dcModifier":10,"repeatable":true}]}'),

  ('elh-epic-spell-mitigation','Epic Spell Mitigating Factors','91-92',
   'Mitigating factors are applied only after all epic spell factors have been accounted for. Backlash, XP expenditure, longer casting time, ritual participants, smaller damage dice, and changing an effect to personal can reduce the final Spellcraft DC.',
   '{"applicationOrder":"after all epic spell factors, including factor multipliers","factors":[{"operation":"backlash 1d6 damage","dcModifier":-1,"maximumDiceFormula":"caster HD * 2"},{"operation":"burn 100 XP during casting","dcModifier":-1,"maximumXp":20000},{"operation":"increase casting time by 1 minute","dcModifier":-2,"maximumMinutes":10},{"operation":"increase casting time by 1 day","dcModifier":-2,"maximumDays":100,"requiresFirstUsingTenMinutes":true},{"operation":"additional participants","dcModifier":"see ritual contribution table"},{"operation":"decrease damage die one step","minimum":"d4","dcModifier":-5},{"operation":"target/touch/area to personal","dcModifier":-2}]}'),
  ('elh-epic-spell-backlash','Epic Spell Backlash','91-92',
   'The caster cannot avoid or become immune to backlash damage. For an epic spell whose duration is longer than instantaneous, backlash damage is taken each round. Death from backlash always imposes a level cost on return to life; effects that normally cost one level when restoring life cost two levels for a caster killed by backlash.',
   '{"avoidable":false,"immunityPossible":false,"longerThanInstantaneous":"backlash damage per round","deathReturnToLife":{"minimumLevelCost":1,"effectsNormallyCostingOneLevelCost":2}}'),
  ('elh-epic-spell-casting-time-mitigation','Epic Spell Casting-Time Mitigation','91-92',
   'To reduce DC by extending casting time, the caster must first use up the maximum 10 minutes, for -20 DC total, before adding days at -2 DC each to a maximum of 100 days.',
   '{"minutes":{"dcPerMinute":-2,"maximum":10,"maximumDcReduction":-20},"days":{"dcPerDay":-2,"maximum":100,"prerequisite":"first apply full 10-minute mitigation"}}'),
  ('elh-epic-spell-ritual-contributions','Epic Spell Ritual Contributions','92',
   'Each additional ritual participant contributes exactly one spell slot. Arcane and divine slots are treated the same; only slot level determines the reduction. All participant reductions stack.',
   '{"oneSlotPerParticipant":true,"arcaneDivineEquivalent":true,"reductions":{"1":-1,"2":-3,"3":-5,"4":-7,"5":-9,"6":-11,"7":-13,"8":-15,"9":-17,"epic":-19},"stack":true,"exactParticipantCountAndSlotsRequired":true,"failureIfMissingRequiredContribution":true}'),
  ('elh-epic-spell-ritual-disruption','Epic Spell Ritual Participant Disruption','92',
   'If a ritual epic spell takes longer than 1 action, every participant must remain as though casting for the same duration. A participant damaged while contributing makes a Concentration check as though casting a spell of the contributed slot level. If disrupted, the spell may continue, but that participant''s DC reduction is lost.',
   '{"appliesWhenCastingTimeLongerThan":"1 action","participantDurationMatchesCaster":true,"damageRequiresConcentration":true,"concentrationSpellLevel":"contributed slot level","onDisruption":"remove that participant DC reduction; epic spell is not automatically ruined"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,'',d.rules_text,0,NULL,1,
       'epic-spellcasting','rule',0,1,'elh-epic-spell-seed-development',NULL,
       '["epic","spellcasting","development","factor"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);