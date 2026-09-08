-- Expanded Psionics Handbook powers Q-R.
-- Concise mechanical summaries; XPH remains the source of record.

WITH desired(slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,target_text,area_text,effect_text,duration_text,save,saving_throw_text,power_resistance,power_resistance_text,power_points,description,augmentation_text) AS (VALUES
('quintessence','Quintessence','metacreativity','creation','1 round','full_round','0 ft.',NULL,NULL,'1-inch-diameter dollop of quintessence; see text','Instantaneous',NULL,'None','no',NULL,7,'Collapse a fragment of time into a reusable dollop of quintessence that places completely coated matter outside normal temporal effects and interferes with psionics in sufficiently large accumulations.',NULL),
('read-thoughts','Read Thoughts','telepathy',NULL,'1 standard action','standard','60 ft.',NULL,'Cone-shaped emanation centered on you',NULL,'Concentration, up to 1 min./level (D)','will','Will negates; see text','no',NULL,3,'Read the surface thoughts of creatures in the cone that fail their Will saves while you maintain concentration.',NULL),
('reality-revision','Reality Revision','clairsentience',NULL,'1 standard action','standard','See text','See text','See text','See text','See text',NULL,'See text','conditional','See text',17,'Produce exceptionally broad reality-altering effects, including duplicating lower-level powers, removing afflictions, creating items, granting inherent bonuses, reviving the dead, transporting creatures, or undoing a recent event.','Minimum XP cost: 5,000 XP; some uses cost more.'),
('recall-agony','Recall Agony','clairsentience',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','One creature',NULL,NULL,'Instantaneous','will','Will half','yes',NULL,3,'Force a creature to experience remembered or future wounds, dealing 2d6 damage.','Each additional PP adds 1d6 damage; every extra 2d6 increases save DC by 1.'),
('recall-death','Recall Death','clairsentience',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','One creature',NULL,NULL,'Instantaneous','will','Will partial; see text','yes',NULL,15,'As recall agony, but a failed Will save kills the subject; a successful save deals 5d6 damage.',NULL),
('reddopsi','Reddopsi','psychokinesis',NULL,'1 standard action','standard','Personal','You',NULL,NULL,'Until discharged or 10 min./level',NULL,NULL,'no',NULL,13,'Reflect qualifying powers that target only you back onto their original manifester until the protection discharges or expires.',NULL),
('remote-view-trap','Remote View Trap','clairsentience',NULL,'1 standard action','standard','Personal','You',NULL,NULL,'24 hours + 1 hour/level','will','Will half; see text','no',NULL,11,'Prepare a trap against remote scrying: failed viewers are blocked and take 8d6 electricity damage, while successful viewers take 4d6 and can observe normally.',NULL),
('remote-viewing','Remote Viewing','clairsentience','scrying','1 hour','other','See text','One creature; see text',NULL,'Quasi-real viewpoint','1 min./level (D)','will','Will negates','yes',NULL,7,'Project a quasi-real viewpoint across any distance or planar boundary to observe a creature and its surroundings, subject to familiarity and connection modifiers.','XP cost: 20 XP.'),
('restoration-psionic','Restoration, Psionic','psychometabolism','healing','3 rounds','other','Touch','Creature touched',NULL,NULL,'Instantaneous','will','Will negates (harmless)','yes','Yes (harmless)',11,'Cure ability damage, restore one drained ability score, remove fatigue/exhaustion, and remove or restore certain negative levels within the power’s limits.',NULL),
('restore-extremity','Restore Extremity','psychometabolism','healing','1 standard action','standard','Touch','Creature touched',NULL,NULL,'Instantaneous','will','Will half (harmless)','yes','Yes (harmless)',9,'Restore a missing digit, limb, or head to an otherwise mostly intact living or dead creature without restoring life itself.',NULL),
('retrieve','Retrieve','psychoportation','teleportation','1 standard action','standard','Medium (100 ft. + 10 ft./level)','One object you can hold or carry in one hand, weighing up to 10 lb./level',NULL,NULL,'Instantaneous','will','Will negates; see text','no',NULL,11,'Teleport a visible object directly into your hand; an opponent possessing the object can resist with a Will save.','Each additional PP increases the target weight limit by 10 pounds.')
)
INSERT INTO dnd35_powers
(id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,discipline_id,subdiscipline,manifesting_time,action_type,range_text,target_text,area_text,effect_text,duration_text,save,saving_throw_text,power_resistance,power_resistance_text,power_points,augmentation_text,augmentation)
SELECT
  'xph-power-'||d.slug,'xph-3.5','Chapter 5',d.slug,d.name,d.description,d.description,0,NULL,1,
  'xph-power-discipline-'||d.discipline,d.subdiscipline,d.manifesting_time,d.action_type,d.range_text,
  d.target_text,d.area_text,d.effect_text,d.duration_text,d.save,d.saving_throw_text,
  d.power_resistance,d.power_resistance_text,d.power_points,d.augmentation_text,NULL
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_powers p
  WHERE p.slug=d.slug AND p.owner_user_id IS NULL
);
