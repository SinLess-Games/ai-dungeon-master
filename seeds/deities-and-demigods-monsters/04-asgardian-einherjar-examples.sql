-- Deities and Demigods: printed Einherjar examples from the Asgardian monster section.
-- Source: Deities and Demigods (2002), Chapter 6, pp. 199-200, plus official v3.5 revision update.
-- Each printed sample has explicit CR 20, so all three can be represented as concrete monster rows.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

-- Dwarf Fighter 20 Einherjar.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-dwarf-einherjar','dd-3.0','199-200','dwarf-einherjar','Dwarf Einherjar',
  'A dwarf 20th-level fighter raised to divine-rank-0 service as an Einherjar in Asgard.',
  'Printed example: Small Outsider, quasi-deity rank 0, Fighter 20; 20d10+80 (190 hp); Init +5; speed 50 ft.; AC 19 (touch 11, flat-footed 18); dwarven urgrosh +19/+14/+9/+4 melee; printed table also gives an alternate urgrosh attack line at +15; damage includes 1d8+4/19-20/x3 for the primary end and 1d6/19-20/x3 for the other end; dwarf traits and quasi-deity traits; Fort +16, Ref +9, Will +8; Str 15, Dex 13, Con 18, Int 10, Wis 10, Cha 10; Asgard; troop (20-40); CR 20; NG. Skills: Climb +11, Craft (metalworking) +13, Craft (stoneworking) +14, Jump +11, Listen +2, Spot +2. Printed feats include Alertness, Blind-Fight, Cleave, Dodge, Endurance, Exotic Weapon Proficiency (dwarven urgrosh), Great Cleave, Improved Bull Rush, Improved Critical (dwarven urgrosh), Improved Initiative, Iron Will, Lightning Reflexes, Power Attack, Quick Draw, Run, Sunder, Toughness, Weapon Focus (dwarven urgrosh), Weapon Specialization (dwarven urgrosh). Official 3.5 revision replaces the old quasi-deity package with immunity to transmutation, energy drain, ability drain, ability damage, and mind-affecting effects; DR 10/epic; fire resistance 5; SR 32; immortality. Fighter class features otherwise do not change. The printed attack bonus is lower than straightforward Fighter 20 BAB + ability/size arithmetic; preserve the source attack line in text rather than rewriting base attack bonus.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  20,1,20,1,10,80,
  'small',5,5,0,8,0,0,
  20,18,16,9,8,15,13,18,10,10,10,
  'Asgard','Troop (20-40)',NULL,'NG','Neutral good',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='dwarf-einherjar' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT 'dd-monster-dwarf-einherjar',s.id FROM dnd35_creature_subtypes s
WHERE s.slug='good' AND s.owner_user_id IS NULL;
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-dwarf-einherjar','land',50,NULL,'Einherjar template increases the base creature''s land speed by 30 feet; printed sample speed is 50 feet.');

-- Elf Fighter 20 Einherjar.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-elf-einherjar','dd-3.0','199-200','elf-einherjar','Elf Einherjar',
  'An elf 20th-level fighter raised to divine-rank-0 service as an Einherjar in Asgard.',
  'Printed example: Medium Outsider, quasi-deity rank 0, Fighter 20; 20d10+20 (130 hp); Init +9; speed 60 ft.; AC 20 (touch 15, flat-footed 17); longsword +26/+21/+16/+11 melee or composite longbow +26/+21/+16/+11 ranged; longsword 1d8+3/18-20, composite longbow 1d8+2/19-20/x3; elf traits and quasi-deity traits; Fort +13, Ref +13, Will +8; Str 13, Dex 20, Con 12, Int 10, Wis 10, Cha 12; Asgard; troop (20-40); CR 20; CG. Skills: Climb +14, Handle Animal +6, Jump +13, Listen +2, Ride (horse) +12, Search +2, Spot +2, Swim +13. Printed feats include Cleave, Dodge, Great Cleave, Improved Critical (composite longbow), Improved Critical (longsword), Improved Initiative, Iron Will, Lightning Reflexes, Mobility, Power Attack, Quick Draw, Spring Attack, Sunder, Weapon Finesse (longsword), Weapon Focus (composite longbow), Weapon Focus (longsword), Weapon Specialization (composite longbow), Weapon Specialization (longsword), plus elf weapon proficiencies. Official 3.5 revision replaces the old quasi-deity package with DR 10/epic, fire resistance 5, SR 32, immortality, and the revised immunities. Source anomaly: AC 20 and touch 15 are consistent with Dex +5 plus a +5 non-touch bonus, but flat-footed 17 is not the ordinary result of removing the full Dex bonus; preserve the printed flat-footed value in rules text.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  20,1,20,1,10,20,
  'medium',5,5,0,5,0,0,
  20,21,13,13,8,13,20,12,10,10,12,
  'Asgard','Troop (20-40)',NULL,'CG','Chaotic good',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='elf-einherjar' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT 'dd-monster-elf-einherjar',s.id FROM dnd35_creature_subtypes s
