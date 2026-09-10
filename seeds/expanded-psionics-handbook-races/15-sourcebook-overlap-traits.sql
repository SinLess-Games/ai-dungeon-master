-- XPH psionic replacements for githyanki/githzerai plus full thri-kreen traits.
-- The thri-kreen psi-like list incorporates the official XPH errata:
-- know direction and location, and greater concealing amorpha.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('xph-sa-githyanki-psi-like','10','xph-githyanki-psi-like-abilities','Githyanki Psi-Like Abilities',
   'Psionic talents that expand as the githyanki gains Hit Dice.',
   'At 1st level: far hand and psionic daze 3/day. At 3rd: concealing amorpha 3/day. At 6th: psionic dimension door 3/day. At 9th: telekinetic thrust 3/day and psionic plane shift 1/day. Benefits are cumulative. Manifester level equals one-half Hit Dice, minimum 1st; save DCs are Charisma-based.',
   'psi_like','standard'),
  ('xph-sa-githzerai-psi-like','11','xph-githzerai-psi-like-abilities','Githzerai Psi-Like Abilities',
   'Innate psionic mobility, defense, and force effects.',
   '3/day each: inertial armor, psionic daze, catfall, and concussion blast. At 11th level also gain psionic plane shift 1/day. Manifester level equals one-half Hit Dice, minimum 1st; save DCs are Charisma-based.',
   'psi_like','standard'),
  ('xph-sa-thri-kreen-poison','14-15','thri-kreen-poison','Poison',
   'A thri-kreen can deliver venom through one bite each day.',
   'Once per day on a successful bite: initial damage 1d6 Dexterity; secondary effect paralysis for 2d6 minutes. Fortitude save DC is 11 + Constitution modifier.',
   'extraordinary','none'),
  ('xph-sa-thri-kreen-leap','14-15','thri-kreen-leap','Leap',
   'Powerful legs make thri-kreen exceptional jumpers.',
   '+30 racial bonus on Jump checks.',
   'extraordinary','none'),
  ('xph-sa-thri-kreen-psi-like','14-15','thri-kreen-psi-like-abilities','Thri-Kreen Psi-Like Abilities',
   'Innate psionic camouflage, orientation, defense, and natural-weapon enhancement.',
   '3/day: chameleon and know direction and location. 1/day: greater concealing amorpha and metaphysical claw. Manifester level equals one-half Hit Dice, minimum 1st; save DCs are Charisma-based.',
   'psi_like','standard')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'xph-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id, source_page=excluded.source_page, slug=excluded.slug,
  name=excluded.name, description=excluded.description, rules_text=excluded.rules_text,
  is_homebrew=0, owner_user_id=NULL, is_enabled=1, category=excluded.category,
  action_type=excluded.action_type, effects=NULL, parameters=NULL;

-- When XPH is in use, replace the Monster Manual spell-like gith implementation
-- with the revised naturally-psionic / psi-like package.
DELETE FROM dnd35_race_traits
WHERE id IN (
  'mm1-rt-githyanki-psionics','mm1-rt-githyanki-sr',
  'mm1-rt-githzerai-psionics','mm1-rt-githzerai-inertial','mm1-rt-githzerai-sr'
);

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('xph-rt-githyanki-psionic','githyanki',NULL,'Naturally Psionic','Gain 3 bonus power points at 1st level.',20),
  ('xph-rt-githyanki-psi-like','githyanki','xph-sa-githyanki-psi-like','Psi-Like Abilities','Scaling cumulative psi-like abilities based on character Hit Dice.',30),
  ('xph-rt-githyanki-pr','githyanki',NULL,'Power Resistance','Power resistance equals Hit Dice + 5.',40),

  ('xph-rt-githzerai-psionic','githzerai',NULL,'Naturally Psionic','Gain 2 bonus power points at 1st level.',20),
  ('xph-rt-githzerai-psi-like','githzerai','xph-sa-githzerai-psi-like','Psi-Like Abilities','Inertial armor, psionic daze, catfall, and concussion blast 3/day; psionic plane shift joins the package at 11th level.',30),
  ('xph-rt-githzerai-pr','githzerai',NULL,'Power Resistance','Power resistance equals Hit Dice + 5.',40),

  ('xph-rt-thri-rhd','thri-kreen',NULL,'Racial Hit Dice','2d8 monstrous humanoid racial Hit Dice; racial BAB +2 and base saves Fort +0, Ref +3, Will +3.',10),
  ('xph-rt-thri-darkvision','thri-kreen',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('xph-rt-thri-sleep','thri-kreen',NULL,'Sleep Immunity','Immune to magic sleep effects.',30),
  ('xph-rt-thri-natural-armor','thri-kreen',NULL,'Natural Armor','+3 natural armor bonus from the exoskeleton.',40),
  ('xph-rt-thri-limbs','thri-kreen',NULL,'Multiple Limbs','Four arms allow qualification for Multiweapon Fighting and Multiattack. These are not automatic bonus feats.',50),
  ('xph-rt-thri-natural-attacks','thri-kreen',NULL,'Natural Attacks','Four claws (1d4 each) and one secondary bite (1d4). A weapon attack routine can also include one bite or claw as a secondary natural attack.',60),
  ('xph-rt-thri-poison','thri-kreen','xph-sa-thri-kreen-poison','Poison','One poisonous bite per day; Dexterity damage followed by paralysis on a failed Fortitude save.',70),
  ('xph-rt-thri-leap','thri-kreen','xph-sa-thri-kreen-leap','Leap','+30 racial bonus on Jump checks.',80),
  ('xph-rt-thri-familiarity','thri-kreen',NULL,'Weapon Familiarity','Treat gythka and chatkcha as martial weapons rather than exotic weapons.',90),
  ('xph-rt-thri-psionic','thri-kreen',NULL,'Naturally Psionic','Gain 1 bonus power point at 1st level.',100),
  ('xph-rt-thri-psi-like','thri-kreen','xph-sa-thri-kreen-psi-like','Psi-Like Abilities','Errata-corrected XPH psi-like ability package.',110),
  ('xph-rt-thri-skills','thri-kreen',NULL,'Racial Skills','Racial-HD class skills are Balance, Climb, Hide, Jump, Listen, and Spot; +4 racial bonus on Hide checks in sandy or arid settings.',120),
  ('xph-rt-thri-deflect','thri-kreen',NULL,'Bonus Feat: Deflect Arrows','Gain Deflect Arrows as a racial bonus feat; the two racial Hit Dice also provide the normal feat earned from Hit Dice.',130)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.slug=t.race_slug AND r.owner_user_id IS NULL AND r.is_enabled=1
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id, special_ability_id=excluded.special_ability_id,
  name=excluded.name, rules_text=excluded.rules_text, position=excluded.position,
  effects=NULL, parameters=NULL;

WITH desired(skill_slug) AS (VALUES
  ('balance'),('climb'),('hide'),('jump'),('listen'),('spot')
)
INSERT OR IGNORE INTO dnd35_race_class_skills (race_id,skill_id)
SELECT r.id,s.id
FROM desired d
JOIN dnd35_races r ON r.slug='thri-kreen' AND r.owner_user_id IS NULL AND r.is_enabled=1
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL AND s.is_enabled=1;
