-- PHB spell dependencies referenced by Heroes of Horror class lists.
-- Canonical SRD mechanics; existing PHB rows win via INSERT OR IGNORE.
-- Safe to re-run.

INSERT OR IGNORE INTO dnd35_spells
(id,source_id,slug,name,school_id,subschool,casting_time,action_type,range_text,duration_text,saving_throw_text,save,spell_resistance,spell_resistance_text) VALUES
  ('phb-spell-summon-swarm','phb-3.5','summon-swarm','Summon Swarm','phb-spell-school-conjuration','Summoning','1 round','other','Close (25 ft. + 5 ft./2 levels)','Concentration + 2 rounds',NULL,NULL,'no','No'),
  ('phb-spell-crushing-despair','phb-3.5','crushing-despair','Crushing Despair','phb-spell-school-enchantment','Compulsion','1 standard action','standard','30 ft.','1 min./level','Will negates','will','yes','Yes'),
  ('phb-spell-death-ward','phb-3.5','death-ward','Death Ward','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','1 min./level','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-halt-undead','phb-3.5','halt-undead','Halt Undead','phb-spell-school-necromancy',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 round/level','Will negates (see text)','will','yes','Yes'),
  ('phb-spell-inflict-serious-wounds','phb-3.5','inflict-serious-wounds','Inflict Serious Wounds','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-ray-of-exhaustion','phb-3.5','ray-of-exhaustion','Ray of Exhaustion','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 min./level','Fortitude partial; see text','fort','yes','Yes'),
  ('phb-spell-speak-with-dead','phb-3.5','speak-with-dead','Speak with Dead','phb-spell-school-necromancy',NULL,'10 minutes','other','10 ft.','1 min./level','Will negates; see text','will','no','No'),
  ('phb-spell-vampiric-touch','phb-3.5','vampiric-touch','Vampiric Touch','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous/1 hour; see text',NULL,NULL,'yes','Yes'),
  ('phb-spell-bestow-curse','phb-3.5','bestow-curse','Bestow Curse','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Permanent','Will negates','will','yes','Yes'),
  ('phb-spell-contagion','phb-3.5','contagion','Contagion','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Fortitude negates','fort','yes','Yes'),
  ('phb-spell-dispel-magic','phb-3.5','dispel-magic','Dispel Magic','phb-spell-school-abjuration',NULL,'1 standard action','standard','Medium (100 ft. + 10 ft./level)','Instantaneous',NULL,NULL,'no','No'),
  ('phb-spell-enervation','phb-3.5','enervation','Enervation','phb-spell-school-necromancy',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous',NULL,NULL,'yes','Yes'),
  ('phb-spell-evards-black-tentacles','phb-3.5','evards-black-tentacles','Evard’s Black Tentacles','phb-spell-school-conjuration','Creation','1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 round/level (D)',NULL,NULL,'no','No'),
  ('phb-spell-fear','phb-3.5','fear','Fear','phb-spell-school-necromancy',NULL,'1 standard action','standard','30 ft.','1 round/level or 1 round; see text','Will partial','will','yes','Yes'),
  ('phb-spell-giant-vermin','phb-3.5','giant-vermin','Giant Vermin','phb-spell-school-transmutation',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 min./level',NULL,NULL,'yes','Yes'),
  ('phb-spell-inflict-critical-wounds','phb-3.5','inflict-critical-wounds','Inflict Critical Wounds','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Will half','will','yes','Yes'),
  ('phb-spell-phantasmal-killer','phb-3.5','phantasmal-killer','Phantasmal Killer','phb-spell-school-illusion','Phantasm','1 standard action','standard','Medium (100 ft. + 10 ft./level)','Instantaneous','Will disbelief (if interacted with), then Fortitude partial; see text','will','yes','Yes'),
  ('phb-spell-poison','phb-3.5','poison','Poison','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous; see text','Fortitude negates; see text','fort','yes','Yes'),
  ('phb-spell-blight','phb-3.5','blight','Blight','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous','Fortitude half; see text','fort','yes','Yes'),
  ('phb-spell-cloudkill','phb-3.5','cloudkill','Cloudkill','phb-spell-school-conjuration','Creation','1 standard action','standard','Medium (100 ft. + 10 ft./level)','1 min./level','Fortitude partial; see text','fort','no','No');