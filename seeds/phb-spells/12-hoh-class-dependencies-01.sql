-- PHB spell dependencies referenced by Heroes of Horror class lists.
-- Canonical SRD mechanics; existing PHB rows win via INSERT OR IGNORE.
-- Safe to re-run.

INSERT OR IGNORE INTO dnd35_spells
(id,source_id,slug,name,school_id,subschool,casting_time,action_type,range_text,duration_text,saving_throw_text,save,spell_resistance,spell_resistance_text) VALUES
  ('phb-spell-bane','phb-3.5','bane','Bane','phb-spell-school-enchantment','Compulsion','1 standard action','standard','50 ft.','1 min./level','Will negates','will','yes','Yes'),
  ('phb-spell-cause-fear','phb-3.5','cause-fear','Cause Fear','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1d4 rounds or 1 round; see text','Will partial','will','yes','Yes'),
  ('phb-spell-chill-touch','phb-3.5','chill-touch','Chill Touch','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Fortitude partial or Will negates; see text','fort','yes','Yes'),
  ('phb-spell-detect-magic','phb-3.5','detect-magic','Detect Magic','phb-spell-school-divination',NULL,'1 standard action','standard','60 ft.','Concentration, up to 1 min./level (D)',NULL,NULL,'no','No'),
  ('phb-spell-detect-undead','phb-3.5','detect-undead','Detect Undead','phb-spell-school-divination',NULL,'1 standard action','standard','60 ft.','Concentration, up to 1 min./level (D)',NULL,NULL,'no','No'),
  ('phb-spell-doom','phb-3.5','doom','Doom','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 min./level','Will negates','will','yes','Yes'),
  ('phb-spell-hide-from-undead','phb-3.5','hide-from-undead','Hide from Undead','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','10 min./level (D)','Will negates (harmless); see text','will','yes','Yes'),
  ('phb-spell-inflict-light-wounds','phb-3.5','inflict-light-wounds','Inflict Light Wounds','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-ray-of-enfeeblement','phb-3.5','ray-of-enfeeblement','Ray of Enfeeblement','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 min./level',NULL,NULL,'yes','Yes'),
  ('phb-spell-undetectable-alignment','phb-3.5','undetectable-alignment','Undetectable Alignment','phb-spell-school-abjuration',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','24 hours','Will negates (object)','will','yes','Yes (object)'),
  ('phb-spell-blindness-deafness','phb-3.5','blindness-deafness','Blindness/Deafness','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','Permanent (D)','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-command-undead','phb-3.5','command-undead','Command Undead','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','One day/level','Will negates; see text','will','yes','Yes'),
  ('phb-spell-darkness','phb-3.5','darkness','Darkness','phb-spell-school-evocation',NULL,'1 standard action','standard','Touch','10 min./level (D)',NULL,NULL,'no','No'),
  ('phb-spell-death-knell','phb-3.5','death-knell','Death Knell','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous/10 minutes per HD of subject; see text','Will negates','will','yes','Yes'),
  ('phb-spell-false-life','phb-3.5','false-life','False Life','phb-spell-school-necromancy',NULL,'1 standard action','standard','Personal','1 hour/level or until discharged',NULL,NULL,'no','No'),
  ('phb-spell-gentle-repose','phb-3.5','gentle-repose','Gentle Repose','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','One day/level','Will negates (object)','will','yes','Yes (object)'),
  ('phb-spell-ghoul-touch','phb-3.5','ghoul-touch','Ghoul Touch','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','1d6+2 rounds','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-inflict-moderate-wounds','phb-3.5','inflict-moderate-wounds','Inflict Moderate Wounds','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-scare','phb-3.5','scare','Scare','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 round/level or 1 round; see text','Will partial','will','yes','Yes'),
  ('phb-spell-spectral-hand','phb-3.5','spectral-hand','Spectral Hand','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 min./level (D)',NULL,NULL,'no','No');