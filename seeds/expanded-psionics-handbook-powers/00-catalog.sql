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

-- XPH powers reuse the same descriptor concepts as core spells. Prefer an existing
-- shared descriptor row (normally PHB); create an XPH-owned fallback only when the
-- psionics seed is applied independently.
WITH desired(slug,name) AS (VALUES
  ('acid','Acid'),
  ('cold','Cold'),
  ('death','Death'),
  ('electricity','Electricity'),
  ('fire','Fire'),
  ('force','Force'),
  ('light','Light'),
  ('mind-affecting','Mind-Affecting'),
  ('sonic','Sonic')
)
INSERT INTO dnd35_spell_descriptors
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'xph-power-descriptor-' || d.slug,
  'xph-3.5',
  'Chapter 5',
  d.slug,
  d.name,
  'Power descriptor: ' || d.name || '.',
  'XPH power descriptor.',
  0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_spell_descriptors existing
  WHERE existing.slug = d.slug AND existing.owner_user_id IS NULL
);
