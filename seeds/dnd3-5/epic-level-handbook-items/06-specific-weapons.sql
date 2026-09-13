-- Epic Level Handbook specific epic weapons.
-- Source: Epic Level Handbook, Chapter 4, pp. 133-135.
-- Mechanical text is summarized; source remains authoritative.
-- Table 4-17 prices are preserved where adjacent prose differs.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('elh-3.0','epic-level-handbook-3-0','Epic Level Handbook','ELH','Wizards of the Coast','dnd','3.0',
        'Epic Level Handbook (2002): progression beyond 20th level, epic skills and feats, epic spell development, epic magic items, monsters, prestige classes, and campaign rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,price_copper,caster_level,enhancement_bonus,activation,activation_text,
  craft_cost_copper,craft_xp_cost,crafting_text
) AS (VALUES
('elh-item-stormbrand','135','stormbrand','Stormbrand',
 'A +4 thundering shocking-burst greatsword made for mastery of storms and wind.',
 'This +4 thundering shocking burst greatsword grants fly at will, allows normal movement even in the strongest winds, and while drawn grants electricity resistance 30 and sonic resistance 30.',
 23535000,21,4,'continuous','Weapon properties and resistances apply while drawn; flight is at will.',11785000,12350,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; blindness/deafness; call lightning or lightning bolt; control winds; fly; protection from elements.'),
('elh-item-quarterstaff-alacrity','134','quarterstaff-of-alacrity','Quarterstaff of Alacrity',
 'A +5 speed quarterstaff whose two ends share the same enchantments.',
 'Both ends are +5 and have speed, granting an additional attack with each end each round. While held, it grants +5 resistance on Reflex saves and deflects ranged weapons as though the wielder possessed Deflect Arrows and Infinite Deflection.',
 46260000,21,5,'continuous','Both weapon ends and defensive benefits function while held.',23160000,14620,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from arrows; shield.'),
('elh-item-souldrinker','134-135','souldrinker','Souldrinker',
 'A +5 bastard sword that drains life force with every damaging strike.',
 'Whenever it deals damage, the target gains 2d4 negative levels. Each negative level grants the wielder 5 temporary hit points. After 24 hours the target makes Fortitude DC 25 per negative level or loses a level. If the negative levels equal or exceed the target''s current level, the target dies and the wielder gains 10 additional temporary hit points. Temporary hit points from the sword last up to 1 hour.',
 47833500,21,5,'continuous','Energy-drain effect triggers whenever the sword deals damage.',23931500,14780,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; Spell Focus (Necromancy); energy drain.'),
('elh-item-backstabber','133-134','backstabber','Backstabber',
 'A +6 short sword that augments an existing sneak attack.',
 'Adds +2d6 to the wielder''s sneak attack damage. It does not grant sneak attack to a wielder who lacks that ability.',
 77031000,21,6,'continuous','Sneak-attack bonus applies while wielded by a creature that already has sneak attack.',38531000,17700,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; inflict moderate wounds.'),
('elh-item-mace-ruin','134','mace-of-ruin','Mace of Ruin',
 'A +7 heavy mace that destroys objects and constructs with supernatural ease.',
 'Ignores hardness and damage reduction of any object or creature it strikes. It can score critical hits against objects and constructs as though they were living creatures.',
 100031200,21,7,'continuous','Hardness/DR bypass and expanded critical-hit eligibility are intrinsic weapon properties.',50031200,20000,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; disintegrate.'),
('elh-item-gripsoul','134','gripsoul','Gripsoul',
 'A +6 keen longsword that binds a defeated foe into a gem in its pommel.',
 'Instead of normal additional critical-hit damage, a critical hit imprisons the victim as binding heightened to 16th level (DC 30). The same binding triggers on a blow that would otherwise kill or render a foe unconscious. Only one creature can be held; the wielder can release it by command word.',
 185650000,27,6,'other','Weapon properties are continuous; a command word releases the currently bound creature.',93450000,28440,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; binding.'),
('elh-item-elven-greatbow','134','elven-greatbow','Elven Greatbow',
 'An epic composite longbow that reveals its full power only to an elf.',
 'For a nonelf it functions as a +2 composite longbow. For an elf it is a +5 mighty composite longbow of unerring accuracy whose Strength rating automatically matches the wielder''s current Strength bonus. Arrows fired from it are treated as keen regardless of the arrows'' own enhancement.',
 290040000,23,5,'continuous','Its effective properties depend on whether the wielder is an elf.',145040000,39400,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; bull''s strength; keen edge; true seeing.'),
('elh-item-finaldeath','134','finaldeath','Finaldeath',
 'A +5 undead-dread ghost-touch morningstar that protects a divine champion from negative energy.',
 'This +5 undead dread ghost touch morningstar grants immunity to energy drain. A wielder capable of turning undead also gains the Positive Energy Aura epic feat while wielding it.',
 358030800,22,5,'continuous','Weapon properties and energy-drain immunity are continuous; Positive Energy Aura requires the wielder to be able to turn undead.',179030800,45800,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; negative energy protection; plane shift; summon monster IX; creator must be able to turn undead.'),
('elh-item-chaosbringer','134','chaosbringer','Chaosbringer',
 'A +6 greataxe of chaotic power that channels barbaric fury.',
 'This +6 greataxe of chaotic power lets its wielder rage once per day, or one additional time per day if the wielder already has rage. A wielder with greater rage also gains the Incite Rage epic feat while wielding it.',
 402535000,23,6,'other','Chaotic-power weapon properties are continuous; rage is usable once per day or once additionally for an existing rage user.',201285000,50250,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; emotion; mass charm.'),
('elh-item-holy-devastator','134','holy-devastator','Holy Devastator',
 'An epic holy longsword whose strongest powers awaken for a paladin.',
 'For a nonpaladin it functions as a +3 holy longsword. For a paladin it functions as a +7 longsword of holy power, grants +5 sacred on saving throws against evil-descriptor spells or spells cast by evil creatures, and causes smite evil to add twice paladin level to damage instead of once.',
 462031500,23,7,'continuous','Properties automatically scale to the paladin wielder state.',231031500,56200,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; holy aura; holy smite; holy word.'),
('elh-item-unholy-despoiler','135','unholy-despoiler','Unholy Despoiler',
 'An epic unholy longsword whose strongest powers awaken for a blackguard.',
 'For a nonblackguard it functions as a +3 unholy longsword. For a blackguard it functions as a +7 longsword of unholy power, grants +5 profane on saving throws against good-descriptor spells or spells cast by good creatures, and causes smite good to add twice blackguard level to damage instead of once. Table 4-17 lists 4,620,315 gp while the adjacent prose lists 4,650,315 gp; the table price is preserved.',
 462031500,23,7,'continuous','Properties automatically scale to the blackguard wielder state.',232531500,56500,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; blasphemy; unholy aura; unholy blight.'),
('elh-item-everwhirling-chain','134','everwhirling-chain','Everwhirling Chain',
 'A +4 defending everdancing spiked chain of speed that reacts almost independently of its wielder.',
 'This +4 defending everdancing spiked chain of speed lets the wielder make any number of attacks of opportunity per round, as though possessing Improved Combat Reflexes.',
 522032500,23,4,'continuous','All weapon properties and unlimited attacks of opportunity function while wielded.',261032500,52200,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; animate objects; haste; shield or shield of faith.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'elh-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'weapon',d.price_copper,NULL,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='elh-3.0' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,caster_level,enhancement_bonus,activation,activation_text,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
('elh-item-stormbrand',21,4,'continuous','Weapon properties and resistances apply while drawn; flight is at will.',11785000,12350,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; blindness/deafness; call lightning or lightning bolt; control winds; fly; protection from elements.'),
('elh-item-quarterstaff-alacrity',21,5,'continuous','Both weapon ends and defensive benefits function while held.',23160000,14620,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; protection from arrows; shield.'),
('elh-item-souldrinker',21,5,'continuous','Energy-drain effect triggers whenever the sword deals damage.',23931500,14780,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; Spell Focus (Necromancy); energy drain.'),
('elh-item-backstabber',21,6,'continuous','Sneak-attack bonus applies while wielded by a creature that already has sneak attack.',38531000,17700,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; inflict moderate wounds.'),
('elh-item-mace-ruin',21,7,'continuous','Hardness/DR bypass and expanded critical-hit eligibility are intrinsic weapon properties.',50031200,20000,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; disintegrate.'),
('elh-item-gripsoul',27,6,'other','Weapon properties are continuous; a command word releases the currently bound creature.',93450000,28440,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; binding.'),
('elh-item-elven-greatbow',23,5,'continuous','Its effective properties depend on whether the wielder is an elf.',145040000,39400,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; bull''s strength; keen edge; true seeing.'),
('elh-item-finaldeath',22,5,'continuous','Weapon properties and energy-drain immunity are continuous; Positive Energy Aura requires the wielder to be able to turn undead.',179030800,45800,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; negative energy protection; plane shift; summon monster IX; creator must be able to turn undead.'),
('elh-item-chaosbringer',23,6,'other','Chaotic-power weapon properties are continuous; rage is usable once per day or once additionally for an existing rage user.',201285000,50250,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; emotion; mass charm.'),
('elh-item-holy-devastator',23,7,'continuous','Properties automatically scale to the paladin wielder state.',231031500,56200,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; holy aura; holy smite; holy word.'),
('elh-item-unholy-despoiler',23,7,'continuous','Properties automatically scale to the blackguard wielder state.',232531500,56500,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; blasphemy; unholy aura; unholy blight.'),
('elh-item-everwhirling-chain',23,4,'continuous','All weapon properties and unlimited attacks of opportunity function while wielded.',261032500,52200,'Craft Magic Arms and Armor; Craft Epic Magic Arms and Armor; animate objects; haste; shield or shield of faith.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,
       CASE WHEN d.item_id='elh-item-elven-greatbow' THEN 'both_hands' ELSE 'main_hand' END,
       NULL,NULL,d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;
