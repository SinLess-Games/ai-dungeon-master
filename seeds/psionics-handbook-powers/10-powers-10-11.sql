-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-hammer','Hammer','psychometabolism',NULL,'1 action','standard','Touch','Creature or object touched',NULL,NULL,'Until discharged',NULL,'None','yes','Yes (object)',1,'This power charges your mere touch with the force of a sledgehammer. A successful melee touch attack deals 1d8 points of bludgeoning damage.','79'),
('ph3e-hear-light','Hear Light','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',1,'As feel light, except you experience light translated through auditory sensation (by hearing). You can “see” with your ears because any light waves that reach you are converted to sound, and you “hear” the image.','79'),
('ph3e-hustle','Hustle','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,'1 extra partial action','See text',NULL,'None','no','No',1,'You can take an extra partial action, but you must wait until your next round’s worth of actions to do so. In effect, you give up a standard action on the round you manifest this power, but gain an extra partial action on the following round.','79'),
('ph3e-hypercognition','Hypercognition','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',15,'Make extraordinarily rapid logical deductions from slight clues, patterns, and memories, gaining a major bonus on an Intelligence check to derive information.','79'),
('ph3e-identify','Identify','clairsentience',NULL,'8 hours','other','Touch','Up to 1 touched object per level',NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'This power determines the single most basic function of a psionic item, including how to activate that function (if appropriate), and how many charges are left (if any). If a psionic item has multiple different functions that are equally basic, identify determines the lowest-level function.','79'),
('ph3e-immovability','Immovability','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',7,'You are almost impossible to move. Your weight does not vary; instead, you mentally attach yourself to the underlying fabric of the plane.','80'),
('ph3e-improved-anchored-navigation','Improved Anchored Navigation','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 day/level',NULL,'None','no','No',13,'As anchored navigation, except the effect of the power extends across all planar boundaries, and it is useful for all psychoportation powers (and in the minimum time for the method of travel utilized).','80'),
('ph3e-improved-biofeedback','Improved Biofeedback','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',5,'As biofeedback, except you take a portion of each damaging attack as subdual damage equal to twice your Strength modifier, and the duration is extended.','80'),
('ph3e-improved-clairtangency','Improved Clairtangency','psychokinesis',NULL,'1 action','standard','See text',NULL,'See text',NULL,'Up to 1 minute/level (see text) (D)',NULL,'None','no','No',15,'As clairtangency, except you can emulate telekinesis in conjunction with a clairaudience/clairvoyance effect (you don’t need to manifest telekinesis to use this power). Improved clairtangency‘s duration is up to 1 minute/level when the telekinesis effect is used as a sustained force, but it expires immediately after a violent thrust.','80'),
('ph3e-improved-etherealness','Improved Etherealness','psychoportation',NULL,'1 action','standard','Touch (see text)','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','yes','Yes',15,'As etherealness, except the duration is an order of magnitude greater.','80'),
('ph3e-improved-fabricate','Improved Fabricate','metacreativity',NULL,'See text','other','Close (25 ft. + 5 ft./2 levels)','Up to 10 cubic yd./level',NULL,NULL,'Instantaneous',NULL,'None','no','No',11,'As fabricate, except ten times as much material is affected by the power.','80'),
('ph3e-improved-fly','Improved Fly','psychoportation',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'10 minutes/level',NULL,'None','yes','Yes (harmless)',11,'As fly, except the subject can fly at a speed of 180 feet (150 feet if the creature wears medium or heavy armor).','80'),
('ph3e-improved-telekinesis','Improved Telekinesis','psychokinesis',NULL,'1 action','standard','Long (400 ft. + 40 ft./level) Target or Targets: See text',NULL,NULL,NULL,'Concentration, up to 10 minutes/level, or instantaneous (see text)','will','Will negates (object) (see text)','yes','Yes (object) (see text)',13,'As telekinesis, except stronger and longer lasting (if a sustained force). When generating a sustained force, you move a creature or object weighing up to 100 pounds per manifester level up to 50 feet per round.','80'),
('ph3e-improved-vigor','Improved Vigor','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',11,'As vigor, except you gain 13 temporary hit points.','80'),
('ph3e-incarnate','Incarnate','metacreativity',NULL,'2 rounds','other','See text Target, Effect, or Area: See text',NULL,NULL,NULL,'Permanent (see text)',NULL,'None','no','No',9,'You invest other powers with self-sustaining energy so that they become permanent. You must be at least the minimum level required to manifest the power.','80')
)
INSERT INTO dnd35_powers
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   discipline_id,subdiscipline,manifesting_time,action_type,range_text,target_text,area_text,effect_text,
   duration_text,save,saving_throw_text,power_resistance,power_resistance_text,power_points,
   augmentation_text,augmentation)
SELECT
  'ph3e-power-'||substr(d.slug,7),
  'ph3e-3.0',d.source_page,d.slug,d.name,d.description,d.description,0,NULL,1,
  'ph3e-power-discipline-'||d.discipline,d.subdiscipline,d.manifesting_time,d.action_type,d.range_text,
  d.target_text,d.area_text,d.effect_text,d.duration_text,d.save,d.saving_throw_text,
  d.power_resistance,d.power_resistance_text,d.power_points,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_powers p
  WHERE p.slug=d.slug AND p.owner_user_id IS NULL
);

