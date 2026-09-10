-- Monster Manual v3.5 racial traits and named special abilities for the first retained-RHD batch.
-- Mechanical text is concise paraphrase; source pages are carried on race definitions.

WITH abilities(id,slug,name,description,rules_text,category,action_type) AS (VALUES
  ('mm1-sa-gargoyle-freeze','gargoyle-freeze','Freeze','A gargoyle can remain motionless and pass for stone.','When motionless, a gargoyle resembles a statue; noticing that it is alive requires the listed Spot check from the source entry.','extraordinary','none'),
  ('mm1-sa-janni-change-size','janni-change-size','Change Size','Twice-daily magical size alteration.','Twice per day, affect a creature as enlarge person or reduce person; the ability can target the janni itself. The source entry uses a Charisma-based Fortitude save.','spell_like','standard'),
  ('mm1-sa-janni-spell-like','janni-spell-like-abilities','Janni Spell-Like Abilities','Innate genie magic.','Three times per day: invisibility (self only) and speak with animals. Once per day: create food and water and ethereal jaunt for up to 1 hour. Caster levels follow the source entry.','spell_like','standard'),
  ('mm1-sa-genie-plane-shift','genie-plane-shift','Plane Shift','Genie planar travel for itself and companions.','Enter an elemental plane, the Astral Plane, or the Material Plane, transporting the genie and up to eight linked creatures; otherwise functions like plane shift at the source entry caster level.','spell_like','standard'),
  ('mm1-sa-janni-elemental-endurance','janni-elemental-endurance','Elemental Endurance','Jann can survive for a limited time on any elemental plane.','A janni can remain on the Elemental Plane of Air, Earth, Fire, or Water for up to 48 hours; remaining longer causes damage each additional hour until it returns to the Material Plane or dies.','extraordinary','none'),
  ('mm1-sa-janni-telepathy','janni-telepathy','Telepathy 100 ft.','Mental communication at range.','Telepathy out to 100 feet.','supernatural','none')
)
INSERT INTO dnd35_special_abilities
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,category,action_type,effects,parameters)
SELECT id,'mm1-3.5',NULL,slug,name,description,rules_text,0,NULL,1,category,action_type,NULL,NULL
FROM abilities
ON CONFLICT(id) DO UPDATE SET
  source_id=excluded.source_id,
  slug=excluded.slug,
  name=excluded.name,
  description=excluded.description,
  rules_text=excluded.rules_text,
  is_homebrew=0,
  owner_user_id=NULL,
  is_enabled=1,
  category=excluded.category,
  action_type=excluded.action_type,
  effects=NULL,
  parameters=NULL;

WITH traits(id,race_slug,special_ability_id,name,rules_text,position) AS (VALUES
  ('mm1-rt-centaur-large','centaur',NULL,'Large Build','Large size; 10-ft. space and 5-ft. reach, with normal Large-size combat, Hide, grapple, lifting, and carrying adjustments.',10),
  ('mm1-rt-centaur-rhd','centaur',NULL,'Racial Hit Dice','4d8 monstrous humanoid racial Hit Dice; racial BAB +4 and base saves Fort +1, Ref +4, Will +4.',20),
  ('mm1-rt-centaur-darkvision','centaur',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-centaur-natural-armor','centaur',NULL,'Natural Armor','+3 natural armor bonus.',40),
  ('mm1-rt-centaur-racial-skills','centaur',NULL,'Racial Skills','Racial-HD class skills are Listen, Move Silently, Spot, and Survival.',50),

  ('mm1-rt-gargoyle-rhd','gargoyle',NULL,'Racial Hit Dice','4d8 monstrous humanoid racial Hit Dice; racial BAB +4 and base saves Fort +1, Ref +4, Will +4.',10),
  ('mm1-rt-gargoyle-flight','gargoyle',NULL,'Flight','Fly speed 60 ft. with average maneuverability.',20),
  ('mm1-rt-gargoyle-darkvision','gargoyle',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-gargoyle-natural-armor','gargoyle',NULL,'Natural Armor','+4 natural armor bonus.',40),
  ('mm1-rt-gargoyle-dr','gargoyle',NULL,'Damage Reduction','Damage reduction 10/magic.',50),
  ('mm1-rt-gargoyle-freeze','gargoyle','mm1-sa-gargoyle-freeze','Freeze','Can remain motionless and appear to be a statue.',60),
  ('mm1-rt-gargoyle-skills','gargoyle',NULL,'Stone Ambusher','+2 racial bonus on Hide, Listen, and Spot; the Hide bonus increases by an additional +8 against a stone background.',70),
  ('mm1-rt-gargoyle-magic-attacks','gargoyle',NULL,'Magic Natural Weapons','Natural weapons count as magic for overcoming damage reduction.',80),

  ('mm1-rt-janni-rhd','janni',NULL,'Racial Hit Dice','6d8 outsider racial Hit Dice; racial BAB +6 and base saves Fort +5, Ref +5, Will +5.',10),
  ('mm1-rt-janni-flight','janni',NULL,'Flight','Fly speed 20 ft. with perfect maneuverability.',20),
  ('mm1-rt-janni-darkvision','janni',NULL,'Darkvision','Darkvision 60 ft.',30),
  ('mm1-rt-janni-natural-armor','janni',NULL,'Natural Armor','+1 natural armor bonus.',40),
  ('mm1-rt-janni-change-size','janni','mm1-sa-janni-change-size','Change Size','Magically enlarge or reduce a creature twice per day.',50),
  ('mm1-rt-janni-spell-like','janni','mm1-sa-janni-spell-like','Spell-Like Abilities','Innate invisibility, animal speech, food/water creation, and ethereal travel.',60),
  ('mm1-rt-janni-plane-shift','janni','mm1-sa-genie-plane-shift','Plane Shift','Genie planar travel.',70),
  ('mm1-rt-janni-endurance','janni','mm1-sa-janni-elemental-endurance','Elemental Endurance','Can remain on an elemental plane safely for up to 48 hours.',80),
  ('mm1-rt-janni-fire-resistance','janni',NULL,'Fire Resistance','Resistance to fire 10.',90),
  ('mm1-rt-janni-telepathy','janni','mm1-sa-janni-telepathy','Telepathy','Telepathy 100 ft.',100),
  ('mm1-rt-janni-bonus-feat','janni',NULL,'Bonus Feat','Improved Initiative is a racial bonus feat in the source entry. It is recorded here as a trait until fixed-feat race grants are modeled separately from selectable bonus-feat slots.',110),
  ('mm1-rt-janni-racial-skills','janni',NULL,'Racial Skills','Racial-HD class skills are Appraise, Concentration, Craft, Escape Artist, Listen, Move Silently, Ride, Sense Motive, and Spot.',120)
)
INSERT INTO dnd35_race_traits
  (id,race_id,special_ability_id,name,rules_text,position,effects,parameters)
SELECT t.id,r.id,t.special_ability_id,t.name,t.rules_text,t.position,NULL,NULL
FROM traits t
JOIN dnd35_races r ON r.id='mm1-race-'||t.race_slug
ON CONFLICT(id) DO UPDATE SET
  race_id=excluded.race_id,
  special_ability_id=excluded.special_ability_id,
  name=excluded.name,
  rules_text=excluded.rules_text,
  position=excluded.position,
  effects=NULL,
  parameters=NULL;
