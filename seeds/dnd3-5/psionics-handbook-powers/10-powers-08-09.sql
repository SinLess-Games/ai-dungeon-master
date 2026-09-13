-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-etherealness','Etherealness','psychoportation',NULL,'1 action','standard','Touch (see text)','You',NULL,NULL,'1 minute/level (D)',NULL,'None','yes','Yes',13,'As ethereal jaunt, except you and other creatures joined by linked hands (along with their equipment) become ethereal. Besides yourself, you can bring one creature per three manifester levels to the Ethereal Plane.','72'),
('ph3e-expanded-vision','Expanded Vision','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',1,'Your field of vision is wider than normal, granting you reduced penalties and even bonuses in specific situations. In effect, you have a 315-degree arc of sight, allowing you some slight vision of creatures that might otherwise fully flank you.','73'),
('ph3e-expansion','Expansion','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',3,'You can increase your size. You grow up to 10% per your manifester level, increasing by this amount in height, width, and depth (to a maximum growth of 100%).','73'),
('ph3e-fabricate','Fabricate','metacreativity',NULL,'See text','other','Close (25 ft. + 5 ft./2 levels)','Up to 1 cubic yard/level (see text)',NULL,NULL,'Instantaneous',NULL,'None','no','No',7,'You convert material of one sort into a product that is of the same material. Thus, you can fabricate a wooden bridge from a clump of trees, a rope from a patch of hemp, clothes from flax or wool, and so forth.','73'),
('ph3e-false-sensory-input','False Sensory Input','telepathy',NULL,'1 full round','full_round','Long (400 ft. + 40 ft./level)','One living creature.',NULL,NULL,'Concentration, up to 1 minute/level (D)','will','Will negates','yes','Yes',5,'You have a limited ability to falsify one of the subject''s senses. The subject thinks she sees, hears, smells, tastes or feels something other than what her senses actually report.','73'),
('ph3e-far-hand','Far Hand','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','A. nonmagical, unattended object weighing up to 5 pounds',NULL,NULL,'Concentration',NULL,'None','no','No',1,'You can lift and move an object at will from a distance. As a move-equivalent action, you can move the object up to 15 feet in any direction, though the power ends if the distance between you and the object ever exceeds the power''s range.','74'),
('ph3e-far-punch','Far Punch','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One individual',NULL,NULL,'Instantaneous',NULL,'None','yes','Yes',1,'A target you select is buffeted with telekinetic force for 1 point of damage. Far punch always affects a target within range that you can see, even if the target is in melee or has partial cover or concealment.','74'),
('ph3e-fatal-attraction','Fatal Attraction','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One living creature',NULL,NULL,'Instantaneous','fort','Fortitude negates','yes','Yes',7,'You plant a hidden death-urge impulse in the subject''s unconscious. The impulse slowly takes root and reinforces itself in the dark cellars of the subject''s mind over a period of 1d4 days.','74'),
('ph3e-fate-link','Fate Link','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Any two living creatures that are initially no more than 30 ft. apart.',NULL,NULL,'1 hour/level','will','Will negates','yes','Yes',5,'You temporarily link the fates of any two creatures, if both fail their saving throws. If either linked creature experiences pain, both feel it.','74'),
('ph3e-fate-of-one','Fate of One','clairsentience',NULL,'See text','free','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',7,'Your limited omniscience allows you to reroll a saving throw, attack roll, or skill check, and use the better of the two rolls for your result. You can manifest this power instantly, quickly enough to gain its benefits in a clutch situation.','74'),
('ph3e-feather-fall','Feather Fall','psychoportation',NULL,'See text','free','Close (25 ft. + 5 ft./2 levels)','Any free-falling objects or creatures in a 10-ft. radius whose weight does not total more than 300 lb./level',NULL,NULL,'Until landing or 1 round/level','will','Will negates (object)','yes','Yes (object)',1,'The creatures or objects affected fall slowly. The rate of fall is instantly changed to a mere 60 feet per round (equivalent to the end of a fall from a few feet), with no damage incurred upon landing while the power is in effect.','75'),
('ph3e-feel-light','Feel Light','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',1,'You experience light translated through tactile sensation (by touch). Your entire body becomes a receiver for light.','75'),
('ph3e-feel-sound','Feel Sound','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',1,'As feel light, except you experience sound translated through tactile sensation (by touch). Your entire body becomes a receiver for sound.','75'),
('ph3e-finger-of-fire','Finger of Fire','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,NULL,'Ray','Instantaneous',NULL,'None','yes','Yes',1,'A ray of unstable, burning ectoplasm projects from your pointing finger. You must succeed at a ranged touch attack with the ray to deal damage to a target.','75'),
('ph3e-firefall','Firefall','metacreativity',NULL,'1 action','standard','20 ft.',NULL,'10-ft. radius burst',NULL,'Instantaneous','ref','Reflex half','yes','Yes',1,'Motes of unstable ectoplasm flare and dissipate explosively within the area you designate. Any creature in the area takes 1d4 points of fire damage.','75')
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
('ph3e-fission','Fission','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 round/level (D)',NULL,'None','no','No',13,'You can divide yourself, creating a duplicate up to 5 feet away. Your duplicate thinks and acts exactly as you do and follows your orders, although it will not do anything you wouldn''t do yourself.','75'),
('ph3e-flaming-shroud','Flaming Shroud','metacreativity',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One creature of Large size or smaller',NULL,NULL,'Instantaneous','ref','Reflex negates','yes','Yes',11,'You draw writhing strands of unstable ectoplasm from the Astral Plane and wrap the subject in a shroud of hellish fire. If the target fails its Reflex save, it suffers 11d6 points of fire damage.','76'),
('ph3e-float','Float','psychoportation',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Any object or creature whose weight does not total more than 300 lb./level',NULL,NULL,'Concentration',NULL,'None','no','No',1,'You can mentally support one creature or object in water or similar liquid at will from a distance. You cannot move the floating object, but if the subject of the power is animate, it can move through the water without fear of submerging (or drowning, if an unskilled swimmer).','76'),
('ph3e-fly','Fly','psychoportation',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'10 minutes/level',NULL,'None','yes','Yes (harmless)',5,'The power''s subject can fly at a speed of 90 feet (60 feet if the creature wears medium or heavy armor). The subject can fly up at half speed and descend at double speed.','76'),
('ph3e-forced-mindlink','Forced Mindlink','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','You and one other creature who is initially no more than 30 ft. away',NULL,NULL,'10 minutes/level','will','Will negates','yes','Yes',7,'As lesser mindlink, except you can attempt to create a telepathic bond with a creature who is not willing. Even if you create a bond with an unwilling creature, it can still decide not to “speak” with you through the telepathic bond.','76'),
('ph3e-foresight','Foresight','clairsentience',NULL,'1 action','standard','Personal or touch','See text',NULL,NULL,'10 minutes/level','will','None or Will negates (see text)','conditional','No or Yes (harmless)',15,'You gain a powerful sixth sense in relation to yourself or another. Once the power is manifested, you receive instantaneous warnings of impending danger or harm to the subject of the power.','76'),
('ph3e-freedom-of-movement','Freedom of Movement','psychoportation',NULL,'1 action','standard','Personal or touch','You or creature touched',NULL,NULL,'10 minutes/level',NULL,'None','conditional','No or Yes (harmless)',7,'This power enables you or the creature you touch to move and attack normally for the duration of the power, even under the influence of psionics that usually impedes movement, such as ectoplasmic cocoon. The power also allows a character to move and attack normally while underwater, even with cutting weapons such as axes and swords and with smashing weapons such as flails, hammers, and maces, provided that the weapon is wielded in the hand rather than hurled.','77'),
('ph3e-genesis','Genesis','metacreativity',NULL,'1 week (8 hours/day)','other','0 ft.',NULL,NULL,'See text','Instantaneous',NULL,'None','no','No',17,'You create a finite plane with limited access: a demiplane. Demiplanes created by this power are very small, very minor planes.','77'),
('ph3e-glide','Glide','psychoportation',NULL,'1 action','standard','Touch','Creature touched',NULL,NULL,'1 minute/level',NULL,'None','yes','Yes (harmless)',3,'The power''s subject can glide through the air with a speed of 20 feet (10 feet if the creature wears medium or heavy armor). The subject can only fly upward at a speed of 5 feet but may descend at a speed of 50 feet.','77'),
('ph3e-graft-weapon','Graft Weapon','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'Instantaneous',NULL,'None','no','No',9,'You permanently attach any weapon— mundane, psionic, or magical—onto the end of one of your arms. The weapon becomes a natural extension of your arm, and that hand is nowhere to be seen.','78'),
('ph3e-grease','Grease','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels) Target or Area: One object or a 10-ft. x 10-ft. square',NULL,NULL,NULL,'1 round/level (D)',NULL,'See text','no','No',1,'A grease power covers a solid surface with a layer of slippery grease. Any creature entering the area or caught in it when the power is manifested must make a successful Reflex save or slip, skid, and fall.','78'),
('ph3e-greater-biocurrent','Greater Biocurrent','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Any four living creatures that are no more than 15 ft. apart',NULL,NULL,'Concentration, up to 1 minute/level (see text)','fort','Fortitude half','yes','Yes',11,'As bi- current except you deal 6d6 points of electricity damage per round you meet the require- ments. Electricity also arcs off the primary target to strike three additional foes initially within 15 feet of the primary foe, or who subsequently move within 15 feet of the primary foe while the duration lasts.','78'),
('ph3e-greater-concussion','Greater Concussion','psychokinesis',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One individual',NULL,NULL,'Instantaneous','fort','Fortitude half','yes','Yes',5,'As concussion, except greater concussion deals 5d6 points of damage. You may choose to have the power deal an equal amount of subdual damage instead.','78'),
('ph3e-greater-domination','Greater Domination','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',9,'As domination, except you can control a subject with whom you do not share a common language.','79'),
('ph3e-greater-emulation','Greater Emulation','clairsentience',NULL,'1 action','standard','See text Target, Effect, or Area: See text',NULL,NULL,NULL,'See text',NULL,'None','yes','Yes',17,'As emulate power, except that you can duplicate the effect of any other power, regardless of its discipline or whether you know the power, of 8th level or lower. XP Cost: 5,000 XP or the XP requirement of the emulated power, whichever is greater.','79')
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
