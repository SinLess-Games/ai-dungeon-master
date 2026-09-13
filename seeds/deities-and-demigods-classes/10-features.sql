-- Deities and Demigods prestige-class feature definitions.
-- Text is normalized to the revised 3.5 terminology where the source has a direct equivalent.

WITH desired(class_slug,feature_slug,name,source_page,description,choice_kind) AS (VALUES
  -- Berserk.
  ('berserk','weapon-armor-proficiency','Weapon and Armor Proficiency','201-202','Gain proficiency with light armor and all simple and martial melee weapons if not already proficient.',NULL),
  ('berserk','battle-fury','Battle Fury','201-202','Enter an uncontrolled combat frenzy that increases Strength, Constitution, and Will saves while reducing AC; the berserk must keep attacking visible creatures and cannot voluntarily end the fury.','none'),
  ('berserk','movement-bonus','Movement Bonus','202','Increase base land speed by 10 feet while in humanoid or hybrid form.',NULL),
  ('berserk','damage-reduction','Damage Reduction','202','Gain increasing damage reduction that subtracts damage from weapon and natural attacks.',NULL),
  ('berserk','beast-shape','Beast Shape','202','Choose an animal totem and assume a hybrid or animal form a limited number of times per day; the forms alter physical capabilities and are mutually exclusive with battle fury.','other'),

  -- Justiciar of Taiia.
  ('justiciar-of-taiia','weapon-proficiency','Bonus Weapon Proficiency','205-206','At 1st level choose one Simple Weapon Proficiency, one Martial Weapon Proficiency, or one Exotic Weapon Proficiency as a bonus feat.','weapon'),
  ('justiciar-of-taiia','spellcasting','Spellcasting','205-206','Prepare Wisdom-based divine spells from the justiciar list as a cleric; 0 slots are bonus-spell-only access and the class cannot spontaneously convert spells to cure or inflict spells.',NULL),
  ('justiciar-of-taiia','sneak-attack','Sneak Attack','206','Deal scaling precision damage when an opponent is denied Dexterity to AC or is flanked, subject to the normal sneak-attack restrictions.',NULL),
  ('justiciar-of-taiia','combat-sense','Combat Sense','206','Designate one opponent in combat and gain a scaling insight bonus to AC and attack rolls against that opponent.',NULL),
  ('justiciar-of-taiia','augury','Augury','206','Use augury as a spell-like ability with caster level equal to justiciar level; daily uses increase with class level.',NULL),
  ('justiciar-of-taiia','divination','Divination','206','Use divination as a spell-like ability with caster level equal to justiciar level; daily uses increase at 10th level.',NULL),
  ('justiciar-of-taiia','loss-of-standing','Ex-Justiciar','206','Falling from the Purifying Flame prevents further justiciar advancement; leaving Taiia’s church also removes justiciar spells and spell-like abilities while retaining the class’s other powers.',NULL),

  -- Soldier of Light.
  ('soldier-of-light','weapon-armor-proficiency','Weapon and Armor Proficiency','208-209','Gain proficiency with all simple and martial weapons, all armor, and shields.',NULL),
  ('soldier-of-light','spellcasting','Spellcasting','208-209','Prepare Wisdom-based divine spells from the soldier of light list as a cleric; 0 slots are bonus-spell-only access.',NULL),
  ('soldier-of-light','spontaneous-casting','Spontaneous Casting','209','Convert any prepared divine spell into a cure spell of the same level, including prepared spells from other divine classes.',NULL),
  ('soldier-of-light','detect-undead','Detect Undead','209','Use detect undead at will as a spell-like ability.',NULL),
  ('soldier-of-light','turn-undead','Turn Undead','209','Turn undead as a cleric of soldier of light level; compatible prior turning levels stack while daily attempts do not form a separate pool.',NULL),
  ('soldier-of-light','divine-grace','Divine Grace','209','Add a positive Charisma modifier as a bonus on all saving throws.',NULL),
  ('soldier-of-light','smite-undead','Smite Undead','209','Once per day make a melee smite against undead, adding positive Wisdom modifier to the attack roll and soldier level to damage.',NULL),
  ('soldier-of-light','positive-fortitude','Positive Fortitude','209','Gain a +2 sacred bonus on saves against necromancy effects and energy drain.',NULL),
  ('soldier-of-light','energon-companion','Energon Companion','209','Summon a xag-ya companion linked telepathically within range and line of sight; at 8th level gain a second companion and improve both companions by +2 HD.',NULL),
  ('soldier-of-light','divine-vengeance','Divine Vengeance','209','Spend one turning attempt to add 2d6 sacred damage to successful melee attacks against undead until the end of the soldier’s next action.',NULL),
  ('soldier-of-light','fast-healing','Fast Healing','209','Regain hit points at the start of each turn; the rate improves at 10th level and does not restore hit points lost to starvation, thirst, or suffocation.',NULL),
  ('soldier-of-light','positive-energy-burst','Positive Energy Burst','209','Spend two turning attempts to damage all undead within 100 feet for 1d6 per soldier level, with a Reflex save for half.',NULL),
  ('soldier-of-light','loss-of-standing','Ex-Soldier of Light','209','Ceasing to be good or violating the faith removes soldier special abilities and spells and prevents further advancement until the character atones.',NULL)
)
INSERT OR IGNORE INTO dnd35_class_features
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,special_ability_id,choice_kind)
SELECT 'dd-class-feature-'||d.class_slug||'-'||d.feature_slug,'dd-3.0',d.source_page,
       d.class_slug||'-'||d.feature_slug,d.name,d.description,d.description,0,NULL,1,NULL,d.choice_kind
FROM desired d;
