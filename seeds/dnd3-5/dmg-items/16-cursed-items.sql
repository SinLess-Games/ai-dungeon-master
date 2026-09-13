-- Dungeon Master's Guide v3.5 Chapter 7: Cursed Items, pp. 272-276.
-- Includes cursed-item generation, common curse families, dependent conditions, drawbacks,
-- identification rules, and all 29 Table 7-31 specific cursed items.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
 (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
 'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_cursed_items AS
SELECT json_extract(value,'$[0]') min_roll,json_extract(value,'$[1]') max_roll,
       json_extract(value,'$[2]') slug,json_extract(value,'$[3]') name,
       json_extract(value,'$[4]') price_copper,json_extract(value,'$[5]') slot
FROM json_each('[
 [1,5,"incense-of-obsession","Incense of Obsession",20000,"slotless"],
 [6,15,"ring-of-clumsiness","Ring of Clumsiness",50000,"other"],
 [16,20,"amulet-of-inescapable-location","Amulet of Inescapable Location",100000,"throat"],
 [21,25,"stone-of-weight","Stone of Weight (Loadstone)",100000,"slotless"],
 [26,30,"bracers-of-defenselessness","Bracers of Defenselessness",120000,"arms"],
 [31,35,"gauntlets-of-fumbling","Gauntlets of Fumbling",130000,"hands"],
 [36,40,"cursed-sword-minus-2","-2 Sword, Cursed",150000,"main_hand"],
 [41,43,"armor-of-rage","Armor of Rage",160000,"body"],
 [44,46,"medallion-of-thought-projection","Medallion of Thought Projection",180000,"throat"],
 [47,52,"flask-of-curses","Flask of Curses",210000,"slotless"],
 [53,54,"dust-of-sneezing-and-choking","Dust of Sneezing and Choking",240000,"slotless"],
 [55,55,"helm-of-opposite-alignment","Helm of Opposite Alignment",400000,"head"],
 [56,60,"potion-of-poison","Potion of Poison",500000,"slotless"],
 [61,61,"broom-of-animated-attack","Broom of Animated Attack",520000,"slotless"],
 [62,63,"robe-of-powerlessness","Robe of Powerlessness",550000,"body"],
 [64,64,"vacuous-grimoire","Vacuous Grimoire",600000,"slotless"],
 [65,68,"spear-cursed-backbiter","Spear, Cursed Backbiter",750000,"main_hand"],
 [69,70,"armor-of-arrow-attraction","Armor of Arrow Attraction",900000,"body"],
 [71,72,"net-of-snaring","Net of Snaring",1000000,"main_hand"],
 [73,75,"bag-of-devouring","Bag of Devouring",null,"slotless"],
 [76,80,"mace-of-blood","Mace of Blood",1600000,"main_hand"],
 [81,85,"robe-of-vermin","Robe of Vermin",1650000,"body"],
 [86,88,"periapt-of-foul-rotting","Periapt of Foul Rotting",1700000,"throat"],
 [89,92,"sword-berserking","Sword, Berserking",1750000,"main_hand"],
 [93,96,"boots-of-dancing","Boots of Dancing",3000000,"feet"],
 [97,97,"crystal-hypnosis-ball","Crystal Hypnosis Ball",null,"slotless"],
 [98,98,"necklace-of-strangulation","Necklace of Strangulation",6000000,"throat"],
 [99,99,"cloak-of-poisonousness","Cloak of Poisonousness",6200000,"shoulders"],
 [100,100,"scarab-of-death","Scarab of Death",8000000,"throat"]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT 'dmg-item-'||c.slug,'dmg-3.5','274-276',c.slug,c.name,
       'Specific cursed magic item from Dungeon Master''s Guide Table 7-31.',
       CASE c.slug
        WHEN 'amulet-of-inescapable-location' THEN 'Appears protective but instead imposes -10 on saves against divination spells.'
        WHEN 'stone-of-weight' THEN 'Halves the possessor''s base land speed and magically returns if discarded until remove curse permits normal disposal.'
        WHEN 'bracers-of-defenselessness' THEN 'Initially resemble bracers of armor +5; once triggered by a sufficiently dangerous hostile attack, impose -5 AC and require remove curse to remove.'
        WHEN 'gauntlets-of-fumbling' THEN 'Once triggered in danger, impose -2 Dexterity and a 50% chance each round to drop held objects; removing them requires curse-breaking magic.'
        WHEN 'cursed-sword-minus-2' THEN 'In real combat imposes -2 on attack rolls and -2 damage, minimum 1; after one week compels its owner to use it and requires powerful magic to discard.'
        WHEN 'armor-of-rage' THEN 'Functions as +1 full plate but imposes -4 Charisma and grants nearby unfriendly creatures +1 morale on attacks against the wearer.'
        WHEN 'medallion-of-thought-projection' THEN 'Falsely appears to read thoughts while actually feeding plausible false thoughts to the user and broadcasting the user''s thoughts outward.'
        WHEN 'flask-of-curses' THEN 'First opening curses creatures within 30 feet that fail Will DC 17, imposing -2 on attacks, saves, and skill checks until remove curse.'
        WHEN 'dust-of-sneezing-and-choking' THEN 'A 20-foot spread forces Fortitude DC 15; failure deals 2d6 Constitution damage, followed one minute later by another DC 15 save for 1d6 Constitution damage; even successful saves leave victims stunned for 5d4 rounds.'
        WHEN 'helm-of-opposite-alignment' THEN 'Once activated, changes the wearer to a radically opposed alignment under the source rules, then becomes nonmagical.'
        WHEN 'potion-of-poison' THEN 'Drinker makes Fortitude DC 16 or takes 1d10 Constitution damage, then repeats the save one minute later for another 1d10 Constitution damage.'
        WHEN 'broom-of-animated-attack' THEN 'Appears as a broom of flying; attempted use dumps its rider then attacks with four attacks per round, including blinding straw strikes and damaging handle strikes.'
        WHEN 'robe-of-powerlessness' THEN 'Donning imposes -10 Strength and -10 Intelligence; removal is easy but recovery requires remove curse followed by heal.'
        WHEN 'vacuous-grimoire' THEN 'Reading any word forces two DC 15 Will saves against permanent Intelligence and Wisdom drain; burning it while casting remove curse destroys it.'
        WHEN 'spear-cursed-backbiter' THEN 'A +2 shortspear that on a natural 1 attacks and automatically damages its wielder; if thrown, the curse deals doubled damage to the hurler.'
        WHEN 'armor-of-arrow-attraction' THEN 'Appears to be +3 full plate but imposes -15 AC against ranged weapon attacks.'
        WHEN 'net-of-snaring' THEN 'A +3 attack net usable only underwater; underwater it may be commanded to shoot up to 30 feet and trap a creature.'
        WHEN 'bag-of-devouring' THEN 'An extradimensional creature''s feeding orifice masquerading as a bag of holding; it can grapple and consume living creatures and may randomly swallow stored contents.'
        WHEN 'mace-of-blood' THEN 'A +3 heavy mace that must be coated in blood daily or lose its bonus; daily Will DC 13 or its possessor becomes chaotic evil.'
        WHEN 'robe-of-vermin' THEN 'Initially grants resistance like a cloak +4; in hostile action its vermin curse imposes -5 initiative, -2 on attacks/saves/skills, and Concentration DC 20 + spell level to cast.'
        WHEN 'periapt-of-foul-rotting' THEN 'After 24 hours in possession it begins a rotting curse that permanently drains Dexterity, Constitution, and Charisma each week until removed by the source-prescribed sequence.'
        WHEN 'sword-berserking' THEN 'Appears as a +2 greatsword; in battle its wielder enters a barbarian-like rage and attacks the nearest creature until the curse''s stopping conditions are met.'
        WHEN 'boots-of-dancing' THEN 'Initially mimic other magic boots, but in or fleeing melee they impose Otto''s irresistible dance and require remove curse for removal.'
        WHEN 'crystal-hypnosis-ball' THEN 'Masquerades as a crystal ball; users can be fascinated and implanted with suggestions by the hidden controller. This item cannot be created by known means.'
        WHEN 'necklace-of-strangulation' THEN 'On donning, constricts for 6 damage per round and cannot be removed short of limited wish, wish, or miracle; it remains until the victim decays to a dry skeleton.'
        WHEN 'cloak-of-poisonousness' THEN 'On donning, wearer must succeed Fortitude DC 28 or die. Remove curse removes and destroys the cloak''s magic; neutralize poison is then needed before revival magic can restore the victim.'
        WHEN 'scarab-of-death' THEN 'After sufficient contact with a living creature, transforms into a burrowing death beetle; Reflex DC 25 can tear it away before it reaches the heart, still dealing 3d6 damage.'
        WHEN 'incense-of-obsession' THEN 'Appears as incense of meditation but instead drives a spellcaster into an obsession to use spells at every opportunity until all are spent or 24 hours pass.'
        WHEN 'ring-of-clumsiness' THEN 'Functions as feather falling but imposes -4 Dexterity and 20% arcane spell failure for spells with somatic components.'
        ELSE 'Use the source-backed DMG cursed-item description for full mechanics.' END,
       0,NULL,1,'magic',c.price_copper,NULL,NULL,NULL,NULL
FROM _dmg_cursed_items c
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=c.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT 'dmg-item-'||c.slug,NULL,NULL,NULL,NULL,'other','Cursed activation and removal vary by item; use the DMG specific cursed-item description.',
       c.slot,NULL,NULL,0,NULL,NULL,
       CASE WHEN c.slug IN ('bag-of-devouring','crystal-hypnosis-ball') THEN 'Cannot be created by known means.' ELSE 'Intentional creation uses the source-listed feat and curse prerequisites.' END,NULL
FROM _dmg_cursed_items c;

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-cursed-item-chance','Chance for a Random Magic Item to Be Cursed','272','rule',
 'When cursed items are enabled, after generating a magic item normally the DM makes a second secret d% roll; 01-05 means the generated item is cursed.',
 '["magic-items","cursed-items","random-generation"]','{"secretRoll":true,"cursedRange":[1,5],"percent":5}'),
('dmg-cursed-common-curse-table','Cursed Item Common Curses','272-273','table',
 'After an item is determined to be cursed, roll its general curse family.',
 '["magic-items","cursed-items","random-generation"]','{"ranges":[[1,15,"delusion"],[16,35,"opposite-effect-or-target"],[36,45,"intermittent-functioning"],[46,60,"requirement"],[61,75,"drawback"],[76,90,"completely-different-effect"],[91,100,"specific-cursed-item"]]}'),
('dmg-cursed-delusion','Delusion Curse','272','rule',
 'The user believes a powerless item is functioning and cannot be convinced otherwise without remove curse.',
 '["magic-items","cursed-items","delusion"]','{"actualMagicPower":false,"userBelievesItFunctions":true,"breakBelief":"remove curse"}'),
('dmg-cursed-opposite-effect','Opposite Effect or Target Curse','272','rule',
 'The item produces an effect opposite its apparent one or redirects the intended effect onto the user; the exact inversion is selected to fit the item.',
 '["magic-items","cursed-items","opposite-effect"]','{"effect":"opposite or redirected to user","dmAdjudication":true}'),
('dmg-cursed-intermittent','Intermittent Functioning Curse','272-273','subsystem',
 'Intermittent items are unreliable, dependent on circumstances, or uncontrolled. An unreliable item normally has a 5% failure chance each activation; uncontrolled items normally have a 5% chance per day to activate at a random time.',
 '["magic-items","cursed-items","intermittent"]','{"unreliable":{"defaultFailurePercent":5,"dmRangePercent":[1,10]},"uncontrolled":{"defaultDailyActivationPercent":5},"dependentUsesConditionTable":true}'),
('dmg-cursed-dependent-conditions','Dependent Item Condition Table','273','table',
 'Circumstances that can govern whether a dependent cursed item functions.',
 '["magic-items","cursed-items","dependent","random-generation"]','{"ranges":[[1,3,"temperature below freezing"],[4,5,"temperature above freezing"],[6,10,"during day"],[11,15,"during night"],[16,20,"direct sunlight"],[21,25,"out of direct sunlight"],[26,34,"underwater"],[35,37,"out of water"],[38,45,"underground"],[46,55,"aboveground"],[56,60,"within 10 feet random creature type"],[61,64,"within 10 feet random race or kind"],[65,72,"within 10 feet arcane spellcaster"],[73,80,"within 10 feet divine spellcaster"],[81,85,"held by nonspellcaster"],[86,90,"held by spellcaster"],[91,95,"held by particular alignment"],[96,96,"held by particular gender"],[97,99,"nonholy days or particular astrological events"],[100,100,"more than 100 miles from particular site"]]}'),
('dmg-cursed-requirements','Cursed Item Requirements','273','guidance',
 'Requirement curses impose specific ongoing or one-time conditions chosen to fit the item. Failure to meet the requirement makes the item stop functioning; the DMG gives examples such as unusual food/sleep needs, sacrifices, fealty, deity worship, class or skill requirements, daily cleansing, daily use, bloodletting, or a daily spell.',
 '["magic-items","cursed-items","requirement"]','{"randomize":false,"chooseToFitItem":true,"failure":"item ceases to function","frequency":"varies: one-time, daily, weekly, monthly, or continuous"}'),
('dmg-cursed-drawbacks','Cursed Item Drawback Table','273','table',
 'Percentile table for persistent or one-time cursed-item drawbacks.',
 '["magic-items","cursed-items","drawback","random-generation"]','{"ranges":[[1,4,"hair grows 1 inch once"],[5,9,"height changes by 1/2 inch once"],[10,13,"temperature around item 10F colder"],[14,17,"temperature around item 10F warmer"],[18,21,"hair color changes"],[22,25,"skin color changes"],[26,29,"identifying mark appears"],[30,32,"gender changes"],[33,34,"race or kind changes"],[35,35,"incurable random disease"],[36,39,"item emits disturbing sound"],[40,40,"item looks ridiculous"],[41,45,"selfishly possessive of item"],[46,49,"paranoid about losing or damaging item"],[50,51,"alignment changes"],[52,54,"5% daily chance attack nearest creature"],[55,57,"stunned 1d4 rounds after use or once daily"],[58,60,"blurry vision: -2 attacks saves and vision skills"],[61,64,"one negative level"],[65,65,"two negative levels"],[66,70,"daily Will save or 1 Intelligence damage"],[71,75,"daily Will save or 1 Wisdom damage"],[76,80,"daily Will save or 1 Charisma damage"],[81,85,"daily Fortitude save or 1 Constitution damage"],[86,90,"daily Fortitude save or 1 Strength damage"],[91,95,"daily Fortitude save or 1 Dexterity damage"],[96,96,"5% daily chance polymorph into specific creature"],[97,97,"cannot cast arcane spells"],[98,98,"cannot cast divine spells"],[99,99,"cannot cast any spells"],[100,100,"DM chooses or creates appropriate drawback"]]}'),
('dmg-cursed-identification','Identifying Cursed Items','273-274','rule',
 'Detect magic usually shows a misleading aura. Identify has only a 1% chance per caster level to reveal a cursed item''s true properties, including the curse. Analyze dweomer reveals its true nature.',
 '["magic-items","cursed-items","identification"]','{"detectMagic":"misleading aura and strength","identifySuccessPercentPerCasterLevel":1,"analyzeDweomer":"reveals true nature"}'),
('dmg-table-7-31-specific-cursed-items','Table 7-31: Specific Cursed Items','274','table',
 'Complete percentile mapping for the DMG''s specific cursed-item catalog.',
 '["magic-items","cursed-items","specific-items","random-generation","table-7-31"]',
 json_object('results',json((SELECT json_group_array(json_array(min_roll,max_roll,slug,price_copper)) FROM _dmg_cursed_items))))
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

DROP TABLE _dmg_cursed_items;