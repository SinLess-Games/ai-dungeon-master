-- Dungeon Master's Guide v3.5 Chapter 7: Table 7-27 Minor Wondrous Items, p. 247.
-- This file materializes every non-reroll result as a canonical catalog item with its exact table market price.
-- Item-specific prose/mechanics remain source-backed by the DMG descriptions on pp. 246-268 and can be enriched independently.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

CREATE TEMP TABLE _dmg_wondrous_minor AS
SELECT
  json_extract(value,'$[0]') roll,
  json_extract(value,'$[1]') slug,
  json_extract(value,'$[2]') name,
  json_extract(value,'$[3]') price_copper,
  json_extract(value,'$[4]') slot
FROM json_each('[
 [1,"quaals-feather-token-anchor","Quaal''s Feather Token, Anchor",5000,"slotless"],
 [2,"universal-solvent","Universal Solvent",5000,"slotless"],
 [3,"elixir-of-love","Elixir of Love",15000,"slotless"],
 [4,"unguent-of-timelessness","Unguent of Timelessness",15000,"slotless"],
 [5,"quaals-feather-token-fan","Quaal''s Feather Token, Fan",20000,"slotless"],
 [6,"dust-of-tracelessness","Dust of Tracelessness",25000,"slotless"],
 [7,"elixir-of-hiding","Elixir of Hiding",25000,"slotless"],
 [8,"elixir-of-sneaking","Elixir of Sneaking",25000,"slotless"],
 [9,"elixir-of-swimming","Elixir of Swimming",25000,"slotless"],
 [10,"elixir-of-vision","Elixir of Vision",25000,"slotless"],
 [11,"silversheen","Silversheen",25000,"slotless"],
 [12,"quaals-feather-token-bird","Quaal''s Feather Token, Bird",30000,"slotless"],
 [13,"quaals-feather-token-tree","Quaal''s Feather Token, Tree",40000,"slotless"],
 [14,"quaals-feather-token-swan-boat","Quaal''s Feather Token, Swan Boat",45000,"slotless"],
 [15,"elixir-of-truth","Elixir of Truth",50000,"slotless"],
 [16,"quaals-feather-token-whip","Quaal''s Feather Token, Whip",50000,"slotless"],
 [17,"dust-of-dryness","Dust of Dryness",85000,"slotless"],
 [18,"bag-of-tricks-gray","Bag of Tricks, Gray",90000,"slotless"],
 [19,"hand-of-the-mage","Hand of the Mage",90000,"throat"],
 [20,"bracers-of-armor-1","Bracers of Armor +1",100000,"arms"],
 [21,"cloak-of-resistance-1","Cloak of Resistance +1",100000,"shoulders"],
 [22,"pearl-of-power-1","Pearl of Power, 1st-Level Spell",100000,"slotless"],
 [23,"phylactery-of-faithfulness","Phylactery of Faithfulness",100000,"head"],
 [24,"salve-of-slipperiness","Salve of Slipperiness",100000,"slotless"],
 [25,"elixir-of-fire-breath","Elixir of Fire Breath",110000,"slotless"],
 [26,"pipes-of-the-sewers","Pipes of the Sewers",115000,"slotless"],
 [27,"dust-of-illusion","Dust of Illusion",120000,"slotless"],
 [28,"goggles-of-minute-seeing","Goggles of Minute Seeing",125000,"face"],
 [29,"brooch-of-shielding","Brooch of Shielding",150000,"throat"],
 [30,"necklace-of-fireballs-type-1","Necklace of Fireballs Type I",165000,"throat"],
 [31,"dust-of-appearance","Dust of Appearance",180000,"slotless"],
 [32,"hat-of-disguise","Hat of Disguise",180000,"head"],
 [33,"pipes-of-sounding","Pipes of Sounding",180000,"slotless"],
 [34,"quiver-of-ehlonna","Quiver of Ehlonna",180000,"slotless"],
 [35,"amulet-of-natural-armor-1","Amulet of Natural Armor +1",200000,"throat"],
 [36,"hewards-handy-haversack","Heward''s Handy Haversack",200000,"slotless"],
 [37,"horn-of-fog","Horn of Fog",200000,"slotless"],
 [38,"elemental-gem","Elemental Gem",225000,"slotless"],
 [39,"robe-of-bones","Robe of Bones",240000,"body"],
 [40,"sovereign-glue","Sovereign Glue",240000,"slotless"],
 [41,"bag-of-holding-type-1","Bag of Holding Type I",250000,"slotless"],
 [42,"boots-of-elvenkind","Boots of Elvenkind",250000,"feet"],
 [43,"boots-of-the-winterlands","Boots of the Winterlands",250000,"feet"],
 [44,"candle-of-truth","Candle of Truth",250000,"slotless"],
 [45,"cloak-of-elvenkind","Cloak of Elvenkind",250000,"shoulders"],
 [46,"eyes-of-the-eagle","Eyes of the Eagle",250000,"face"],
 [47,"scarab-golembane","Scarab, Golembane",250000,"throat"],
 [48,"necklace-of-fireballs-type-2","Necklace of Fireballs Type II",270000,"throat"],
 [49,"stone-of-alarm","Stone of Alarm",270000,"slotless"],
 [50,"bag-of-tricks-rust","Bag of Tricks, Rust",300000,"slotless"],
 [51,"bead-of-force","Bead of Force",300000,"slotless"],
 [52,"chime-of-opening","Chime of Opening",300000,"slotless"],
 [53,"horseshoes-of-speed","Horseshoes of Speed",300000,"feet"],
 [54,"rope-of-climbing","Rope of Climbing",300000,"slotless"],
 [55,"dust-of-disappearance","Dust of Disappearance",350000,"slotless"],
 [56,"lens-of-detection","Lens of Detection",350000,"face"],
 [57,"figurine-wondrous-power-silver-raven","Figurine of Wondrous Power, Silver Raven",380000,"slotless"],
 [58,"amulet-of-health-2","Amulet of Health +2",400000,"throat"],
 [59,"bracers-of-armor-2","Bracers of Armor +2",400000,"arms"],
 [60,"cloak-of-charisma-2","Cloak of Charisma +2",400000,"shoulders"],
 [61,"cloak-of-resistance-2","Cloak of Resistance +2",400000,"shoulders"],
 [62,"gauntlets-of-ogre-power","Gauntlets of Ogre Power",400000,"hands"],
 [63,"gloves-of-arrow-snaring","Gloves of Arrow Snaring",400000,"hands"],
 [64,"gloves-of-dexterity-2","Gloves of Dexterity +2",400000,"hands"],
 [65,"headband-of-intellect-2","Headband of Intellect +2",400000,"head"],
 [66,"ioun-stone-clear-spindle","Ioun Stone, Clear Spindle",400000,"slotless"],
 [67,"keoghtoms-ointment","Keoghtom''s Ointment",400000,"slotless"],
 [68,"nolzurs-marvelous-pigments","Nolzur''s Marvelous Pigments",400000,"slotless"],
 [69,"pearl-of-power-2","Pearl of Power, 2nd-Level Spell",400000,"slotless"],
 [70,"periapt-of-wisdom-2","Periapt of Wisdom +2",400000,"throat"],
 [71,"stone-salve","Stone Salve",400000,"slotless"],
 [72,"necklace-of-fireballs-type-3","Necklace of Fireballs Type III",435000,"throat"],
 [73,"circlet-of-persuasion","Circlet of Persuasion",450000,"head"],
 [74,"slippers-of-spider-climbing","Slippers of Spider Climbing",480000,"feet"],
 [75,"incense-of-meditation","Incense of Meditation",490000,"slotless"],
 [76,"bag-of-holding-type-2","Bag of Holding Type II",500000,"slotless"],
 [77,"bracers-of-archery-lesser","Bracers of Archery, Lesser",500000,"arms"],
 [78,"ioun-stone-dusty-rose-prism","Ioun Stone, Dusty Rose Prism",500000,"slotless"],
 [79,"helm-of-comprehend-languages-and-read-magic","Helm of Comprehend Languages and Read Magic",520000,"head"],
 [80,"vest-of-escape","Vest of Escape",520000,"torso"],
 [81,"eversmoking-bottle","Eversmoking Bottle",540000,"slotless"],
 [82,"murlynds-spoon","Murlynd''s Spoon",540000,"slotless"],
 [83,"necklace-of-fireballs-type-4","Necklace of Fireballs Type IV",540000,"throat"],
 [84,"boots-of-striding-and-springing","Boots of Striding and Springing",550000,"feet"],
 [85,"wind-fan","Wind Fan",550000,"slotless"],
 [86,"necklace-of-fireballs-type-5","Necklace of Fireballs Type V",585000,"throat"],
 [87,"amulet-of-mighty-fists-1","Amulet of Mighty Fists +1",600000,"throat"],
 [88,"horseshoes-of-a-zephyr","Horseshoes of a Zephyr",600000,"feet"],
 [89,"pipes-of-haunting","Pipes of Haunting",600000,"slotless"],
 [90,"gloves-of-swimming-and-climbing","Gloves of Swimming and Climbing",625000,"hands"],
 [91,"bag-of-tricks-tan","Bag of Tricks, Tan",630000,"slotless"],
 [92,"circlet-of-blasting-minor","Circlet of Blasting, Minor",648000,"head"],
 [93,"horn-of-goodness-evil","Horn of Goodness/Evil",650000,"slotless"],
 [94,"robe-of-useful-items","Robe of Useful Items",700000,"body"],
 [95,"boat-folding","Boat, Folding",720000,"slotless"],
 [96,"cloak-of-the-manta-ray","Cloak of the Manta Ray",720000,"shoulders"],
 [97,"bottle-of-air","Bottle of Air",725000,"slotless"],
 [98,"bag-of-holding-type-3","Bag of Holding Type III",740000,"slotless"],
 [99,"periapt-of-health","Periapt of Health",740000,"throat"]
]');

INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT
 'dmg-item-'||w.slug,'dmg-3.5','247',w.slug,w.name,
 'Standard minor wondrous item from Dungeon Master''s Guide Table 7-27.',
 'Use the source-backed wondrous-item description in Dungeon Master''s Guide Chapter 7 for full activation, effect, aura, caster-level, and construction mechanics.',
 0,NULL,1,'magic',w.price_copper,NULL,NULL,NULL,NULL
FROM _dmg_wondrous_minor w
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=w.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT
 'dmg-item-'||w.slug,NULL,NULL,NULL,NULL,'other',
 'Activation varies by item; resolve using the source-backed DMG wondrous-item description.',
 w.slot,NULL,NULL,0,NULL,NULL,'Craft Wondrous Item and source-listed prerequisites; see DMG item description.',NULL
FROM _dmg_wondrous_minor w;

INSERT INTO dnd35_rules
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
 'dmg-rule-dmg-table-7-27-minor-wondrous','dmg-3.5','247','dmg-table-7-27-minor-wondrous','Table 7-27: Minor Wondrous Items',
 'Complete percentile mapping for standard minor wondrous-item treasure. A result of 100 is rerolled.',
 'Complete percentile mapping for standard minor wondrous-item treasure. A result of 100 is rerolled.',
 0,NULL,1,'magic-items','table',0,1,NULL,NULL,
 '["magic-items","wondrous-items","minor","random-generation","table-7-27"]',
 json_object('results',json((SELECT json_group_array(json_array(roll,slug,price_copper)) FROM _dmg_wondrous_minor)),'reroll',100)
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-table-7-27-minor-wondrous' AND r.owner_user_id IS NULL
);

DROP TABLE _dmg_wondrous_minor;
