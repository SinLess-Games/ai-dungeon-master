import { describe, expect, it } from "vitest";
import {
  parseDmTurnDecision,
  validateDmTurnDecision,
  type DmPlannerContext,
} from "@/modules/campaigns/server/dmToolPlanner";

function context(currentActorId = "goblin-1"): DmPlannerContext {
  return {
    actors: [
      { id: "hero-1", characterId: "character-1", name: "Ari", kind: "character", status: "active" },
      {
        id: "goblin-1",
        characterId: null,
        name: "Goblin",
        kind: "monster",
        status: "active",
        attacks: [
          {
            id: "goblin-spear",
            name: "Spear",
            attackMode: "melee",
            canUseAsStandard: true,
            attackCount: 1,
            routineKey: "primary",
            sequence: 0,
          },
        ],
      },
    ],
    encounter: {
      id: "encounter-1",
      roundNumber: 1,
      activeTurnIndex: 1,
      currentActorId,
      participantIds: ["hero-1", "goblin-1"],
    },
    activeConditions: [],
    character: {
      character: { id: "character-1", name: "Ari", actorId: "hero-1" },
      skills: [],
      weapons: [],
      castingTracks: [],
      inventory: [],
      alignment: { alignment: "N", lawChaosScore: 0, goodEvilScore: 0 },
    },
  };
}

describe("AI DM monster turns", () => {
  it("allows a known monster to use an exposed standard attack on its turn", () => {
    const decision = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          attackerId: "goblin-1",
          targetId: "hero-1",
          kind: "melee",
          monsterAttackId: "goblin-spear",
        },
      }),
    );
    expect(validateDmTurnDecision(decision, context())).toEqual(decision);
  });

  it("rejects invented monster attacks", () => {
    const decision = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          attackerId: "goblin-1",
          targetId: "hero-1",
          kind: "melee",
          monsterAttackId: "dragon-breath-that-does-not-exist",
        },
      }),
    );
    expect(() => validateDmTurnDecision(decision, context())).toThrow(
      "AI_DM_REQUESTED_UNAVAILABLE_MONSTER_ATTACK",
    );
  });

  it("rejects attacks by an actor whose turn is not active", () => {
    const decision = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          attackerId: "goblin-1",
          targetId: "hero-1",
          kind: "melee",
          monsterAttackId: "goblin-spear",
        },
      }),
    );
    expect(() => validateDmTurnDecision(decision, context("hero-1"))).toThrow(
      "AI_DM_ATTACKER_NOT_CURRENT_TURN",
    );
  });

  it("never lets the AI DM commandeer another player character", () => {
    const ctx = context("hero-1");
    ctx.actors.push({
      id: "other-player",
      characterId: "character-2",
      name: "Bren",
      kind: "character",
      status: "active",
    });
    const decision = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          attackerId: "other-player",
          targetId: "goblin-1",
          kind: "melee",
        },
      }),
    );
    expect(() => validateDmTurnDecision(decision, ctx)).toThrow(
      "AI_DM_ATTACKER_NOT_CURRENT_TURN",
    );
  });
});
