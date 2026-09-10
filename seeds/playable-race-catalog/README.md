# Playable race catalog seed mirrors

These SQL files mirror the race-like rows from `docs/dnd35-playable-race-catalog/*.csv`
into database seed files.

## Safety model

The catalog CSVs contain source identity, classification, eligibility, level adjustment /
legacy ECL metadata, and verification state. They do **not** contain enough mechanics to
create a rules-complete `dnd35_races` row: size, movement, creature type, racial Hit Dice,
natural armor, ability modifiers, languages, traits, special abilities, and favored-class
data are missing for most entries.

For that reason, a race-like catalog entry that does not already exist under the same
`source_id + slug` is inserted as a **disabled placeholder**:

- `is_enabled = 0`
- `base_speed_feet = 0` is a sentinel
- `size = 'medium'` is a schema placeholder only
- catalog LA is preserved when it is a real 3.5 level adjustment
- Monster Manual II legacy PC ECL offsets are preserved in `rules_text` and are **not**
  copied into `level_adjustment`

Do not enable one of these placeholders until its full source-backed mechanics have been
materialized. Existing complete race rows are never overwritten.

## Non-race catalog rows

Template entries are intentionally not inserted into `dnd35_races`; they belong in
`dnd35_templates` and need a dedicated, source-backed template seed pass. Entries marked
`not-pc` are also excluded. `needs-review` race-like entries are present but remain disabled.

## Files

- `00-sources.sql` — source rows used by the CSV mirrors
- `10-phb-3.5.sql`
- `20-dmg-mm1-3.5.sql`
- `30-mm1-3.5.sql`
- `40-mm2-3.0.sql`
- `50-ff-3x.sql`
- `60-mm3-3.5.sql`
- `70-mm4-3.5.sql`
- `80-mm5-3.5.sql`
- `90-xph-3.5.sql`

The seed runner automatically discovers this directory. It sorts after the explicitly
preferred seed packs, so complete PHB/SRD race seeds are created first and are left intact.
