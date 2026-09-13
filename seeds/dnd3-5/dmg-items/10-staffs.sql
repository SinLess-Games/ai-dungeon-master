-- Dungeon Master's Guide v3.5 Chapter 7: staffs, pp. 243-246.
-- Includes all 20 standard staffs, Table 7-25, staff activation/charge rules,
-- structured spell menus, and special behavior for the staffs of power and the woodlands.
-- Mechanical text is summarized; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,description,rules_text,price_copper,caster_level,aura_strength,enhancement_bonus,crafting_text) AS (VALUES
('dmg-staff-charming','243-244','staff-of-charming','Staff of Charming',
 'A twisting, ornately carved wooden staff devoted to enchantment magic.',
 '50-charge spell-trigger staff. Charm person costs 1 charge; charm monster costs 2 charges.',
 1650000,8,'moderate',0,'Craft Staff; charm person; charm monster.'),
('dmg-staff-fire','244','staff-of-fire','Staff of Fire',
 'A staff whose magic controls and projects fire.',
 '50-charge spell-trigger staff. Burning hands costs 1 charge; fireball costs 1 charge; wall of fire costs 2 charges.',
 1775000,8,'moderate',0,'Craft Staff; burning hands; fireball; wall of fire.'),
('dmg-staff-swarming-insects','245','staff-of-swarming-insects','Staff of Swarming Insects',
 'A twisted darkwood staff patterned like crawling insects.',
 '50-charge spell-trigger staff. Summon swarm costs 1 charge; insect plague costs 3 charges.',
 2475000,9,'moderate',0,'Craft Staff; insect plague; summon swarm.'),
('dmg-staff-healing','244','staff-of-healing','Staff of Healing',
 'A smooth white ash staff that channels curative and restorative magic.',
 '50-charge spell-trigger staff. Lesser restoration costs 1 charge; cure serious wounds costs 1 charge; remove blindness/deafness costs 2 charges; remove disease costs 3 charges.',
 2775000,8,'moderate',0,'Craft Staff; lesser restoration; cure serious wounds; remove blindness/deafness; remove disease.'),
('dmg-staff-size-alteration','245','staff-of-size-alteration','Staff of Size Alteration',
 'A stout darkwood staff that alters creature and object size.',
 '50-charge spell-trigger staff. Enlarge person, reduce person, shrink item, mass enlarge person, and mass reduce person each cost 1 charge.',
 2900000,8,'faint',0,'Craft Staff; enlarge person; mass enlarge person; reduce person; mass reduce person; shrink item.'),
('dmg-staff-illumination','244','staff-of-illumination','Staff of Illumination',
 'A staff that creates light and destructive solar radiance.',
 '50-charge spell-trigger staff. Dancing lights costs 1 charge; flare costs 1; daylight costs 2; sunburst costs 3.',
 4825000,15,'strong',0,'Craft Staff; dancing lights; daylight; flare; sunburst.'),
('dmg-staff-frost','244','staff-of-frost','Staff of Frost',
 'A pale staff cold to the touch and devoted to ice magic.',
 '50-charge spell-trigger staff. Ice storm costs 1 charge; wall of ice costs 1; cone of cold costs 2.',
 5625000,10,'moderate',0,'Craft Staff; cone of cold; ice storm; wall of ice.'),
('dmg-staff-defense','244','staff-of-defense','Staff of Defense',
 'A simple-looking staff that pulses with defensive power.',
 '50-charge spell-trigger staff. Shield costs 1 charge; shield of faith costs 1; shield other costs 1; shield of law costs 3. The creator must be lawful.',
 5825000,15,'strong',0,'Craft Staff; shield; shield of faith; shield of law; shield other; creator must be lawful.'),
('dmg-staff-abjuration','243-244','staff-of-abjuration','Staff of Abjuration',
 'An ancient-heartwood staff containing a broad suite of abjurations.',
 '50-charge spell-trigger staff. Shield, resist energy, and dispel magic cost 1 charge each; lesser globe of invulnerability and dismissal cost 2 each; repulsion costs 3.',
 6500000,13,'strong',0,'Craft Staff; dismissal; dispel magic; lesser globe of invulnerability; resist energy; repulsion; shield.'),
('dmg-staff-conjuration','244','staff-of-conjuration','Staff of Conjuration',
 'An ash or walnut staff carved with many kinds of creatures.',
 '50-charge spell-trigger staff. Unseen servant, summon swarm, and stinking cloud cost 1 charge each; minor creation and cloudkill cost 2 each; summon monster VI costs 3.',
 6500000,13,'strong',0,'Craft Staff; cloudkill; stinking cloud; summon monster VI; summon swarm; unseen servant.'),
('dmg-staff-enchantment','244','staff-of-enchantment','Staff of Enchantment',
 'An applewood staff commonly topped with a clear crystal.',
 '50-charge spell-trigger staff. Sleep, Tasha''s hideous laughter, and suggestion cost 1 charge each; crushing despair and mind fog cost 2 each; mass suggestion costs 3.',
 6500000,13,'strong',0,'Craft Staff; crushing despair; mass suggestion; mind fog; sleep; suggestion; Tasha''s hideous laughter.'),
('dmg-staff-evocation','244','staff-of-evocation','Staff of Evocation',
 'A staff storing representative destructive and force evocations.',
 '50-charge spell-trigger staff. Magic missile, shatter, and fireball cost 1 charge each; ice storm and wall of force cost 2 each; chain lightning costs 3.',
 6500000,13,'strong',0,'Craft Staff; chain lightning; fireball; ice storm; magic missile; shatter; wall of force.'),
('dmg-staff-illusion','244','staff-of-illusion','Staff of Illusion',
 'A staff storing a progression of deceptive illusion magic.',
 '50-charge spell-trigger staff. Disguise self, mirror image, and major image cost 1 charge each; rainbow pattern and persistent image cost 2 each; mislead costs 3.',
 6500000,13,'strong',0,'Craft Staff; disguise self; major image; mirror image; persistent image; project image; rainbow pattern.'),
('dmg-staff-necromancy','244-245','staff-of-necromancy','Staff of Necromancy',
 'A dark staff storing fear, paralysis, energy drain, and death magic.',
 '50-charge spell-trigger staff. Cause fear, ghoul touch, and halt undead cost 1 charge each; enervation and waves of fatigue cost 2 each; circle of death costs 3.',
 6500000,13,'strong',0,'Craft Staff; cause fear; circle of death; enervation; ghoul touch; halt undead; waves of fatigue.'),
('dmg-staff-transmutation','245','staff-of-transmutation','Staff of Transmutation',
 'A staff carved from or decorated with petrified wood.',
 '50-charge spell-trigger staff. Expeditious retreat, alter self, and blink cost 1 charge each; polymorph and baleful polymorph cost 2 each; disintegrate costs 3.',
 6500000,13,'strong',0,'Craft Staff; alter self; baleful polymorph; blink; disintegrate; expeditious retreat; polymorph.'),
('dmg-staff-divination','244','staff-of-divination','Staff of Divination',
 'A supple willow staff, often forked, carrying detection and revelation magic.',
 '50-charge spell-trigger staff. Detect secret doors, locate object, and tongues cost 1 charge each; locate creature and prying eyes cost 2 each; true seeing costs 3.',
 7350000,13,'strong',0,'Craft Staff; detect secret doors; locate creature; locate object; prying eyes; tongues; true seeing.'),
('dmg-staff-earth-stone','244','staff-of-earth-and-stone','Staff of Earth and Stone',
 'A staff topped by a fist-sized emerald glowing with smoldering power.',
 '50-charge spell-trigger staff. Passwall costs 1 charge; move earth costs 1 charge.',
 8050000,11,'moderate',0,'Craft Staff; move earth; passwall.'),
('dmg-staff-woodlands','245','staff-of-the-woodlands','Staff of the Woodlands',
 'A naturally shaped oak, ash, or yew staff that combines druidic magic with lasting weapon and travel powers.',
 '50-charge spell-trigger staff. Charm animal and speak with animals cost 1 charge each; barkskin costs 2; wall of thorns and summon nature''s ally VI cost 3 each; animate plants costs 4. It also functions as a +2 quarterstaff and grants pass without trace at will without charges. The +2 weapon property and pass-without-trace power continue after all charges are expended.',
 10125000,13,'moderate',2,'Craft Staff; Craft Magic Arms and Armor; animate plants; barkskin; charm animal; pass without trace; speak with animals; summon nature''s ally VI; wall of thorns.'),
('dmg-staff-life','245','staff-of-life','Staff of Life',
 'A potent healing staff able to restore life to the dead.',
 '50-charge spell-trigger staff. Heal costs 1 charge; raise dead costs 5 charges.',
 15575000,13,'moderate',0,'Craft Staff; heal; resurrection.'),
('dmg-staff-passage','245','staff-of-passage','Staff of Passage',
 'A staff containing powerful movement, portal, and planar-travel magic.',
 '50-charge spell-trigger staff. Dimension door and passwall cost 1 charge each; phase door, greater teleport, and astral projection cost 2 each.',
 17050000,17,'strong',0,'Craft Staff; astral projection; dimension door; greater teleport; passwall; phase door.'),
('dmg-staff-power','245','staff-of-power','Staff of Power',
 'One of the strongest standard staffs, combining a +2 quarterstaff, protective luck, combat magic, and a dangerous retributive strike.',
 '50-charge spell-trigger staff. Magic missile, heightened ray of enfeeblement, continual flame, levitate, heightened lightning bolt, and heightened fireball cost 1 charge each; cone of cold, hold monster, wall of force, and globe of invulnerability cost 2 each. While held it grants +2 luck to AC and saving throws and functions as a +2 quarterstaff. One charge may be spent as a free action to double its melee damage for 1 round; on a critical hit that round the staff deals triple damage. The wielder may deliberately break the charged staff for a retributive strike: a 30-foot spread dealing 8 times remaining charges within 10 feet, 6 times charges at 11-20 feet, and 4 times charges at 21-30 feet; Reflex DC 17 halves. The breaker has a 50% chance to be transported to another plane and otherwise is destroyed. When charges reach 0 it remains a +2 quarterstaff but loses retributive strike and charged powers.',
 21100000,15,'strong',2,'Craft Staff; Craft Magic Arms and Armor; magic missile; heightened ray of enfeeblement; continual flame; levitate; heightened fireball; heightened lightning bolt; cone of cold; hold monster; wall of force; globe of invulnerability.')
)
INSERT INTO dnd35_items
 (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
  category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dmg-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'magic',d.price_copper,NULL,NULL,5,10
FROM desired d
WHERE NOT EXISTS (
 SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,aura_strength,enhancement_bonus,crafting_text) AS (VALUES
('dmg-staff-charming',8,'moderate',0,'Craft Staff; charm person; charm monster.'),
('dmg-staff-fire',8,'moderate',0,'Craft Staff; burning hands; fireball; wall of fire.'),
('dmg-staff-swarming-insects',9,'moderate',0,'Craft Staff; insect plague; summon swarm.'),
('dmg-staff-healing',8,'moderate',0,'Craft Staff; lesser restoration; cure serious wounds; remove blindness/deafness; remove disease.'),
('dmg-staff-size-alteration',8,'faint',0,'Craft Staff; enlarge person; mass enlarge person; reduce person; mass reduce person; shrink item.'),
('dmg-staff-illumination',15,'strong',0,'Craft Staff; dancing lights; daylight; flare; sunburst.'),
('dmg-staff-frost',10,'moderate',0,'Craft Staff; cone of cold; ice storm; wall of ice.'),
('dmg-staff-defense',15,'strong',0,'Craft Staff; shield; shield of faith; shield of law; shield other; creator must be lawful.'),
('dmg-staff-abjuration',13,'strong',0,'Craft Staff; dismissal; dispel magic; lesser globe of invulnerability; resist energy; repulsion; shield.'),
('dmg-staff-conjuration',13,'strong',0,'Craft Staff; cloudkill; stinking cloud; summon monster VI; summon swarm; unseen servant.'),
('dmg-staff-enchantment',13,'strong',0,'Craft Staff; crushing despair; mass suggestion; mind fog; sleep; suggestion; Tasha''s hideous laughter.'),
('dmg-staff-evocation',13,'strong',0,'Craft Staff; chain lightning; fireball; ice storm; magic missile; shatter; wall of force.'),
('dmg-staff-illusion',13,'strong',0,'Craft Staff; disguise self; major image; mirror image; persistent image; project image; rainbow pattern.'),
('dmg-staff-necromancy',13,'strong',0,'Craft Staff; cause fear; circle of death; enervation; ghoul touch; halt undead; waves of fatigue.'),
('dmg-staff-transmutation',13,'strong',0,'Craft Staff; alter self; baleful polymorph; blink; disintegrate; expeditious retreat; polymorph.'),
('dmg-staff-divination',13,'strong',0,'Craft Staff; detect secret doors; locate creature; locate object; prying eyes; tongues; true seeing.'),
('dmg-staff-earth-stone',11,'moderate',0,'Craft Staff; move earth; passwall.'),
('dmg-staff-woodlands',13,'moderate',2,'Craft Staff; Craft Magic Arms and Armor; animate plants; barkskin; charm animal; pass without trace; speak with animals; summon nature''s ally VI; wall of thorns.'),
('dmg-staff-life',13,'moderate',0,'Craft Staff; heal; resurrection.'),
('dmg-staff-passage',17,'strong',0,'Craft Staff; astral projection; dimension door; greater teleport; passwall; phase door.'),
('dmg-staff-power',15,'strong',2,'Craft Staff; Craft Magic Arms and Armor; magic missile; heightened ray of enfeeblement; continual flame; levitate; heightened fireball; heightened lightning bolt; cone of cold; hold monster; wall of force; globe of invulnerability.')
)
INSERT OR IGNORE INTO dnd35_magic_items
 (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
  maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,d.aura_strength,'spell_trigger',
       'Activate one listed staff power using its stated charge cost. Staff spell effects use the wielder''s relevant ability score and feats, and the higher of the staff caster level or wielder caster level when applicable.',
       'main_hand',50,
       CASE WHEN d.item_id='dmg-staff-woodlands' THEN 'Charges do not recharge. At 0 charges the +2 quarterstaff and pass without trace at-will properties remain.'
            WHEN d.item_id='dmg-staff-power' THEN 'Charges do not recharge. At 0 charges the +2 quarterstaff remains, but charged powers and retributive strike are unavailable.'
            ELSE 'Charges do not recharge; at 0 charges the ordinary staff remains.' END,
       d.enhancement_bonus,NULL,NULL,d.crafting_text,NULL
FROM desired d;

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
('dmg-staff-physical-statistics','Staff Physical Statistics','243','rule',
 'A typical magic staff is a walking-stick-sized implement that can be held in one hand. As an object, a standard staff has AC 7, 10 hit points, hardness 5, and break DC 24.',
 '["magic-items","staffs","objects"]',
 '{"armorClass":7,"hitPoints":10,"hardness":5,"breakDc":24,"minimumHandsToActivate":1}'),
('dmg-staff-activation','Staff Spell-Trigger Activation','243','rule',
 'Staffs use spell-trigger activation. The user must have the spell on a class spell list unless using an ability such as Use Magic Device. Activation normally uses a standard action and does not provoke attacks of opportunity unless the stored spell has a longer casting time.',
 '["magic-items","staffs","spell-trigger","activation"]',
 '{"activationType":"spell_trigger","defaultAction":"standard","provokesAttackOfOpportunity":false,"longerStoredSpellCastingTimeOverrides":true,"mustHoldAtLeastOneHand":true}'),
('dmg-staff-caster-level','Staff Wielder Caster Level','243','rule',
 'If the wielder''s caster level is higher than the staff''s caster level, staff spell effects use the wielder''s caster level.',
 '["magic-items","staffs","caster-level"]',
 '{"effectiveCasterLevel":"max(staff caster level, wielder caster level)"}'),
('dmg-staff-save-dc','Staff Save DC and Wielder Feats','213,243','rule',
 'Unlike most magic items, a staff treats its spell as though the wielder cast it for saving throws. Use the wielder''s relevant ability score and applicable feats such as Spell Focus.',
 '["magic-items","staffs","saving-throws","feats"]',
 '{"saveDcUsesWielderAbilityScore":true,"applicableWielderFeatsApply":true,"spellPenetrationCanApply":true}'),
('dmg-staff-level-limit','Staff Spell-Level Limit','243','rule',
 'A staff can contain spells of any spell level, unlike a wand. The minimum caster level for a normal staff is 8th.',
 '["magic-items","staffs","spell-level"]',
 '{"maximumSpellLevel":null,"minimumCasterLevel":8}'),
('dmg-staff-charges','Staff Charges','243','rule',
 'A newly created staff has 50 charges. Each listed power consumes its printed number of charges. Standard staff charges do not recharge.',
 '["magic-items","staffs","charges"]',
 '{"initialCharges":50,"recharge":false,"powerChargeCostVaries":true}'),
('dmg-staff-special-qualities','Random Staff Special Qualities','243','table',
 'Randomly generated staffs have a clue to function on 01-30 and no special quality on 31-100.',
 '["magic-items","staffs","random-generation"]',
 '{"ranges":[[1,30,"function-clue"],[31,100,"none"]]}'),
('dmg-table-7-25-staffs','Table 7-25: Staffs','243','table',
 'Random-generation table for medium and major standard staffs.',
 '["magic-items","staffs","random-generation","table-7-25"]',
 '{"medium":[[1,15,"staff-of-charming"],[16,30,"staff-of-fire"],[31,40,"staff-of-swarming-insects"],[41,60,"staff-of-healing"],[61,75,"staff-of-size-alteration"],[76,90,"staff-of-illumination"],[91,95,"staff-of-frost"],[96,100,"staff-of-defense"]],"major":[[1,3,"staff-of-charming"],[4,9,"staff-of-fire"],[10,11,"staff-of-swarming-insects"],[12,17,"staff-of-healing"],[18,19,"staff-of-size-alteration"],[20,24,"staff-of-illumination"],[25,31,"staff-of-frost"],[32,38,"staff-of-defense"],[39,43,"staff-of-abjuration"],[44,48,"staff-of-conjuration"],[49,53,"staff-of-enchantment"],[54,58,"staff-of-evocation"],[59,63,"staff-of-illusion"],[64,68,"staff-of-necromancy"],[69,73,"staff-of-transmutation"],[74,77,"staff-of-divination"],[78,82,"staff-of-earth-and-stone"],[83,87,"staff-of-the-woodlands"],[88,92,"staff-of-life"],[93,97,"staff-of-passage"],[98,100,"staff-of-power"]],"marketPriceCopper":{"staff-of-charming":1650000,"staff-of-fire":1775000,"staff-of-swarming-insects":2475000,"staff-of-healing":2775000,"staff-of-size-alteration":2900000,"staff-of-illumination":4825000,"staff-of-frost":5625000,"staff-of-defense":5825000,"staff-of-abjuration":6500000,"staff-of-conjuration":6500000,"staff-of-enchantment":6500000,"staff-of-evocation":6500000,"staff-of-illusion":6500000,"staff-of-necromancy":6500000,"staff-of-transmutation":6500000,"staff-of-divination":7350000,"staff-of-earth-and-stone":8050000,"staff-of-the-woodlands":10125000,"staff-of-life":15575000,"staff-of-passage":17050000,"staff-of-power":21100000}}'),
('dmg-staff-power-catalog','Standard Staff Power Catalog','243-245','catalog',
 'Structured power menus and charge costs for the twenty standard DMG staffs.',
 '["magic-items","staffs","powers","catalog"]',
 '{"staff-of-charming":[["charm person",1],["charm monster",2]],"staff-of-fire":[["burning hands",1],["fireball",1],["wall of fire",2]],"staff-of-swarming-insects":[["summon swarm",1],["insect plague",3]],"staff-of-healing":[["lesser restoration",1],["cure serious wounds",1],["remove blindness/deafness",2],["remove disease",3]],"staff-of-size-alteration":[["enlarge person",1],["reduce person",1],["shrink item",1],["mass enlarge person",1],["mass reduce person",1]],"staff-of-illumination":[["dancing lights",1],["flare",1],["daylight",2],["sunburst",3]],"staff-of-frost":[["ice storm",1],["wall of ice",1],["cone of cold",2]],"staff-of-defense":[["shield",1],["shield of faith",1],["shield other",1],["shield of law",3]],"staff-of-abjuration":[["shield",1],["resist energy",1],["dispel magic",1],["lesser globe of invulnerability",2],["dismissal",2],["repulsion",3]],"staff-of-conjuration":[["unseen servant",1],["summon swarm",1],["stinking cloud",1],["minor creation",2],["cloudkill",2],["summon monster VI",3]],"staff-of-enchantment":[["sleep",1],["Tasha''s hideous laughter",1],["suggestion",1],["crushing despair",2],["mind fog",2],["mass suggestion",3]],"staff-of-evocation":[["magic missile",1],["shatter",1],["fireball",1],["ice storm",2],["wall of force",2],["chain lightning",3]],"staff-of-illusion":[["disguise self",1],["mirror image",1],["major image",1],["rainbow pattern",2],["persistent image",2],["mislead",3]],"staff-of-necromancy":[["cause fear",1],["ghoul touch",1],["halt undead",1],["enervation",2],["waves of fatigue",2],["circle of death",3]],"staff-of-transmutation":[["expeditious retreat",1],["alter self",1],["blink",1],["polymorph",2],["baleful polymorph",2],["disintegrate",3]],"staff-of-divination":[["detect secret doors",1],["locate object",1],["tongues",1],["locate creature",2],["prying eyes",2],["true seeing",3]],"staff-of-earth-and-stone":[["passwall",1],["move earth",1]],"staff-of-the-woodlands":[["charm animal",1],["speak with animals",1],["barkskin",2],["wall of thorns",3],["summon nature''s ally VI",3],["animate plants",4]],"staff-of-life":[["heal",1],["raise dead",5]],"staff-of-passage":[["dimension door",1],["passwall",1],["phase door",2],["greater teleport",2],["astral projection",2]],"staff-of-power":[["magic missile",1],["ray of enfeeblement heightened to 5th",1],["continual flame",1],["levitate",1],["lightning bolt heightened to 5th",1],["fireball heightened to 5th",1],["cone of cold",2],["hold monster",2],["wall of force hemisphere",2],["globe of invulnerability",2]]}'),
('dmg-staff-power-special','Staff of Power Special Properties','245','subsystem',
 'The staff of power is also a +2 quarterstaff, grants +2 luck to AC and saving throws, can spend one charge to double melee damage for a round, and supports a retributive strike while charged.',
 '["magic-items","staffs","staff-of-power","retributive-strike"]',
 '{"weapon":{"base":"quarterstaff","enhancementBonus":2},"luckBonus":{"armorClass":2,"savingThrows":2},"powerStrike":{"chargeCost":1,"activation":"free","durationRounds":1,"normalDamageMultiplier":2,"criticalDamageMultiplier":3},"retributiveStrike":{"requiresPositiveCharges":true,"spreadFeet":30,"damagePerRemainingCharge":{"0-10":8,"11-20":6,"21-30":4},"reflexDc":17,"saveEffect":"half","breaker":{"planeTravelChancePercent":50,"otherwise":"destroyed"}},"atZeroCharges":{"remains":"+2 quarterstaff","chargedPowers":false,"retributiveStrike":false}}'),
('dmg-staff-woodlands-special','Staff of the Woodlands Special Properties','245','rule',
 'The staff of the woodlands is also a +2 quarterstaff and allows pass without trace at will with no charge cost; both properties remain after all charges are spent.',
 '["magic-items","staffs","staff-of-the-woodlands"]',
 '{"weapon":{"base":"quarterstaff","enhancementBonus":2},"atWillNoCharge":"pass without trace","propertiesRemainAtZeroCharges":["+2 quarterstaff","pass without trace"]}')
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
