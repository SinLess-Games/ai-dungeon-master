-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-body-adjustment','Body Adjustment','psychometabolism',NULL,'1 full round','full_round','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',3,'You take control of your own living body, allowing you to heal injury. You cure yourself of3d6 points of damage.','56'),
('ph3e-body-equilibrium','Body Equilibrium','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',3,'You can adjust your body equilibrium to correspond with any solid or liquid that you stand on. Thus, you can walk on water, quicksand, or even a spider''s web without sinking breaking through (this does not confer any resistance to particularly sticky webs).','57'),
('ph3e-bolt','Bolt','metacreativity',NULL,'1 action','standard','0 ft.',NULL,NULL,'A nonmagical bolt, arrow, or sling bullet','2 rounds',NULL,'None','no','No',1,'You create a single, nonmagical, standard-size crossbow bolt, arrow, or sling bullet, which dissipates into its constituent ectoplasmic particles when the duration lapses.','57'),
('ph3e-brain-lock','Brain Lock','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'1 round/level (D)','will','Will negates','yes','Yes',3,'The subject''s higher mind is locked away. He stands mentally paralyzed, unable to take any actions.','57'),
('ph3e-breath-of-the-dragon','Breath of the Dragon','psychometabolism',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,'Cone',NULL,'Instantaneous','ref','Reflex half','yes','Yes',11,'You breathe forth raging fire, originating from your mouth and extending outward in a cone. This attack deals 11d4 points of fire damage.','57'),
('ph3e-brilliant-blast','Brilliant Blast','psychokinesis',NULL,'1 action','standard','Long (400 ft. + 40 ft./level)',NULL,'A 20-ft.-radius spread',NULL,'Instantaneous','ref','Reflex half','yes','Yes',9,'You psychokinetically focus even the tiniest ambient light into a shriveling blast of brilliance, dealing 9d4 points of heat damage to all creatures within the area. Unattended objects also take damage.','57'),
('ph3e-burning-ray','Burning Ray','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,NULL,'Ray','Instantaneous',NULL,'None','yes','Yes',3,'A ray of hellish, ectoplasm projects from your brow (your “third eye”). You must succeed at a ranged touch attack to strike a target with the ray, which deals 3d6 points of fire damage.','57'),
('ph3e-burst','Burst','psychoportation',NULL,'See text','free','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 round',NULL,'None','no','No',1,'The subject receives a burst of speed. The subject has a speed equal to her original speed +10 on her next round of actions.','58'),
('ph3e-call-cohort','Call Cohort','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Your cohort, if any',NULL,NULL,'Instantaneous',NULL,'None','no','No',11,'Call cohort teleports your cohort to you from any distance within a plane (but not between planes). A cohort is gained with the Leadership feat (described in Chapter 2 of the D UNGEON M ASTER ''s Guide).','58'),
('ph3e-call-weaponry','Call Weaponry','psychoportation',NULL,'1 action','standard','Touch',NULL,NULL,'1 unattended weapon (see text)','1 hour/level (see text) (D)',NULL,'None','no','No',1,'You call a weapon “from thin air” into your waiting hand (actually, it is a real weapon hailing from some other random location in the multiverse). You don''t have to see or know of a weapon to call it—in fact, you can''t ever call a specific weapon.','58'),
('ph3e-catapsi','Catapsi','telepathy',NULL,'1 action','standard','Medium 100 feet',NULL,'10o-ft.-radius emanation centered on you',NULL,'1 minute/level','will','Will negates (see text)','yes','Yes',9,'With catapsi [kat-ah-sigh], you generate psychic static, making it more difficult for other psionic characters to manifest their powers (you are not affected by your own catapsi manifestation). All psionic activity within the area requires twice as many power points to manifest, unless opponents make a successful Will save each time they manifest a power.','58'),
('ph3e-catfall','Catfall','psychoportation',NULL,'See text','free','Personal','You',NULL,NULL,'1 round/level',NULL,'None','no','No',1,'You recover instantly from a fall and can absorb some damage from falling. You land on your feet no matter how far you fall, and the first 3 points of falling damage are treated as subdual damage.','58'),
('ph3e-chameleon','Chameleon','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',3,'Your skin and equipment take on the color and texture of nearby objects, including floors and walls. You receive a +10 enhancement bonus on Hide checks.','59'),
('ph3e-charm-monster','Charm Monster','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',5,'As charm person, except that the power is not restricted by creature type or size, and you need not speak the creature''s language.','59'),
('ph3e-charm-person','Charm Person','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One person',NULL,NULL,'1 hour/level','will','Will negates','yes','Yes',1,'This power makes a humanoid of Medium-size or smaller regard you as his trusted friend and ally. If the creature is currently being threatened or attacked by you or your allies, however, he receives a +5 bonus on his saving throw.','59')
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
