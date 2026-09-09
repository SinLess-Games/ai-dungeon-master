-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-ablating','Ablating','psychokinesis',NULL,'1 action','standard','Personal or close (25 ft. + 5 ft./2 levels)','You or one willing creature or one object (total weight up to 100 lb./level)',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',11,'You create a psychokinetic shield around the subject that bolsters its powers'' chance to survive a negate psionics power (or dispel magic spell). When ablating is manifested on a creature or object, add +6 to the DC of the negation check or dispel check for each ongoing power subject to negate psionics.','51'),
('ph3e-adamant-grasp','Adamant Grasp','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 round/level',NULL,'None','no','No',9,'All your grapple checks receive a +10 competence bonus while the duration lasts.','51'),
('ph3e-adapt-body','Adapt Body','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',9,'You can adapt your body to hostile environments. You choose the environment at the time you manifest the power.','51'),
('ph3e-affinity-field','Affinity Field','psychometabolism',NULL,'1 action','standard','20 ft.',NULL,'2o-ft.-radius emanation, centered on you',NULL,'10 minutes (D)',NULL,'None','yes','Yes',17,'You create an affinity feedback loop with all creatures within the area. While the duration lasts, affected creatures feel all physical forces that you feel.','51'),
('ph3e-amplified-invisibility','Amplified Invisibility','psychokinesis',NULL,'1 action','standard','Personal or touch','You or creature touched',NULL,NULL,'1 minute/level (D)','will','Will negates (harmless)','yes','Yes (harmless, object)',7,'As invisibility, except the power persists through one attack made by you. It ends normally after a second attack.','52'),
('ph3e-anchored-navigation','Anchored Navigation','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level',NULL,'None','no','No',7,'You know where you are in relation to a fixed starting point. While the duration lasts, you are aware of your exact distance and route (physical or psychoportive) back to a fixed starting point.','52'),
('ph3e-animal-affinity','Animal Affinity','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',3,'You forge a psychometabolic affinity with a chosen kind of animal (“animal” is a creature type defined in the Monster Manual), from which you emulate one ability score. You can emulate only one ability score per manifestation of animal affinity, although multiple manifestations can affect you, as long as each emulates different ability score.','52'),
('ph3e-apopsi','Apopsi','telepathy',NULL,'1 round','full_round','Close (25 ft. + 5 ft./2 levels)','One living psionic creature',NULL,NULL,'Instantaneous','fort','Fortitude negates','yes','Yes',17,'Using apopsi [ab-po-sigh], you delete 1d4 powers permanently from the subject''s mind. You specify the level of each power, and the DM randomly determines which of the subject''s powers is actually deleted.','52'),
('ph3e-astral-construct-i','Astral Construct I','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One created astral construct','1 round/level (D)',NULL,'None','no','No',1,'This power creates one 1st-level astral construct (see Chapter 8: Monsters) of solidified ectoplasm that attacks your enemies. It appears where you designate and acts immediately, on your turn.','52'),
('ph3e-astral-construct-ii','Astral Construct II','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',3,'As astral construct I, except you can create one 2nd-level astral construct or 1d3 1st-level astral constructs.','53'),
('ph3e-astral-construct-iii','Astral Construct III','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',5,'As astral construct I, except you can create one 3rd-Ievel astral construct, 1d3 2nd-level astral constructs, or 1d4+1 1st-level astral constructs.','53'),
('ph3e-astral-construct-iv','Astral Construct IV','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',7,'As astral construct I, except you can create one 4th-level astral construct, 1d3 3rd-level astral constructs, or 1d4+1 astral constructs of lower level.','53'),
('ph3e-astral-construct-ix','Astral Construct IX','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',17,'As astral construct I, except you can create one 9th-level astral construct, 1d3 8th-level astral constructs, or 1d4+1 astral constructs of lower level.','53'),
('ph3e-astral-construct-v','Astral Construct V','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',9,'As astral construct I, except you can create one 5th-level astral construct, 1d3 4th-level astral constructs, or 1d4+1 astral constructs of lower level.','53'),
('ph3e-astral-construct-vi','Astral Construct VI','metacreativity',NULL,'1 full round','full_round','close (25 ft. + 5 ft./2 levels)',NULL,NULL,'One or more astral constructs, no two of which can be more than 30 ft. apart','1 round/level (D)',NULL,'None','no','No',11,'As astral construct I, except you can create one 6th-level astral construct, 1d3 5th-level astral constructs, or 1d4+1 astral constructs of lower level.','53')
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
