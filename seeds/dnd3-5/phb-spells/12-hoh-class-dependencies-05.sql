-- PHB spell dependencies referenced by Heroes of Horror class lists.
-- Canonical SRD mechanics; existing PHB rows win via INSERT OR IGNORE.
-- Safe to re-run.

INSERT OR IGNORE INTO dnd35_spells
(id,source_id,slug,name,school_id,subschool,casting_time,action_type,range_text,duration_text,saving_throw_text,save,spell_resistance,spell_resistance_text) VALUES
  ('phb-spell-magic-weapon-greater','phb-3.5','magic-weapon-greater','Magic Weapon, Greater','phb-spell-school-transmutation',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 hour/level','Will negates (harmless, object)','will','yes','Yes (harmless, object)'),
  ('phb-spell-haste','phb-3.5','haste','Haste','phb-spell-school-transmutation',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 round/level','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-protection-from-energy','phb-3.5','protection-from-energy','Protection from Energy','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','10 min./level or until discharged','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-remove-curse','phb-3.5','remove-curse','Remove Curse','phb-spell-school-abjuration',NULL,'1 standard action','standard','Touch','Instantaneous','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-slow','phb-3.5','slow','Slow','phb-spell-school-transmutation',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','1 round/level','Will negates','will','yes','Yes'),
  ('phb-spell-freedom-of-movement','phb-3.5','freedom-of-movement','Freedom of Movement','phb-spell-school-abjuration',NULL,'1 standard action','standard','Personal or touch','10 min./level','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-bless','phb-3.5','bless','Bless','phb-spell-school-enchantment','Compulsion','1 standard action','standard','50 ft.','1 min./level',NULL,NULL,'yes','Yes (harmless)'),
  ('phb-spell-restoration-lesser','phb-3.5','restoration-lesser','Restoration, Lesser','phb-spell-school-conjuration','Healing','3 rounds','other','Touch','Instantaneous','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-remove-fear','phb-3.5','remove-fear','Remove Fear','phb-spell-school-abjuration',NULL,'1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','10 minutes; see text','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-delay-poison','phb-3.5','delay-poison','Delay Poison','phb-spell-school-conjuration','Healing','1 standard action','standard','Touch','1 hour/level','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-remove-paralysis','phb-3.5','remove-paralysis','Remove Paralysis','phb-spell-school-conjuration','Healing','1 standard action','standard','Close (25 ft. + 5 ft./2 levels)','Instantaneous','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-deep-slumber','phb-3.5','deep-slumber','Deep Slumber','phb-spell-school-enchantment','Compulsion','1 round','other','Close (25 ft. + 5 ft./2 levels)','1 min./level','Will negates','will','yes','Yes'),
  ('phb-spell-remove-blindness-deafness','phb-3.5','remove-blindness-deafness','Remove Blindness/Deafness','phb-spell-school-conjuration','Healing','1 standard action','standard','Touch','Instantaneous','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-remove-disease','phb-3.5','remove-disease','Remove Disease','phb-spell-school-conjuration','Healing','1 standard action','standard','Touch','Instantaneous','Fortitude negates (harmless)','fort','yes','Yes (harmless)'),
  ('phb-spell-break-enchantment','phb-3.5','break-enchantment','Break Enchantment','phb-spell-school-abjuration',NULL,'1 minute','other','Close (25 ft. + 5 ft./2 levels)','Instantaneous','See text',NULL,'no','No'),
  ('phb-spell-neutralize-poison','phb-3.5','neutralize-poison','Neutralize Poison','phb-spell-school-conjuration','Healing','1 standard action','standard','Touch','10 min./level','Will negates (harmless, object)','will','yes','Yes (harmless, object)'),
  ('phb-spell-restoration','phb-3.5','restoration','Restoration','phb-spell-school-conjuration','Healing','3 rounds','other','Touch','Instantaneous','Will negates (harmless)','will','yes','Yes (harmless)'),
  ('phb-spell-animate-dead','phb-3.5','animate-dead','Animate Dead','phb-spell-school-necromancy',NULL,'1 standard action','standard','Touch','Instantaneous',NULL,NULL,'no','No');