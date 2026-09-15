import { describe, expect, it, vi } from "vitest";
import type { WorkersAIBinding } from "@/infrastructure/ai/openaiCompatible";
import { evaluateAlignmentAction } from "@/modules/campaigns/server/alignmentEvaluator";
import {
  planDmTurn,
  type DmPlannerContext,
} from "@/modules/campaigns/server/dmToolPlanner";

function plannerContext(): DmPlannerContext {
  return {
    actors: [
      {
        id: "hero-actor",
        characterId: "character-1",
        name: "Ari",
        kind: "character",
        status: "active",
      },
      {
        id: "goblin-actor",
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
    encounter: null,
    activeConditions: [],
    character: {
      character: { id: "character-1", name: "Ari", actorId: "hero-actor" },
      skills: [
        {
          id: "skill-search",
          name: "Search",
          ability: "int",
          specialization: "",
          ranks: 5,
          trainedOnly: false,
        },
      ],
      weapons: [
        {
          inventoryId: "sword-stack",
          itemId: "longsword",
          name: "Longsword",
          attackKind: "melee",
          handedness: "one_handed",
          quantity: 1,
        },
      ],
      castingTracks: [],
      inventory: [],
      alignment: { alignment: "NG", lawChaosScore: 0, goodEvilScore: 50 },
    },
  };
}

function workersAiReturning(response: string) {
  const run = vi.fn<WorkersAIBinding["run"]>(async (_model, _input) => ({ response }));
  return {
    binding: { run } satisfies WorkersAIBinding,
    run,
  };
}

describe("AI DM provider contract", () => {
  it.each(["legacy", "structured"])("includes untruncated pacing in the %s planner", async (mode) => {
    const ai = workersAiReturning(JSON.stringify({ kind: "narration", text: "The trail leads home." }));
    const input = {
      campaignName: "Homeward",
      campaignDescription: null,
      rulesetId: "dnd35",
      rulesetVersion: "3.5",
      settings: {
        longNotes: "x".repeat(6000),
        pace: "slow",
        duration: { length: "short", estimatedSessions: 4, endingTarget: "Return home." },
      },
      recentEvents: [],
      conversation: "I follow the trail.",
    };
    const env = { AI: ai.binding, AI_GAME_MODEL: "@cf/test/game-model" };
    if (mode === "structured") {
      await planDmTurn(env, { ...input, context: plannerContext() });
    } else {
      await planDmTurn(env, { ...input, actors: [], character: { id: "hero", name: "Ari" }, skills: [] });
    }
    const request = ai.run.mock.calls[0]![1];
    const prompt = request.messages[1]?.content;
    expect(prompt).toContain("Campaign length: short");
    expect(prompt).toContain("limit unrelated detours");
    expect(prompt).toContain("Scene pace: slow");
    expect(prompt).toContain("campaign: 4");
    expect(prompt).toContain("Return home.");
  });

  it("feeds authoritative tool context to Workers AI and accepts a validated command", async () => {
    const ai = workersAiReturning(
      JSON.stringify({
        kind: "command",
        command: {
          type: "progression.xp.grant",
          amount: 300,
          reason: "The character completed the objective.",
        },
      }),
    );

    const decision = await planDmTurn(
      { AI: ai.binding, AI_GAME_MODEL: "@cf/test/game-model" },
      {
        campaignName: "The Black Glass Road",
        campaignDescription: "A dangerous road through forgotten ruins.",
        rulesetId: "dnd35",
        rulesetVersion: "3.5",
        settings: { tone: "grim" },
        recentEvents: [{ type: "quest.objective.completed" }],
        conversation: "Ari: I return the rescued villagers to safety.",
        context: plannerContext(),
        authoritativeToolResults: [{ eventId: "event-1", success: true }],
      },
    );

    expect(decision).toEqual({
      kind: "command",
      command: {
        type: "progression.xp.grant",
        amount: 300,
        reason: "The character completed the objective.",
      },
    });
    expect(ai.run).toHaveBeenCalledOnce();

    const [model, request] = ai.run.mock.calls[0]!;
    expect(model).toBe("@cf/test/game-model");
    expect(request.messages[0]?.role).toBe("system");
    expect(request.messages[0]?.content).toContain("deterministic rules engine");
    expect(request.messages[0]?.content).toContain("progression.xp.grant");
    expect(request.messages[1]?.role).toBe("user");
    expect(request.messages[1]?.content).toContain("Tool context:");
    expect(request.messages[1]?.content).toContain("skill-search");
    expect(request.messages[1]?.content).toContain("sword-stack");
    expect(request.messages[1]?.content).toContain("Authoritative results from this turn");
    expect(request.temperature).toBe(0.1);
  });

  it("rejects a provider command that invents an unavailable actor", async () => {
    const ai = workersAiReturning(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          attackerId: "dragon-that-does-not-exist",
          targetId: "hero-actor",
          kind: "melee",
          monsterAttackId: "bite",
        },
      }),
    );

    await expect(
      planDmTurn(
        { AI: ai.binding, AI_GAME_MODEL: "@cf/test/game-model" },
        {
          campaignName: "The Black Glass Road",
          campaignDescription: null,
          rulesetId: "dnd35",
          rulesetVersion: "3.5",
          settings: {},
          recentEvents: [],
          conversation: "Ari: I wait.",
          context: plannerContext(),
        },
      ),
    ).rejects.toThrow("AI_DM_REQUESTED_UNKNOWN_TARGET");
  });

  it("uses a separate bounded alignment adjudication contract", async () => {
    const ai = workersAiReturning(
      JSON.stringify({
        record: true,
        lawChaosDelta: -2,
        goodEvilDelta: 6,
        reason: "Ari defied an unlawful order to protect innocent prisoners.",
      }),
    );

    const evaluation = await evaluateAlignmentAction(
      { AI: ai.binding, AI_GAME_MODEL: "@cf/test/game-model" },
      {
        rulesetId: "dnd35",
        rulesetVersion: "3.5",
        characterName: "Ari",
        current: { alignment: "NG", lawChaosScore: 0, goodEvilScore: 50 },
        playerAction: "I break the prisoners out instead of obeying the corrupt magistrate.",
        authoritativeResults: [{ eventId: "rescue-event", rescued: 4 }],
        recentEvents: [],
      },
    );

    expect(evaluation).toEqual({
      record: true,
      lawChaosDelta: -2,
      goodEvilDelta: 6,
      reason: "Ari defied an unlawful order to protect innocent prisoners.",
    });

    const [, request] = ai.run.mock.calls[0]!;
    expect(request.messages[0]?.content).toContain("Most ordinary actions are not alignment events");
    expect(request.messages[0]?.content).toContain("Do not change alignment directly");
    expect(request.messages[1]?.content).toContain("Assess only this completed player turn");
    expect(request.temperature).toBe(0);
  });

  it("fails closed when an alignment provider exceeds the allowed per-action drift", async () => {
    const ai = workersAiReturning(
      JSON.stringify({
        record: true,
        lawChaosDelta: 0,
        goodEvilDelta: -21,
        reason: "Invalid oversized drift.",
      }),
    );

    await expect(
      evaluateAlignmentAction(
        { AI: ai.binding },
        {
          rulesetId: "dnd35",
          rulesetVersion: "3.5",
          characterName: "Ari",
          current: { alignment: "N", lawChaosScore: 0, goodEvilScore: 0 },
          playerAction: "An action.",
          authoritativeResults: [],
          recentEvents: [],
        },
      ),
    ).rejects.toThrow();
  });
});
