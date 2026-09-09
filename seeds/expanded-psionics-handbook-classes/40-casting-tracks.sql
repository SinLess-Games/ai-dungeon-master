-- XPH class casting-track definitions used by character creation and runtime manifesting.
WITH desired(class_slug, ability, progression_key, rules_text) AS (VALUES
  ('psion','int','xph-psion','Intelligence-based psionic manifesting; powers known and power points come from the psion class-level progression.'),
  ('psychic-warrior','wis','xph-psychic-warrior','Wisdom-based psionic manifesting; powers known and power points come from the psychic warrior class-level progression.'),
  ('wilder','cha','xph-wilder','Charisma-based psionic manifesting; powers known and power points come from the wilder class-level progression.'),
  ('fist-of-zuoken','wis','xph-fist-of-zuoken','Wisdom-based psionic manifesting using the class own progression.'),
  ('war-mind','wis','xph-war-mind','Wisdom-based psionic manifesting using the class own progression.')
)
INSERT INTO dnd35_class_spellcasting
  (id,class_id,spell_list_class_id,track_key,tradition,casting_mode,casting_ability,
   list_behavior,known_behavior,caster_level_numerator,caster_level_denominator,
   progression_key,rules_text)
SELECT
  'xph-class-spellcasting-'||d.class_slug,
  c.id,
  NULL,
  'primary',
  'psionic',
  'psionic',
  d.ability,
  'own',
  'limited',
  1,
  1,
  d.progression_key,
  d.rules_text
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='expanded-psionics-handbook-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id,track_key) DO UPDATE SET
  tradition=excluded.tradition,
  casting_mode=excluded.casting_mode,
  casting_ability=excluded.casting_ability,
  list_behavior=excluded.list_behavior,
  known_behavior=excluded.known_behavior,
  caster_level_numerator=excluded.caster_level_numerator,
  caster_level_denominator=excluded.caster_level_denominator,
  progression_key=excluded.progression_key,
  rules_text=excluded.rules_text;