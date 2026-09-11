-- Deities and Demigods: Olympian monsters omitted from the initial Chapter 4 pass.
-- Source: Deities and Demigods (2002), Chapter 4, pp. 132-134, plus official v3.5 update.
-- Printed 3.0 values are retained in rules_text; normalized fields use explicit official v3.5 update values where supplied.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

WITH desired(
  id,page,slug,name,description,rules_text,type_slug,cr_num,cr_den,hd_num,hd_den,hit_die,hp_bonus,
  size,space_ft,reach_ft,natural_armor,armor_bonus,shield_bonus,deflection_bonus,bab,grapple,
  fort,reflex,will_save,str_score,dex_score,con_score,int_score,wis_score,cha_score,
  environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment
) AS (VALUES
  ('dd-monster-cyclops-lesser','132-133','cyclops-lesser','Cyclops, Lesser',
   'A brutal one-eyed giant created or fathered by Poseidon and commonly found on islands in Olympian lands.',
   'Printed 3.0: Large Giant; 13d8+52 (110 hp); Init -1; speed 40 ft.; AC 18 (-1 size, -1 Dex, +10 natural); Huge longspear +16/+11 melee or rock +8/+2 ranged; damage 2d6+12 or rock 2d6+8; printed Face/Reach 5 ft. by 5 ft./10 ft. (10-20 ft. with longspear); rock throwing; rock catching; Fort +12, Ref +3, Will +3; Str 27, Dex 9, Con 19, Int 6, Wis 8, Cha 6; warm mountains; solitary or fist (2-5); CR 8; standard treasure; chaotic evil; advancement by character class. Rock Throwing grants +1 racial attack bonus with 40-50 lb. Small rocks, range increment 140 ft., maximum five increments. Rock Catching: once/round when ready and aware, Reflex DC 15/20/25 for Small/Medium/Large rock, increased by projectile magical attack bonus. Official 3.5 update: Giant; space/reach 10 ft./10 ft.; Climb +13, Jump +17, Spot +5; feats Awesome Blow, Cleave, Great Cleave, Improved Bull Rush, Power Attack; LA +2.',
   'giant',8,1,13,1,8,52,'large',10,10,10,0,0,0,9,21,12,3,3,27,9,19,6,8,6,
   'Warm mountains','Solitary or fist (2-5)','Standard','CE','Usually chaotic evil','By character class',2),

  ('dd-monster-cyclops-greater','132-133','cyclops-greater','Cyclops, Greater',
   'A larger, intelligent cyclops race created by Hera for Hephaestus; renowned smiths who usually fight only when commanded.',
   'Printed 3.0: Huge Giant; 16d8+96 (168 hp); Init +1; speed 40 ft.; AC 24 (-2 size, +1 Dex, +10 natural, +5 armor from +1 scale mail); Gargantuan longspear +21/+16/+11 melee or rock +11/+6/+1 ranged; damage 2d8+16 or rock 2d8+11; printed Face/Reach 5 ft. by 5 ft./10 ft. (10-20 ft. with longspear); rock throwing; rock catching; fire immunity; SR 21; Fort +16, Ref +6, Will +9; Str 33, Dex 13, Con 23, Int 16, Wis 18, Cha 14; warm mountains; solitary or fist (2-5); CR 11; standard coins, standard goods, double items; chaotic good; advancement by character class. Greater cyclopes throw 60-80 lb. Medium rocks with the same 140-ft. range increment/five-increment maximum and use the same rock-catching rules. Official 3.5 update: Giant; space/reach 10 ft./10 ft.; Climb +27, Craft (armorsmithing) +32, Craft (weaponsmithing) +32, Jump +27, Spot +23; feats Craft Magic Arms and Armor (bonus), Cleave, Combat Reflexes, Great Cleave, Improved Bull Rush, Improved Sunder, Power Attack; +10 racial bonus on Craft (armorsmithing) and Craft (weaponsmithing); LA +3.',
   'giant',11,1,16,1,8,96,'huge',10,10,10,5,0,0,12,31,16,6,9,33,13,23,16,18,14,
   'Warm mountains','Solitary or fist (2-5)','Standard coins; standard goods; double items','CG','Usually chaotic good','By character class',3),

  ('dd-monster-faun','133-134','faun','Faun',
   'A pastoral woodland fey related to satyrs, curious about human culture and naturally gifted with music.',
   'Printed 3.0: Medium-size Fey; 1d6 (4 hp); Init +5; speed 30 ft.; AC 13 (+1 Dex, +2 leather); shortspear +0 melee or shortbow +1 ranged; damage 1d6; Face/Reach 5 ft. by 5 ft./5 ft.; Fort +0, Ref +3, Will +1; Str 11, Dex 12, Con 10, Int 11, Wis 9, Cha 8; any forest; solitary, troupe (2-12), or band (15-60); CR 1/2; standard treasure; usually chaotic neutral; advancement by character class. Traits: low-light vision; magic flutes/pipes have effect save DC increased by +2; a faun with Use Magic Device can emulate satyr race at DC 25 to use satyr pipes; +2 saves against musical effects; +2 racial Hide, Move Silently, Wilderness Lore and +4 Perform with flutes/pipes. Favored class bard; clerics worship Dionysus or Pan. Official 3.5 update: Fey; space/reach 5 ft./5 ft.; Bluff +1, Diplomacy +1, Hide +6, Knowledge (nature) +2, Listen +2, Move Silently +6, Perform +2, Spot +2, Survival +4; Improved Initiative; LA +0.',
   'fey',1,2,1,1,6,0,'medium',5,5,0,2,0,0,0,0,0,3,1,11,12,10,11,9,8,
   'Any forest','Solitary, troupe (2-12), or band (15-60)','Standard','CN','Usually chaotic neutral','By character class',0)
)
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  d.id,'dd-3.0',d.page,d.slug,d.name,d.description,d.rules_text,0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug=d.type_slug AND owner_user_id IS NULL LIMIT 1),
  d.cr_num,d.cr_den,d.hd_num,d.hd_den,d.hit_die,d.hp_bonus,
  d.size,d.space_ft,d.reach_ft,d.natural_armor,d.armor_bonus,d.shield_bonus,d.deflection_bonus,
  d.bab,d.grapple,d.fort,d.reflex,d.will_save,d.str_score,d.dex_score,d.con_score,d.int_score,d.wis_score,d.cha_score,
  d.environment,d.organization,d.treasure,d.alignment,d.alignment_text,d.advancement,d.level_adjustment,'[]'
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug=d.slug AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES
  ('dd-monster-cyclops-lesser','land',40,NULL,'Printed and revised land speed.'),
  ('dd-monster-cyclops-greater','land',40,NULL,'Printed and revised land speed.'),
  ('dd-monster-faun','land',30,NULL,'Printed and revised land speed.');

