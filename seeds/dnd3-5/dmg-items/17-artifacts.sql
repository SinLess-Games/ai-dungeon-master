-- Dungeon Master's Guide v3.5 Chapter 7: Artifacts, pp. 277-282.
-- Includes all twelve printed minor artifacts and the complete set of example major artifacts,
-- with the ten Orbs of Dragonkind represented individually for deterministic inventory/campaign state.
-- Artifacts have no normal market price and cannot be created through ordinary item-creation rules.
-- Mechanical text is summarized; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
 (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
 'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_artifacts AS
SELECT json_extract(value,'$[0]') tier,json_extract(value,'$[1]') slug,json_extract(value,'$[2]') name,
       json_extract(value,'$[3]') page,json_extract(value,'$[4]') slot,json_extract(value,'$[5]') caster_level,
       json_extract(value,'$[6]') rules_text
FROM json_each('[
 ["minor","book-of-exalted-deeds","Book of Exalted Deeds","277","slotless",19,"A good divine spellcaster who completes one week of study gains +1 inherent Wisdom and one experience level under the source XP rule; other alignments and arcane spellcasters suffer source-defined penalties. The book then vanishes, and the same character cannot benefit from another."],
 ["minor","book-of-infinite-spells","Book of Infinite Spells","277-279","slotless",18,"Contains 1d8+22 one-way pages, each holding a randomly generated arcane or divine spell. The current page can be cast once/day, or up to four times/day if it is on the owner''s class list. Each use can force the page to turn; the final page causes the book to vanish."],
 ["minor","book-of-vile-darkness","Book of Vile Darkness","277-278","slotless",19,"An evil divine spellcaster who completes one week of study gains +1 inherent Wisdom and one experience level under the source XP rule; neutral and good readers suffer severe alignment, XP, damage, death, or insanity risks. The book is strongly evil."],
 ["minor","deck-of-many-things","Deck of Many Things","278-279","slotless",20,"A 22-card artifact deck. Before drawing, the user announces how many cards will be drawn; each drawn card immediately produces its listed permanent or extraordinary effect. Fool and Jester are discarded instead of replaced."],
 ["minor","hammer-of-thunderbolts","Hammer of Thunderbolts","279","both_hands",20,"A +3 Large returning warhammer dealing 4d6. With belt of giant strength and gauntlets of ogre power and knowledge of the artifact, it becomes +5, lets those item bonuses stack, can slay giants on hit (Fortitude DC 20 negates death), and thrown hits create a 90-foot thunderclap that can stun for 1 round (Fortitude DC 15 negates)."],
 ["minor","philosophers-stone","Philosopher''s Stone","279","slotless",20,"Breaking the stone exposes quicksilver potent for 24 hours. It can transmute up to 5,000 lb. iron into silver or 1,000 lb. lead into gold, or mix with a cure potion to create oil that functions as true resurrection on a dead body."],
 ["minor","sphere-of-annihilation","Sphere of Annihilation","279","slotless",20,"A 2-foot globe of absolute nothingness that destroys matter touching it. Control is a move-action check against DC 30 using 1d20 + character level + Intelligence modifier; successful control permits movement under the source formula. Gate and rod-of-cancellation interactions use the source''s special catastrophic tables."],
 ["minor","staff-of-the-magi","Staff of the Magi","280","main_hand",20,"A 50-charge artifact staff with at-will, 1-charge, and 2-charge spell powers, spell resistance 23, absorption of directed arcane spell energy into charges, and the source retributive-strike mechanic. Absorbing above 50 charges triggers the strike automatically."],
 ["minor","talisman-of-pure-good","Talisman of Pure Good","280","slotless",18,"A good divine spellcaster can expend one of 6 charges to open a flaming fissure under an evil divine spellcaster within 100 feet standing on solid ground, potentially swallowing the target forever. Improperly aligned divine spellcasters take source-defined damage on contact."],
 ["minor","talisman-of-the-sphere","Talisman of the Sphere","280","slotless",16,"An arcane spellcaster holding it doubles the level and Intelligence-bonus contribution to sphere-of-annihilation control checks and, after gaining control, checks only every other round. Non-arcane spellcasters take 5d6 damage from holding it."],
 ["minor","talisman-of-ultimate-evil","Talisman of Ultimate Evil","280","slotless",18,"An evil divine spellcaster can expend one of 6 charges to open a flaming fissure under a good divine spellcaster within 100 feet standing on solid ground, potentially swallowing the target forever. Improperly aligned divine spellcasters take source-defined damage on contact."],
 ["minor","talisman-of-zagy","Talisman of Zagy","280","slotless",20,"On first touch, make Charisma DC 15. Failure makes it act as a loadstone and punishes disposal; success keeps it for 5d6 hours or until a wish is made. A natural 20 binds it for months equal to Charisma and grants one wish per 6 Charisma points plus trap warning within 20 feet. It ultimately vanishes and leaves a 10,000 gp diamond."],

 ["major","eye-of-vecna","Eye of Vecna","281","face",20,"Must replace the bearer''s eye, permanently costs 2 Charisma, and cannot be removed without killing the host. Grants continuous darkvision and true seeing; eyebite and dominate person 3/day each; destruction and unhallow 1/day each. Nonevil hosts risk weekly corruption to evil."],
 ["major","hand-of-vecna","Hand of Vecna","281","hands",20,"Must replace the bearer''s severed left hand, permanently costs 2 Dexterity, and cannot be removed without killing the host. Its touch deals 1d10 cold damage; 3/day it can permanently drain 1 chosen ability point and grant it to the host until sunrise; blasphemy and unholy aura each 1/day. Nonevil hosts risk weekly corruption."],
 ["major","hand-and-eye-of-vecna","Hand and Eye of Vecna, Combined Powers","281","other",20,"A host bearing both raises the save DC of all Hand/Eye powers to 25, gains +2 Strength and +2 Intelligence, takes -2 Wisdom, can summon evil outsiders with summon monster IX once/day, and makes the stricter weekly Will DC 23 check against becoming evil."],
 ["major","mace-of-cuthbert","Mace of Cuthbert","281","main_hand",null,"A +5 heavy mace with holy, lawful, and disruption special abilities. Its wielder can project searing light at will at caster level 20."],
 ["major","moaning-diamond","Moaning Diamond","281","slotless",null,"Three times/day reshapes up to 5,000 cubic feet of earth or stone as stone shape. It can summon one maximum-hit-point elder earth elemental at a time; after that elemental is slain a replacement cannot be summoned for 24 hours."],
 ["major","orb-of-dragonkind-black","Orb of Dragonkind, Black","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to black dragons. Its individual once-per-round power is fly, with Will DC 17 negating where applicable."],
 ["major","orb-of-dragonkind-blue","Orb of Dragonkind, Blue","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to blue dragons. Its individual once-per-round power is haste, with Fortitude DC 17 negating where applicable."],
 ["major","orb-of-dragonkind-brass","Orb of Dragonkind, Brass","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to brass dragons. Its individual once-per-round power is teleport, with Will DC 19 negating where applicable."],
 ["major","orb-of-dragonkind-bronze","Orb of Dragonkind, Bronze","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to bronze dragons. Its individual once-per-round power is scrying, with Will DC 18 negating where applicable."],
 ["major","orb-of-dragonkind-copper","Orb of Dragonkind, Copper","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to copper dragons. Its individual once-per-round power is suggestion, with Will DC 17 negating."],
 ["major","orb-of-dragonkind-gold","Orb of Dragonkind, Gold","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to gold dragons. Once/day it may call on any individual power of another Orb and has the source-defined ability to dominate another Orb possessor within 1 mile."],
 ["major","orb-of-dragonkind-green","Orb of Dragonkind, Green","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to green dragons. Its individual once-per-round power is spectral hand."],
 ["major","orb-of-dragonkind-red","Orb of Dragonkind, Red","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to red dragons. Its individual once-per-round power is wall of fire."],
 ["major","orb-of-dragonkind-silver","Orb of Dragonkind, Silver","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to silver dragons. Its individual once-per-round power is cure critical wounds, with Will DC 18 half where relevant."],
 ["major","orb-of-dragonkind-white","Orb of Dragonkind, White","281","slotless",10,"Shares all Orb of Dragonkind powers keyed to white dragons. Its individual once-per-round power is protection from energy (cold), with Fortitude DC 17 negating where applicable."],
 ["major","shadowstaff","Shadowstaff","281-282","main_hand",20,"Grants +4 AC and Reflex saves from partial incorporeality, but in bright light or absolute darkness imposes -2 on attacks, saves, and checks. Powers: summon 2d4 turning-immune shadows 3/day; summon one nightcrawler nightshade monthly; living-shadow gaseous-form movement 3/day; 100-foot 10d6 cold shadow bolt 3/day."],
 ["major","shield-of-prator","Shield of Prator","282","shield",null,"A +5 heavy steel shield. Lets the wielder cast as a 20th-level paladin with Wisdom 20 in addition to existing spells, grants spell resistance 15, and absorbs the first 10 points from each common energy attack. Owner must undertake a yearly lawful-good quest; evil or chaotic users gain four persistent negative levels while holding it."],
 ["major","sword-of-kas","Sword of Kas","282","main_hand",null,"A +6 unholy keen vorpal longsword granting +10 enhancement Strength. Intelligent chaotic evil item: Int 15, Wis 13, Cha 16, Ego 34. Call lightning, blasphemy, and unhallow each 1/day; slay living 1/week." ]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT 'dmg-artifact-'||a.slug,'dmg-3.5',a.page,a.slug,a.name,
       CASE a.tier WHEN 'minor' THEN 'Minor artifact from Dungeon Master''s Guide Chapter 7.' ELSE 'Unique major artifact from Dungeon Master''s Guide Chapter 7.' END,
       a.rules_text,0,NULL,1,'magic',NULL,NULL,NULL,NULL,NULL
FROM _dmg_artifacts a
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=a.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT 'dmg-artifact-'||a.slug,NULL,a.caster_level,NULL,'overwhelming','other',
       'Artifact activation is defined by the individual source description.',a.slot,
       CASE a.slug WHEN 'staff-of-the-magi' THEN 50 WHEN 'talisman-of-pure-good' THEN 6 WHEN 'talisman-of-ultimate-evil' THEN 6 ELSE NULL END,
       CASE WHEN a.slug IN ('staff-of-the-magi','talisman-of-pure-good','talisman-of-ultimate-evil') THEN 'Artifact charges do not recharge unless the source description provides a special mechanism.' ELSE NULL END,
       0,NULL,NULL,'Artifact; cannot be created through ordinary mortal magic-item construction.',NULL
FROM _dmg_artifacts a;

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-artifact-general','Artifact General Rules','277','rule',
 'Artifacts are legendary magic items whose normal creation methods are lost. They are deliberately introduced by the DM rather than randomly generated.',
 '["magic-items","artifacts"]','{"randomGeneration":false,"ordinaryCreation":false,"campaignDefining":true}'),
('dmg-minor-artifact-general','Minor Artifact Rules','277','rule',
 'Minor artifacts are not necessarily unique, but common mortal means can no longer create them.',
 '["magic-items","artifacts","minor"]','{"necessarilyUnique":false,"ordinaryCreation":false}'),
('dmg-major-artifact-general','Major Artifact Rules','280-282','rule',
 'Major artifacts are unique and should have one specific, difficult means of destruction determined by the DM. They are intended to be campaign-defining items.',
 '["magic-items","artifacts","major","destruction"]','{"unique":true,"singleSpecificDestructionMethod":true,"dmDefinesDestructionMethod":true}'),
('dmg-deck-of-many-things-cards','Deck of Many Things Card Effects','278-279','table',
 'The standard 22-card deck and its immediate effects.',
 '["magic-items","artifacts","deck-of-many-things","table"]','{"cards":{"balance":"change alignment instantly","comet":"single-handedly defeat next hostile encounter to gain one level","donjon":"imprisonment; lose gear/spells; stop drawing","euryale":"permanent -1 saves until Fates or deity removes","fates":"avoid or reverse one occurrence for drawer","flames":"outsider becomes enemy","fool":"lose 10000 XP and draw again; discard card","gem":"gain 25 pieces jewelry or 50 gems","idiot":"1d4+1 permanent Intelligence drain; optional extra draw","jester":"gain 10000 XP or two additional draws; discard card","key":"gain a useful major magic weapon","knight":"gain loyal 4th-level fighter","moon":"gain 1d4 wishes usable within equal minutes","rogue":"NPC friend becomes hostile","ruin":"lose all nonmagical wealth/property","skull":"fight an unturnable dread wraith alone or be forever destroyed","star":"+2 inherent bonus to one ability","sun":"gain useful medium wondrous item and 50000 XP","talons":"all possessed magic items disappear","throne":"+6 Diplomacy and gain small keep","vizier":"one answer to next dilemma within one year","void":"soul trapped elsewhere; stop drawing"},"cardsReplacedAfterDrawExcept":["fool","jester"],"announceDrawCountBeforeDrawing":true}'),
('dmg-sphere-of-annihilation-control','Sphere of Annihilation Control','279','subsystem',
 'Controlling a sphere uses a move-action DC 30 check of 1d20 + character level + Intelligence modifier; successful control allows movement, must normally be maintained each round, and opposed control uses opposed checks.',
 '["magic-items","artifacts","sphere-of-annihilation","control"]','{"action":"move","dc":30,"check":"1d20 + character level + Intelligence modifier","initialControlRangeFeet":40,"maintainedControlRangeFeet":"40 + 10 per character level","speedFeet":"10 + 5 per 5 points result exceeds 30","failedCheck":"sphere moves 10 feet toward controller","multipleControllers":"opposed checks"}'),
('dmg-sphere-of-annihilation-interactions','Sphere of Annihilation Special Interactions','279','table',
 'Gate has a special d% interaction with a sphere; rod of cancellation and sphere mutually annihilate explosively; dispel magic and Mordenkainen''s disjunction do not affect the sphere.',
 '["magic-items","artifacts","sphere-of-annihilation"]','{"gate":[[1,50,"sphere destroyed"],[51,85,"no effect"],[86,100,"180-foot-radius planar rift"]],"rodOfCancellation":{"result":"both negated","explosionRadiusFeet":60,"damage":"2d6x10"},"unaffectedBy":["dispel magic","Mordenkainen''s disjunction"]}'),
('dmg-orbs-of-dragonkind-common','Orbs of Dragonkind Common Powers','281','subsystem',
 'Each Orb contains one ancient dragon essence and shares domination, dragon-derived defenses, breath protection/use, communication, detection, and dragon-enmity rules.',
 '["magic-items","artifacts","orbs-of-dragonkind"]','{"dominateMatchingDragon":{"rangeFeet":500,"willDc":25,"spellResistanceApplies":false},"replaceAcAndSavesWithContainedDragonValues":true,"immuneToMatchingDragonBreathWeapon":true,"useMatchingBreathWeaponPerDay":3,"communicateWithOtherOrbBearers":true,"detectAnyDragonMiles":10,"detectMatchingDragonMiles":100,"exactMatchingDragonLocationAndAgeWithinMiles":1,"permanentDragonEnmity":true}'),
('dmg-staff-magi-powers','Staff of the Magi Power Catalog','280','catalog',
 'Structured charge costs for the Staff of the Magi.',
 '["magic-items","artifacts","staff-of-the-magi","powers"]','{"noCharge":["detect magic","enlarge person","hold portal","light","mage armor","mage hand"],"oneCharge":["dispel magic","fireball 10d6","ice storm","invisibility","knock","lightning bolt 10d6","passwall","pyrotechnics","wall of fire","web"],"twoCharges":["summon monster IX","plane shift","telekinesis 400 lb"],"spellResistance":23,"absorbArcaneSpellLevelsAsCharges":true,"maximumCharges":50,"overcharge":"automatic retributive strike"}')
)
INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

DROP TABLE _dmg_artifacts;
