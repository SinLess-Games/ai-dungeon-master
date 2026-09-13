# Playable race catalog seed mirrors

This seed pack materializes both the existing CSV race catalog and the user's by-book
playable-race index as database seed rows.

## Duplicate policy

The by-book index contains **424 source-list entries across 59 books/magazines**.
Equivalent entries are canonicalized by shared race slug before SQL generation, leaving
**354 unique race options**. The Player's Handbook core seven are not re-seeded here
because `seeds/dnd3-5/phb-races/` already owns those complete rows.

The generated SQL never creates a second canonical shared race when one already exists:

- an existing enabled race wins;
- an earlier canonical `userlist-race-*` row wins;
- an existing row from the same source wins;
- a disabled placeholder from a different source does not block the canonical by-book row;
- `zz-dedupe.sql` removes superseded disabled placeholders at the end.

This applies only to shared seeded content (`owner_user_id IS NULL`). It does not collapse
user-owned/homebrew content.

## Placeholder safety

The by-book list identifies playable options and source books, but it does not include
the complete mechanics needed for a rules-valid race. Newly discovered rows remain disabled:

- `is_enabled = 0`
- `base_speed_feet = 0` is a sentinel
- `size = 'medium'` is a schema placeholder only
- known LA is inherited from an older catalog row with the same slug when available
- creature type, RHD, movement, ability modifiers, languages, traits, special abilities,
  favored class, and other mechanics still require source-backed materialization

Existing complete rows are never overwritten.

## Existing CSV mirror files

- `00-sources.sql`
- `10-phb-3.5.sql`
- `20-dmg-mm1-3.5.sql`
- `30-mm1-3.5.sql`
- `40-mm2-3.0.sql`
- `50-ff-3x.sql`
- `60-mm3-3.5.sql`
- `70-mm4-3.5.sql`
- `80-mm5-3.5.sql`
- `90-xph-3.5.sql`

## Additional by-book seed files

- `100-by-book-playable-races.sql` — canonical sourcebook/magazine rows from the supplied by-book list
- `zz-dedupe.sql` — final canonical shared-slug cleanup

The seed runner discovers this directory automatically after the preferred complete seed
packs, so complete PHB/SRD content exists before placeholders are considered.
