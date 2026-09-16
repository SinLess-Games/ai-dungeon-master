# D&D 3.5 ruleset runtime

The D&D 3.5 adapter lives under `src/rulesets/dnd35/` and depends on the reusable primitives in `src/engine/`.

The dependency boundary is deliberate:

```text
application / AI DM / API
        -> D&D 3.5 ruleset
             -> reusable engine
```

`src/engine/` must never import this ruleset. React, Hono, Cloudflare, Drizzle, D1, R2, AI providers, and persistence repositories also stay outside the ruleset runtime.

## Ruleset identity

The adapter is registered as:

```text
id:      dnd35
version: 3.5
```

`src/rulesets/dnd35/ruleset.ts` exposes `dnd35Ruleset`, which can be registered through the generic `RulesetRegistry` in `src/engine/rulesets.ts`. `src/rulesets/index.ts` is the application-facing composition root for the built-in rulesets shipped by The Endless Codex.

The descriptor advertises these runtime capabilities:

- abilities,
- classes,
- races,
- feats,
- skills,
- combat,
- conditions,
- equipment,
- spellcasting,
- psionics,
- advancement,
- character creation.

## Implemented deterministic runtime

### Character math

The runtime includes:

- ability modifiers,
- effective ability-score assembly,
- ability damage and drain inputs,
- full / three-quarter / half / custom BAB progression,
- good / poor / custom save progression,
- multiclass BAB and save aggregation,
- iterative attacks,
- class-level derived-stat assembly from persisted cumulative rows,
- Armor Class, touch AC, and flat-footed AC,
- initiative,
- grapple modifiers,
- hit-point totals,
- carrying capacity and encumbrance,
- effective character level from class levels, racial Hit Dice, and level adjustment.

### Race and movement

Race adapters cover:

- size,
- land speed,
- additional movement modes,
- movement multipliers,
- natural armor,
- racial Hit Dice,
- level adjustment,
- first-level feat bonuses,
- per-level skill-point bonuses.

### Modifiers and effects

The D&D adapter implements typed bonus/penalty resolution while preserving full source attribution.

By default:

- positive bonuses of the same type overlap and only the highest applies,
- same-type penalties that do not stack overlap and only the worst penalty applies,
- dodge modifiers stack,
- circumstance modifiers stack unless the originating rule says otherwise,
- untyped/unnamed modifiers stack unless they duplicate the same underlying source,
- exceptional rules text may explicitly force stacking or overlap behavior.

Same-source deduplication belongs to the content/effect layer because human-readable source labels are not stable source identities.

Persisted/common rule effects can be adapted into runtime modifiers, grants, resistances, and immunities without teaching the generic engine about D&D-specific vocabulary.

### Prerequisites and feats

The runtime supports the versioned prerequisite expression model already used by the D&D schema, including:

- nested all / any / not expressions,
- ability minimums,
- character level,
- BAB,
- class level,
- saving throws,
- feats and feat choices,
- skill ranks,
- caster level,
- manifester level,
- spell-level access,
- race,
- creature type,
- alignment,
- class features,
- special abilities,
- explicit custom predicates/extensions.

Feat runtime support includes repeatability, required choices, existing-choice collision checks, prerequisite validation, and conversion of relational feat benefits into common runtime effects.

### Skills

Skill support includes:

- class and cross-class rank caps,
- half-rank validation,
- skill-point costs,
- armor-check penalties,
- typed modifiers,
- ordinary skill checks,
- opposed skill checks,
- Take 10,
- Take 20,
- Aid Another,
- synergy bonuses.

Skill checks do **not** treat natural 1 or natural 20 as automatic failure/success. Opposed checks break equal totals in favor of the higher skill modifier; if the totals and modifiers both tie, the runtime leaves the contest tied so the caller can reroll both checks.

### Combat

Combat primitives include:

- melee/ranged attack bonus calculation,
- natural-1 automatic misses,
- natural-20 automatic hits,
- critical threat ranges,
- critical confirmation,
- critical multipliers,
- critical-aware damage components,
- full attacks and normal iterative attacks,
- charge validation and modifiers, including the 10-foot minimum and restricted standard-action charge distance,
- attacks of opportunity and provocation metadata,
- action economy for standard, move, full-round, swift, immediate, free, and AoO actions,
- immediate-action debt against the next swift action,
- the flat-footed restriction on immediate actions,
- concealment and miss chance,
- cover and situational combat modifiers,
- flanking helpers,
- melee reach checks,
- Strength-to-damage handling, including full negative Strength penalties for off-hand attacks,
- two-weapon fighting penalties,
- Power Attack exchange,
- grapple contests,
- trip,
- bull rush, including additional distance for each full 5 points of opposed-check margin,
- disarm.

Map geometry/pathfinding remains outside the ruleset. The map layer supplies facts such as distance, reachability, clear paths, adjacency, cover, and flanking geometry; the ruleset resolves the D&D consequences.

### Damage and health

The runtime includes:

