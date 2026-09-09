-- XPH G-L power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('genesis','material'),
  ('graft-weapon','olfactory'),
  ('grease-psionic','visual'),('grease-psionic','olfactory'),
  ('grip-of-iron','visual'),
  ('hail-of-crystals','auditory'),('hail-of-crystals','visual'),
  ('hammer','auditory'),('hammer','material'),
  ('hustle','auditory'),
  ('hypercognition','mental'),
  ('id-insinuation','auditory'),
  ('identify-psionic','material'),('identify-psionic','mental'),
  ('immovability','visual'),
  ('incarnate','material'),
  ('inertial-armor','visual'),
  ('inertial-barrier','auditory'),('inertial-barrier','mental'),
  ('inflict-pain','mental'),
  ('insanity','mental'),
  ('intellect-fortress','auditory'),
  ('iron-body-psionic','auditory'),
  ('keen-edge-psionic','visual'),
  ('knock-psionic','material'),
  ('know-direction-and-location','mental'),
  ('leech-field','visual'),
  ('levitate-psionic','olfactory')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('id-insinuation','mind-affecting'),
  ('inflict-pain','mind-affecting'),
  ('insanity','mind-affecting')
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
