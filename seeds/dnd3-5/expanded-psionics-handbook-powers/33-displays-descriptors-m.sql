-- XPH M power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('matter-agitation','auditory'),('matter-agitation','material'),
  ('matter-manipulation','auditory'),('matter-manipulation','mental'),
  ('mental-barrier','auditory'),
  ('mental-disruption','mental'),
  ('metaconcert','visual'),
  ('metafaculty','mental'),('metafaculty','olfactory'),('metafaculty','visual'),
  ('metamorphosis','material'),('metamorphosis','olfactory'),
  ('metamorphosis-greater','material'),('metamorphosis-greater','visual'),
  ('metaphysical-claw','auditory'),
  ('metaphysical-weapon','auditory'),
  ('microcosm','material'),
  ('mind-blank-personal','olfactory'),
  ('mind-blank-psionic','olfactory'),
  ('mind-probe','auditory'),('mind-probe','material'),('mind-probe','visual'),
  ('mind-seed','mental'),
  ('mind-switch','visual'),
  ('mind-switch-true','visual'),
  ('mind-thrust','auditory'),
  ('mind-trap','auditory'),
  ('mindlink','mental'),
  ('mindlink-thieving','mental'),
  ('mindwipe','auditory'),('mindwipe','mental'),('mindwipe','visual'),
  ('minor-creation-psionic','material'),
  ('missive','mental'),
  ('missive-mass','mental'),
  ('modify-memory-psionic','mental'),
  ('moment-of-prescience-psionic','visual'),
  ('my-light','auditory'),('my-light','visual')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('mental-disruption','mind-affecting'),
  ('metaconcert','mind-affecting'),
  ('microcosm','mind-affecting'),
  ('mind-blank-personal','mind-affecting'),
  ('mind-blank-psionic','mind-affecting'),
  ('mind-probe','mind-affecting'),
  ('mind-seed','evil'),('mind-seed','mind-affecting'),
  ('mind-switch','mind-affecting'),
  ('mind-switch-true','mind-affecting'),
  ('mind-thrust','mind-affecting'),
  ('mind-trap','mind-affecting'),
  ('mindlink','mind-affecting'),
  ('mindlink-thieving','mind-affecting'),
  ('mindwipe','mind-affecting'),
  ('missive','mind-affecting'),('missive','language-dependent'),
  ('missive-mass','mind-affecting'),('missive-mass','language-dependent'),
  ('modify-memory-psionic','mind-affecting'),
  ('my-light','light')
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
