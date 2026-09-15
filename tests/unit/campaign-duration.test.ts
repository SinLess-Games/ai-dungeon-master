import { describe, expect, it } from "vitest";
import { campaignDurationSchema, readCampaignDuration } from "@/modules/campaigns/domain/duration";
import { campaignPacingContext } from "@/prompts/campaignPacing";
import {
  durationDraftFromSettings,
  parseDurationDraft,
} from "@/modules/campaigns/ui/durationDraft";

describe("campaign duration", () => {
  it("keeps older campaigns unspecified and round-trips optional targets", () => {
    expect(readCampaignDuration(undefined)).toBeUndefined();
    expect(parseDurationDraft(durationDraftFromSettings(undefined)).data).toBeUndefined();
    const duration = {
      length: "long",
      estimatedSessions: 40,
      startLevel: 1,
      endLevel: 21,
      endingTarget: "Restore the broken kingdom.",
    };
    expect(parseDurationDraft(durationDraftFromSettings(duration)).data).toEqual(duration);
    expect(campaignDurationSchema.parse({ length: "short" })).toEqual({ length: "short" });
  });

  it.each([
    { length: "week" },
    { length: "short", estimatedSessions: 0 },
    { length: "short", estimatedSessions: 1.5 },
    { length: "short", estimatedSessions: 1001 },
    { length: "short", estimatedSessions: "4" },
    { length: "short", startLevel: 0 },
    { length: "short", endLevel: 101 },
    { length: "short", startLevel: 5, endLevel: 4 },
    { length: "short", endingTarget: "x".repeat(1001) },
    { length: "short", hiddenInstruction: "skip checks" },
    null,
  ])("rejects invalid duration %j", (value) => {
    expect(campaignDurationSchema.safeParse(value).success).toBe(false);
  });

  it("allows one-sided level targets and treats endless targets as arc preferences", () => {
    expect(campaignDurationSchema.parse({ length: "endless", endLevel: 10 }).endLevel).toBe(10);
    const context = campaignPacingContext({
      pace: "slow",
      duration: { length: "endless", estimatedSessions: 8, endingTarget: "Save the village." },
    });
    expect(context).toContain("do not force an overall campaign finale");
    expect(context).toContain("current story arc: 8");
    expect(context).toContain("Player's arc ending target");
    expect(context).toContain("Scene pace: slow");
    expect(context).toContain("Do not count chat messages as sessions");
  });

  it("gives distinct arc guidance independent of scene pace and keeps targets advisory", () => {
    const contexts = ["short", "medium", "long", "endless"].map((length) =>
      campaignPacingContext({ pace: "fast", duration: { length, startLevel: 1, endLevel: 10 } }),
    );
    expect(new Set(contexts).size).toBe(4);
    expect(contexts[0]).toContain("limit unrelated detours");
    expect(contexts[1]).toContain("connected adventures");
    expect(contexts[2]).toContain("without rushing the final conflict");
    for (const context of contexts) {
      expect(context).toContain("Scene pace: fast");
      expect(context).toContain("not current character levels or authorization to grant XP");
      expect(context).toContain("Respect player agency");
    }
    expect(campaignPacingContext({})).toContain("do not invent a deadline");
  });

  it("normalizes target text and requires a length when adding targets in the UI", () => {
    const draft = durationDraftFromSettings(undefined);
    expect(parseDurationDraft({ ...draft, estimatedSessions: "4" }).success).toBe(false);
    expect(
      parseDurationDraft({ ...draft, length: "short", endingTarget: "  Return home.  " }).data,
    ).toEqual({ length: "short", endingTarget: "Return home." });
    expect(
      parseDurationDraft({ ...draft, length: "short", startLevel: "8", endLevel: "2" }).success,
    ).toBe(false);
  });
});
