-- Player's Handbook v3.5 Chapter 7 armor, shields, and armor accessories.
-- Source of truth: Table 7-6 and adjacent descriptions, pp. 122-126.
-- Mechanical text is concise/paraphrased; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player equipment, weapons, armor, gear, goods, and services.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,price_copper,weight_pounds,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text) AS (VALUES
('phb-item-padded','123-126','padded','Padded',500,10,'light',1,8,0,5,30,20,NULL),
('phb-item-leather','123-126','leather','Leather',1000,15,'light',2,6,0,10,30,20,NULL),
('phb-item-studded-leather','123-126','studded-leather','Studded leather',2500,20,'light',3,5,-1,15,30,20,NULL),
('phb-item-chain-shirt','123-126','chain-shirt','Chain shirt',10000,25,'light',4,4,-2,20,30,20,NULL),
('phb-item-hide','123-126','hide','Hide',1500,25,'medium',3,4,-3,20,20,15,NULL),
('phb-item-scale-mail','123-126','scale-mail','Scale mail',5000,30,'medium',4,3,-4,25,20,15,NULL),
('phb-item-chainmail','123-126','chainmail','Chainmail',15000,40,'medium',5,2,-5,30,20,15,NULL),
('phb-item-breastplate','123-126','breastplate','Breastplate',20000,30,'medium',5,3,-4,25,20,15,NULL),
('phb-item-splint-mail','123-126','splint-mail','Splint mail',20000,45,'heavy',6,0,-7,40,20,15,NULL),
('phb-item-banded-mail','123-126','banded-mail','Banded mail',25000,35,'heavy',6,1,-6,35,20,15,NULL),
('phb-item-half-plate','123-126','half-plate','Half-plate',60000,50,'heavy',7,0,-7,40,20,15,NULL),
('phb-item-full-plate','123-126','full-plate','Full plate',150000,50,'heavy',8,1,-6,35,20,15,NULL)
)
INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'phb-3.5',d.page,d.slug,d.name,'Player''s Handbook armor.',
       'Use the armor statistics in dnd35_armors; source descriptions govern donning, proficiency, sleeping, and movement interactions.',
       0,NULL,1,'armor',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d WHERE NOT EXISTS (SELECT 1 FROM dnd35_items i WHERE i.source_id='phb-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL);

WITH desired(item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text) AS (VALUES
('phb-item-padded','light',1,8,0,5,30,20,NULL),
('phb-item-leather','light',2,6,0,10,30,20,NULL),
('phb-item-studded-leather','light',3,5,-1,15,30,20,NULL),
('phb-item-chain-shirt','light',4,4,-2,20,30,20,NULL),
('phb-item-hide','medium',3,4,-3,20,20,15,NULL),
('phb-item-scale-mail','medium',4,3,-4,25,20,15,NULL),
('phb-item-chainmail','medium',5,2,-5,30,20,15,NULL),
('phb-item-breastplate','medium',5,3,-4,25,20,15,NULL),
('phb-item-splint-mail','heavy',6,0,-7,40,20,15,NULL),
('phb-item-banded-mail','heavy',6,1,-6,35,20,15,NULL),
('phb-item-half-plate','heavy',7,0,-7,40,20,15,NULL),
('phb-item-full-plate','heavy',8,1,-6,35,20,15,NULL)
)
INSERT OR IGNORE INTO dnd35_armors
 (item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text)
SELECT * FROM desired;

WITH desired(id,page,slug,name,price_copper,weight_pounds,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text) AS (VALUES
('phb-item-buckler','123-125','buckler','Buckler',1500,5,'buckler',1,NULL,-1,5,NULL,NULL,'Provides a shield bonus while leaving limited use of the shield hand; attack penalties may apply when using that arm.'),
('phb-item-shield-light-wooden','123-125','shield-light-wooden','Shield, light wooden',300,5,'light',1,NULL,-1,5,NULL,NULL,'Light wooden shield.'),
('phb-item-shield-light-steel','123-125','shield-light-steel','Shield, light steel',900,6,'light',1,NULL,-1,5,NULL,NULL,'Light steel shield.'),
('phb-item-shield-heavy-wooden','123-125','shield-heavy-wooden','Shield, heavy wooden',700,10,'heavy',2,NULL,-2,15,NULL,NULL,'Heavy wooden shield.'),
('phb-item-shield-heavy-steel','123-125','shield-heavy-steel','Shield, heavy steel',2000,15,'heavy',2,NULL,-2,15,NULL,NULL,'Heavy steel shield.'),
('phb-item-shield-tower','123-125','shield-tower','Shield, tower',3000,45,'tower',4,2,-10,50,NULL,NULL,'Provides +4 shield bonus or may instead grant cover; tower-shield special rules apply.')
)
INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'phb-3.5',d.page,d.slug,d.name,'Player''s Handbook shield.',d.special_text,0,NULL,1,'shield',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d WHERE NOT EXISTS (SELECT 1 FROM dnd35_items i WHERE i.source_id='phb-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL);

WITH desired(item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text) AS (VALUES
('phb-item-buckler','buckler',1,NULL,-1,5,NULL,NULL,'Provides a shield bonus while leaving limited use of the shield hand; attack penalties may apply when using that arm.'),
('phb-item-shield-light-wooden','light',1,NULL,-1,5,NULL,NULL,'Light wooden shield.'),
('phb-item-shield-light-steel','light',1,NULL,-1,5,NULL,NULL,'Light steel shield.'),
('phb-item-shield-heavy-wooden','heavy',2,NULL,-2,15,NULL,NULL,'Heavy wooden shield.'),
('phb-item-shield-heavy-steel','heavy',2,NULL,-2,15,NULL,NULL,'Heavy steel shield.'),
('phb-item-shield-tower','tower',4,2,-10,50,NULL,NULL,'Provides +4 shield bonus or may instead grant cover; tower-shield special rules apply.')
)
INSERT OR IGNORE INTO dnd35_shields
 (item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,speed_at_30_feet,speed_at_20_feet,special_text)
SELECT * FROM desired;

WITH desired(id,slug,name,price_copper,weight_pounds,rules_text) AS (VALUES
('phb-item-armor-spikes','armor-spikes','Armor spikes',5000,10,'Added to armor; allow spike attacks and grapple damage as described in the armor rules.'),
('phb-item-gauntlet-locked','gauntlet-locked','Gauntlet, locked',800,5,'Locks a held weapon into the hand; provides a bonus against disarm but the hand is not free while locked.'),
('phb-item-shield-spikes','shield-spikes','Shield spikes',1000,5,'Added to a light or heavy shield; converts shield-bash damage to piercing and increases damage as described in the shield rules.')
)
INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'phb-3.5','123-126',d.slug,d.name,'Armor or shield accessory from Table 7-6.',d.rules_text,0,NULL,1,'gear',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d WHERE NOT EXISTS (SELECT 1 FROM dnd35_items i WHERE i.source_id='phb-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL);