WITH desired(slug,name,page,description,mechanics) AS (VALUES
 ('dd-cyclops-lesser-revision','Lesser Cyclops 3.5 Revision Notes','132-133; official 3.5 update',
  'Official revised-game deltas for the lesser cyclops.',
  '{"monsterSlug":"cyclops-lesser","sourceEdition":"3.0","revision3_5":{"spaceFeet":10,"reachFeet":10,"skills":{"Climb":13,"Jump":17,"Spot":5},"feats":["Awesome Blow","Cleave","Great Cleave","Improved Bull Rush","Power Attack"],"levelAdjustment":2},"printed3_0":{"face":"5 ft. by 5 ft.","reachFeet":10,"longspearReach":"10-20 ft."}}'),
 ('dd-cyclops-greater-revision','Greater Cyclops 3.5 Revision Notes','132-133; official 3.5 update',
  'Official revised-game deltas for the greater cyclops.',
  '{"monsterSlug":"cyclops-greater","sourceEdition":"3.0","revision3_5":{"spaceFeet":10,"reachFeet":10,"skills":{"Climb":27,"Craft (armorsmithing)":32,"Craft (weaponsmithing)":32,"Jump":27,"Spot":23},"racialSkillBonuses":{"Craft (armorsmithing)":10,"Craft (weaponsmithing)":10},"feats":["Craft Magic Arms and Armor (bonus)","Cleave","Combat Reflexes","Great Cleave","Improved Bull Rush","Improved Sunder","Power Attack"],"levelAdjustment":3},"printed3_0":{"face":"5 ft. by 5 ft.","reachFeet":10,"longspearReach":"10-20 ft."},"sourceNote":"The official update explicitly gives 10-ft. space/10-ft. reach even though the creature remains Huge; preserve that explicit revision value."}'),
 ('dd-faun-revision','Faun 3.5 Revision Notes','133-134; official 3.5 update',
  'Official revised-game skills, feat, and level adjustment for the faun.',
  '{"monsterSlug":"faun","sourceEdition":"3.0","revision3_5":{"spaceFeet":5,"reachFeet":5,"skills":{"Bluff":1,"Diplomacy":1,"Hide":6,"Knowledge (nature)":2,"Listen":2,"Move Silently":6,"Perform":2,"Spot":2,"Survival":4},"feat":"Improved Initiative","levelAdjustment":0,"wildernessLore":"Migrates to Survival under revised skills."},"traits":{"lowLightVision":true,"musicalAbility":{"magicInstrumentSaveDcBonus":2,"satyrPipesUseMagicDeviceDc":25},"musicalResistanceSaveBonus":2,"racialBonuses":{"Hide":2,"Move Silently":2,"Survival":2,"Perform flutes or pipes":4}},"favoredClass":"bard","clericPatrons":["dionysus","pan"]}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.description,d.description,0,NULL,1,
       'monster','revision-note',0,1,'dd-olympian-pantheon',NULL,
       '["deities-and-demigods","olympian","monster","revision-3.5"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
