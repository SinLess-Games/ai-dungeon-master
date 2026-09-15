import { describe, expect, it } from "vitest";
import { serializeDmActionProgress } from "@/modules/campaigns/server/dmActionHistory";

describe("DM resolved-action progression ledger", () => {
  it("marks only checks from the exact current player message as current", () => {
    const serialized = serializeDmActionProgress(
      [
        {
          requestedByMessageId: "old-turn",
          kind: "check.skill",
          arguments: { type: "check.skill", skillId: "concentration", dc: 15 },
          result: { type: "check.skill", value: { skillId: "concentration", success: true } },
          resolvedAt: 100,
        },
        {
          requestedByMessageId: "current-turn",
          kind: "check.skill",
          arguments: { type: "check.skill", skillId: "hide", dc: 12 },
          result: { type: "check.skill", value: { skillId: "hide", success: true } },
          resolvedAt: 200,
        },
      ],
      "current-turn",
    );

    const ledger = JSON.parse(serialized) as Array<{
      turn: "current" | "historical";
      playerMessageId: string;
    }>;

    expect(ledger).toEqual([
      expect.objectContaining({ turn: "historical", playerMessageId: "old-turn" }),
      expect.objectContaining({ turn: "current", playerMessageId: "current-turn" }),
    ]);
  });

  it("returns an explicit empty ledger message when no checks have resolved", () => {
    expect(serializeDmActionProgress([], "current-turn")).toBe(
      "(No resolved DM-requested checks yet.)",
    );
  });
});
