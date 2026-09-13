-- Dungeon Master's Guide v3.5 Chapter 7: potions and oils, pp. 229-230.
-- Table 7-17 is represented both as concrete consumable catalog rows and as the random-generation table.
-- Spell effects are intentionally referenced by name; the spell catalog remains authoritative for the actual spell mechanics.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(id,slug,name,form,spell_name,price_copper,caster_level,description) AS (VALUES
  ('dmg-potion-cure-light-wounds','potion-cure-light-wounds','Potion of Cure Light Wounds','potion','cure light wounds',5000,1,'Single-use potion duplicating cure light wounds.'),
  ('dmg-potion-endure-elements','potion-endure-elements','Potion of Endure Elements','potion','endure elements',5000,1,'Single-use potion duplicating endure elements.'),
  ('dmg-potion-hide-from-animals','potion-hide-from-animals','Potion of Hide from Animals','potion','hide from animals',5000,1,'Single-use potion duplicating hide from animals.'),
  ('dmg-potion-hide-from-undead','potion-hide-from-undead','Potion of Hide from Undead','potion','hide from undead',5000,1,'Single-use potion duplicating hide from undead.'),
  ('dmg-potion-jump','potion-jump','Potion of Jump','potion','jump',5000,1,'Single-use potion duplicating jump.'),
  ('dmg-potion-mage-armor','potion-mage-armor','Potion of Mage Armor','potion','mage armor',5000,1,'Single-use potion duplicating mage armor.'),
  ('dmg-potion-magic-fang','potion-magic-fang','Potion of Magic Fang','potion','magic fang',5000,1,'Single-use potion duplicating magic fang.'),
  ('dmg-oil-magic-stone','oil-magic-stone','Oil of Magic Stone','oil','magic stone',5000,1,'Single-use oil duplicating magic stone on the object to which it is applied.'),
  ('dmg-oil-magic-weapon','oil-magic-weapon','Oil of Magic Weapon','oil','magic weapon',5000,1,'Single-use oil duplicating magic weapon on the object to which it is applied.'),
  ('dmg-potion-pass-without-trace','potion-pass-without-trace','Potion of Pass without Trace','potion','pass without trace',5000,1,'Single-use potion duplicating pass without trace.'),
  ('dmg-potion-protection-alignment','potion-protection-from-alignment','Potion of Protection from Alignment','potion','protection from alignment',5000,1,'Single-use potion duplicating one creator-chosen protection from alignment variant.'),
  ('dmg-potion-remove-fear','potion-remove-fear','Potion of Remove Fear','potion','remove fear',5000,1,'Single-use potion duplicating remove fear.'),
  ('dmg-potion-sanctuary','potion-sanctuary','Potion of Sanctuary','potion','sanctuary',5000,1,'Single-use potion duplicating sanctuary.'),
  ('dmg-potion-shield-faith-2','potion-shield-of-faith-2','Potion of Shield of Faith +2','potion','shield of faith',5000,1,'Single-use potion of shield of faith at a caster level that grants +2 deflection AC.'),
  ('dmg-oil-shillelagh','oil-shillelagh','Oil of Shillelagh','oil','shillelagh',5000,1,'Single-use oil duplicating shillelagh on the object to which it is applied.'),
  ('dmg-oil-bless-weapon','oil-bless-weapon','Oil of Bless Weapon','oil','bless weapon',10000,2,'Single-use oil duplicating bless weapon.'),
  ('dmg-potion-enlarge-person','potion-enlarge-person','Potion of Enlarge Person','potion','enlarge person',25000,5,'Single-use potion of enlarge person at the Table 7-17 caster level.'),
  ('dmg-potion-reduce-person','potion-reduce-person','Potion of Reduce Person','potion','reduce person',25000,5,'Single-use potion of reduce person at the Table 7-17 caster level.'),
  ('dmg-potion-aid','potion-aid','Potion of Aid','potion','aid',30000,3,'Single-use potion duplicating aid.'),
  ('dmg-potion-barkskin-2','potion-barkskin-2','Potion of Barkskin +2','potion','barkskin',30000,3,'Single-use barkskin potion at caster level 3, granting +2 natural armor.'),
  ('dmg-potion-bears-endurance','potion-bears-endurance','Potion of Bear''s Endurance','potion','bear''s endurance',30000,3,'Single-use potion duplicating bear''s endurance.'),
  ('dmg-potion-blur','potion-blur','Potion of Blur','potion','blur',30000,3,'Single-use potion duplicating blur.'),
  ('dmg-potion-bulls-strength','potion-bulls-strength','Potion of Bull''s Strength','potion','bull''s strength',30000,3,'Single-use potion duplicating bull''s strength.'),
  ('dmg-potion-cats-grace','potion-cats-grace','Potion of Cat''s Grace','potion','cat''s grace',30000,3,'Single-use potion duplicating cat''s grace.'),
  ('dmg-potion-cure-moderate-wounds','potion-cure-moderate-wounds','Potion of Cure Moderate Wounds','potion','cure moderate wounds',30000,3,'Single-use potion duplicating cure moderate wounds.'),
  ('dmg-oil-darkness','oil-darkness','Oil of Darkness','oil','darkness',30000,3,'Single-use oil duplicating darkness.'),
  ('dmg-potion-darkvision','potion-darkvision','Potion of Darkvision','potion','darkvision',30000,3,'Single-use potion duplicating darkvision.'),
  ('dmg-potion-delay-poison','potion-delay-poison','Potion of Delay Poison','potion','delay poison',30000,3,'Single-use potion duplicating delay poison.'),
  ('dmg-potion-eagles-splendor','potion-eagles-splendor','Potion of Eagle''s Splendor','potion','eagle''s splendor',30000,3,'Single-use potion duplicating eagle''s splendor.'),
  ('dmg-potion-foxs-cunning','potion-foxs-cunning','Potion of Fox''s Cunning','potion','fox''s cunning',30000,3,'Single-use potion duplicating fox''s cunning.'),
  ('dmg-potion-invisibility','potion-invisibility','Potion of Invisibility','potion','invisibility',30000,3,'Potion-form Table 7-17 invisibility consumable.'),
  ('dmg-oil-invisibility','oil-invisibility','Oil of Invisibility','oil','invisibility',30000,3,'Oil-form Table 7-17 invisibility consumable.'),
  ('dmg-potion-lesser-restoration','potion-lesser-restoration','Potion of Lesser Restoration','potion','lesser restoration',30000,3,'Single-use potion duplicating lesser restoration.'),
  ('dmg-potion-levitate','potion-levitate','Potion of Levitate','potion','levitate',30000,3,'Potion-form Table 7-17 levitate consumable.'),
  ('dmg-oil-levitate','oil-levitate','Oil of Levitate','oil','levitate',30000,3,'Oil-form Table 7-17 levitate consumable.'),
  ('dmg-potion-misdirection','potion-misdirection','Potion of Misdirection','potion','misdirection',30000,3,'Single-use potion duplicating misdirection.'),
  ('dmg-potion-owls-wisdom','potion-owls-wisdom','Potion of Owl''s Wisdom','potion','owl''s wisdom',30000,3,'Single-use potion duplicating owl''s wisdom.'),
  ('dmg-potion-protection-arrows-10','potion-protection-from-arrows-10','Potion of Protection from Arrows 10/Magic','potion','protection from arrows',30000,3,'Single-use protection from arrows potion at caster level 3.'),
  ('dmg-potion-remove-paralysis','potion-remove-paralysis','Potion of Remove Paralysis','potion','remove paralysis',30000,3,'Single-use potion duplicating remove paralysis.'),
  ('dmg-potion-resist-energy-10','potion-resist-energy-10','Potion of Resist Energy 10','potion','resist energy',30000,3,'Single-use potion of resist energy for a creator-chosen energy type, providing resistance 10.'),
  ('dmg-potion-shield-faith-3','potion-shield-of-faith-3','Potion of Shield of Faith +3','potion','shield of faith',30000,6,'Single-use shield of faith potion at caster level 6, granting +3 deflection AC.'),
  ('dmg-potion-spider-climb','potion-spider-climb','Potion of Spider Climb','potion','spider climb',30000,3,'Single-use potion duplicating spider climb.'),
  ('dmg-potion-undetectable-alignment','potion-undetectable-alignment','Potion of Undetectable Alignment','potion','undetectable alignment',30000,3,'Single-use potion duplicating undetectable alignment.'),
  ('dmg-potion-barkskin-3','potion-barkskin-3','Potion of Barkskin +3','potion','barkskin',60000,6,'Single-use barkskin potion at caster level 6, granting +3 natural armor.'),
  ('dmg-potion-shield-faith-4','potion-shield-of-faith-4','Potion of Shield of Faith +4','potion','shield of faith',60000,12,'Single-use shield of faith potion at caster level 12, granting +4 deflection AC.'),
  ('dmg-potion-resist-energy-20','potion-resist-energy-20','Potion of Resist Energy 20','potion','resist energy',70000,7,'Single-use potion of resist energy for a creator-chosen energy type, providing resistance 20.'),
  ('dmg-potion-cure-serious-wounds','potion-cure-serious-wounds','Potion of Cure Serious Wounds','potion','cure serious wounds',75000,5,'Single-use potion duplicating cure serious wounds.'),
  ('dmg-oil-daylight','oil-daylight','Oil of Daylight','oil','daylight',75000,5,'Single-use oil duplicating daylight.'),
  ('dmg-potion-displacement','potion-displacement','Potion of Displacement','potion','displacement',75000,5,'Single-use potion duplicating displacement.'),
  ('dmg-oil-flame-arrow','oil-flame-arrow','Oil of Flame Arrow','oil','flame arrow',75000,5,'Single-use oil duplicating flame arrow.'),
  ('dmg-potion-fly','potion-fly','Potion of Fly','potion','fly',75000,5,'Single-use potion duplicating fly.'),
  ('dmg-potion-gaseous-form','potion-gaseous-form','Potion of Gaseous Form','potion','gaseous form',75000,5,'Single-use potion duplicating gaseous form.'),
  ('dmg-potion-greater-magic-fang-1','potion-greater-magic-fang-1','Potion of Greater Magic Fang +1','potion','greater magic fang',75000,5,'Single-use greater magic fang potion granting +1 enhancement.'),
  ('dmg-oil-greater-magic-weapon-1','oil-greater-magic-weapon-1','Oil of Greater Magic Weapon +1','oil','greater magic weapon',75000,5,'Single-use oil of greater magic weapon granting +1 enhancement.'),
  ('dmg-potion-haste','potion-haste','Potion of Haste','potion','haste',75000,5,'Single-use potion duplicating haste.'),
  ('dmg-potion-heroism','potion-heroism','Potion of Heroism','potion','heroism',75000,5,'Single-use potion duplicating heroism.'),
  ('dmg-oil-keen-edge','oil-keen-edge','Oil of Keen Edge','oil','keen edge',75000,5,'Single-use oil duplicating keen edge.'),
  ('dmg-potion-magic-circle-alignment','potion-magic-circle-against-alignment','Potion of Magic Circle against Alignment','potion','magic circle against alignment',75000,5,'Single-use potion duplicating one creator-chosen magic circle against alignment variant.'),
  ('dmg-oil-magic-vestment-1','oil-magic-vestment-1','Oil of Magic Vestment +1','oil','magic vestment',75000,5,'Single-use oil of magic vestment granting +1 enhancement.'),
  ('dmg-potion-neutralize-poison','potion-neutralize-poison','Potion of Neutralize Poison','potion','neutralize poison',75000,5,'Single-use potion duplicating neutralize poison.'),
  ('dmg-potion-nondetection','potion-nondetection','Potion of Nondetection','potion','nondetection',75000,5,'Single-use potion duplicating nondetection.'),
  ('dmg-potion-protection-energy','potion-protection-from-energy','Potion of Protection from Energy','potion','protection from energy',75000,5,'Single-use potion of protection from energy for a creator-chosen energy type.'),
  ('dmg-potion-rage','potion-rage','Potion of Rage','potion','rage',75000,5,'Single-use potion duplicating rage.'),
  ('dmg-potion-remove-blindness-deafness','potion-remove-blindness-deafness','Potion of Remove Blindness/Deafness','potion','remove blindness/deafness',75000,5,'Single-use potion duplicating remove blindness/deafness.'),
  ('dmg-potion-remove-curse','potion-remove-curse','Potion of Remove Curse','potion','remove curse',75000,5,'Single-use potion duplicating remove curse.'),
  ('dmg-potion-remove-disease','potion-remove-disease','Potion of Remove Disease','potion','remove disease',75000,5,'Single-use potion duplicating remove disease.'),
  ('dmg-potion-tongues','potion-tongues','Potion of Tongues','potion','tongues',75000,5,'Single-use potion duplicating tongues.'),
  ('dmg-potion-water-breathing','potion-water-breathing','Potion of Water Breathing','potion','water breathing',75000,5,'Single-use potion duplicating water breathing.'),
  ('dmg-potion-water-walk','potion-water-walk','Potion of Water Walk','potion','water walk',75000,5,'Single-use potion duplicating water walk.'),
  ('dmg-potion-barkskin-4','potion-barkskin-4','Potion of Barkskin +4','potion','barkskin',90000,9,'Single-use barkskin potion at caster level 9, granting +4 natural armor.'),
  ('dmg-potion-shield-faith-5','potion-shield-of-faith-5','Potion of Shield of Faith +5','potion','shield of faith',90000,18,'Single-use shield of faith potion at caster level 18, granting +5 deflection AC.'),
  ('dmg-potion-good-hope','potion-good-hope','Potion of Good Hope','potion','good hope',105000,7,'Single-use potion of good hope at the Table 7-17 caster level.'),
  ('dmg-potion-resist-energy-30','potion-resist-energy-30','Potion of Resist Energy 30','potion','resist energy',110000,11,'Single-use potion of resist energy for a creator-chosen energy type, providing resistance 30.'),
  ('dmg-potion-barkskin-5','potion-barkskin-5','Potion of Barkskin +5','potion','barkskin',120000,12,'Single-use barkskin potion at caster level 12, granting +5 natural armor.'),
  ('dmg-potion-greater-magic-fang-2','potion-greater-magic-fang-2','Potion of Greater Magic Fang +2','potion','greater magic fang',120000,8,'Single-use greater magic fang potion granting +2 enhancement.'),
  ('dmg-oil-greater-magic-weapon-2','oil-greater-magic-weapon-2','Oil of Greater Magic Weapon +2','oil','greater magic weapon',120000,8,'Single-use oil of greater magic weapon granting +2 enhancement.'),
  ('dmg-oil-magic-vestment-2','oil-magic-vestment-2','Oil of Magic Vestment +2','oil','magic vestment',120000,8,'Single-use oil of magic vestment granting +2 enhancement.'),
  ('dmg-potion-protection-arrows-15','potion-protection-from-arrows-15','Potion of Protection from Arrows 15/Magic','potion','protection from arrows',150000,15,'Single-use protection from arrows potion at caster level 15.'),
  ('dmg-potion-greater-magic-fang-3','potion-greater-magic-fang-3','Potion of Greater Magic Fang +3','potion','greater magic fang',180000,12,'Single-use greater magic fang potion granting +3 enhancement.'),
  ('dmg-oil-greater-magic-weapon-3','oil-greater-magic-weapon-3','Oil of Greater Magic Weapon +3','oil','greater magic weapon',180000,12,'Single-use oil of greater magic weapon granting +3 enhancement.'),
  ('dmg-oil-magic-vestment-3','oil-magic-vestment-3','Oil of Magic Vestment +3','oil','magic vestment',180000,12,'Single-use oil of magic vestment granting +3 enhancement.'),
  ('dmg-potion-greater-magic-fang-4','potion-greater-magic-fang-4','Potion of Greater Magic Fang +4','potion','greater magic fang',240000,16,'Single-use greater magic fang potion granting +4 enhancement.'),
  ('dmg-oil-greater-magic-weapon-4','oil-greater-magic-weapon-4','Oil of Greater Magic Weapon +4','oil','greater magic weapon',240000,16,'Single-use oil of greater magic weapon granting +4 enhancement.'),
  ('dmg-oil-magic-vestment-4','oil-magic-vestment-4','Oil of Magic Vestment +4','oil','magic vestment',240000,16,'Single-use oil of magic vestment granting +4 enhancement.'),
  ('dmg-potion-greater-magic-fang-5','potion-greater-magic-fang-5','Potion of Greater Magic Fang +5','potion','greater magic fang',300000,20,'Single-use greater magic fang potion granting +5 enhancement.'),
  ('dmg-oil-greater-magic-weapon-5','oil-greater-magic-weapon-5','Oil of Greater Magic Weapon +5','oil','greater magic weapon',300000,20,'Single-use oil of greater magic weapon granting +5 enhancement.'),
  ('dmg-oil-magic-vestment-5','oil-magic-vestment-5','Oil of Magic Vestment +5','oil','magic vestment',300000,20,'Single-use oil of magic vestment granting +5 enhancement.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dmg-3.5','229-230',d.slug,d.name,d.description,
       CASE WHEN d.form='potion'
            THEN 'Single use. Drink as a standard action; the drinker is the effective target and caster of the stored spell effect. Stored spell: '||d.spell_name||'.'
            ELSE 'Single use. Apply as an oil; the applicator is the effective caster and the object is the target. Stored spell: '||d.spell_name||'.' END,
       0,NULL,1,'consumable',d.price_copper,NULL,NULL,1,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,form,spell_name) AS (VALUES
  ('dmg-potion-cure-light-wounds',1,'potion','cure light wounds'),('dmg-potion-endure-elements',1,'potion','endure elements'),('dmg-potion-hide-from-animals',1,'potion','hide from animals'),('dmg-potion-hide-from-undead',1,'potion','hide from undead'),('dmg-potion-jump',1,'potion','jump'),('dmg-potion-mage-armor',1,'potion','mage armor'),('dmg-potion-magic-fang',1,'potion','magic fang'),('dmg-oil-magic-stone',1,'oil','magic stone'),('dmg-oil-magic-weapon',1,'oil','magic weapon'),('dmg-potion-pass-without-trace',1,'potion','pass without trace'),('dmg-potion-protection-alignment',1,'potion','protection from alignment'),('dmg-potion-remove-fear',1,'potion','remove fear'),('dmg-potion-sanctuary',1,'potion','sanctuary'),('dmg-potion-shield-faith-2',1,'potion','shield of faith'),('dmg-oil-shillelagh',1,'oil','shillelagh'),('dmg-oil-bless-weapon',2,'oil','bless weapon'),('dmg-potion-enlarge-person',5,'potion','enlarge person'),('dmg-potion-reduce-person',5,'potion','reduce person'),('dmg-potion-aid',3,'potion','aid'),('dmg-potion-barkskin-2',3,'potion','barkskin'),('dmg-potion-bears-endurance',3,'potion','bear''s endurance'),('dmg-potion-blur',3,'potion','blur'),('dmg-potion-bulls-strength',3,'potion','bull''s strength'),('dmg-potion-cats-grace',3,'potion','cat''s grace'),('dmg-potion-cure-moderate-wounds',3,'potion','cure moderate wounds'),('dmg-oil-darkness',3,'oil','darkness'),('dmg-potion-darkvision',3,'potion','darkvision'),('dmg-potion-delay-poison',3,'potion','delay poison'),('dmg-potion-eagles-splendor',3,'potion','eagle''s splendor'),('dmg-potion-foxs-cunning',3,'potion','fox''s cunning'),('dmg-potion-invisibility',3,'potion','invisibility'),('dmg-oil-invisibility',3,'oil','invisibility'),('dmg-potion-lesser-restoration',3,'potion','lesser restoration'),('dmg-potion-levitate',3,'potion','levitate'),('dmg-oil-levitate',3,'oil','levitate'),('dmg-potion-misdirection',3,'potion','misdirection'),('dmg-potion-owls-wisdom',3,'potion','owl''s wisdom'),('dmg-potion-protection-arrows-10',3,'potion','protection from arrows'),('dmg-potion-remove-paralysis',3,'potion','remove paralysis'),('dmg-potion-resist-energy-10',3,'potion','resist energy'),('dmg-potion-shield-faith-3',6,'potion','shield of faith'),('dmg-potion-spider-climb',3,'potion','spider climb'),('dmg-potion-undetectable-alignment',3,'potion','undetectable alignment'),('dmg-potion-barkskin-3',6,'potion','barkskin'),('dmg-potion-shield-faith-4',12,'potion','shield of faith'),('dmg-potion-resist-energy-20',7,'potion','resist energy'),('dmg-potion-cure-serious-wounds',5,'potion','cure serious wounds'),('dmg-oil-daylight',5,'oil','daylight'),('dmg-potion-displacement',5,'potion','displacement'),('dmg-oil-flame-arrow',5,'oil','flame arrow'),('dmg-potion-fly',5,'potion','fly'),('dmg-potion-gaseous-form',5,'potion','gaseous form'),('dmg-potion-greater-magic-fang-1',5,'potion','greater magic fang'),('dmg-oil-greater-magic-weapon-1',5,'oil','greater magic weapon'),('dmg-potion-haste',5,'potion','haste'),('dmg-potion-heroism',5,'potion','heroism'),('dmg-oil-keen-edge',5,'oil','keen edge'),('dmg-potion-magic-circle-alignment',5,'potion','magic circle against alignment'),('dmg-oil-magic-vestment-1',5,'oil','magic vestment'),('dmg-potion-neutralize-poison',5,'potion','neutralize poison'),('dmg-potion-nondetection',5,'potion','nondetection'),('dmg-potion-protection-energy',5,'potion','protection from energy'),('dmg-potion-rage',5,'potion','rage'),('dmg-potion-remove-blindness-deafness',5,'potion','remove blindness/deafness'),('dmg-potion-remove-curse',5,'potion','remove curse'),('dmg-potion-remove-disease',5,'potion','remove disease'),('dmg-potion-tongues',5,'potion','tongues'),('dmg-potion-water-breathing',5,'potion','water breathing'),('dmg-potion-water-walk',5,'potion','water walk'),('dmg-potion-barkskin-4',9,'potion','barkskin'),('dmg-potion-shield-faith-5',18,'potion','shield of faith'),('dmg-potion-good-hope',7,'potion','good hope'),('dmg-potion-resist-energy-30',11,'potion','resist energy'),('dmg-potion-barkskin-5',12,'potion','barkskin'),('dmg-potion-greater-magic-fang-2',8,'potion','greater magic fang'),('dmg-oil-greater-magic-weapon-2',8,'oil','greater magic weapon'),('dmg-oil-magic-vestment-2',8,'oil','magic vestment'),('dmg-potion-protection-arrows-15',15,'potion','protection from arrows'),('dmg-potion-greater-magic-fang-3',12,'potion','greater magic fang'),('dmg-oil-greater-magic-weapon-3',12,'oil','greater magic weapon'),('dmg-oil-magic-vestment-3',12,'oil','magic vestment'),('dmg-potion-greater-magic-fang-4',16,'potion','greater magic fang'),('dmg-oil-greater-magic-weapon-4',16,'oil','greater magic weapon'),('dmg-oil-magic-vestment-4',16,'oil','magic vestment'),('dmg-potion-greater-magic-fang-5',20,'potion','greater magic fang'),('dmg-oil-greater-magic-weapon-5',20,'oil','greater magic weapon'),('dmg-oil-magic-vestment-5',20,'oil','magic vestment')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,'use_activated',
       CASE WHEN d.form='potion' THEN 'Drink as a standard action; consumed immediately.' ELSE 'Apply as an oil; consumed immediately.' END,
       'slotless',NULL,NULL,0,NULL,NULL,'Brew Potion; '||d.spell_name||'.',NULL
FROM desired d;

WITH desired(slug,name,summary,kind,tags,mechanics) AS (VALUES
  ('dmg-potion-oil-eligibility','Potion and Oil Spell Eligibility',
   'A potion or oil is single-use and can duplicate a spell of no higher than 3rd level whose casting time is less than 1 minute.',
   'rule','["magic-items","potions","oils","creation"]',
   '{"singleUse":true,"maximumSpellLevel":3,"castingTimeMustBeLessThanMinutes":1}'),
  ('dmg-potion-oil-targeting','Potion and Oil Targeting',
   'A potion affects the drinker, who is both effective target and caster; creator-chosen options are fixed when brewed. For an oil, the applicator is the effective caster and the object is the target.',
   'rule','["magic-items","potions","oils","targeting"]',
   '{"potion":{"effectiveTarget":"drinker","effectiveCaster":"drinker","creatorChoicesFixedAtCreation":true},"oil":{"effectiveCaster":"applicator","target":"object"}}'),
  ('dmg-potion-oil-container','Potion and Oil Vial',
   'A typical potion or oil is 1 ounce of liquid in a ceramic or glass vial. The vial has AC 13, 1 hit point, hardness 1, break DC 12, and holds 1 ounce.',
   'rule','["magic-items","potions","oils","container"]',
   '{"liquidOunces":1,"container":{"armorClass":13,"hitPoints":1,"hardness":1,"breakDc":12,"capacityOunces":1}}'),
  ('dmg-potion-oil-activation','Potion and Oil Activation',
   'Drinking a potion or applying oil to gear is a standard action, takes effect immediately, and provokes attacks of opportunity. Damage during the attempt can force a Concentration check as for casting a spell; failure prevents drinking. An attack of opportunity can instead target the container.',
   'procedure','["magic-items","potions","oils","activation"]',
   '{"normalAction":"standard","effectTiming":"immediate","provokesAttackOfOpportunity":true,"damageCanForceConcentrationCheck":true,"attackOfOpportunityMayTargetContainer":true}'),
  ('dmg-potion-oil-corporeal-only','Potion and Oil Corporeality Requirement',
   'A creature must be able to swallow a potion or smear on an oil, so incorporeal creatures cannot use either. Any corporeal creature can imbibe a potion, and any corporeal creature can use an oil.',
   'rule','["magic-items","potions","oils","incorporeal"]',
   '{"incorporealCanUse":false,"corporealCanUsePotion":true,"corporealCanUseOil":true}'),
  ('dmg-potion-oil-unconscious','Administering Potions or Oils to Unconscious Creatures',
   'Carefully administering a potion to an unconscious creature or applying an oil to one is a full-round action.',
   'procedure','["magic-items","potions","oils","unconscious"]',
   '{"action":"full_round"}'),
  ('dmg-potion-standard-caster-level','Standard Potion Caster Level',
   'Unless otherwise specified, a standard potion uses the minimum caster level required to cast the stored spell.',
   'rule','["magic-items","potions","caster-level"]',
   '{"defaultCasterLevel":"minimum-required-for-spell"}'),
  ('dmg-table-7-17-potions-oils','Table 7-17: Potions and Oils',
   'Random-generation table for minor, medium, and major potions and oils, preserving the printed percentile bands and market prices.',
   'table','["magic-items","potions","oils","random-generation","table-7-17"]',
   '{"minor":[[1,10,"potion-cure-light-wounds"],[11,13,"potion-endure-elements"],[14,15,"potion-hide-from-animals"],[16,17,"potion-hide-from-undead"],[18,19,"potion-jump"],[20,22,"potion-mage-armor"],[23,25,"potion-magic-fang"],[26,26,"oil-magic-stone"],[27,29,"oil-magic-weapon"],[30,30,"potion-pass-without-trace"],[31,32,"potion-protection-from-alignment"],[33,34,"potion-remove-fear"],[35,35,"potion-sanctuary"],[36,38,"potion-shield-of-faith-2"],[39,39,"oil-shillelagh"],[40,41,"oil-bless-weapon"],[42,44,"potion-enlarge-person"],[45,45,"potion-reduce-person"],[46,47,"potion-aid"],[48,50,"potion-barkskin-2"],[51,53,"potion-bears-endurance"],[54,56,"potion-blur"],[57,59,"potion-bulls-strength"],[60,62,"potion-cats-grace"],[63,67,"potion-cure-moderate-wounds"],[68,68,"oil-darkness"],[69,71,"potion-darkvision"],[72,74,"potion-delay-poison"],[75,76,"potion-eagles-splendor"],[77,78,"potion-foxs-cunning"],[79,81,{"forms":["potion-invisibility","oil-invisibility"]}],[82,84,"potion-lesser-restoration"],[85,86,{"forms":["potion-levitate","oil-levitate"]}],[87,87,"potion-misdirection"],[88,89,"potion-owls-wisdom"],[90,91,"potion-protection-from-arrows-10"],[92,93,"potion-remove-paralysis"],[94,96,"potion-resist-energy-10"],[97,97,"potion-shield-of-faith-3"],[98,99,"potion-spider-climb"],[100,100,"potion-undetectable-alignment"]],"medium":[[1,2,"oil-bless-weapon"],[3,4,"potion-enlarge-person"],[5,5,"potion-reduce-person"],[6,6,"potion-aid"],[7,7,"potion-barkskin-2"],[8,10,"potion-bears-endurance"],[11,13,"potion-blur"],[14,16,"potion-bulls-strength"],[17,19,"potion-cats-grace"],[20,27,"potion-cure-moderate-wounds"],[28,28,"oil-darkness"],[29,30,"potion-darkvision"],[31,31,"potion-delay-poison"],[32,33,"potion-eagles-splendor"],[34,35,"potion-foxs-cunning"],[36,37,{"forms":["potion-invisibility","oil-invisibility"]}],[38,38,"potion-lesser-restoration"],[39,39,{"forms":["potion-levitate","oil-levitate"]}],[40,40,"potion-misdirection"],[41,42,"potion-owls-wisdom"],[43,43,"potion-protection-from-arrows-10"],[44,44,"potion-remove-paralysis"],[45,46,"potion-resist-energy-10"],[47,48,"potion-shield-of-faith-3"],[49,49,"potion-spider-climb"],[50,50,"potion-undetectable-alignment"],[51,51,"potion-barkskin-3"],[52,52,"potion-shield-of-faith-4"],[53,55,"potion-resist-energy-20"],[56,60,"potion-cure-serious-wounds"],[61,61,"oil-daylight"],[62,64,"potion-displacement"],[65,65,"oil-flame-arrow"],[66,68,"potion-fly"],[69,69,"potion-gaseous-form"],[70,71,"potion-greater-magic-fang-1"],[72,73,"oil-greater-magic-weapon-1"],[74,75,"potion-haste"],[76,78,"potion-heroism"],[79,80,"oil-keen-edge"],[81,81,"potion-magic-circle-against-alignment"],[82,83,"oil-magic-vestment-1"],[84,86,"potion-neutralize-poison"],[87,88,"potion-nondetection"],[89,91,"potion-protection-from-energy"],[92,93,"potion-rage"],[94,94,"potion-remove-blindness-deafness"],[95,95,"potion-remove-curse"],[96,96,"potion-remove-disease"],[97,97,"potion-tongues"],[98,99,"potion-water-breathing"],[100,100,"potion-water-walk"]],"major":[[1,2,"potion-blur"],[3,7,"potion-cure-moderate-wounds"],[8,9,"potion-darkvision"],[10,11,{"forms":["potion-invisibility","oil-invisibility"]}],[12,12,"potion-lesser-restoration"],[13,13,"potion-remove-paralysis"],[14,14,"potion-shield-of-faith-3"],[15,15,"potion-undetectable-alignment"],[16,16,"potion-barkskin-3"],[17,18,"potion-shield-of-faith-4"],[19,20,"potion-resist-energy-20"],[21,28,"potion-cure-serious-wounds"],[29,29,"oil-daylight"],[30,32,"potion-displacement"],[33,33,"oil-flame-arrow"],[34,38,"potion-fly"],[39,39,"potion-gaseous-form"],[40,41,"potion-haste"],[42,44,"potion-heroism"],[45,46,"oil-keen-edge"],[47,47,"potion-magic-circle-against-alignment"],[48,50,"potion-neutralize-poison"],[51,52,"potion-nondetection"],[53,54,"potion-protection-from-energy"],[55,55,"potion-rage"],[56,56,"potion-remove-blindness-deafness"],[57,57,"potion-remove-curse"],[58,58,"potion-remove-disease"],[59,59,"potion-tongues"],[60,60,"potion-water-breathing"],[61,61,"potion-water-walk"],[62,63,"potion-barkskin-4"],[64,64,"potion-shield-of-faith-5"],[65,65,"potion-good-hope"],[66,68,"potion-resist-energy-30"],[69,69,"potion-barkskin-5"],[70,73,"potion-greater-magic-fang-2"],[74,77,"oil-greater-magic-weapon-2"],[78,81,"oil-magic-vestment-2"],[82,82,"potion-protection-from-arrows-15"],[83,85,"potion-greater-magic-fang-3"],[86,88,"oil-greater-magic-weapon-3"],[89,91,"oil-magic-vestment-3"],[92,93,"potion-greater-magic-fang-4"],[94,95,"oil-greater-magic-weapon-4"],[96,97,"oil-magic-vestment-4"],[98,98,"potion-greater-magic-fang-5"],[99,99,"oil-greater-magic-weapon-5"],[100,100,"oil-magic-vestment-5"]],"formSelectionForPotionOrOilResults":"source lists both forms but does not assign a separate percentile split"}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5','229-230',d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
