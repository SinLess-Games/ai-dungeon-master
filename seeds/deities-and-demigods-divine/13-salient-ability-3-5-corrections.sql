-- Deities and Demigods: structured official D&D v.3.5 revisions for salient divine abilities.
-- Source: Deities and Demigods D&D v.3.5 Accessory Update, pp. 5-6.
-- The base ability rows preserve concise descriptions; this ordered correction adds exact revised mechanics
-- without pretending those mechanics were printed in the 2002 3.0 book.

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"spaceReach":"Use revised Player''s Handbook size/space/reach values in place of Deities and Demigods Table 2-2."}'))
WHERE slug='alter-size' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"replaces":["uncanny dodge","improved uncanny dodge"]}'))
WHERE slug='battlesense' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"divineCourage":{"saveBonusAgainstCharmAndFear":8,"attackBonus":8,"weaponDamageBonus":8,"bonusType":"morale"},"inspireHeroics":{"savingThrowBonus":8,"armorClassBonus":8,"armorClassBonusType":"dodge"}}'))
WHERE slug='divine-bard' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"effect":"Functions according to the revised haste spell rather than the obsolete extra-partial-action haste rules."}'))
WHERE slug='divine-celerity' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"wildShapeForms":["animal","magical beast","plant"],"minimumSize":"Fine","maximumSize":"Colossal"}'))
WHERE slug='divine-druid' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"despair":{"model":"improved crushing despair","attackPenalty":-4,"damagePenalty":-4,"savePenalty":-4,"checkPenalty":-4}}'))
WHERE slug='divine-inspiration' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"secondBenefitRequiresFeat":"Deflect Arrows"}'))
WHERE slug='divine-monk' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"smiteEvilUsesPerDay":10}'))
WHERE slug='divine-paladin' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"replaces3_0ExtraPartialAction":true,"fullAttackExtraAttack":{"count":1,"attackBonus":"full attack bonus","trigger":"whenever the deity uses the full attack action"}}'))
WHERE slug='divine-rage' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"saveDcIncrease":"one-half divine rank","replaces":"full divine-rank increase"}'))
WHERE slug='divine-spell-focus' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"stacksWith":"Greater Weapon Focus"}'))
WHERE slug='divine-weapon-focus' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"stacksWith":"Greater Weapon Specialization"}'))
WHERE slug='divine-weapon-specialization' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"damageReductionIncrease":5,"addsOpposedAlignmentBypass":true,"alignmentChoice":"Choose one alignment opposed to the deity''s alignment; for a deity opposed on both axes, choose either applicable opposed alignment.","maximumSelections":1,"example":"A rank-15 lawful-good deity with base DR 25/epic may become DR 30/epic and chaotic or DR 30/epic and evil."}'))
WHERE slug='increased-damage-reduction' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"whenNoExistingResistance":"Resistance equals divine rank, not 20 + divine rank.","whenAlreadyResistant":{"increase":10}}'))
WHERE slug='increased-energy-resistance' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"chosenWeaponAttacksCountAs":"adamantine","purposes":["bypassing damage reduction","bypassing hardness"]}'))
WHERE slug='irresistible-blows' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"effect":"constant greater arcane sight"}'))
WHERE slug='see-magic' AND owner_user_id IS NULL;

UPDATE dnd35_special_abilities
SET parameters = json_set(COALESCE(parameters,'{}'),
  '$.revision3_5', json('{"rulesReference":"Use the revised undead qualities in the Monster Manual glossary."}'))
WHERE slug='undead-qualities' AND owner_user_id IS NULL;
