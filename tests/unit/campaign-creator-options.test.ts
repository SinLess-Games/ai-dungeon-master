import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_STYLE_LIMIT,
  campaignPaceOptions,
  campaignScaleOptions,
  campaignStructureOptions,
  campaignStyleOptions,
} from "@/modules/campaigns/domain/creatorOptions";

describe("campaign creator options", () => {
  it("ships a broad style and genre catalog", () => {
    expect(campaignStyleOptions).toHaveLength(30);
    expect(new Set(campaignStyleOptions.map((option) => option.id)).size).toBe(
      campaignStyleOptions.length,
    );
    expect(campaignStyleOptions.some((option) => option.id === "grimdark")).toBe(true);
    expect(CAMPAIGN_STYLE_LIMIT).toBe(5);
  });

  it("supports heroic through epic campaign scales", () => {
    expect(campaignScaleOptions.map((option) => option.id)).toEqual([
      "heroic",
      "paragon",
      "epic",
    ]);
    expect(campaignScaleOptions.find((option) => option.id === "epic")?.levelRange).toBe("21+");
  });

  it("defines selectable pacing and campaign structures", () => {
    expect(campaignPaceOptions.map((option) => option.id)).toEqual(["slow", "moderate", "fast"]);
    expect(campaignStructureOptions.length).toBeGreaterThanOrEqual(8);
  });
});
