-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-control-object','Control Object','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One nonmagical, unattended object weighing up to 100 pounds',NULL,NULL,'Concentration, up to 1 round/level',NULL,'None','no','No',1,'You telekinetically “bring to life” inanimate objects. Though not actually alive, objects move under your control.','63'),
('ph3e-control-shadow','Control Shadow','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','Shadow cast by any object or creature with a total area of up to 100 sq. ft.',NULL,NULL,'Concentration, up to 1 minute/level',NULL,'None','no','No',1,'You control the shadow cast by anyone or anything. The controlled shadow is like a puppet that parodies imagined actions of the object or creature casting the shadow, even if the subject stands still.','63'),
('ph3e-control-sound','Control Sound','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One sound or mixture of related sounds',NULL,NULL,'Concentration, up to 1 minute/level',NULL,'See text','no','No',5,'You shape and alter existing sounds. You can target one sound, such as a person speaking or singing, or a group of related sounds, such as the patter of many raindrops or the tramp of soldiers passing by.','63'),
('ph3e-create-food-and-water','Create Food and Water','metacreativity',NULL,'10 minutes','other','Close (25 ft. + 5 ft./2 levels)',NULL,NULL,'Food and water to sustain three humans or one horse/level for 1 day','1 day (see text)',NULL,'None','no','No',5,'Creates simple nourishing food and clean water sufficient to sustain three humans or one horse per manifester level for one day.','63'),
('ph3e-create-sound','Create Sound','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,NULL,'Sounds (see text)','1 round/level (D)',NULL,'None','no','No',1,'You create a volume of sound that arises, recedes, approaches, or remains at a fixed place. You choose what type of sound the power creates when first manifesting it and cannot thereafter change its basic character.','64'),
('ph3e-crisis-of-breath','Crisis of Breath','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One creature of Huge size or smaller',NULL,NULL,'2 rounds/level','will','Will negates','yes','Yes',5,'You compel the subject to purge its entire store of air in one explosive exhalation, and thereby disrupt the subject’s autonomic breathing cycle. The subject’s lungs do not automatically breathe in again while the power''s duration lasts.','64'),
('ph3e-danger-sense','Danger Sense','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',5,'You can sense the presence of danger before your Sense would normally allow it. Your intuitive sense alerts you to danger from traps, giving you a +4 insight bonus on Reflex saves to avoid traps and a +4 insight bonus to AC against attacks by traps.','64'),
('ph3e-darkvision','Darkvision','clairsentience',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'1 hour/level',NULL,'None','yes','Yes (harmless)',3,'The subject gains the ability to see 60 feet even in total darkness. Darkvision is black and white only but otherwise like normal sight.','64'),
('ph3e-daze','Daze','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One person',NULL,NULL,'1 round','will','Will negates','yes','Yes',1,'This power clouds the mind of a humanoid of Medium-size or smaller so that he takes no actions. Humanoids of 5 or more HD are not affected.','64'),
('ph3e-demoralize','Demoralize','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,'Several living creatures, no two of which are more than 15 ft. apart',NULL,'1 minute/level','will','Will negates','yes','Yes',1,'You fill your enemies with self-doubt, conferring on them a -1 morale penalty on all saving throws, attack rolls, and skill checks. Allies are unaffected.','65'),
('ph3e-destiny-dissonance','Destiny Dissonance','clairsentience',NULL,'1 action','standard','Touch','Creature or object touched',NULL,NULL,'Until discharged',NULL,'None','yes','Yes',1,'Your mere touch grants your foe an imperfect, unfocused glimpse of the many possible futures in store. Unused to and unable to process the information, the subject takes 1d8 points of subdual damage from the dissonance.','65'),
('ph3e-detect-poison','Detect Poison','clairsentience',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels) Target or Area: One creature, one object, or a 5-foot cube',NULL,NULL,NULL,'Instantaneous',NULL,'None','no','No',1,'You determine whether a creature, object, or area has been poisoned or is poisonous. You can determine the exact type of poison with a successful Wisdom check (DC 20).','65'),
('ph3e-detect-psionics','Detect Psionics','clairsentience',NULL,'1 action','standard','60 ft.',NULL,'Quarter circle emanating from you to the extreme of the range',NULL,'Concentration, up to 1 minute/level (D)',NULL,'None','no','No',1,'You detect psionic auras. The amount of information revealed depends on how long you study a particular area or subject: 1st Round: Presence or absence of psionic auras.','65'),
('ph3e-detect-remote-viewing','Detect Remote Viewing','clairsentience',NULL,'1 action','standard','120 ft.',NULL,'A 12o-ft.-radius emanation centered on you',NULL,'24 hours',NULL,'None','no','No',7,'You immediately become aware of any attempt to observe you by means of clairaudience/clairvoyance or remote viewing. The power’s effect radiates from you and moves as you move.','66'),
('ph3e-detect-thoughts','Detect Thoughts','telepathy',NULL,'1 action','standard','60 ft.',NULL,'Quarter circle emanating from you to the extreme of the range',NULL,'Concentration, up to 1 minute/level (D)','will','Will negates (see text)','no','No',3,'You detect surface thoughts. The amount of information revealed depends on how long you study a particular area or subject: 1st Round: Presence or absence of thoughts (from conscious creatures with Intelligence scores of 1 or higher).','66')
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
