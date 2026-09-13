-- PHB spell dependencies referenced by Heroes of Horror class lists.
-- Canonical SRD mechanics; existing PHB rows win via INSERT OR IGNORE.
-- Safe to re-run.

INSERT OR IGNORE INTO dnd35_spells
(id,source_id,slug,name,school_id,subschool,casting_time,action_type,range_text,duration_text,saving_throw_text,save,spell_resistance,spell_resistance_text) VALUES
  ('phb-spell-control-undead','phb-3.5','control-undead','Control Undead','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 min./level','Will negates','will','yes','Yes'),
  ('phb-spell-destruction','phb-3.5','destruction','Destruction','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Fortitude partial','fort','yes','Yes'),
  ('phb-spell-finger-of-death','phb-3.5','finger-of-death','Finger of Death','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Fortitude partial','fort','yes','Yes'),
  ('phb-spell-song-of-discord','phb-3.5','song-of-discord','Song of Discord','phb-spell-school-enchantment','Compulsion','1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 round/level','Will negates','will','yes','Yes'),
  ('phb-spell-create-greater-undead','phb-3.5','create-greater-undead','Create Greater Undead','phb-spell-school-necromancy',NULL,'1 hour','other','Close (25 ft. + 5 ft./2 levels)','Instantaneous',NULL,NULL,'no','No'),
  ('phb-spell-horrid-wilting','phb-3.5','horrid-wilting','Horrid Wilting','phb-spell-school-necromancy',NULL,'1 standard action','standard','Long (400 ft. + 40 ft./level)','Instantaneous','Fortitude half','fort','yes','Yes'),
  ('phb-spell-symbol-of-death','phb-3.5','symbol-of-death','Symbol of Death','phb-spell-school-necromancy',NULL,'10 minutes','other','0 ft.; see text','See text','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-energy-drain','phb-3.5','energy-drain','Energy Drain','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Fortitude partial; see text','fort','yes','Yes'),
  ('phb-spell-wail-of-the-banshee','phb-3.5','wail-of-the-banshee','Wail of the Banshee','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-detect-poison','phb-3.5','detect-poison','Detect Poison','phb-spell-school-divination',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous',NULL,NULL,'no','No'),
  ('phb-spell-endure-elements','phb-3.5','endure-elements','Endure Elements','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','24 hours','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-magic-weapon','phb-3.5','magic-weapon','Magic Weapon','phb-spell-school-transmutation',NULL,'1 standard action','standard','Touch','1 min./level','Will negates (harmless, object)','will','yes','Yes (harmless, object)'),
  ('phb-spell-read-magic','phb-3.5','read-magic','Read Magic','phb-spell-school-divination',NULL,'1 standard action','standard','Personal','10 min./level',NULL,NULL,'no','No'),
  ('phb-spell-resistance','phb-3.5','resistance','Resistance','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','1 minute','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-bears-endurance','phb-3.5','bears-endurance','Bear’s Endurance','phb-spell-school-transmutation',NULL,'1 standard action','standard','Touch','1 min./level','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-bulls-strength','phb-3.5','bulls-strength','Bull’s Strength','phb-spell-school-transmutation',NULL,'1 standard action','standard','Touch','1 min./level','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-resist-energy','phb-3.5','resist-energy','Resist Energy','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','10 min./level','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-shatter','phb-3.5','shatter','Shatter','phb-spell-school-evocation',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will negates (object); Will negates (object) or Fortitude half; see text','will','yes','Yes (object)'),
  ('phb-spell-deeper-darkness','phb-3.5','deeper-darkness','Deeper Darkness','phb-spell-school-evocation',NULL,'1 standard action','standard','Touch','One day/level (D)',NULL,NULL,'no','No'),
  ('phb-spell-discern-lies','phb-3.5','discern-lies','Discern Lies','phb-spell-school-divination',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Concentration, up to 1 round/level','Will negates','will','no','No');