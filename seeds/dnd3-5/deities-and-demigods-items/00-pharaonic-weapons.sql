-- Deities and Demigods: Pharaonic exotic weapons.
-- Source: Deities and Demigods (2002), Chapter 5, p. 158.
-- The printed 3.0 weapon sizes are retained as source data rather than silently rewritten to 3.5 sizing conventions.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(id,slug,name,description,rules_text,price_copper,weight_pounds,size) AS (VALUES
  ('dd-item-khopesh','khopesh','Khopesh',
   'A hooked Pharaonic exotic melee weapon whose curved blade can be used to trip opponents.',
   'Printed as a Medium-size exotic melee weapon. Cost 20 gp; damage 1d8; critical 19-20/x2; weight 12 lb.; slashing. The hooklike blade permits trip attacks. If the wielder would be tripped during their own trip attempt, they can drop the khopesh to avoid being tripped.',
   2000,12.0,'medium'),
  ('dd-item-tiger-claws','tiger-claws','Tiger Claws',
   'A pair of Pharaonic claw weapons strapped to the hands, favored especially by monks and followers of Bast.',
   'Printed as a Tiny exotic melee weapon. Cost 5 gp; damage 1d4; critical x2; weight 2 lb.; piercing. A wielder cannot be disarmed of tiger claws with the disarm action. A monk wielding tiger claws uses the monk unarmed base attack bonus, including the monk''s more favorable number of attacks per round, plus other applicable attack modifiers.',
   500,2.0,'tiny')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dd-3.0','158',d.slug,d.name,d.description,d.rules_text,0,NULL,1,'weapon',d.price_copper,d.weight_pounds,d.size,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.slug=d.slug AND i.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_weapons
  (item_id,proficiency,handedness,attack_kind,critical_threat_minimum,critical_multiplier,range_increment_feet,reach_feet,is_reach,damage_type_mode,special_text)
VALUES
  ('dd-item-khopesh','exotic','one_handed','melee',19,2,NULL,NULL,0,'and',
   'Trip weapon. May be used to make trip attacks; if tripped during the wielder''s own trip attempt, the wielder may drop the khopesh to avoid being tripped. Printed source size: Medium.'),
  ('dd-item-tiger-claws','exotic','light','melee',20,2,NULL,NULL,0,'and',
   'Cannot be disarmed with the disarm action. A monk uses the monk unarmed base attack bonus and favorable unarmed attack progression while using tiger claws. Printed source size: Tiny.');

INSERT OR IGNORE INTO dnd35_weapon_damage (weapon_id,size,weapon_end,dice)
VALUES
  ('dd-item-khopesh','medium',1,'1d8'),
  ('dd-item-tiger-claws','tiny',1,'1d4');

INSERT OR IGNORE INTO dnd35_weapon_damage_types (weapon_id,damage_type)
VALUES
  ('dd-item-khopesh','slashing'),
  ('dd-item-tiger-claws','piercing');

WITH desired(slug,name,description,mechanics) AS (VALUES
 ('dd-weapon-revision-khopesh','Khopesh Source/Revision Notes',
  'Preserves the khopesh''s printed 3.0 weapon statistics while exposing its trip-weapon behavior to the 3.5 rules engine.',
  '{"itemSlug":"khopesh","sourceEdition":"3.0","printedSize":"Medium","costGp":20,"damage":"1d8","critical":"19-20/x2","weightLb":12,"damageType":"slashing","tripWeapon":true,"dropToAvoidCounterTrip":true,"revision3_5":{"sourceStatisticsPreserved":true,"note":"No book-specific 3.5 update changes the khopesh entry; apply general 3.5 weapon-size/wielding rules at runtime rather than rewriting the printed source row."}}'),
 ('dd-weapon-revision-tiger-claws','Tiger Claws Source/Revision Notes',
  'Preserves the tiger claws'' printed 3.0 weapon statistics and their special monk/unarmed interaction.',
  '{"itemSlug":"tiger-claws","sourceEdition":"3.0","printedSize":"Tiny","costGp":5,"damage":"1d4","critical":"x2","weightLb":2,"damageType":"piercing","cannotBeDisarmedByDisarmAction":true,"monkUsesUnarmedBaseAttackBonus":true,"monkUsesFavorableUnarmedAttackCount":true,"revision3_5":{"sourceStatisticsPreserved":true,"note":"No book-specific 3.5 update changes the tiger claws entry; apply revised monk attack/flurry rules when resolving the source special rule."}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0','158',d.slug,d.name,d.description,d.description,0,NULL,1,
       'equipment','revision-note',0,1,NULL,NULL,
       '["deities-and-demigods","pharaonic","weapon","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
