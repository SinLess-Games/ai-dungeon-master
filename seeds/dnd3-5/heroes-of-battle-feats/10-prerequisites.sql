-- Heroes of Battle feat prerequisites.
WITH desired(slug,expression,explanation) AS (VALUES
  ('block-arrow','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"dex","minimum":13},{"kind":"feat","featId":"phb-feat-shield-proficiency"}]}}','Dexterity 13, Shield Proficiency.'),
  ('coordinated-shot','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"feat","featId":"phb-feat-point-blank-shot"},{"kind":"feat","featId":"phb-feat-precise-shot"}]}}','Point Blank Shot, Precise Shot.'),
  ('courageous-rally','{"version":1,"condition":{"kind":"class_feature","classFeatureId":"phb-class-feature-bard-inspire-courage"}}','Bardic music (inspire courage) class feature.'),
  ('expanded-aura-of-courage','{"version":1,"condition":{"kind":"class_feature","classFeatureId":"phb-class-feature-paladin-aura-of-courage"}}','Aura of courage class feature.'),
  ('expert-siege-engineer','{"version":1,"condition":{"kind":"skill_ranks","skillId":"phb-skill-profession","minimum":8,"specialization":"siege engineer"}}','Profession (siege engineer) 8 ranks.'),
  ('extra-followers','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"cha","minimum":13},{"kind":"feat","featId":"phb-feat-leadership"}]}}','Charisma 13, Leadership.'),
  ('improved-cohort','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"cha","minimum":15},{"kind":"feat","featId":"phb-feat-leadership"}]}}','Charisma 15, Leadership.'),
  ('inspirational-leadership','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"cha","minimum":17},{"kind":"feat","featId":"phb-feat-leadership"}]}}','Charisma 17, Leadership.'),
  ('mounted-mobility','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"feat","featId":"phb-feat-mounted-combat"},{"kind":"skill_ranks","skillId":"phb-skill-ride","minimum":4}]}}','Mounted Combat, Ride 4 ranks.'),
  ('natural-leader','{"version":1,"condition":{"kind":"ability","ability":"cha","minimum":13}}','Charisma 13.'),
  ('plunging-shot','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"dex","minimum":13},{"kind":"feat","featId":"phb-feat-point-blank-shot"}]}}','Dexterity 13, Point Blank Shot.'),
  ('practiced-cohort','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"ability","ability":"cha","minimum":15},{"kind":"feat","featId":"phb-feat-leadership"}]}}','Charisma 15, Leadership.'),
  ('ready-shot','{"version":1,"condition":{"kind":"feat","featId":"phb-feat-point-blank-shot"}}','Point Blank Shot.'),
  ('shield-wall','{"version":1,"condition":{"kind":"feat","featId":"phb-feat-shield-proficiency"}}','Shield Proficiency.'),
  ('veteran-knowledge','{"version":1,"condition":{"kind":"all","conditions":[{"kind":"base_attack_bonus","minimum":2},{"kind":"skill_ranks","skillId":"phb-skill-knowledge-history","minimum":1}]}}','Base attack bonus +2, Knowledge (history) 1 rank.')
)
INSERT INTO dnd35_feat_prerequisites (feat_id,expression,explanation)
SELECT f.id,d.expression,d.explanation
FROM desired d
JOIN dnd35_feats f ON f.slug=d.slug
JOIN dnd35_sources s ON s.id=f.source_id
WHERE s.slug='heroes-of-battle-3-5' AND f.owner_user_id IS NULL
ON CONFLICT(feat_id) DO UPDATE SET expression=excluded.expression,explanation=excluded.explanation;
