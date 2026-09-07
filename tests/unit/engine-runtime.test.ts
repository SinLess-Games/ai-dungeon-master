import { describe, expect, it } from "vitest";

import {
  advanceConditions,
  advanceDuration,
  advanceTurn,
  appendEvent,
  applyCondition,
  applyStateDeltas,
  completeTurns,
  createResource,
  createStateDelta,
  createTurnState,
  engineFailure,
  engineSuccess,
  existingValue,
  replayEvents,
  resolveCheck,
  resolveContest,
  resolveEffectBatch,
  reverseStateDeltas,
  runTransaction,
  selectConditions,
  startTurns,
  validateAction,
  validateTargets,
  type ConditionInstance,
  type EffectHandler,
  type EngineEvent,
  type EngineState,
  type TransactionStep,
} from "@/engine";

describe("state delta and effect engine", () => {
  it("applies and reverses verified state deltas without mutating the input", () => {
    const initial: EngineState = {
      hero: { hp: 12, flags: { bloodied: false } },
    };
    const hp = createStateDelta(initial, {
      id: "damage-1",
      entityId: "hero",
      path: ["hp"],
      after: existingValue(5),
    });
    const first = applyStateDeltas(initial, [hp]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.hero?.hp).toBe(5);
    expect(initial.hero?.hp).toBe(12);

    const flag = createStateDelta(first.value, {
      id: "bloodied-1",
      entityId: "hero",
      path: ["flags", "bloodied"],
      after: existingValue(true),
    });
    const applied = applyStateDeltas(first.value, [flag]);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const reverted = applyStateDeltas(applied.value, reverseStateDeltas([hp, flag]));
    expect(reverted.ok).toBe(true);
    if (reverted.ok) expect(reverted.value).toEqual(initial);
  });

  it("detects stale deltas and supports entity creation", () => {
    const initial: EngineState = { hero: { hp: 10 } };
    const stale = createStateDelta(initial, {
      id: "stale",
      entityId: "hero",
      path: ["hp"],
      after: existingValue(8),
    });
    const changed: EngineState = { hero: { hp: 9 } };
    expect(applyStateDeltas(changed, [stale]).ok).toBe(false);

    const create = createStateDelta(initial, {
      id: "create-npc",
      entityId: "npc-1",
      after: existingValue({ name: "Mira", hp: 4 }),
    });
    const result = applyStateDeltas(initial, [create]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value["npc-1"]?.name).toBe("Mira");
  });

  it("resolves registered effects into ordered state deltas", () => {
    const damage: EffectHandler = (effect, state) => {
      const target = effect.targetIds[0];
      if (!target) return engineFailure("NO_TARGET", "Damage requires a target.");
      const hp = Number(state[target]?.hp ?? 0);
      const amount = Number(effect.payload.amount ?? 0);
      return engineSuccess([
        createStateDelta(state, {
          id: `${effect.id}:hp`,
          entityId: target,
          path: ["hp"],
          after: existingValue(hp - amount),
          ...(effect.sourceId ? { sourceId: effect.sourceId } : {}),
        }),
      ]);
    };
    const result = resolveEffectBatch(
      { hero: { hp: 10 } },
      [
        {
          id: "effect-1",
          type: "damage",
          sourceId: "trap",
          targetIds: ["hero"],
          payload: { amount: 3 },
        },
      ],
      { damage },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state.hero?.hp).toBe(7);
      expect(result.value.deltas).toHaveLength(1);
    }
  });
});

describe("duration and condition lifecycle", () => {
  const condition = (overrides: Partial<ConditionInstance> = {}): ConditionInstance => ({
    id: "c1",
    definitionId: "burning",
    targetId: "hero",
    sourceId: "spell-1",
    stacks: 1,
    maxStacks: 3,
    duration: { kind: "rounds", remaining: 2 },
    appliedAt: 1,
    enabled: true,
    ...overrides,
  });

  it("advances only matching duration units", () => {
    expect(advanceDuration({ kind: "rounds", remaining: 2 }, { kind: "turn" }).changed).toBe(false);
    const advanced = advanceDuration({ kind: "rounds", remaining: 2 }, { kind: "round" });
    expect(advanced.after).toEqual({ kind: "rounds", remaining: 1 });
  });

  it("stacks, selects, and expires conditions", () => {
    const stacked = applyCondition(
      [condition()],
      condition({ id: "c2", stacks: 2, duration: { kind: "rounds", remaining: 3 } }),
      { stacking: "stack", refreshDurationOnStack: true },
    );
    expect(stacked.updatedIds).toEqual(["c1"]);
    expect(stacked.conditions[0]?.stacks).toBe(3);
    expect(stacked.conditions[0]?.duration).toEqual({ kind: "rounds", remaining: 3 });
    expect(selectConditions(stacked.conditions, "hero", "burning")).toHaveLength(1);

    const oneRound = advanceConditions(stacked.conditions, { kind: "round", amount: 2 });
    expect(oneRound.conditions[0]?.duration).toEqual({ kind: "rounds", remaining: 1 });
    const expired = advanceConditions(oneRound.conditions, { kind: "round" });
    expect(expired.conditions).toHaveLength(0);
    expect(expired.removedIds).toEqual(["c1"]);
  });
});

