import { create } from "zustand";
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

// Personal rolls last for this app visit, including navigation between routes.
// Campaign-authoritative rolls continue to use the server's game commands.
export const useDiceStore = create<DiceState>((set) => ({
  expression: "1d20+4-8",
  history: [],
  setExpression: (expression) => set({ expression }),
  roll: (expression) => {
    const result = rollDiceNotation(expression);
    const entry = { ...result, id: crypto.randomUUID(), rolledAt: new Date().toISOString() };
    set((state) => ({ expression, history: [entry, ...state.history].slice(0, 20) }));
  },
  clearHistory: () => set({ history: [] }),
}));
