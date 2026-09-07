import { describe, expect, it, vi } from "vitest";
import {
  applyHealing,
  applyLethalDamage,
  applyNonlethalDamage,
  consciousnessState,
  grantTemporaryHitPoints,
  resolveDyingStabilization,
  type Dnd35HealthPool,
} from "@/rulesets/dnd35";
import { D1HealthLifecycleStore } from "@/modules/game/server/d1HealthLifecycleStore";

function pool(overrides: Partial<Dnd35HealthPool> = {}): Dnd35HealthPool {
  return {
    maximumHitPoints: 20,
    currentHitPoints: 10,
    temporaryHitPoints: 0,
    nonlethalDamage: 0,
    stable: true,
    ...overrides,
  };
}

function fakeDatabase(changes = 1) {
  const statements: Array<{ sql: string; bindings: unknown[] }> = [];
  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...bindings: unknown[]) => {
      const statement = { sql, bindings };
      statements.push(statement);
      return statement;
    }),
  }));
  const batch = vi.fn(async (items: unknown[]) =>
    items.map(() => ({ meta: { changes } })),
  );
  return {
    database: { prepare, batch } as unknown as D1Database,
    batch,
    statements,
  };
}

function event() {
  return {
    id: "event-1",
    campaignId: "campaign-1",
    sessionId: "session-1",
    eventType: "health.test",
    occurredAt: new Date("2026-09-07T20:00:00.000Z"),
    actorId: "hero-1",
    targetIds: ["hero-1"],
    payload: {},
    deltas: [],
  };
}

describe("D&D 3.5 authoritative health lifecycle", () => {
  it("moves from positive HP to dying and dies at -10", () => {
    const dying = applyLethalDamage(pool({ currentHitPoints: 2 }), 5).after;
    expect(dying.currentHitPoints).toBe(-3);
    expect(dying.stable).toBe(false);
    expect(consciousnessState(dying)).toBe("dying");

    const dead = applyLethalDamage(dying, 7).after;
    expect(dead.currentHitPoints).toBe(-10);
    expect(consciousnessState(dead)).toBe("dead");
  });

  it("distinguishes a stabilized negative-HP creature from active dying", () => {
    expect(consciousnessState(pool({ currentHitPoints: -4, stable: false }))).toBe("dying");
    expect(consciousnessState(pool({ currentHitPoints: -4, stable: true }))).toBe("unconscious");
  });

  it("stabilizes on the core 10 percent check and loses one HP on failure", () => {
    const before = pool({ currentHitPoints: -4, stable: false });
    const success = resolveDyingStabilization(before, 10);
    expect(success.ok).toBe(true);
    if (!success.ok) throw new Error("expected stabilization success");
    expect(success.value.stable).toBe(true);
    expect(success.value.currentHitPoints).toBe(-4);

    const failure = resolveDyingStabilization(before, 11);
    expect(failure.ok).toBe(true);
    if (!failure.ok) throw new Error("expected stabilization resolution");
    expect(failure.value.stable).toBe(false);
    expect(failure.value.currentHitPoints).toBe(-5);
  });

  it("preserves stabilization while healing below zero and stabilizes at zero", () => {
    const stable = pool({ currentHitPoints: -6, stable: true, nonlethalDamage: 3 });
    const stillNegative = applyHealing(stable, 2);
    expect(stillNegative.currentHitPoints).toBe(-4);
    expect(stillNegative.stable).toBe(true);
    expect(stillNegative.nonlethalDamage).toBe(1);

    const recovered = applyHealing(pool({ currentHitPoints: -2, stable: false }), 2);
    expect(recovered.currentHitPoints).toBe(0);
    expect(recovered.stable).toBe(true);
    expect(consciousnessState(recovered)).toBe("disabled");
  });

  it("models nonlethal staggering/unconsciousness and temporary-HP absorption", () => {
    const staggered = applyNonlethalDamage(pool({ currentHitPoints: 10 }), 10);
    expect(consciousnessState(staggered)).toBe("staggered");
    const unconscious = applyNonlethalDamage(staggered, 1);
    expect(consciousnessState(unconscious)).toBe("unconscious");

    const protectedPool = grantTemporaryHitPoints(pool({ temporaryHitPoints: 2 }), 6);
    const hit = applyLethalDamage(protectedPool, 4);
    expect(hit.absorbedByTemporaryHitPoints).toBe(4);
    expect(hit.after.currentHitPoints).toBe(10);
    expect(hit.after.temporaryHitPoints).toBe(2);
    expect(hit.after.stable).toBe(true);
  });
});

describe("D1 health lifecycle transaction", () => {
  it("commits event and all mutable health fields in one guarded batch", async () => {
    const fake = fakeDatabase();
    const store = new D1HealthLifecycleStore(fake.database);
    await expect(
      store.commit(event(), {
        characterId: "hero-1",
        expected: {
          currentHitPoints: -4,
          temporaryHitPoints: 0,
          nonlethalDamage: 0,
          stable: false,
        },
        next: {
          currentHitPoints: -4,
          temporaryHitPoints: 0,
          nonlethalDamage: 0,
          stable: true,
        },
      }),
    ).resolves.toBe(true);

    expect(fake.batch).toHaveBeenCalledOnce();
    const batched = fake.batch.mock.calls[0]?.[0] as Array<{ sql: string }>;
    expect(batched).toHaveLength(2);
    expect(batched[0]?.sql).toContain("INSERT INTO game_events");
    expect(batched[0]?.sql).toContain("AND stable = ?");
    expect(batched[1]?.sql).toContain("stable = ?");
  });

  it("reports an optimistic conflict when either guarded statement changes no rows", async () => {
    const fake = fakeDatabase(0);
    const store = new D1HealthLifecycleStore(fake.database);
    await expect(
      store.commit(event(), {
        characterId: "hero-1",
        expected: {
          currentHitPoints: 5,
          temporaryHitPoints: 0,
          nonlethalDamage: 0,
          stable: true,
        },
        next: {
          currentHitPoints: 4,
          temporaryHitPoints: 0,
          nonlethalDamage: 0,
          stable: true,
        },
      }),
    ).resolves.toBe(false);
  });
});
