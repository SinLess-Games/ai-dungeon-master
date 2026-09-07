import { describe, expect, it } from "vitest";
import {
  beginCampaignStart,
  completeCampaignStart,
  evaluateCampaignReadiness,
  failCampaignStart,
  reconcileCampaignReadiness,
  type CampaignCharacterSnapshot,
  type CampaignLifecycleSnapshot,
} from "@/modules/campaigns/domain/lifecycle";

function campaign(
  overrides: Partial<CampaignLifecycleSnapshot> = {},
): CampaignLifecycleSnapshot {
  return {
    id: "campaign-1",
    status: "draft",
    rulesetId: "dnd35",
    rulesetVersion: "3.5",
    worldId: null,
    startRequestedAt: null,
    startedAt: null,
    ...overrides,
  };
}

function character(
  overrides: Partial<CampaignCharacterSnapshot> = {},
): CampaignCharacterSnapshot {
  return {
    id: "character-1",
    status: "ready",
    rulesetId: "dnd35",
    rulesetVersion: "3.5",
    ...overrides,
  };
}

describe("campaign-first lifecycle", () => {
  it("does not consider a campaign ready until a rules-valid character is ready", () => {
    const none = evaluateCampaignReadiness({ campaign: campaign(), characters: [] });
    expect(none.ready).toBe(false);
    expect(none.issues[0]?.code).toBe("CAMPAIGN_READY_CHARACTER_REQUIRED");

    const draftOnly = evaluateCampaignReadiness({
      campaign: campaign(),
      characters: [character({ status: "draft" })],
    });
    expect(draftOnly.ready).toBe(false);

    const ready = evaluateCampaignReadiness({
      campaign: campaign(),
      characters: [character()],
    });
    expect(ready).toEqual({
      ready: true,
      readyCharacterIds: ["character-1"],
      issues: [],
    });
  });

  it("rejects a character built for a different ruleset version", () => {
    const result = evaluateCampaignReadiness({
      campaign: campaign(),
      characters: [character({ rulesetVersion: "3.5-homebrew" })],
    });

    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "CAMPAIGN_CHARACTER_RULESET_MISMATCH",
        "CAMPAIGN_READY_CHARACTER_REQUIRED",
      ]),
    );
  });

  it("promotes and demotes only pre-start draft/ready campaigns", () => {
    expect(
      reconcileCampaignReadiness({
        campaign: campaign(),
        characters: [character()],
      }).status,
    ).toBe("ready");

    expect(
      reconcileCampaignReadiness({
        campaign: campaign({ status: "ready" }),
        characters: [character({ status: "draft" })],
      }).status,
    ).toBe("draft");

    expect(
      reconcileCampaignReadiness({
        campaign: campaign({ status: "active", worldId: "world-1" }),
        characters: [],
      }).status,
    ).toBe("active");
  });

  it("allocates a world only when campaign start begins", () => {
    const result = beginCampaignStart({
      campaign: campaign({ status: "ready" }),
      characters: [character()],
      worldId: "world-1",
      requestedAt: 100,
    });

    expect(result).toEqual({
      ok: true,
      value: campaign({
        status: "starting",
        worldId: "world-1",
        startRequestedAt: 100,
      }),
    });
  });

  it("refuses to allocate a world before a ready character exists", () => {
    const result = beginCampaignStart({
      campaign: campaign(),
      characters: [character({ status: "draft" })],
      worldId: "world-1",
      requestedAt: 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.code === "CAMPAIGN_READY_CHARACTER_REQUIRED")).toBe(
      true,
    );
  });

  it("activates only after the allocated world is ready", () => {
    const starting = campaign({
      status: "starting",
      worldId: "world-1",
      startRequestedAt: 100,
    });

    const generating = completeCampaignStart({
      campaign: starting,
      worldStatus: "generating",
      completedAt: 200,
    });
    expect(generating.ok).toBe(false);

    const ready = completeCampaignStart({
      campaign: starting,
      worldStatus: "ready",
      completedAt: 200,
    });
    expect(ready).toEqual({
      ok: true,
      value: campaign({
        status: "active",
        worldId: "world-1",
        startRequestedAt: 100,
        startedAt: 200,
      }),
    });
  });

  it("recovers a failed start to ready without retaining a failed world", () => {
    const result = failCampaignStart(
      campaign({
        status: "starting",
        worldId: "failed-world",
        startRequestedAt: 100,
      }),
    );

    expect(result).toEqual({
      ok: true,
      value: campaign({ status: "ready" }),
    });
  });

  it("detects illegal pre-start world attachment", () => {
    const result = evaluateCampaignReadiness({
      campaign: campaign({ status: "ready", worldId: "too-early" }),
      characters: [character()],
    });

    expect(result.ready).toBe(false);
    expect(result.issues.some((issue) => issue.code === "CAMPAIGN_WORLD_CREATED_TOO_EARLY")).toBe(
      true,
    );
  });
});
