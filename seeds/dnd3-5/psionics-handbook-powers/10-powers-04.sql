-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-clairtangency','Clairtangency','psychokinesis',NULL,'1 action','standard','See text',NULL,'See text',NULL,'Up to 1 minute/level (see text) (D)',NULL,'None','no','No',9,'You can emulate a far hand or far punch effect at any distance, simultaneously emulating clairaudience/clairvoyance. You can concentrate upon some locale and see almost as if you were there.','59'),
('ph3e-claws-of-the-bear','Claws of the Bear','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level',NULL,'None','no','No',3,'Your forearms lengthen, your hands broaden into wide paws, and you grow sicklelike bear claws on both hands. The power grants you a claw attack (which does not draw an attack of opportunity) with a base damage of id12.','60'),
('ph3e-claws-of-the-vampire','Claws of the Vampire','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level',NULL,'None','no','No',5,'The fingernails on both your hands grow to wicked, 2-inch- longpoints. The power grants you a claw attack (which does not draw an attack of opportunity) with a base damage of 1d8.','60'),
('ph3e-combat-precognition','Combat Precognition','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',1,'Your awareness extends a fraction of a second into the future, allowing you to better evade an opponent''s blows. You gain a +1 insight bonus to AC.','60'),
('ph3e-combat-prescience','Combat Prescience','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',3,'Your awareness extends a fraction of a second into the future, allowing you to better land blows against your opponent. You gain a +2 insight bonus on your attack roll.','60'),
('ph3e-compression','Compression','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',1,'You can decrease your size. You shrink up to 10% per your manifester level, decreasing by this amount in height, width and depth (to a maximum reduction of 50%).','60'),
('ph3e-conceal-thoughts','Conceal Thoughts','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 hour/level',NULL,'Yes (harmless)','yes','Yes (harmless)',1,'You protect your thoughts from analysis. While the duration lasts, the feat Psychic Inquisitor fails to operate against you, and you gain a +20 circumstance bonus on Bluff checks against those attempting to discern your true intentions with Sense Motive.','60'),
('ph3e-concussion','Concussion','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One individual',NULL,NULL,'Instantaneous','fort','Fortitude half','yes','Yes',3,'A target you select is pummelled with telekinetic force for 3d6 points of damage. You may choose to have the power deal an equal amount of subdual damage instead.','61'),
('ph3e-cone-of-sound','Cone of Sound','psychokinesis',NULL,'1 action','standard','60 ft.',NULL,'Cone',NULL,'Instantaneous','ref','Reflex half','yes','Yes',5,'You release a focused scream of sonic energy that deals 5d4 points of damage to each creature within its area. The cone begins at your mouth, instigated by the barest whisper.','61'),
('ph3e-confidante','Confidante','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','You and one other creature who is initially no more than 30 ft. away',NULL,NULL,'Instantaneous',NULL,'None','no','No',17,'As lesser mindlink, except the telepathic bond is permanent between you and one other creature. XP Cost: 2,000 XP.','61'),
('ph3e-contingency','Contingency','metacreativity',NULL,'At least 10 minutes (see text)','other','Personal','You',NULL,NULL,'1 day /level or until discharged',NULL,'None','no','No',13,'You can place another power upon your person so that the latter power comes into effect under some condition you dictate when manifesting contingency. The contingency power and the power it is to bring into effect are manifested at the same time.','61'),
('ph3e-control-air','Control Air','psychokinesis',NULL,'1 action','standard','1,000 feet + 500 ft./level',NULL,'1,0o0-ft.-radius spread + 500 ft./level',NULL,'Concentration, up to 1 minute/level',NULL,'See text','no','No',3,'You have some control over wind speed and direction. The speed of air within the area can be increased or decreased by up to 10 +5/level miles per hour.','61'),
('ph3e-control-body','Control Body','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'Concentration, up to 1 minute/level','fort','Fortitude negates','yes','Yes',3,'You psychokinetically control the actions of any humanoid that is Medium-size or smaller. Control body doesn''t require mental contact with the subject.','62'),
('ph3e-control-flames','Control Flames','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,'One nonmagical fire source up to 1 sq. ft./level (see text)',NULL,'Concentration, up to 1 minute/level',NULL,'See text','no','No',3,'You pyrokinetically control the intensity or movements of one fire source. A nonmagical fire source can be controlled if its bed or base is equal to or less than 1 square foot/level; larger fires cannot be controlled.','62'),
('ph3e-control-light','Control Light','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)',NULL,'9 1o-ft. cubes + 3 1 o-ft. cubes/level',NULL,'Concentration, up to 1 minute/level',NULL,'See text','no','No',1,'You manipulate ambient light levels within the area. You can increase or decrease total illumination in an area by up to 20% per manifester level This increases or decreases overall effective range of vision for characters and creatures dependent on light by the same percentage.','62')
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
