import { describe, expect, it } from "vitest";
import {
  createEncounterState,
  spendCurrentEncounterAction,
} from "@/modules/game/domain/encounterRuntime";

describe("turn-aware game actions", () => {
  it("spends a standard action for the current combatant", () => {
    const state = createEncounterState([
      { characterId: "hero", initiativeRoll: 18, initiativeModifier: 3 },
      { characterId: "enemy", initiativeRoll: 10, initiativeModifier: 1 },
    ]);

    const spent = spendCurrentEncounterAction(state, "hero", "standard");
    expect(spent.ok).toBe(true);
    if (!spent.ok) return;

    const hero = spent.value.participants.find((participant) => participant.characterId === "hero");
    expect(hero?.standardAvailable).toBe(false);
    expect(hero?.moveAvailable).toBe(true);
  });

  it("rejects a second standard action and an action by the wrong combatant", () => {
    const state = createEncounterState([
      { characterId: "hero", initiativeRoll: 18, initiativeModifier: 3 },
      { characterId: "enemy", initiativeRoll: 10, initiativeModifier: 1 },
    ]);

    const first = spendCurrentEncounterAction(state, "hero", "standard");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = spendCurrentEncounterAction(first.value, "hero", "standard");
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.errors[0]?.code).toBe("DND35_STANDARD_ACTION_SPENT");
    }

    const wrongActor = spendCurrentEncounterAction(state, "enemy", "standard");
    expect(wrongActor.ok).toBe(false);
    if (!wrongActor.ok) {
      expect(wrongActor.errors[0]?.code).toBe("ENCOUNTER_NOT_ACTORS_TURN");
    }
  });
});
