import { describe, expect, it, vi } from "vitest";
import { D1CastingStore } from "@/modules/game/server/d1CastingStore";
import {
  mapCastingActionType,
  selectAuthoritativePowerAugmentations,
} from "@/modules/game/server/castingService";

function fakeDatabase() {
  const statements: Array<{ sql: string; bindings: unknown[] }> = [];
  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...bindings: unknown[]) => {
      const statement = { sql, bindings };
      statements.push(statement);
      return statement;
    }),
  }));
  const batch = vi.fn(async (items: unknown[]) =>
    items.map(() => ({ meta: { changes: 1 } })),
  );
  return {
    database: { prepare, batch } as unknown as D1Database,
    prepare,
    batch,
    statements,
  };
}

function event(eventType = "spell.cast") {
  return {
    id: "event-1",
    campaignId: "campaign-1",
    sessionId: "session-1",
    eventType,
    occurredAt: new Date("2026-09-07T20:00:00.000Z"),
    actorId: "hero-1",
    sourceId: "spell-1",
    targetIds: ["target-1"],
    payload: { authoritative: true },
    deltas: [],
  };
}

describe("authoritative casting helpers", () => {
  it("maps content action types without accepting unknown caller semantics", () => {
    expect(mapCastingActionType("standard")).toBe("standard");
    expect(mapCastingActionType("full_round")).toBe("full_round");
    expect(mapCastingActionType("none")).toBe("free");
    expect(() => mapCastingActionType("other")).toThrow(/unsupported/i);
    expect(() => mapCastingActionType(null)).toThrow(/unsupported/i);
  });

  it("derives augmentation costs and repeatability from authoritative definitions", () => {
    expect(
      selectAuthoritativePowerAugmentations(
        [
          { additionalPowerPoints: 2, repeatable: true },
          { additionalPowerPoints: 4, repeatable: false },
        ],
        [
          { index: 0, applications: 3 },
          { index: 1 },
        ],
      ),
    ).toEqual([
      {
        id: "augmentation:0",
        additionalPowerPoints: 2,
        repeatable: true,
        applications: 3,
      },
      {
        id: "augmentation:1",
        additionalPowerPoints: 4,
        repeatable: false,
        applications: 1,
      },
    ]);
  });

  it("rejects duplicate and out-of-range augmentation selectors", () => {
    const definitions = [{ additionalPowerPoints: 2, repeatable: true }];
    expect(() =>
      selectAuthoritativePowerAugmentations(definitions, [
        { index: 0 },
        { index: 0, applications: 2 },
      ]),
    ).toThrow(/only once/i);
    expect(() => selectAuthoritativePowerAugmentations(definitions, [{ index: 7 }])).toThrow(
      /invalid/i,
    );
  });
});

describe("D1 casting resource transactions", () => {
  it("commits a prepared-spell event and expenditure in one D1 batch", async () => {
    const db = fakeDatabase();
    const store = new D1CastingStore(db.database);

    await expect(
      store.commitPreparedSpellCast({
        event: event(),
        characterId: "hero-1",
        preparationId: "prep-1",
        expectedExpendedCount: 0,
        nextExpendedCount: 1,
      }),
    ).resolves.toBe(true);

    expect(db.batch).toHaveBeenCalledOnce();
    const batched = db.batch.mock.calls[0]?.[0] as Array<{ sql: string }>;
    expect(batched).toHaveLength(2);
    expect(batched[0]?.sql).toContain("INSERT INTO game_events");
    expect(batched[0]?.sql).toContain("dnd35_character_spell_preparations");
    expect(batched[1]?.sql).toContain("UPDATE dnd35_character_spell_preparations");
  });

  it("upserts spontaneous slot expenditure beside the immutable event", async () => {
    const db = fakeDatabase();
    const store = new D1CastingStore(db.database);

    await expect(
      store.commitSpontaneousSpellCast({
        event: event(),
        castingTrackId: "track-1",
        spellLevel: 3,
        expectedExpendedCount: 0,
        nextExpendedCount: 1,
      }),
    ).resolves.toBe(true);

    const batched = db.batch.mock.calls[0]?.[0] as Array<{ sql: string }>;
    expect(batched).toHaveLength(2);
    expect(batched[1]?.sql).toContain("runtime_dnd35_character_spontaneous_slot_usage");
    expect(batched[1]?.sql).toContain("ON CONFLICT");
  });

  it("commits power-point and focus expenditure atomically", async () => {
    const db = fakeDatabase();
    const store = new D1CastingStore(db.database);

    await expect(
      store.commitPowerManifestation({
        event: event("power.manifested"),
        characterId: "hero-1",
        expectedPowerPointsSpent: 3,
        nextPowerPointsSpent: 8,
        expectedFocused: true,
        nextFocused: false,
      }),
    ).resolves.toBe(true);

    const batched = db.batch.mock.calls[0]?.[0] as Array<{ sql: string }>;
    expect(batched).toHaveLength(3);
    expect(batched[0]?.sql).toContain("power_points_spent");
    expect(batched[1]?.sql).toContain("UPDATE dnd35_characters");
    expect(batched[2]?.sql).toContain("runtime_dnd35_character_psionic_states");
  });

  it("restores prepared, spontaneous, and power-point daily resources together", async () => {
    const db = fakeDatabase();
    const store = new D1CastingStore(db.database);

    await store.restoreDailyResources({
      event: event("casting.daily_restored"),
      characterId: "hero-1",
    });

    const batched = db.batch.mock.calls[0]?.[0] as Array<{ sql: string }>;
    expect(batched).toHaveLength(4);
    expect(batched[1]?.sql).toContain("expended_count = 0");
    expect(batched[2]?.sql).toContain("DELETE FROM runtime_dnd35_character_spontaneous_slot_usage");
    expect(batched[3]?.sql).toContain("power_points_spent = 0");
  });
});
