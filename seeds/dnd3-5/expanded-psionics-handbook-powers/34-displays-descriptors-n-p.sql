-- XPH N-P power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('null-psionics-field','auditory'),('null-psionics-field','visual'),
  ('oak-body','auditory'),
  ('object-reading','auditory'),('object-reading','material'),
  ('overland-flight-psionic','auditory'),
  ('painful-strike','material'),('painful-strike','visual'),
  ('personality-parasite','auditory'),('personality-parasite','visual'),
  ('phase-door-psionic','visual'),
  ('plane-shift-psionic','visual'),
  ('power-leech','visual'),
  ('power-resistance','material'),('power-resistance','visual'),
  ('precognition','visual'),
  ('precognition-defensive','material'),('precognition-defensive','visual'),
  ('precognition-greater','auditory'),('precognition-greater','visual'),
  ('precognition-offensive','material'),('precognition-offensive','visual'),
  ('prescience-offensive','material'),('prescience-offensive','visual'),
  ('prevenom','material'),
  ('prevenom-weapon','material'),
  ('prowess','mental'),
  ('psionic-blast','auditory'),
  ('psionic-lions-charge','mental'),
  ('psionic-lock','material'),
  ('psionic-repair-damage','material'),('psionic-repair-damage','visual'),
  ('psionic-scent','mental'),
  ('psychic-chirurgery','auditory'),('psychic-chirurgery','mental'),('psychic-chirurgery','visual'),
  ('psychic-crush','auditory'),
  ('psychic-reformation','auditory'),('psychic-reformation','mental'),('psychic-reformation','visual'),
  ('psychic-vampire','mental'),
  ('psychofeedback','visual')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('personality-parasite','mind-affecting'),
  ('power-leech','mind-affecting'),
  ('psionic-blast','mind-affecting'),
  ('psionic-revivify','good'),
  ('psychic-chirurgery','mind-affecting'),
  ('psychic-crush','mind-affecting'),
  ('psychic-reformation','mind-affecting')
)
INSERT OR IGNORE INTO dnd35_power_descriptor_assignments (power_id,descriptor_id)
SELECT
  p.id,
  (
    SELECT sd.id
    FROM dnd35_spell_descriptors sd
    WHERE sd.slug=d.descriptor AND sd.owner_user_id IS NULL
    ORDER BY CASE WHEN sd.source_id='phb-3.5' THEN 0 WHEN sd.source_id='xph-3.5' THEN 1 ELSE 2 END, sd.id
    LIMIT 1
  )
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL
WHERE EXISTS (
  SELECT 1 FROM dnd35_spell_descriptors sd
  WHERE sd.slug=d.descriptor AND sd.owner_user_id IS NULL
);
