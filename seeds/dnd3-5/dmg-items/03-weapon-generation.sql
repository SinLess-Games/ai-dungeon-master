-- Dungeon Master's Guide v3.5 Chapter 7: magic weapon construction and random-generation tables, pp. 221-223.
-- Mechanical summaries are concise; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(slug,name,page,kind,summary,tags,mechanics) AS (VALUES
  ('dmg-magic-weapons-masterwork','Magic Weapons Are Masterwork','222','rule',
   'Every magic weapon is a masterwork weapon.',
   '["magic-items","weapons","masterwork"]',
   '{"magicWeaponsAutomaticallyMasterwork":true}'),
  ('dmg-magic-weapon-special-minimum','Magic Weapon Special-Ability Minimum','223','rule',
   'A weapon with one or more magic special abilities must have at least a +1 enhancement bonus.',
   '["magic-items","weapons","special-abilities"]',
   '{"minimumEnhancementBonusForSpecialAbility":1}'),
  ('dmg-magic-weapon-bonus-limits','Magic Weapon Enhancement and Effective-Bonus Limits','222-223','rule',
   'A weapon cannot have an actual enhancement bonus higher than +5. Enhancement bonus plus equivalent special-ability modifiers cannot exceed +10 for pricing and construction.',
   '["magic-items","weapons","enhancement","pricing"]',
   '{"maximumActualEnhancementBonus":5,"maximumEffectiveBonus":10}'),
  ('dmg-magic-weapon-effective-bonus-prices','Magic Weapon Effective-Bonus Base Prices','222','table',
   'Table 7-9 gives the base magical price for effective weapon bonuses from +1 through +10; ammunition prices apply to a batch of fifty pieces.',
   '["magic-items","weapons","pricing","table"]',
   '{"priceCopperByEffectiveBonus":{"1":200000,"2":800000,"3":1800000,"4":3200000,"5":5000000,"6":7200000,"7":9800000,"8":12800000,"9":16200000,"10":20000000},"ammunitionQuantity":50}'),
  ('dmg-magic-weapon-hardness-hit-points','Magic Weapon and Shield Hardness/Hit Points','221-222','rule',
   'Each +1 of enhancement bonus adds 2 hardness and 10 hit points to a weapon or shield.',
   '["magic-items","weapons","shields","hardness","hit-points"]',
   '{"hardnessPerEnhancementBonus":2,"hitPointsPerEnhancementBonus":10}'),
  ('dmg-magic-weapon-critical-extra-dice','Magic Weapon Extra Dice on Critical Hits','221-222','rule',
   'Additional dice of damage from a magic weapon property are not multiplied on a critical hit unless the specific effect says otherwise.',
   '["magic-items","weapons","critical-hit"]',
   '{"multiplyAdditionalDamageDiceOnCritical":false}'),
  ('dmg-magic-weapon-critical-special-effects','Magic Weapon Critical Special Effects','221-222','rule',
   'A magic weapon ability that has a special effect on a confirmed critical can still trigger against a creature normally immune to critical-hit damage; normal weapon damage is not multiplied for that creature.',
   '["magic-items","weapons","critical-hit"]',
   '{"criticalTriggeredSpecialEffectsCanAffectCriticalImmuneTargets":true,"multiplyNormalDamageAgainstCriticalImmuneTargets":false}'),
  ('dmg-magic-weapon-activation','Magic Weapon Ability Activation','221-222','rule',
   'Passive magic weapon properties apply through normal use; an ability that requires activation usually uses a command word and a standard action unless its description says otherwise.',
   '["magic-items","weapons","activation"]',
   '{"defaultActivatedAbilityMethod":"command_word","defaultActivatedAbilityAction":"standard"}'),
  ('dmg-magic-weapon-light','Magic Weapon Light Generation','221-223','table',
   'Thirty percent of magic melee weapons shed light equivalent to a light spell; the light cannot be shut off while the weapon is drawn. The random special-quality table also allows function clues. Ranged weapons use only the clue/none results.',
   '["magic-items","weapons","light","random-generation"]',
   '{"melee":[{"min":1,"max":30,"result":"sheds-light"},{"min":31,"max":45,"result":"function-clue"},{"min":46,"max":100,"result":"none"}],"ranged":[{"min":1,"max":15,"result":"function-clue"},{"min":16,"max":100,"result":"none"}],"light":{"brightRadiusFeet":20,"shadowyRadiusFeet":40,"canShutOffWhileDrawn":false,"canConcealWhileDrawn":false}}'),
  ('dmg-magic-ranged-ammunition-enhancement-stacking','Ranged Weapon and Ammunition Enhancement Stacking','221','rule',
   'The enhancement bonus of a ranged projectile weapon does not stack with the enhancement bonus of its ammunition; use only the higher enhancement bonus.',
   '["magic-items","weapons","ammunition","stacking"]',
   '{"enhancementBonusesStack":false,"use":"higher"}'),
  ('dmg-magic-ranged-ammunition-inheritance','Projectile Weapon Magic Inherited by Ammunition','221','rule',
   'Ammunition fired from a +1 or better projectile weapon counts as magic for overcoming damage reduction. It also gains the projectile weapon''s alignment traits in addition to any alignment the ammunition already has.',
   '["magic-items","weapons","ammunition","damage-reduction","alignment"]',
   '{"minimumWeaponEnhancementForMagicDr":1,"inheritsProjectileWeaponAlignment":true,"retainsOwnAlignment":true}'),
  ('dmg-magic-ammunition-breakage','Magic Ammunition Breakage','221','rule',
   'A magic arrow, bolt, or sling bullet that hits is destroyed. On a miss it has a 50% chance to break or otherwise become unusable.',
   '["magic-items","ammunition","breakage"]',
   '{"destroyedOnHit":true,"breakChancePercentOnMiss":50}'),
  ('dmg-magic-weapon-unusual-size-cost','Magic Weapons for Unusually Sized Creatures','223','rule',
   'Changing a weapon for an unusually sized creature changes the mundane base-weapon cost under the Player''s Handbook size rules, but the masterwork and magical enhancement costs remain unchanged.',
   '["magic-items","weapons","size","pricing"]',
   '{"sizeAdjustsBaseWeaponCost":true,"masterworkCostUnchanged":true,"magicEnhancementCostUnchanged":true}'),
  ('dmg-magic-double-weapon-generation','Random Magic Double-Weapon Second Head','222-223','table',
   'A masterwork double weapon pays the masterwork cost for both heads. When randomly generated, the second head has the same enhancement bonus as the main head on 01-50, or one less enhancement bonus and no special abilities on 51-100.',
   '["magic-items","weapons","double-weapons","random-generation"]',
   '{"masterworkAddedCostCopperPerHead":30000,"randomSecondHead":[{"min":1,"max":50,"enhancement":"same","specialAbilities":"same-generation-costed-separately"},{"min":51,"max":100,"enhancement":"main-minus-one","specialAbilities":[]}]}'),

  ('dmg-table-7-9-weapons','Table 7-9: Weapons','222','table',
   'Random magic-weapon potency table for minor, medium, and major magic items.',
   '["magic-items","weapons","random-generation","table-7-9"]',
   '{"minor":[[1,70,{"enhancement":1}],[71,85,{"enhancement":2}],[86,90,{"result":"specific-weapon"}],[91,100,{"result":"special-ability-and-reroll"}]],"medium":[[1,10,{"enhancement":1}],[11,29,{"enhancement":2}],[30,58,{"enhancement":3}],[59,62,{"enhancement":4}],[63,68,{"result":"specific-weapon"}],[69,100,{"result":"special-ability-and-reroll"}]],"major":[[1,20,{"enhancement":3}],[21,38,{"enhancement":4}],[39,49,{"enhancement":5}],[50,63,{"result":"specific-weapon"}],[64,100,{"result":"special-ability-and-reroll"}]]}'),
  ('dmg-table-7-10-weapon-type','Table 7-10: Weapon Type Determination','222','table',
   'Randomly selects common melee, uncommon, or common ranged weapon tables.',
   '["magic-items","weapons","random-generation","table-7-10"]',
   '{"ranges":[[1,70,"common-melee"],[71,80,"uncommon"],[81,100,"common-ranged"]]}'),
  ('dmg-table-7-11-common-melee','Table 7-11: Common Melee Weapons','222','table',
   'Random common melee masterwork base weapon and its mundane-plus-masterwork cost before adding the magical enhancement price.',
   '["magic-items","weapons","random-generation","table-7-11"]',
   '{"ranges":[[1,4,"dagger",30200],[5,14,"greataxe",32000],[15,24,"greatsword",35000],[25,28,"kama",30200],[29,41,"longsword",31500],[42,45,"mace-light",30500],[46,50,"mace-heavy",31200],[51,54,"nunchaku",30200],[55,57,"quarterstaff",60000],[58,61,"rapier",32000],[62,66,"scimitar",31500],[67,70,"shortspear",30200],[71,74,"siangham",30300],[75,84,"sword-bastard",33500],[85,89,"sword-short",31000],[90,100,"waraxe-dwarven",33000]]}'),
  ('dmg-table-7-12-uncommon-weapons','Table 7-12: Uncommon Weapons','222-223','table',
   'Random uncommon masterwork base weapon and its mundane-plus-masterwork cost before adding the magical enhancement price.',
   '["magic-items","weapons","random-generation","table-7-12"]',
   '{"ranges":[[1,3,"axe-orc-double",66000],[4,7,"battleaxe",31000],[8,10,"chain-spiked",32500],[11,12,"club",30000],[13,16,"crossbow-hand",40000],[17,19,"crossbow-repeating",55000],[20,21,"dagger-punching",30200],[22,23,"falchion",37500],[24,26,"flail-dire",69000],[27,31,"flail-heavy",31500],[32,35,"flail-light",30800],[36,37,"gauntlet",30200],[38,39,"gauntlet-spiked",30500],[40,41,"glaive",30800],[42,43,"greatclub",30500],[44,45,"guisarme",30900],[46,48,"halberd",31000],[49,51,"halfspear",30100],[52,54,"hammer-gnome-hooked",62000],[55,56,"hammer-light",30100],[57,58,"handaxe",30600],[59,61,"kukri",30800],[62,64,"lance",31000],[65,67,"longspear",30500],[68,70,"morningstar",30800],[71,72,"net",32000],[73,74,"pick-heavy",30800],[75,76,"pick-light",30400],[77,78,"ranseur",31000],[79,80,"sap",30100],[81,82,"scythe",31800],[83,84,"shuriken",30100],[85,86,"sickle",30600],[87,89,"sword-two-bladed",70000],[90,91,"trident",31500],[92,94,"urgrosh-dwarven",65000],[95,97,"warhammer",31200],[98,100,"whip",30100]]}'),
  ('dmg-table-7-13-common-ranged','Table 7-13: Common Ranged Weapons','223','table',
   'Random common ranged masterwork base weapon or ammunition and its mundane-plus-masterwork cost before adding magical enhancement price.',
   '["magic-items","weapons","ammunition","random-generation","table-7-13"]',
   '{"ranges":[[1,10,{"result":"ammunition-reroll","ranges":[[1,50,"arrows-50",35000],[51,80,"crossbow-bolts-50",35000],[81,100,"sling-bullets-50",35000]]}],[11,15,"axe-throwing",30800],[16,25,"crossbow-heavy",35000],[26,35,"crossbow-light",33500],[36,39,"dart",30050],[40,41,"javelin",30100],[42,46,"shortbow",33000],[47,51,"shortbow-composite-0",37500],[52,56,"shortbow-composite-1",45000],[57,61,"shortbow-composite-2",52500],[62,65,"sling",30000],[66,75,"longbow",37500],[76,80,"longbow-composite-0",40000],[81,85,"longbow-composite-1",50000],[86,90,"longbow-composite-2",60000],[91,95,"longbow-composite-3",70000],[96,100,"longbow-composite-4",80000]]}'),

  ('dmg-table-7-14-melee-abilities','Table 7-14: Melee Weapon Special Abilities','223','table',
   'Random melee weapon special-ability table. Duplicate or incompatible abilities and results that push the total effective bonus above +10 are rerolled.',
   '["magic-items","weapons","melee","special-abilities","random-generation","table-7-14"]',
   '{"minor":[[1,10,"bane"],[11,17,"defending"],[18,27,"flaming"],[28,37,"frost"],[38,47,"shock"],[48,56,"ghost-touch"],[57,67,"keen"],[68,71,"ki-focus"],[72,75,"merciful"],[76,82,"mighty-cleaving"],[83,87,"spell-storing"],[88,91,"throwing"],[92,95,"thundering"],[96,99,"vicious"],[100,100,"roll-twice"]],"medium":[[1,6,"bane"],[7,12,"defending"],[13,19,"flaming"],[20,26,"frost"],[27,33,"shock"],[34,38,"ghost-touch"],[39,44,"keen"],[45,48,"ki-focus"],[49,50,"merciful"],[51,54,"mighty-cleaving"],[55,59,"spell-storing"],[60,63,"throwing"],[64,65,"thundering"],[66,69,"vicious"],[70,72,"anarchic"],[73,75,"axiomatic"],[76,78,"disruption"],[79,81,"flaming-burst"],[82,84,"icy-burst"],[85,87,"holy"],[88,90,"shocking-burst"],[91,93,"unholy"],[94,95,"wounding"],[96,100,"roll-twice"]],"major":[[1,3,"bane"],[4,6,"flaming"],[7,9,"frost"],[10,12,"shock"],[13,15,"ghost-touch"],[16,19,"ki-focus"],[20,21,"mighty-cleaving"],[22,24,"spell-storing"],[25,28,"throwing"],[29,32,"thundering"],[33,36,"vicious"],[37,41,"anarchic"],[42,46,"axiomatic"],[47,49,"disruption"],[50,54,"flaming-burst"],[55,59,"icy-burst"],[60,64,"holy"],[65,69,"shocking-burst"],[70,74,"unholy"],[75,78,"wounding"],[79,83,"speed"],[84,86,"brilliant-energy"],[87,88,"dancing"],[89,90,"vorpal"],[91,100,"roll-twice"]],"restrictions":{"keen":"piercing-or-slashing","disruption":"bludgeoning-only","vorpal":"slashing-only"},"rerollDuplicate":true,"rerollIncompatible":true,"maximumEffectiveBonus":10}'),
  ('dmg-table-7-15-ranged-abilities','Table 7-15: Ranged Weapon Special Abilities','223','table',
   'Random ranged weapon special-ability table. Duplicate or incompatible abilities and results that push the total effective bonus above +10 are rerolled.',
   '["magic-items","weapons","ranged","special-abilities","random-generation","table-7-15"]',
   '{"minor":[[1,12,"bane"],[13,25,"distance"],[26,40,"flaming"],[41,55,"frost"],[56,60,"merciful"],[61,68,"returning"],[69,83,"shock"],[84,93,"seeking"],[94,99,"thundering"],[100,100,"roll-twice"]],"medium":[[1,8,"bane"],[9,16,"distance"],[17,28,"flaming"],[29,40,"frost"],[41,42,"merciful"],[43,47,"returning"],[48,59,"shock"],[60,64,"seeking"],[65,68,"thundering"],[69,71,"anarchic"],[72,74,"axiomatic"],[75,79,"flaming-burst"],[80,82,"holy"],[83,87,"icy-burst"],[88,92,"shocking-burst"],[93,95,"unholy"],[96,100,"roll-twice"]],"major":[[1,4,"bane"],[5,8,"distance"],[9,12,"flaming"],[13,16,"frost"],[17,21,"returning"],[22,25,"shock"],[26,27,"seeking"],[28,29,"thundering"],[30,34,"anarchic"],[35,39,"axiomatic"],[40,49,"flaming-burst"],[50,54,"holy"],[55,64,"icy-burst"],[65,74,"shocking-burst"],[75,79,"unholy"],[80,84,"speed"],[85,90,"brilliant-energy"],[91,100,"roll-twice"]],"rerollDuplicate":true,"rerollIncompatible":true,"maximumEffectiveBonus":10}'),

  ('dmg-table-7-16-specific-weapons','Table 7-16: Specific Weapons','227','table',
   'Random specific-weapon table for minor, medium, and major magic weapons.',
   '["magic-items","weapons","specific-weapons","random-generation","table-7-16"]',
   '{"minor":[[1,15,"sleep-arrow"],[16,25,"screaming-bolt"],[26,45,"silver-dagger-masterwork"],[46,65,"cold-iron-longsword-masterwork"],[66,75,"javelin-of-lightning"],[76,80,"slaying-arrow"],[81,90,"adamantine-dagger"],[91,100,"adamantine-battleaxe"]],"medium":[[1,9,"javelin-of-lightning"],[10,15,"slaying-arrow"],[16,24,"adamantine-dagger"],[25,33,"adamantine-battleaxe"],[34,37,"slaying-arrow-greater"],[38,40,"shatterspike"],[41,46,"dagger-of-venom"],[47,51,"trident-of-warning"],[52,57,"assassins-dagger"],[58,62,"shifters-sorrow"],[63,66,"trident-of-fish-command"],[67,74,"flame-tongue"],[75,79,"luck-blade-0-wishes"],[80,86,"sword-of-subtlety"],[87,91,"sword-of-the-planes"],[92,95,"nine-lives-stealer"],[96,98,"sword-of-life-stealing"],[99,100,"oathbow"]],"major":[[1,4,"assassins-dagger"],[5,7,"shifters-sorrow"],[8,9,"trident-of-fish-command"],[10,13,"flame-tongue"],[14,17,"luck-blade-0-wishes"],[18,24,"sword-of-subtlety"],[25,31,"sword-of-the-planes"],[32,37,"nine-lives-stealer"],[38,42,"sword-of-life-stealing"],[43,46,"oathbow"],[47,51,"mace-of-terror"],[52,57,"life-drinker"],[58,62,"sylvan-scimitar"],[63,67,"rapier-of-puncturing"],[68,73,"sun-blade"],[74,79,"frost-brand"],[80,84,"dwarven-thrower"],[85,91,"luck-blade-1-wish"],[92,95,"mace-of-smiting"],[96,97,"luck-blade-2-wishes"],[98,99,"holy-avenger"],[100,100,"luck-blade-3-wishes"]],"marketPriceCopper":{"sleep-arrow":13200,"screaming-bolt":26700,"silver-dagger-masterwork":32200,"cold-iron-longsword-masterwork":33000,"javelin-of-lightning":150000,"slaying-arrow":228200,"adamantine-dagger":300200,"adamantine-battleaxe":301000,"slaying-arrow-greater":405700,"shatterspike":431500,"dagger-of-venom":830200,"trident-of-warning":1011500,"assassins-dagger":1030200,"shifters-sorrow":1278000,"trident-of-fish-command":1865000,"flame-tongue":2071500,"luck-blade-0-wishes":2206000,"sword-of-subtlety":2231000,"sword-of-the-planes":2231500,"nine-lives-stealer":2305700,"sword-of-life-stealing":2571500,"oathbow":2560000,"mace-of-terror":3855200,"life-drinker":4032000,"sylvan-scimitar":4731500,"rapier-of-puncturing":5032000,"sun-blade":5033500,"frost-brand":5447500,"dwarven-thrower":6031200,"luck-blade-1-wish":6236000,"mace-of-smiting":7531200,"luck-blade-2-wishes":10266000,"holy-avenger":12063000,"luck-blade-3-wishes":14296000}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'dmg-rule-'||d.slug,'dmg-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
  'magic-items',d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
