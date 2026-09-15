import { describe, expect, it } from "vitest";
import {
  assertCampaignDmNarration,
  campaignDmNarrationViolation,
} from "@/modules/campaigns/server/dmCampaignChatPolicy";

describe("AI DM campaign chat narration policy", () => {
  it("rejects character-sheet recaps in live campaign chat", () => {
    const text = `
* **Race:** Mind Flayer
* **Classes:** Archivist 1 / Wizard 1 (Gestalt)
* **Key Attributes:** Intellect and wisdom are formidable.
* **Current State:** You are in your stone cell.
`;

    expect(campaignDmNarrationViolation(text)).toMatch(/character-sheet/i);
    expect(() => assertCampaignDmNarration(text)).toThrow(/AI_DM_CAMPAIGN_NARRATION_POLICY/);
  });

  it("rejects pre-game setup questionnaires", () => {
    const text = `
Before your legend can begin, define the specifics of your current state. Please provide:

1. What equipment do you carry?
2. What specific research are you currently studying?

Once these are established, the story can continue.
`;

    expect(campaignDmNarrationViolation(text)).toMatch(/questionnaire/i);
  });

  it("allows immersive Markdown narration and meaningful scene choices", () => {
    const text = `
The brazier gutters as a cold draft slips beneath the cell door. **Something is moving in the corridor.**

You catch three details at once:

- iron scraping softly against stone
- a whispered phrase in a language you recognize
- the unmistakable smell of rain on dry earth

The footsteps stop outside your door.

*What do you do?*
`;

    expect(campaignDmNarrationViolation(text)).toBeNull();
    expect(assertCampaignDmNarration(text)).toBe(text);
  });

  it("allows ordinary in-scene questions without treating them as onboarding", () => {
    const text = "The guard lowers his spear. \"Which road did you take into the valley?\"";

    expect(campaignDmNarrationViolation(text)).toBeNull();
  });
});
