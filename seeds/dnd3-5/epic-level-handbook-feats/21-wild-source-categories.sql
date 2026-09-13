-- Source-name corrections from Table 1-36 are inserted in 02-source-normalization.sql.
-- Apply their printed Wild feat subtype after normalization.
WITH desired(slug) AS (VALUES
  ('beast-companion'),
  ('beast-wild-shape')
)
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,'wild'
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug AND f.owner_user_id IS NULL
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='epic-level-handbook-3-0';