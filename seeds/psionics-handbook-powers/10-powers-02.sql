-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-astral-construct-vii','Astral Construct VII','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',13,'As astral construct I, except you can create one 7th-level astral construct, 1d3 6th-level astral constructs, or 1d4+1 astral constructs of lower level.','53'),
('ph3e-astral-construct-viii','Astral Construct VIII','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',15,'As astral construct I, except you can create one 8th-level astral construct, 1d3 7th-level astral constructs, or 1d4+1 astral constructs of lower level.','53'),
('ph3e-astral-projection','Astral Projection','psychoportation',NULL,'30 minutes','other','Touch','You plus one additional creature touched per two levels',NULL,NULL,'See text',NULL,'None','yes','Yes',17,'Freeing your spirit from your physical body, this power allows you to project an astral body into another plane altogether. You can bring the astral forms of other creatures with you, provided the creatures are linked in a circle with you at the time of the manifestation.','53'),
('ph3e-astral-steed','Astral Steed','psychoportation',NULL,'10 minutes','other','0 ft.',NULL,NULL,'One quasi-real, horselike creature','1 hour/level',NULL,'None','no','No',5,'You call a quasi-real, horselike creature from the Astral Plane. The steed can be ridden only by you or by the one person for whom you specifically call the mount.','54'),
('ph3e-attraction','Attraction','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 hour/level','will','Will negates','yes','Yes',1,'You plant a compelling attraction in the mind of the subject. The attraction can be toward a particular person, an object, an action, or an event The power''s subject will take reason., able steps to meet, get close to, attend, find, or perform the, object of its implanted attraction.','54'),
('ph3e-augury','Augury','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',3,'An augury can tell you whether a particular action will bring good or bad results for you in the immediate future. For example, if a parry is considering destroying a weird sea that closes a portal, an augury might determine whether it'' a good idea.','54'),
('ph3e-aura-alteration','Aura Alteration','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One living creature',NULL,NULL,'Instantaneous or 10 minutes/level','will','Will negates','yes','Yes',11,'You can disguise the subject''s aura (alignment), level, or remove compulsions such as crisis of breath, fatal attraction, curses, geases, and quests. Aura alteration can also sever all charm and compulsion powers of 6th level or lower that might affect a target.','54'),
('ph3e-aura-sight','Aura Sight','clairsentience',NULL,'1 action','standard','30 ft.',NULL,'3o-ft.-radius emanation, centered on you',NULL,'Concentration, up to 10 minutes/level (D)',NULL,'None','no','No',7,'You discern auras. Auras are invisible to the naked eye, but 10 the psionic viewer appear as glowing halos or envelopes of colored light that surround all things.','55'),
('ph3e-aversion','Aversion','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 hour/level','will','Will negates','yes','Yes',3,'You plant a powerful aversion in the mind of the subject. The aversion can be toward a particular parson, an object, an action, or an event.','55'),
('ph3e-baleful-teleport','Baleful Teleport','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Any object or creature whose weight does not total more than 300 lb./level',NULL,NULL,'Instantaneous','will','Will half','yes','Yes',9,'You psychoportively disperse minuscule portions of the subject, dealing 9d6 points of damage. Targets are protected from the effects of a baleful teleport by dimensional anchor.','55'),
('ph3e-banishment','Banishment','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One or more extraplanar creatures, no two of which can be more than 30 ft. apart',NULL,NULL,'Instantaneous','will','Will negates','yes','Yes',11,'Banishment is a more powerful version of the dismissal power. It enables you to force extraplanar creatures out of your home plane.','55'),
('ph3e-biocurrent','Biocurrent','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Any two living creatures who are no more than 15 ft. apart',NULL,NULL,'Concentration, up to 1 minute/level (see text)','fort','Fortitude half','yes','Yes',1,'Your body''s psionically fueled bioelectric currents produce an arc of blue-white electricity that targets a primary foe for 1d4 points of electricity damage per round that you meet the requirements (see below). Electricity also arcs off the primary foe to strike one additional foe initially within 15 feet of the primary foe, or who subsequently moves within 15 feet of the primary foe while the duration lasts.','56'),
('ph3e-biofeedback','Biofeedback','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/ level (D)',NULL,'None','no','No',1,'You can constrict bleed- ing around wounds, less- ening their impact. You take a portion of any attack that deals damage as points of subdual damage equal to your Strength modifier.','56'),
('ph3e-bite-of-the-tiger','Bite of the Tiger','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level',NULL,'None','no','No',5,'Your posture becomes stooped forward, and you grow a tigerlike muzzle complete with rending fangs. The power grants you a bite attack (which does not draw an attack of opportunity) with a base damage of 2d8 points.','56'),
('ph3e-bite-of-the-wolf','Bite of the Wolf','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level',NULL,'None','no','No',1,'Your posture becomes stooped forward, and you grow a wolflike muzzle complete with fangs. The power grants you a bite attack (which does not draw an attack of opportunity) with a base damage of 1d8 points.','56')
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
