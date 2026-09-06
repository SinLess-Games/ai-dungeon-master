# Reusable engine foundation

The generic Endless Codex rules engine lives under `src/engine/`.

It is intentionally independent of React, Hono, Cloudflare bindings, Drizzle,
AI providers, and any specific tabletop ruleset. Rulesets such as D&D 3.5
consume these primitives and supply their own policies.

## Current primitives

### Randomness

`src/engine/random.ts`

Provides an injectable `RandomSource`, inclusive integer generation, and a
small seeded deterministic PRNG. Seeded randomness is useful for tests,
replays, procedural generation, and simulations where the same seed must
produce the same sequence.

The seeded PRNG is not cryptographic and must not be used for secrets or
security decisions.

### Dice

`src/engine/dice.ts`

Parses and rolls standard single-group tabletop notation such as:

- `d20`
- `2d6+3`
- `4d8 - 2`
- `d%`

The roller accepts an injected `RandomSource`, returns every individual die,
and applies explicit limits to prevent abusive expressions from allocating
unbounded work.

Complex expression trees such as `2d6 + 1d4 + 5`, advantage/disadvantage,
exploding dice, keep-highest, rerolls, and system-specific critical behavior
should be layered on top rather than hidden inside the primitive roller.

### Modifiers

`src/engine/modifiers.ts`

Resolves numeric modifiers while leaving stacking policy to the ruleset.
Supported generic policies currently include:

- sum
- highest
- lowest
- highest absolute value
- first

The generic engine does not know what an armor bonus, dodge bonus, competence
bonus, circumstance bonus, or other D&D concept means. A D&D 3.5 adapter will
map its bonus types to the appropriate generic stacking policy or provide a
more specialized resolver where the 3.5 rules require one.

### Prerequisites

`src/engine/prerequisites.ts`

Evaluates serializable requirement trees against caller-supplied facts and
optional named predicates. The tree supports:

- all
- any
- not
- fact comparisons
- membership checks
- custom predicate IDs

Evaluation returns structured failures rather than only a boolean so the same
engine can power character-creator explanations, feat/class eligibility,
admin validation, and AI tool errors.

Rulesets own the fact vocabulary. For example, D&D 3.5 may expose facts such
as `character.level`, `character.bab`, `skills.tumble.ranks`, or
`feats.power-attack` without teaching those concepts to the generic engine.

### Resources

`src/engine/resources.ts`

Provides bounded resource state and pure operations for adjustment, spending,
restoration, and explicit setting. The minimum is configurable, so the same
primitive can model resources with different semantics, including hit points
that may fall below zero, spell slots that cannot, power points, charges, and
other finite pools.

Callers choose whether out-of-bounds changes clamp or reject.

## Architectural rules

The dependency direction is:

```text
application / UI / API
        -> ruleset
             -> generic engine
```

Never reverse it.

`src/engine/` must not import from:

- `src/rulesets/`
- `src/modules/`
- `src/server/`
- `src/infrastructure/`
- React
- Hono
- Drizzle
- AI SDKs/providers

The engine should favor pure functions and explicit inputs/outputs. Persistent
state remains owned by the database/application layer.

## Next engine layers

The next reusable layers should be added only with a concrete consumer and
clear ruleset boundary. Likely candidates are:

1. effect application and reversible state deltas,
2. condition lifecycle primitives,
3. generic check/contest resolution,
4. action and target validation,
5. combat turn/initiative state machines,
6. progression/resource transaction batches,
7. deterministic event records suitable for replay/audit.

D&D 3.5 adapters should then be built under `src/rulesets/dnd35/` for derived
statistics, bonus stacking, prerequisites, combat, skills, saves, feats,
spells, and progression.
