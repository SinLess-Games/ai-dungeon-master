import { describe, expect, it } from "vitest";
import { plannerCommandToGameCommand } from "@/modules/campaigns/server/dmToolExecution";
import type { DmPlannerContext } from "@/modules/campaigns/server/dmToolPlanner";

function context(): DmPlannerContext {
  return {
    actors: [
      { id: "hero-actor", characterId: "character-1", name: "Ari", kind: "character", status: "active" },
      { id: "goblin-actor", characterId: null, name: "Goblin", kind: "monster", status: "active" },
    ],
    encounter: {
      id: "encounter-42",
      roundNumber: 2,
      activeTurnIndex: 0,
      currentActorId: "hero-actor",
      participantIds: ["hero-actor", "goblin-actor"],
    },
    activeConditions: [],
    character: {
      character: { id: "character-1", name: "Ari", actorId: "hero-actor" },
      skills: [],
      weapons: [],
      castingTracks: [],
      inventory: [],
      alignment: { alignment: "N", lawChaosScore: 0, goodEvilScore: 0 },
    },
  };
}

const unusedBinding = {} as D1Database;

describe("AI DM planner command translation", () => {
  it("injects the acting actor id server-side for attacks", async () => {
    await expect(
      plannerCommandToGameCommand(unusedBinding, context(), {
        type: "combat.attack",
        targetId: "goblin-actor",
        kind: "melee",
      }),
    ).resolves.toEqual({
      type: "combat.attack",
      attackerId: "hero-actor",
      targetId: "goblin-actor",
      kind: "melee",
    });
  });

  it("injects the active encounter and current actor for end-turn commands", async () => {
    await expect(
      plannerCommandToGameCommand(unusedBinding, context(), { type: "encounter.end_turn" }),
    ).resolves.toEqual({
      type: "encounter.end_turn",
      encounterId: "encounter-42",
      actorId: "hero-actor",
    });
  });

  it("injects the acting actor id for XP grants", async () => {
    await expect(
      plannerCommandToGameCommand(unusedBinding, context(), {
        type: "progression.xp.grant",
        amount: 250,
        reason: "Quest objective completed.",
      }),
    ).resolves.toEqual({
      type: "progression.xp.grant",
      actorId: "hero-actor",
      amount: 250,
      reason: "Quest objective completed.",
    });
  });

  it("injects the acting actor id for prepared casting", async () => {
    await expect(
      plannerCommandToGameCommand(unusedBinding, context(), {
        type: "spell.cast.prepared",
        castingTrackId: "wizard-track",
        spellId: "spell-magic-missile",
        preparationId: "prep-1",
        targetIds: ["goblin-actor"],
      }),
    ).resolves.toEqual({
      type: "spell.cast.prepared",
      actorId: "hero-actor",
      castingTrackId: "wizard-track",
      spellId: "spell-magic-missile",
      preparationId: "prep-1",
      targetIds: ["goblin-actor"],
    });
  });
});
