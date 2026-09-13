-- PHB spell dependencies referenced by Heroes of Horror class lists.
-- Canonical SRD mechanics; existing PHB rows win via INSERT OR IGNORE.
-- Safe to re-run.

INSERT OR IGNORE INTO dnd35_spells
(id,source_id,slug,name,school_id,subschool,casting_time,action_type,range_text,duration_text,saving_throw_text,save,spell_resistance,spell_resistance_text) VALUES
  ('phb-spell-dispel-magic-greater','phb-3.5','dispel-magic-greater','Dispel Magic, Greater','phb-spell-school-abjuration',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','Instantaneous',NULL,NULL,'no','No'),
  ('phb-spell-insect-plague','phb-3.5','insect-plague','Insect Plague','phb-spell-school-conjuration','Summoning','1 round','other','Long (400 ft. + 40 ft./level)','1 min./level',NULL,NULL,'no','No'),
  ('phb-spell-planar-binding-lesser','phb-3.5','planar-binding-lesser','Planar Binding, Lesser','phb-spell-school-conjuration','Calling','10 minutes','other','Close (25 ft. + 5 ft./2 levels); see text','Instantaneous','Will negates','will','conditional','No and Yes; see text'),
  ('phb-spell-magic-jar','phb-3.5','magic-jar','Magic Jar','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 hour/level or until you return to your body','Will negates; see text','will','yes','Yes'),
  ('phb-spell-inflict-light-wounds-mass','phb-3.5','inflict-light-wounds-mass','Inflict Light Wounds, Mass','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-inflict-moderate-wounds-mass','phb-3.5','inflict-moderate-wounds-mass','Inflict Moderate Wounds, Mass','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-inflict-serious-wounds-mass','phb-3.5','inflict-serious-wounds-mass','Inflict Serious Wounds, Mass','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-inflict-critical-wounds-mass','phb-3.5','inflict-critical-wounds-mass','Inflict Critical Wounds, Mass','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-nightmare','phb-3.5','nightmare','Nightmare','phb-spell-school-illusion','Phantasm','10 minutes','other','Unlimited','Instantaneous','Will negates','will','yes','Yes'),
  ('phb-spell-slay-living','phb-3.5','slay-living','Slay Living','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Fortitude partial','fort','yes','Yes'),
  ('phb-spell-undeath-to-death','phb-3.5','undeath-to-death','Undeath to Death','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','Instantaneous','Will negates','will','yes','Yes'),
  ('phb-spell-unhallow','phb-3.5','unhallow','Unhallow','phb-spell-school-evocation',NULL,'24 hours','other','Touch','Instantaneous','See text',NULL,'conditional','See text'),
  ('phb-spell-waves-of-fatigue','phb-3.5','waves-of-fatigue','Waves of Fatigue','phb-spell-school-necromancy',NULL,'1 standard action','standard','30 ft.','Instantaneous','No',NULL,'yes','Yes'),
  ('phb-spell-circle-of-death','phb-3.5','circle-of-death','Circle of Death','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','Instantaneous','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-create-undead','phb-3.5','create-undead','Create Undead','phb-spell-school-necromancy',NULL,'1 hour','other','Close (25 ft. + 5 ft./2 levels)','Instantaneous',NULL,NULL,'no','No'),
  ('phb-spell-eyebite','phb-3.5','eyebite','Eyebite','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 round per three levels; see text','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-geas-quest','phb-3.5','geas-quest','Geas/Quest','phb-spell-school-enchantment','Compulsion','10 minutes','other','Close (25 ft. + 5 ft./2 levels)','One day/level or until discharged (D)',NULL,NULL,'yes','Yes'),
  ('phb-spell-harm','phb-3.5','harm','Harm','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Will half; see text','will','yes','Yes'),
  ('phb-spell-planar-binding','phb-3.5','planar-binding','Planar Binding','phb-spell-school-conjuration','Calling','10 minutes','other','Close (25 ft. + 5 ft./2 levels); see text','Instantaneous','Will negates','will','conditional','No and Yes; see text'),
  ('phb-spell-waves-of-exhaustion','phb-3.5','waves-of-exhaustion','Waves of Exhaustion','phb-spell-school-necromancy',NULL,'1 standard action','standard','60 ft.','Instantaneous','No',NULL,'yes','Yes');