-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-inertial-barrier','Inertial Barrier','psychokinesis',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'10 minutes/level or until discharged','will','Will negates (harmless)','yes','Yes (harmless)',7,'You create a psychokinetic barrier around the subject that resists blows, cuts, stabs, and slashes, as well as providing some protection against falling. The subject gains damage reduction 10/+5.','81'),
('ph3e-inflict-pain','Inflict Pain','telepathy',NULL,'1 action','standard','Long (400 ft. + 40 ft./level)','One living creature',NULL,NULL,'Instantaneous','will','Will negates','yes','Yes',3,'You telepathically stab the mind of your foe, causing horrible agony. The telepathic strike deals 3d6 points of damage.','81'),
('ph3e-inkling','Inkling','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'As augury, except the base chance for receiving a meaningful reply is 50%. Note: You may only manifest inkling a number of times per day equal to your Wisdom modifier +1, regardless of further payment of power points or number of free manifestations left in the day.','81'),
('ph3e-insanity','Insanity','telepathy',NULL,'1 action','standard','Medium (100 fro + 10 ft./level)','One living creature',NULL,NULL,'Instantaneous','will','Will negates','yes','Yes',13,'Creatures affected by this power are permanently insane and constantly behave randomly, as indicated on the follow table: d10 roll Action Wander away for 1 minute (unless prevented) 2-6 Do nothing for 1 round 7-9 Attack nearest creature for 1 round Act normally for 1 round Except on a result of 1, roll again each round to see what the subject does that round. Wandering creatures leave the scene as if uninterested.','81'),
('ph3e-intrusive-sense-link','Intrusive Sense Link','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One living creature',NULL,NULL,'1 minute/level (D)','will','Will negates','yes','Yes',3,'As sense link, except the subject creature senses what you sense (one sense only). For example, if you link taste and then eat something particularly foul (DM''s discretion), the subject creature must make another Will save against the original DC or be stunned for 1 round.','81'),
('ph3e-invisibility','Invisibility','psychokinesis',NULL,'1 action','standard','Personal or touch','You or a creature or object weighing no more than 100 lb./level',NULL,NULL,'10 minutes/level (D)','will','Will negates (harmless, object)','yes','Yes (harmless, object)',3,'The creature or object touched vanishes from sight, even from darkvision. If the recipient is a creature carrying gear, the gear vanishes, too.','82'),
('ph3e-invisibility-purge','Invisibility Purge','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',5,'You surround yourself with a sphere of power with a radius of 5 feet per manifester level that negates all forms of invisibility. Anything invisible becomes visible while in the area.','82'),
('ph3e-iron-body','Iron Body','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',15,'This power transforms your body into living iron, which grants you several powerful resistances and abilities. You gain damage reduction 50/+3.','82'),
('ph3e-knock','Knock','psychoportation',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One door, box, or chest with an area of up to 10 sq. ft./level',NULL,NULL,'Instantaneous (see text)',NULL,'None','no','No',3,'The knock power opens stuck, barred, locked, or psionically locked doors (and magically held and arcane locked doors, unless the Psionics Are Different option is in use). It opens secret doors, as well as locked or trick-opening boxes or chests.','82'),
('ph3e-know-direction','Know Direction','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'You instantly know which way is north. If in a place where magnetic field lines do not specify north, you may know the direction of a prominent landmark, at the DM''s discretion.','83'),
('ph3e-know-location','Know Location','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'You generally know where you are. This power is useful to characters who frequently travel via teleportation, gates, or via other planes of existence.','83'),
('ph3e-lesser-body-adjustment','Lesser Body Adjustment','psychometabolism',NULL,'1 full round','full_round','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'As body adjustment, except you cure yourself of 1d8 hit points, or gain just a +1 bonus on your next Fortitude save against poison or disease, or heal 1 point of temporary ability damage. You don''t gain all three benefits simultaneously for a single manifestation.','83'),
('ph3e-lesser-concussion','Lesser Concussion','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One individual',NULL,NULL,'Instantaneous','fort','Fortitude half','yes','Yes',1,'As concussion, except lesser concussion deals 1d6 points of damage.','83'),
('ph3e-lesser-domination','Lesser Domination','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',7,'As domination, except that if no common language is shared between you and the subject, the power does not function at all.','83'),
('ph3e-lesser-metaphysical-weapon','Lesser Metaphysical Weapon','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One weapon or fifty projectiles (all of which must be in contact with each other at the time of manifestation)',NULL,NULL,'1 hour/level','will','Will negates (harmless, object)','yes','Yes (harmless, object)',1,'As metaphysical weapon, except the weapon gains a +1 enhancement bonus on attack and damage rolls.','83')
)
INSERT INTO dnd35_powers
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   discipline_id,subdiscipline,manifesting_time,action_type,range_text,target_text,area_text,effect_text,
   duration_text,save,saving_throw_text,power_resistance,power_resistance_text,power_points,
   augmentation_text,augmentation)
SELECT
  'ph3e-power-'||substr(d.slug,7),
  'ph3e-3.0',d.source_page,d.slug,d.name,d.description,d.description,0,NULL,1,
  'ph3e-power-discipline-'||d.discipline,d.subdiscipline,d.manifesting_time,d.action_type,d.range_text,
  d.target_text,d.area_text,d.effect_text,d.duration_text,d.save,d.saving_throw_text,
  d.power_resistance,d.power_resistance_text,d.power_points,NULL,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_powers p
  WHERE p.slug=d.slug AND p.owner_user_id IS NULL
);
