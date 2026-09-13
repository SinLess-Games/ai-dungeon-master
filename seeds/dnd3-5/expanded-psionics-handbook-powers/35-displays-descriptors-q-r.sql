-- XPH Q-R power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('quintessence','material'),
  ('read-thoughts','mental'),
  ('reality-revision','visual'),
  ('recall-agony','material'),
  ('recall-death','material'),
  ('reddopsi','auditory'),('reddopsi','mental'),('reddopsi','olfactory'),
  ('remote-view-trap','mental'),('remote-view-trap','visual'),
  ('remote-viewing','mental'),
  ('restoration-psionic','material'),
  ('restore-extremity','auditory'),
  ('retrieve','visual')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('read-thoughts','mind-affecting'),
  ('recall-agony','mind-affecting'),
  ('recall-death','death'),('recall-death','mind-affecting'),
  ('remote-view-trap','electricity')
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
