-- Expanded Psionics Handbook base-class skills used by character creation.
-- Core PHB skills are reused by slug; psionic-only additions are source-backed XPH rows.
WITH desired(slug,name,ability,trained_only) AS (VALUES
  ('autohypnosis','Autohypnosis','wis',1),
  ('knowledge-psionics','Knowledge (psionics)','int',1),
  ('psicraft','Psicraft','int',1),
  ('use-psionic-device','Use Psionic Device','cha',1)
)
INSERT INTO dnd35_skills
  (id,source_id,source_page,slug,name,description,rules_text,is_homebrew,owner_user_id,is_enabled,
   ability,trained_only,armor_check_multiplier,requires_specialization)
SELECT
  'xph-skill-'||d.slug,'xph-3.5','37-51',d.slug,d.name,'','',0,NULL,1,
  d.ability,d.trained_only,0,0
FROM desired d
WHERE NOT EXISTS (
  SELECT 1 FROM dnd35_skills s WHERE s.slug=d.slug AND s.owner_user_id IS NULL
);

WITH desired(class_slug,skill_slug) AS (VALUES
  -- Psion base class skills. Discipline-specific additions are resolved by the creator.
  ('psion','concentration'),
  ('psion','craft'),
  ('psion','knowledge-arcana'),
  ('psion','knowledge-dungeoneering'),
  ('psion','knowledge-engineering'),
  ('psion','knowledge-geography'),
  ('psion','knowledge-history'),
  ('psion','knowledge-local'),
  ('psion','knowledge-nature'),
  ('psion','knowledge-nobility'),
  ('psion','knowledge-religion'),
  ('psion','knowledge-planes'),
  ('psion','knowledge-psionics'),
  ('psion','profession'),
  ('psion','psicraft'),

  -- Psychic Warrior, XPH pp. 24-26.
  ('psychic-warrior','autohypnosis'),
  ('psychic-warrior','climb'),
  ('psychic-warrior','concentration'),
  ('psychic-warrior','craft'),
  ('psychic-warrior','jump'),
  ('psychic-warrior','knowledge-psionics'),
  ('psychic-warrior','profession'),
  ('psychic-warrior','ride'),
  ('psychic-warrior','search'),
  ('psychic-warrior','swim'),

  -- Soulknife, XPH pp. 26-29.
  ('soulknife','autohypnosis'),
  ('soulknife','climb'),
  ('soulknife','concentration'),
  ('soulknife','craft'),
  ('soulknife','hide'),
  ('soulknife','jump'),
  ('soulknife','knowledge-psionics'),
  ('soulknife','listen'),
  ('soulknife','move-silently'),
  ('soulknife','profession'),
  ('soulknife','spot'),
  ('soulknife','tumble'),

  -- Wilder, XPH pp. 29-32.
  ('wilder','autohypnosis'),
  ('wilder','balance'),
  ('wilder','bluff'),
  ('wilder','climb'),
  ('wilder','concentration'),
  ('wilder','craft'),
  ('wilder','escape-artist'),
  ('wilder','intimidate'),
  ('wilder','jump'),
  ('wilder','knowledge-psionics'),
  ('wilder','profession'),
  ('wilder','psicraft'),
  ('wilder','sense-motive'),
  ('wilder','spot'),
  ('wilder','swim'),
  ('wilder','tumble')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,sk.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources cs ON cs.id=c.source_id
JOIN dnd35_skills sk ON sk.slug=d.skill_slug AND sk.owner_user_id IS NULL
WHERE cs.slug='expanded-psionics-handbook-3-5' AND c.owner_user_id IS NULL;