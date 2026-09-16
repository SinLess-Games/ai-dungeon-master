# Reusable engine core

The Endless Codex generic rules engine lives under `src/engine/`.

It is intentionally ruleset-agnostic and has no dependency on React, Hono, Cloudflare bindings, Drizzle, AI providers, application modules, or D&D 3.5. Rulesets consume the engine; the engine never imports a ruleset.

## Completion scope

The reusable core is considered complete when it provides deterministic primitives for:

- injectable randomness and bounded dice rolling,
- modifier resolution with caller-defined stacking policy,
- data-driven prerequisite evaluation,
- bounded resources,
- structured engine results/errors,
- reversible state deltas and effect handler resolution,
- duration and condition lifecycle,
- generic checks and opposed contests,
- target selection validation,
- action validation across phase, prerequisites, targets, and costs,
- deterministic turn/initiative sequencing,
- immutable in-memory transaction composition,
- deterministic event logs and replay.

System-specific rules such as D&D 3.5 ability modifiers, BAB, saves, AC, bonus types, critical hits, grappling, spell preparation, psionics, feats, classes, and progression do **not** belong in this core.

## Architecture

```text
application / API / AI tools
        -> ruleset adapter
             -> src/engine
```

Persistent state remains owned by D1/application repositories. The engine takes explicit state, evaluates rules, and returns validated results, events, and deltas for the caller to persist.

### Randomness and dice

`random.ts` provides an injectable random source and deterministic seeded PRNG. `dice.ts` parses and rolls bounded single-group tabletop notation such as `d20`, `2d6+3`, and `d%`.

`parseDiceFormula` and `rollDiceFormula` also support signed dice groups and flat
modifiers using the existing configurable engine limits. Structured formulas are
validated before consuming randomness. The personal dice UI uses the narrower
`diceNotation.ts` limits described below.

`diceNotation.ts` layers additive expressions over those primitives without changing
the existing `rollDice` contract. `parseDiceNotation` validates and normalizes dice
groups and signed integer modifiers, with a minimum/maximum total.
`rollDiceNotation` accepts an injected `RandomSource` and returns each group's
individual dice, signed subtotals, and final total. It validates the entire
expression before consuming randomness and never evaluates JavaScript.

Supported examples: `1d20+4-8`, `2d6+1d4-3`, `d%`, and `-d6+2`. Limits are d2 through
d1000, 1,000 dice total, 50 terms, 256 input characters, and modifiers up to one
billion per term. Multiplication, division, parentheses, decimals, and keep/drop
notation are not supported by this additive grammar.

The public `/dice` page is available from Play → Dice and site search. Its personal
roll history keeps the latest 40 rolls on this device across navigation and reloads,
shared with the persistent dice tray. Open the tray from Play → Dice tray, the
floating Dice button, or Ctrl/⌘ + Shift + D. Both views enforce d2–d1000 and the
same expression limits. If browser storage is unavailable, rolls still work in memory.
These browser rolls do not mutate campaign state or replace authoritative server
game commands. See `tests/e2e/dice-roller.spec.ts` for the desktop/mobile flow.

### Modifiers and prerequisites

`modifiers.ts` resolves numeric modifiers while rulesets choose stacking modes. `prerequisites.ts` evaluates serializable `all`/`any`/`not`, fact comparisons, membership checks, and named predicates with structured failures.

### Resources

`resources.ts` models bounded pools with clamp/reject behavior. It can represent hit points, charges, spell slots, power points, stamina, or other finite resources without knowing their game-specific meaning.

### Results and shared types

`result.ts` gives all higher-level engine operations a common success/failure envelope. `types.ts` defines JSON-safe payload types, entity references, and structured issues suitable for APIs, AI tools, and persistence.

### Effects and state deltas

`effects.ts` defines JSON-safe entity state deltas with explicit before/after snapshots. Deltas can be verified, applied, reversed, and batched. Rulesets register effect handlers by effect type; handlers translate ruleset concepts into generic deltas. This allows the same pipeline to support damage, healing, inventory changes, conditions, resource changes, and future game systems without teaching the core those semantics.

### Time and conditions

`time.ts` provides permanent, turn, round, and elapsed-time durations. `conditions.ts` provides reusable independent/stack/refresh/replace policies, stack limits, selection, removal, and expiration. Rulesets define what a condition actually does.

### Checks and contests

`checks.ts` resolves a die roll plus bonus against a target and opposed contests with configurable tie behavior. It deliberately exposes the natural roll without interpreting critical success/failure semantics.

### Targets and actions

`targets.ts` validates count, self-targeting, uniqueness, entity kind, required tags, and forbidden tags. `actions.ts` composes target validation with phase constraints, prerequisite trees, and resource affordability into structured action validation suitable for both UI and AI tool calls.

### Turns

`turns.ts` is a deterministic turn-order state machine. It sorts by caller-supplied initiative and optional tie breakers, starts the cycle, advances participants, wraps rounds, and completes the cycle. Rulesets remain responsible for how initiative values are calculated.

### Transactions

`transactions.ts` composes pure immutable engine steps. A failed step returns no final state, allowing the caller to retain the original state and map the operation to a real D1 transaction when persistence is required.

### Events and replay

`events.ts` appends monotonically sequenced, JSON-safe event records and can replay them through a caller-supplied reducer. Events can carry state deltas, making them suitable for audit history, debugging, deterministic replay, multiplayer synchronization, and AI context.

## Boundaries

`src/engine/` must not import from:

- `src/rulesets/`
- `src/modules/`
- `src/server/`
- `src/infrastructure/`
- `old/`
- React
- Hono
- Drizzle
- AI SDKs/providers

The ESLint configuration enforces the important dependency boundary.

## Validation

Engine work must pass:

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build:web
```

The dedicated GitHub Actions workflow `.github/workflows/engine-ci.yml` runs the same validation for engine changes.

After this core is green, new development should move to `src/rulesets/dnd35/` and consume these primitives rather than expanding `src/engine/` with D&D-specific behavior.
