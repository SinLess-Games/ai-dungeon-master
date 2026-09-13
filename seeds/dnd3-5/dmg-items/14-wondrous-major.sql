-- Dungeon Master's Guide v3.5 Chapter 7: Table 7-29 Major Wondrous Items, p. 251.
-- Every non-reroll result is materialized as a canonical catalog item with the exact table market price.
-- Item-specific descriptive mechanics remain source-backed by the DMG wondrous-item descriptions on pp. 246-268.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_wondrous_major AS
SELECT json_extract(value,'$[0]') roll,json_extract(value,'$[1]') slug,json_extract(value,'$[2]') name,
       json_extract(value,'$[3]') price_copper,json_extract(value,'$[4]') slot
FROM json_each('[
 [1,"figurine-wondrous-power-obsidian-steed","Figurine of Wondrous Power, Obsidian Steed",2850000,"slotless"],
 [2,"drums-of-panic","Drums of Panic",3000000,"slotless"],
 [3,"ioun-stone-orange-prism","Ioun Stone, Orange Prism",3000000,"slotless"],
 [4,"ioun-stone-pale-green-prism","Ioun Stone, Pale Green Prism",3000000,"slotless"],
 [5,"lantern-of-revealing","Lantern of Revealing",3000000,"slotless"],
 [6,"robe-of-blending","Robe of Blending",3000000,"body"],
 [7,"amulet-of-natural-armor-4","Amulet of Natural Armor +4",3200000,"throat"],
 [8,"amulet-of-proof-against-detection-and-location","Amulet of Proof against Detection and Location",3500000,"throat"],
 [9,"carpet-of-flying-5x10","Carpet of Flying, 5 ft. by 10 ft.",3500000,"slotless"],
 [10,"golem-manual-iron","Golem Manual, Iron",3500000,"slotless"],
 [11,"amulet-of-health-6","Amulet of Health +6",3600000,"throat"],
 [12,"belt-of-giant-strength-6","Belt of Giant Strength +6",3600000,"waist"],
 [13,"bracers-of-armor-6","Bracers of Armor +6",3600000,"arms"],
 [14,"cloak-of-charisma-6","Cloak of Charisma +6",3600000,"shoulders"],
 [15,"gloves-of-dexterity-6","Gloves of Dexterity +6",3600000,"hands"],
 [16,"headband-of-intellect-6","Headband of Intellect +6",3600000,"head"],
 [17,"ioun-stone-vibrant-purple-prism","Ioun Stone, Vibrant Purple Prism",3600000,"slotless"],
 [18,"pearl-of-power-6","Pearl of Power, 6th-Level Spell",3600000,"slotless"],
 [19,"periapt-of-wisdom-6","Periapt of Wisdom +6",3600000,"throat"],
 [20,"scarab-of-protection","Scarab of Protection",3800000,"throat"],
 [21,"ioun-stone-lavender-and-green-ellipsoid","Ioun Stone, Lavender and Green Ellipsoid",4000000,"slotless"],
 [22,"ring-gates","Ring Gates",4000000,"slotless"],
 [23,"crystal-ball","Crystal Ball",4200000,"slotless"],
 [24,"golem-manual-greater-stone","Golem Manual, Greater Stone",4400000,"slotless"],
 [25,"strand-of-prayer-beads","Strand of Prayer Beads",4580000,"throat"],
 [26,"orb-of-storms","Orb of Storms",4800000,"slotless"],
 [27,"boots-of-teleportation","Boots of Teleportation",4900000,"feet"],
 [28,"bracers-of-armor-7","Bracers of Armor +7",4900000,"arms"],
 [29,"pearl-of-power-7","Pearl of Power, 7th-Level Spell",4900000,"slotless"],
 [30,"amulet-of-natural-armor-5","Amulet of Natural Armor +5",5000000,"throat"],
 [31,"cloak-of-displacement-major","Cloak of Displacement, Major",5000000,"shoulders"],
 [32,"crystal-ball-see-invisibility","Crystal Ball with See Invisibility",5000000,"slotless"],
 [33,"horn-of-valhalla","Horn of Valhalla",5000000,"slotless"],
 [34,"crystal-ball-detect-thoughts","Crystal Ball with Detect Thoughts",5100000,"slotless"],
 [35,"amulet-of-mighty-fists-3","Amulet of Mighty Fists +3",5400000,"throat"],
 [36,"wings-of-flying","Wings of Flying",5400000,"shoulders"],
 [37,"cloak-of-etherealness","Cloak of Etherealness",5500000,"shoulders"],
 [38,"daerns-instant-fortress","Daern''s Instant Fortress",5500000,"slotless"],
 [39,"manual-of-bodily-health-2","Manual of Bodily Health +2",5500000,"slotless"],
 [40,"manual-of-gainful-exercise-2","Manual of Gainful Exercise +2",5500000,"slotless"],
 [41,"manual-of-quickness-in-action-2","Manual of Quickness in Action +2",5500000,"slotless"],
 [42,"tome-of-clear-thought-2","Tome of Clear Thought +2",5500000,"slotless"],
 [43,"tome-of-leadership-and-influence-2","Tome of Leadership and Influence +2",5500000,"slotless"],
 [44,"tome-of-understanding-2","Tome of Understanding +2",5500000,"slotless"],
 [45,"eyes-of-charming","Eyes of Charming",5600000,"face"],
 [46,"robe-of-stars","Robe of Stars",5800000,"body"],
 [47,"carpet-of-flying-10x10","Carpet of Flying, 10 ft. by 10 ft.",6000000,"slotless"],
 [48,"darkskull","Darkskull",6000000,"slotless"],
 [49,"cube-of-force","Cube of Force",6200000,"slotless"],
 [50,"bracers-of-armor-8","Bracers of Armor +8",6400000,"arms"],
 [51,"pearl-of-power-8","Pearl of Power, 8th-Level Spell",6400000,"slotless"],
 [52,"crystal-ball-telepathy","Crystal Ball with Telepathy",7000000,"slotless"],
 [53,"horn-of-blasting-greater","Horn of Blasting, Greater",7000000,"slotless"],
 [54,"pearl-of-power-two-spells","Pearl of Power, Two Spells",7000000,"slotless"],
 [55,"helm-of-teleportation","Helm of Teleportation",7350000,"head"],
 [56,"gem-of-seeing","Gem of Seeing",7500000,"face"],
 [57,"robe-of-the-archmagi","Robe of the Archmagi",7500000,"body"],
 [58,"mantle-of-faith","Mantle of Faith",7600000,"shoulders"],
 [59,"crystal-ball-true-seeing","Crystal Ball with True Seeing",8000000,"slotless"],
 [60,"pearl-of-power-9","Pearl of Power, 9th-Level Spell",8100000,"slotless"],
 [61,"well-of-many-worlds","Well of Many Worlds",8200000,"slotless"],
 [62,"manual-of-bodily-health-3","Manual of Bodily Health +3",8250000,"slotless"],
 [63,"manual-of-gainful-exercise-3","Manual of Gainful Exercise +3",8250000,"slotless"],
 [64,"manual-of-quickness-in-action-3","Manual of Quickness in Action +3",8250000,"slotless"],
 [65,"tome-of-clear-thought-3","Tome of Clear Thought +3",8250000,"slotless"],
 [66,"tome-of-leadership-and-influence-3","Tome of Leadership and Influence +3",8250000,"slotless"],
 [67,"tome-of-understanding-3","Tome of Understanding +3",8250000,"slotless"],
 [68,"apparatus-of-kwalish","Apparatus of Kwalish",9000000,"slotless"],
 [69,"mantle-of-spell-resistance","Mantle of Spell Resistance",9000000,"shoulders"],
 [70,"mirror-of-opposition","Mirror of Opposition",9200000,"slotless"],
 [71,"strand-of-prayer-beads-greater","Strand of Prayer Beads, Greater",9580000,"throat"],
 [72,"amulet-of-mighty-fists-4","Amulet of Mighty Fists +4",9600000,"throat"],
 [73,"eyes-of-petrification","Eyes of Petrification",9800000,"face"],
 [74,"bowl-of-commanding-water-elementals","Bowl of Commanding Water Elementals",10000000,"slotless"],
 [75,"brazier-of-commanding-fire-elementals","Brazier of Commanding Fire Elementals",10000000,"slotless"],
 [76,"censer-of-controlling-air-elementals","Censer of Controlling Air Elementals",10000000,"slotless"],
 [77,"stone-of-controlling-earth-elementals","Stone of Controlling Earth Elementals",10000000,"slotless"],
 [78,"manual-of-bodily-health-4","Manual of Bodily Health +4",11000000,"slotless"],
 [79,"manual-of-gainful-exercise-4","Manual of Gainful Exercise +4",11000000,"slotless"],
 [80,"manual-of-quickness-in-action-4","Manual of Quickness in Action +4",11000000,"slotless"],
 [81,"tome-of-clear-thought-4","Tome of Clear Thought +4",11000000,"slotless"],
 [82,"tome-of-leadership-and-influence-4","Tome of Leadership and Influence +4",11000000,"slotless"],
 [83,"tome-of-understanding-4","Tome of Understanding +4",11000000,"slotless"],
 [84,"amulet-of-the-planes","Amulet of the Planes",12000000,"throat"],
 [85,"robe-of-eyes","Robe of Eyes",12000000,"body"],
 [86,"helm-of-brilliance","Helm of Brilliance",12500000,"head"],
 [87,"manual-of-bodily-health-5","Manual of Bodily Health +5",13750000,"slotless"],
 [88,"manual-of-gainful-exercise-5","Manual of Gainful Exercise +5",13750000,"slotless"],
 [89,"manual-of-quickness-in-action-5","Manual of Quickness in Action +5",13750000,"slotless"],
 [90,"tome-of-clear-thought-5","Tome of Clear Thought +5",13750000,"slotless"],
 [91,"tome-of-leadership-and-influence-5","Tome of Leadership and Influence +5",13750000,"slotless"],
 [92,"tome-of-understanding-5","Tome of Understanding +5",13750000,"slotless"],
 [93,"efreeti-bottle","Efreeti Bottle",14500000,"slotless"],
 [94,"amulet-of-mighty-fists-5","Amulet of Mighty Fists +5",15000000,"throat"],
 [95,"chaos-diamond","Chaos Diamond",16000000,"slotless"],
 [96,"cubic-gate","Cubic Gate",16400000,"slotless"],
 [97,"iron-flask","Iron Flask",17000000,"slotless"],
 [98,"mirror-of-mental-prowess","Mirror of Mental Prowess",17500000,"slotless"],
 [99,"mirror-of-life-trapping","Mirror of Life Trapping",20000000,"slotless"]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT 'dmg-item-'||w.slug,'dmg-3.5','251',w.slug,w.name,
       'Standard major wondrous item from Dungeon Master''s Guide Table 7-29.',
       'Use the source-backed wondrous-item description in Dungeon Master''s Guide Chapter 7 for full activation, effect, aura, caster-level, and construction mechanics.',
       0,NULL,1,'magic',w.price_copper,NULL,NULL,NULL,NULL
FROM _dmg_wondrous_major w
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=w.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT 'dmg-item-'||w.slug,NULL,NULL,NULL,NULL,'other',
       'Activation varies by item; resolve using the source-backed DMG wondrous-item description.',
       w.slot,NULL,NULL,0,NULL,NULL,'Craft Wondrous Item and source-listed prerequisites; see DMG item description.',NULL
FROM _dmg_wondrous_major w;

INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-dmg-table-7-29-major-wondrous','dmg-3.5','251','dmg-table-7-29-major-wondrous','Table 7-29: Major Wondrous Items',
       'Complete percentile mapping for standard major wondrous-item treasure. A result of 100 is rerolled.',
       'Complete percentile mapping for standard major wondrous-item treasure. A result of 100 is rerolled.',
       0,NULL,1,'magic-items','table',0,1,NULL,NULL,
       '["magic-items","wondrous-items","major","random-generation","table-7-29"]',
       json_object('results',json((SELECT json_group_array(json_array(roll,slug,price_copper)) FROM _dmg_wondrous_major)),'reroll',100)
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-table-7-29-major-wondrous' AND r.owner_user_id IS NULL
);

DROP TABLE _dmg_wondrous_major;
