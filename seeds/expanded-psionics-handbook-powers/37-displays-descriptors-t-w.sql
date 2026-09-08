-- XPH T-W power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('telekinetic-force','visual'),
  ('telekinetic-maneuver','visual'),
  ('telekinetic-sphere-psionic','material'),
  ('telekinetic-thrust','visual'),
  ('telempathic-projection','visual'),
  ('teleport-psionic','visual'),
  ('teleport-psionic-greater','visual'),
  ('teleportation-circle-psionic','mental'),
  ('teleport-trigger','material'),
  ('thicken-skin','material'),('thicken-skin','olfactory'),
  ('thought-shield','auditory'),
  ('time-hop','auditory'),('time-hop','visual'),
  ('time-hop-mass','auditory'),('time-hop-mass','visual'),
  ('timeless-body','material'),
  ('tornado-blast','auditory'),('tornado-blast','visual'),
  ('touchsight','visual'),
  ('tower-of-iron-will','auditory'),
  ('trace-teleport','visual'),
  ('true-metabolism','material'),
  ('true-seeing-psionic','visual'),
  ('truevenom','material'),
  ('truevenom-weapon','material'),
  ('ubiquitous-vision','visual'),
  ('ultrablast','auditory'),
  ('vampiric-blade','material'),('vampiric-blade','visual'),
  ('vigor','material'),('vigor','olfactory'),
  ('wall-of-ectoplasm','visual'),
  ('wall-walker','material'),
  ('weapon-of-energy','visual')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('telekinetic-force','force'),
  ('telekinetic-maneuver','force'),
  ('telekinetic-sphere-psionic','force'),
  ('telempathic-projection','mind-affecting'),
  ('thought-shield','mind-affecting'),
  ('tongues-psionic','mind-affecting'),
  ('tower-of-iron-will','mind-affecting'),
  ('ultrablast','mind-affecting')
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
