-- Heroes of Horror magic items and artifacts.
-- Source: Heroes of Horror, pp. 133-134. Mechanical text is summarized; source pages remain authoritative.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('hoh-3.5','heroes-of-horror-3-5','Heroes of Horror','HoH','Wizards of the Coast','dnd','3.5',
        'D&D 3.5 horror supplement covering dread campaigns, taint, horror character options, magic, and monsters.',NULL,1,0,NULL);

WITH desired(id,page,slug,name,description,rules_text,price_copper,weight_pounds) AS (VALUES
  ('hoh-item-rod-of-sanctity','133','rod-of-sanctity','Rod of Sanctity',
   'A black-iron and lapis-lazuli rod created by purifiers of the Hallowed Doctrine to resist and combat taint.',
   'Functions as a +2 bane light mace against a creature with a taint score and as a masterwork light mace otherwise. The wielder gains a +2 resistance bonus on saves against gaining taint. A purifier of the Hallowed Doctrine wielding the rod treats purifier level as 4 higher and Charisma modifier as 2 higher for smiting or turning tainted creatures.',
   3680500,8.0),
  ('hoh-item-acereraks-robe','133-134','acereraks-robe','Acererak''s Robe',
   'A major evil artifact disguised as a robe of the archmagi whose powers bind death and undeath to its wearer.',
   'Appears to examination as a robe of the archmagi whose apparent alignment matches the observer; a suspicious observer can attempt a DC 30 Will save to recognize that disguise as false. It grants the normal robe-of-the-archmagi abilities regardless of alignment and continuously protects the wearer as death ward. Three times per day the wearer can use finger of death by touch as a 20th-level caster; a creature slain by that use immediately rises as a zombie controlled separately up to 4 HD of undead per wearer Hit Die. Any touch of another living creature has a 10% chance to trigger the death effect involuntarily even after the daily voluntary uses are spent. A living creature remaining within 20 feet for more than 5 minutes has a 5% chance to trigger a ranged death effect; resulting zombies are uncontrolled by the wearer but follow the wearer and attack other living beings. Once donned, only miracle or wish removes the robe. Destruction requires coating it in dust from a demilich and then burning it in holy fire such as a flame strike cast by a 20th-level caster.',
   NULL,NULL),
  ('hoh-item-blade-of-valgyr','134','blade-of-valgyr','Blade of Valgyr',
   'A chaotic evil intelligent major artifact that demands bloodshed and binds itself to the warrior who draws it.',
   'Int 16, Wis 10, Cha 16, Ego 20. A +4 keen, unholy, wounding bastard sword. It uses detect magic at will and darkness three times per day, has 10 ranks in Bluff, grants fire resistance 10 and cold resistance 10, and speaks Common, Abyssal, Celestial, and Draconic. It is a tainted object and requires the bearer to save against taint each day it remains possessed. Each day it fails to take the life of a lawful good being, it bestows one negative level on the wielder. After it is first drawn in battle the wielder can never draw another weapon or voluntarily get rid of the blade; it appears in the wielder''s hand when combat begins. Miracle or wish frees the bearer. Destroying it requires exposure within 24 hours to the breath weapons of two great wyrm dragons, one metallic and one chromatic.',
   NULL,NULL),
  ('hoh-item-rod-of-cas','134','rod-of-cas','Rod of Cas (Ebon Rod of Ill Will)',
   'Cas''s antler-headed minor artifact, an enormous spiteful mace that remembers every creature that harms its wielder.',
   'Functions as a Large +3 vicious heavy mace dealing both bludgeoning and piercing damage. When an opponent deals damage to the wielder, the rod permanently remembers that attacker and gains the appropriate bane ability when attacking that creature type, shifting its bane focus as needed among remembered attackers. It cannot be disarmed from a living wielder without permission. An enemy of the owner who picks it up is immediately targeted by phantasmal killer at DC 20 + the owner''s Charisma modifier. An attempt to destroy the rod causes it to teleport to Cas, and the would-be destroyer instead receives the damage dealt to the rod.',
   NULL,16.0)
)
INSERT INTO dnd35_items
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,price_copper,weight_pounds,size,hardness,hit_points)
SELECT d.id,'hoh-3.5',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,'magic',d.price_copper,d.weight_pounds,NULL,NULL,NULL
FROM desired d
WHERE NOT EXISTS (SELECT 1 FROM dnd35_items i WHERE i.slug=d.slug AND i.owner_user_id IS NULL);

INSERT OR IGNORE INTO dnd35_magic_items
  (item_id,aura_school_id,caster_level,manifester_level,aura_strength,activation,activation_text,slot,maximum_charges,recharge_text,enhancement_bonus,craft_cost_copper,craft_xp_cost,crafting_text,crafting_prerequisites)
VALUES
  ('hoh-item-rod-of-sanctity','phb-spell-school-abjuration',11,NULL,'strong','continuous','Its defensive and anti-taint properties function while wielded.','main_hand',NULL,NULL,0,1825000,1460,'Craft Wondrous Item; creator must be capable of channeling positive energy specifically against taint.',NULL),
  ('hoh-item-acereraks-robe',NULL,NULL,NULL,'overwhelming','other','Continuous worn benefits plus voluntary and involuntary death effects described in the artifact rules.','body',NULL,NULL,0,NULL,NULL,'Major artifact; not normally craftable.',NULL),
  ('hoh-item-blade-of-valgyr',NULL,NULL,NULL,'overwhelming','other','Continuous intelligent-weapon properties plus at-will and limited-use spell-like powers.','main_hand',NULL,NULL,4,NULL,NULL,'Major artifact; not normally craftable.',NULL),
  ('hoh-item-rod-of-cas',NULL,20,NULL,'strong','other','Weapon properties are continuous; bane adaptation triggers when an opponent damages the wielder.','main_hand',NULL,NULL,3,NULL,NULL,'Minor artifact; not normally craftable.',NULL);
