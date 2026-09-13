-- Heroes of Battle prestige-class feature definitions.
WITH desired(class_slug,feature_slug,name,source_page,description,choice_kind) AS (VALUES
  ('combat-medic','healing-kicker','Healing Kicker','101-102','When a qualifying conjuration (healing) spell is cast on an ally, add one class-level-dependent secondary benefit; daily uses equal class level + Wisdom modifier, minimum 1.','other'),
  ('combat-medic','defensive-casting','Defensive Casting','102','Gain a competence bonus equal to combat medic level on Concentration checks made to cast defensively.',NULL),
  ('combat-medic','field-healer','Field Healer','102','Provide first aid with Heal as a move action and take 10 on those first-aid checks even under stress or distraction.',NULL),
  ('combat-medic','mobility','Mobility','102','Gain Mobility as a bonus feat.',NULL),
  ('combat-medic','evasion','Evasion','102','Gain evasion as the monk class feature.',NULL),
  ('combat-medic','spontaneous-heal','Spontaneous Heal','102','Lose a prepared spell or spell slot of 6th level or higher to cast heal, even if heal is not normally on that spell list.',NULL),

  ('dread-commando','sudden-strike','Sudden Strike','104','Deal extra precision damage to creatures denied their Dexterity bonus to AC, subject to the class feature restrictions.',NULL),
  ('dread-commando','team-initiative-bonus','Team Initiative Bonus','104','Allies within 30 feet who can see you, including you, gain a competence bonus on initiative checks equal to your dread commando level.',NULL),
  ('dread-commando','armored-ease','Armored Ease','104','Reduce the armor check penalty of armor with which you are proficient; the reduction improves at 4th level.',NULL),
  ('dread-commando','stealthy-movement','Stealthy Movement','104','Take no Hide or Move Silently penalty for moving up to normal speed and only -10 when running or charging.',NULL),

  ('legendary-leader','fearless','Fearless','108-109','Become immune to fear effects, including morale checks.',NULL),
  ('legendary-leader','heros-luck','Hero''s Luck','108-109','Gain a luck bonus on saving throws that improves as legendary leader level increases.',NULL),
  ('legendary-leader','natural-commander','Natural Commander','108-109','Your commander rating increases as your legendary reputation grows, granting access to an appropriate commander aura.',NULL),
  ('legendary-leader','legendary-reputation','Legendary Reputation','108-109','Gain a bonus on Leadership score and Charisma-based checks involving followers or prospective followers; the bonus scales with class level.',NULL),
  ('legendary-leader','greater-command','Greater Command','109','Use greater command as a spell-like ability a limited number of times per day.',NULL),
  ('legendary-leader','quick-rally','Quick Rally','109','Attempt a rally check as a free action once per round.',NULL),
  ('legendary-leader','bonus-feat','Bonus Feat','109','Gain a bonus feat from the class''s specified list, meeting the normal prerequisites.', 'feat'),
  ('legendary-leader','heroic-success','Heroic Success','109-110','Once per day, choose to automatically succeed on a saving throw instead of rolling.',NULL),
  ('legendary-leader','additional-commander-aura','Additional Commander Aura','110','Select a second commander aura for which you qualify; followers can benefit from both subject to normal stacking rules.','other'),
  ('legendary-leader','to-hell-and-back','To Hell and Back','110','Leadership cohorts and followers are immune to fear effects, including morale checks, while they have line of sight to you.',NULL),

  ('war-weaver','eldritch-tapestry','Eldritch Tapestry','112-113','Create a magical link among willing allies and deliver qualifying harmless spells through that tapestry to multiple legal targets.',NULL),
  ('war-weaver','quiescent-weaving','Quiescent Weaving','113','Store beneficial spells dormant in the eldritch tapestry and release the stored weaving later as a move action; capacity scales by class level.',NULL),
  ('war-weaver','enlarged-tapestry','Enlarged Tapestry','113','Increase range categories for spells cast through the eldritch tapestry: touch to close, close to medium, and medium to long.',NULL)
)
INSERT OR IGNORE INTO dnd35_class_features
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,special_ability_id,choice_kind)
SELECT 'hob-class-feature-'||d.class_slug||'-'||d.feature_slug,'hob-3.5',d.source_page,
       d.class_slug||'-'||d.feature_slug,d.name,d.description,d.description,0,NULL,1,NULL,d.choice_kind
FROM desired d;
