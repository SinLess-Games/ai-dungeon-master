-- Base-class entry requirements from Heroes of Horror.
-- Dread necromancers may be any non-good alignment.
WITH desired(class_slug,expression,explanation) AS (VALUES
  ('dread-necromancer',
   '{"version":1,"condition":{"kind":"alignment","allowed":["LN","N","CN","LE","NE","CE"]}}',
   'Any non-good alignment.')
)
INSERT INTO dnd35_class_prerequisites (class_id,expression,explanation)
SELECT c.id,d.expression,d.explanation
FROM desired d
JOIN dnd35_classes c ON c.slug=d.class_slug
JOIN dnd35_sources s ON s.id=c.source_id
WHERE s.slug='heroes-of-horror-3-5' AND c.owner_user_id IS NULL
ON CONFLICT(class_id) DO UPDATE SET
  expression=excluded.expression,
  explanation=excluded.explanation;
