-- Deities and Demigods: printed Chapter 2 petitioner sample.
-- Source: Deities and Demigods (2002), p. 55.
-- The source sample contains two internal inconsistencies with the petitioner template:
-- it labels the creature Large Giant instead of Outsider, and gives Standard treasure instead of None.
-- Preserve the printed sample exactly in the concrete row and record those discrepancies rather than silently normalizing them.

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
  'dd-monster-ogre-petitioner','dd-3.0','55','ogre-petitioner','Ogre Petitioner',
  'The printed chaotic-evil-plane ogre petitioner example from the Chapter 2 petitioner rules.',
  'Printed sample: Large Giant; 2d8+8 (17 hp); Init -1; speed 30 ft.; AC 13 (-1 size, -1 Dex, +5 natural); slam +6 melee (1d4+5); Face/Reach 5 ft. by 5 ft./10 ft.; no special attacks; mental immunity, poison immunity, and electricity, fire, and acid resistance 20; Fort +5, Ref +2, Will +3; Str 21, Dex 8, Con 15, Int 6, Wis 10, Cha 7; no skills or feats; any land, aquatic, and underground; solitary, pair, gang (2-4), or band (5-8); CR 2; standard treasure; usually chaotic evil; no advancement. Source discrepancies: the general petitioner template says type changes to Outsider and treasure is None, but the printed sample says Giant and Standard treasure. The concrete sample row preserves the printed block while the petitioner template row remains authoritative for generating petitioners.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='giant' AND owner_user_id IS NULL LIMIT 1),
  2,1,2,1,8,8,
  'large',5,10,5,0,0,0,
  2,NULL,5,2,3,21,8,15,6,10,7,
  'Any land, aquatic, and underground','Solitary, pair, gang (2-4), or band (5-8)','Standard','CE','Usually chaotic evil','None',NULL,
  '[{"kind":"immunity","subject":"mental effects (printed petitioner mental immunity)"},{"kind":"immunity","subject":"poison"},{"kind":"resistance","damageType":"electricity","amount":20},{"kind":"resistance","damageType":"fire","amount":20},{"kind":"resistance","damageType":"acid","amount":20}]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.source_id='dd-3.0' AND m.slug='ogre-petitioner' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-ogre-petitioner','land',30,NULL,'Printed sample land speed.');

WITH desired(slug,name,description,mechanics) AS (VALUES
('dd-ogre-petitioner-source-discrepancies','Ogre Petitioner Source Discrepancies',
 'Records the differences between the general petitioner template and the printed ogre petitioner sample so neither source statement is silently discarded.',
 '{"sampleMonsterSlug":"ogre-petitioner","templateRuleSlug":"dd-template-petitioner","differences":{"creatureType":{"template":"Outsider","sample":"Giant"},"treasure":{"template":"None","sample":"Standard"},"face":{"sample3_0":"5 ft. by 5 ft.","3_5LargeDefault":"10 ft."}},"precedence":"Use the template when generating a petitioner. Preserve the printed sample block when reproducing the published example."}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0','55',d.slug,d.name,d.description,d.description,
       0,NULL,1,'divine-creature','source-note',0,1,'dd-petitioners',NULL,
       '["deities-and-demigods","petitioner","sample","source-fidelity","discrepancy"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
