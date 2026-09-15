import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadDmPlannerContext: vi.fn(),
  loadRecentDmEvents: vi.fn(),
  loadDmConversationText: vi.fn(),
  executeDmPlannerCommand: vi.fn(),
  planDmTurn: vi.fn(),
  evaluateAlignmentAction: vi.fn(),
  executeGameCommand: vi.fn(),
}));

vi.mock("@/modules/campaigns/server/dmTurnRuntime", () => ({
  loadDmPlannerContext: mocks.loadDmPlannerContext,
  loadRecentDmEvents: mocks.loadRecentDmEvents,
  loadDmConversationText: mocks.loadDmConversationText,
}));

vi.mock("@/modules/campaigns/server/dmToolExecution", () => ({
  executeDmPlannerCommand: mocks.executeDmPlannerCommand,
}));

vi.mock("@/modules/campaigns/server/dmToolPlanner", () => ({
  planDmTurn: mocks.planDmTurn,
}));

vi.mock("@/modules/campaigns/server/alignmentEvaluator", () => ({
  evaluateAlignmentAction: mocks.evaluateAlignmentAction,
}));

vi.mock("@/modules/game/server/gameCommandService", () => ({
  executeGameCommand: mocks.executeGameCommand,
}));

import { runStructuredDmTurn } from "@/modules/campaigns/server/dmTurnOrchestrator";

function context() {
  return {
    actors: [
      {
        id: "hero-actor",
        characterId: "character-1",
        name: "Ari",
        kind: "character",
        status: "active",
      },
    ],
    encounter: null,
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

const input = {
  env: {},
  binding: {} as D1Database,
  campaign: {
    id: "campaign-1",
    name: "Black Glass Road",
    description: null,
    rulesetId: "dnd35",
    rulesetVersion: "3.5",
    settings: {},
  },
  userId: "user-1",
  characterId: "character-1",
  playerAction: "I finish the objective.",
};

describe("structured AI DM turn orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadDmPlannerContext.mockResolvedValue(context());
    mocks.loadRecentDmEvents.mockResolvedValue([]);
    mocks.loadDmConversationText.mockResolvedValue("Ari: I finish the objective.");
    mocks.evaluateAlignmentAction.mockResolvedValue({
      record: false,
      lawChaosDelta: 0,
      goodEvilDelta: 0,
      reason: "No meaningful alignment drift.",
    });
  });

  it("reports every committed command immediately instead of waiting for the whole model loop", async () => {
    const committed = {
      type: "progression.xp.grant",
      value: { eventId: "event-1", sessionId: "session-1", amount: 100 },
    };
    mocks.planDmTurn
      .mockResolvedValueOnce({
        kind: "command",
        command: {
          type: "progression.xp.grant",
          amount: 100,
          reason: "Objective completed.",
        },
      })
      .mockRejectedValueOnce(new Error("AI provider failed after the commit"));
    mocks.executeDmPlannerCommand.mockResolvedValueOnce(committed);
    const onCommittedResult = vi.fn();

    await expect(
      runStructuredDmTurn({ ...input, onCommittedResult }),
    ).rejects.toThrow("AI provider failed after the commit");

    expect(mocks.executeDmPlannerCommand).toHaveBeenCalledOnce();
    expect(onCommittedResult).toHaveBeenCalledOnce();
    expect(onCommittedResult).toHaveBeenCalledWith(committed);
  });

  it("reports alignment mutations through the same committed-result hook", async () => {
    mocks.planDmTurn.mockResolvedValueOnce({
      kind: "narration",
      text: "The rescued travelers make it safely home.",
    });
    mocks.evaluateAlignmentAction.mockResolvedValueOnce({
      record: true,
      lawChaosDelta: 0,
      goodEvilDelta: 5,
      reason: "The character knowingly protected innocent travelers.",
    });
    const alignmentResult = {
      type: "alignment.record",
      value: { eventId: "alignment-event", sessionId: "session-1" },
    };
    mocks.executeGameCommand.mockResolvedValueOnce(alignmentResult);
    const onCommittedResult = vi.fn();

    const result = await runStructuredDmTurn({ ...input, onCommittedResult });

    expect(result?.decision).toEqual({
      kind: "narration",
      text: "The rescued travelers make it safely home.",
    });
    expect(result?.alignmentResult).toEqual(alignmentResult);
    expect(onCommittedResult).toHaveBeenCalledOnce();
    expect(onCommittedResult).toHaveBeenCalledWith(alignmentResult);
  });
});
