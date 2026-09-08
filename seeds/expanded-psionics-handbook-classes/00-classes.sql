-- expanded-psionics-handbook-classes
-- D&D 3.5 Expanded Psionics Handbook class catalog.
-- XPH is seeded before the older Psionics Handbook so revised 3.5 class names
-- become canonical when the two books overlap.

INSERT OR IGNORE INTO dnd35_sources
  (id, slug, name, abbreviation, publisher, system, edition, description, url, is_official, is_homebrew, owner_user_id)
VALUES
  ('xph-3.5', 'expanded-psionics-handbook-3-5', 'Expanded Psionics Handbook', 'XPH',
   'Wizards of the Coast', 'dnd', '3.5',
   'D&D 3.5 revised psionics sourcebook: psionic races, classes, feats, powers, prestige classes, items, and monsters.',
   NULL, 1, 0, NULL);

WITH desired(slug, name, category, hit_die, skill_points, bab, fort, ref, will, max_level, source_page, description) AS (VALUES
  ('psion', 'Psion', 'base', 4, 2, 'half', 'poor', 'poor', 'good', 20, '19-24',
   'An Intelligence-based manifester who selects a psionic discipline and develops broad access to psionic powers.'),
  ('psychic-warrior', 'Psychic Warrior', 'base', 8, 2, 'three_quarters', 'good', 'poor', 'poor', 20, '24-26',
   'A martial manifester who combines weapon training, bonus combat feats, and a focused psychic-warrior power list.'),
  ('soulknife', 'Soulknife', 'base', 10, 4, 'three_quarters', 'poor', 'good', 'good', 20, '26-29',
   'A psionic combatant who creates and progressively enhances a mind blade and channels psychic energy through it.'),
  ('wilder', 'Wilder', 'base', 6, 4, 'three_quarters', 'poor', 'poor', 'good', 20, '29-32',
   'A Charisma-based spontaneous manifester who trades breadth of powers known for wild surge and volatile psychic power.'),

  ('cerebremancer', 'Cerebremancer', 'prestige', 4, 2, 'half', 'poor', 'poor', 'good', 10, 'prestige classes',
   'A dual-progression prestige class that advances both arcane spellcasting and existing psionic manifesting.'),
  ('elocater', 'Elocater', 'prestige', 6, 6, 'three_quarters', 'poor', 'good', 'good', 10, 'prestige classes',
   'A mobile psionic prestige class specializing in spatial awareness, impossible movement, and psychoportive combat.'),
  ('fist-of-zuoken', 'Fist of Zuoken', 'prestige', 6, 4, 'three_quarters', 'poor', 'good', 'good', 10, 'prestige classes',
   'A monk-oriented psionic prestige class that develops a Wisdom-based power progression alongside martial discipline.'),
  ('illithid-slayer', 'Illithid Slayer', 'prestige', 8, 4, 'full', 'poor', 'poor', 'good', 10, 'prestige classes',
   'A psionic hunter prestige class devoted to combating mind flayers and other chosen psionic foes.'),
  ('metamind', 'Metamind', 'prestige', 4, 2, 'half', 'poor', 'poor', 'good', 10, 'prestige classes',
   'A psionic prestige class focused on conserving, storing, and ultimately producing extraordinary reserves of power points.'),
  ('psion-uncarnate', 'Psion Uncarnate', 'prestige', 4, 2, 'half', 'poor', 'poor', 'good', 10, 'prestige classes',
   'A psionic prestige class that progressively abandons corporeal form and develops incorporeal abilities.'),
  ('pyrokineticist', 'Pyrokineticist', 'prestige', 8, 2, 'three_quarters', 'good', 'good', 'poor', 10, 'prestige classes',
   'A psionic prestige class that shapes destructive fire into weapons, mobility, defenses, and lethal supernatural attacks.'),
  ('thrallherd', 'Thrallherd', 'prestige', 4, 2, 'half', 'poor', 'poor', 'good', 10, 'prestige classes',
   'A telepathic prestige class whose psychic influence attracts a thrall and believers while advancing manifesting.'),
  ('war-mind', 'War Mind', 'prestige', 10, 2, 'full', 'good', 'good', 'poor', 10, 'prestige classes',
   'A martial psionic prestige class with its own power-point progression and combat-focused chains of personal mastery.')
)
INSERT INTO dnd35_classes
  (id, source_id, source_page, slug, name, description, rules_text,
   is_homebrew, owner_user_id, is_enabled, category, hit_die, skill_points_per_level,
   bab_progression, fort_progression, ref_progression, will_progression)
SELECT
  'xph-class-' || d.slug,
  s.id,
  d.source_page,
  d.slug,
  d.name,
  d.description,
  d.description,
  0, NULL, 1,
  d.category,
  d.hit_die,
  d.skill_points,
  d.bab,
  d.fort,
  d.ref,
  d.will
FROM desired d
CROSS JOIN dnd35_sources s
WHERE s.slug = 'expanded-psionics-handbook-3-5'
  AND s.owner_user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dnd35_classes existing
    WHERE existing.slug = d.slug
      AND existing.owner_user_id IS NULL
  );

-- Generate the normal BAB/save progressions for the 4 base and 9 prestige classes.
WITH RECURSIVE
  levels(level) AS (
    VALUES(1)
    UNION ALL
    SELECT level + 1 FROM levels WHERE level < 20
  ),
  desired(slug, max_level, bab, fort, ref, will) AS (VALUES
    ('psion', 20, 'half', 'poor', 'poor', 'good'),
    ('psychic-warrior', 20, 'three_quarters', 'good', 'poor', 'poor'),
    ('soulknife', 20, 'three_quarters', 'poor', 'good', 'good'),
    ('wilder', 20, 'three_quarters', 'poor', 'poor', 'good'),
    ('cerebremancer', 10, 'half', 'poor', 'poor', 'good'),
    ('elocater', 10, 'three_quarters', 'poor', 'good', 'good'),
    ('fist-of-zuoken', 10, 'three_quarters', 'poor', 'good', 'good'),
    ('illithid-slayer', 10, 'full', 'poor', 'poor', 'good'),
    ('metamind', 10, 'half', 'poor', 'poor', 'good'),
    ('psion-uncarnate', 10, 'half', 'poor', 'poor', 'good'),
    ('pyrokineticist', 10, 'three_quarters', 'good', 'good', 'poor'),
    ('thrallherd', 10, 'half', 'poor', 'poor', 'good'),
    ('war-mind', 10, 'full', 'good', 'good', 'poor')
  )
INSERT OR IGNORE INTO dnd35_class_levels
  (id, class_id, level, base_attack_bonus, fort, ref, will)
SELECT
  printf('xph-class-level-%s-%02d', d.slug, l.level),
  c.id,
  l.level,
  CASE d.bab
    WHEN 'full' THEN l.level
    WHEN 'three_quarters' THEN CAST((3 * l.level) / 4 AS INTEGER)
    WHEN 'half' THEN CAST(l.level / 2 AS INTEGER)
  END,
  CASE d.fort WHEN 'good' THEN 2 + CAST(l.level / 2 AS INTEGER) ELSE CAST(l.level / 3 AS INTEGER) END,
  CASE d.ref  WHEN 'good' THEN 2 + CAST(l.level / 2 AS INTEGER) ELSE CAST(l.level / 3 AS INTEGER) END,
  CASE d.will WHEN 'good' THEN 2 + CAST(l.level / 2 AS INTEGER) ELSE CAST(l.level / 3 AS INTEGER) END
FROM desired d
JOIN levels l ON l.level <= d.max_level
JOIN dnd35_classes c ON c.id = 'xph-class-' || d.slug;
