-- XPH A-C power displays and descriptors.

WITH desired(slug,display) AS (VALUES
 ('adapt-body','visual'),
 ('affinity-field','material'),('affinity-field','visual'),
 ('anchored-navigation','material'),('anchored-navigation','olfactory'),
 ('animal-affinity','material'),
 ('apopsi','auditory'),('apopsi','material'),('apopsi','visual'),
 ('assimilate','auditory'),('assimilate','visual'),
 ('astral-construct','visual'),
 ('astral-seed','material'),
 ('attraction','auditory'),
 ('aura-alteration','material'),
 ('aura-sight','visual'),
 ('aversion','auditory'),('aversion','material'),
 ('baleful-teleport','material'),('baleful-teleport','visual'),
 ('banishment-psionic','auditory'),('banishment-psionic','material'),
 ('bend-reality','visual'),
 ('bestow-power','mental'),
 ('biofeedback','material'),('biofeedback','visual'),
 ('bite-of-the-wolf','visual'),
 ('body-adjustment','auditory'),('body-adjustment','material'),
 ('body-equilibrium','material'),('body-equilibrium','visual'),
 ('body-purification','auditory'),('body-purification','material'),
 ('bolt','material'),
 ('brain-lock','material'),('brain-lock','visual'),
 ('breath-of-the-black-dragon','visual'),
 ('burst','auditory'),
 ('call-to-mind','mental'),
 ('call-weaponry','material'),
 ('catapsi','mental'),('catapsi','visual'),
 ('catfall','auditory'),
 ('chameleon','olfactory'),
 ('charm-psionic','mental'),
 ('clairtangent-hand','auditory'),('clairtangent-hand','mental'),('clairtangent-hand','visual'),
 ('clairvoyant-sense','auditory'),('clairvoyant-sense','visual'),
 ('claw-of-energy','visual'),
 ('claws-of-the-beast','visual'),
 ('claws-of-the-vampire','material'),('claws-of-the-vampire','visual'),
 ('compression','olfactory'),
 ('conceal-thoughts','mental'),
 ('concealing-amorpha','material'),('concealing-amorpha-greater','material'),
 ('concussion-blast','auditory'),
 ('contingency-psionic','olfactory'),
 ('control-air','mental'),
 ('control-body','material'),
 ('control-flames','auditory'),
 ('control-light','visual'),
 ('control-object','material'),
 ('control-sound','auditory'),
 ('co-opt-concentration','mental'),
 ('correspond','mental'),
 ('create-sound','auditory'),
 ('crisis-of-breath','auditory'),
 ('crisis-of-life','mental'),
 ('crystal-shard','auditory'),('crystal-shard','material'),
 ('crystallize','auditory')
)
INSERT OR IGNORE INTO dnd35_power_display_assignments (power_id,display,description)
SELECT p.id,d.display,NULL
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL;

WITH desired(slug,descriptor) AS (VALUES
 ('apopsi','mind-affecting'),
 ('attraction','mind-affecting'),
 ('aura-alteration','mind-affecting'),
 ('aversion','mind-affecting'),
 ('bestow-power','mind-affecting'),
 ('brain-lock','mind-affecting'),
 ('breath-of-the-black-dragon','acid'),
 ('catapsi','mind-affecting'),
 ('charm-psionic','mind-affecting'),
 ('cloud-mind','mind-affecting'),
 ('cloud-mind-mass','mind-affecting'),
 ('conceal-thoughts','mind-affecting'),
 ('concussion-blast','force'),
 ('control-flames','fire'),
 ('control-light','light'),
 ('control-sound','sonic'),
 ('co-opt-concentration','mind-affecting'),
 ('correspond','mind-affecting'),
 ('create-sound','sonic'),
 ('crisis-of-breath','mind-affecting'),
 ('crisis-of-life','mind-affecting'),('crisis-of-life','death')
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
