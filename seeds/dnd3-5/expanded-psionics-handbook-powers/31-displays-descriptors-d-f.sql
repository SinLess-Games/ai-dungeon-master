-- XPH D-F power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('danger-sense','visual'),
  ('darkvision-psionic','visual'),
  ('daze-psionic','material'),('daze-psionic','mental'),
  ('death-urge','mental'),
  ('deceleration','auditory'),('deceleration','material'),
  ('decerebrate','mental'),
  ('deja-vu','mental'),
  ('demoralize','mental'),('demoralize','olfactory'),
  ('destiny-dissonance','material'),('destiny-dissonance','mental'),
  ('detect-hostile-intent','olfactory'),
  ('detect-psionics','auditory'),('detect-psionics','visual'),
  ('detect-remote-viewing','mental'),('detect-remote-viewing','visual'),
  ('detect-teleportation','visual'),
  ('dimension-door-psionic','visual'),
  ('dimension-slide','visual'),
  ('dimension-swap','visual'),
  ('dimensional-anchor-psionic','auditory'),
  ('disable','visual'),
  ('disintegrate-psionic','auditory'),('disintegrate-psionic','material'),('disintegrate-psionic','visual'),
  ('dismissal-psionic','auditory'),
  ('dismiss-ectoplasm','auditory'),('dismiss-ectoplasm','visual'),
  ('dispel-psionics','visual'),
  ('dispelling-buffer','material'),('dispelling-buffer','olfactory'),
  ('dissipating-touch','auditory'),('dissipating-touch','visual'),
  ('dissolving-touch','visual'),
  ('dissolving-weapon','visual'),
  ('distract','mental'),
  ('divert-teleport','visual'),
  ('divination-psionic','mental'),('divination-psionic','visual'),
  ('dominate-psionic','mental'),
  ('dream-travel','visual'),
  ('duodimensional-claw','material'),

  ('ecto-protection','visual'),
  ('ectoplasmic-cocoon','auditory'),('ectoplasmic-cocoon','material'),
  ('ectoplasmic-cocoon-mass','auditory'),('ectoplasmic-cocoon-mass','material'),
  ('ectoplasmic-form','olfactory'),
  ('ectoplasmic-shambler','auditory'),('ectoplasmic-shambler','material'),('ectoplasmic-shambler','olfactory'),
  ('ego-whip','auditory'),
  ('elfsight','visual'),
  ('empathic-feedback','auditory'),('empathic-feedback','material'),
  ('empathic-transfer','auditory'),('empathic-transfer','material'),
  ('empathic-transfer-hostile','auditory'),('empathic-transfer-hostile','material'),
  ('empathy','mental'),
  ('empty-mind','auditory'),
  ('energy-adaptation','visual'),
  ('energy-adaptation-specified','visual'),
  ('energy-ball','auditory'),
  ('energy-bolt','auditory'),
  ('energy-burst','auditory'),
  ('energy-cone','auditory'),
  ('energy-conversion','mental'),
  ('energy-current','visual'),
  ('energy-missile','auditory'),
  ('energy-push','auditory'),('energy-push','visual'),
  ('energy-ray','auditory'),
  ('energy-retort','visual'),
  ('energy-stun','auditory'),
  ('energy-wall','auditory'),
  ('energy-wave','auditory'),
  ('entangling-ectoplasm','material'),('entangling-ectoplasm','visual'),
  ('eradicate-invisibility','visual'),
  ('ethereal-jaunt-psionic','visual'),
  ('evade-burst','material'),
  ('exhalation-of-the-black-dragon','visual'),
  ('expansion','olfactory'),

  ('fabricate-psionic','material'),
  ('fabricate-greater-psionic','material'),
  ('false-sensory-input','mental'),
  ('far-hand','visual'),
  ('fate-link','olfactory'),
  ('fate-of-one','mental'),('fate-of-one','visual'),
  ('feat-leech','mental'),('feat-leech','visual'),
  ('fiery-discorporation','visual'),
  ('fission','olfactory'),
  ('float','auditory'),
  ('fly-psionic','auditory'),
  ('force-screen','auditory'),
  ('form-of-doom','visual'),
  ('freedom-of-movement-psionic','auditory'),
  ('fuse-flesh','visual'),
  ('fusion','auditory'),('fusion','material'),('fusion','visual')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('daze-psionic','mind-affecting'),
  ('death-urge','mind-affecting'),
  ('deja-vu','mind-affecting'),
  ('demoralize','mind-affecting'),
  ('detect-hostile-intent','mind-affecting'),
  ('disable','mind-affecting'),
  ('dominate-psionic','mind-affecting'),
  ('dissolving-touch','acid'),
  ('dissolving-weapon','acid'),
  ('ego-whip','mind-affecting'),
  ('empathic-feedback','mind-affecting'),
  ('empathic-transfer-hostile','mind-affecting'),
  ('empathy','mind-affecting'),
  ('empty-mind','mind-affecting'),
  ('exhalation-of-the-black-dragon','acid'),
  ('false-sensory-input','mind-affecting'),
  ('fiery-discorporation','fire')
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
