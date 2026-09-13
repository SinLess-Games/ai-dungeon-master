-- Epic Level Handbook wondrous items, batch A.
-- Source: Epic Level Handbook, Chapter 4, pp. 144-146. Mechanical text is summarized; source remains authoritative.
-- Craft gp/XP and aura fields are left NULL unless the retrieved source explicitly supplies them; market prices are exact source prices.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,description,rules_text,price_copper,weight_pounds) AS (VALUES
('elh-item-boots-of-swiftness','144-145','boots-of-swiftness','Boots of Swiftness',
 'Epic boots combining extraordinary speed, agility, evasion, jumping, skill bonuses, and limited haste.',
 'The wearer gains +6 enhancement Dexterity, doubled speed that does not stack with other magical or supernatural speed enhancement, evasion as the rogue feature, no height-based cap on jumping distance, and +20 competence on Balance, Climb, Jump, and Tumble. Three times per day a command word activates haste for 20 rounds. CL 20th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, cat''s grace, expeditious retreat, haste, jump.',
 25600000,1.0),
('elh-item-cabinet-of-feasting','145','cabinet-of-feasting','Cabinet of Feasting',
 'An epic cabinet that produces repeated heroes'' feasts for large groups.',
 'Three times per day, opening the cabinet produces a fresh feast for up to forty people with all qualities and benefits of heroes'' feast. CL 40th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, heroes'' feast.',
 28800000,20.0),
('elh-item-mantle-epic-spell-resistance','145-146','mantle-of-epic-spell-resistance','Mantle of Epic Spell Resistance',
 'An embroidered mantle granting exceptional protection against spells.',
 'Grants spell resistance 40 while worn. CL 29th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, spell resistance.',
 29000000,1.0),
('elh-item-mantle-great-stealth','145-146','mantle-of-great-stealth','Mantle of Great Stealth',
 'A neutral-gray epic cloak that conceals its wearer physically and magically.',
 'Grants +30 on Hide and Move Silently, constant one-half concealment with 20% miss chance as blur, and nondetection. CL 20th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, blur, invisibility, nondetection, silence.',
 24200000,1.0),
('elh-item-horseshoes-peerless-steed','145-146','horseshoes-of-the-peerless-steed','Horseshoes of the Peerless Steed',
 'Epic horseshoes that turn a mount and rider into exceptional mounted combatants.',
 'Grant the wearer or rider, as appropriate, the benefits of Trample, Ride-By Attack, and Spirited Charge. The wearer gains spell resistance 32 against enchantment effects, and its ground speed doubles. CL 20th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, Ride skill, haste, spell resistance. The source states Weight: 1 lb. each; aggregate set weight is intentionally not inferred here.',
 21700000,NULL),
('elh-item-bracers-relentless-might','145','bracers-of-relentless-might','Bracers of Relentless Might',
 'Adamantine epic bracers that massively increase physical might and effective combat size.',
 'Grant +12 enhancement Strength and +12 enhancement Constitution. For combat-related opposed checks whose modifier depends on size, including bull rush, grapple, and trip, the wearer is treated as two size categories larger, to a maximum of Colossal. CL 20th. Prerequisites: Craft Wondrous Item, Craft Epic Wondrous Item, bull''s strength, endurance, enlarge.',
 438400000,1.0)
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'magic',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='elh-3.0' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,activation,activation_text,slot,crafting_text) AS (VALUES
('elh-item-boots-of-swiftness',20,'other','Most benefits are continuous while worn; haste is command-word activated up to three times per day for 20 rounds.','feet','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace; expeditious retreat; haste; jump.'),
('elh-item-cabinet-of-feasting',40,'use_activated','Open the cabinet; up to three feasts can be produced per day.','slotless','Craft Wondrous Item; Craft Epic Wondrous Item; heroes'' feast.'),
('elh-item-mantle-epic-spell-resistance',29,'continuous','Spell resistance 40 functions continuously while the mantle is worn.','shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; spell resistance.'),
('elh-item-mantle-great-stealth',20,'continuous','Skill bonuses, concealment, and nondetection function continuously while worn.','shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; blur; invisibility; nondetection; silence.'),
('elh-item-horseshoes-peerless-steed',20,'continuous','Mounted-combat benefits, enchantment spell resistance, and doubled ground speed function while worn.','feet','Craft Wondrous Item; Craft Epic Wondrous Item; Ride skill; haste; spell resistance.'),
('elh-item-bracers-relentless-might',20,'continuous','Ability bonuses and effective combat-size increase function continuously while worn.','arms','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength; endurance; enlarge.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,d.slot,
       NULL,NULL,0,NULL,NULL,d.crafting_text,NULL
FROM desired d;
