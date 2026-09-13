-- Deities and Demigods prestige-class feature grants by level.
-- Irregular source mechanics remain structured extensions instead of being flattened into inaccurate generic effects.

WITH desired(class_slug,level,feature_slug,parameters,rules_text) AS (VALUES
  -- Berserk.
  ('berserk',1,'weapon-armor-proficiency',NULL,NULL),
  ('berserk',1,'battle-fury','{"uses":1,"period":"day","extension":{"key":"dnd35.dd.berserk.battle-fury","version":1,"parameters":{"activation":"standard","strengthBonus":6,"constitutionBonus":6,"willMoraleBonus":3,"armorClassPenalty":2,"durationRoundsFormula":"3 + modified con modifier","oncePerEncounter":true,"cannotEndVoluntarily":true,"friendOrBystanderWillSaveDcFormula":"15 + rounds already in fury","aftereffect":"fatigued for remainder of encounter","restrictions":["no patience or concentration skills or abilities","no ranged weapons","must attack visible creatures","continue attacking chosen foe until it dies or berserk is incapacitated"]}}}',NULL),
  ('berserk',1,'movement-bonus','{"rank":10,"extension":{"key":"dnd35.speed.bonus","version":1,"parameters":{"feet":10,"modes":["humanoid","hybrid"]}}}',NULL),
  ('berserk',2,'damage-reduction','{"rank":1,"extension":{"key":"dnd35.damage-reduction","version":1,"parameters":{"amount":1,"bypass":"none"}}}',NULL),
  ('berserk',3,'beast-shape','{"uses":1,"period":"day","extension":{"key":"dnd35.dd.berserk.beast-shape","version":1,"parameters":{"chooseTotemOnce":true,"totems":["brown bear","boar","eagle","raven","cachalot whale","wolf"],"forms":["hybrid","animal"],"hybridStrengthBonus":2,"hybridConstitutionBonus":2,"mutuallyExclusiveWithBattleFury":true,"equipmentTransforms":false}}}',NULL),
  ('berserk',4,'battle-fury','{"uses":2,"period":"day"}',NULL),
  ('berserk',4,'damage-reduction','{"rank":2,"extension":{"key":"dnd35.damage-reduction","version":1,"parameters":{"amount":2,"bypass":"none"}}}',NULL),
  ('berserk',6,'beast-shape','{"uses":2,"period":"day"}',NULL),
  ('berserk',6,'damage-reduction','{"rank":3,"extension":{"key":"dnd35.damage-reduction","version":1,"parameters":{"amount":3,"bypass":"none"}}}',NULL),
  ('berserk',8,'battle-fury','{"uses":3,"period":"day"}',NULL),
  ('berserk',8,'damage-reduction','{"rank":4,"extension":{"key":"dnd35.damage-reduction","version":1,"parameters":{"amount":4,"bypass":"none"}}}',NULL),
  ('berserk',9,'beast-shape','{"uses":3,"period":"day"}',NULL),

  -- Justiciar of Taiia.
  ('justiciar-of-taiia',1,'weapon-proficiency','{"rank":1,"extension":{"key":"dnd35.dd.justiciar.weapon-proficiency","version":1,"parameters":{"chooseOneOf":["simple weapon proficiency","martial weapon proficiency","exotic weapon proficiency"]}}}',NULL),
  ('justiciar-of-taiia',1,'spellcasting',NULL,NULL),
  ('justiciar-of-taiia',1,'sneak-attack','{"dice":"1d6"}',NULL),
  ('justiciar-of-taiia',2,'combat-sense','{"rank":2,"extension":{"key":"dnd35.dd.justiciar.combat-sense","version":1,"parameters":{"designatedOpponents":1,"insightAttackBonus":2,"insightArmorClassBonus":2}}}',NULL),
  ('justiciar-of-taiia',3,'augury','{"uses":1,"period":"day","extension":{"key":"dnd35.spell-like-ability","version":1,"parameters":{"spellSlug":"augury","casterLevelFormula":"class level"}}}',NULL),
  ('justiciar-of-taiia',4,'sneak-attack','{"dice":"2d6"}',NULL),
  ('justiciar-of-taiia',5,'combat-sense','{"rank":4,"extension":{"key":"dnd35.dd.justiciar.combat-sense","version":1,"parameters":{"insightAttackBonus":4,"insightArmorClassBonus":4}}}',NULL),
  ('justiciar-of-taiia',5,'divination','{"uses":1,"period":"day","extension":{"key":"dnd35.spell-like-ability","version":1,"parameters":{"spellSlug":"divination","casterLevelFormula":"class level"}}}',NULL),
  ('justiciar-of-taiia',6,'augury','{"uses":2,"period":"day"}',NULL),
  ('justiciar-of-taiia',7,'sneak-attack','{"dice":"3d6"}',NULL),
  ('justiciar-of-taiia',8,'combat-sense','{"rank":6,"extension":{"key":"dnd35.dd.justiciar.combat-sense","version":1,"parameters":{"insightAttackBonus":6,"insightArmorClassBonus":6}}}',NULL),
  ('justiciar-of-taiia',9,'augury','{"uses":3,"period":"day"}',NULL),
  ('justiciar-of-taiia',10,'divination','{"uses":2,"period":"day"}',NULL),
  ('justiciar-of-taiia',10,'sneak-attack','{"dice":"4d6"}',NULL),
  ('justiciar-of-taiia',1,'loss-of-standing','{"extension":{"key":"dnd35.dd.justiciar.loss-of-standing","version":1,"parameters":{"fallFromPurifyingFlame":"cannot gain further justiciar levels","leaveChurchOfTaiia":"lose justiciar spells and spell-like abilities; retain other class powers"}}}',NULL),

  -- Soldier of Light.
  ('soldier-of-light',1,'weapon-armor-proficiency',NULL,NULL),
  ('soldier-of-light',1,'spellcasting',NULL,NULL),
  ('soldier-of-light',1,'spontaneous-casting','{"extension":{"key":"dnd35.dd.soldier.spontaneous-casting","version":1,"parameters":{"convertAnyPreparedDivineSpell":true,"replacement":"cure spell of same level"}}}',NULL),
  ('soldier-of-light',1,'detect-undead','{"uses":"at-will","extension":{"key":"dnd35.spell-like-ability","version":1,"parameters":{"spellSlug":"detect-undead"}}}',NULL),
  ('soldier-of-light',1,'turn-undead','{"usesFormula":"3 + cha modifier","extension":{"key":"dnd35.turn-undead","version":1,"parameters":{"effectiveLevelFormula":"soldier of light level + compatible prior effective turning level","separateAttemptPool":false}}}',NULL),
  ('soldier-of-light',2,'divine-grace','{"extension":{"key":"dnd35.saves.ability-bonus","version":1,"parameters":{"ability":"cha","minimumBonus":0,"saves":["fort","ref","will"]}}}',NULL),
  ('soldier-of-light',2,'smite-undead','{"uses":1,"period":"day","extension":{"key":"dnd35.dd.soldier.smite-undead","version":1,"parameters":{"attackAbilityBonus":"wis positive modifier","damageBonusFormula":"class level","validTarget":"undead","useConsumedOnInvalidTarget":true}}}',NULL),
  ('soldier-of-light',3,'positive-fortitude','{"rank":2,"extension":{"key":"dnd35.save-bonus","version":1,"parameters":{"bonusType":"sacred","amount":2,"against":["necromancy spells or effects","energy drain"]}}}',NULL),
  ('soldier-of-light',4,'energon-companion','{"rank":1,"extension":{"key":"dnd35.dd.soldier.energon-companion","version":1,"parameters":{"creature":"xag-ya","count":1,"telepathyRequiresRangeAndLineOfSight":true,"deathOrDismissalFortitudeDc":15,"xpLossOnFailurePerClassLevel":200,"xpLossOnSuccessPerClassLevel":100,"replacementDelay":"1 year and 1 day"}}}',NULL),
  ('soldier-of-light',5,'divine-vengeance','{"extension":{"key":"dnd35.dd.soldier.divine-vengeance","version":1,"parameters":{"turnAttemptsSpent":1,"sacredDamage":"2d6","validTarget":"undead","appliesTo":"successful melee attacks","duration":"through end of next action"}}}',NULL),
  ('soldier-of-light',7,'fast-healing','{"rank":1,"extension":{"key":"dnd35.fast-healing","version":1,"parameters":{"amount":1,"healsNonlethalFirst":true,"doesNotRestore":["starvation","thirst","suffocation"]}}}',NULL),
  ('soldier-of-light',8,'energon-companion','{"rank":2,"extension":{"key":"dnd35.dd.soldier.energon-companion","version":1,"parameters":{"creature":"xag-ya","count":2,"bonusHitDiceEach":2}}}',NULL),
  ('soldier-of-light',8,'positive-energy-burst','{"extension":{"key":"dnd35.dd.soldier.positive-energy-burst","version":1,"parameters":{"turnAttemptsSpent":2,"radiusFeet":100,"damageDiceFormula":"1d6 per class level","validTarget":"undead","save":"reflex half","saveDcFormula":"10 + class level"}}}',NULL),
  ('soldier-of-light',10,'fast-healing','{"rank":2,"extension":{"key":"dnd35.fast-healing","version":1,"parameters":{"amount":2}}}',NULL),
  ('soldier-of-light',1,'loss-of-standing','{"extension":{"key":"dnd35.dd.soldier.loss-of-standing","version":1,"parameters":{"triggers":["ceases to be good","violates tenets of faith"],"losses":["special abilities","spells","further class advancement"],"restoration":"atonement"}}}',NULL)
)
INSERT OR IGNORE INTO dnd35_class_feature_grants (class_level_id,class_feature_id,parameters,rules_text)
SELECT cl.id,cf.id,d.parameters,d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
JOIN dnd35_sources src ON src.id=c.source_id
JOIN dnd35_class_levels cl ON cl.class_id=c.id AND cl.level=d.level
JOIN dnd35_class_features cf ON cf.slug=d.class_slug||'-'||d.feature_slug AND cf.owner_user_id IS NULL
WHERE src.slug='deities-and-demigods-3-0';
