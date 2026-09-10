-- Source-backed Jaebrin abilities and creator-facing racial traits.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm5-sa-jaebrin-will-sapper','jaebrin-will-sapper','Will Sapper','A bite weakens the victim’s resistance to mental effects.','A creature damaged by the jaebrin’s bite must make a Constitution-based Will save or take a -4 penalty on Will saves for 1 minute. Multiple applications do not stack. The jaebrin adds one-half class level to the save DC.','extraordinary','none'),
  ('mm5-sa-jaebrin-feign-enchantment','jaebrin-feign-enchantment','Feign Enchantment','Absorb enchantment energy and convincingly pretend to be affected.','When an enchantment effect is used on the jaebrin, it absorbs enough of the magic to know the intended effect and can pretend to be affected. The false aura can fool magical detection; an observer must beat the jaebrin’s Bluff with Sense Motive to recognize the deception.','supernatural','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm5-3.5','92-93',slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,source_page=excluded.source_page,slug=excluded.slug,name=excluded.name,
  description=excluded.description,rules_text=excluded.rules_text,is_homebrew=0,owner_user_id=NULL,is_enabled=1,
  category=excluded.category,action_type=excluded.action_type,effects=NULL,parameters=NULL;

WITH traits(id,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm5-rt-jaebrin-type',NULL,'Fey','Jaebrins are fey rather than humanoids and are not affected by effects that target only humanoids.',10),
  ('mm5-rt-jaebrin-vision',NULL,'Low-Light Vision','Low-light vision.',20),
  ('mm5-rt-jaebrin-luck',NULL,'Lucky Defense','+1 luck bonus to Armor Class.',30),
  ('mm5-rt-jaebrin-enchantment-immunity',NULL,'Enchantment Immunity','Immune to enchantment spells and effects.',40),
  ('mm5-rt-jaebrin-bite',NULL,'Natural Weapon','Bite attack dealing 1d3 damage.',50),
  ('mm5-rt-jaebrin-enchantment-dc',NULL,'Potent Enchantments','+1 racial bonus to the saving throw DC of enchantment spells cast by the jaebrin.',60),
  ('mm5-rt-jaebrin-social',NULL,'Fey Guile','+2 racial bonus on Appraise, Bluff, Perform, and Diplomacy checks.',70),
  ('mm5-rt-jaebrin-spellcraft',NULL,'Enchantment Savant','Spellcraft is always a class skill and the jaebrin is considered trained even with no ranks. +4 racial bonus on Spellcraft checks involving enchantment spells and effects.',80),
  ('mm5-rt-jaebrin-will-sapper','mm5-sa-jaebrin-will-sapper','Will Sapper','Bite damage can impose a -4 penalty on Will saves for 1 minute.',90),
  ('mm5-rt-jaebrin-feign','mm5-sa-jaebrin-feign-enchantment','Feign Enchantment','Can absorb and convincingly imitate enchantment effects used against it.',100)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,'mm5-race-jaebrin',t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm5-race-jaebrin')
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,special_ability_id=excluded.special_ability_id,name=excluded.name,
  rules_text=excluded.rules_text,position=excluded.position,effects=NULL,parameters=NULL;
