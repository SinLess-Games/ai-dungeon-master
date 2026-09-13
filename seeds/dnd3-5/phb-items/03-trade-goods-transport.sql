-- Player's Handbook v3.5 Chapter 7: trade goods, mount gear, and transport.
-- Sources: Table 7-3 (p. 112) and Table 7-8 (p. 132).

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('phb-3.5','players-handbook-3-5','Player''s Handbook','PHB','Wizards of the Coast','dnd','3.5',
        'Core Rulebook I; source for D&D v3.5 player equipment, weapons, armor, gear, goods, and services.',NULL,1,0,NULL);

WITH desired(slug,name,page,category,price_copper,weight_pounds,description,rules_text) AS (VALUES
  ('trade-wheat-pound','Wheat (1 lb.)','112','other',1,1.0,'One pound of wheat sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-flour-pound','Flour (1 lb.)','112','other',2,1.0,'One pound of flour sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-iron-pound','Iron (1 lb.)','112','other',10,1.0,'One pound of iron sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-tobacco-pound','Tobacco (1 lb.)','112','other',50,1.0,'One pound of tobacco sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-copper-pound','Copper (1 lb.)','112','other',50,1.0,'One pound of copper sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-cinnamon-pound','Cinnamon (1 lb.)','112','other',100,1.0,'One pound of cinnamon sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-ginger-pound','Ginger (1 lb.)','112','other',200,1.0,'One pound of ginger sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-pepper-pound','Pepper (1 lb.)','112','other',200,1.0,'One pound of pepper sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-linen-square-yard','Linen (1 sq. yd.)','112','other',400,NULL,'One square yard of linen sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-salt-pound','Salt (1 lb.)','112','other',500,1.0,'One pound of salt sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-silver-pound','Silver (1 lb.)','112','other',500,1.0,'One pound of silver sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-silk-square-yard','Silk (1 sq. yd.)','112','other',1000,NULL,'One square yard of silk sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-saffron-pound','Saffron (1 lb.)','112','other',1500,1.0,'One pound of saffron sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-cloves-pound','Cloves (1 lb.)','112','other',1500,1.0,'One pound of cloves sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-gold-pound','Gold (1 lb.)','112','other',5000,1.0,'One pound of gold sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),
  ('trade-platinum-pound','Platinum (1 lb.)','112','other',50000,1.0,'One pound of platinum sold as a trade good.','Trade goods are normally exchanged at their listed value rather than the usual half-price resale value.'),

  ('bit-and-bridle','Bit and Bridle','132','gear',200,1.0,'Basic tack for controlling a mount.',''),
  ('feed-day','Feed (per day)','132','consumable',5,10.0,'A day''s concentrated feed for a typical horse, pony, donkey, or mule.',''),
  ('saddle-military','Saddle, Military','132','gear',2000,30.0,'A military saddle designed to keep a rider secure.','Provides the military-saddle benefit on Ride checks made to remain in the saddle.'),
  ('saddle-pack','Saddle, Pack','132','gear',500,15.0,'A pack saddle for carrying cargo.',''),
  ('saddle-riding','Saddle, Riding','132','gear',1000,25.0,'A standard riding saddle.',''),
  ('saddle-exotic-military','Saddle, Exotic Military','132','gear',6000,40.0,'A military saddle made for an unusual mount.','Provides the military-saddle benefit on Ride checks made to remain in the saddle.'),
  ('saddle-exotic-pack','Saddle, Exotic Pack','132','gear',1500,20.0,'A pack saddle made for an unusual mount.',''),
  ('saddle-exotic-riding','Saddle, Exotic Riding','132','gear',3000,30.0,'A riding saddle made for an unusual mount.',''),
  ('saddlebags','Saddlebags','132','container',400,8.0,'Paired bags carried on a saddle.',''),

  ('carriage','Carriage','132','other',10000,600.0,'A passenger carriage.','Vehicle; requires appropriate draft animals and crew/driver as determined by the situation.'),
  ('cart','Cart','132','other',1500,200.0,'A two-wheeled cargo cart.','Vehicle; requires an appropriate draft animal or other motive force.'),
  ('galley','Galley','132','other',3000000,NULL,'A large oared sailing vessel.','Vehicle; movement and crew requirements follow the PHB vehicle rules.'),
  ('keelboat','Keelboat','132','other',300000,NULL,'A river or coastal keelboat.','Vehicle; movement and crew requirements follow the PHB vehicle rules.'),
  ('longship','Longship','132','other',1000000,NULL,'A long, narrow oared sailing ship.','Vehicle; movement and crew requirements follow the PHB vehicle rules.'),
  ('rowboat','Rowboat','132','other',5000,100.0,'A small oared boat.','Vehicle; normally propelled by oars.'),
  ('oar','Oar','132','gear',200,10.0,'A wooden oar.',''),
  ('sailing-ship','Sailing Ship','132','other',1000000,NULL,'A seagoing sailing vessel.','Vehicle; movement and crew requirements follow the PHB vehicle rules.'),
  ('sled','Sled','132','other',2000,300.0,'A cargo sled.','Vehicle; requires an appropriate draft animal or other motive force.'),
  ('wagon','Wagon','132','other',3500,400.0,'A four-wheeled cargo wagon.','Vehicle; requires an appropriate draft animal or other motive force.'),
  ('warship','Warship','132','other',2500000,NULL,'A large armed sailing vessel.','Vehicle; movement and crew requirements follow the PHB vehicle rules.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT
  'phb-item-'||d.slug,'phb-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  d.category,d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i
  WHERE i.source_id='phb-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);
