# D&D 3.5 persistence schema

The schema defines **93 D&D tables** under `src/infrastructure/database/schema/dnd35/`. The root database barrel exports them alongside the existing feedback schema. SQLite table names use the `dnd35_` prefix to keep the ruleset distinct from future generic engine modules. All requested files contain implemented definitions or a deliberate shared schema abstraction.

## Content and ownership

`source.ts` defines source catalogs. `contentReference.ts` supplies fresh common column builders, direct source foreign keys, and source/slug/owner uniqueness. Every rules definition requires a source, including custom sources for homebrew. `sourcePage` permits page ranges and chapter/section citations. Different printings can be separate source-scoped definitions; multiple citations per definition are deliberately not a polymorphic registry.

Shared catalog slugs are protected by a partial unique index for NULL ownership. A second unique index protects each owner's slugs. Names may repeat. Definitions have descriptions, rules text, homebrew/enabled flags, nullable auth ownership, and timestamps. The source must be created before its content, and referenced sources cannot be deleted. Campaign source restrictions can later reference these real source IDs from the generic campaign module.

Tables use text UUID primary keys, except extension and join keys. UUID defaults execute in Drizzle, so raw SQL importers must supply IDs. Dates use integer Unix seconds. Drizzle updates refresh `updatedAt`; raw SQL writers must update it themselves. Boolean and enum checks apply to SQL writes as well as TypeScript. Integer-affinity fields additionally reject fractional values; ranks explicitly permit half-steps.

