# Spell Compendium spell seed

Generated from the attached *Spell Compendium* (Wizards of the Coast, 2005).

- Source spell-description headings: **1003**
- Unique normalized slugs in this seed: **1003**
- Class-level mappings parsed from `Level:` headers: **1907**
- Domain-level mappings parsed from `Level:` headers: **110**
- Component-code assignments: **2227**
- School assignments: **1003**
- Descriptor assignments: **447**

## Deduplication

`10-spells-*.sql` refuses to insert a shared spell row when any existing shared spell has the same normalized slug. Relationship files resolve the canonical shared spell by slug, so running this after PHB/PHB II seeds does not create a second copy of overlapping spells.

## Source abbreviations and inherited entries

Spell Compendium contains abbreviated entries that say a spell functions like another spell and list only changed fields. Required database columns that are omitted by such entries use `See rules text`; the complete extracted entry is retained in `rules_text`.

## Suggested order

1. `00-catalog.sql`
2. all `10-spells-*.sql` in numeric order
3. `20-class-levels.sql`
4. `30-domain-levels.sql`
5. `40-components.sql`
6. `50-schools-descriptors.sql`
