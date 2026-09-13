-- Dungeon Master's Guide v3.5 Chapter 7: Table 7-8 Specific Shields, pp. 220-221.
-- Mechanical text is summarized; the supplied DMG and appended errata remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dmg-3.5','dungeon-masters-guide-3-5','Dungeon Master''s Guide','DMG','Wizards of the Coast','dnd','3.5',
        'Core Rulebook II; source for D&D v3.5 magic items, treasure, special materials, and Dungeon Master rules.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,price_copper,weight_pounds,
  shield_category,ac_bonus,armor_check_penalty,arcane_spell_failure_percent,
  caster_level,enhancement_bonus,activation,activation_text,craft_cost_copper,craft_xp_cost,crafting_text
) AS (VALUES
('dmg-item-darkwood-buckler','220-221','darkwood-buckler','Darkwood Buckler',
 'A nonmagical buckler made from exceptionally light darkwood.',
 'Functions as a buckler, weighs 2-1/2 lb., and has no armor check penalty. It has no magical enhancement bonus.',
 20500,2.5,'buckler',1,0,5,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-darkwood-shield','220-221','darkwood-shield','Darkwood Shield',
 'A nonmagical heavy wooden shield made from exceptionally light darkwood.',
 'Functions as a heavy wooden shield, weighs 5 lb., and has no armor check penalty. It has no magical enhancement bonus.',
 25700,5.0,'heavy',2,0,15,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-mithral-heavy-shield','221','mithral-heavy-shield','Mithral Heavy Shield',
 'A nonmagical heavy shield made of lightweight mithral.',
 'Functions as a heavy shield, weighs 5 lb., has a 5% arcane spell failure chance, and has no armor check penalty. It has no magical enhancement bonus.',
 102000,5.0,'heavy',2,0,5,NULL,0,NULL,NULL,NULL,NULL,NULL),
('dmg-item-casters-shield','220-221','casters-shield','Caster''s Shield',
 'A +1 light wooden shield with a reusable leather strip on which a spell can be scribed as a scroll.',
 'The strip can hold one scroll spell of 3rd level or lower. Scribing that spell uses half the normal base raw-material cost; XP and costly component costs are unchanged. A randomly found caster''s shield has a 50% chance to carry one medium scroll spell; if present, it is divine on 01-80 or arcane on 81-100. The shield has a 5% arcane spell failure chance.',
 315300,5.0,'light',1,-1,5,6,1,'other','The +1 shield bonus is continuous; the reusable scroll strip follows scroll activation rules.',165300,120,'Craft Magic Arms and Armor; Scribe Scroll; creator must be at least 6th level.'),
('dmg-item-spined-shield','221','spined-shield','Spined Shield',
 'A +1 heavy steel shield covered in weaponlike spines.',
 'Functions as a normal spiked shield. Up to three times per day on command, the wearer can fire one spine as a +1 ranged weapon with 120-foot range increment, 1d10 damage, and 19-20/x2 critical. Fired spines regenerate each day.',
 558000,NULL,'heavy',2,-2,15,6,1,'command_word','Command word fires one spine, up to three times per day; fired spines regenerate daily.',274000,223,'Craft Magic Arms and Armor; magic missile.'),
('dmg-item-lions-shield','221','lions-shield','Lion''s Shield',
 'A +2 heavy steel shield shaped like a roaring lion''s head.',
 'Three times per day as a free action, command the lion head to attack independently. It uses the wielder''s base attack bonus, including iterative attacks, deals 2d6 damage, and attacks in addition to the wielder''s normal actions.',
 917000,15.0,'heavy',2,-2,15,10,2,'other','The +2 enhancement is continuous; command the lion head as a free action up to three times per day.',467000,360,'Craft Magic Arms and Armor; summon nature''s ally IV.'),
('dmg-item-winged-shield','221','winged-shield','Winged Shield',
 'A +3 round heavy wooden shield ringed with small feathered wings.',
 'Once per day on command it flies as the fly spell while carrying the wielder: up to 133 lb. at 60 feet per round, or up to 266 lb. at 40 feet per round.',
 1725700,10.0,'heavy',2,-2,15,5,3,'command_word','Command once per day to fly while carrying the wielder.',862850,690,'Craft Magic Arms and Armor; fly.'),
('dmg-item-absorbing-shield','220','absorbing-shield','Absorbing Shield',
 'A flat-black +1 heavy steel shield that seems to swallow surrounding light.',
 'Once every two days on command, the shield can disintegrate an object it touches as the spell; using the effect requires a melee touch attack.',
 5017000,15.0,'heavy',2,-2,15,17,1,'command_word','Command once every two days while touching an object; resolve a melee touch attack for the disintegrate effect.',2517000,2000,'Craft Magic Arms and Armor; disintegrate.')
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'dmg-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
       'shield',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_items i WHERE i.source_id='dmg-3.5' AND i.slug=d.slug AND i.owner_user_id IS NULL
);

