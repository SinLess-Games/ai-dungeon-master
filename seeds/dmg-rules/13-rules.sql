-- Dungeon Master's Guide source-backed rules catalog.
-- Mechanical summaries are intentionally concise; the supplied sourcebook remains authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG',
        'Wizards of the Coast','dnd','3.5','D&D v.3.5 core Dungeon Master''s Guide, including the official errata appended to the supplied source PDF.',NULL,1,0,NULL);

WITH desired(slug,name,source_page,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,summary,tags,mechanics) AS (VALUES
  ('dmg-gaining-class-benefits','Gaining Class Benefits','198','advancement','rule',0,1,NULL,NULL,'Class features, BAB, saves, spellcasting, and other level benefits apply when a character gains the corresponding class level.','["advancement","classes"]','{}'),
  ('dmg-general-downtime','General Downtime','198','downtime','guidance',0,1,NULL,NULL,'Resolve downtime activities using elapsed time and the relevant crafting, training, recovery, research, or profession rules.','["downtime"]','{}'),
  ('dmg-fixed-hit-points','Fixed Hit Points on Advancement','198','advancement','rule',1,0,NULL,NULL,'Instead of rolling hit points at new levels, a campaign may use fixed average-style gains by Hit Die.','["hit-points","variant"]','{}'),
  ('dmg-create-pc-above-first','Creating PCs above 1st Level','199','characters','procedure',0,1,NULL,NULL,'Build higher-level characters with appropriate levels, feats, skills, spells, and starting wealth using the character wealth guidelines.','["character-creation","wealth"]','{}'),
  ('dmg-special-cohorts','Special Cohorts','199','characters','rule',0,1,NULL,NULL,'Nonstandard cohorts use effective level/CR and availability guidance to determine suitability under cohort-granting rules.','["cohorts"]','{}'),
  ('dmg-familiars','Familiars','200','characters','rule',0,1,NULL,NULL,'Familiar abilities scale from master level and use the familiar rules for intelligence, defenses, shared effects, communication, and replacement.','["familiars"]','{}'),
  ('dmg-special-mounts','Special Mounts','204','characters','rule',0,1,NULL,NULL,'Special mounts improve with the granting class and use the class/mount advancement rules for bonus HD, abilities, and replacement.','["mounts"]','{}'),
  ('dmg-animal-companions','Animal Companions','205','characters','rule',0,1,NULL,NULL,'Animal companions advance by effective druid level and use the companion table for bonus HD, natural armor, ability increases, tricks, and special abilities.','["animal-companion"]','{}'),
  ('dmg-epic-characters','Epic Characters','206','characters','rule',0,1,NULL,NULL,'Characters above 20th level use epic advancement rules for attack/save progression, feats, class features, spellcasting, and other benefits.','["epic"]','{}'),
  ('dmg-epic-ranger-animal-companion-errata','Epic Ranger Animal Companion Errata','208','characters','rule',0,1,NULL,'dmg-epic-ranger-animal-companion','The epic ranger''s animal companion continues to increase in power normally; above ranger level 41 use the epic druid companion progression guidance.','["errata","epic","ranger"]','{}'),
  ('dmg-magic-item-handling','Handling Magic Items','212','magic-items','rule',0,1,NULL,NULL,'Magic items use defined slots, activation methods, caster levels, auras, saving throws, hardness/hit points, and identification procedures.','["magic-items"]','{}'),
  ('dmg-magic-item-body-slots','Magic Item Body Slots','214','magic-items','rule',0,1,NULL,NULL,'A creature normally benefits from only one magic item in each body slot; slotless items are not limited by body slot but may have their own restrictions.','["magic-items","slots"]','{}'),
  ('dmg-magic-item-activation','Magic Item Activation','213','magic-items','rule',0,1,NULL,NULL,'Activation may be spell completion, spell trigger, command word, use activated, or continuous as defined by the item category.','["magic-items","activation"]','{}'),
  ('dmg-magic-item-saving-throws','Magic Item Saving Throws','214','magic-items','rule',0,1,NULL,NULL,'Unattended magic items use their own saving throw rules; attended items usually use the wielder''s save when an effect permits an object save.','["magic-items","saving-throws"]','{}'),
  ('dmg-magic-item-damage','Damaging Magic Items','214','magic-items','rule',0,1,NULL,NULL,'Magic items use object hardness/hit points and receive magic-item-specific resilience; destruction or suppression follows item and effect rules.','["magic-items","objects"]','{}'),
  ('dmg-magic-item-aura','Magic Item Aura','215','magic-items','rule',0,1,NULL,NULL,'Detect magic and similar effects reveal an item''s aura strength and school based primarily on caster level and prerequisites.','["magic-items","aura"]','{}'),
  ('dmg-random-magic-items','Random Magic Item Generation','216','magic-items','table',0,1,NULL,NULL,'Random tables select item category and specific result according to minor, medium, or major treasure bands.','["magic-items","random"]','{}'),
  ('dmg-intelligent-items','Intelligent Items','268','magic-items','subsystem',0,1,NULL,NULL,'Some permanent magic items have mental ability scores, communication, senses, powers, alignment, ego, and purpose; conflicts can require ego checks against the wielder.','["magic-items","intelligent"]','{}'),
  ('dmg-cursed-items','Cursed Items','272','magic-items','subsystem',0,1,NULL,NULL,'Cursed items can misidentify, impose drawbacks, function intermittently, require specific removal, or substitute harmful effects for expected benefits.','["magic-items","curses"]','{}'),
  ('dmg-artifacts','Artifacts','277','magic-items','subsystem',0,1,NULL,NULL,'Artifacts exceed normal item-creation rules, have unique powers and drawbacks, and often require specific methods of destruction.','["magic-items","artifacts"]','{}'),
  ('dmg-magic-item-creation','Creating Magic Items','282','crafting','rule',0,1,NULL,NULL,'Creating a magic item requires the appropriate item-creation feat, prerequisites, time, gp cost, and XP cost, with rules varying by item category.','["crafting","magic-items"]','{}'),
  ('dmg-magic-item-creation-time','Magic Item Creation Time','282','crafting','rule',0,1,NULL,NULL,'Creation time scales with the item''s market price according to the item-creation rules unless the category specifies otherwise.','["crafting","time"]','{}'),
  ('dmg-magic-item-creation-cost','Magic Item Creation Cost','282','crafting','rule',0,1,NULL,NULL,'Base creation cost is derived from market price and the item-creation formulas, with additional expensive material/XP components added where required.','["crafting","cost"]','{}'),
  ('dmg-estimating-magic-item-price','Estimating Magic Item Gold Piece Values','285','crafting','table',0,1,NULL,NULL,'Use the pricing guidelines for spell effect, activation mode, duration, charges, slots, and multiple abilities as estimates; final price is checked against comparable items.','["magic-items","pricing"]','{}'),
  ('dmg-masterwork-items','Masterwork Items','283','equipment','rule',0,1,NULL,NULL,'Masterwork quality has an added cost and grants the specific equipment-category benefit; it is a prerequisite for making weapons or armor magical.','["masterwork","equipment"]','{}'),
  ('dmg-special-material-adamantine','Adamantine','283','materials','rule',0,1,NULL,NULL,'Adamantine equipment has material-specific hardness and weapon/armor properties and an added cost based on item type.','["materials","adamantine"]','{}'),
  ('dmg-special-material-darkwood','Darkwood','283','materials','rule',0,1,NULL,NULL,'Darkwood wooden items are lighter while retaining strength; qualifying items have a material surcharge.','["materials","darkwood"]','{}'),
  ('dmg-special-material-dragonhide','Dragonhide','283','materials','rule',0,1,NULL,NULL,'Dragonhide can replace suitable armor/shield materials and supports druid-compatible special construction subject to size/material requirements.','["materials","dragonhide"]','{}'),
  ('dmg-special-material-cold-iron','Cold Iron','284','materials','rule',0,1,NULL,NULL,'Cold iron weapons have an added cost and interact with damage reduction; enchanting cold iron costs more than enchanting ordinary weapons.','["materials","cold-iron"]','{}'),
  ('dmg-special-material-mithral','Mithral','284','materials','rule',0,1,NULL,NULL,'Mithral metal items are lighter; armor has reduced category/check penalty/spell failure and higher maximum Dexterity according to the material rules.','["materials","mithral"]','{}'),
  ('dmg-special-material-silver','Alchemical Silver','284','materials','rule',0,1,NULL,NULL,'Alchemical silver can be applied to suitable weapons, changes damage in specified cases, and bypasses silver-based damage reduction.','["materials","silver"]','{}'),
  ('dmg-special-ability-types','Special Ability Types','289','special-abilities','rule',0,1,NULL,NULL,'Extraordinary, spell-like, and supernatural abilities have distinct interactions with antimagic, spell resistance, dispelling, concentration, and attacks of opportunity.','["ex","sp","su"]','{}'),
  ('dmg-antimagic','Antimagic','290','magic','rule',0,1,NULL,NULL,'Antimagic suppresses spells, spell-like abilities, supernatural abilities, and magic-item effects according to their type, without generally dispelling them.','["antimagic"]','{}'),
  ('dmg-blindsight-blindsense','Blindsight and Blindsense','290','special-abilities','rule',0,1,NULL,NULL,'Blindsight permits precise perception without sight within range; blindsense detects creatures without necessarily removing concealment or pinpointing as fully as blindsight.','["senses"]','{}'),
  ('dmg-breath-weapons','Breath Weapons','291','special-abilities','rule',0,1,NULL,NULL,'Breath weapons are area special attacks with their own recharge/use and saving throw; unless specified, they are supernatural abilities.','["breath-weapon"]','{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg-3.5-rule-' || d.slug, 'dmg-3.5', d.source_page, d.slug, d.name, d.summary, d.summary,
  0,NULL,1,d.category,d.kind,d.is_variant,d.default_enabled,d.parent_slug,d.supersedes_slug,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.slug=d.slug AND r.owner_user_id IS NULL
);