describe("generic checks and contests", () => {
  it("resolves checks without interpreting natural-roll semantics", () => {
    const result = resolveCheck({ bonus: 5, target: 15, roll: 10 });
    expect(result).toMatchObject({ naturalRoll: 10, total: 15, margin: 0, success: true });
    expect(resolveCheck({ bonus: 5, target: 15, roll: 10, tiesSucceed: false }).success).toBe(false);
  });

  it("resolves opposed contests and configurable ties", () => {
    const tied = resolveContest(
      { id: "a", bonus: 3, roll: 10 },
      { id: "b", bonus: 3, roll: 10 },
    );
    expect(tied.winnerId).toBeNull();
    const leftWins = resolveContest(
      { id: "a", bonus: 3, roll: 10 },
      { id: "b", bonus: 3, roll: 10 },
      { tieRule: "left" },
    );
    expect(leftWins.winnerId).toBe("a");
  });
});

describe("target and action validation", () => {
  it("validates reusable target constraints", () => {
    const valid = validateTargets(
      "hero",
      [{ id: "goblin", kind: "creature", tags: ["hostile"] }],
      {
        minimum: 1,
        maximum: 1,
        allowSelf: false,
        allowedKinds: ["creature"],
        requiredTags: ["hostile"],
      },
    );
    expect(valid.ok).toBe(true);

    const invalid = validateTargets(
      "hero",
      [{ id: "hero", kind: "creature", tags: [] }],
      { minimum: 1, maximum: 1, allowSelf: false, requiredTags: ["hostile"] },
    );
    expect(invalid.ok).toBe(false);
    if (!invalid.ok)
      expect(invalid.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining(["SELF_TARGET_NOT_ALLOWED", "TARGET_MISSING_TAG"]),
      );
  });

  it("combines phase, prerequisites, targets, and resources for actions", () => {
    const result = validateAction(
      {
        id: "power-strike",
        phase: "turn",
        prerequisite: {
          kind: "fact",
          key: "canAttack",
          operator: "equals",
          value: true,
        },
        targeting: { minimum: 1, maximum: 1, allowSelf: false },
        costs: [{ resource: "stamina", amount: 2 }],
      },
      {
        actorId: "hero",
        phase: "turn",
        targets: [{ id: "goblin" }],
        prerequisiteContext: { getFact: (key) => (key === "canAttack" ? true : undefined) },
        resources: { stamina: createResource(3, 0, 3) },
      },
    );
    expect(result.ok).toBe(true);

    const blocked = validateAction(
      { id: "strike", costs: [{ resource: "stamina", amount: 4 }] },
      { actorId: "hero", targets: [], resources: { stamina: createResource(3, 0, 3) } },
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.errors[0]?.code).toBe("INSUFFICIENT_RESOURCE");
  });
});

describe("turn state machine", () => {
  it("sorts deterministically, starts, advances, wraps rounds, and completes", () => {
    const ready = createTurnState([
      { id: "slow", initiative: 10 },
      { id: "fast-a", initiative: 20, tieBreaker: 1 },
      { id: "fast-b", initiative: 20, tieBreaker: 2 },
    ]);
    expect(ready.order.map((participant) => participant.id)).toEqual(["fast-b", "fast-a", "slow"]);
    const started = startTurns(ready);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const second = advanceTurn(started.value);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.currentParticipantId).toBe("fast-a");
    const third = advanceTurn(second.value.state);
    expect(third.ok).toBe(true);
    if (!third.ok) return;
    const wrapped = advanceTurn(third.value.state);
    expect(wrapped.ok).toBe(true);
    if (!wrapped.ok) return;
    expect(wrapped.value.roundAdvanced).toBe(true);
    expect(wrapped.value.state.round).toBe(2);
    expect(completeTurns(wrapped.value.state).status).toBe("complete");
  });
});

describe("events and transactions", () => {
  it("records deterministic sequence numbers and replays events", () => {
    let log: readonly EngineEvent[] = [];
    const first = appendEvent(log, {
      id: "e1",
      type: "gain",
      occurredAt: 100,
      payload: { amount: 2 },
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    log = first.value;
    const second = appendEvent(log, {
      id: "e2",
      type: "gain",
      occurredAt: 101,
      payload: { amount: 3 },
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.map((event) => event.sequence)).toEqual([1, 2]);
    const replayed = replayEvents(0, second.value, (state, event) => state + Number(event.payload.amount ?? 0));
    expect(replayed).toEqual(engineSuccess(5));
  });

  it("commits all pure transaction steps only when every step succeeds", () => {
    type State = { value: number };
    const steps: readonly TransactionStep<State>[] = [
      {
        id: "add",
        execute: (state) => engineSuccess({ state: { value: state.value + 2 }, output: "added" }),
      },
      {
        id: "multiply",
        execute: (state) => engineSuccess({ state: { value: state.value * 3 } }),
      },
    ];
    const initial = { value: 1 };
    const success = runTransaction(initial, steps);
    expect(success.ok).toBe(true);
    if (success.ok) expect(success.value.state.value).toBe(9);
    expect(initial.value).toBe(1);

    const failed = runTransaction(initial, [
      steps[0]!,
      { id: "fail", execute: () => engineFailure("NOPE", "blocked") },
    ]);
    expect(failed.ok).toBe(false);
    expect(initial.value).toBe(1);
  });
});
