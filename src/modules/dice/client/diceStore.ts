import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { rollDiceNotation, type DiceNotationResult } from "@/engine/diceNotation";

export interface DiceHistoryEntry extends DiceNotationResult {
  id: string;
  rolledAt: string;
}

interface DiceState {
  expression: string;
  history: readonly DiceHistoryEntry[];
  setExpression: (expression: string) => void;
  roll: (expression: string) => void;
  clearHistory: () => void;
}

export const diceHistoryLimit = 40;
export const diceStorageKey = "endless-codex:dice:v2";

const signedTerm = {
  sign: z.union([z.literal(1), z.literal(-1)]),
  subtotal: z.number().int().safe(),
};
const historyEntry = z.object({
  id: z.string().max(100),
  rolledAt: z.iso.datetime(),
  notation: z.string().max(256),
  total: z.number().int().safe(),
  terms: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({
          ...signedTerm,
          kind: z.literal("dice"),
          count: z.number().int().min(1).max(1000),
          sides: z.number().int().min(2).max(1000),
          rolls: z.array(z.number().int().min(1).max(1000)).max(1000),
        }),
        z.object({
          ...signedTerm,
          kind: z.literal("modifier"),
          value: z.number().int().min(0).max(1_000_000_000),
          rolls: z.array(z.never()).length(0),
        }),
      ]),
    )
    .min(1)
    .max(50),
});

// Both dice views share personal device-local history. Storage is optional;
// campaign-authoritative rolls still go through the server's game commands.
export const useDiceStore = create<DiceState>()(
  persist(
    (set) => ({
      expression: "1d20+4-8",
      history: [],
      setExpression: (expression) => set({ expression }),
      roll: (expression) => {
        const result = rollDiceNotation(expression);
        const entry = { ...result, id: crypto.randomUUID(), rolledAt: new Date().toISOString() };
        set((state) => ({
          expression,
          history: [entry, ...state.history].slice(0, diceHistoryLimit),
        }));
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: diceStorageKey,
      storage: createJSONStorage(() => ({
        getItem(name) {
          try {
            return globalThis.localStorage?.getItem(name) ?? null;
          } catch {
            return null;
          }
        },
        setItem(name, value) {
          try {
            globalThis.localStorage?.setItem(name, value);
          } catch {
            /* Storage is optional. */
          }
        },
        removeItem(name) {
          try {
            globalThis.localStorage?.removeItem(name);
          } catch {
            /* Storage is optional. */
          }
        },
      })),
      partialize: (state) => ({ history: state.history, expression: state.expression }),
      merge(persisted, current) {
        const saved = z
          .object({ history: z.array(z.unknown()), expression: z.string().max(256) })
          .safeParse(persisted);
        if (!saved.success) return current;
        const history = saved.data.history.slice(0, diceHistoryLimit).flatMap((entry) => {
          const parsed = historyEntry.safeParse(entry);
          return parsed.success ? [parsed.data] : [];
        });
        return { ...current, expression: saved.data.expression, history };
      },
    },
  ),
);
