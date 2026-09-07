# D&D 3.5 ruleset runtime

The D&D 3.5 adapter lives under `src/rulesets/dnd35/` and depends on the reusable primitives in `src/engine/`.

The boundary is deliberate:

```text
application / AI DM / API
        -> D&D 3.5 ruleset
             -> reusable engine
```

`src/engine/` must never import this ruleset.

## Implemented foundation

The first runtime layer now covers:

- ability modifiers and effective ability scores,
- full / three-quarter / half / custom BAB progressions,
- good / poor / custom save progressions,
- multiclass BAB and save aggregation,
- iterative attacks,
- XP thresholds, general feat slots, and ability-score increases,
- D&D 3.5 typed-bonus stacking,
- Armor Class, touch AC, and flat-footed AC,
- attack bonuses, attack rolls, threat ranges, initiative, and grapple modifiers,
- saving throw bonuses and natural-1/natural-20 resolution,
- critical-aware damage components,
- class/cross-class skill rank caps and skill checks,
- carrying capacity and load categories,
- hit-point totals and core HP states,
- spell ability requirements, bonus spells, and spell save DCs,
- psionic ability requirements, bonus power points, and power save DCs.

## Persistence alignment

Progression values intentionally match the existing D&D content schema:

```text
BAB:  full | three_quarters | half | custom
Save: good | poor | custom
```

Custom rows must supply their resolved base bonus to the runtime. That keeps unusual prestige classes/homebrew representable without hard-coding their tables into the generic engine.

Ability resolution also mirrors the character ability-score schema: base score, inherent bonus, damage, drain, and temporary adjustment are explicit inputs. Race, level, and sourced-effect adjustments remain caller inputs so runtime code stays independent of D1/Drizzle.

## Modifier policy

By default the adapter implements the core D&D 3.5 overlap rule:

- positive bonuses of the same type overlap; the highest applies,
- dodge bonuses stack,
- circumstance bonuses stack,
- untyped/unnamed bonuses stack,
- penalties stack,
- exceptional rules text can explicitly force a modifier to stack or overlap.

The resolver preserves every supplied modifier and marks whether it was selected, so character sheets and AI tool errors can explain where a total came from.

## Combat policy

The reusable check engine only knows `roll + bonus vs target`. The D&D adapter adds system rules on top:

- natural 1 automatically misses an attack,
- natural 20 automatically hits an attack,
- a critical threat is only produced by a successful attack within the weapon's threat range,
- natural 1 automatically fails a saving throw,
- natural 20 automatically succeeds a saving throw,
- skill checks do **not** gain automatic success/failure from natural 1/20.

Critical damage uses repeated rolls for critical-eligible components rather than multiplying one sampled roll. Extra dice such as sneak attack can be represented as a separate component with `criticalEligible: false`.

## Still ruleset work, not generic-engine work

The next D&D-specific layers should build on this foundation rather than extend `src/engine/`:

1. class-level derived-stat assembly from content rows,
2. race/size/speed application,
3. feat prerequisite fact adapters and feat effects,
4. equipment/weapon/armor runtime adapters,
5. combat actions (full attack, charge, AoO, grapple, trip, bull rush),
6. conditions with actual 3.5 semantics,
7. spell slots, preparation, casting, SR, dispel and concentration,
8. psionic powers, augmentation, focus and power-point spending,
9. XP awards and level-up transactions,
10. character-creation validation.

All of those should produce structured engine results/events so persistence, multiplayer, and the AI DM consume the same authoritative outcomes.
