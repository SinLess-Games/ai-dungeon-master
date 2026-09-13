-- Deities and Demigods feat catalog normalized for the revised 3.5 ruleset.
-- Feats explicitly superseded by the official 3.5 accessory update are intentionally
-- not duplicated here; those substitutions are recorded in 20-revision-rules.sql.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
   'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL),
  ('dd-3.5-update','deities-and-demigods-3-5-update','Deities and Demigods - D&D v.3.5 Accessory Update','DD 3.5 Update','Wizards of the Coast','dnd','3.5',
   'Official revision notes that update Deities and Demigods to the revised 3.5 core rules.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,description,rules_text,repeatable,choice_kind,repeatability_text,normal_text,special_text) AS (VALUES
  ('blindsight-5-ft-radius','Blindsight, 5-ft. Radius','49','Detect nearby opponents without relying on sight.','Detect the location of opponents within 5 feet despite invisibility or darkness; this limited blindsight does not discern incorporeal creatures.',0,'none',NULL,NULL,NULL),
  ('disguise-spell','Disguise Spell','50','Hide spellcasting inside a performance.','A disguised spell folds verbal and somatic components into bardic performance so observers normally cannot identify the casting with Spellcraft; it uses a slot one level higher.',0,'none',NULL,NULL,NULL),
  ('divine-might','Divine Might','50','Spend turning power to increase weapon damage.','Spend one turn or rebuke undead attempt to add Charisma modifier to weapon damage for a number of rounds equal to Charisma modifier; supernatural.',0,'none',NULL,NULL,NULL),
  ('divine-vengeance','Divine Vengeance','50','Spend turning power to harm undead in melee.','Spend one turn undead attempt to add 2d6 sacred damage to successful melee attacks against undead through the end of the next action; supernatural.',0,'none',NULL,NULL,NULL),
  ('energy-substitution','Energy Substitution','50','Change a spell’s energy damage to a chosen energy type.','Choose acid, cold, electricity, fire, or sonic. An eligible energy spell may deal the chosen energy type instead without increasing its slot level.',1,'other','May be selected multiple times; each selection chooses a different energy type.',NULL,NULL),
  ('extra-music','Extra Music','50','Gain additional bardic music uses.','Gain four additional bardic music uses per day.',1,'none','Each additional selection grants four more daily bardic music uses.',NULL,NULL),
  ('eyes-in-the-back-of-your-head','Eyes in the Back of Your Head','50','Reduce the normal advantage gained by flankers.','Flanking attackers do not gain the usual +2 attack bonus against you; the benefit does not apply when you are denied your Dexterity bonus to AC.',0,'none',NULL,NULL,NULL),
  ('fleet-of-foot','Fleet of Foot','50','Turn while running or charging.','While running or charging, make one direction change of up to 90 degrees; unavailable in medium or heavy armor or while carrying more than a light load.',0,'none',NULL,'Normally a run or charge must follow a straight line.',NULL),
  ('greater-multiweapon-fighting','Greater Multiweapon Fighting','50','Gain a third attack with each extra weapon when fighting with three or more hands.','With each extra weapon, gain a second attack at -5 and a third at -10 in addition to the normal extra-weapon attack.',0,'none',NULL,NULL,'This is the multiarmed counterpart of Greater Two-Weapon Fighting.'),
  ('hold-the-line','Hold the Line','51','Strike a charging opponent before the charge lands.','Make an attack of opportunity against an opponent that charges you, resolving the attack of opportunity immediately before the charge attack.',0,'none',NULL,NULL,NULL),
  ('improved-multiweapon-fighting','Improved Multiweapon Fighting','50-51','Gain a second attack with each extra weapon when fighting with three or more hands.','With each extra weapon, gain a second attack at -5 in addition to the normal extra-weapon attack.',0,'none',NULL,NULL,'This is the multiarmed counterpart of Improved Two-Weapon Fighting.'),
  ('jack-of-all-trades','Jack of All Trades','51','Attempt skills that normally require training.','You may use trained-only skills untrained.',0,'none',NULL,NULL,NULL),
  ('knock-down','Knock-Down','51','Trip foes after powerful melee hits.','Whenever you deal at least 10 points of melee damage to an opponent, make a trip attempt against that target as a free action.',0,'none',NULL,NULL,NULL),
  ('persistent-spell','Persistent Spell','51','Extend an eligible spell to a full day.','An eligible personal-range or fixed-range spell lasts 24 hours; concentration is still required when normally necessary. Uses a slot four levels higher.',0,'none',NULL,NULL,NULL),
  ('plant-control','Plant Control','51','Rebuke and command plant creatures.','Rebuke or command plants as an evil cleric rebukes undead, using highest caster level as the effective turning level; commanding requires communication through speak with plants. Uses per day equal 3 + Charisma modifier.',0,'none',NULL,NULL,NULL),
  ('plant-defiance','Plant Defiance','51','Turn plant creatures.','Turn, but do not destroy, plants as a good cleric turns undead, using highest caster level as the effective turning level. Uses per day equal 3 + Charisma modifier.',0,'none',NULL,NULL,NULL),
  ('power-critical','Power Critical','51','Declare a daily automatic critical threat with a chosen weapon.','Once per day before an attack roll with the selected weapon, declare that melee attack an automatic threat; a successful attack must still confirm the critical.',1,'weapon','May be selected multiple times, each time for a different weapon.',NULL,'May be selected as a fighter bonus feat.'),
  ('reach-spell','Reach Spell','51','Cast touch spells at short range.','An eligible touch spell can be delivered at up to 30 feet as a ray requiring a ranged touch attack. Uses a slot two levels higher.',0,'none',NULL,NULL,NULL),
  ('repeat-spell','Repeat Spell','51','Cause a spell to repeat at the start of the next round.','The spell is automatically cast again from the original location at the beginning of your next round; targeted spells retarget the original target if it remains within the allowed displacement. Uses a slot three levels higher and cannot modify touch-range spells.',0,'none',NULL,NULL,NULL),
  ('sacred-spell','Sacred Spell','51','Convert part of a divine spell’s damage into sacred divine power.','Half the damage of a damaging divine spell becomes direct divine-power damage rather than its normal energy type. Uses a slot two levels higher.',0,'none',NULL,NULL,NULL),
  ('sharp-shooting','Sharp-Shooting','52','Improve ranged attacks against partially covered targets.','Gain +2 on ranged attack rolls against targets with non-total cover; no benefit against targets with no cover or total cover.',0,'none',NULL,NULL,NULL),
  ('subdual-substitution','Subdual Substitution','52','Convert an energy spell to nonlethal damage.','An eligible acid, cold, electricity, fire, or sonic spell deals nonlethal damage instead of its normal energy damage without increasing slot level.',0,'none',NULL,NULL,NULL),
  ('superior-expertise','Superior Expertise','52','Use Combat Expertise without the normal +5 cap.','When using Combat Expertise, the attack penalty and matching AC bonus may be any value up to your base attack bonus.',0,'none',NULL,NULL,NULL)
)
INSERT INTO dnd35_feats
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   repeatable,choice_kind,repeatability_text,normal_text,special_text)
SELECT 'dd-feat-'||d.slug,'dd-3.0',d.source_page,d.slug,d.name,d.description,d.rules_text,
       0,NULL,1,d.repeatable,d.choice_kind,d.repeatability_text,d.normal_text,d.special_text
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_feats f WHERE f.source_id='dd-3.0' AND f.slug=d.slug AND f.owner_user_id IS NULL
);

WITH desired(slug,category) AS (VALUES
  ('blindsight-5-ft-radius','general'),
  ('disguise-spell','metamagic'),
  ('divine-might','divine'),
  ('divine-vengeance','divine'),
  ('energy-substitution','metamagic'),
  ('extra-music','general'),
  ('eyes-in-the-back-of-your-head','general'),
  ('fleet-of-foot','general'),
  ('greater-multiweapon-fighting','general'),
  ('hold-the-line','general'),
  ('improved-multiweapon-fighting','general'),
  ('jack-of-all-trades','general'),
  ('knock-down','general'),
  ('persistent-spell','metamagic'),
  ('plant-control','general'),
  ('plant-defiance','general'),
  ('power-critical','general'),
  ('power-critical','fighter'),
  ('reach-spell','metamagic'),
  ('repeat-spell','metamagic'),
  ('sacred-spell','metamagic'),
  ('sharp-shooting','general'),
  ('subdual-substitution','metamagic'),
  ('superior-expertise','general')
)
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,d.category
FROM desired d
JOIN dnd35_feats f ON f.source_id='dd-3.0' AND f.slug=d.slug AND f.owner_user_id IS NULL;
