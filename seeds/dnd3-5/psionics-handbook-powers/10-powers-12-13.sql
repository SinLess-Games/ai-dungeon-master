-- D&D 3.0 Psionics Handbook powers A-B.
-- Concise structured summaries preserve source mechanics while the supplied
-- Psionics Handbook remains authoritative for complete descriptive text.

WITH desired(
  slug,name,discipline,subdiscipline,manifesting_time,action_type,range_text,
  target_text,area_text,effect_text,duration_text,save,saving_throw_text,
  power_resistance,power_resistance_text,power_points,description,source_page
) AS (VALUES
('ph3e-lesser-mindlink','Lesser MindLink','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','You and one other creature who is initially no more than 30 ft. away',NULL,NULL,'10 minutes/level',NULL,'None','no','No',1,'You forge a telepathic bond with another creature, which must have an Intelligence score of 6 or higher. The bond can be established only with a willing subject, who therefore receives no saving throw and gains no benefit from power resistance.','83'),
('ph3e-lesser-natural-armor','Lesser Natural Armor','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute',NULL,'None','no','No',1,'Your skin grows thick ridges, providing a +1 natural armor bonus to your AC. Unlike mundane armor, natural armor entails no armor check penalty or speed reduction.','83'),
('ph3e-major-creation','Major Creation','metacreativity',NULL,'10 minutes','other','Close (25 ft. + 5 ft./2 levels)',NULL,NULL,'An unattended, nonmagical object of nonliving plant matter, up to 1 cu. ft./level','See text',NULL,'None','no','No',9,'As minor creation, except you can also create an object of mineral nature: stone, crystal, metal, and so on. The duration of the created item varies with its relative hardness and rarity: Hardness and Rarity Examples Duration Vegetable matter 2 hours/level Stone, crystal; base metals 1 hour/level Precious metals 20 minutes/level Gems 10 minutes/level Mithral* 2 rounds/level Adamantine** 1 round/level *Includes similar rare metals.','84'),
('ph3e-mass-cocoon','Mass Cocoon','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One creature of Medium-size or smaller','A 10-ft. cube-sized cocoon',NULL,'2 hours/level',NULL,'None','no','No',13,'As ectoplasmic cocoon, except you can cocoon several creatures (or a single large creature that fits in a 10-foot cube) in a mass of writhing, tightening ectoplasm. Also, no saving throw is granted; targets within the area are caught and cocooned unless they are too big to fit inside.','84'),
('ph3e-mass-concussion','Mass Concussion','psychokinesis',NULL,'1 action','standard','Long (400 ft. + 40 ft./level)','One individual','20-ft. radius sphere',NULL,'Instantaneous',NULL,'None','yes','Yes',7,'As concussion, except telekinetic pressure causes all creatures and objects within the area to explosively rupture, dealing 7d4 points of damage to creatures and unattended objects.','84'),
('ph3e-mass-domination','Mass Domination','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One humanoid of Medium-size or smaller',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',13,'As domination, except you can affect more creatures and can control a subject with whom you do not share a common language. You can give different directions to different creatures.','84'),
('ph3e-mass-suggestion','Mass Suggestion','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One living creature',NULL,NULL,'1 hour/level or until completed','will','Will negates','yes','Yes',11,'As suggestion, except that it can affect more creatures. The same suggestion applies to all these creatures.','84'),
('ph3e-matter-agitation','Matter Agitation','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,'2 sq. ft. of surface area of an object or creature',NULL,'Concentration, up to 2 rounds/level',NULL,'None','yes','Yes',1,'You can excite the structure of a nonmagical object, heating it to the point of combustion over time. If you shift your focus to another object, the first object cools and the second object begins to heat up.','85'),
('ph3e-matter-manipulation','Matter Manipulation','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)',NULL,'1 cu. ft./level of inanimate material',NULL,'Instantaneous',NULL,'None','yes','Yes',15,'You can weaken or strengthen the substance of an object or structure. You can affect both mundane and magical inani- mate material.','85'),
('ph3e-matter-rearrangement','Matter Rearrangement','psychokinesis',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','Nonmagical metal objects weighting up to a total of 1/10 pound, each no more than 1 inch from another',NULL,NULL,'instantaneous',NULL,'None','no','No',9,'You can transmute one metal into another. Each time you manifest the power, you affect a metal object up to 1/10 pound, or several metal objects whose total weight does not exceed 1/10 pound.','85'),
('ph3e-metaconcert','Metaconcert','telepathy',NULL,'1 minute','other','10 feet','You and up to fifteen other psions who also know metaconcert',NULL,NULL,'1 round/level (D)',NULL,'None','no','No',9,'You link your psychic might with other psions, creating an entity more powerful than the sum of its parts. All partici- pants (up to sixteen total, including you) must be willing; thus, saving throws and power resistance do not reply.','85'),
('ph3e-metafaculty','Metafaculty','clairsentience',NULL,'1 action','standard','Personal','You',NULL,NULL,'Concentration, up to 10 minutes/level (D)',NULL,'None (see text)','conditional','See text',17,'You gain exceptional insight concerning any individual or creature whom you have previously detected via any other Clairsen- tience or Telepathy power. For purposes of this power, “exceptional insight” includes a name, a mental image of the subject, the subject''s alignment, and the subject''s location (an image of the subject’s current location that is good enough to teleport to as if studied carefully).','86'),
('ph3e-metamorphosis','Metamorphosis','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',9,'As polymorph self, except you can also assume the form of inanimate objects as well as creatures. Thus, you could change yourself into a rock (if no smaller than Diminutive size), or a boulder (if no more than one size larger than your normal size).','86'),
('ph3e-metaphysical-weapon','Metaphysical Weapon','metacreativity',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One weapon or fifty projectiles (all of which must be in contact with each other at the time of manifestation)',NULL,NULL,'1 hour/level','will','Will negates (harmless, object)','yes','Yes (harmless, object)',5,'A weapon gains a +3 enhancement bonus on attack and damage rolls. The enhanced weapon glows with pale silver radiance (not sufficient to provide illumination).','87'),
('ph3e-microcosm','Microcosm','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels) Target or Area: One living creature or one or more creatures within a 15-foot-radius sphere',NULL,NULL,NULL,'Instantaneous',NULL,'None','yes','Yes',17,'When microcosm is manifested, you can target either a single creature or a group. Targeted: If microcosm targets a single creature, that creature''s senses are pinched off from the real world if it has 100 or fewer hit points.','87')
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
('ph3e-mind-blank','Mind Blank','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One creature',NULL,NULL,'1 day','will','Will negates (harmless)','yes','Yes (harmless)',15,'The subject is totally protected from all devices and power that detect, influence, or read emotions or thoughts. This protects against all mind-affecting powers and effects, as well as information gathering by Clairsentience powers or effects (except metafaculty).','87'),
('ph3e-mind-probe','Mind Probe','telepathy',NULL,'1 minute','other','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'1 minute/level','fort','Fortitude negates','yes','Yes',9,'All the subject''s memories and knowledge are accessible to you, from memories deep below the surface to those still easily called to mind. You can learn the answer to one question per round, to the best of the subject''s knowledge.','87'),
('ph3e-mind-seed','Mind Seed','telepathy',NULL,'3 rounds','other','5 feet','One humanoid of Medium-size or smaller',NULL,NULL,'Instantaneous','will','Will negates','yes','Yes',15,'You impress the totality of your psyche into a subject''s sub- conscious. If successfully implanted, the seed of your mind “germinates” over a period of one week.','88'),
('ph3e-mind-store','Mind Store','metacreativity',NULL,'10 minutes','other','Touch',NULL,NULL,'One storage crystal','Instantaneous',NULL,'None','no','No',15,'This power makes a storage crystal containing the essence of your living mind (this power can''t be used on a dead subject). Until such time as you perish, the storage crystal is utterly inert.','88'),
('ph3e-mind-switch','Mind Switch','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','You and one other living Medium-size or smaller creature',NULL,NULL,'Until you return to your body','will','Will negates (see text)','yes','Yes',11,'You can attempt to take control of a nearby living creature, forcing its mind (and soul) into your body. You may move your mind back into your own body whenever your desire (which returns the subject''s mind to its own body).','88'),
('ph3e-mindlink','Mindlink','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One creature/level, no two of which are initially more than 30 ft. apart',NULL,NULL,'10 minutes/level',NULL,'None','no','No',5,'As lesser mindlink, except you can link more than just yourself and one other creature.','87'),
('ph3e-mindwipe','Mindwipe','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,NULL,'Instantaneous','fort','Fortitude Negates','yes','Yes',7,'You partially wipe your victim’s mind of past experiences, bestowing one negative level per two manifester levels (maximum five negative levels). If the subject has at least as many negative levels as HD, he dies.','89'),
('ph3e-minor-creation','Minor Creation','metacreativity',NULL,'1 action','standard','0 ft.',NULL,NULL,'An unattended, nonmagical object of nonliving plant matter, up to 1 cu. ft./level','1 hour/level',NULL,'None','no','No',1,'You create a nonmagical, nonpsionic, unattended object of nonliving, vegetable matter: linen clothes, a hemp rope, a wooden ladder, and so on. The volume of the item created cannot exceed 1 cubic foot per manifester level.','89'),
('ph3e-missive','Missive','telepathy',NULL,'1 action','standard','Close (25 ft. + 5 ft./2 levels)','One living creature',NULL,'Mental message delivered to subject','Instantaneous','will','Will negates','yes','Yes',1,'You send a telepathic message of up to ten words to any living creature within range. Missive is strictly a one-way exchange from you to the subject.','89'),
('ph3e-monster-domination','Monster Domination','telepathy',NULL,'1 action','standard','Medium (100 ft. + 10 ft./level)','One living creature',NULL,NULL,'1 day/level','will','Will negates','yes','Yes',17,'As domination, except any kind of creature can be dominated, regardless of size or type (though it must be alive).','89'),
('ph3e-my-light','My Light','psychokinesis',NULL,'1 action','standard','Personal and 20 ft.','You and 20-ft. cone',NULL,NULL,'10 minutes/level (D)',NULL,'None','no','No',1,'Your eyes beam forth a 20-foot-long cone of light. You and other creatures can see normally in the light.','89'),
('ph3e-natural-armor','Natural Armor','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 hour/level (D)',NULL,'None','no','No',7,'As lesser natural armor, but you gain a +4 natural armor bonus to AC. Also, the duration is considerably longer.','90'),
('ph3e-nondetection','Nondetection','clairsentience',NULL,'1 action','standard','Touch','Creature or object touched',NULL,NULL,'1 hour/level','will','Will negates (harmless, object)','yes','Yes (harmless, object)',5,'The warded creature or object becomes difficult to detect by Clairsentience powers such as clairaudience/clairvoyance and remote viewing, or psionic and magic items that allow others to view the subject from afar. If a Clairsentience power is attempted against the warded creature or item, the manifester of the Clairsentience power must succeed at a manifester level check (1d20 + manifester level) with a DC of 11 + the manifester level of the psionic creature or character who manifested nondetection.','90'),
('ph3e-null-psionics-field','Null Psionics Field','psychokinesis',NULL,'1 action','standard','10 ft.',NULL,'A 10-ft.-radius emanation, centered on you',NULL,'10 minutes/level (D)',NULL,'None','conditional','See text',11,'An invisible barrier surrounds you and moves with you. The space within this barrier is totally impervious to most psionic effects.','90'),
('ph3e-oak-body','Oak Body','psychometabolism',NULL,'1 action','standard','Personal','You',NULL,NULL,'1 minute/level (D)',NULL,'None','no','No',13,'As iron body, but this power transforms your body into living oak. You gain damage reduction 20/+1.','91')
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
