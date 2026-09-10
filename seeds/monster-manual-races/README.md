# Monster Manual playable races

This seed pack materializes the **no-retained-racial-HD** Monster Manual v3.5
player races and subraces first. These options can use the current character
creation runtime without guessing race-specific racial-HD save progression.

## Materialized and enabled

- Deep Dwarf
- Duergar
- Mountain Dwarf
- Aquatic Elf
- Drow
- Gray Elf
- Wild Elf
- Wood Elf
- Forest Gnome
- Goblin
- Hobgoblin
- Kobold
- Orc
- Githyanki
- Githzerai

The pack includes ability modifiers, size, speed, LA, favored class, subtypes,
additional movement, languages, racial traits, and named spell-like /
supernatural abilities.

## Existing canonical races reused

The broader Monster Manual list also names races that are already complete in
other seed packs. They are **not duplicated** here. Examples include Aasimar,
Doppelganger, Hound Archon, Minotaur, Ogre Mage, Svirfneblin, and the existing
Pixie variant.

## Deferred Monster Manual races

Monster races with retained racial Hit Dice are handled in later passes. The
current runtime derives BAB and all three saves from the creature-type chassis,
but humanoid racial Hit Dice can use race-specific good-save progressions
(Bugbear and Lizardfolk use good Reflex while Gnoll uses good Fortitude).
Those races are not enabled until the runtime/schema can represent their
source-accurate racial-HD progression without applying the wrong saves.

Templates such as Lycanthrope remain in the template system and are never
flattened into `dnd35_races`.

## Duplicate policy

Before materializing a canonical row, this pack removes only disabled shared
placeholders for the same slug. Existing enabled shared content wins.
User-owned/homebrew content is untouched.

## Validation

A local SQLite harness matching the affected D1 tables applied all three SQL
files twice with stable results:

- 15 race rows
- 94 normalized race traits
- 7 reusable special abilities
- 108 race-language links
- 0 duplicate shared race slugs

## Files

- `00-races.sql`
- `10-traits.sql`
- `20-languages.sql`
