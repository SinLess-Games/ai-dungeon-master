-- Player's Handbook v3.5 Chapter 7 equipment/economy rules supporting the item catalog.
-- Mechanical summaries are concise and source-cited for deterministic consumers.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player equipment, weapons, armor, gear, goods, and services.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,kind,summary,tags,mechanics) AS (VALUES
  ('phb-coin-exchange','Coin Exchange and Weight','112','equipment','table',
   'Copper, silver, gold, and platinum use the standard 10:1 exchange steps; fifty standard coins weigh 1 pound.',
   '["equipment","economy","coins"]',
   '{"copperPerCoin":{"cp":1,"sp":10,"gp":100,"pp":1000},"coinsPerPound":50}'),
  ('phb-selling-loot','Selling Loot','112','equipment','rule',
   'Ordinary gear is generally sold for half listed price. Trade goods are the exception and are exchanged at approximately their listed value.',
   '["equipment","economy","trade-goods","resale"]',
   '{"ordinaryResaleFraction":0.5,"tradeGoodsUseListedValue":true}'),
  ('phb-small-gear-weight','Small Character Gear Weight','128','equipment','rule',
   'Table 7-8 items marked for creature scaling weigh one-quarter as much when made for Small characters; Small containers also hold one-quarter normal capacity.',
   '["equipment","size","containers"]',
   '{"smallWeightMultiplier":0.25,"smallContainerCapacityMultiplier":0.25,"appliesToTableMarkedItems":true}'),
  ('phb-masterwork-armor-shield','Masterwork Armor and Shields','126','equipment','rule',
   'Masterwork armor or shields cost 150 gp more than normal and reduce armor check penalty by 1. Magic armor and shields are automatically masterwork.',
   '["equipment","armor","shield","masterwork"]',
   '{"addedCostCopper":15000,"armorCheckPenaltyAdjustment":1,"magicItemsAutomaticallyMasterwork":true,"mustBeCreatedAsMasterwork":true}'),
  ('phb-barding-cost-weight','Barding Cost and Weight','131-132','equipment','rule',
   'Barding can use normal armor types. For a Medium mount it costs twice the humanoid armor price and has the same weight; for a Large nonhumanoid mount it costs four times as much and weighs twice as much.',
   '["equipment","armor","barding","mounts"]',
   '{"mediumMount":{"costMultiplier":2,"weightMultiplier":1},"largeNonhumanoidMount":{"costMultiplier":4,"weightMultiplier":2}}'),
  ('phb-barding-speed','Barding Speed Effects','131','movement','table',
   'Medium and heavy barding reduce mount speed; heavy barding also reduces the mount''s run multiplier, and flying mounts cannot fly in medium or heavy barding.',
   '["equipment","barding","mounts","movement"]',
   '{"medium":{"40":30,"50":35,"60":40},"heavy":{"40":30,"50":35,"60":40},"heavyRunMultiplier":3,"flyingMountMediumHeavyBardingCannotFly":true}'),
  ('phb-barding-care','Barding Care and Donning','131-132','equipment','rule',
   'Barding must be removed for normal overnight care; fitting or removing it takes five times the equivalent armor donning/removal time. A barded animal normally carries only its rider and ordinary saddlebags.',
   '["equipment","barding","mounts"]',
   '{"donningTimeMultiplier":5,"removeAtNight":true,"normalLoadRestriction":"rider-and-saddlebags"}'),
  ('phb-mount-market-prices','Mount Market Prices','132','equipment','table',
   'Table 7-8 lists standard market prices for common mounts and trained dogs.',
   '["equipment","mounts","economy"]',
   '{"priceCopper":{"guardDog":2500,"ridingDog":15000,"donkeyOrMule":800,"heavyHorse":20000,"lightHorse":7500,"pony":3000,"heavyWarhorse":40000,"lightWarhorse":15000,"warpony":10000}}'),
  ('phb-food-lodging-prices','Food and Lodging Prices','131','equipment','table',
   'Table 7-8 establishes standard daily prices for inn stays and meals at poor, common, and good quality.',
   '["equipment","services","lodging","food"]',
   '{"innPerDayCopper":{"poor":20,"common":50,"good":200},"mealsPerDayCopper":{"poor":10,"common":30,"good":50}}'),
  ('phb-basic-service-prices','Common Service Prices','132','equipment','table',
   'Table 7-8 gives baseline rates for local transport, hirelings, messengers, tolls, stabling, and ship passage.',
   '["equipment","services","economy"]',
   '{"coachCabCopperPerMile":3,"trainedHirelingCopperPerDay":30,"untrainedHirelingCopperPerDay":10,"messengerCopperPerMile":2,"roadOrGateTollCopper":1,"shipPassageCopperPerMile":10,"stablingCopperPerDay":50}'),
  ('phb-spellcasting-service-price','Spellcasting Service Price','132','equipment','rule',
   'Purchasing spellcasting uses caster level times a level-based gp multiplier, plus any extra component costs. Spells whose additional costs push the total above 3,000 gp are not generally available without DM permission.',
   '["equipment","services","spellcasting","economy"]',
   '{"gpMultiplierBySpellLevel":{"0":5,"1":10,"2":20,"3":30,"4":40,"5":50,"6":60,"7":70,"8":80,"9":90},"formula":"casterLevel * multiplier + extraCosts","generalAvailabilityAdditionalCostCeilingGp":3000,"dmPermissionAboveCeiling":true}'),
  ('phb-riding-dog','Riding Dog as Mount','131-132','equipment','rule',
   'A riding dog is trained to carry a Small humanoid rider, is brave in combat like a warhorse, and its rider takes no damage from a fall from that mount under the stated rule.',
   '["equipment","mounts","riding-dog"]',
   '{"riderSize":"Small","combatTrained":true,"fallDamageToRider":0}'),
  ('phb-donkey-mule','Donkey and Mule Mount Traits','131-132','equipment','guidance',
   'Donkeys and mules are durable pack animals, unusually willing to enter dungeons and threatening places compared with horses.',
   '["equipment","mounts","pack-animal"]',
   '{}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT
  'phb-rule-'||d.slug,'phb-3.5',d.page,d.slug,d.name,d.summary,d.summary,0,NULL,1,
  d.category,d.kind,0,1,NULL,NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r
  WHERE r.source_id='phb-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
