-- Epic Level Handbook feat categories. Every ELH feat is epic; additional tags preserve its printed subtype.
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,'epic'
FROM dnd35_feats f
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='epic-level-handbook-3-0' AND f.owner_user_id IS NULL;

WITH desired(slug,category) AS (VALUES
  ('craft-epic-magic-arms-and-armor','item_creation'),('craft-epic-rod','item_creation'),('craft-epic-staff','item_creation'),
  ('craft-epic-wondrous-item','item_creation'),('forge-epic-ring','item_creation'),('scribe-epic-scroll','item_creation'),
  ('enhance-spell','metamagic'),('intensify-spell','metamagic'),
  ('epic-expanded-knowledge','psionic'),('epic-psionic-focus','psionic'),('improved-manifestation','psionic'),
  ('improved-metapsionics','psionic'),('power-knowledge','psionic'),('psicrystal-power','psionic'),
  ('negative-energy-burst','divine'),('undead-mastery','divine'),('zone-of-animation','divine'),
  ('colossal-wild-shape','wild'),('diminutive-wild-shape','wild'),('dragon-wild-shape','wild'),('fine-wild-shape','wild'),
  ('gargantuan-wild-shape','wild'),('improved-elemental-wild-shape','wild'),('magical-beast-wild-shape','wild'),
  ('plant-wild-shape','wild'),('vermin-wild-shape','wild')
)
INSERT OR IGNORE INTO dnd35_feat_category_assignments (feat_id,category)
SELECT f.id,d.category
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug AND f.owner_user_id IS NULL
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='epic-level-handbook-3-0';