The constraints follow the [Drizzle SQLite column APIs](https://orm.drizzle.team/docs/sqlite/column-types) and [constraint APIs](https://orm.drizzle.team/docs/indexes-constraints). JSON checks use SQL literals, and shared ownership uses partial indexes: this also avoids invalid migration output for parameterized checks and expression indexes in the installed Drizzle Kit version.

## Important relationships

| Area                      | Relationships and persisted state                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Characters                | `dnd35Characters.characterId` is the ID supplied by the future generic character module. There is currently no generic character table, so there is no invented FK, second identity, or UUID default. Auth/world/encounter IDs are integration references validated by services.                                                                                 |
| Progression               | Character → ordered class-level occurrences → class level → base/prestige/NPC class. Track 2 supports gestalt. Racial Hit Dice and level-based ability increases have separate rows. XP, HP state, nonlethal damage and power-point expenditure are persisted; BAB, saves, maximum HP, total levels and skill totals are derived.                                |
| Ability scores and skills | One row per character/ability; NULL base score means a nonability. Damage, drain and inherent/manual adjustments are separate. Skill ranks allow halves and separate Craft/Perform/Profession specializations.                                                                                                                                                   |
| Race                      | Race → ability modifiers, traits, automatic/bonus languages, subtypes and additional movement modes. Traits can reference reusable special abilities. Favored class and racial Hit Dice are explicit.                                                                                                                                                            |
| Classes                   | Class → per-level cumulative base progression, features granted at levels and class skills. Class casting definitions → relational per-level/per-spell-level slot and known-spell counts. Prestige advancement rows define choices of existing casting progressions.                                                                                             |
| Feats                     | Feat → multiple category assignments, prerequisite expression and ordered benefits. Character/monster feat occurrences retain repeatable selections without prohibiting repeated choices.                                                                                                                                                                        |
| Spells                    | Spell → school, descriptor assignments, components, class levels and domain levels. Component alternative groups represent alternatives such as material or divine focus. Schools and descriptors are editable, source-linked content.                                                                                                                           |
| Character casting         | A character casting track has exactly one class, feat, or special-ability source. Known spells, owned books, book contents, preparations and applied metamagic are independent tables. Composite ownership FKs prevent attaching another character's book or casting track. Nonclass grants need no artificial class.                                            |
| Psionics                  | Powers have their own discipline, displays, class availability, augmentation, resistance and power costs. Known powers attach to character casting tracks. Specialist discipline access is retained.                                                                                                                                                             |
| Equipment                 | Item → weapon/armor/shield/ammunition/magic extensions. Weapons have size/end damage rows and damage-type assignments. Properties are reusable and can attach to definitions or individual instances. A normal stack needs no instance; an individualized object has one global instance and quantity one. Nested containers must have the same character owner. |
| Monsters                  | A monster is a reusable stat block, never an NPC identity. It has rational CR/Hit Dice, nullable nonabilities, movement, subtype, attack-routine, ability, feat, skill and template relations. Imported stat-block saves and skill totals may be retained where ranks/derivation are not known.                                                                  |
| Templates and religion    | Templates have relational ability modifiers, ability grants and subtype changes, plus ordered exceptional transformations. Applied template order is persisted for monsters and characters. Deities map to domains and favored weapons; domains map to granted abilities and spells.                                                                             |

Owned character rows cascade when the D&D extension is removed. Definition references in character state generally restrict deletion. Content composition joins cascade with their parent. Deleting a character removes possession records but keeps item instances, so unique items can move into world/party ownership later. Deleting a nonempty container alone is blocked; deleting the entire character can cascade its nested inventory together. Services must move/remove contents deliberately during individual container operations.

## Deliberate JSON payloads

These are typed JSON text columns, never binary data or entire serialized characters/stat blocks. SQLite checks JSON validity and the outer object/array kind. TypeScript types describe payload shapes; Zod boundary validation belongs outside persistence.

- Prerequisite expressions: versioned, nested all/any/not trees with typed ability, level, class, BAB, save, feat, skill, caster/manifester, spell-level, race/type, alignment, feature and special-ability leaves. Custom leaves carry a namespaced/versioned extension. Class, feat, race and spell prerequisites all use the same model; item crafting and template applicability reuse it.
- Effects: discriminated modifiers, grants, resistances, immunities and custom extensions for special abilities, conditions, racial traits, item properties and unusual monster defenses. Common feat bonuses have relational target/value/type columns; only exceptional feat effects use JSON.
- Grant parameters and choices: variable ranks, dice, uses, periods, selected content and specialized parameters. Definition relationships remain ordinary FKs; IDs embedded in payloads require boundary validation.
- Power augmentation: irregular combinations of extra points, repetition and effects that do not form a uniform progression table.
- Template transformations: ordered/conditional size, Hit Die and exceptional effect changes. Common ability/subtype/ability-grant changes remain normalized.
- Active condition state: per-application save DC, caster level, variable choices/effects and custom parameters. Duration and expiry are ordinary columns.

## Rules engine and integration responsibilities

There is no rules evaluator in these schema files. A generic engine can traverse prerequisite trees and combine typed effects; the D&D 3.5 plugin supplies D&D semantics. Keep these behaviors outside persistence:

- Validate JSON versions, payload structure and referenced content IDs; evaluate qualification and campaign source access.
- Authorize source/content ownership and generic IDs. When the generic character/auth schemas exist, add their real foreign keys in an explicit migration and coordinate generic character deletion.
- Insert all six ability rows atomically, interpret nonabilities, and derive effective scores, saves, BAB, HP maximum, ECL, encumbrance, spell slots and power points.
- Validate contiguous class progression, prestige qualification, racial-HD/class-level ordering, gestalt selection and HP selection, and ability-increase timing. The database protects positive, unique per-track occurrences, but does not evaluate leveling rules across tables.
- Resolve casting specialization, spell lists, feat-granted/innate access, preparation capacity, metamagic and caster/manifester levels. Validate that a selected prestige advancement belongs to the character's gained class level and targets an eligible casting track. Ownership is enforced by composite FKs; eligibility is a rules decision.
- Evaluate feat repeatability/choice legality, skill rank caps/cross-class costs, bonus stacking, effect duration ticks and template ordering/applicability.
- Validate item category/extension compatibility, property eligibility, charges against capacity, equipment slot occupancy/anatomy and recursive containment. The schema rejects self-containment and cross-owner containment; services must reject longer cycles.
- Preserve generic campaign, world, NPC identity, session, wallet and event/history data in their own modules. None is invented here. Standard prices are exact copper amounts, with no currency conversion algorithm in the schema.

## Legacy migration candidates

The requested `old/` directory is absent in this checkout. Reference inspection used the existing `HEAD:src/lib/rules/*`, `HEAD:src/lib/wiki/*`, and `HEAD:src/prompts/*` through `git show`, without restoring deletions or adding production imports.

| Legacy data                             | Destination and migration work                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`, `races.ts`                  | Sources, races, ability modifiers, traits, favored classes, racial HD and movement rows. Parse prose traits cautiously; preserve unparsed rules text.                                                                                                                                                                                                                                               |
| `classes.ts`, wiki class details        | Classes, level progression, class skills, reusable features/grants and casting definitions. Generate missing level rows from reviewed ruleset progression; do not assume legacy summaries include complete 20-level tables.                                                                                                                                                                         |
| `feats.ts`, `prereq.ts`                 | Feats, category assignments, benefits and expression prerequisites. Replace heuristic text parsing with reviewed structured conditions. Preserve unknown clauses as explicit custom requirements, never silently satisfied conditions.                                                                                                                                                              |
| `skills.ts`                             | Skills and armor-check multipliers. Legacy booleans need rule-aware conversion for special cases; synergies require reviewed supplemental data.                                                                                                                                                                                                                                                     |
| `spells.ts`, `spell-compendium.ts`      | Spells, schools, descriptors, components and per-class/domain levels; legacy powers go to power disciplines, powers and power class levels. Expand `arcane`/`divine` fallback labels into reviewed class-list relationships rather than creating fake classes. Fill absent metadata through reviewed imports; summaries are not complete stat blocks.                                               |
| `equipment.ts`                          | Items and their weapon/armor/shield extensions; separate size/end damage and parse critical notation. Gear, quantities and exact prices can migrate. Convert legacy `none`/`no-shield` sentinels to absent equipment.                                                                                                                                                                               |
| `character.ts`                          | D&D extension, six base scores, ordered class tracks, skills, repeated feats, casting access, inventory and conditions. Legacy aggregate class counts do not preserve acquisition order or HP rolls: obtain those values from saved history/user review, not invented chronology. Migrate max HP only after reconciling its inputs; generic identity/notes/grant history belong in generic modules. |
| Wiki expansions and sources             | Source catalogs and reviewed monster/template/domain/deity/language content. Never mark unsourced or custom legacy records official by default. Source attribution and import rights still need verification.                                                                                                                                                                                       |
| `movement.ts`, `leadership.ts`, prompts | Movement facts can populate rows after review. Movement/encumbrance calculations, Leadership evaluation and AI prompts stay in the ruleset/engine or application layer. The legacy economy prompt uses a custom exchange convention; do not blindly treat it as standard D&D conversion when migrating prices.                                                                                      |

No content has been seeded or migrated, and no copyrighted book text is embedded in this schema.

## Generated migration and verification

`drizzle/0000_dnd35_schema.sql` and its snapshot/journal are the initial migration for the current schema barrel: 93 D&D tables plus the two pre-existing feedback tables. The checkout had no prior Drizzle migration or snapshot. This migration is generated and tested locally; it has not been applied to a remote database. An existing database that already has feedback tables needs migration baselining before this initial migration is applied.

`tests/unit/dnd35-schema.test.ts` executes the SQL in Node's in-memory SQLite with foreign keys enabled. It checks exported-table coverage, DML compilation of FK targets, integrity, Drizzle UUID/date/boolean/JSON round trips, shared/homebrew uniqueness, integer/enum constraints, nonabilities, half-ranks, multiclass tracks, casting, inventory ownership/cascades, and monster/template state. It uses the available Node runtime's built-in `node:sqlite`; no test dependency was added.

The final generation also discovered `campaign.ts` and its root-barrel export added concurrently in the shared workspace. Those source edits were preserved. Drizzle emitted `drizzle/0001_complete_black_widow.sql` and `drizzle/meta/0001_snapshot.json` for that existing campaign definition; no generic campaign schema was authored as part of this D&D task.

| Validation                                             | Result                                                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `npm run format -- --ignore-path .dnd35-format.ignore` | Passed. The temporary ignore file limited the repository-wide script to this task's files and was removed afterward. |
| `npm run typecheck`                                    | Blocked by the same three baseline application errors listed below; no database schema errors.                       |
| `npx tsc --project /tmp/tsconfig-dnd35.json --noEmit`  | Passed for database infrastructure and the new tests, inheriting the repository's strict compiler options.           |
| `npm run lint`                                         | Passed with zero errors; only the baseline button warning remains.                                                   |
| `npm run db:generate`                                  | Passed; migrations and snapshots generated for the root barrel.                                                      |
| `npm run test:unit`                                    | All 16 tests passed.                                                                                                 |
| Static completeness/import check                       | All 57 requested files implemented and exported; 60 TypeScript files including three helpers; no import cycles.      |

The baseline application typecheck errors are the missing generated route tree, the resulting `"/"` route type error, and the missing `cn` module imported by the button. Baseline lint has one existing React Fast Refresh warning in that button. No existing active unit tests remained after the user's rebuild deletions.

## Implemented files

All paths below are relative to `src/infrastructure/database/schema/dnd35/`:

- [ammunition.ts](../src/infrastructure/database/schema/dnd35/ammunition.ts)
- [armor.ts](../src/infrastructure/database/schema/dnd35/armor.ts)
- [character.ts](../src/infrastructure/database/schema/dnd35/character.ts)
- [characterAbilityScore.ts](../src/infrastructure/database/schema/dnd35/characterAbilityScore.ts)
- [characterClassLevel.ts](../src/infrastructure/database/schema/dnd35/characterClassLevel.ts)
- [characterCondition.ts](../src/infrastructure/database/schema/dnd35/characterCondition.ts)
- [characterFeat.ts](../src/infrastructure/database/schema/dnd35/characterFeat.ts)
- [characterInventory.ts](../src/infrastructure/database/schema/dnd35/characterInventory.ts)
- [characterPower.ts](../src/infrastructure/database/schema/dnd35/characterPower.ts)
- [characterSkill.ts](../src/infrastructure/database/schema/dnd35/characterSkill.ts)
- [characterSpell.ts](../src/infrastructure/database/schema/dnd35/characterSpell.ts)
- [class.ts](../src/infrastructure/database/schema/dnd35/class.ts)
- [classFeature.ts](../src/infrastructure/database/schema/dnd35/classFeature.ts)
- [classFeatureGrant.ts](../src/infrastructure/database/schema/dnd35/classFeatureGrant.ts)
- [classLevel.ts](../src/infrastructure/database/schema/dnd35/classLevel.ts)
- [classPrerequisite.ts](../src/infrastructure/database/schema/dnd35/classPrerequisite.ts)
- [classSkill.ts](../src/infrastructure/database/schema/dnd35/classSkill.ts)
- [classSpellcasting.ts](../src/infrastructure/database/schema/dnd35/classSpellcasting.ts)
- [condition.ts](../src/infrastructure/database/schema/dnd35/condition.ts)
- [contentReference.ts](../src/infrastructure/database/schema/dnd35/contentReference.ts)
- [creatureSubtype.ts](../src/infrastructure/database/schema/dnd35/creatureSubtype.ts)
- [creatureType.ts](../src/infrastructure/database/schema/dnd35/creatureType.ts)
- [deity.ts](../src/infrastructure/database/schema/dnd35/deity.ts)
- [domain.ts](../src/infrastructure/database/schema/dnd35/domain.ts)
- [feat.ts](../src/infrastructure/database/schema/dnd35/feat.ts)
- [featBenefit.ts](../src/infrastructure/database/schema/dnd35/featBenefit.ts)
- [featPrerequisite.ts](../src/infrastructure/database/schema/dnd35/featPrerequisite.ts)
- [index.ts](../src/infrastructure/database/schema/dnd35/index.ts)
- [item.ts](../src/infrastructure/database/schema/dnd35/item.ts)
- [itemProperty.ts](../src/infrastructure/database/schema/dnd35/itemProperty.ts)
- [language.ts](../src/infrastructure/database/schema/dnd35/language.ts)
- [magicItem.ts](../src/infrastructure/database/schema/dnd35/magicItem.ts)
- [monster.ts](../src/infrastructure/database/schema/dnd35/monster.ts)
- [monsterAbility.ts](../src/infrastructure/database/schema/dnd35/monsterAbility.ts)
- [monsterAttack.ts](../src/infrastructure/database/schema/dnd35/monsterAttack.ts)
- [monsterFeat.ts](../src/infrastructure/database/schema/dnd35/monsterFeat.ts)
- [monsterSkill.ts](../src/infrastructure/database/schema/dnd35/monsterSkill.ts)
- [power.ts](../src/infrastructure/database/schema/dnd35/power.ts)
- [powerClassLevel.ts](../src/infrastructure/database/schema/dnd35/powerClassLevel.ts)
- [powerDiscipline.ts](../src/infrastructure/database/schema/dnd35/powerDiscipline.ts)
- [prerequisite.ts](../src/infrastructure/database/schema/dnd35/prerequisite.ts)
- [primitives.ts](../src/infrastructure/database/schema/dnd35/primitives.ts)
- [race.ts](../src/infrastructure/database/schema/dnd35/race.ts)
- [raceAbility.ts](../src/infrastructure/database/schema/dnd35/raceAbility.ts)
- [raceLanguage.ts](../src/infrastructure/database/schema/dnd35/raceLanguage.ts)
- [raceTrait.ts](../src/infrastructure/database/schema/dnd35/raceTrait.ts)
- [schemaUtils.ts](../src/infrastructure/database/schema/dnd35/schemaUtils.ts)
- [shield.ts](../src/infrastructure/database/schema/dnd35/shield.ts)
- [skill.ts](../src/infrastructure/database/schema/dnd35/skill.ts)
- [skillSynergy.ts](../src/infrastructure/database/schema/dnd35/skillSynergy.ts)
- [source.ts](../src/infrastructure/database/schema/dnd35/source.ts)
- [specialAbility.ts](../src/infrastructure/database/schema/dnd35/specialAbility.ts)
- [spell.ts](../src/infrastructure/database/schema/dnd35/spell.ts)
- [spellClassLevel.ts](../src/infrastructure/database/schema/dnd35/spellClassLevel.ts)
- [spellComponent.ts](../src/infrastructure/database/schema/dnd35/spellComponent.ts)
- [spellDescriptor.ts](../src/infrastructure/database/schema/dnd35/spellDescriptor.ts)
- [spellDomainLevel.ts](../src/infrastructure/database/schema/dnd35/spellDomainLevel.ts)
- [spellSchool.ts](../src/infrastructure/database/schema/dnd35/spellSchool.ts)
- [template.ts](../src/infrastructure/database/schema/dnd35/template.ts)
- [weapon.ts](../src/infrastructure/database/schema/dnd35/weapon.ts)

Additional files: `src/infrastructure/database/schema/index.ts`, `tests/unit/dnd35-schema.test.ts`, this document, `drizzle/0000_dnd35_schema.sql`, `drizzle/meta/0000_snapshot.json`, `drizzle/meta/_journal.json`, and the concurrently discovered campaign migration `drizzle/0001_complete_black_widow.sql` with `drizzle/meta/0001_snapshot.json`.
