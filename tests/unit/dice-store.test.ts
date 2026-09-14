import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { diceStorageKey, useDiceStore } from "@/modules/dice/client/diceStore";

let storage: Map<string, string>;

beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (name: string) => storage.get(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.delete(name),
  });
  useDiceStore.setState({ history: [], expression: "1d20" });
});

it("keeps the most recent 40 rolls and leaves history intact after an invalid roll", () => {
  for (let i = 0; i < 42; i++) useDiceStore.getState().roll(`1d2+${i}`);
  const history = useDiceStore.getState().history;
  expect(history).toHaveLength(40);
  expect(history[0]?.notation).toBe("1d2+41");
  expect(history.at(-1)?.notation).toBe("1d2+2");
  expect(new Set(history.map((entry) => entry.id)).size).toBe(40);
  expect(() => useDiceStore.getState().roll("d1001")).toThrow();
  expect(useDiceStore.getState().history).toBe(history);
  useDiceStore.getState().clearHistory();
  expect(useDiceStore.getState().history).toEqual([]);
});

afterEach(() => vi.unstubAllGlobals());

it("restores shared history and expression after a reload", async () => {
  useDiceStore.getState().roll("2d6+4-8");
  const expected = useDiceStore.getState().history;
  const saved = storage.get(diceStorageKey)!;
  useDiceStore.setState({ history: [], expression: "1d20" });
  storage.set(diceStorageKey, saved);
  await useDiceStore.persist.rehydrate();
  expect(useDiceStore.getState().history).toEqual(expected);
  expect(useDiceStore.getState().expression).toBe("2d6+4-8");
});

it("ignores malformed stored history and survives blocked storage", async () => {
  storage.set(
    diceStorageKey,
    JSON.stringify({
      state: { history: [{ id: "bad", terms: null }], expression: "d6" },
      version: 0,
    }),
  );
  await useDiceStore.persist.rehydrate();
  expect(useDiceStore.getState().history).toEqual([]);
  vi.stubGlobal("localStorage", {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  });
  await useDiceStore.persist.rehydrate();
  expect(() => useDiceStore.getState().roll("1d20+4-8")).not.toThrow();
  expect(useDiceStore.getState().history).toHaveLength(1);
});
