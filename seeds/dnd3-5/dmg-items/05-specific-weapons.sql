-- Dungeon Master's Guide v3.5 Chapter 7: specific weapons, pp. 227-229.
-- Mechanical text is summarized; the supplied DMG and appended errata remain authoritative.
-- Luck blades are represented as separate charge-state variants because Table 7-16 prices them separately.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,description,rules_text,category,price_copper,weight_pounds) AS (VALUES
  ('dmg-item-sleep-arrow','228','sleep-arrow','Sleep Arrow','A white-fletched +1 arrow that converts its injury into magical sleep.','A hit that would deal damage instead deals the same amount as nonlethal damage and forces Will DC 11 or the target falls asleep.','ammunition',13200,NULL),
  ('dmg-item-screaming-bolt','227-228','screaming-bolt','Screaming Bolt','A +2 crossbow bolt that screams while in flight.','Enemies of the wielder within 20 feet of the bolt''s path must make Will DC 14 or become shaken; this is a mind-affecting fear effect.','ammunition',26700,NULL),
  ('dmg-item-silver-dagger-masterwork','228','silver-dagger-masterwork','Silver Dagger, Masterwork','A nonmagical masterwork alchemical-silver dagger.','As a masterwork weapon it grants +1 enhancement on attack rolls; it is not magical.','weapon',32200,NULL),
  ('dmg-item-cold-iron-longsword-masterwork','228','cold-iron-longsword-masterwork','Cold Iron Longsword, Masterwork','A nonmagical masterwork longsword forged from cold iron.','As a masterwork weapon it grants +1 enhancement on attack rolls; it is not magical.','weapon',33000,NULL),
  ('dmg-item-javelin-lightning','228','javelin-of-lightning','Javelin of Lightning','A single-use javelin that becomes a lightning bolt when thrown.','When thrown it becomes a 5d6 lightning bolt; Reflex DC 14 halves the damage. The javelin is consumed in the attack.','weapon',150000,NULL),
  ('dmg-item-slaying-arrow','228-229','slaying-arrow','Slaying Arrow','A +1 arrow keyed to one creature type or subtype.','If it strikes its designated creature, that creature makes Fortitude DC 20 or dies; an unliving target is destroyed. Undead and constructs are subject to the save. Against a living target this is a death effect.','ammunition',228200,NULL),
  ('dmg-item-adamantine-dagger','227-228','adamantine-dagger','Adamantine Dagger','A nonmagical masterwork dagger made of adamantine.','As a masterwork weapon it grants +1 enhancement on attack rolls; it is not magical.','weapon',300200,NULL),
  ('dmg-item-adamantine-battleaxe','227-228','adamantine-battleaxe','Adamantine Battleaxe','A nonmagical masterwork battleaxe made of adamantine.','As a masterwork weapon it grants +1 enhancement on attack rolls; it is not magical.','weapon',301000,NULL),
  ('dmg-item-slaying-arrow-greater','228-229','slaying-arrow-greater','Slaying Arrow, Greater','A stronger +1 slaying arrow keyed to one creature type or subtype.','Functions as a slaying arrow, except the Fortitude save DC is 23.','ammunition',405700,NULL),
  ('dmg-item-shatterspike','228','shatterspike','Shatterspike','A +1 longsword built for destroying other weapons.','Without Improved Sunder it functions as a +1 longsword. With Improved Sunder it gives +4 total on the opposed sunder roll and deals 1d8+4 plus Strength modifier to the target weapon on success, still subject to hardness. It can damage weapons with enhancement bonus +4 or lower.','weapon',431500,4.0),
  ('dmg-item-dagger-venom','227-228','dagger-of-venom','Dagger of Venom','A black serrated +1 dagger that can deliver magical poison.','Once per day, after a successful hit and during the same round, the wielder may use a free action to invoke poison as the spell with save DC 14.','weapon',830200,NULL),
  ('dmg-item-trident-warning','229','trident-of-warning','Trident of Warning','A +2 trident that detects aquatic predators.','While grasped and pointed, it reports the location, depth, kind, and number of aquatic predators within 680 feet. Scanning a 680-foot-radius hemisphere takes 1 round.','weapon',1011500,NULL),
  ('dmg-item-assassins-dagger','227-228','assassins-dagger','Assassin''s Dagger','A wicked curved +2 dagger made to reinforce an assassin''s death attack.','Provides +1 to the Fortitude save DC forced by the wielder''s assassin death attack. The item prose prints a market price of 18,302 gp; that prose value is retained here.','weapon',1830200,NULL),
  ('dmg-item-shifters-sorrow','228-229','shifters-sorrow','Shifter''s Sorrow','A +1/+1 alchemical-silver two-bladed sword hostile to shapechangers.','Deals +2d6 damage against creatures with the shapechanger subtype. A shapechanger or creature currently in an alternate form that is struck must make Will DC 15 or return to its natural form.','weapon',1278000,10.0),
  ('dmg-item-trident-fish-command','229','trident-of-fish-command','Trident of Fish Command','A +1 trident that charms and communicates with aquatic animals.','Up to three times per day it can charm up to 14 HD of aquatic animals, no two more than 30 feet apart; Will DC 16 negates, with +5 on the save if the animals are under attack by the wielder or allies. The wielder can communicate with affected aquatic animals as speak with animals. A creature that saves will not approach within 10 feet of the trident.','weapon',1865000,NULL),
  ('dmg-item-flame-tongue','227-228','flame-tongue','Flame Tongue','A +1 flaming-burst longsword with a daily fire ray.','Once per day the wielder can make a ranged touch attack against a target within 30 feet; on a hit the ray deals 4d6 fire damage.','weapon',2071500,NULL),
  ('dmg-item-luck-blade-0','228','luck-blade-0-wishes','Luck Blade (0 Wishes)','A +2 short sword that grants luck and a daily reroll but contains no remaining wishes.','Grants +1 luck on all saving throws and good fortune once per day, allowing one just-made roll to be rerolled with the new result required. This variant has no remaining wishes.','weapon',2206000,NULL),
  ('dmg-item-sword-subtlety','229','sword-of-subtlety','Sword of Subtlety','A thin dull-gray +1 short sword favored by sneak attackers.','Provides +4 on the wielder''s attack and damage rolls when making a sneak attack with the sword.','weapon',2231000,NULL),
  ('dmg-item-sword-planes','229','sword-of-the-planes','Sword of the Planes','A longsword whose enhancement changes with planar context.','Functions as +1 on the Material Plane; +2 on an Elemental Plane or on the Material Plane against elementals; +3 on the Astral or Ethereal Plane or against creatures native to either; and +4 on any other plane or against any outsider.','weapon',2231500,NULL),
  ('dmg-item-nine-lives-stealer','227-228','nine-lives-stealer','Nine Lives Stealer','An evil +2 longsword that can expend nine death-dealing charges on confirmed critical hits.','On a confirmed critical against a creature subject to critical hits, Fortitude DC 20 negates the death effect. A successful save expends no charge and normal critical damage is rolled. After nine successful death effects it remains a +2 longsword. A good wielder gains two negative levels while wielding it; these do not become permanent.','weapon',2305700,NULL),
  ('dmg-item-sword-life-stealing','229','sword-of-life-stealing','Sword of Life Stealing','A black-iron +2 longsword that drains life on critical hits.','A confirmed critical bestows one negative level and grants the wielder 1d6 temporary hit points for 24 hours. One day later the target makes Fortitude DC 16 for that negative level or loses a character level.','weapon',2571500,NULL),
  ('dmg-item-oathbow','227-228','oathbow','Oathbow','An elven +2 mighty composite longbow (+2 Strength) that can swear one foe to death.','Once per day as a free action the wielder may swear to slay one target. Against that target the bow is +5, its arrows deal +2d6 damage, and its critical multiplier becomes x4. Against other foes it is only masterwork and the wielder takes -1 on attacks with other weapons. The oath lasts 7 days or until the wielder slays the sworn foe; only one sworn enemy can exist at a time, and the power cannot be activated again until at least 24 hours after activation.','weapon',2560000,NULL),
  ('dmg-item-mace-terror','228','mace-of-terror','Mace of Terror','A +2 heavy mace that projects a horrifying illusion.','Up to three times per day on command, living creatures in a 30-foot cone are affected as fear; Will DC 16 is partial.','weapon',3855200,NULL),
  ('dmg-item-life-drinker','228','life-drinker','Life-Drinker','A +1 greataxe that drains both its victim and most living wielders.','Each damaging hit bestows two negative levels on the target; after one day each requires Fortitude DC 16 or becomes level loss. Each damaging hit also gives the wielder one negative level lasting 1 hour. Undead and constructs do not suffer the wielder drawback.','weapon',4032000,NULL),
  ('dmg-item-sylvan-scimitar','229','sylvan-scimitar','Sylvan Scimitar','A +3 scimitar empowered in temperate outdoor terrain.','When used outdoors in a temperate climate, grants the wielder Cleave and deals +1d6 damage.','weapon',4731500,NULL),
  ('dmg-item-rapier-puncturing','227-228','rapier-of-puncturing','Rapier of Puncturing','A +2 wounding rapier that can make blood-draining touch attacks.','Three times per day the wielder can make a touch attack with the weapon that deals 1d6 Constitution damage. Creatures immune to critical hits are immune to this Constitution damage.','weapon',5032000,NULL),
  ('dmg-item-sun-blade','229','sun-blade','Sun Blade','A good-aligned sword with the size and damage of a bastard sword but the handling of a short sword.','Functions as +2 normally and +4 against evil. Against undead or creatures of the Negative Energy Plane it deals double damage and x3 damage on a critical. Once per day a command-word sunlight power expands from 10 feet by 5 feet per round for 10 rounds to a 60-foot radius, then fades after another minute. An evil wielder gains one negative level while wielding it.','weapon',5033500,NULL),
  ('dmg-item-frost-brand','228','frost-brand','Frost Brand','A +3 frost greatsword that protects against fire and suppresses flames.','Below 0 F it sheds torchlight that cannot be concealed while drawn. It absorbs the first 10 points of fire damage each round that the wielder would take, extinguishes nonmagical fires in its area, and as a standard action can attempt to dispel lasting fire spells with a 1d20+14 dispel check.','weapon',5447500,NULL),
  ('dmg-item-dwarven-thrower','227-228','dwarven-thrower','Dwarven Thrower','A +2 warhammer whose full power awakens in dwarven hands.','For a dwarf it becomes +3 and returning, has a 30-foot range increment when thrown, and deals +2d8 damage against giants or +1d8 against other targets when thrown.','weapon',6031200,NULL),
  ('dmg-item-luck-blade-1','228','luck-blade-1-wish','Luck Blade (1 Wish)','A +2 short sword granting luck, a daily reroll, and one remaining wish.','Grants +1 luck on all saving throws and good fortune once per day to reroll one just-made roll. Contains one wish; after it is used the sword keeps the +2 enhancement, save bonus, and daily reroll.','weapon',6236000,NULL),
  ('dmg-item-mace-smiting','228','mace-of-smiting','Mace of Smiting','A +3 adamantine heavy mace specialized against constructs and outsiders.','Against constructs its enhancement becomes +5 and a confirmed critical destroys the construct without a save. A critical hit against an outsider deals x4 damage instead of x2.','weapon',7531200,NULL),
  ('dmg-item-luck-blade-2','228','luck-blade-2-wishes','Luck Blade (2 Wishes)','A +2 short sword granting luck, a daily reroll, and two remaining wishes.','Grants +1 luck on all saving throws and good fortune once per day to reroll one just-made roll. Contains two wishes; after the last is used the sword keeps the +2 enhancement, save bonus, and daily reroll.','weapon',10266000,NULL),
  ('dmg-item-holy-avenger','228','holy-avenger','Holy Avenger','A +2 cold-iron longsword that becomes a far stronger holy weapon for a paladin.','In a paladin''s hands it becomes a +5 holy cold-iron longsword. It grants spell resistance equal to 5 + paladin level to the wielder and adjacent creatures, and allows area greater dispel magic once per round as a standard action using paladin class level.','weapon',12063000,NULL),
  ('dmg-item-luck-blade-3','228','luck-blade-3-wishes','Luck Blade (3 Wishes)','A +2 short sword granting luck, a daily reroll, and three remaining wishes.','Grants +1 luck on all saving throws and good fortune once per day to reroll one just-made roll. Contains three wishes; after the last is used the sword keeps the +2 enhancement, save bonus, and daily reroll.','weapon',14296000,NULL)
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dmg-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,d.category,d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

-- Specific ammunition rows. Each entry is a single piece unless otherwise stated.
WITH desired(item_id,kind,special_text) AS (VALUES
  ('dmg-item-sleep-arrow','arrow','Single +1 arrow; converts damage to nonlethal and can put the struck target to sleep.'),
  ('dmg-item-screaming-bolt','crossbow bolt','Single +2 bolt; fear scream affects enemies near its flight path.'),
  ('dmg-item-slaying-arrow','arrow','Single +1 arrow keyed to one creature type or subtype; Fortitude DC 20 slaying effect.'),
  ('dmg-item-slaying-arrow-greater','arrow','Single +1 arrow keyed to one creature type or subtype; Fortitude DC 23 slaying effect.')
)
INSERT OR IGNORE INTO dnd35_ammunition(item_id,kind,quantity_per_package,special_text)
SELECT d.item_id,d.kind,1,d.special_text FROM desired d;

WITH desired(item_id,caster_level,activation,activation_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
  ('dmg-item-sleep-arrow',5,'use_activated','Triggers when the arrow would deal damage.',1,6950,5,'Craft Magic Arms and Armor; sleep.'),
  ('dmg-item-screaming-bolt',5,'use_activated','Fear scream occurs when the bolt is fired.',2,12850,10,'Craft Magic Arms and Armor; doom.'),
  ('dmg-item-javelin-lightning',5,'use_activated','Throwing the javelin transforms and consumes it.',0,75000,30,'Craft Magic Arms and Armor; lightning bolt.'),
  ('dmg-item-slaying-arrow',13,'use_activated','Triggers against the arrow''s keyed creature type or subtype on a successful hit.',1,114450,91,'Craft Magic Arms and Armor; finger of death.'),
  ('dmg-item-slaying-arrow-greater',13,'use_activated','Triggers against the arrow''s keyed creature type or subtype on a successful hit.',1,203200,162,'Craft Magic Arms and Armor; heightened finger of death.'),
  ('dmg-item-shatterspike',13,'continuous','Sunder benefits apply while wielded.',1,231500,160,'Craft Magic Arms and Armor; Strength 13; Power Attack; Improved Sunder; shatter.'),
  ('dmg-item-dagger-venom',5,'other','After a successful hit, invoke the poison as a free action in the same round; once per day.',1,430200,320,'Craft Magic Arms and Armor; poison.'),
  ('dmg-item-trident-warning',7,'other','Grasp and point the trident; scanning a hemisphere takes 1 round.',2,505750,405,'Craft Magic Arms and Armor; locate creature.'),
  ('dmg-item-assassins-dagger',9,'continuous','Death-attack save-DC bonus applies while wielded.',2,930200,720,'Craft Magic Arms and Armor; slay living.'),
  ('dmg-item-shifters-sorrow',15,'continuous','Both +1 silver blades and anti-shapechanger properties apply while wielded.',1,678000,480,'Craft Magic Arms and Armor; baleful polymorph.'),
  ('dmg-item-trident-fish-command',7,'other','Aquatic-animal command can be invoked up to three times per day.',1,932500,746,'Craft Magic Arms and Armor; speak with animals.'),
  ('dmg-item-flame-tongue',12,'other','Flaming-burst properties are continuous/commanded as normal; fiery ray once per day.',1,1051500,816,'Craft Magic Arms and Armor; scorching ray; flame blade, flame strike, or fireball.'),
  ('dmg-item-luck-blade-0',17,'other','Luck save bonus is continuous; good-fortune reroll once per day.',2,1103000,882,'Craft Magic Arms and Armor; wish or miracle.'),
  ('dmg-item-sword-subtlety',7,'continuous','Sneak-attack bonuses apply while making a sneak attack with the sword.',1,1115500,892,'Craft Magic Arms and Armor; blur.'),
  ('dmg-item-sword-planes',15,'continuous','Enhancement bonus changes automatically based on plane and target.',1,1115750,893,'Craft Magic Arms and Armor; plane shift.'),
  ('dmg-item-nine-lives-stealer',13,'other','Death-dealing ability triggers on confirmed critical hits and has nine successful-use charges.',2,1152850,922,'Craft Magic Arms and Armor; finger of death.'),
  ('dmg-item-sword-life-stealing',17,'continuous','Energy-drain effect triggers on confirmed critical hits.',2,1285750,1029,'Craft Magic Arms and Armor; enervation.'),
  ('dmg-item-oathbow',15,'other','Swear one target as a free action; one activation per day and one sworn enemy at a time.',2,1310000,1000,'Craft Magic Arms and Armor; creator must be an elf.'),
  ('dmg-item-mace-terror',13,'command_word','Command up to three times per day to produce the fear cone.',2,1927600,1542,'Craft Magic Arms and Armor; fear.'),
  ('dmg-item-life-drinker',13,'continuous','Energy drain triggers whenever the greataxe deals damage.',1,2032000,1600,'Craft Magic Arms and Armor; enervation.'),
  ('dmg-item-sylvan-scimitar',11,'continuous','Temperate-outdoor benefits apply automatically while wielded in the qualifying environment.',3,2365750,1893,'Craft Magic Arms and Armor; divine power or creator must be a 7th-level druid.'),
  ('dmg-item-rapier-puncturing',13,'other','Blood-draining touch attack can be used three times per day.',2,2532000,2000,'Craft Magic Arms and Armor; harm.'),
  ('dmg-item-sun-blade',10,'other','Combat properties are continuous; sunlight aura is command activated once per day.',2,2533500,2000,'Craft Magic Arms and Armor; daylight; creator must be good.'),
  ('dmg-item-frost-brand',14,'other','Frost/fire protection is continuous; lasting fire-spell dispel is a standard action.',3,2737550,2179,'Craft Magic Arms and Armor; ice storm; dispel magic; protection from energy.'),
  ('dmg-item-dwarven-thrower',10,'continuous','Dwarven conditional enhancement, returning, and thrown-damage benefits apply automatically.',2,3031200,2400,'Craft Magic Arms and Armor; creator must be a dwarf of at least 10th level.'),
  ('dmg-item-luck-blade-1',17,'other','Luck save bonus is continuous; good-fortune reroll once per day; one wish remains.',2,3118000,2494,'Craft Magic Arms and Armor; wish or miracle.'),
  ('dmg-item-mace-smiting',11,'continuous','Construct and outsider combat properties apply automatically.',3,3931200,2880,'Craft Magic Arms and Armor; disintegrate.'),
  ('dmg-item-luck-blade-2',17,'other','Luck save bonus is continuous; good-fortune reroll once per day; two wishes remain.',2,5133000,4106,'Craft Magic Arms and Armor; wish or miracle.'),
  ('dmg-item-holy-avenger',18,'other','Paladin-dependent enhancement and spell resistance are continuous; area greater dispel is a standard action once per round.',2,6063000,4800,'Craft Magic Arms and Armor; holy aura; creator must be good.'),
  ('dmg-item-luck-blade-3',17,'other','Luck save bonus is continuous; good-fortune reroll once per day; three wishes remain.',2,7148000,5718,'Craft Magic Arms and Armor; wish or miracle.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,
       CASE WHEN d.item_id='dmg-item-oathbow' THEN 'both_hands' ELSE 'main_hand' END,
       CASE WHEN d.item_id='dmg-item-nine-lives-stealer' THEN 9
            WHEN d.item_id='dmg-item-luck-blade-1' THEN 1
            WHEN d.item_id='dmg-item-luck-blade-2' THEN 2
            WHEN d.item_id='dmg-item-luck-blade-3' THEN 3
            ELSE NULL END,
       CASE WHEN d.item_id LIKE 'dmg-item-luck-blade-%' THEN 'Wish charges do not recharge.'
            WHEN d.item_id='dmg-item-nine-lives-stealer' THEN 'Successful death effects expend charges; charges do not recharge.'
            ELSE NULL END,
       d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;

-- Slaying-arrow key uses the same creature-type/subtype distribution printed with the specific weapon.
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-dmg-slaying-arrow-designated-type','dmg-3.5','228','dmg-slaying-arrow-designated-type','Slaying Arrow Designated Type Table',
       'Percentile table for choosing the creature type or subtype to which a slaying arrow is keyed.',
       'Percentile table for choosing the creature type or subtype to which a slaying arrow is keyed.',0,NULL,1,
       'magic-items','table',0,1,NULL,NULL,'["magic-items","weapons","ammunition","slaying-arrow","random-generation"]',
       '{"ranges":[[1,5,"aberrations"],[6,9,"animals"],[10,16,"constructs"],[17,22,"dragons"],[23,27,"elementals"],[28,32,"fey"],[33,39,"giants"],[40,40,"humanoids-aquatic"],[41,42,"humanoids-dwarf"],[43,44,"humanoids-elf"],[45,45,"humanoids-gnoll"],[46,46,"humanoids-gnome"],[47,49,"humanoids-goblinoid"],[50,50,"humanoids-halfling"],[51,54,"humanoids-human"],[55,57,"humanoids-reptilian"],[58,60,"humanoids-orc"],[61,65,"magical-beasts"],[66,70,"monstrous-humanoids"],[71,72,"oozes"],[73,73,"outsiders-air"],[74,76,"outsiders-chaotic"],[77,77,"outsiders-earth"],[78,80,"outsiders-evil"],[81,81,"outsiders-fire"],[82,84,"outsiders-good"],[85,87,"outsiders-lawful"],[88,88,"outsiders-water"],[89,90,"plants"],[91,98,"undead"],[99,100,"vermin"]]}'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug='dmg-slaying-arrow-designated-type' AND r.owner_user_id IS NULL
);
