-- Dungeon Master's Guide v3.5 Chapter 7: Table 7-7 Specific Armors, pp. 219-220.
-- Mechanical text is summarized; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(
 id,page,slug,name,description,rules_text,price_copper,weight_pounds,
 armor_category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,
 caster_level,enhancement_bonus,activation,activation_text,craft_cost_copper,craft_xp_cost,crafting_text
) AS (VALUES
('dmg-item-mithral-shirt','220','mithral-shirt','Mithral Shirt',
 'An exceptionally light chain shirt made from very fine mithral links.',
 'Nonmagical. Functions as light armor; maximum Dexterity bonus +6, no armor check penalty, 10% arcane spell failure, speed 30 ft. for Medium or 20 ft. for Small creatures, and weight 10 lb.',
 110000,10.0,'light',4,6,0,10,30,20,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-dragonhide-plate','220','dragonhide-plate','Dragonhide Plate',
 'Masterwork full plate fashioned from dragonhide instead of metal.',
 'Nonmagical. Otherwise identical to masterwork full plate. Because it is nonmetal dragonhide, druids can wear it without violating their armor restriction.',
 330000,50.0,'heavy',8,1,-5,35,20,15,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-elven-chain','220','elven-chain','Elven Chain',
 'Extremely light chainmail made from very fine mithral links.',
 'Nonmagical. Considered light armor; maximum Dexterity bonus +4, armor check penalty -2, 20% arcane spell failure, speed 30 ft. for Medium or 20 ft. for Small creatures, and weight 20 lb.',
 415000,20.0,'light',5,4,-2,20,30,20,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-rhino-hide','220','rhino-hide','Rhino Hide',
 'A suit of +2 hide armor made from rhinoceros hide.',
 'Has a -1 armor check penalty. In addition to its +2 enhancement bonus to AC, the wearer deals an extra 2d6 damage on any successful charge attack, including a mounted charge.',
 516500,25.0,'medium',3,4,-1,20,20,15,9,2,'continuous','The +2 enhancement and charge-damage benefit apply while worn.',266500,200,'Craft Magic Arms and Armor; bull''s strength.'),
('dmg-item-adamantine-breastplate','219-220','adamantine-breastplate','Adamantine Breastplate',
 'A nonmagical masterwork breastplate made from adamantine.',
 'Nonmagical. Grants damage reduction 2/- from its adamantine construction.',
 1020000,30.0,'medium',5,3,-3,25,20,15,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-dwarven-plate','220','dwarven-plate','Dwarven Plate',
 'A suit of full plate made from adamantine.',
 'Nonmagical. Its adamantine construction grants the wearer damage reduction 3/-.',
 1650000,50.0,'heavy',8,1,-5,35,20,15,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-banded-mail-luck','219-220','banded-mail-of-luck','Banded Mail of Luck',
 'Gem-adorned +3 banded mail capable of twisting one attack through luck.',
 'Once per week, before damage is rolled, the wearer can require an attack roll made against them to be rerolled. The second result must be accepted.',
 1890000,35.0,'heavy',6,1,-5,35,20,15,12,3,'other','The +3 enhancement is continuous; the wearer may force one attack reroll once per week before damage is rolled.',1015000,700,'Craft Magic Arms and Armor; bless.'),
('dmg-item-celestial-armor','219-220','celestial-armor','Celestial Armor',
 'Fine bright silver or gold +3 chainmail light enough to conceal beneath ordinary clothing.',
 'Considered light armor; maximum Dexterity bonus +8, armor check penalty -2, 15% arcane spell failure, weight 20 lb. Once per day the wearer can use fly on command as the spell.',
 2240000,20.0,'light',5,8,-2,15,30,20,5,3,'command_word','The +3 enhancement is continuous; command fly once per day.',1255000,1004,'Craft Magic Arms and Armor; creator must be good; fly.'),
('dmg-item-plate-armor-deep','220','plate-armor-of-the-deep','Plate Armor of the Deep',
 'Wave-and-fish decorated +1 full plate made for underwater adventuring.',
 'The wearer is treated as unarmored for Swim checks, can breathe underwater, and can converse with any creature that has a language and breathes water.',
 2465000,50.0,'heavy',8,1,-5,35,20,15,11,1,'continuous','The +1 enhancement and aquatic benefits function continuously while worn.',1715000,600,'Craft Magic Arms and Armor; freedom of movement; water breathing; tongues.'),
('dmg-item-breastplate-command','219-220','breastplate-of-command','Breastplate of Command',
 'A finely crafted +2 breastplate that projects an unmistakable aura of command.',
 'Grants +2 competence on Charisma checks, including turning checks and Charisma-based skill checks, and +2 competence to Leadership score. Friendly troops within 360 feet become braver than normal. The command effect fails while the wearer is hidden or concealed.',
 2540000,30.0,'medium',5,3,-3,25,20,15,15,2,'continuous','The +2 enhancement and command aura function while worn and visibly displayed.',1097500,850,'Craft Magic Arms and Armor; mass charm monster.'),
('dmg-item-mithral-full-plate-speed','220','mithral-full-plate-of-speed','Mithral Full Plate of Speed',
 'A fine +1 suit of mithral full plate that can accelerate its wearer.',
 'Considered medium armor; maximum Dexterity bonus +3, armor check penalty -3, 25% arcane spell failure, speed 20 ft. for Medium or 15 ft. for Small creatures, and weight 25 lb. As a free action the wearer can gain haste for up to 10 rounds per day; the rounds need not be consecutive.',
 2650000,25.0,'medium',8,3,-3,25,20,15,5,1,'other','The +1 enhancement is continuous; activating haste is a free action and expends from a pool of 10 rounds per day.',NULL,NULL,'Craft Magic Arms and Armor; haste.'),
('dmg-item-demon-armor','219-220','demon-armor','Demon Armor',
 'Demonic-looking +4 full plate with clawed vambraces and gauntlets.',
 'Allows claw attacks dealing 1d10 damage; the claws strike as +1 weapons and a normal melee claw hit can inflict contagion (Fortitude DC 14 negates). A nonevil wearer gains one persistent negative level while the armor is worn; it never becomes permanent level loss and cannot be removed while the armor remains worn.',
 5226000,50.0,'heavy',8,1,-5,35,20,15,13,4,'continuous','The +4 enhancement, claw properties, and nonevil-wearer drawback function while worn.',2613000,2090,'Craft Magic Arms and Armor; contagion.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dmg-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'armor',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,armor_category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text) AS (VALUES
('dmg-item-mithral-shirt','light',4,6,0,10,30,20,'Mithral chain shirt; nonmagical.'),
('dmg-item-dragonhide-plate','heavy',8,1,-5,35,20,15,'Dragonhide masterwork full plate; druid-compatible nonmetal construction.'),
('dmg-item-elven-chain','light',5,4,-2,20,30,20,'Mithral chainmail treated as light armor.'),
('dmg-item-rhino-hide','medium',3,4,-1,20,20,15,'+2 hide; +2d6 damage on successful charge attacks.'),
('dmg-item-adamantine-breastplate','medium',5,3,-3,25,20,15,'Adamantine breastplate; DR 2/-.'),
('dmg-item-dwarven-plate','heavy',8,1,-5,35,20,15,'Adamantine full plate; DR 3/-.'),
('dmg-item-banded-mail-luck','heavy',6,1,-5,35,20,15,'+3 banded mail; force an incoming attack reroll once per week.'),
('dmg-item-celestial-armor','light',5,8,-2,15,30,20,'+3 celestial chainmail; fly once per day.'),
('dmg-item-plate-armor-deep','heavy',8,1,-5,35,20,15,'+1 full plate; aquatic movement/communication support.'),
('dmg-item-breastplate-command','medium',5,3,-3,25,20,15,'+2 breastplate; command and Leadership benefits while visibly worn.'),
('dmg-item-mithral-full-plate-speed','medium',8,3,-3,25,20,15,'+1 mithral full plate; haste up to 10 rounds/day.'),
('dmg-item-demon-armor','heavy',8,1,-5,35,20,15,'+4 full plate; claw attacks and nonevil-wearer negative level.')
)
INSERT OR IGNORE INTO dnd35_armors
 (item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text)
SELECT * FROM desired;

WITH desired(item_id,caster_level,enhancement_bonus,activation,activation_text,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
('dmg-item-rhino-hide',9,2,'continuous','Enhancement and charge bonus function while worn.',266500,200,'Craft Magic Arms and Armor; bull''s strength.'),
('dmg-item-banded-mail-luck',12,3,'other','Enhancement is continuous; force one incoming attack reroll once per week before damage.',1015000,700,'Craft Magic Arms and Armor; bless.'),
('dmg-item-celestial-armor',5,3,'command_word','Enhancement is continuous; command fly once per day.',1255000,1004,'Craft Magic Arms and Armor; creator must be good; fly.'),
('dmg-item-plate-armor-deep',11,1,'continuous','Enhancement and aquatic benefits function while worn.',1715000,600,'Craft Magic Arms and Armor; freedom of movement; water breathing; tongues.'),
('dmg-item-breastplate-command',15,2,'continuous','Enhancement and command aura function while worn and visibly displayed.',1097500,850,'Craft Magic Arms and Armor; mass charm monster.'),
('dmg-item-mithral-full-plate-speed',5,1,'other','Enhancement is continuous; haste is activated as a free action from a 10-round daily pool.',NULL,NULL,'Craft Magic Arms and Armor; haste.'),
('dmg-item-demon-armor',13,4,'continuous','Enhancement, claw effects, and alignment drawback function while worn.',2613000,2090,'Craft Magic Arms and Armor; contagion.')
)
INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,'body',
       NULL,NULL,d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;

WITH desired(slug,name,summary,mechanics) AS (VALUES
('dmg-specific-armor-table','Specific Armor Generation Table',
 'Table 7-7 maps minor, medium, and major specific-armor percentile results to the twelve listed specific armors.',
 '{"minor":[{"min":1,"max":50,"slug":"mithral-shirt"},{"min":51,"max":80,"slug":"dragonhide-plate"},{"min":81,"max":100,"slug":"elven-chain"}],"medium":[{"min":1,"max":25,"slug":"mithral-shirt"},{"min":26,"max":45,"slug":"dragonhide-plate"},{"min":46,"max":57,"slug":"elven-chain"},{"min":58,"max":67,"slug":"rhino-hide"},{"min":68,"max":82,"slug":"adamantine-breastplate"},{"min":83,"max":97,"slug":"dwarven-plate"},{"min":98,"max":100,"slug":"banded-mail-of-luck"}],"major":[{"min":1,"max":10,"slug":"adamantine-breastplate"},{"min":11,"max":20,"slug":"dwarven-plate"},{"min":21,"max":32,"slug":"banded-mail-of-luck"},{"min":33,"max":50,"slug":"celestial-armor"},{"min":51,"max":60,"slug":"plate-armor-of-the-deep"},{"min":61,"max":75,"slug":"breastplate-of-command"},{"min":76,"max":90,"slug":"mithral-full-plate-of-speed"},{"min":91,"max":100,"slug":"demon-armor"}]}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5','219-220',d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items','table',0,1,NULL,NULL,'["magic-items","armor","random-generation"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
