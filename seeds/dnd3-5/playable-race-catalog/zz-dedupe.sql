-- Final shared-slug cleanup for generated playable-race placeholders.
-- Complete enabled races always win. Canonical user-list rows win over older
-- disabled CSV-mirror placeholders. User-owned/homebrew races are untouched.

DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND (id LIKE 'catalog-race-%' OR id LIKE 'userlist-race-%')
  AND EXISTS (
    SELECT 1
    FROM dnd35_races better
    WHERE better.owner_user_id IS NULL
      AND better.slug=dnd35_races.slug
      AND better.id<>dnd35_races.id
      AND (
        better.is_enabled=1
        OR (
          dnd35_races.id LIKE 'catalog-race-%'
          AND better.id LIKE 'userlist-race-%'
        )
      )
  );

-- If the older CSV mirrors themselves contained the same shared slug more than
-- once and no complete/user-list row exists, keep one deterministic placeholder.
-- Prefer known LA, then the lexicographically first id.
DELETE FROM dnd35_races
WHERE owner_user_id IS NULL
  AND is_enabled=0
  AND id LIKE 'catalog-race-%'
  AND EXISTS (
    SELECT 1
    FROM dnd35_races other
    WHERE other.owner_user_id IS NULL
      AND other.is_enabled=0
      AND other.id LIKE 'catalog-race-%'
      AND other.slug=dnd35_races.slug
      AND other.id<>dnd35_races.id
      AND (
        (dnd35_races.level_adjustment IS NULL AND other.level_adjustment IS NOT NULL)
        OR (
          (dnd35_races.level_adjustment IS NULL)=(other.level_adjustment IS NULL)
          AND other.id<dnd35_races.id
        )
      )
  );
