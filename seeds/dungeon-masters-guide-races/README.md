# Dungeon Master's Guide races

This seed pack materializes the two explicit playable race variants from the Dungeon Master's Guide race-customization section on page 171.

## Materialized and enabled

- Gold Dwarf
- Half-Human Elf

Gold Dwarf is a dwarf subrace that keeps the normal dwarf chassis while replacing the normal ability adjustment and orc/goblinoid combat training as specified by the DMG. Half-Human Elf keeps the normal half-elf chassis while removing the half-elf social bonus, adding elven weapon proficiencies, and using Wizard as favored class.

The inherited PHB mechanics are repeated as normalized race traits so these race definitions are self-contained at runtime rather than depending on prose inheritance.

## Duplicate policy

The canonical slugs are `gold-dwarf` and `half-human-elf`. Before materialization the pack removes only disabled shared placeholders for those slugs. Existing enabled shared content wins, and user-owned/homebrew rows are never collapsed.

## Files

- `00-races.sql` — canonical race rows, ability modifiers, favored classes, and subtypes
- `10-traits.sql` — inherited and modified racial traits
- `20-languages.sql` — automatic and bonus languages

Local SQLite validation applied the pack twice with stable counts: 2 races, 18 traits, 25 race-language links, and zero duplicate shared race slugs.
