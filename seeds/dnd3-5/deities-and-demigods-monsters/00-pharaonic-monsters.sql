-- Deities and Demigods: Pharaonic monsters and Greater Mummy template.
-- Source: Deities and Demigods (2002), Chapter 5, pp. 158-162, plus the official v3.5 Deities and Demigods update.
-- The original 3.0 template is retained as source history; revision3_5 contains the official revised mechanics.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES ('dd-3.0','deities-and-demigods-3-0','Deities and Demigods','DD','Wizards of the Coast','dnd','3.0',
        'Deities and Demigods (2002): divine ranks, pantheons, salient divine abilities, divine minions, domains, spells, monsters, prestige classes, and ascension.',NULL,1,0,NULL);

-- Minion of Set: printed 3.0 chassis with official 3.5 skills/feats/LA preserved in the text.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-minion-of-set','dd-3.0','158-159','minion-of-set','Minion of Set',
  'A cruel shapeshifting outsider servant of Set that hides behind a human appearance and can assume one specific powerful animal form.',
  'Printed 3.0 statistics: Medium Outsider (Chaotic, Evil); 6d8+6 (33 hp); Init +4; speed 30 ft.; AC 22 (+12 natural); +1 khopesh +9/+4 melee or mighty composite longbow (+2 Str) +8/+3 ranged; damage 1d8+3 or 1d8+2; alternate form; fear immunity; SR 12; Fort +6, Ref +5, Will +7; Str 14, Dex 11, Con 12, Int 13, Wis 14, Cha 13. It has one alternate form: Large viper, dire bear, giant crocodile, dire hyena (represented by dire wolf), or Large monstrous scorpion. Changing form is a move-equivalent action; in animal form it gains that form''s physical ability scores, speed, size/reach, and extraordinary abilities while retaining its +12 natural armor. Official 3.5 update: space/reach 5 ft./5 ft.; skills Balance +2, Bluff +10, Climb +11, Diplomacy +3, Hide +11, Intimidate +12, Jump +13, Knowledge (religion) +10, Move Silently +11, Spot +11, Tumble +11; feats Exotic Weapon Proficiency (khopesh), Improved Initiative, Stealthy; LA +5.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='outsider' AND owner_user_id IS NULL LIMIT 1),
  6,1,6,1,8,6,
  'medium',5,5,12,0,0,0,
  6,NULL,6,5,7,14,11,12,13,14,13,
  'Any land or underground','Solitary or band (2-20)','Gear','CE','Always chaotic evil','By character class',5,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='minion-of-set' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_subtypes (monster_id,subtype_id)
SELECT 'dd-monster-minion-of-set',s.id
FROM dnd35_creature_subtypes s
WHERE s.slug IN ('chaotic','evil') AND s.owner_user_id IS NULL;

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-minion-of-set','land',30,NULL,'Printed humanoid-form land speed; alternate animal form replaces physical speed as described by Alternate Form.');

