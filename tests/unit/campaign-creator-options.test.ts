import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_STYLE_LIMIT,
  campaignDifficultyOptions,
  campaignPaceOptions,
  campaignScaleOptions,
  campaignStructureOptions,
  campaignStyleOptions,
  characterProgressionOptions,
  contentPolicyOptions,
  dmCreativityOptions,
  levelingModeOptions,
  rulesStrictnessOptions,
  worldTemplateOptions,
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

  it("defines world generation profiles and D&D progression policies", () => {
    expect(worldTemplateOptions.length).toBeGreaterThanOrEqual(6);
    expect(worldTemplateOptions.some((option) => option.id === "wild-magic")).toBe(true);
    expect(levelingModeOptions.map((option) => option.id)).toEqual(["experience", "milestone"]);
    expect(characterProgressionOptions.map((option) => option.id)).toEqual([
      "standard",
      "gestalt",
      "player-choice",
    ]);
  });

  it("defines AI DM and content controls", () => {
    expect(campaignDifficultyOptions.map((option) => option.id)).toEqual([
      "forgiving",
      "balanced",
      "challenging",
      "brutal",
    ]);
    expect(rulesStrictnessOptions).toHaveLength(3);
    expect(dmCreativityOptions).toHaveLength(3);
    expect(contentPolicyOptions.map((option) => option.id)).toEqual([
      "core",
      "official",
      "custom",
    ]);
  });
});
