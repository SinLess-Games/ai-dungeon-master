-- Racial traits and reusable special abilities for Tiefling, base Pixie, and Yuan-ti Pureblood.
-- Mechanical text is concise paraphrase of Monster Manual v3.5 character entries.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-tiefling-darkness','tiefling-darkness','Darkness','Innate fiendish darkness usable once per day.','Use darkness once per day; caster level equals class levels.','spell_like','standard'),
  ('mm1-sa-pixie-greater-invisibility','pixie-greater-invisibility','Greater Invisibility','A pixie remains invisible even while attacking.','Constant greater invisibility; suppress or resume the effect as a free action.','supernatural','free'),
  ('mm1-sa-pixie-spell-like','pixie-spell-like-abilities','Pixie Spell-Like Abilities','A broad suite of once-daily fey magic.','Once per day each: lesser confusion, dancing lights, detect chaos, detect good, detect evil, detect law, detect thoughts, dispel magic, entangle, permanent image, and polymorph (self only). Caster level 8th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-yuan-pureblood-alternate-form','yuan-ti-alternate-form','Alternate Form','Assume the form of a Tiny through Large viper.','Assume a Tiny through Large viper form. It functions similarly to polymorph at caster level 19th, does not restore hit points, and is limited to viper forms.','spell_like','standard'),
  ('mm1-sa-yuan-pureblood-detect-poison','yuan-ti-detect-poison','Detect Poison','Innately sense poison.','Use detect poison as the spell at caster level 6th.','spell_like','standard'),
  ('mm1-sa-yuan-pureblood-spell-like','yuan-ti-pureblood-spell-like-abilities','Yuan-ti Pureblood Spell-Like Abilities','Innate serpent magic usable once per day.','Once per day each: animal trance, cause fear, charm person, darkness, and entangle. Caster level 4th; save DCs are Charisma-based.','spell_like','standard')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',NULL,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
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
  ('mm1-rt-tiefling-darkvision','tiefling',NULL,'Darkvision','Darkvision 60 ft.',10),
  ('mm1-rt-tiefling-skills','tiefling',NULL,'Deceptive','+2 racial bonus on Bluff and Hide checks.',20),
  ('mm1-rt-tiefling-resistances','tiefling',NULL,'Fiendish Resistances','Resistance 5 to cold, electricity, and fire.',30),
  ('mm1-rt-tiefling-darkness','tiefling','mm1-sa-tiefling-darkness','Darkness','Darkness 1/day.',40),

  ('mm1-rt-pixie-small','pixie',NULL,'Small Size','Small size with the normal Small combat, Hide, grapple, lifting, and carrying adjustments.',10),
  ('mm1-rt-pixie-flight','pixie',NULL,'Flight','Fly speed 60 ft. with good maneuverability.',20),
  ('mm1-rt-pixie-low-light','pixie',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-pixie-skills','pixie',NULL,'Sprite Senses','+2 racial bonus on Listen, Search, and Spot checks.',40),
  ('mm1-rt-pixie-dodge','pixie',NULL,'Bonus Feat: Dodge','Pixies receive Dodge as a fixed racial bonus feat. It is recorded as a trait until fixed race-feat grants are modeled separately from selectable bonus-feat slots.',50),
  ('mm1-rt-pixie-natural-armor','pixie',NULL,'Natural Armor','+1 natural armor bonus.',60),
  ('mm1-rt-pixie-dr','pixie',NULL,'Damage Reduction','Damage reduction 10/cold iron.',70),
  ('mm1-rt-pixie-sr','pixie',NULL,'Spell Resistance','Spell resistance equals 15 + class levels.',80),
  ('mm1-rt-pixie-invisibility','pixie','mm1-sa-pixie-greater-invisibility','Greater Invisibility','Constant greater invisibility that can be suppressed or resumed.',90),
  ('mm1-rt-pixie-spell-like','pixie','mm1-sa-pixie-spell-like','Spell-Like Abilities','Once-daily fey spell-like abilities at caster level 8th.',100),

  ('mm1-rt-yuan-pureblood-rhd','yuan-ti-pureblood',NULL,'Racial Hit Dice','4d8 monstrous humanoid racial Hit Dice; racial BAB +4 and base saves Fort +1, Ref +4, Will +4.',10),
  ('mm1-rt-yuan-pureblood-darkvision','yuan-ti-pureblood',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-yuan-pureblood-racial-skills','yuan-ti-pureblood',NULL,'Racial Skills','Racial-HD class skills are Concentration, Disguise, Hide, Knowledge, Listen, and Spot.',30),
  ('mm1-rt-yuan-pureblood-disguise','yuan-ti-pureblood',NULL,'Human Disguise','+5 racial bonus on Disguise checks when impersonating a human.',40),
  ('mm1-rt-yuan-pureblood-alertness','yuan-ti-pureblood',NULL,'Bonus Feat: Alertness','Alertness is a fixed racial bonus feat. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',50),
  ('mm1-rt-yuan-pureblood-blind-fight','yuan-ti-pureblood',NULL,'Bonus Feat: Blind-Fight','Blind-Fight is a fixed racial bonus feat. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',60),
  ('mm1-rt-yuan-pureblood-natural-armor','yuan-ti-pureblood',NULL,'Natural Armor','+1 natural armor bonus.',70),
  ('mm1-rt-yuan-pureblood-spell-like','yuan-ti-pureblood','mm1-sa-yuan-pureblood-spell-like','Spell-Like Abilities','Once-daily serpent spell-like abilities at caster level 4th.',80),
  ('mm1-rt-yuan-pureblood-alternate-form','yuan-ti-pureblood','mm1-sa-yuan-pureblood-alternate-form','Alternate Form','Assume Tiny through Large viper forms.',90),
  ('mm1-rt-yuan-pureblood-detect-poison','yuan-ti-pureblood','mm1-sa-yuan-pureblood-detect-poison','Detect Poison','Detect poison at caster level 6th.',100),
  ('mm1-rt-yuan-pureblood-sr','yuan-ti-pureblood',NULL,'Spell Resistance','Spell resistance equals 14 + class levels.',110)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
