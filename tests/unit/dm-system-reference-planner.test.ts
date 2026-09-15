import { describe, expect, it, vi } from "vitest";
import type { WorkersAIBinding } from "@/infrastructure/ai/openaiCompatible";
import { loadDmSystemReferences } from "@/modules/campaigns/server/dmSystemReferencePlanner";

describe("AI DM system reference planning", () => {
  it("does not spend an AI call when the rules catalog schema is unavailable", async () => {
    const run = vi.fn<WorkersAIBinding["run"]>(async () => {
      throw new Error("AI should not be called without catalog tables.");
    });
    const binding = {
      prepare: vi.fn(() => ({
        first: vi.fn(async () => ({ count: 0 })),
      })),
    } as unknown as D1Database;

    const references = await loadDmSystemReferences({
      env: { AI: { run } },
      binding,
      userId: "user-1",
      rulesetId: "dnd35",
      rulesetVersion: "3.5",
      campaignName: "The Black Glass Road",
      campaignDescription: null,
      playerText: "Can I grapple the ogre?",
    });

    expect(references).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });

  it("does not touch D1 or AI for a ruleset without a catalog adapter", async () => {
    const run = vi.fn<WorkersAIBinding["run"]>();
    const prepare = vi.fn(() => {
      throw new Error("D1 should not be queried.");
    });

    const references = await loadDmSystemReferences({
      env: { AI: { run } },
      binding: { prepare } as unknown as D1Database,
      userId: "user-1",
      rulesetId: "other-system",
      rulesetVersion: "1.0",
      campaignName: "Other Game",
      campaignDescription: null,
      playerText: "What does grapple do?",
    });

    expect(references).toEqual([]);
    expect(prepare).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
});
