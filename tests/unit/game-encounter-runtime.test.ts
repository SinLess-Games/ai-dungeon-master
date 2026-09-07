import { describe, expect, it } from "vitest";
import {
  advanceEncounterTurn,
  createEncounterState,
  currentEncounterParticipant,
  spendCurrentEncounterAction,
  type EncounterState,
} from "@/modules/game/domain/encounterRuntime";

describe("persistent encounter domain runtime", () => {
  it("orders initiative deterministically and selects the first combatant", () => {
    const state = createEncounterState([
      { characterId: "fighter", initiativeRoll: 10, initiativeModifier: 2 },
      { characterId: "rogue", initiativeRoll: 13, initiativeModifier: 0 },
      { characterId: "cleric", initiativeRoll: 11, initiativeModifier: 1 },
    ]);

    expect(state.roundNumber).toBe(1);
    expect(state.activeTurnIndex).toBe(0);
    expect(state.participants.map((participant) => participant.characterId)).toEqual([
      "rogue",
      "fighter",
      "cleric",
    ]);
    expect(currentEncounterParticipant(state)?.characterId).toBe("rogue");
  });

  it("rejects duplicate participants and invalid initiative rolls", () => {
    expect(() =>
      createEncounterState([
        { characterId: "hero", initiativeRoll: 10, initiativeModifier: 2 },
        { characterId: "hero", initiativeRoll: 12, initiativeModifier: 1 },
      ]),
    ).toThrow(/Duplicate encounter participant/i);

    expect(() =>
      createEncounterState([{ characterId: "hero", initiativeRoll: 21, initiativeModifier: 0 }]),
    ).toThrow(/between 1 and 20/i);
  });

  it("allows only the current combatant to spend its action economy", () => {
    const state = createEncounterState([
      { characterId: "hero", initiativeRoll: 18, initiativeModifier: 1 },
      { characterId: "enemy", initiativeRoll: 8, initiativeModifier: 0 },
    ]);

    const wrongActor = spendCurrentEncounterAction(state, "enemy", "standard");
    expect(wrongActor.ok).toBe(false);
    if (!wrongActor.ok) {
      expect(wrongActor.errors[0]?.code).toBe("ENCOUNTER_NOT_ACTORS_TURN");
    }

    const spent = spendCurrentEncounterAction(state, "hero", "standard");
    expect(spent.ok).toBe(true);
    if (!spent.ok) return;
    expect(spent.value.participants[0]?.standardAvailable).toBe(false);

    const spentAgain = spendCurrentEncounterAction(spent.value, "hero", "standard");
    expect(spentAgain.ok).toBe(false);
    if (!spentAgain.ok) {
      expect(spentAgain.errors[0]?.code).toBe("DND35_STANDARD_ACTION_SPENT");
    }
  });

  it("advances turns and begins a new round after the last combatant", () => {
    const state = createEncounterState([
      { characterId: "hero", initiativeRoll: 18, initiativeModifier: 1 },
      { characterId: "enemy", initiativeRoll: 8, initiativeModifier: 0 },
    ]);

    const first = advanceEncounterTurn(state);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.roundAdvanced).toBe(false);
    expect(first.value.previousCharacterId).toBe("hero");
    expect(first.value.currentCharacterId).toBe("enemy");
    expect(first.value.state.roundNumber).toBe(1);

    const second = advanceEncounterTurn(first.value.state);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.roundAdvanced).toBe(true);
    expect(second.value.currentCharacterId).toBe("hero");
    expect(second.value.state.roundNumber).toBe(2);
    expect(second.value.state.activeTurnIndex).toBe(0);
  });

  it("resets AoOs at round boundaries and honors next-turn swift debt", () => {
    const initial = createEncounterState([
      { characterId: "hero", initiativeRoll: 18, initiativeModifier: 1, attacksOfOpportunityPerRound: 2 },
      { characterId: "enemy", initiativeRoll: 8, initiativeModifier: 0 },
    ]);
    const withUsage: EncounterState = {
      ...initial,
      participants: initial.participants.map((participant) =>
        participant.characterId === "hero"
          ? {
              ...participant,
              attacksOfOpportunityRemaining: 0,
              swiftAvailable: true,
              swiftDebtNextTurn: true,
            }
          : participant,
      ),
    };

    const enemyTurn = advanceEncounterTurn(withUsage);
    expect(enemyTurn.ok).toBe(true);
    if (!enemyTurn.ok) return;
    const nextRound = advanceEncounterTurn(enemyTurn.value.state);
    expect(nextRound.ok).toBe(true);
    if (!nextRound.ok) return;

    const hero = nextRound.value.state.participants.find(
      (participant) => participant.characterId === "hero",
    );
    expect(hero?.attacksOfOpportunityRemaining).toBe(2);
    expect(hero?.swiftAvailable).toBe(false);
    expect(hero?.swiftDebtNextTurn).toBe(false);
    expect(hero?.lastTurnRound).toBe(2);
  });
});
