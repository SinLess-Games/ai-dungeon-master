import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadCampaignPlaySchemaReadiness: vi.fn(),
  loadDmPlannerContext: vi.fn(),
  loadRecentDmEvents: vi.fn(),
  loadDmConversationText: vi.fn(),
  loadResolvedDmActionHistory: vi.fn(),
  executeDmPlannerCommand: vi.fn(),
  planDmTurn: vi.fn(),
  evaluateAlignmentAction: vi.fn(),
  executeGameCommand: vi.fn(),
  createDatabase: vi.fn(() => ({})),
}));

vi.mock("@/infrastructure/database/client", () => ({
  createDatabase: mocks.createDatabase,
}));

vi.mock("@/modules/campaigns/server/campaignPlaySchemaReadiness", () => ({
  loadCampaignPlaySchemaReadiness: mocks.loadCampaignPlaySchemaReadiness,
}));

vi.mock("@/modules/campaigns/server/dmTurnRuntime", () => ({
  loadDmPlannerContext: mocks.loadDmPlannerContext,
  loadRecentDmEvents: mocks.loadRecentDmEvents,
  loadDmConversationText: mocks.loadDmConversationText,
}));

vi.mock("@/modules/campaigns/server/dmActionHistory", () => ({
  loadResolvedDmActionHistory: mocks.loadResolvedDmActionHistory,
  serializeDmActionProgress: vi.fn(() => "(No resolved DM-requested checks yet.)"),
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
  playerMessageId: "player-message-1",
  playerAction: "I finish the objective.",
};

describe("structured AI DM turn orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadCampaignPlaySchemaReadiness.mockResolvedValue({
      dmActions: true,
      initiativeActions: true,
      alignmentTracking: true,
      structuredDm: true,
      missingTables: [],
    });
    mocks.loadDmPlannerContext.mockResolvedValue(context());
    mocks.loadRecentDmEvents.mockResolvedValue([]);
    mocks.loadDmConversationText.mockResolvedValue("Ari: I finish the objective.");
    mocks.loadResolvedDmActionHistory.mockResolvedValue([]);
    mocks.evaluateAlignmentAction.mockResolvedValue({
      record: false,
      lawChaosDelta: 0,
      goodEvilDelta: 0,
      reason: "No meaningful alignment drift.",
    });
  });

  it("falls back before loading structured state when its D1 migrations are unavailable", async () => {
    mocks.loadCampaignPlaySchemaReadiness.mockResolvedValueOnce({
      dmActions: false,
      initiativeActions: false,
      alignmentTracking: false,
      structuredDm: false,
      missingTables: ["campaign_dm_actions", "runtime_dnd35_alignment_states"],
    });

    await expect(runStructuredDmTurn(input)).resolves.toBeNull();
    expect(mocks.loadDmPlannerContext).not.toHaveBeenCalled();
    expect(mocks.loadResolvedDmActionHistory).not.toHaveBeenCalled();
    expect(mocks.planDmTurn).not.toHaveBeenCalled();
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

    await expect(runStructuredDmTurn({ ...input, onCommittedResult })).rejects.toThrow(
      "AI provider failed after the commit",
    );

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
    expect(mocks.createDatabase).toHaveBeenCalledOnce();
    expect(onCommittedResult).toHaveBeenCalledOnce();
    expect(onCommittedResult).toHaveBeenCalledWith(alignmentResult);
  });

  it("does not execute a proposed command after the requesting stream is aborted", async () => {
    const controller = new AbortController();
    mocks.planDmTurn.mockImplementationOnce(async () => {
      controller.abort();
      return {
        kind: "command",
        command: { type: "progression.xp.grant", amount: 100, reason: "Completed." },
      };
    });
    await expect(runStructuredDmTurn({ ...input, signal: controller.signal })).rejects.toThrow();
    expect(mocks.executeDmPlannerCommand).not.toHaveBeenCalled();
    expect(mocks.executeGameCommand).not.toHaveBeenCalled();
  });

  it("preserves and publishes a committed command but stops further planning on cancellation", async () => {
    const controller = new AbortController();
    const committed = {
      type: "progression.xp.grant",
      value: { eventId: "event-1", sessionId: "session-1", amount: 100 },
    };
    mocks.planDmTurn.mockResolvedValueOnce({
      kind: "command",
      command: { type: "progression.xp.grant", amount: 100, reason: "Completed." },
    });
    mocks.executeDmPlannerCommand.mockResolvedValueOnce(committed);
    const onCommittedResult = vi.fn(() => controller.abort());
    await expect(
      runStructuredDmTurn({ ...input, signal: controller.signal, onCommittedResult }),
    ).rejects.toThrow();
    expect(mocks.planDmTurn).toHaveBeenCalledTimes(1);
    expect(mocks.executeDmPlannerCommand).toHaveBeenCalledTimes(1);
    expect(onCommittedResult).toHaveBeenCalledWith(committed);
  });
});