WHERE s.slug='good' AND s.owner_user_id IS NULL;
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-elf-einherjar','land',60,NULL,'Einherjar template increases the base creature''s land speed by 30 feet; printed sample speed is 60 feet.');

-- Human Barbarian 20 Einherjar.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-human-einherjar','dd-3.0','199-200','human-einherjar','Human Einherjar',
  'A human 20th-level barbarian raised to divine-rank-0 service as an Einherjar in Asgard.',
  'Printed example: Medium Outsider, quasi-deity rank 0, Barbarian 20; 20d12+40 (170 hp); Init +5; speed 70 ft.; AC 17 (touch 11, flat-footed 17); battleaxe +25/+20/+15/+10 melee; damage 1d8+4/x3; quasi-deity traits, fast movement, greater rage 6/day, uncanny dodge (cannot be flanked, +4 against traps); Fort +14, Ref +9, Will +6; Str 18, Dex 13, Con 14, Int 10, Wis 10, Cha 12; Asgard; troop (20-40); CR 20; NG. Skills: Climb +14, Handle Animal +13, Intimidate +18, Intuit Direction +12, Jump +14, Listen +14, Ride (horse) +15, Spot +2, Swim +16, Wilderness Lore +12. Printed feats include Alertness, Cleave, Improved Initiative, Lightning Reflexes, Power Attack, Quick Draw, Sunder, Weapon Focus (battleaxe). Printed greater rage: AC 15; hp 230; attacks +28/+23/+18/+13 melee (1d8+7/x3); Fort +17, Will +9; Str 24, Con 20; Climb +17, Jump +17, Swim +19; lasts 8 rounds; not winded afterward. Official 3.5 revision replaces the quasi-deity package with DR 10/epic, fire resistance 5, SR 32, immortality, and revised immunities; Barbarian 20 also gains trap sense +6, class DR 5/-, indomitable will, and improved mighty rage compared with the old greater-rage values. The live base row remains the printed non-raging chassis while these 3.5 differences are retained in this rules text.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  20,1,20,1,12,40,
  'medium',5,5,0,6,0,0,
  20,24,14,9,6,18,13,14,10,10,12,
  'Asgard','Troop (20-40)',NULL,'NG','Neutral good',NULL,NULL,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='human-einherjar' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT 'dd-monster-human-einherjar',s.id FROM dnd35_creature_subtypes s
WHERE s.slug='good' AND s.owner_user_id IS NULL;
INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-human-einherjar','land',70,NULL,'Printed barbarian fast movement plus Einherjar template speed; sample speed is 70 feet.');

WITH desired(slug,name,description,mechanics) AS (VALUES
('dd-einherjar-sample-revision-notes','Einherjar Sample 3.5 Revision Notes',
 'Shared revision guidance for the three printed CR 20 Einherjar samples.',
 '{"samples":["dwarf-einherjar","elf-einherjar","human-einherjar"],"challengeRating":20,"revision3_5":{"quasiDeityTraits":{"immunities":["transmutation","energy drain","ability drain","ability damage","mind-affecting effects"],"damageReduction":"10/epic","fireResistance":5,"spellResistance":32,"immortal":true},"type":"outsider with good subtype; extraplanar subtype when visiting the Material Plane","speed":"base land speed +30 ft."},"sourceFidelity":"The concrete monster rows preserve the printed sample chassis. Revised runtime should layer the official quasi-deity replacement package and current class rules rather than retaining the obsolete 3.0 DR 35/+4 package."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0','199-200; official 3.5 update p. 11',d.slug,d.name,d.description,d.description,
       0,NULL,1,'monster','revision-note',0,1,'dd-template-einherjar',NULL,
       '["deities-and-demigods","asgardian","einherjar","revision-3.5","sample-stat-blocks"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);