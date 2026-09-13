-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-detonation','Detonation','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One individual',NULL,NULL,'Instantaneous','fort','Fortitude half','yes','Yes (object)',17,'As concussion, except detonation deals 17d6 points of damage. You may choose to have the power deal an equal amount of subdual damage instead.','66'),
('ph3e-dimension-door','Dimension Door','psychoportation',NULL,'1 action','standard','Long (400 ft. + 40 ft./level)','You and touched objects or other touched willing creatures (see text)',NULL,NULL,'Instantaneous',NULL,'None','no','No',7,'You instantly transfer yourself from your current location to any other spot within range. You always arrive at exactly the spot desired-whether by simply visualizing the area or by staring direction, such as “900 feet straight downward,” or ''upward to the northwest, 45-degree angle, 1,200 feet" You can bring along up to 500 pounds of nonliving matter or 250 pounds of living matter.','66'),
('ph3e-dimension-slide','Dimension Slide','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','You (see text)',NULL,NULL,'Instantaneous',NULL,'None','no','No',5,'You instantly transfer yourself from your current location to any other spot within range that you can see directly. You arrive at exactly the spot desired, if you can see it.','67'),
('ph3e-dimensional-anchor','Dimensional Anchor','psychoportation',NULL,'1 action','standard','Medium (100 ft. + 10ft./level)',NULL,NULL,'Ray','1 minute/level',NULL,'None','yes','Yes',7,'A slick, translucent ray springs from your outstretched hand. You must make a ranged touch attack to hit the target.','66'),
('ph3e-disable','Disable','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,'Several living creatures within a 15-ft.-radius burst',NULL,'1 minute/level (D)','will','Will negates','yes','Yes',1,'You broadcast a mental compulsion that convinces one or more creatures that they are disabled (at 0 hit points). Roll 2d4 to determine how many total HD of creatures can be affected.','67'),
('ph3e-disintegrate','Disintegrate','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,NULL,'Ray','Instantaneous','fort','Fortitude partial','yes','Yes',11,'A slick, translucent ray springs from your pointing finger, causing the creature or object it strikes to glow and vanish, leaving behind only a trace of fine dust. You must make a successful ranged touch attack to hit.','67'),
('ph3e-dismiss-ectoplasm','Dismiss Ectoplasm','metacreativity',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,'3o-ft.-radius burst',NULL,'Instantaneous','fort','Fortitude negates','no','No',7,'You dismiss creatures or objects composed of ectoplasm (such as astral constructs), or that were formerly composed of ectoplasm (such as items created using any of the creation powers). The power affects everything in a 3o-foot radius.','68'),
('ph3e-dismissal','Dismissal','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One extraplanar creature',NULL,NULL,'Instantaneous','will','Will negates','yes','Yes',7,'This power forces an extraplanar creature back to its proper plane. Add the creature''s HD to its saving throw and subtract your level as well.','68'),
('ph3e-displacement','Displacement','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 round/level (D)',NULL,'None','no','No',5,'Emulating the displacement ability of the displacer beast, you appear to be about 2 feet away from your true location. You benefit from a 50% miss chance as if you had total concealment.','68'),
('ph3e-dissipating-touch','Dissipating Touch','psychoportation',NULL,'1 action','standard','Touch','Creature or object touched',NULL,NULL,'Until discharged',NULL,'None','yes','Yes (object)',1,'Your mere touch can disperse the surface material of a foe or object, sending a tiny portion of it far away. This is disruptive; thus, your successful melee touch attack deals 1d8 points of damage.','68'),
('ph3e-dissolution','Dissolution','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One creature or object',NULL,NULL,'Instantaneous',NULL,'None (see text)','yes','Yes',17,'A creature or object you select is disintegrated, leaviu&11 behind only a trace of fine dust. Dissolution is like disintegrate except that it affects up to a 50-foot cube of nonliving, nonmagical matter whose hardness is less than 15.','68'),
('ph3e-dissolving-touch','Dissolving Touch','psychometabolism',NULL,'1 action','standard','Touch','Creature or object touched',NULL,NULL,'Until discharged',NULL,'None','yes','Yes (object)',7,'Your touch (or bite) is corrosive. You deal7d6 points of acid damage to any creature or object you touch.','68'),
('ph3e-distract','Distract','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2Ievels)','One living creature',NULL,NULL,'Concentration, up to 1 minute/level (D)','will','Will negates','yes','Yes',1,'You cause your subject''s mind to wander, distracting her. Subjects of distract make all Listen, Spot.','69'),
('ph3e-divert-teleport','Divert Teleport','psychoportation',NULL,'1 action','standard','Medium (100 ft, + 10 ft./level)',NULL,'A circle, centered on you, with a radius of 100 ft. + 10 ft./level','Diverts the teleportation of any object or creature whose weight does not total more than 300 lb./level','10 minutes/level (D)','will','Will negates (foils diversion)','yes','Yes (foils diversion)',13,'Detect and redirect qualifying magical or psionic teleportation within the area to a destination you choose and have previously visited by teleportation.','69'),
('ph3e-divination','Divination','clairsentience',NULL,'10 minutes','other','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',7,'Similar to augury but more powerful, a divination power can provide you with a useful piece of advice in reply to a question concerning a specific goal, event, or activity that is to occur within 1 week. The advice can be as simple as a short phrase, or it might take the form of a cryptic rhyme or omen.','69')
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
('ph3e-domination','Domination','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',7,'You can control the actions of any humanoid of Medium-size or smaller. You establish a telepathic link with the subject''s mind.','69'),
('ph3e-dream-travel','Dream Travel','psychoportation',NULL,'1 action','standard','Touch','Up to one touched creature/level',NULL,NULL,'1 hour/level (D)','will','Will negates','yes','Yes',15,'You and any creature you touch are drawn along a crystal arc of reverie to the edge of conscious thought, and into the region of dreams. You can take more than one creature along with you (subject to your level limit), but all must be touching each other.','70'),
('ph3e-duodimensional-hand','Duodimensional Hand','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level',NULL,'None','no','No',5,'Your hand becomes two-dimensional, making it razor-sharp. Instead of bludgeoning damage, your unarmed attacks do slashing or piercing damage (your choice), but your damage potential does not increase.','70'),
('ph3e-ecto-puppet','Ecto Puppet','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2levels)',NULL,NULL,'A “tethered” astral construct of the highest level you can manifest','Concentration, up to 1 round/level',NULL,'None','no','No',3,'As astral construct I, except the astral construct is visibly tethered to you, and you directly control its actions. It appears within 5 feet of you and can move up to the noted range.','71'),
('ph3e-ectoplasmic-armor','Ectoplasmic Armor','metacreativity',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'1 hour/level (D)','will','Will negates (harmless)','yes','Yes (harmless)',9,'The subject is dressed in a suit of shimmering ectoplasmic armor that provides a +10 armor bonus to AC. Other armor cannot be worn at the same time as ectoplasmic armor.','70'),
('ph3e-ectoplasmic-cocoon','Ectoplasmic Cocoon','metacreativity',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One creature of Medium-size or smaller',NULL,NULL,'1 round/level (D)','ref','Reflex negates','yes','Yes',3,'You draw writhing strands of ectoplasm from the Astral Plane that wrap up the subject like a mummy. The subject can still breathe but is otherwise helpless, being unable to see or take any physical actions.','70'),
('ph3e-ectoplasmic-form','Ectoplasmic Form','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'2 minutes/level (D)',NULL,'None','no','No',5,'You and all your gear become a partially translucent mass of rippling ectoplasm that generally conforms to your normal shape. You gain damage reduction 20/+1.','71'),
('ph3e-ectoplasmic-shambler','Ectoplasmic Shambler','metacreativity',NULL,'1 full round','full_round','Long (400 ft. +40 ft./level)',NULL,NULL,'One ectoplasmic construct, 60 ft. wide and up to 30 ft. high','1 minute/level',NULL,'See text','no','No',9,'You fashion an ephemeral, many-legged mass of pseudo- living ectoplasm called an ectoplasmic shambler. The shambler moves as you direct it at a speed of 10 feet.','71'),
('ph3e-elfsight','Elfsight','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute',NULL,'None','no','No',1,'You gain low-light vision (as an elf) for the duration of the power. If elfsight is used in conjunction with my light, you can see twice as far as indicated in the latter power''s description.','71'),
('ph3e-empathic-transfer','Empathic Transfer','psychometabolism',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'Instantaneous',NULL,'None','yes','Yes (harmless)',1,'You transfer the hurts of others to yourself. when you manifest this power, you can transfer up to 8 points of damage per manifester level from the subject creature to yourself.','71'),
('ph3e-empathy','Empathy','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'Concentration, up to 1 minute/level (D)','will','Will negates','yes','Yes',1,'You detect the surface emotions of any creature you can see that is in range. You can sense basic needs, drives, and emo- tions.','72'),
('ph3e-emulate-power','Emulate Power','clairsentience',NULL,'1 action','standard','See text Target, Effect, or Area: See text',NULL,NULL,NULL,'See text',NULL,'None','yes','Yes',13,'When manifesting emulate power, you choose any other power, regardless of discipline or whether you know the power, of 6th level or less, and duplicate its effect as if you had manifested that power. However, you pay a high price for this flexibility.','72'),
('ph3e-energy-barrier','Energy Barrier','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level or until discharged',NULL,'None','no','No',9,'Your body assimilates and converts energy attacks to harmless light. You gain resistance 10 to a specific energy attack (you ignore the first 10 points of damage dealt by a specified energy source).','72'),
('ph3e-energy-conversion','Energy Conversion','psychometabolism',NULL,'1 action','standard','Personal and Medium (100 ft. + 10 ft./level)','You and one object or creature',NULL,NULL,'10 minutes/level or until discharged',NULL,'None','no','No',13,'As energy barrier, except you can discharge stored energy in a ray as a single ranged touch attack. This is a standard action.','72'),
('ph3e-ethereal-jaunt','Ethereal Jaunt','psychoportation',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 round/level (D)',NULL,'None','no','No',11,'You become ethereal, along with your equipment. You are in a place called the Ethereal plane that overlaps the normal physical, Material Plane.','72')
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
