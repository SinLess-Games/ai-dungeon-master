-- Monster Manual v3.5 traits for the second retained-RHD batch.
-- Fixed racial bonus feats are recorded as traits until fixed race-feat grants are modeled.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-azer-heat','azer-heat','Heat','An azer radiates enough heat to burn with its body and metal weapons.','Unarmed attacks and metallic weapon attacks deal 1 extra point of fire damage.','extraordinary','none'),
  ('mm1-sa-satyr-pipes','satyr-pipes','Pipes','Magical pan-pipe tunes can charm, frighten, or put nearby creatures to sleep.','Creatures other than satyrs within 60 feet must save or be affected by the selected charm person, sleep, or fear tune. Caster level 10th; save DC is Charisma-based. A creature that saves against a set of pipes is immune to that set for 24 hours.','supernatural','standard'),
  ('mm1-sa-hill-rock-throwing','hill-giant-rock-throwing','Rock Throwing','Throw boulders as giant ranged weapons.','Hill giant thrown rocks have a 120-foot range increment.','extraordinary','standard'),
  ('mm1-sa-stone-rock-throwing','stone-giant-rock-throwing','Rock Throwing','Throw boulders with exceptional range.','Stone giant thrown rocks have a 180-foot range increment and are thrown with both hands.','extraordinary','standard'),
  ('mm1-sa-giant-rock-catching','giant-rock-catching','Rock Catching','Catch hurled rocks and similar projectiles.','Use the giant rock-catching rules; stone giants receive a +4 racial bonus on the Reflex save to catch a thrown rock.','extraordinary','none'),
  ('mm1-sa-troll-rend','troll-rend','Rend','Two successful claw attacks tear the target apart.','If both claw attacks hit the same opponent, deal additional rend damage of 2d6 + 1-1/2 times the troll’s Strength modifier.','extraordinary','none'),
  ('mm1-sa-troll-regeneration','troll-regeneration','Regeneration 5','Rapidly recover from most wounds.','Regeneration 5. Fire and acid deal normal damage. Lost limbs regrow in 3d6 minutes and a severed member can be reattached immediately by holding it to the stump.','extraordinary','none'),
  ('mm1-sa-troll-scent','troll-scent','Scent','Track and notice creatures by smell.','Scent special quality.','extraordinary','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',NULL,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  slug=excluded.slug,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  category=excluded.category,
  action_type=excluded.action_type,
  effects=NULL,
  parameters=NULL;

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-azer-rhd','azer',NULL,'Racial Hit Dice','2d8 outsider racial Hit Dice; racial BAB +2 and base saves Fort +3, Ref +3, Will +3.',10),
  ('mm1-rt-azer-darkvision','azer',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-azer-natural-armor','azer',NULL,'Natural Armor','+6 natural armor bonus.',30),
  ('mm1-rt-azer-heat','azer','mm1-sa-azer-heat','Heat','Body heat adds fire damage to unarmed and metallic weapon attacks.',40),
  ('mm1-rt-azer-fire-immunity','azer',NULL,'Fire Immunity','Immune to fire.',50),
  ('mm1-rt-azer-sr','azer',NULL,'Spell Resistance','Spell resistance equals 13 + class levels.',60),
  ('mm1-rt-azer-cold-vulnerability','azer',NULL,'Vulnerability to Cold','Vulnerable to cold.',70),
  ('mm1-rt-azer-skills','azer',NULL,'Racial Skills','Racial-HD class skills are Appraise, Climb, Craft, Hide, Jump, Listen, Search, and Spot.',80),

  ('mm1-rt-satyr-rhd','satyr',NULL,'Racial Hit Dice','5d6 fey racial Hit Dice; racial BAB +2 and base saves Fort +1, Ref +4, Will +4.',10),
  ('mm1-rt-satyr-low-light','satyr',NULL,'Low-Light Vision','Low-light vision.',20),
  ('mm1-rt-satyr-natural-armor','satyr',NULL,'Natural Armor','+4 natural armor bonus.',30),
  ('mm1-rt-satyr-head-butt','satyr',NULL,'Natural Weapon','Head butt deals 1d6 base damage.',40),
  ('mm1-rt-satyr-dr','satyr',NULL,'Damage Reduction','Damage reduction 5/cold iron.',50),
  ('mm1-rt-satyr-pipes','satyr','mm1-sa-satyr-pipes','Pipes','Magical pan pipes can produce charm, sleep, or fear effects.',60),
  ('mm1-rt-satyr-skills','satyr',NULL,'Racial Skills','Racial-HD class skills are Bluff, Hide, Knowledge (nature), Listen, Move Silently, Perform, and Spot; +4 racial bonus on Hide, Listen, Move Silently, Perform, and Spot.',70),
  ('mm1-rt-satyr-alertness','satyr',NULL,'Bonus Feat: Alertness','Alertness is a fixed racial bonus feat and is recorded here until fixed race-feat grants are modeled explicitly.',80),

  ('mm1-rt-ogre-large','ogre',NULL,'Large Build','Large size; 10-ft. space and 10-ft. reach, with normal Large-size combat, Hide, grapple, lifting, and carrying adjustments.',10),
  ('mm1-rt-ogre-rhd','ogre',NULL,'Racial Hit Dice','4d8 giant racial Hit Dice; racial BAB +3 and base saves Fort +4, Ref +1, Will +1.',20),
  ('mm1-rt-ogre-darkvision','ogre',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-ogre-low-light','ogre',NULL,'Low-Light Vision','Low-light vision from the giant type.',40),
  ('mm1-rt-ogre-natural-armor','ogre',NULL,'Natural Armor','+5 natural armor bonus.',50),
  ('mm1-rt-ogre-skills','ogre',NULL,'Racial Skills','Racial-HD class skills are Climb, Listen, and Spot.',60),
  ('mm1-rt-ogre-proficiencies','ogre',NULL,'Weapon and Armor Proficiency','Automatically proficient with simple and martial weapons, light and medium armor, and shields.',70),

  ('mm1-rt-hill-large','hill-giant',NULL,'Large Build','Large size; 10-ft. space and 10-ft. reach.',10),
  ('mm1-rt-hill-rhd','hill-giant',NULL,'Racial Hit Dice','12d8 giant racial Hit Dice; racial BAB +8 and base saves Fort +8, Ref +4, Will +4.',20),
  ('mm1-rt-hill-low-light','hill-giant',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-hill-natural-armor','hill-giant',NULL,'Natural Armor','+9 natural armor bonus.',40),
  ('mm1-rt-hill-rock-throwing','hill-giant','mm1-sa-hill-rock-throwing','Rock Throwing','Thrown rocks have a 120-foot range increment.',50),
  ('mm1-rt-hill-rock-catching','hill-giant','mm1-sa-giant-rock-catching','Rock Catching','Can catch thrown rocks using the giant rock-catching rules.',60),
  ('mm1-rt-hill-skills','hill-giant',NULL,'Racial Skills','Racial-HD class skills are Climb, Jump, Listen, and Spot.',70),
  ('mm1-rt-hill-proficiencies','hill-giant',NULL,'Weapon and Armor Proficiency','Automatically proficient with simple and martial weapons, light and medium armor, and shields.',80),

  ('mm1-rt-stone-large','stone-giant',NULL,'Large Build','Large size; 10-ft. space and 10-ft. reach.',10),
  ('mm1-rt-stone-rhd','stone-giant',NULL,'Racial Hit Dice','14d8 giant racial Hit Dice; racial BAB +10 and base saves Fort +9, Ref +4, Will +4.',20),
  ('mm1-rt-stone-darkvision','stone-giant',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-stone-low-light','stone-giant',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-stone-natural-armor','stone-giant',NULL,'Natural Armor','+11 natural armor bonus.',50),
  ('mm1-rt-stone-rock-throwing','stone-giant','mm1-sa-stone-rock-throwing','Rock Throwing','Thrown rocks have a 180-foot range increment.',60),
  ('mm1-rt-stone-rock-catching','stone-giant','mm1-sa-giant-rock-catching','Rock Catching','+4 racial bonus on the Reflex save to catch a thrown rock.',70),
  ('mm1-rt-stone-rocky-hide','stone-giant',NULL,'Rocky Camouflage','+8 racial bonus on Hide checks in rocky terrain.',80),
  ('mm1-rt-stone-skills','stone-giant',NULL,'Racial Skills','Racial-HD class skills are Climb, Hide, Listen, and Spot.',90),

  ('mm1-rt-troll-large','troll',NULL,'Large Build','Large size; 10-ft. space and 10-ft. reach.',10),
  ('mm1-rt-troll-rhd','troll',NULL,'Racial Hit Dice','6d8 giant racial Hit Dice; racial BAB +4 and base saves Fort +5, Ref +2, Will +2.',20),
  ('mm1-rt-troll-darkvision','troll',NULL,'Darkvision','Darkvision 60 ft. for the player-race entry.',30),
  ('mm1-rt-troll-low-light','troll',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-troll-natural-armor','troll',NULL,'Natural Armor','+5 natural armor bonus.',50),
  ('mm1-rt-troll-natural-weapons','troll',NULL,'Natural Weapons','Two claws (1d6 each) and a bite (1d6).',60),
  ('mm1-rt-troll-rend','troll','mm1-sa-troll-rend','Rend','Hitting with both claws triggers extra rend damage.',70),
  ('mm1-rt-troll-regeneration','troll','mm1-sa-troll-regeneration','Regeneration','Regeneration 5; fire and acid deal normal damage.',80),
  ('mm1-rt-troll-scent','troll','mm1-sa-troll-scent','Scent','Scent special quality.',90),
  ('mm1-rt-troll-skills','troll',NULL,'Racial Skills','Racial-HD class skills are Listen and Spot.',100)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
