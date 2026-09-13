-- Deities and Demigods: Chapter 7 xag-ya companion and Soldier of Light energon rules.
-- Source: Deities and Demigods (2002), pp. 209-210.
-- The book explicitly says this is an abbreviated block and points to Manual of the Planes for the full creature.
-- No xag-ya-specific replacement block appears in the official Deities and Demigods 3.5 update;
-- preserve this 3.0 source block and defer to a separately imported official revised energon source if one is later in scope.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-xag-ya','dd-3.0','209-210','xag-ya','Xag-Ya',
  'A translucent positive-energy energon used as the companion of a Soldier of Light; Deities and Demigods provides this abbreviated CR 4 combat block.',
  'Printed abbreviated 3.0 block: CR 4; Medium-size Outsider; 5d8+5 (27 hp); Init +3; fly 20 ft. (good); AC 17 (touch 17, flat-footed 14); +8 melee incorporeal touch (1d6 plus positive energy, two touches) or +8 ranged touch (1d8 positive-energy ray); incorporeal, positive energy lash, turn undead, explosion; AL N; Fort +5, Ref +7, Will +4; Str -, Dex 17, Con 12, Int 7, Wis 10, Cha 18; Hide +10, Search +5, Sense Motive +8, Spot +8; Combat Reflexes, Extra Turning. Positive Energy Lash: touch or ray deals an additional 2d8+5 to undead, including incorporeal undead; against a living creature it can instead heal up to 2d8+5 and the xag-ya can suppress that healing when attacking a living foe; usable five times/day. Turn Undead: 60-ft.-radius effect as a 5th-level cleric, five times/day, but cannot destroy undead. Explosion: at 0 hp the xag-ya is destroyed and deals 1d8+9 positive-energy damage in a 20-ft. burst, Fort DC 16 half. If a xag-ya and xeg-yi see one another, they rush together; contact destroys both and deals 2d8+18 in a 30-ft. radius, Fort DC 16 half. Source scope note: the full xag-ya appears in Manual of the Planes; this row intentionally preserves only the Deities and Demigods abbreviated companion block. The official Deities and Demigods 3.5 update supplies no replacement xag-ya block; do not silently invent one.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  4,1,5,1,8,5,
  'medium',5,5,0,0,0,4,
  5,NULL,5,7,4,NULL,17,12,7,10,18,
  'Positive Energy Plane',NULL,NULL,'N','Neutral',NULL,NULL,
  '[{"kind":"custom","extension":{"key":"dnd35.incorporeal-defense","version":1,"parameters":{"sourceEdition":"3.0","printed":true,"sourceScope":"abbreviated Deities and Demigods companion block"}}}]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='xag-ya' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-xag-ya','fly',20,'good','Printed abbreviated xag-ya fly speed and maneuverability.');

WITH desired(slug,name,page,description,mechanics) AS (VALUES
('dd-soldier-of-light-energon-companion','Soldier of Light: Energon Companion','209-210',
 'Companion progression and loss rules for the Soldier of Light prestige class, using a positive-energy xag-ya.',
 '{"classSlug":"soldier-of-light","companionCreatureSlug":"xag-ya","companionType":"energon","positiveEnergon":"xag-ya","negativeEnergon":"xeg-yi","progression":{"level4":{"companions":1,"bonusHitDiceEach":0},"level8":{"companions":2,"bonusHitDiceEach":2,"note":"Add +2 HD to both xag-ya companions, with attendant base attack and saving-throw increases."}},"communication":"The companion communicates telepathically with the Soldier of Light while within range and line of sight; its thoughts can be alien or cryptic.","lossOrDismissal":{"fortitudeSaveDc":15,"failedSaveXpLossPerSoldierLevel":200,"successfulSaveXpLossPerSoldierLevel":100,"minimumResultingXp":0,"replacementDelay":"one year and one day"},"sourceScope":{"creatureBlock":"Deities and Demigods gives an abbreviated xag-ya stat block and refers to Manual of the Planes for the full creature.","xegYiBlockIncludedHere":false},"revision3_5":{"specificCompanionRewriteInDdUpdate":false,"policy":"Preserve the printed class feature until a separately scoped official revised source supplies an explicit replacement."}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,
       'Use the structured mechanics payload for the Soldier of Light energon-companion progression and companion-loss rules.',
       0,NULL,1,'class-feature','companion',0,1,'soldier-of-light',NULL,
       '["deities-and-demigods","other-religions","soldier-of-light","xag-ya","energon","companion"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);