-- Epic Level Handbook wondrous items, batch B.
-- Source: Epic Level Handbook, Chapter 4, pp. 144-146 and Table 4-25.
-- Each priced bonus variant is materialized as its own item row so loot, shops, and character equipment can reference an exact item.
-- Mechanical text is summarized; source remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,description,rules_text,price_copper,weight_pounds,caster_level,slot,crafting_text) AS (VALUES
('elh-item-gate-key','145-146','gate-key','Gate Key',
 'A configurable planar key that permanently attunes pairs of bounded spaces into linked portals.',
 'The wielder can attune one bounded space to another bounded space on a different plane that the wielder has previously visited. The paired portals are linked and the wielder sets a required key condition for travelers. Up to sixty portal pairs can be created. After sixty pairs, the item cannot create more portals, though it can remain a required key. Creatures lacking the proper key do not see the portals; true seeing or similar magic reveals them. CL 21st.',
 37800000,1.0,21,'slotless','Craft Wondrous Item; Craft Epic Wondrous Item; gate.'),

('elh-item-amulet-epic-natural-armor-6','144','amulet-of-epic-natural-armor-6','Amulet of Epic Natural Armor +6','Dragon-scale amulet granting +6 natural armor.','Grants a +6 natural armor bonus to AC. Creator caster level must be at least three times the amulet bonus. CL 20th.',72000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 18th.'),
('elh-item-amulet-epic-natural-armor-7','144','amulet-of-epic-natural-armor-7','Amulet of Epic Natural Armor +7','Dragon-scale amulet granting +7 natural armor.','Grants a +7 natural armor bonus to AC. Creator caster level must be at least three times the amulet bonus. CL 20th.',98000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 21st.'),
('elh-item-amulet-epic-natural-armor-8','144','amulet-of-epic-natural-armor-8','Amulet of Epic Natural Armor +8','Dragon-scale amulet granting +8 natural armor.','Grants a +8 natural armor bonus to AC. Creator caster level must be at least three times the amulet bonus. CL 20th.',128000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 24th.'),
('elh-item-amulet-epic-natural-armor-9','144','amulet-of-epic-natural-armor-9','Amulet of Epic Natural Armor +9','Dragon-scale amulet granting +9 natural armor.','Grants a +9 natural armor bonus to AC. Creator caster level must be at least three times the amulet bonus. CL 20th.',162000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 27th.'),
('elh-item-amulet-epic-natural-armor-10','144','amulet-of-epic-natural-armor-10','Amulet of Epic Natural Armor +10','Dragon-scale amulet granting +10 natural armor.','Grants a +10 natural armor bonus to AC. Creator caster level must be at least three times the amulet bonus. CL 20th.',200000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 30th.'),

('elh-item-belt-epic-strength-8','144','belt-of-epic-strength-8','Belt of Epic Strength +8','Adamantine-studded belt granting +8 enhancement Strength.','Grants a +8 enhancement bonus to Strength. CL 20th.',64000000,1.0,20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),
('elh-item-belt-epic-strength-10','144','belt-of-epic-strength-10','Belt of Epic Strength +10','Adamantine-studded belt granting +10 enhancement Strength.','Grants a +10 enhancement bonus to Strength. CL 20th.',100000000,1.0,20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),
('elh-item-belt-epic-strength-12','144','belt-of-epic-strength-12','Belt of Epic Strength +12','Adamantine-studded belt granting +12 enhancement Strength.','Grants a +12 enhancement bonus to Strength. CL 20th.',144000000,1.0,20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),

('elh-item-bracers-epic-health-8','145','bracers-of-epic-health-8','Bracers of Epic Health +8','Platinum arm bands granting +8 enhancement Constitution.','Grants a +8 enhancement bonus to Constitution. CL 20th.',64000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),
('elh-item-bracers-epic-health-10','145','bracers-of-epic-health-10','Bracers of Epic Health +10','Platinum arm bands granting +10 enhancement Constitution.','Grants a +10 enhancement bonus to Constitution. CL 20th.',100000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),
('elh-item-bracers-epic-health-12','145','bracers-of-epic-health-12','Bracers of Epic Health +12','Platinum arm bands granting +12 enhancement Constitution.','Grants a +12 enhancement bonus to Constitution. CL 20th.',144000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),

('elh-item-cloak-epic-charisma-8','145','cloak-of-epic-charisma-8','Cloak of Epic Charisma +8','Gold-trimmed cloak granting +8 enhancement Charisma.','Grants a +8 enhancement bonus to Charisma. CL 20th.',64000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),
('elh-item-cloak-epic-charisma-10','145','cloak-of-epic-charisma-10','Cloak of Epic Charisma +10','Gold-trimmed cloak granting +10 enhancement Charisma.','Grants a +10 enhancement bonus to Charisma. Table 4-25 gives a market price of 1,000,000 gp; a source extraction of the adjacent prose drops zeros, so the table value is preserved and the extraction discrepancy is documented separately. CL 20th.',100000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),
('elh-item-cloak-epic-charisma-12','145','cloak-of-epic-charisma-12','Cloak of Epic Charisma +12','Gold-trimmed cloak granting +12 enhancement Charisma.','Grants a +12 enhancement bonus to Charisma. CL 20th.',144000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),

('elh-item-cloak-epic-resistance-6','145-146','cloak-of-epic-resistance-6','Cloak of Epic Resistance +6','Protective cloak granting +6 resistance on all saving throws.','Grants a +6 resistance bonus on Fortitude, Reflex, and Will saves. Creator caster level must be at least three times the cloak bonus. CL 20th.',36000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 18th.'),
('elh-item-cloak-epic-resistance-7','145-146','cloak-of-epic-resistance-7','Cloak of Epic Resistance +7','Protective cloak granting +7 resistance on all saving throws.','Grants a +7 resistance bonus on Fortitude, Reflex, and Will saves. Creator caster level must be at least three times the cloak bonus. CL 20th.',49000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 21st.'),
('elh-item-cloak-epic-resistance-8','145-146','cloak-of-epic-resistance-8','Cloak of Epic Resistance +8','Protective cloak granting +8 resistance on all saving throws.','Grants a +8 resistance bonus on Fortitude, Reflex, and Will saves. Creator caster level must be at least three times the cloak bonus. CL 20th.',64000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 24th.'),
('elh-item-cloak-epic-resistance-9','145-146','cloak-of-epic-resistance-9','Cloak of Epic Resistance +9','Protective cloak granting +9 resistance on all saving throws.','Grants a +9 resistance bonus on Fortitude, Reflex, and Will saves. Creator caster level must be at least three times the cloak bonus. CL 20th.',81000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 27th.'),
('elh-item-cloak-epic-resistance-10','145-146','cloak-of-epic-resistance-10','Cloak of Epic Resistance +10','Protective cloak granting +10 resistance on all saving throws.','Grants a +10 resistance bonus on Fortitude, Reflex, and Will saves. Creator caster level must be at least three times the cloak bonus. CL 20th.',100000000,1.0,20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 30th.'),

('elh-item-gloves-epic-dexterity-8','146','gloves-of-epic-dexterity-8','Gloves of Epic Dexterity +8','Thin flexible gloves granting +8 enhancement Dexterity.','Grants a +8 enhancement bonus to Dexterity. CL 20th.',64000000,NULL,20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),
('elh-item-gloves-epic-dexterity-10','146','gloves-of-epic-dexterity-10','Gloves of Epic Dexterity +10','Thin flexible gloves granting +10 enhancement Dexterity.','Grants a +10 enhancement bonus to Dexterity. CL 20th.',100000000,NULL,20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),
('elh-item-gloves-epic-dexterity-12','146','gloves-of-epic-dexterity-12','Gloves of Epic Dexterity +12','Thin flexible gloves granting +12 enhancement Dexterity.','Grants a +12 enhancement bonus to Dexterity. CL 20th.',144000000,NULL,20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),

('elh-item-headband-epic-intellect-8','146','headband-of-epic-intellect-8','Headband of Epic Intellect +8','Diamond-set headband granting +8 enhancement Intelligence.','Grants a +8 enhancement bonus to Intelligence. CL 20th.',64000000,NULL,20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-headband-epic-intellect-10','146','headband-of-epic-intellect-10','Headband of Epic Intellect +10','Diamond-set headband granting +10 enhancement Intelligence.','Grants a +10 enhancement bonus to Intelligence. CL 20th.',100000000,NULL,20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-headband-epic-intellect-12','146','headband-of-epic-intellect-12','Headband of Epic Intellect +12','Diamond-set headband granting +12 enhancement Intelligence.','Grants a +12 enhancement bonus to Intelligence. CL 20th.',144000000,NULL,20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),

('elh-item-periapt-epic-wisdom-8','146','periapt-of-epic-wisdom-8','Periapt of Epic Wisdom +8','Large pearl on a platinum chain granting +8 enhancement Wisdom.','Grants a +8 enhancement bonus to Wisdom. CL 20th.',64000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-periapt-epic-wisdom-10','146','periapt-of-epic-wisdom-10','Periapt of Epic Wisdom +10','Large pearl on a platinum chain granting +10 enhancement Wisdom.','Grants a +10 enhancement bonus to Wisdom. CL 20th.',100000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-periapt-epic-wisdom-12','146','periapt-of-epic-wisdom-12','Periapt of Epic Wisdom +12','Large pearl on a platinum chain granting +12 enhancement Wisdom.','Grants a +12 enhancement bonus to Wisdom. CL 20th.',144000000,NULL,20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),

('elh-item-bracers-epic-armor-11','144-145','bracers-of-epic-armor-11','Bracers of Epic Armor +11','Force bracers granting +11 armor bonus to AC.','Both bracers must be worn. They create an invisible tangible force field granting a +11 armor bonus to AC. Creator caster level must be at least twice the bracers bonus. CL 20th.',121000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 22nd.'),
('elh-item-bracers-epic-armor-12','144-145','bracers-of-epic-armor-12','Bracers of Epic Armor +12','Force bracers granting +12 armor bonus to AC.','Both bracers must be worn. They create an invisible tangible force field granting a +12 armor bonus to AC. Creator caster level must be at least twice the bracers bonus. CL 20th.',144000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 24th.'),
('elh-item-bracers-epic-armor-13','144-145','bracers-of-epic-armor-13','Bracers of Epic Armor +13','Force bracers granting +13 armor bonus to AC.','Both bracers must be worn. They create an invisible tangible force field granting a +13 armor bonus to AC. Creator caster level must be at least twice the bracers bonus. CL 20th.',169000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 26th.'),
('elh-item-bracers-epic-armor-14','144-145','bracers-of-epic-armor-14','Bracers of Epic Armor +14','Force bracers granting +14 armor bonus to AC.','Both bracers must be worn. They create an invisible tangible force field granting a +14 armor bonus to AC. Creator caster level must be at least twice the bracers bonus. CL 20th.',196000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 28th.'),
('elh-item-bracers-epic-armor-15','144-145','bracers-of-epic-armor-15','Bracers of Epic Armor +15','Force bracers granting +15 armor bonus to AC.','Both bracers must be worn. They create an invisible tangible force field granting a +15 armor bonus to AC. Creator caster level must be at least twice the bracers bonus. CL 20th.',225000000,1.0,20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 30th.')
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

WITH desired(item_id,caster_level,slot,crafting_text) AS (VALUES
('elh-item-gate-key',21,'slotless','Craft Wondrous Item; Craft Epic Wondrous Item; gate.'),
('elh-item-amulet-epic-natural-armor-6',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 18th.'),
('elh-item-amulet-epic-natural-armor-7',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 21st.'),
('elh-item-amulet-epic-natural-armor-8',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 24th.'),
('elh-item-amulet-epic-natural-armor-9',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 27th.'),
('elh-item-amulet-epic-natural-armor-10',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; barkskin; creator caster level at least 30th.'),
('elh-item-belt-epic-strength-8',20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),
('elh-item-belt-epic-strength-10',20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),
('elh-item-belt-epic-strength-12',20,'waist','Craft Wondrous Item; Craft Epic Wondrous Item; bull''s strength.'),
('elh-item-bracers-epic-health-8',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),
('elh-item-bracers-epic-health-10',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),
('elh-item-bracers-epic-health-12',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; endurance.'),
('elh-item-cloak-epic-charisma-8',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),
('elh-item-cloak-epic-charisma-10',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),
('elh-item-cloak-epic-charisma-12',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; charm monster.'),
('elh-item-cloak-epic-resistance-6',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 18th.'),
('elh-item-cloak-epic-resistance-7',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 21st.'),
('elh-item-cloak-epic-resistance-8',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 24th.'),
('elh-item-cloak-epic-resistance-9',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 27th.'),
('elh-item-cloak-epic-resistance-10',20,'shoulders','Craft Wondrous Item; Craft Epic Wondrous Item; resistance; creator caster level at least 30th.'),
('elh-item-gloves-epic-dexterity-8',20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),
('elh-item-gloves-epic-dexterity-10',20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),
('elh-item-gloves-epic-dexterity-12',20,'hands','Craft Wondrous Item; Craft Epic Wondrous Item; cat''s grace.'),
('elh-item-headband-epic-intellect-8',20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-headband-epic-intellect-10',20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-headband-epic-intellect-12',20,'head','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-periapt-epic-wisdom-8',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-periapt-epic-wisdom-10',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-periapt-epic-wisdom-12',20,'throat','Craft Wondrous Item; Craft Epic Wondrous Item; commune or legend lore.'),
('elh-item-bracers-epic-armor-11',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 22nd.'),
('elh-item-bracers-epic-armor-12',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 24th.'),
('elh-item-bracers-epic-armor-13',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 26th.'),
('elh-item-bracers-epic-armor-14',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 28th.'),
('elh-item-bracers-epic-armor-15',20,'arms','Craft Wondrous Item; Craft Epic Wondrous Item; mage armor; creator caster level at least 30th.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,'continuous','Continuous while worn or, for the gate key, used as described by the item.',d.slot,
       NULL,NULL,0,NULL,NULL,d.crafting_text,NULL
FROM desired d;

-- Preserve an extraction conflict instead of silently trusting the damaged prose text.
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'elh-rule-source-note-cloak-epic-charisma-10','elh-3.0','145','elh-source-note-cloak-epic-charisma-10-price',
  'Source Note: Cloak of Epic Charisma +10 Price',
  'Table 4-25 prints Cloak of Epic Charisma +10 at 1,000,000 gp. The supplied PDF text extraction of the adjacent item prose drops zeros and renders the same price as 10,000 gp. The catalog uses the explicit table value and records the extraction discrepancy here.',
  'Table 4-25 prints Cloak of Epic Charisma +10 at 1,000,000 gp. The supplied PDF text extraction of the adjacent item prose drops zeros and renders the same price as 10,000 gp. The catalog uses the explicit table value and records the extraction discrepancy here.',
  0,NULL,0,'source-note','guidance',1,0,NULL,NULL,
  '["source-note","epic-magic-item","cloak-of-epic-charisma","pdf-extraction"]',
  '{"tablePriceGp":1000000,"extractedProsePriceGp":10000,"catalogChoice":"Table 4-25 value","reason":"obvious PDF extraction digit loss; discrepancy preserved explicitly"}'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='elh-3.0' AND r.slug='elh-source-note-cloak-epic-charisma-10-price' AND r.owner_user_id IS NULL
);
