-- Dungeon Master's Guide racial traits for Gold Dwarf and Half-Human Elf.
-- The DMG defines each as inheriting a PHB race and then specifies substitutions;
-- the inherited mechanics are materialized here so these rows are self-contained.

DELETE FROM dnd35_race_traits
WHERE id LIKE 'dmg-rt-gold-dwarf-%'
   OR id LIKE 'dmg-rt-half-human-elf-%';

WITH traits(id,race_slug,name,rules_text,position) AS (VALUES
  -- Gold Dwarf: dwarf traits, with the DMG substitutions.
  ('dmg-rt-gold-dwarf-speed','gold-dwarf','Steady Speed',
   'Base land speed is 20 feet and is not reduced by medium or heavy armor or by a medium or heavy load.',10),
  ('dmg-rt-gold-dwarf-darkvision','gold-dwarf','Darkvision',
   'Darkvision 60 ft.',20),
  ('dmg-rt-gold-dwarf-stonecunning','gold-dwarf','Stonecunning',
   '+2 racial bonus on Search checks involving unusual stonework; can make passive checks within 10 feet, find stonework traps as a rogue can, and intuit depth underground.',30),
  ('dmg-rt-gold-dwarf-weapon-familiarity','gold-dwarf','Weapon Familiarity',
   'Treat dwarven waraxes and dwarven urgroshes as martial weapons rather than exotic weapons.',40),
  ('dmg-rt-gold-dwarf-stability','gold-dwarf','Stability',
   '+4 bonus on ability checks to resist bull rush or trip while standing firmly on the ground.',50),
  ('dmg-rt-gold-dwarf-poison','gold-dwarf','Poison Resistance',
   '+2 racial bonus on saving throws against poison.',60),
  ('dmg-rt-gold-dwarf-magic','gold-dwarf','Magic Resistance',
   '+2 racial bonus on saving throws against spells and spell-like effects.',70),
  ('dmg-rt-gold-dwarf-aberrations','gold-dwarf','Aberration Combat Training',
   '+1 racial bonus on attack rolls against aberrations. This replaces the standard dwarf attack bonus against orcs and goblinoids.',80),
  ('dmg-rt-gold-dwarf-giants','gold-dwarf','Giant Dodging',
   '+4 dodge bonus to Armor Class against creatures of the giant type.',90),
  ('dmg-rt-gold-dwarf-appraise','gold-dwarf','Stone and Metal Appraisal',
   '+2 racial bonus on Appraise checks related to stone or metal items.',100),
  ('dmg-rt-gold-dwarf-craft','gold-dwarf','Stone and Metal Craft',
   '+2 racial bonus on Craft checks related to stone or metal.',110),

  -- Half-Human Elf: half-elf traits, minus the social bonus, plus elven arms.
  ('dmg-rt-half-human-elf-sleep','half-human-elf','Sleep Immunity',
   'Immune to magical sleep spells and effects.',10),
  ('dmg-rt-half-human-elf-enchantment','half-human-elf','Enchantment Resistance',
   '+2 racial bonus on saving throws against enchantment spells or effects.',20),
  ('dmg-rt-half-human-elf-lowlight','half-human-elf','Low-Light Vision',
   'Low-light vision.',30),
  ('dmg-rt-half-human-elf-senses','half-human-elf','Keen Senses',
   '+1 racial bonus on Listen, Search, and Spot checks.',40),
  ('dmg-rt-half-human-elf-blood','half-human-elf','Elven Blood',
   'For effects related to race, a half-human elf is considered an elf.',50),
  ('dmg-rt-half-human-elf-weapons','half-human-elf','Elven Weapon Proficiency',
   'Receives Martial Weapon Proficiency with the longsword, rapier, shortbow, and longbow.',60),
  ('dmg-rt-half-human-elf-social','half-human-elf','Elven Upbringing',
   'Does not receive the normal half-elf +2 racial bonus on Diplomacy and Gather Information checks.',70)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,parameters,effects)
SELECT
  t.id,r.id,NULL,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r
  ON r.slug=t.race_slug AND r.owner_user_id IS NULL
WHERE r.id='dmg-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=NULL,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  parameters=NULL,
  effects=NULL;
