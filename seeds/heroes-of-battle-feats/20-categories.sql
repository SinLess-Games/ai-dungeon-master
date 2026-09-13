-- Heroes of Battle feat category assignments.
WITH desired(slug,category) AS (VALUES
  ('ballista-proficiency','general'),('ballista-proficiency','fighter'),
  ('block-arrow','general'),('block-arrow','fighter'),
  ('coordinated-shot','general'),('coordinated-shot','fighter'),
  ('courageous-rally','general'),
  ('expanded-aura-of-courage','general'),
  ('expert-siege-engineer','general'),('expert-siege-engineer','fighter'),
  ('guerrilla-scout','general'),
  ('guerrilla-warrior','general'),
  ('mounted-mobility','general'),('mounted-mobility','fighter'),
  ('natural-leader','general'),
  ('plunging-shot','general'),
  ('ready-shot','general'),
  ('shield-wall','general'),('shield-wall','fighter'),
  ('veteran-knowledge','general'),('veteran-knowledge','fighter'),
  ('extra-followers','other'),
  ('improved-cohort','other'),
  ('inspirational-leadership','other'),
  ('practiced-cohort','other')
)
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,d.category
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='heroes-of-battle-3-5' AND f.owner_user_id IS NULL;
