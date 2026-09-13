-- Epic Level Handbook core character progression.
-- The source tables stop at convenient display points, but their stated patterns continue
-- indefinitely. Mechanics are stored as formulas rather than introducing a level-30 cap.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,is_variant,default_enabled,parent_slug,rules_text,tags,mechanics) AS (VALUES
  ('elh-epic-character-threshold','Epic Character Threshold','5','progression','rule',0,1,NULL,
   'A character becomes an epic character when total character level reaches 21st level or higher.',
   '["epic","character-level","progression"]',
   '{"minimumCharacterLevel":21}'),

  ('elh-advance-base-class-beyond-20','Advance Base Classes Beyond 20th','5-7','progression','rule',0,1,NULL,
   'A base class can advance beyond 20th level using its epic progression. The displayed epic class tables are examples of an indefinitely continuing progression, not maximum class levels.',
   '["epic","class-level","base-class","no-level-cap"]',
   '{"baseClassMaximum":null,"patternsContinueIndefinitely":true}'),

  ('elh-epic-prestige-class-continuation','Epic Prestige Class Continuation','5-7','progression','rule',0,1,NULL,
   'A prestige class with ten levels can advance beyond 10th once the character is epic. Prestige classes shorter than ten levels do not advance beyond their printed maximum by default, though the DM can build a campaign-specific epic progression.',
   '["epic","prestige-class","progression"]',
   '{"defaultMinimumPrintedLevelsForContinuation":10,"requiresEpicCharacter":true,"shorterPrestigeClassContinuationIsVariant":true}'),

  ('elh-epic-save-bonus','Epic Save Bonus','6','progression','rule',0,1,NULL,
   'Base save bonuses stop increasing from class levels after total character level 20. Beginning at 22nd character level, gain a cumulative +1 epic bonus to all saving throws at every even-numbered character level.',
   '["epic","saving-throws","progression"]',
   '{"startsAfterCharacterLevel":20,"formula":"floor((characterLevel-20)/2)","bonusType":"epic","appliesTo":["fort","ref","will"],"countsWithBaseSaveForPrerequisites":true}'),

  ('elh-epic-attack-bonus','Epic Attack Bonus','6','progression','rule',0,1,NULL,
   'Base attack bonus from class levels stops increasing after total character level 20. Beginning at 21st character level, gain a cumulative +1 epic attack bonus at every odd-numbered character level beyond 20. Epic attack bonus counts with base attack bonus for prerequisites and similar rules but never grants extra iterative attacks.',
   '["epic","attack","base-attack-bonus","progression"]',
   '{"startsAtCharacterLevel":21,"formula":"ceil((characterLevel-20)/2)","bonusType":"epic","countsWithBaseAttackForPrerequisites":true,"grantsIterativeAttacks":false}'),

  ('elh-epic-xp-progression','Epic Experience Progression','6-7','progression','rule',0,1,NULL,
   'After the printed experience table, the experience needed for the next character level is the current total plus current character level × 1,000 XP.',
   '["epic","experience","progression","no-level-cap"]',
   '{"recurrence":"xpForNextLevel = xpForCurrentLevel + currentLevel * 1000","knownAnchor":{"level":30,"xp":435000},"patternsContinueIndefinitely":true}'),

  ('elh-epic-class-skill-max-ranks','Epic Class Skill Maximum Ranks','6','skills','rule',0,1,NULL,
   'The maximum ranks in a class skill remain character level + 3 at epic levels.',
   '["epic","skills","ranks"]',
   '{"formula":"characterLevel + 3"}'),

  ('elh-epic-cross-class-skill-max-ranks','Epic Cross-Class Skill Maximum Ranks','6','skills','rule',0,1,NULL,
   'The maximum ranks in a cross-class skill remain one-half the class-skill maximum.',
   '["epic","skills","cross-class","ranks"]',
   '{"formula":"(characterLevel + 3) / 2"}'),

  ('elh-epic-character-feat-progression','Epic Character Feat Progression','6','feats','rule',0,1,NULL,
   'A character gains a general feat at every character level divisible by three, including 21st, 24th, 27th, and so on. At epic level the selected feat may be epic or nonepic if its prerequisites are met.',
   '["epic","feats","character-level","progression"]',
   '{"frequency":3,"firstEpicLevel":21,"selectionMayBeEpic":true,"selectionMayBeNonepic":true}'),

  ('elh-epic-ability-increase-progression','Epic Ability Increase Progression','6','abilities','rule',0,1,NULL,
   'Ability-score increases continue at every character level divisible by four, including 20th, 24th, 28th, and so on.',
   '["epic","ability-scores","character-level","progression"]',
   '{"frequency":4,"increase":1}'),

  ('elh-epic-hit-dice-and-skill-points','Epic Hit Dice and Skill Points','7','progression','rule',0,1,NULL,
   'Characters continue to gain class Hit Dice and class skill points normally when advancing at epic levels.',
   '["epic","hit-dice","skill-points"]',
   '{"continueHitDice":true,"continueSkillPoints":true}'),

  ('elh-epic-scaling-class-features','Scaling Class Features Beyond 20th','7','class-features','rule',0,1,NULL,
   'A class feature whose effect uses class level in a mathematical formula generally continues to use the full class level after 20th unless its epic progression says otherwise.',
   '["epic","class-features","scaling"]',
   '{"formulaBasedClassFeaturesContinue":true}'),

  ('elh-epic-prestige-save-dc-scaling','Epic Prestige-Class Save DC Scaling','7','class-features','rule',0,1,NULL,
   'When a prestige-class feature calculates its saving throw DC from prestige-class level, levels above 10th normally contribute one-half per level rather than one-for-one.',
   '["epic","prestige-class","save-dc","scaling"]',
   '{"fullClassLevels":10,"levelsAbove10Multiplier":0.5}'),

  ('elh-epic-caster-level-continuation','Epic Caster Level Continuation','7','spellcasting','rule',0,1,NULL,
   'Caster level continues to rise with qualifying class levels beyond 20th even though ordinary spells per day stop increasing from the class progression.',
   '["epic","spellcasting","caster-level"]',
   '{"casterLevelContinues":true,"normalClassSpellSlotsStopAfterPrintedProgression":true}'),

  ('elh-epic-spell-slots-after-20','Epic Spell Slots After 20th','7','spellcasting','rule',0,1,NULL,
   'Ordinary class spell slots do not continue to increase merely by taking spellcasting class levels beyond the normal progression. Additional slots above the normal maximum spell level are gained through Improved Spell Capacity and other explicit rules.',
   '["epic","spellcasting","spell-slots","improved-spell-capacity"]',
   '{"automaticSlotProgressionBeyondNormalMaximum":false,"primaryExpansionFeatSlug":"improved-spell-capacity"}'),

  ('elh-epic-companion-progression','Epic Familiar Mount and Servant Progression','7','companions','rule',0,1,NULL,
   'Familiars, special mounts, and fiendish servants continue to improve when their governing master-level formulas increase at epic levels.',
   '["epic","familiar","special-mount","companion"]',
   '{"continueMasterLevelScaling":true}'),

  ('elh-epic-no-table-level-cap','Epic Tables Are Not Level Caps','6','progression','guidance',0,1,NULL,
   'Levels shown in Epic Level Handbook tables are not maximums. Unless a rule states otherwise, identifiable advancement patterns continue beyond the last displayed row.',
   '["epic","no-level-cap","tables","progression"]',
   '{"patternsContinueIndefinitely":true}'),

  ('elh-epic-iterative-attack-cap','Epic Iterative Attack Cap','7','combat','rule',0,1,NULL,
   'Epic attack bonus does not increase base attack bonus and therefore does not grant additional iterative attacks. Class-derived base attack bonus stops increasing after character level 20 for this purpose.',
   '["epic","combat","iterative-attacks","base-attack-bonus"]',
   '{"epicAttackBonusGrantsIteratives":false,"classDerivedBaseAttackStopsAfterCharacterLevel":20}')
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
