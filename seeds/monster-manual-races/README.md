# Monster Manual playable races

This seed pack materializes source-backed **Monster Manual v3.5** player races for The Endless Codex. It now includes ordinary humanoid/subrace options, retained-racial-HD monster PCs, movement modes, languages, racial traits, named special abilities, and the race-specific progression exceptions needed by the character creator.

## Materialized here

### No retained racial Hit Dice

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
- Tiefling
- Pixie (base LA +4 version)
- Merfolk

### Retained racial Hit Dice

- Astral Deva
- Azer
- Aranea
- Bralani Eladrin
- Bugbear
- Centaur
- Couatl
- Djinni
- Drider
- Erinyes
- Gargoyle
- Gnoll
- Hill Giant
- Janni
- Kuo-toa
- Lamia
- Lillend
- Lizardfolk
- Locathah
- Mind Flayer
- Ogre
- Satyr
- Stone Giant
- Triton
- Troglodyte
- Troll
- Xill
- Yuan-ti Abomination
- Yuan-ti Halfblood
- Yuan-ti Pureblood

## Existing canonical races reused

The wider Monster Manual/DMG player-race set also includes races already materialized in other seed packs. They are not duplicated here when an enabled shared canonical row exists. Examples include Aasimar, Doppelganger, Hound Archon, Minotaur, Ogre Mage, Svirfneblin, Trumpet Archon, and the existing Pixie variant with irresistible dance.

## Accuracy rules

- Monster-PC ECL is racial Hit Dice + class levels + level adjustment.
- General feats earned from racial Hit Dice are allocated from total Hit Dice; `bonus_feats_at_first_level` is reserved for true selectable racial bonus feats.
- Monster-entry skills are racial-HD class skills.
- Humanoid racial Hit Dice can have race-specific good-save progressions, so source-backed overrides are used where the generic creature-type chassis is insufficient.
- A creature with 1 racial Hit Die or less uses its first class level instead of retaining that racial Hit Die when required by the DMG monster-PC rules.
- Fixed racial bonus feats are currently recorded as traits where the runtime does not yet have a dedicated fixed-race-feat grant model.
- Racial spellcasting and similar abilities are stored as normalized traits/special abilities even when the character runtime does not yet automate every downstream spell-selection rule.

## Intentionally deferred

A catalog row is not enabled merely because a source prints a numeric level adjustment. Entries remain disabled when accurate implementation requires mechanics the runtime cannot safely represent yet, such as the DMG low-ability-score lookup conversion, nonabilities, template application, or unresolved source verification. Cohort-only creatures and explicit non-PC entries are excluded.

Medusa and Invisible Stalker are specifically not player races in their v3.5 Monster Manual entries: both have level adjustment `—`, so they remain excluded from runtime race materialization.

## Files

Files are ordered numerically. Each materialization batch generally consists of a race-definition file followed by trait/special-ability and language files. Re-running the seed pack is intended to be idempotent and preserves enabled shared canonical content instead of creating duplicate race slugs.
