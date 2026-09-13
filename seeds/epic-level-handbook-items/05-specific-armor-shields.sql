-- Epic Level Handbook specific epic armor and shields.
-- Source: Epic Level Handbook, Chapter 4, pp. 128-129.
-- Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,category,price_copper,weight_pounds,caster_level,enhancement_bonus,activation,activation_text,slot,craft_cost_copper,craft_xp_cost,crafting_text
) AS (VALUES
('elh-item-shapeshifters-armor','129','shapeshifters-armor','Shapeshifter''s Armor',
 'A +6 suit of hide armor designed to remain useful through transformations.',
 'This +6 hide armor grants its full Armor Class bonus regardless of the form the wearer assumes through polymorph, shapechange, wild shape, or similar abilities.',
 'armor',40016500,NULL,21,6,'continuous','Its full armor bonus remains effective through qualifying form changes.','body',20016500,14000,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; shapechange or wild shape ability.'),
('elh-item-warlords-breastplate','129','warlords-breastplate','Warlord''s Breastplate',
 'A +6 mithral breastplate that enhances command presence and attracts followers.',
 'This +6 mithral breastplate is considered light armor, has armor check penalty -1, maximum Dexterity +5, arcane spell failure 10%, and weighs 15 pounds. It grants +4 enhancement Charisma and lets the wearer attract followers as though possessing Leadership, but grants no cohort and does not stack with Leadership for follower count.',
 'armor',41620000,15.0,21,6,'continuous','Armor statistics, Charisma bonus, and follower attraction function while worn.','body',21020000,14120,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; charm monster; sympathy.'),
('elh-item-dragonskin-armor','129','dragonskin-armor','Dragonskin Armor',
 'A +5 suit of full plate made from great-wyrm dragon hide.',
 'This +5 full plate grants immunity to the energy type associated with the dragon hide used. On command it grows dragon wings, allowing fly speed 90 feet with clumsy maneuverability for a total of 4 hours per day. The wearer takes -4 circumstance on Diplomacy with dragons and gains +4 circumstance on Intimidate against dragons.',
 'armor',56455000,NULL,24,5,'other','Continuous energy immunity and social modifiers; command-activated wings for 4 total hours/day.','body',28325000,15629,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from elements; shapechange.'),
('elh-item-armor-celestial-battalion','128','armor-of-the-celestial-battalion','Armor of the Celestial Battalion',
 'Exceptionally light +7 chainmail protected by celestial magic.',
 'This +7 chainmail is considered light armor, can be concealed under normal clothing, allows maximum Dexterity +10, has no armor check penalty, and has arcane spell failure 10%. It grants fly at will and continuously surrounds the wearer with magic circle against evil; if dispelled, that effect can be recreated as a free action.',
 'armor',61630000,NULL,20,7,'continuous','Armor properties and protective circle are continuous; fly is at will; a dispelled circle may be recreated as a free action.','body',30830000,16160,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; creator must be good; magic circle against evil.'),
('elh-item-armor-abyssal-horde','128','armor-of-the-abyssal-horde','Armor of the Abyssal Horde',
 'A demonic-looking +6 suit of full plate with draining clawed gauntlets.',
 'This +6 full plate includes clawed gauntlets that function as +4 keen weapons dealing 1d10 damage with 19-20 threat and inflict an energy-drain effect on a hit unless Fortitude DC 23 succeeds. A nonevil wearer suffers two negative levels while the armor is worn; these disappear on removal and cannot become permanent level loss.',
 'armor',76826000,NULL,20,6,'continuous','Armor and gauntlet properties function while worn; nonevil wearers suffer the alignment drawback.','body',38526000,17660,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; creator must be evil; energy drain.'),
('elh-item-antimagic-armor','128','antimagic-armor','Antimagic Armor',
 'Adamantine full plate combining negating and invulnerability magic with resistance to dispelling.',
 'This +1 negating adamantine full plate of invulnerability has the material''s natural +3 enhancement contribution and imposes a -5 penalty on dispel checks made against the armor or its wearer.',
 'armor',87150000,NULL,21,1,'continuous','Its negating, invulnerability, material, and anti-dispel properties function while worn.','body',43650000,18700,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; greater dispelling; stoneskin; wish or miracle.'),
('elh-item-bulwark-great-dragon','129','bulwark-of-the-great-dragon','Bulwark of the Great Dragon',
 'A +6 large shield made from great-wyrm dragon scales.',
 'This +6 large shield provides energy resistance 50 matching the dragon type used. Three times per day, on command, it emits the matching breath weapon as an 80-foot line or 40-foot cone for 20d6 damage. Table 4-8 lists 1,612,980 gp while the adjacent prose lists 1,612,970 gp; the table value is preserved and the discrepancy is documented.',
 'shield',161298000,NULL,20,6,'other','Continuous energy resistance; command-activated breath weapon three times per day.','shield',80657000,26128,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from elements.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       d.category,d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='elh-3.0' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,enhancement_bonus,activation,activation_text,slot,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
('elh-item-shapeshifters-armor',21,6,'continuous','Its full armor bonus remains effective through qualifying form changes.','body',20016500,14000,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; shapechange or wild shape ability.'),
('elh-item-warlords-breastplate',21,6,'continuous','Armor statistics, Charisma bonus, and follower attraction function while worn.','body',21020000,14120,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; charm monster; sympathy.'),
('elh-item-dragonskin-armor',24,5,'other','Continuous energy immunity and social modifiers; command-activated wings for 4 total hours/day.','body',28325000,15629,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from elements; shapechange.'),
('elh-item-armor-celestial-battalion',20,7,'continuous','Armor properties and protective circle are continuous; fly is at will; a dispelled circle may be recreated as a free action.','body',30830000,16160,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; creator must be good; magic circle against evil.'),
('elh-item-armor-abyssal-horde',20,6,'continuous','Armor and gauntlet properties function while worn; nonevil wearers suffer the alignment drawback.','body',38526000,17660,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; creator must be evil; energy drain.'),
('elh-item-antimagic-armor',21,1,'continuous','Its negating, invulnerability, material, and anti-dispel properties function while worn.','body',43650000,18700,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; greater dispelling; stoneskin; wish or miracle.'),
('elh-item-bulwark-great-dragon',20,6,'other','Continuous energy resistance; command-activated breath weapon three times per day.','shield',80657000,26128,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from elements.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,d.slot,
       NULL,NULL,d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;