WITH desired(item_id,shield_category,ac_bonus,armor_check_penalty,arcane_spell_failure_percent,special_text) AS (VALUES
('dmg-item-darkwood-buckler','buckler',1,0,5,'Darkwood buckler; no armor check penalty.'),
('dmg-item-darkwood-shield','heavy',2,0,15,'Darkwood heavy wooden shield; no armor check penalty.'),
('dmg-item-mithral-heavy-shield','heavy',2,0,5,'Mithral heavy shield; no armor check penalty and 5% arcane spell failure.'),
('dmg-item-casters-shield','light',1,-1,5,'+1 light wooden shield with reusable scroll strip.'),
('dmg-item-spined-shield','heavy',2,-2,15,'+1 heavy steel spiked shield; fires regenerating spines.'),
('dmg-item-lions-shield','heavy',2,-2,15,'+2 heavy steel shield; animated lion head attacks three times per day.'),
('dmg-item-winged-shield','heavy',2,-2,15,'+3 heavy wooden shield; command flight once per day.'),
('dmg-item-absorbing-shield','heavy',2,-2,15,'+1 heavy steel shield; object disintegration once every two days.')
)
INSERT OR IGNORE INTO dnd35_shields
  (item_id,category,ac_bonus,max_dex_bonus,armor_check_penalty,arcane_spell_failure_percent,
   speed_at_30_feet,speed_at_20_feet,special_text)
SELECT d.item_id,d.shield_category,d.ac_bonus,NULL,d.armor_check_penalty,d.arcane_spell_failure_percent,NULL,NULL,d.special_text
FROM desired d;

WITH desired(item_id,caster_level,enhancement_bonus,activation,activation_text,craft_cost_copper,craft_xp_cost,crafting_text) AS (VALUES
('dmg-item-casters-shield',6,1,'other','The +1 enhancement is continuous; the leather strip stores a scroll spell and follows scroll activation rules.',165300,120,'Craft Magic Arms and Armor; Scribe Scroll; creator must be at least 6th level.'),
('dmg-item-spined-shield',6,1,'command_word','Command to fire a spine up to three times per day; fired spines regenerate daily.',274000,223,'Craft Magic Arms and Armor; magic missile.'),
('dmg-item-lions-shield',10,2,'other','The enhancement is continuous; command the lion head as a free action three times per day.',467000,360,'Craft Magic Arms and Armor; summon nature''s ally IV.'),
('dmg-item-winged-shield',5,3,'command_word','Command once per day to fly while carrying the wielder.',862850,690,'Craft Magic Arms and Armor; fly.'),
('dmg-item-absorbing-shield',17,1,'command_word','Command once every two days to disintegrate a touched object.',2517000,2000,'Craft Magic Arms and Armor; disintegrate.')
)
INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,
   maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
SELECT d.item_id,NULL,d.caster_level,NULL,NULL,d.activation,d.activation_text,'shield',
       NULL,NULL,d.enhancement_bonus,d.craft_cost_copper,d.craft_xp_cost,d.crafting_text,NULL
FROM desired d;

WITH desired(slug,name,summary,mechanics) AS (VALUES
('dmg-specific-shield-table','Specific Shield Generation Table',
 'Table 7-8 maps minor, medium, and major specific-shield percentile results to the eight listed specific shields.',
 '{"minor":[{"min":1,"max":30,"slug":"darkwood-buckler"},{"min":31,"max":80,"slug":"darkwood-shield"},{"min":81,"max":95,"slug":"mithral-heavy-shield"},{"min":96,"max":100,"slug":"casters-shield"}],"medium":[{"min":1,"max":20,"slug":"darkwood-buckler"},{"min":21,"max":45,"slug":"darkwood-shield"},{"min":46,"max":70,"slug":"mithral-heavy-shield"},{"min":71,"max":85,"slug":"casters-shield"},{"min":86,"max":90,"slug":"spined-shield"},{"min":91,"max":95,"slug":"lions-shield"},{"min":96,"max":100,"slug":"winged-shield"}],"major":[{"min":1,"max":20,"slug":"casters-shield"},{"min":21,"max":40,"slug":"spined-shield"},{"min":41,"max":60,"slug":"lions-shield"},{"min":61,"max":90,"slug":"winged-shield"},{"min":91,"max":100,"slug":"absorbing-shield"}]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dmg-rule-'||d.slug,'dmg-3.5','221',d.slug,d.name,d.summary,d.summary,0,NULL,1,
       'magic-items','table',0,1,NULL,NULL,'["magic-items","shields","random-generation"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dmg-3.5' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