WITH desired(slug,name,page,summary,tags,mechanics) AS (VALUES
('dd-template-greater-mummy','Greater Mummy Template','159-162; official 3.5 update p. 11',
 'An acquired undead template for humanoids approved by a patron deity, representing intelligent Pharaonic clerics mummified to continue their duties after death.',
 '["deities-and-demigods","pharaonic","monster-template","greater-mummy","undead","revision-3.5"]',
 '{"sourceEdition":"3.0","appliesTo":"any humanoid creature with patron deity approval","typeChange":"undead","retainsClassAbilities":true,"hitDice":{"die":"d12"},"speed":"same as base character","naturalArmor":{"minimum":8,"useBetterExisting":true},"attacks":{"retainsBaseAttacks":true,"gainSlamIfAbsent":true},"slamDamageBySize":{"fine":"1","diminutive":"1d2","tiny":"1d3","small":"1d4","medium":"1d6","large":"1d8","huge":"2d6","gargantuan":"2d8","colossal":"4d6"},"specialAttacks":{"retainsBase":true,"spellsRetained":true,"despair":{"trigger":"sight","save":"Will","failure":"paralyzed with fear for 2d4 rounds","immunityAfterAttempt":"1 day"},"originalMummyRot":{"attack":"slam","fortitudeDc":24,"incubation":"12 hours","damage":"1d6 temporary Strength + 1d6 temporary Constitution","persistence":"continues until Constitution 0/death or remove disease/similar magic","deathEffect":"body becomes dust unless remove disease and raise dead are used within 6 rounds","sourceNamingNote":"The 3.0 prose accidentally calls this mummy scourge in one sentence."},"chooseOneAdditional":[{"controlUndead":"evil cleric only; effective rebuke/command level is four higher than actual cleric level"},{"improvedGrab":"slam can initiate grab"}]},"specialQualities":{"turnResistance":4,"originalResistantToBlows":"Physical attacks deal half damage before damage reduction.","originalDamageReduction":"10/+1","spellResistance":"10 + cleric level","immunities":["cold","polymorph","mind-affecting attacks"],"fireVulnerability":"double fire damage under 3.0 vulnerability rules","chooseOneAdditional":[{"alterForm":"3/day polymorph self as 8th-level sorcerer"},{"passage":"3/day phase door; sorcerer caster level equals mummy cleric level"},{"symbiosis":"body houses a symbiont such as green slime, yellow mold, brown mold, gray ooze, monstrous spider, or monstrous scorpion; mummy is immune to the symbiont special attacks"}]},"abilityChanges":{"str":4,"int":2,"wis":2,"cha":2,"con":"nonability"},"racialSkillBonuses":{"hide":8,"listen":8,"moveSilently":8,"search":8,"senseMotive":8,"spot":8},"feats":"same as base character","environment":"any land and underground","organization":"solitary or cult (1 greater mummy plus 2-8 ordinary mummies)","challengeRatingAdjustment":2,"treasure":"standard coins; double goods; double items","alignment":"any","advancement":"by character class","revision3_5":{"levelAdjustment":"same as base creature +4","damageReduction":"10/-","removeOriginalResistantToBlows":true,"mummyScourge":{"type":"supernatural disease","attack":"slam","fortitudeDc":24,"incubation":"5 rounds","damage":"1d6 temporary Strength + 1d6 temporary Constitution + 1d6 temporary Charisma","note":"Official update calls this a more virulent form of ordinary mummy rot."},"fireVulnerability":"Use the revised Monster Manual glossary definition.","sampleCorrection":"The official update explicitly states that the sample Greater Mummy printed in Deities and Demigods was incorrect and replaces it with the corrected 11th-level cleric of Set stat block seeded separately."}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0',d.page,d.slug,d.name,d.summary,
       'Apply the Greater Mummy acquired template using the structured mechanics payload. Preserve the original 3.0 rules for source fidelity, then apply revision3_5 for revised-game use.',
       0,NULL,1,'monster-template','subsystem',0,1,'dd-pharaonic-pantheon',NULL,d.tags,d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);

-- Official corrected v3.5 sample: 11th-level human cleric of Set with Greater Mummy template.
INSERT INTO dnd35_monsters
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   creature_type_id,challenge_rating_numerator,challenge_rating_denominator,
   hit_dice_numerator,hit_dice_denominator,hit_die,hit_point_bonus,
   size,space_feet,reach_feet,natural_armor,armor_bonus,shield_bonus,deflection_bonus,
   base_attack_bonus,grapple_modifier,fort,ref,will,str,dex,con,int,wis,cha,
   environment,organization,treasure,alignment,alignment_text,advancement,level_adjustment,defenses)
