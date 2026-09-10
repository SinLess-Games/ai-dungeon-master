# D&D 3.5 Playable Race Catalog

This directory is the source-qualified inventory for playable ancestry options in **The Endless Codex**. Cataloged does not automatically mean fully materialized in executable character-creation data.

## Rules

- Expose a race to character creation only after its source entry and mechanics are verified.
- `needs-review` entries stay out of runtime character creation.
- Cohort-only or `not-pc` creatures are not player races.
- Templates stay separate from base-race selection and require template support.
- Monster Manual II uses legacy **ECL = class level + offset** wording. `legacy_ecl_offset` is preserved as source data and must not be copied into the 3.5 `level_adjustment` column.
- Expanded Psionics Handbook is the 3.5 authority for overlapping psionics material; older Psionics Handbook mechanics remain legacy data.
- No source prose is copied here; the catalog stores names, classification, LA/ECL metadata, and verification state.

## Inventory

The source CSVs contain **222 catalog rows**: **187** source-qualified PC races/monster-PC options, **17** template/transformation options, **16** entries requiring source-section review, and **2** explicit non-PC entries.

Source IDs:
- `phb-3.5` — Player’s Handbook
- `dmg-mm1-3.5` — Dungeon Master’s Guide monster-race table and common Monster Manual subraces
- `mm1-3.5` — Monster Manual I
- `mm2-3.0` — Monster Manual II legacy PC ECL entries
- `mm3-3.5` — Monster Manual III
- `mm4-3.5` — Monster Manual IV; local scan review is incomplete
- `mm5-3.5` — Monster Manual V
- `ff-3x` — Fiend Folio transition-era rules
- `xph-3.5` — Expanded Psionics Handbook

## Runtime status

The catalog now has companion executable seed packs for PHB races, DMG/MM monster PCs, a growing Monster Manual I set, and Expanded Psionics Handbook races. Materialized races include structured ability adjustments, racial Hit Dice where applicable, movement modes, languages, traits, and named special abilities.

The character-creation API no longer uses a hard-coded LA +8 ceiling: the maximum level adjustment is calculated from the enabled race data. It also exposes source metadata and normalized racial traits/special abilities for the creator UI.

Materialization is still intentionally incomplete for entries that require source review, legacy-edition reconciliation, template support, nonability support, racial spellcasting/manifesting support, or other mechanics that cannot yet be represented accurately. Those entries remain disabled rather than being filled with guessed rules.
