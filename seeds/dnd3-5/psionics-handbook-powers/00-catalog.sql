-- D&D 3.0 Psionics Handbook power catalog primitives.
-- This source is intentionally edition-scoped (`ph3e-*`) so revised XPH 3.5
-- content and original 3.0 mechanics can coexist without duplicate identifiers.

INSERT OR IGNORE INTO dnd35_sources
  (id,slug,name,abbreviation,publisher,system,edition,description,url,is_official,is_homebrew,owner_user_id)
VALUES
  ('ph3e-3.0','psionics-handbook-3-0','Psionics Handbook','PsiHB',
   'Wizards of the Coast','dnd','3.0',
   'D&D 3.0 Psionics Handbook, including the official errata appended to the supplied source PDF.',
   NULL,1,0,NULL);

WITH desired(slug,name,specialist_name,description) AS (VALUES
  ('clairsentience','Clairsentience','Seer','D&D 3.0 discipline of extrasensory perception, foresight, and knowledge.'),
  ('metacreativity','Metacreativity','Shaper','D&D 3.0 discipline of creating objects and creatures from ectoplasm.'),
  ('psychokinesis','Psychokinesis','Savant','D&D 3.0 discipline of manipulating matter and energy with mental force.'),
  ('psychometabolism','Psychometabolism','Egoist','D&D 3.0 discipline of altering living bodies and physiology.'),
  ('psychoportation','Psychoportation','Nomad','D&D 3.0 discipline of movement through space, dimensions, planes, and time.'),
  ('telepathy','Telepathy','Telepath','D&D 3.0 discipline of communication, influence, and direct interaction between minds.')
)
INSERT INTO dnd35_power_disciplines
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,specialist_name)
SELECT
  'ph3e-power-discipline-'||d.slug,'ph3e-3.0','38-40','ph3e-'||d.slug,d.name,
  d.description,d.description,0,NULL,1,d.specialist_name
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_power_disciplines p
  WHERE p.slug='ph3e-'||d.slug AND p.owner_user_id IS NULL
);

-- Power descriptors reuse an existing shared descriptor when available. If the
-- psionics source is seeded independently, create an edition-owned fallback.
WITH desired(slug,name) AS (VALUES
  ('acid','Acid'),
  ('chaotic','Chaotic'),
  ('cold','Cold'),
  ('compulsion','Compulsion'),
  ('darkness','Darkness'),
  ('death','Death'),
  ('electricity','Electricity'),
  ('evil','Evil'),
  ('fear','Fear'),
  ('fire','Fire'),
  ('force','Force'),
  ('good','Good'),
  ('language-dependent','Language-Dependent'),
  ('lawful','Lawful'),
  ('light','Light'),
  ('mind-affecting','Mind-Affecting'),
  ('sonic','Sonic'),
  ('teleportation','Teleportation')
)
INSERT INTO dnd35_spell_descriptors
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled)
SELECT
  'ph3e-power-descriptor-'||d.slug,'ph3e-3.0','50',d.slug,d.name,
  'D&D 3.0 psionic power descriptor: '||d.name||'.',
  'Psionics Handbook Chapter 5 descriptor.',0,NULL,1
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_spell_descriptors x
  WHERE x.slug=d.slug AND x.owner_user_id IS NULL
);
