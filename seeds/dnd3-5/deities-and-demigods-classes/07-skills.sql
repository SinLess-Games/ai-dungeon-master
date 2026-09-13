-- Deities and Demigods prestige-class skill lists normalized to revised 3.5 skill names.
-- Wilderness Lore is represented by Survival. The obsolete 3.0 Animal Empathy skill is
-- intentionally not invented as a 3.5 skill row; its source transition is recorded in the rules seed.

WITH desired(class_slug,skill_slug) AS (VALUES
  ('berserk','climb'),('berserk','intimidate'),('berserk','jump'),('berserk','listen'),('berserk','spot'),('berserk','swim'),('berserk','survival'),
  ('justiciar-of-taiia','concentration'),('justiciar-of-taiia','diplomacy'),('justiciar-of-taiia','gather-information'),('justiciar-of-taiia','hide'),('justiciar-of-taiia','intimidate'),
  ('justiciar-of-taiia','knowledge-religion'),('justiciar-of-taiia','listen'),('justiciar-of-taiia','move-silently'),('justiciar-of-taiia','search'),('justiciar-of-taiia','sense-motive'),('justiciar-of-taiia','spellcraft'),('justiciar-of-taiia','spot'),
  ('soldier-of-light','concentration'),('soldier-of-light','craft'),('soldier-of-light','diplomacy'),('soldier-of-light','heal'),('soldier-of-light','knowledge-religion'),('soldier-of-light','profession'),('soldier-of-light','sense-motive'),('soldier-of-light','spellcraft')
)
INSERT OR IGNORE INTO dnd35_class_skills (class_id,skill_id)
SELECT c.id,s.id
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources src ON src.id=c.source_id
JOIN dnd35_skills s ON s.slug=d.skill_slug AND s.owner_user_id IS NULL
WHERE src.slug='deities-and-demigods-3-0' AND c.owner_user_id IS NULL;
