-- Expanded Psionics Handbook manifesting progressions.
-- Cumulative base power points, powers known, and maximum power level.

WITH desired(class_slug, level, base_power_points, powers_known, max_power_level) AS (VALUES
  ('psion', 1, 2, 3, 1), ('psion', 2, 6, 5, 1), ('psion', 3, 11, 7, 2), ('psion', 4, 17, 9, 2),
  ('psion', 5, 25, 11, 3), ('psion', 6, 35, 13, 3), ('psion', 7, 46, 15, 4), ('psion', 8, 58, 17, 4),
  ('psion', 9, 72, 19, 5), ('psion', 10, 88, 21, 5), ('psion', 11, 106, 22, 6), ('psion', 12, 126, 24, 6),
  ('psion', 13, 147, 25, 7), ('psion', 14, 170, 27, 7), ('psion', 15, 195, 28, 8), ('psion', 16, 221, 30, 8),
  ('psion', 17, 250, 31, 9), ('psion', 18, 280, 33, 9), ('psion', 19, 311, 34, 9), ('psion', 20, 343, 36, 9),

  ('psychic-warrior', 1, 0, 1, 1), ('psychic-warrior', 2, 1, 2, 1), ('psychic-warrior', 3, 3, 3, 1),
  ('psychic-warrior', 4, 5, 4, 2), ('psychic-warrior', 5, 7, 5, 2), ('psychic-warrior', 6, 11, 6, 2),
  ('psychic-warrior', 7, 15, 7, 3), ('psychic-warrior', 8, 19, 8, 3), ('psychic-warrior', 9, 23, 9, 3),
  ('psychic-warrior', 10, 27, 10, 4), ('psychic-warrior', 11, 35, 11, 4), ('psychic-warrior', 12, 43, 12, 4),
  ('psychic-warrior', 13, 51, 13, 5), ('psychic-warrior', 14, 59, 14, 5), ('psychic-warrior', 15, 67, 15, 5),
  ('psychic-warrior', 16, 79, 16, 6), ('psychic-warrior', 17, 91, 17, 6), ('psychic-warrior', 18, 103, 18, 6),
  ('psychic-warrior', 19, 115, 19, 6), ('psychic-warrior', 20, 127, 20, 6),

  ('wilder', 1, 2, 1, 1), ('wilder', 2, 6, 2, 1), ('wilder', 3, 11, 2, 1), ('wilder', 4, 17, 3, 2),
  ('wilder', 5, 25, 3, 2), ('wilder', 6, 35, 4, 3), ('wilder', 7, 46, 4, 3), ('wilder', 8, 58, 5, 4),
  ('wilder', 9, 72, 5, 4), ('wilder', 10, 88, 6, 5), ('wilder', 11, 106, 6, 5), ('wilder', 12, 126, 7, 6),
  ('wilder', 13, 147, 7, 6), ('wilder', 14, 170, 8, 7), ('wilder', 15, 195, 8, 7), ('wilder', 16, 221, 9, 8),
  ('wilder', 17, 250, 9, 8), ('wilder', 18, 280, 10, 9), ('wilder', 19, 311, 10, 9), ('wilder', 20, 343, 11, 9),

  ('fist-of-zuoken', 1, 1, 1, 1), ('fist-of-zuoken', 2, 3, 2, 1), ('fist-of-zuoken', 3, 6, 3, 2),
  ('fist-of-zuoken', 4, 10, 4, 2), ('fist-of-zuoken', 5, 15, 5, 3), ('fist-of-zuoken', 6, 23, 6, 3),
  ('fist-of-zuoken', 7, 31, 7, 4), ('fist-of-zuoken', 8, 43, 8, 4), ('fist-of-zuoken', 9, 55, 9, 5),
  ('fist-of-zuoken', 10, 71, 10, 5),

  ('war-mind', 1, 2, 1, 1), ('war-mind', 2, 5, 2, 1), ('war-mind', 3, 9, 2, 1), ('war-mind', 4, 14, 3, 2),
  ('war-mind', 5, 20, 3, 2), ('war-mind', 6, 28, 4, 3), ('war-mind', 7, 37, 4, 3), ('war-mind', 8, 47, 5, 4),
  ('war-mind', 9, 58, 5, 4), ('war-mind', 10, 70, 6, 5)
)
UPDATE dnd35_class_levels AS cl
SET
  base_power_points = (
    SELECT d.base_power_points FROM desired d
    JOIN dnd35_classes c ON c.slug = d.class_slug AND c.id = cl.class_id
    WHERE d.level = cl.level
  ),
  powers_known = (
    SELECT d.powers_known FROM desired d
    JOIN dnd35_classes c ON c.slug = d.class_slug AND c.id = cl.class_id
    WHERE d.level = cl.level
  ),
  max_power_level = (
    SELECT d.max_power_level FROM desired d
    JOIN dnd35_classes c ON c.slug = d.class_slug AND c.id = cl.class_id
    WHERE d.level = cl.level
  )
WHERE EXISTS (
  SELECT 1 FROM desired d
  JOIN dnd35_classes c ON c.slug = d.class_slug AND c.id = cl.class_id
  WHERE d.level = cl.level
);
