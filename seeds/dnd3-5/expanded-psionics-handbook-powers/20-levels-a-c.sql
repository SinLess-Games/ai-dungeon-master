-- XPH A-C class/discipline list levels and exact class-specific base PP costs.
-- Specialist powers use the Psion class plus specialist_discipline_id.

WITH desired(slug,class_slug,power_level,power_points,specialist) AS (VALUES
  ('adapt-body','psion',5,9,NULL),('adapt-body','wilder',5,9,NULL),('adapt-body','psychic-warrior',5,9,NULL),
  ('affinity-field','psion',9,17,NULL),('affinity-field','wilder',9,17,NULL),
  ('anchored-navigation','psion',4,7,'clairsentience'),
  ('animal-affinity','psion',2,3,'psychometabolism'),('animal-affinity','psychic-warrior',2,3,NULL),
  ('apopsi','psion',9,17,NULL),('apopsi','wilder',9,17,NULL),
  ('assimilate','psion',9,17,NULL),('assimilate','wilder',9,17,NULL),
  ('astral-caravan','psion',3,5,'psychoportation'),
  ('astral-construct','psion',1,1,'metacreativity'),
  ('astral-seed','psion',8,15,'metacreativity'),
  ('astral-traveler','psion',1,1,NULL),('astral-traveler','wilder',1,1,NULL),('astral-traveler','psychic-warrior',1,1,NULL),
  ('attraction','psion',1,1,NULL),('attraction','wilder',1,1,NULL),
  ('aura-alteration','psion',6,11,NULL),('aura-alteration','wilder',6,11,NULL),
  ('aura-sight','psion',4,7,NULL),('aura-sight','wilder',4,7,NULL),
  ('aversion','psion',2,3,'telepathy'),
  ('baleful-teleport','psion',5,9,'psychoportation'),
  ('banishment-psionic','psion',6,11,'psychoportation'),
  ('bend-reality','psion',8,15,NULL),('bend-reality','wilder',8,15,NULL),
  ('bestow-power','psion',2,3,NULL),('bestow-power','wilder',2,3,NULL),
  ('biofeedback','psion',2,3,NULL),('biofeedback','wilder',2,3,NULL),('biofeedback','psychic-warrior',1,1,NULL),
  ('bite-of-the-wolf','psychic-warrior',1,1,NULL),
  ('body-adjustment','psion',3,5,NULL),('body-adjustment','wilder',3,5,NULL),('body-adjustment','psychic-warrior',2,3,NULL),
  ('body-equilibrium','psion',2,3,NULL),('body-equilibrium','wilder',2,3,NULL),('body-equilibrium','psychic-warrior',2,3,NULL),
  ('body-purification','psion',3,5,NULL),('body-purification','wilder',3,5,NULL),('body-purification','psychic-warrior',2,3,NULL),
  ('bolt','psion',1,1,NULL),('bolt','wilder',1,1,NULL),
  ('brain-lock','psion',2,3,'telepathy'),
  ('breath-of-the-black-dragon','psion',6,11,NULL),('breath-of-the-black-dragon','wilder',6,11,NULL),('breath-of-the-black-dragon','psychic-warrior',6,11,NULL),
  ('burst','psion',1,1,'psychoportation'),('burst','psychic-warrior',1,1,NULL),
  ('call-to-mind','psion',1,1,NULL),('call-to-mind','wilder',1,1,NULL),
  ('call-weaponry','psychic-warrior',1,1,NULL),
  ('catapsi','psion',5,9,NULL),('catapsi','wilder',5,9,NULL),('catapsi','psychic-warrior',5,9,NULL),
  ('catfall','psion',1,1,NULL),('catfall','wilder',1,1,NULL),('catfall','psychic-warrior',1,1,NULL),
  ('chameleon','psion',2,1,'psychometabolism'),('chameleon','psychic-warrior',1,1,NULL),
  ('charm-psionic','psion',1,1,'telepathy'),
  ('clairtangent-hand','psion',5,9,'clairsentience'),
  ('clairvoyant-sense','psion',2,3,'clairsentience'),
  ('claw-of-energy','psychic-warrior',4,7,NULL),
  ('claws-of-the-beast','psychic-warrior',1,1,NULL),
  ('claws-of-the-vampire','psychic-warrior',3,5,NULL),
  ('cloud-mind','psion',2,3,NULL),('cloud-mind','wilder',2,3,NULL),
  ('cloud-mind-mass','psion',6,11,NULL),('cloud-mind-mass','wilder',6,11,NULL),
  ('compression','psychic-warrior',1,1,NULL),
  ('conceal-thoughts','psion',1,1,NULL),('conceal-thoughts','wilder',1,1,NULL),('conceal-thoughts','psychic-warrior',1,1,NULL),
  ('concealing-amorpha','psion',2,3,NULL),('concealing-amorpha','wilder',2,3,NULL),('concealing-amorpha','psychic-warrior',2,3,NULL),
  ('concealing-amorpha-greater','psion',3,5,'metacreativity'),('concealing-amorpha-greater','psychic-warrior',3,5,NULL),
  ('concussion-blast','psion',2,3,NULL),('concussion-blast','wilder',2,3,NULL),
  ('contingency-psionic','psion',6,11,NULL),('contingency-psionic','wilder',6,11,NULL),
  ('control-air','psion',2,3,'psychokinesis'),
  ('control-body','psion',4,7,'psychokinesis'),
  ('control-flames','psion',1,1,NULL),('control-flames','wilder',1,1,NULL),
  ('control-light','psion',1,1,NULL),('control-light','wilder',1,1,NULL),
  ('control-object','psion',1,1,'psychokinesis'),
  ('control-sound','psion',2,3,NULL),('control-sound','wilder',2,3,NULL),
  ('co-opt-concentration','psion',6,11,NULL),('co-opt-concentration','wilder',6,11,NULL),
  ('correspond','psion',4,7,NULL),('correspond','wilder',4,7,NULL),
  ('create-sound','psion',1,1,NULL),('create-sound','wilder',1,1,NULL),
  ('crisis-of-breath','psion',3,5,'telepathy'),
  ('crisis-of-life','psion',7,13,'telepathy'),
  ('crystal-shard','psion',1,1,NULL),('crystal-shard','wilder',1,1,NULL),
  ('crystallize','psion',6,11,'metacreativity')
)
INSERT INTO dnd35_power_class_levels
  (power_id,class_id,power_level,power_points,specialist_discipline_id)
SELECT
  p.id,
  c.id,
  d.power_level,
  d.power_points,
  CASE WHEN d.specialist IS NULL THEN NULL ELSE 'xph-power-discipline-' || d.specialist END
FROM desired d
JOIN dnd35_powers p ON p.slug=d.slug AND p.owner_user_id IS NULL
JOIN dnd35_classes c ON c.slug=d.class_slug AND c.owner_user_id IS NULL
ON CONFLICT(power_id,class_id) DO UPDATE SET
  power_level=excluded.power_level,
  power_points=excluded.power_points,
  specialist_discipline_id=excluded.specialist_discipline_id;
