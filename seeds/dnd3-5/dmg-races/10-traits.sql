-- Creator-facing traits for the Dungeon Master's Guide example races.
WITH traits(id,race_slug,name,rules_text,position) AS (VALUES
  ('dmg-rt-gold-dwarf-dwarf-traits','gold-dwarf','Dwarf Heritage','Retains the standard dwarf racial traits except where the DMG example subrace explicitly replaces them.',10),
  ('dmg-rt-gold-dwarf-stability','gold-dwarf','Stability','Retains the dwarf +4 bonus on checks to resist bull rush or trip attempts while standing firmly on the ground.',20),
  ('dmg-rt-gold-dwarf-stonecunning','gold-dwarf','Stonecunning','Retains standard dwarf stonecunning.',30),
  ('dmg-rt-gold-dwarf-darkvision','gold-dwarf','Darkvision','Retains dwarf darkvision 60 ft.',40),
  ('dmg-rt-gold-dwarf-saves','gold-dwarf','Dwarven Resilience','Retains the dwarf +2 racial bonuses on saving throws against poison and against spells or spell-like effects.',50),
  ('dmg-rt-gold-dwarf-aberrations','gold-dwarf','Aberration Combat Training','+1 racial bonus on attack rolls against aberrations; this replaces the standard dwarf attack bonus against orcs and goblinoids.',60),
  ('dmg-rt-gold-dwarf-giants','gold-dwarf','Giant Fighting','Retains the dwarf +4 dodge bonus to Armor Class against creatures of the giant type.',70),
  ('dmg-rt-gold-dwarf-craft','gold-dwarf','Stone and Metal Expertise','Retains the dwarf +2 racial bonuses on Appraise and Craft checks related to stone or metal.',80),

  ('dmg-rt-half-human-elf-half-elf','half-human-elf','Half-Elf Heritage','Retains the Player''s Handbook half-elf racial traits except for the DMG modifications listed here.',10),
  ('dmg-rt-half-human-elf-social','half-human-elf','Elven Upbringing','Does not receive the standard half-elf racial bonuses on Diplomacy or Gather Information checks.',20),
  ('dmg-rt-half-human-elf-weapons','half-human-elf','Elven Weapon Training','Receives proficiency with longsword, rapier, shortbow, and longbow as the DMG example race specifies.',30),
  ('dmg-rt-half-human-elf-low-light','half-human-elf','Low-Light Vision','Retains half-elf low-light vision.',40),
  ('dmg-rt-half-human-elf-elven-blood','half-human-elf','Elven Blood','Counts as both an elf and a human for effects related to race.',50),
  ('dmg-rt-half-human-elf-sleep','half-human-elf','Elven Sleep Immunity','Retains immunity to magic sleep effects.',60),
  ('dmg-rt-half-human-elf-enchantment','half-human-elf','Enchantment Resistance','Retains the half-elf +2 racial saving throw bonus against enchantment spells or effects.',70),
  ('dmg-rt-half-human-elf-senses','half-human-elf','Keen Senses','Retains the half-elf racial bonuses on Listen, Search, and Spot checks.',80)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,NULL,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='dmg-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id, special_ability_id=NULL, name=excluded.name,
  rules_text=excluded.rules_text, position=excluded.position, effects=NULL, parameters=NULL;
