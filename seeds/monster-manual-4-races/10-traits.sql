-- Source-backed special abilities and creator-facing traits for Varag, Windrazor, and Windscythe.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm4-sa-windblade-keen-senses','176-179','windblade-keen-senses','Keen Senses','Windblades see exceptionally well in poor light.','In shadowy illumination, a windblade sees four times as far as a human. This is in addition to darkvision 60 ft.','extraordinary','none'),
  ('mm4-sa-windrazor-rend','176-179','windrazor-rend','Rend','Two successful claw strikes tear the target apart.','If both claw attacks hit the same opponent, the windrazor automatically deals an extra 2d4+2 damage.','extraordinary','none'),
  ('mm4-sa-windscythe-rend','177-179','windscythe-rend','Rend','Two successful claw strikes tear the target apart.','If both claw attacks hit the same opponent, the windscythe automatically deals an extra 2d6+7 damage.','extraordinary','none'),
  ('mm4-sa-windrazor-fearsome-critical','176-179','windrazor-fearsome-critical','Fearsome Critical','A critical hit terrifies nearby creatures.','Whenever the windrazor scores a critical hit, creatures within 10 feet must succeed on a Charisma-based Will save (DC 9 for the standard windrazor) or become shaken. This is a mind-affecting fear effect.','extraordinary','none'),
  ('mm4-sa-windscythe-fearsome-critical','177-179','windscythe-fearsome-critical','Fearsome Critical','A critical hit terrifies nearby creatures.','Whenever the windscythe scores a critical hit, creatures within 10 feet must succeed on a Charisma-based Will save (DC 13 for the standard windscythe) or become shaken. This is a mind-affecting fear effect.','extraordinary','none'),
  ('mm4-sa-windscythe-augmented-critical','177-179','windscythe-augmented-critical','Augmented Critical','Windscythe claws have an unusually deadly critical profile.','A windscythe’s claw natural attacks threaten critical hits on 18-20 and deal triple damage on a confirmed critical. Keen edge and similar effects do not further improve the threat range.','extraordinary','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm4-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,source_page=excluded.source_page,slug=excluded.slug,name=excluded.name,
  description=excluded.description,rules_text=excluded.rules_text,is_homebrew=0,owner_user_id=NULL,is_enabled=1,
  category=excluded.category,action_type=excluded.action_type,effects=NULL,parameters=NULL;

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm4-rt-varag-rhd','varag',NULL,'Racial Hit Dice','3d8 humanoid racial Hit Dice; racial BAB +2 and base saves Fort +1, Ref +3, Will +1.',10),
  ('mm4-rt-varag-vision','varag',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm4-rt-varag-scent','varag',NULL,'Scent','Scent 30 ft. at the completed racial package.',30),
  ('mm4-rt-varag-armor','varag',NULL,'Natural Armor','+3 natural armor bonus.',40),
  ('mm4-rt-varag-stealth','varag',NULL,'Racial Skills','+8 racial bonus on Move Silently checks; +4 racial bonus on Survival checks when tracking by scent. The completed racial package can take 10 on Move Silently even while rushed or threatened.',50),
  ('mm4-rt-varag-class-skills','varag',NULL,'Racial Class Skills','Jump, Move Silently, and Survival are class skills for the varag racial Hit Dice.',60),
  ('mm4-rt-varag-feats','varag',NULL,'Racial Bonus Feats','Run and Spring Attack are racial bonus feats in addition to feats earned from Hit Dice.',70),
  ('mm4-rt-varag-weapons','varag',NULL,'Martial Weapon Proficiency','Varags are proficient with all martial weapons.',80),

  ('mm4-rt-windrazor-rhd','windrazor',NULL,'Racial Hit Dice','2d8 outsider racial Hit Dice; racial BAB +2 and base saves Fort +3, Ref +3, Will +3.',10),
  ('mm4-rt-windrazor-vision','windrazor',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm4-rt-windrazor-keen','windrazor','mm4-sa-windblade-keen-senses','Keen Senses','See four times as far as a human in shadowy illumination.',30),
  ('mm4-rt-windrazor-weapons','windrazor',NULL,'Natural Weapons','Two claws (1d4) and bite (1d6).',40),
  ('mm4-rt-windrazor-skills','windrazor',NULL,'Racial Skills','Racial-HD class skills: Climb, Knowledge (the planes), Listen, Move Silently, Spot, Survival, and Tumble. +8 racial bonus on Climb and may take 10 on Climb even while rushed or threatened.',50),
  ('mm4-rt-windrazor-feats','windrazor',NULL,'Racial Bonus Feats','Improved Critical (claw) and Improved Critical (bite) are racial bonus feats; the outsider Hit Dice also provide one normal feat.',60),
  ('mm4-rt-windrazor-rend','windrazor','mm4-sa-windrazor-rend','Rend','Both claws hitting deal an additional 2d4+2 damage.',70),
  ('mm4-rt-windrazor-fear','windrazor','mm4-sa-windrazor-fearsome-critical','Fearsome Critical','Critical hits can leave nearby creatures shaken.',80),

  ('mm4-rt-windscythe-rhd','windscythe',NULL,'Racial Hit Dice','8d8 outsider racial Hit Dice; racial BAB +8 and base saves Fort +6, Ref +6, Will +6.',10),
  ('mm4-rt-windscythe-vision','windscythe',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm4-rt-windscythe-keen','windscythe','mm4-sa-windblade-keen-senses','Keen Senses','See four times as far as a human in shadowy illumination.',30),
  ('mm4-rt-windscythe-armor','windscythe',NULL,'Natural Armor','+4 natural armor bonus.',40),
  ('mm4-rt-windscythe-weapons','windscythe',NULL,'Natural Weapons','Two claws (1d6) and bite (1d8).',50),
  ('mm4-rt-windscythe-skills','windscythe',NULL,'Racial Skills','Racial-HD class skills: Climb, Intimidate, Knowledge (the planes), Listen, Move Silently, Spot, Survival, and Tumble.',60),
  ('mm4-rt-windscythe-critical','windscythe','mm4-sa-windscythe-augmented-critical','Augmented Critical','Claws threaten on 18-20 and deal x3 damage on a confirmed critical.',70),
  ('mm4-rt-windscythe-rend','windscythe','mm4-sa-windscythe-rend','Rend','Both claws hitting deal an additional 2d6+7 damage.',80),
  ('mm4-rt-windscythe-fear','windscythe','mm4-sa-windscythe-fearsome-critical','Fearsome Critical','Critical hits can leave nearby creatures shaken.',90)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,'mm4-race-'||t.race_slug,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
WHERE EXISTS (SELECT 1 FROM dnd35_races r WHERE r.id='mm4-race-'||t.race_slug)
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,special_ability_id=excluded.special_ability_id,name=excluded.name,
  rules_text=excluded.rules_text,position=excluded.position,effects=NULL,parameters=NULL;
