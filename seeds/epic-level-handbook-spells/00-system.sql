-- Epic Level Handbook Chapter 2: Epic Spells.
-- Epic spells are a separate subsystem rather than ordinary 10th+ spell slots.
-- The normal class-spellcasting schema intentionally remains capped at spell levels 0-9.

WITH desired(slug,name,page,kind,rules_text,tags,mechanics) AS (VALUES
 ('elh-epic-spell-acquisition','Acquiring Epic Spells','71-72','procedure',
  'A caster with Epic Spellcasting can acquire epic spells. Epic spell use is a two-step process: first develop the spell, then cast the developed spell. The DM retains final authority over whether a proposed epic spell is available.',
  '["epic","spellcasting","development","epic-spells"]',
  '{"requiredFeatSlug":"epic-spellcasting","steps":["develop","cast"],"dmApproval":true}'),
 ('elh-epic-spell-development','Epic Spell Development','72','procedure',
  'Every epic spell must be developed before it can be cast. A spell''s Spellcraft DC determines the difficulty of development and later casting; printed epic spells specify their own development costs, time, and XP.',
  '["epic","spellcasting","spellcraft","development"]',
  '{"mustDevelopBeforeCasting":true,"difficultyField":"spellcraftDc","printedSpellDevelopmentCostsAreSourceDefined":true}'),
 ('elh-epic-spell-slots','Epic Spell Slots','72','rule',
  'Open epic spell slots per day equal one-tenth the ranks in the Knowledge skill appropriate to the caster, rounded down. Arcane casting uses Knowledge (arcana); divine casting uses Knowledge (religion) or Knowledge (nature). Qualifying for more than one tradition gives cumulative allotments.',
  '["epic","spellcasting","spell-slots","knowledge"]',
  '{"slotsFormula":"floor(knowledgeRanks / 10)","arcaneSkill":"knowledge-arcana","divineSkills":["knowledge-religion","knowledge-nature"],"multipleQualifiedPoolsAreCumulative":true,"unusedSlotsRemainAvailableUntilUsed":true}'),
 ('elh-epic-spell-casting-check','Casting an Epic Spell','72-73','rule',
  'Casting a developed epic spell requires a Spellcraft check against that spell''s Spellcraft DC.',
  '["epic","spellcasting","spellcraft","check"]',
  '{"check":"spellcraft","dc":"epicSpell.spellcraftDc","take10Allowed":true,"take20Allowed":false}'),
 ('elh-epic-spell-effective-level','Epic Spell Effective Level','73','rule',
  'Epic spells have no fixed spell level, but are treated as 10th-level spells when a spell level is required for Concentration, spell resistance, or similar determinations.',
  '["epic","spellcasting","spell-level"]',
  '{"fixedSpellLevel":null,"effectiveLevelForRules":10,"contexts":["concentration","spell-resistance","other-level-dependent-determinations"]}'),
 ('elh-epic-spell-saving-throw','Epic Spell Saving Throw','73','rule',
  'The base saving throw DC of an epic spell is 20 plus the caster''s relevant spellcasting ability modifier, subject to development factors that alter the DC.',
  '["epic","spellcasting","saving-throw"]',
  '{"baseSaveDcFormula":"20 + relevant ability modifier","developmentCanModify":true}'),
 ('elh-epic-spell-metamagic','Metamagic and Epic Spells','73','rule',
  'Normal metamagic and feats that manipulate ordinary spells do not modify epic spells unless a rule explicitly says otherwise.',
  '["epic","spellcasting","metamagic"]',
  '{"normalMetamagicApplies":false}'),
 ('elh-epic-spell-magic-items','Epic Spells in Magic Items','73','rule',
  'Characters cannot create ordinary magic items that cast epic spells. Only artifact-level magic can potentially contain epic spell effects.',
  '["epic","spellcasting","magic-items","artifacts"]',
  '{"normalCraftedItemsCanContainEpicSpells":false,"artifactExceptionPossible":true}'),
 ('elh-epic-spell-dispelling','Dispelling Epic Spells','73','rule',
  'Epic and nonepic spells use the normal dispel relationship. An epic spell does not gain special immunity to dispelling merely because it is epic.',
  '["epic","spellcasting","dispel"]',
  '{"normalDispelRulesApply":true,"dispelDcFormula":"11 + spellcaster level"}'),
 ('elh-epic-spell-antimagic','Epic Spells and Antimagic Field','73','rule',
  'Antimagic field does not automatically suppress an epic spell. Resolve a dispel check as a 20th-level caster against DC 11 + the epic spell caster level; success suppresses the epic spell while failure leaves it functioning.',
  '["epic","spellcasting","antimagic"]',
  '{"automaticSuppression":false,"antimagicDispelBonus":20,"dcFormula":"11 + epic spell caster level"}'),
 ('elh-epic-spell-seed-development','Developing Epic Spells from Seeds','88-92','subsystem',
  'A custom epic spell begins with one or more epic spell seeds. The designer applies seed effects, factors, and mitigating factors to determine the final Spellcraft DC and other spell parameters.',
  '["epic","spellcasting","seeds","factors","development"]',
  '{"components":["seed","factor","mitigating-factor"],"result":"final Spellcraft DC","sourceSeedPages":"92-102"}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'elh-rule-'||d.slug,'elh-3.0',d.page,d.slug,d.name,'',d.rules_text,0,NULL,1,
       'epic-spellcasting',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);