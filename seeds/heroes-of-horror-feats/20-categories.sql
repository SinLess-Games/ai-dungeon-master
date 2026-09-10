-- Heroes of Horror feat categories.
-- The schema has no dedicated tainted or monstrous category; those source types use `other`.
WITH desired(slug,category) AS (VALUES
  ('archivist-of-nature','general'),('bane-magic','general'),('blood-calls-to-blood','general'),
  ('corrupt-spell-focus','general'),('greater-corrupt-spell-focus','general'),('disease-immunity','general'),
  ('draconic-archivist','general'),('dreamtelling','general'),('font-of-life','general'),('haunting-melody','general'),
  ('improved-oneiromancy','general'),('master-of-knowledge','general'),('oneiromancy','general'),('pure-soul','general'),
  ('spirit-sense','general'),('unnatural-will','general'),
  ('corrupt-arcana','other'),('eldritch-corruption','other'),('forbidden-lore','other'),('lunatic-insight','other'),
  ('mad-faith','other'),('surge-of-malevolence','other'),('debilitating-spell','other'),('debilitating-strike','other'),
  ('tainted-fury','other'),('touch-of-taint','other'),
  ('willing-deformity','vile'),('deformity-skin','vile'),('deformity-tall','vile'),('deformity-teeth','vile'),('deformity-tongue','vile')
)
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,d.category
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='heroes-of-horror-3-5' AND f.owner_user_id IS NULL;
