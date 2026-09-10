-- heroes-of-battle-feats
-- D&D 3.5 Heroes of Battle battlefield and leader feats.
-- Mechanical text is intentionally concise; source_page points to the supplied book.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hob-3.5','heroes-of-battle-3-5','Heroes of Battle','HoB','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 supplement for battlefield adventures, military characters, command, morale, and mass-conflict procedures.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,description,rules_text) AS (VALUES
  ('ballista-proficiency','Ballista Proficiency','96','Operate a ballista without the normal nonproficiency attack penalty.','You do not take the normal -4 nonproficiency penalty on attack rolls made with a ballista.'),
  ('block-arrow','Block Arrow','96','Use a shield to deflect a qualifying ranged weapon hit once per round.','While using a shield, once per round you can negate a qualifying ranged-weapon hit if you are aware of the attack and not flat-footed. Massive projectiles, siege attacks, and ranged spell effects are excluded.'),
  ('coordinated-shot','Coordinated Shot','96-97','Ignore cover supplied to a ranged target by your allies.','When a foe has cover because of the position of your allies, your ranged attacks ignore that cover bonus to AC. Other sources of cover still apply.'),
  ('courageous-rally','Courageous Rally','97','Rally troops while using bardic music to inspire courage.','When activating inspire courage, make a rally check as part of the same action and add a morale bonus equal to the inspire courage morale bonus.'),
  ('expanded-aura-of-courage','Expanded Aura of Courage','97','Increase the radius of aura of courage.','Your aura of courage affects allies within 60 feet instead of its normal 10-foot radius.'),
  ('expert-siege-engineer','Expert Siege Engineer','97','Improve attacks and damage with siege engines.','Gain a +2 competence bonus on attack rolls and damage rolls made with siege engines.'),
  ('extra-followers','Extra Followers','97','Attract twice the normal number of Leadership followers.','Double the number of followers granted by your Leadership score. As a leader feat, this feat also increases Leadership score by +1.'),
  ('guerrilla-scout','Guerrilla Scout','97','Improve initiative and make Listen and Spot cheaper as cross-class skills.','Gain +1 on initiative checks. Listen and Spot ranks cost 1 skill point even when cross-class, but their cross-class maximum ranks are unchanged.'),
  ('guerrilla-warrior','Guerrilla Warrior','97-98','Move stealthily in armor and buy Hide and Move Silently ranks more efficiently.','While wearing light or medium armor, reduce its armor check penalty by 1, minimum 0. Hide and Move Silently ranks cost 1 skill point even when cross-class, without changing cross-class maximum ranks.'),
  ('improved-cohort','Improved Cohort','98','Raise the maximum level of your Leadership cohort.','The maximum level of the cohort gained from Leadership is one level below your character level rather than two. As a leader feat, this feat also increases Leadership score by +1.'),
  ('inspirational-leadership','Inspirational Leadership','98','Improve the starting morale and rallying of your Leadership cohort and followers.','If their morale is no worse than normal, your Leadership cohort and followers begin combat heartened. You gain +5 on rally checks for those cohort/followers. As a leader feat, this feat also increases Leadership score by +1.'),
  ('mounted-mobility','Mounted Mobility','98','Gain improved defense against attacks of opportunity caused by mounted movement.','While mounted, you and your mount gain a +4 dodge bonus to AC against attacks of opportunity provoked when the mount leaves a threatened square.'),
  ('natural-leader','Natural Leader','98','Improve rally checks.','Gain a +4 bonus on rally checks.'),
  ('plunging-shot','Plunging Shot','99','Deal extra ranged damage to targets substantially below you.','When a target is at least 30 feet lower than you, a thrown-weapon or projectile-weapon hit deals +1d6 damage.'),
  ('practiced-cohort','Practiced Cohort','99','Let your Leadership cohort participate in teamwork benefits without the normal member restrictions.','Your Leadership cohort gains teamwork benefits for which you qualify even without meeting the team-member prerequisite, does not count against the eight-member team limit, and does not affect other members qualification. As a leader feat, this feat also increases Leadership score by +1.'),
  ('ready-shot','Ready Shot','99','Ready a powerful ranged attack against a charging opponent.','Ready a ranged attack against a foe charging you and wait until it is within 15 feet. A hit deals +3d6 damage; creatures immune to extra critical-hit damage are immune to this extra damage.'),
  ('shield-wall','Shield Wall','99','Improve shield defense while adjacent to another shield bearer.','When you and an adjacent ally are each using a shield, your shield bonus to AC increases by +2.'),
  ('veteran-knowledge','Veteran Knowledge','99','Apply battlefield experience to strategic-advantage Knowledge checks.','Gain a +5 bonus on Knowledge checks made to gain a strategic advantage.')
)
INSERT INTO dnd35_feats
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   repeatable,choice_kind,repeatability_text,normal_text,special_text)
SELECT 'hob-feat-'||d.slug,'hob-3.5',d.source_page,d.slug,d.name,d.description,d.rules_text,
       0,NULL,1,0,'none',NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_feats f WHERE f.slug=d.slug AND f.owner_user_id IS NULL
);
