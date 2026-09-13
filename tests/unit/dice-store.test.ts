import { beforeEach, expect, it } from "vitest";
import { useDiceStore } from "@/modules/dice/client/diceStore";

beforeEach(() => {
  useDiceStore.setState({ history: [], expression: "1d20" });
});

it("keeps the most recent 20 rolls and leaves history intact after an invalid roll", () => {
  for (let i = 0; i < 22; i++) useDiceStore.getState().roll(`1d2+${i}`);
  const history = useDiceStore.getState().history;
  expect(history).toHaveLength(20);
  expect(history[0]?.notation).toBe("1d2+21");
  expect(history.at(-1)?.notation).toBe("1d2+2");
  expect(new Set(history.map((entry) => entry.id)).size).toBe(20);
  expect(() => useDiceStore.getState().roll("d1001")).toThrow();
  expect(useDiceStore.getState().history).toBe(history);
  useDiceStore.getState().clearHistory();
  expect(useDiceStore.getState().history).toEqual([]);
});
