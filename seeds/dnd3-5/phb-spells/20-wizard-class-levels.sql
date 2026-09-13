-- PHB v3.5 Wizard spell-list mappings required by the current starter spell catalog.
-- The creator derives automatic cantrips and level-1 spellbook choices from this table.
-- Safe to re-run.
INSERT OR IGNORE INTO dnd35_spell_class_levels (spell_id,class_id,spell_level) VALUES
  ('phb-spell-acid-splash','phb-class-wizard',0),
  ('phb-spell-arcane-mark','phb-class-wizard',0),
  ('phb-spell-alarm','phb-class-wizard',1),
  ('phb-spell-animate-rope','phb-class-wizard',1),
  ('phb-spell-burning-hands','phb-class-wizard',1),
  ('phb-spell-charm-person','phb-class-wizard',1),
  ('phb-spell-mage-armor','phb-class-wizard',1),
  ('phb-spell-magic-missile','phb-class-wizard',1);
