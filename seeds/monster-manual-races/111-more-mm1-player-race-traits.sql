-- Normalized racial traits and named abilities for Aranea, Locathah, Merfolk, and Lamia.
-- Rules text is concise source-backed paraphrase for character creation display and rules lookup.

WITH abilities(id,source_page,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-aranea-poison','15','aranea-poison','Poison','Venom delivered by the aranea bite.','Injury poison from the bite; Fortitude save is Constitution-based. On a failed save it deals Strength damage initially and again as secondary damage.','extraordinary','none'),
  ('mm1-sa-aranea-web','15','aranea-web','Web','Throw a strong web in spider or hybrid form.','Up to six times per day in spider or hybrid form, make a ranged web attack with a maximum range of 50 feet and 10-foot range increment. The web can anchor creatures up to Large size until they escape or break it.','extraordinary','standard'),
  ('mm1-sa-aranea-change-shape','15-16','aranea-change-shape','Change Shape','Shift among spider, humanoid, and hybrid forms.','Assume a unique Small or Medium humanoid form or a Medium spider-humanoid hybrid. Humanoid form cannot use the aranea bite, poison, or web; hybrid form retains them and can use equipment.','supernatural','standard'),
  ('mm1-sa-aranea-spellcasting','15','aranea-racial-spellcasting','Racial Sorcerer Spellcasting','Innate arcane spellcasting from racial Hit Dice.','An aranea casts spells as a 3rd-level sorcerer. This is racial spellcasting and is separate from any class levels gained later.','other','none'),
  ('mm1-sa-merfolk-amphibious','186','merfolk-amphibious','Amphibious','Breathe both air and water.','A merfolk can breathe air and water.','extraordinary','none'),
  ('mm1-sa-lamia-spell-like','165','lamia-spell-like-abilities','Spell-Like Abilities','Innate deceptive and enchanting magic.','At will: disguise self and ventriloquism. Three times per day: charm monster, major image, mirror image, and suggestion. Once per day: deep slumber. Caster level 9th; save DCs are Charisma-based.','spell_like','standard'),
  ('mm1-sa-lamia-wisdom-drain','165','lamia-wisdom-drain','Wisdom Drain','A supernatural touch saps Wisdom.','A successful melee touch drains 1d4 points of Wisdom. This ability does not heal the lamia when it drains an opponent.','supernatural','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',source_page,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  source_page=excluded.source_page,
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
  ('mm1-rt-aranea-rhd','aranea',NULL,'Racial Hit Dice','3d10 magical beast racial Hit Dice; racial BAB +3 and base saves Fort +3, Ref +3, Will +1.',10),
  ('mm1-rt-aranea-darkvision','aranea',NULL,'Darkvision','Darkvision 60 ft.',20),
  ('mm1-rt-aranea-low-light','aranea',NULL,'Low-Light Vision','Low-light vision.',30),
  ('mm1-rt-aranea-natural-armor','aranea',NULL,'Natural Armor','+1 natural armor bonus.',40),
  ('mm1-rt-aranea-climb','aranea',NULL,'Climb Speed','Climb speed 25 ft.; the source also grants a strong racial Climb bonus and the ability to take 10 on Climb checks while rushed or threatened.',50),
  ('mm1-rt-aranea-poison','aranea','mm1-sa-aranea-poison','Poison','Bite-delivered Strength-damaging poison.',60),
  ('mm1-rt-aranea-web','aranea','mm1-sa-aranea-web','Web','Throw webs in spider or hybrid form up to six times per day.',70),
  ('mm1-rt-aranea-change-shape','aranea','mm1-sa-aranea-change-shape','Change Shape','Shift among natural spider, humanoid, and hybrid forms.',80),
  ('mm1-rt-aranea-spellcasting','aranea','mm1-sa-aranea-spellcasting','Racial Sorcerer Spellcasting','Casts as a 3rd-level sorcerer from its racial abilities.',90),
  ('mm1-rt-aranea-skills','aranea',NULL,'Racial Skills','Monster-entry racial-HD class skills are Climb, Concentration, Escape Artist, Jump, Listen, and Spot. Araneas also have racial bonuses on Jump, Listen, Spot, and Climb.',100),
  ('mm1-rt-aranea-iron-will','aranea',NULL,'Bonus Feat: Iron Will','Iron Will is marked as a racial bonus feat in the source entry. It is recorded as a trait until fixed race-feat grants are modeled explicitly.',110),

  ('mm1-rt-locathah-rhd','locathah',NULL,'Racial Hit Dice','2d8 humanoid racial Hit Dice; racial BAB +1 and source-backed base saves Fort +3, Ref +0, Will +0.',10),
  ('mm1-rt-locathah-aquatic','locathah',NULL,'Aquatic Humanoid','Aquatic humanoid subtype.',20),
  ('mm1-rt-locathah-natural-armor','locathah',NULL,'Natural Armor','+3 natural armor bonus.',30),
  ('mm1-rt-locathah-swim','locathah',NULL,'Powerful Swimmer','Swim speed 60 ft.; +8 racial bonus on Swim checks, may take 10 even when distracted or endangered, and may run while swimming in a straight line.',40),
  ('mm1-rt-locathah-skills','locathah',NULL,'Racial Skills','Monster-entry racial-HD class skills are Craft, Listen, Spot, and Swim.',50),

  ('mm1-rt-merfolk-aquatic','merfolk',NULL,'Aquatic Humanoid','Aquatic humanoid subtype.',10),
  ('mm1-rt-merfolk-no-rhd','merfolk',NULL,'Class-Level Hit Dice','The source presents a 1st-level warrior. Under the DMG monster-PC rule for creatures with 1 racial Hit Die or less, the racial Hit Die is replaced by the first class level.',20),
  ('mm1-rt-merfolk-amphibious','merfolk','mm1-sa-merfolk-amphibious','Amphibious','Can breathe both air and water.',30),
  ('mm1-rt-merfolk-low-light','merfolk',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-merfolk-swim','merfolk',NULL,'Powerful Swimmer','Swim speed 50 ft.; +8 racial bonus on Swim checks, may take 10 even when distracted or endangered, and may run while swimming in a straight line.',50),

  ('mm1-rt-lamia-large','lamia',NULL,'Large Build','Large size with the normal Large combat, Hide, grapple, lifting, carrying, space, and reach adjustments.',10),
  ('mm1-rt-lamia-rhd','lamia',NULL,'Racial Hit Dice','9d10 magical beast racial Hit Dice; racial BAB +9 and base saves Fort +6, Ref +6, Will +3.',20),
  ('mm1-rt-lamia-darkvision','lamia',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-lamia-low-light','lamia',NULL,'Low-Light Vision','Low-light vision.',40),
  ('mm1-rt-lamia-natural-armor','lamia',NULL,'Natural Armor','+7 natural armor bonus.',50),
  ('mm1-rt-lamia-spell-like','lamia','mm1-sa-lamia-spell-like','Spell-Like Abilities','Innate illusion and enchantment effects at caster level 9th.',60),
  ('mm1-rt-lamia-wisdom-drain','lamia','mm1-sa-lamia-wisdom-drain','Wisdom Drain','Melee touch drains 1d4 Wisdom.',70),
  ('mm1-rt-lamia-skills','lamia',NULL,'Racial Skills','Monster-entry racial-HD class skills are Bluff, Concentration, Diplomacy, Disguise, Hide, Intimidate, and Spot. Lamias have racial bonuses on Bluff and Hide.',80)
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
