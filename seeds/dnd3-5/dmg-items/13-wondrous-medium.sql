-- Dungeon Master's Guide v3.5 Chapter 7: Table 7-28 Medium Wondrous Items, p. 249.
-- Every percentile result is materialized as a canonical catalog item with its exact table market price.
-- Item-specific descriptive mechanics remain source-backed by the DMG wondrous-item entries on pp. 246-268.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_wondrous_medium AS
SELECT json_extract(value,'$[0]') roll,json_extract(value,'$[1]') slug,json_extract(value,'$[2]') name,
       json_extract(value,'$[3]') price_copper,json_extract(value,'$[4]') slot
FROM json_each('[
 [1,"boots-of-levitation","Boots of Levitation",750000,"feet"],
 [2,"harp-of-charming","Harp of Charming",750000,"slotless"],
 [3,"amulet-of-natural-armor-2","Amulet of Natural Armor +2",800000,"throat"],
 [4,"golem-manual-flesh","Golem Manual, Flesh",800000,"slotless"],
 [5,"hand-of-glory","Hand of Glory",800000,"throat"],
 [6,"ioun-stone-deep-red-sphere","Ioun Stone, Deep Red Sphere",800000,"slotless"],
 [7,"ioun-stone-incandescent-blue-sphere","Ioun Stone, Incandescent Blue Sphere",800000,"slotless"],
 [8,"ioun-stone-pale-blue-rhomboid","Ioun Stone, Pale Blue Rhomboid",800000,"slotless"],
 [9,"ioun-stone-pink-and-green-sphere","Ioun Stone, Pink and Green Sphere",800000,"slotless"],
 [10,"ioun-stone-pink-rhomboid","Ioun Stone, Pink Rhomboid",800000,"slotless"],
 [11,"ioun-stone-scarlet-and-blue-sphere","Ioun Stone, Scarlet and Blue Sphere",800000,"slotless"],
 [12,"deck-of-illusions","Deck of Illusions",810000,"slotless"],
 [13,"necklace-of-fireballs-type-6","Necklace of Fireballs Type VI",810000,"throat"],
 [14,"candle-of-invocation","Candle of Invocation",840000,"slotless"],
 [15,"necklace-of-fireballs-type-7","Necklace of Fireballs Type VII",870000,"throat"],
 [16,"bracers-of-armor-3","Bracers of Armor +3",900000,"arms"],
 [17,"cloak-of-resistance-3","Cloak of Resistance +3",900000,"shoulders"],
 [18,"decanter-of-endless-water","Decanter of Endless Water",900000,"slotless"],
 [19,"necklace-of-adaptation","Necklace of Adaptation",900000,"throat"],
 [20,"pearl-of-power-3","Pearl of Power, 3rd-Level Spell",900000,"slotless"],
 [21,"figurine-wondrous-power-serpentine-owl","Figurine of Wondrous Power, Serpentine Owl",910000,"slotless"],
 [22,"strand-of-prayer-beads-lesser","Strand of Prayer Beads, Lesser",960000,"throat"],
 [23,"bag-of-holding-type-4","Bag of Holding Type IV",1000000,"slotless"],
 [24,"figurine-wondrous-power-bronze-griffon","Figurine of Wondrous Power, Bronze Griffon",1000000,"slotless"],
 [25,"figurine-wondrous-power-ebony-fly","Figurine of Wondrous Power, Ebony Fly",1000000,"slotless"],
 [26,"glove-of-storing","Glove of Storing",1000000,"hands"],
 [27,"ioun-stone-dark-blue-rhomboid","Ioun Stone, Dark Blue Rhomboid",1000000,"slotless"],
 [28,"stone-horse-courser","Stone Horse, Courser",1000000,"slotless"],
 [29,"druids-vestment","Druid''s Vestment",1000000,"torso"],
 [30,"cape-of-the-mountebank","Cape of the Mountebank",1008000,"shoulders"],
 [31,"phylactery-of-undead-turning","Phylactery of Undead Turning",1100000,"head"],
 [32,"gauntlet-of-rust","Gauntlet of Rust",1150000,"hands"],
 [33,"boots-of-speed","Boots of Speed",1200000,"feet"],
 [34,"goggles-of-night","Goggles of Night",1200000,"face"],
 [35,"golem-manual-clay","Golem Manual, Clay",1200000,"slotless"],
 [36,"medallion-of-thoughts","Medallion of Thoughts",1200000,"throat"],
 [37,"pipes-of-pain","Pipes of Pain",1200000,"slotless"],
 [38,"boccobs-blessed-book","Boccob''s Blessed Book",1250000,"slotless"],
 [39,"monks-belt","Monk''s Belt",1300000,"waist"],
 [40,"gem-of-brightness","Gem of Brightness",1300000,"slotless"],
 [41,"lyre-of-building","Lyre of Building",1300000,"slotless"],
 [42,"cloak-of-arachnida","Cloak of Arachnida",1400000,"shoulders"],
 [43,"stone-horse-destrier","Stone Horse, Destrier",1480000,"slotless"],
 [44,"belt-of-dwarvenkind","Belt of Dwarvenkind",1490000,"waist"],
 [45,"periapt-of-wound-closure","Periapt of Wound Closure",1500000,"throat"],
 [46,"horn-of-the-tritons","Horn of the Tritons",1510000,"slotless"],
 [47,"pearl-of-the-sirines","Pearl of the Sirines",1530000,"slotless"],
 [48,"figurine-wondrous-power-onyx-dog","Figurine of Wondrous Power, Onyx Dog",1550000,"slotless"],
 [49,"amulet-of-health-4","Amulet of Health +4",1600000,"throat"],
 [50,"belt-of-giant-strength-4","Belt of Giant Strength +4",1600000,"waist"],
 [51,"boots-winged","Boots, Winged",1600000,"feet"],
 [52,"bracers-of-armor-4","Bracers of Armor +4",1600000,"arms"],
 [53,"cloak-of-charisma-4","Cloak of Charisma +4",1600000,"shoulders"],
 [54,"cloak-of-resistance-4","Cloak of Resistance +4",1600000,"shoulders"],
 [55,"gloves-of-dexterity-4","Gloves of Dexterity +4",1600000,"hands"],
 [56,"headband-of-intellect-4","Headband of Intellect +4",1600000,"head"],
 [57,"pearl-of-power-4","Pearl of Power, 4th-Level Spell",1600000,"slotless"],
 [58,"periapt-of-wisdom-4","Periapt of Wisdom +4",1600000,"throat"],
 [59,"scabbard-of-keen-edges","Scabbard of Keen Edges",1600000,"slotless"],
 [60,"figurine-wondrous-power-golden-lions","Figurine of Wondrous Power, Golden Lions",1650000,"slotless"],
 [61,"chime-of-interruption","Chime of Interruption",1680000,"slotless"],
 [62,"broom-of-flying","Broom of Flying",1700000,"slotless"],
 [63,"figurine-wondrous-power-marble-elephant","Figurine of Wondrous Power, Marble Elephant",1700000,"slotless"],
 [64,"amulet-of-natural-armor-3","Amulet of Natural Armor +3",1800000,"throat"],
 [65,"ioun-stone-iridescent-spindle","Ioun Stone, Iridescent Spindle",1800000,"slotless"],
 [66,"bracelet-of-friends","Bracelet of Friends",1900000,"arms"],
 [67,"carpet-of-flying-5x5","Carpet of Flying, 5 ft. by 5 ft.",2000000,"slotless"],
 [68,"horn-of-blasting","Horn of Blasting",2000000,"slotless"],
 [69,"ioun-stone-pale-lavender-ellipsoid","Ioun Stone, Pale Lavender Ellipsoid",2000000,"slotless"],
 [70,"ioun-stone-pearly-white-spindle","Ioun Stone, Pearly White Spindle",2000000,"slotless"],
 [71,"portable-hole","Portable Hole",2000000,"slotless"],
 [72,"stone-of-good-luck","Stone of Good Luck (Luckstone)",2000000,"slotless"],
 [73,"figurine-wondrous-power-ivory-goats","Figurine of Wondrous Power, Ivory Goats",2100000,"slotless"],
 [74,"rope-of-entanglement","Rope of Entanglement",2100000,"slotless"],
 [75,"golem-manual-stone","Golem Manual, Stone",2200000,"slotless"],
 [76,"mask-of-the-skull","Mask of the Skull",2200000,"face"],
 [77,"mattock-of-the-titans","Mattock of the Titans",2334800,"both_hands"],
 [78,"circlet-of-blasting-major","Circlet of Blasting, Major",2376000,"head"],
 [79,"amulet-of-mighty-fists-2","Amulet of Mighty Fists +2",2400000,"throat"],
 [80,"cloak-of-displacement-minor","Cloak of Displacement, Minor",2400000,"shoulders"],
 [81,"helm-of-underwater-action","Helm of Underwater Action",2400000,"head"],
 [82,"bracers-of-archery-greater","Bracers of Archery, Greater",2500000,"arms"],
 [83,"bracers-of-armor-5","Bracers of Armor +5",2500000,"arms"],
 [84,"cloak-of-resistance-5","Cloak of Resistance +5",2500000,"shoulders"],
 [85,"eyes-of-doom","Eyes of Doom",2500000,"face"],
 [86,"pearl-of-power-5","Pearl of Power, 5th-Level Spell",2500000,"slotless"],
 [87,"maul-of-the-titans","Maul of the Titans",2530500,"both_hands"],
 [88,"cloak-of-the-bat","Cloak of the Bat",2600000,"shoulders"],
 [89,"iron-bands-of-bilarro","Iron Bands of Bilarro",2600000,"slotless"],
 [90,"cube-of-frost-resistance","Cube of Frost Resistance",2700000,"slotless"],
 [91,"helm-of-telepathy","Helm of Telepathy",2700000,"head"],
 [92,"periapt-of-proof-against-poison","Periapt of Proof against Poison",2700000,"throat"],
 [93,"robe-of-scintillating-colors","Robe of Scintillating Colors",2700000,"body"],
 [94,"manual-of-bodily-health-1","Manual of Bodily Health +1",2750000,"slotless"],
 [95,"manual-of-gainful-exercise-1","Manual of Gainful Exercise +1",2750000,"slotless"],
 [96,"manual-of-quickness-in-action-1","Manual of Quickness in Action +1",2750000,"slotless"],
 [97,"tome-of-clear-thought-1","Tome of Clear Thought +1",2750000,"slotless"],
 [98,"tome-of-leadership-and-influence-1","Tome of Leadership and Influence +1",2750000,"slotless"],
 [99,"tome-of-understanding-1","Tome of Understanding +1",2750000,"slotless"],
 [100,"dimensional-shackles","Dimensional Shackles",2800000,"slotless"]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT 'dmg-item-'||w.slug,'dmg-3.5','249',w.slug,w.name,
       'Standard medium wondrous item from Dungeon Master''s Guide Table 7-28.',
       'Use the source-backed wondrous-item description in Dungeon Master''s Guide Chapter 7 for full activation, effect, aura, caster-level, and construction mechanics.',
       0,NULL,1,'magic',w.price_copper,NULL,NULL,NULL,NULL
FROM _dmg_wondrous_medium w
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=w.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT 'dmg-item-'||w.slug,NULL,NULL,NULL,NULL,'other',
       'Activation varies by item; resolve using the source-backed DMG wondrous-item description.',
       w.slot,NULL,NULL,0,NULL,NULL,'Craft Wondrous Item and source-listed prerequisites; see DMG item description.',NULL
FROM _dmg_wondrous_medium w;

INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-dmg-table-7-28-medium-wondrous','dmg-3.5','249','dmg-table-7-28-medium-wondrous','Table 7-28: Medium Wondrous Items',
       'Complete percentile mapping for standard medium wondrous-item treasure.',
       'Complete percentile mapping for standard medium wondrous-item treasure.',
       0,NULL,1,'magic-items','table',0,1,NULL,NULL,
       '["magic-items","wondrous-items","medium","random-generation","table-7-28"]',
       json_object('results',json((SELECT json_group_array(json_array(roll,slug,price_copper)) FROM _dmg_wondrous_medium)))
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-table-7-28-medium-wondrous' AND r.owner_user_id IS NULL
);

DROP TABLE _dmg_wondrous_medium;