SELECT
  'dd-monster-greater-mummy-sample','dd-3.0','159-162; official 3.5 update p. 11','greater-mummy-sample','Greater Mummy (Corrected Sample)',
  'The official v3.5 replacement for the incorrect Greater Mummy sample in Deities and Demigods; the base creature is an 11th-level human cleric of Set.',
  'Official corrected sample: Medium Undead; 11d12 (71 hp); Init +0; speed 30 ft.; AC 21 (+8 natural, +2 bracers of armor, +1 ring of protection), printed update also says touch 21 and flat-footed 21; slam +7 melee or masterwork shortspear +8 melee, light crossbow +5 ranged; slam 1d6+2, shortspear 1d8+2, crossbow 1d8; despair, mummy rot/mummy scourge, control undead, spells; undead traits, +4 turn resistance, DR 10/-, SR 21, immunities, fire vulnerability, passage; Fort +7, Ref +3, Will +12; Str 14, Dex 11, Con -, Int 14, Wis 20, Cha 17; CR 13. Despair Will DC 18. Spell save DC 15 + spell level. Official update elsewhere in the same revision replaces the template disease with Mummy Scourge (Fort DC 24, incubation 5 rounds, 1d6 temporary Str/Con/Cha). Carried gear: divine scroll of obscuring mist and inflict light wounds, prayer beads (karma), ring of protection +1, bracers of armor +2. Source anomaly: touch AC 21 is retained as printed even though the listed natural/armor bonuses normally would not apply to touch AC.',
  0,NULL,1,
  (SELECT id FROM dnd35_creature_types WHERE slug='undead' AND owner_user_id IS NULL LIMIT 1),
  13,1,11,1,12,0,
  'medium',5,5,8,2,0,1,
  5,NULL,7,3,12,14,11,NULL,14,20,17,
  'Warm deserts','Solitary','Standard coins; double goods; double items','LE','Lawful evil','By character class',4,'[]'
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_monsters m WHERE m.slug='greater-mummy-sample' AND m.owner_user_id IS NULL
);

INSERT OR IGNORE INTO dnd35_monster_movements (monster_id,mode,feet,maneuverability,rules_text)
VALUES ('dd-monster-greater-mummy-sample','land',30,NULL,'Official corrected sample land speed.');

WITH desired(slug,name,description,mechanics) AS (VALUES
('dd-greater-mummy-corrected-sample-notes','Greater Mummy Corrected Sample Revision Notes',
 'Documents the official v3.5 replacement sample and source inconsistencies that must not be normalized invisibly.',
 '{"monsterSlug":"greater-mummy-sample","baseCreature":"11th-level human cleric of Set","officialRevisionReplacement":true,"printed3_5Sample":{"hitDice":"11d12","hitPoints":71,"initiative":0,"speedFeet":30,"armorClass":21,"printedTouchAc":21,"printedFlatFootedAc":21,"attacks":["slam +7 melee","masterwork shortspear +8 melee","light crossbow +5 ranged"],"damage":["slam 1d6+2","masterwork shortspear 1d8+2","light crossbow 1d8"],"damageReduction":"10/-","spellResistance":21,"turnResistance":4,"despairDc":18,"spellSaveDc":"15 + spell level","challengeRating":13},"sourceNotes":["The revision explicitly says the original Deities and Demigods sample was incorrect.","The corrected sample special-attack line still says mummy rot, while the revised template entry names the replacement disease Mummy Scourge; both source facts are retained.","The corrected sample prints touch AC 21 and flat-footed AC 21 despite the component bonuses shown; no silent recalculation is stored as the source value."],"effectiveTemplateDisease":{"name":"Mummy Scourge","fortitudeDc":24,"incubation":"5 rounds","damage":"1d6 temporary Strength + 1d6 temporary Constitution + 1d6 temporary Charisma"}}')
)
INSERT INTO dnd35_rules
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   category,kind,is_variant,default_enabled,parent_slug,supersedes_slug,tags,mechanics)
SELECT 'dd-rule-'||d.slug,'dd-3.0','official 3.5 update p. 11',d.slug,d.name,d.description,d.description,
       0,NULL,1,'monster','revision-note',0,1,'dd-template-greater-mummy',NULL,
       '["deities-and-demigods","pharaonic","greater-mummy","revision-3.5","corrected-sample"]',d.mechanics
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_rules r WHERE r.source_id='dd-3.0' AND r.slug=d.slug AND r.owner_user_id IS NULL
);
