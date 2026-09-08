-- XPH S power displays and descriptors.

WITH desired(slug,display) AS (VALUES
  ('schism','auditory'),('schism','visual'),
  ('second-chance','mental'),
  ('sense-link','visual'),
  ('sense-link-forced','visual'),
  ('sensitivity-to-psychic-impressions','auditory'),('sensitivity-to-psychic-impressions','material'),
  ('shadow-body','auditory'),
  ('share-pain','material'),('share-pain','mental'),
  ('share-pain-forced','material'),('share-pain-forced','mental'),
  ('shatter-mind-blank','olfactory'),
  ('skate','material'),('skate','visual'),
  ('solicit-psicrystal','auditory'),
  ('steadfast-perception','visual'),
  ('stomp','auditory'),('stomp','visual'),
  ('strength-of-my-enemy','visual'),
  ('suggestion-psionic','auditory'),
  ('suspend-life','olfactory'),
  ('sustenance','material'),
  ('swarm-of-crystals','material'),
  ('synesthete','material')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
  ('schism','mind-affecting'),
  ('sense-link','mind-affecting'),
  ('sense-link-forced','mind-affecting'),
  ('suggestion-psionic','mind-affecting'),('suggestion-psionic','language-dependent')
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
