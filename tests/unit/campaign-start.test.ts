import { describe, expect, it, vi } from "vitest";
import { engineSuccess, type EngineResult } from "@/engine";
import {
  startCampaign,
  type CampaignStartAggregate,
  type CampaignStartRepository,
  type GeneratedWorldPayload,
  type WorldGenerator,
} from "@/modules/campaigns/server/startCampaign";

function aggregate(withReadyCharacter = true): CampaignStartAggregate {
  return {
    ownerUserId: "owner-1",
    generationSeed: "seed-123",
    campaign: {
      id: "campaign-1",
      status: "ready",
      rulesetId: "dnd35",
      rulesetVersion: "3.5",
      worldId: null,
      startRequestedAt: null,
      startedAt: null,
    },
    characters: [
      {
        id: "hero-1",
        status: withReadyCharacter ? "ready" : "draft",
        rulesetId: "dnd35",
        rulesetVersion: "3.5",
      },
    ],
  };
}

function repository(
  loaded: CampaignStartAggregate | null,
  calls: string[],
): CampaignStartRepository {
  return {
    async load() {
      calls.push("load");
      return loaded;
    },
    async begin(input) {
      calls.push(`begin:${input.campaign.status}:${input.worldId}`);
      return engineSuccess(undefined);
    },
    async complete(input) {
      calls.push(`complete:${input.campaign.status}:${input.worldId}:${input.sessionId}`);
      return engineSuccess(undefined);
    },
    async recover(input) {
      calls.push(`recover:${input.campaign.status}:${input.failedWorldId}`);
      return engineSuccess(undefined);
    },
  };
}

function generator(
  calls: string[],
  result: GeneratedWorldPayload | Error = { name: "Aeragorn" },
): WorldGenerator {
  return {
    async generate(input) {
      calls.push(`generate:${input.worldId}:${input.characterIds.join(",")}`);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

describe("campaign start orchestration", () => {
  it("never creates or generates a world before a ready character exists", async () => {
    const calls: string[] = [];
    const repo = repository(aggregate(false), calls);
    const worldGenerator = generator(calls);

    const result = await startCampaign({
      campaignId: "campaign-1",
      requestingUserId: "owner-1",
      repository: repo,
      worldGenerator,
      createWorldId: () => "world-1",
      createSessionId: () => "session-1",
      now: () => 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.code === "CAMPAIGN_READY_CHARACTER_REQUIRED")).toBe(
      true,
    );
    expect(calls).toEqual(["load"]);
  });

  it("creates the world and first session only after validation, then activates the campaign", async () => {
    const calls: string[] = [];
    let time = 100;

    const result = await startCampaign({
      campaignId: "campaign-1",
      requestingUserId: "owner-1",
      repository: repository(aggregate(), calls),
      worldGenerator: generator(calls, {
        name: "Aeragorn",
        generatorVersion: "worldgen-v1",
      }),
      createWorldId: () => "world-1",
      createSessionId: () => "session-1",
      now: () => {
        const current = time;
        time += 100;
        return current;
      },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        campaignId: "campaign-1",
        worldId: "world-1",
        sessionId: "session-1",
        status: "active",
        characterIds: ["hero-1"],
      },
    });
    expect(calls).toEqual([
      "load",
      "begin:starting:world-1",
      "generate:world-1:hero-1",
      "complete:active:world-1:session-1",
    ]);
  });

  it("recovers to ready and never creates a session when generation throws", async () => {
    const calls: string[] = [];
    const result = await startCampaign({
      campaignId: "campaign-1",
      requestingUserId: "owner-1",
      repository: repository(aggregate(), calls),
      worldGenerator: generator(calls, new Error("Generator unavailable")),
      createWorldId: () => "world-failed",
      createSessionId: () => "session-should-not-exist",
      now: () => 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("CAMPAIGN_WORLD_GENERATION_FAILED");
    expect(calls).toEqual([
      "load",
      "begin:starting:world-failed",
      "generate:world-failed:hero-1",
      "recover:ready:world-failed",
    ]);
  });

  it("does not start a campaign for a non-owner", async () => {
    const calls: string[] = [];
    const worldGenerator = { generate: vi.fn() } satisfies WorldGenerator;
    const result = await startCampaign({
      campaignId: "campaign-1",
      requestingUserId: "someone-else",
      repository: repository(aggregate(), calls),
      worldGenerator,
      createWorldId: () => "world-1",
      createSessionId: () => "session-1",
      now: () => 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("CAMPAIGN_START_FORBIDDEN");
    expect(worldGenerator.generate).not.toHaveBeenCalled();
    expect(calls).toEqual(["load"]);
  });

  it("surfaces persistence failure before invoking world generation", async () => {
    const calls: string[] = [];
    const repo = repository(aggregate(), calls);
    repo.begin = async () => {
      calls.push("begin:failed");
      return {
        ok: false,
        errors: [{ code: "DB_WRITE_FAILED", message: "Unable to persist start." }],
      } satisfies EngineResult<void>;
    };
    const worldGenerator = { generate: vi.fn() } satisfies WorldGenerator;

    const result = await startCampaign({
      campaignId: "campaign-1",
      requestingUserId: "owner-1",
      repository: repo,
      worldGenerator,
      createWorldId: () => "world-1",
      createSessionId: () => "session-1",
      now: () => 100,
    });

    expect(result.ok).toBe(false);
    expect(worldGenerator.generate).not.toHaveBeenCalled();
    expect(calls).toEqual(["load", "begin:failed"]);
  });
});
