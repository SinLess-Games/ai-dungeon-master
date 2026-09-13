# Expanded Psionics Handbook races

This seed pack materializes the Expanded Psionics Handbook playable races whose complete mechanics are available in the D&D 3.5 open SRD.

## Materialized and enabled

- Dromite
- Duergar (Psionic)
- Elan
- Half-Giant
- Maenad
- Xeph
- Blue

These rows include source identity, creature type/subtypes, size, speed, level adjustment, ability modifiers, favored class, racial power-point traits, languages, and source-backed racial/special abilities as supported by the existing schema.

## Materialized but runtime-disabled

- Unbodied

Unbodied is fully represented as a race definition with 4d8 racial Hit Dice, LA +4, incorporeal flight, ability modifiers, racial manifesting, telepathy, and its other racial abilities. It remains `is_enabled = 0` because the current character-creation/runtime path does not yet safely model a racial nonability (no Strength score) plus racial psion manifesting.

## Still catalog-only

The user's by-book list also identifies these Expanded Psionics Handbook player races:

- Githyanki
- Githzerai
- Thri-Kreen

They remain in the broader playable-race catalog for a separate sourcebook-specific materialization pass. They are intentionally not guessed or duplicated in this open-SRD pack.

## Duplicate policy

This pack never creates a second enabled shared race with the same slug. Before materializing one of its canonical rows, it removes only disabled shared placeholders for that slug. Existing enabled shared content wins, and user-owned/homebrew rows are untouched.

## Files

- `00-races.sql` — canonical race rows, ability modifiers, subtypes, and movement
- `10-traits.sql` — racial traits and reusable special/psi-like abilities
- `20-languages.sql` — XPH-specific languages and race-language joins

The SQL is designed to be idempotent. Local SQLite validation applied the pack twice with stable counts and zero duplicate shared race slugs.