- lethal damage,
- nonlethal damage,
- temporary hit points,
- healing,
- disabled/dying/dead thresholds,
- staggered/unconscious nonlethal thresholds,
- dying stabilization,
- energy resistance,
- immunity,
- physical damage reduction and bypass qualities.

Damage resolution remains explicit about packets/components so callers can preserve enough information for resistance, DR, critical, sneak-attack, and effect-specific behavior. Resistance and damage-reduction pools are consumed once across the relevant components of one attack/effect packet rather than being reapplied independently to every component.

### Conditions

Persisted conditions can be adapted to the generic condition engine for:

- round durations,
- absolute expiration times,
- permanent duration,
- concentration duration,
- special duration,
- independent/replacement/cumulative/special stacking.

The ruleset also contains standard D&D condition semantics for common conditions such as blinded, dazed, deafened, entangled, exhausted, fatigued, flat-footed, frightened, helpless, invisible, nauseated, panicked, paralyzed, pinned, prone, shaken, sickened, staggered, stunned, and unconscious.

Condition helpers expose action restrictions and common unconditional modifiers. Context-sensitive effects are deliberately kept out of global condition totals—for example prone attack/AC modifiers depend on melee-versus-ranged context, and the pinned AC penalty depends on which opponent is attacking. Those cases use dedicated contextual helpers or explicit rule evaluation.

### Spellcasting

Spellcasting support includes:

- casting-ability requirements,
- bonus spells per day,
- spell save DCs,
- spell progression at an effective class level,
- bonus-only slot access,
- prepared spell counts and expenditure,
- spontaneous slot expenditure and restoration,
- caster-level calculation,
- concentration DCs/checks,
- arcane spell failure,
- spell resistance checks,
- atomic action + prepared/spontaneous resource consumption,
- immediate-spell action validation before resource expenditure,
- metamagic slot-level validation,
- dispel checks,
- same-spell counterspell access,
- target saving-throw and spell-resistance resolution.

Individual spell text remains content. Special spell behavior is implemented through rule effects or explicit ruleset extensions rather than hard-coding every spell into the core runtime.

### Psionics

Psionic support includes:

- manifesting-ability requirements,
- power save DCs,
- bonus power points,
- augmentation planning,
- manifester-level spending limits,
- power-point expenditure,
- psionic focus gain/use,
- atomic manifestation resource handling,
- power-resistance checks.

Individual power text and unusual augmentation clauses remain content-driven extensions.

### Advancement and character creation

Advancement support includes:

- standard XP thresholds,
- level-from-XP resolution,
- XP awards spanning multiple levels,
- feat-slot milestones,
- ability-score increase milestones,
- level-up summary data.

Character-creation validation includes:

- required race/class selection,
- ability-score validation,
- skill-rank caps,
- skill-point budgets,
- feat-choice counts,
- feat prerequisites,
- duplicate/nonrepeatable feat handling.

The runtime validates rules. Persistence remains responsible for committing the validated character or level-up transaction.

## Persistence alignment

Progression values intentionally match the existing D&D content schema:

```text
BAB:  full | three_quarters | half | custom
Save: good | poor | custom
```

Character class history stores cumulative class-level values. Runtime aggregation therefore selects the highest attained row per class before adding multiclass totals; it does not sum every historical level row.

Spell progression preserves the schema distinction between:

- `slotsPerDay = null`: this spell level is not available,
- `slotsPerDay = 0`: the class has bonus-slots-only access at that level.

Ability resolution mirrors the character ability-score schema: base score, inherent bonus, damage, drain, and temporary adjustment are explicit inputs. Race, level, and sourced-effect adjustments remain caller inputs so runtime code stays independent of D1/Drizzle.

## Determinism and authority

Random behavior accepts explicit rolls or injected random sources where appropriate. This makes unit tests, recorded rolls, replay, multiplayer authority, and AI tool calls reproducible.

The intended authority chain is:

```text
AI / UI proposes an action
        ↓
ruleset validates D&D-specific legality
        ↓
generic engine resolves checks/effects/transactions/events
        ↓
application persists the authoritative result
```

The AI never becomes the rules authority.

## What is intentionally outside this runtime

A "complete runtime" does **not** mean every published D&D 3.5 sentence is hard-coded. The following remain data or explicit extensions:

- individual feat prose and exceptional feat rules,
- individual spell/power effects,
- monster-specific abilities,
- prestige-class/homebrew exceptions,
- individual magic-item behavior,
- terrain and map geometry,
- campaign house rules,
- optional/variant rules not selected by campaign configuration.

Those behaviors should enter through schema-backed rule effects, prerequisite trees, content metadata, or named custom extensions. This keeps the runtime reusable, testable, and compatible with homebrew without turning `src/engine/` into a D&D-specific monolith.

## Validation gate

Changes under `src/engine/**` or `src/rulesets/**` are covered by the Rules Engine CI workflow. Before merge, the branch must pass:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build:web
```

Do not merge engine/ruleset work while any of those checks are failing.
