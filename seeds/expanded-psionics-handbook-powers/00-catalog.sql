-- expanded-psionics-handbook-powers
-- D&D 3.5 Expanded Psionics Handbook power catalog primitives.
-- The attached XPH is the source being represented; the OGL 3.5 SRD is used as a
-- transcription cross-check where the scan's text layer is unreliable.

INSERT OR IGNORE INTO dnd35_sources
  (id, slug, name, abbreviation, publisher, system, edition, description, url, is_official, is_homebrew, owner_user_id)
VALUES
  ('xph-3.5', 'expanded-psionics-handbook-3-5', 'Expanded Psionics Handbook', 'XPH',
   'Wizards of the Coast', 'dnd', '3.5',
   'D&D 3.5 revised psionics sourcebook: psionic races, classes, feats, powers, prestige classes, items, and monsters.',
   NULL, 1, 0, NULL);

INSERT OR IGNORE INTO dnd35_power_disciplines
  (id, source_id, source_page, slug, name, description, rules_text,
   is_homebrew, owner_user_id, is_enabled, specialist_name)
VALUES
  ('xph-power-discipline-clairsentience','xph-3.5','Chapter 5','clairsentience','Clairsentience',
   'Psionic discipline concerned with extrasensory perception, precognition, and knowledge.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Seer'),
  ('xph-power-discipline-metacreativity','xph-3.5','Chapter 5','metacreativity','Metacreativity',
   'Psionic discipline concerned with creating objects and creatures from ectoplasm.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Shaper'),
  ('xph-power-discipline-psychokinesis','xph-3.5','Chapter 5','psychokinesis','Psychokinesis',
   'Psionic discipline concerned with manipulating matter and energy through mental force.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Kineticist'),
  ('xph-power-discipline-psychometabolism','xph-3.5','Chapter 5','psychometabolism','Psychometabolism',
   'Psionic discipline concerned with altering and healing living bodies.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Egoist'),
  ('xph-power-discipline-psychoportation','xph-3.5','Chapter 5','psychoportation','Psychoportation',
   'Psionic discipline concerned with movement through space, dimensions, and planes.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Nomad'),
  ('xph-power-discipline-telepathy','xph-3.5','Chapter 5','telepathy','Telepathy',
   'Psionic discipline concerned with communication, influence, and direct interaction between minds.',
   'Expanded Psionics Handbook discipline.',0,NULL,1,'Telepath');

-- XPH powers reuse the core PHB descriptor vocabulary. Add any descriptor that a
-- standalone psionics seed may need if the PHB spell catalog has not been applied yet.
INSERT OR IGNORE INTO dnd35_spell_descriptors
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
VALUES
  ('xph-power-descriptor-acid','xph-3.5','Chapter 5','acid','Acid','Power descriptor: Acid.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-cold','xph-3.5','Chapter 5','cold','Cold','Power descriptor: Cold.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-death','xph-3.5','Chapter 5','death','Death','Power descriptor: Death.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-electricity','xph-3.5','Chapter 5','electricity','Electricity','Power descriptor: Electricity.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-fire','xph-3.5','Chapter 5','fire','Fire','Power descriptor: Fire.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-force','xph-3.5','Chapter 5','force','Force','Power descriptor: Force.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-light','xph-3.5','Chapter 5','light','Light','Power descriptor: Light.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-mind-affecting','xph-3.5','Chapter 5','mind-affecting','Mind-Affecting','Power descriptor: Mind-Affecting.','XPH power descriptor.',0,NULL,1),
  ('xph-power-descriptor-sonic','xph-3.5','Chapter 5','sonic','Sonic','Power descriptor: Sonic.','XPH power descriptor.',0,NULL,1);
