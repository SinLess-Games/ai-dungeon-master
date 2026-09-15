import { describe, expect, it } from "vitest";
import { isRepeatedAuthoritativeCheck } from "@/modules/campaigns/server/dmCheckDedup";
import type { DmTurnDecision } from "@/modules/campaigns/server/dmToolPlanner";

function skillCheck(skillId: string, specialization?: string): DmTurnDecision {
  return {
    kind: "check",
    preface: "Make a check.",
    check: {
      type: "check.skill",
      skillId,
      ...(specialization ? { specialization } : {}),
      dc: 15,
      reason: "Resolve the declared action.",
    },
  };
}

function saveCheck(save: "fort" | "ref" | "will"): DmTurnDecision {
  return {
    kind: "check",
    preface: "Make a save.",
    check: {
      type: "check.save",
      save,
      dc: 15,
      reason: "Resolve the declared action.",
    },
  };
}

describe("DM check deduplication", () => {
  it("treats an already-resolved skill as the same requested check", () => {
    expect(
      isRepeatedAuthoritativeCheck(skillCheck("hide"), [
        {
          allowed: true,
          actorId: "hero",
          skillId: "hide",
          modifier: 8,
          check: { naturalRoll: 12, total: 20, success: true },
        },
      ]),
    ).toBe(true);
  });

  it("unwraps GameCommandResult values", () => {
    expect(
      isRepeatedAuthoritativeCheck(skillCheck("hide"), [
        {
          type: "check.skill",
          value: {
            allowed: true,
            actorId: "hero",
            skillId: "hide",
            modifier: 8,
            check: { naturalRoll: 12, total: 20, success: true },
          },
        },
      ]),
    ).toBe(true);
  });

  it("still permits a genuinely different skill check", () => {
    expect(
      isRepeatedAuthoritativeCheck(skillCheck("move-silently"), [
        { allowed: true, actorId: "hero", skillId: "hide" },
      ]),
    ).toBe(false);
  });

  it("does not treat a disallowed skill result as a completed roll", () => {
    expect(
      isRepeatedAuthoritativeCheck(skillCheck("hide"), [
        { allowed: false, skillId: "hide", code: "DND35_SKILL_TRAINING_REQUIRED" },
      ]),
    ).toBe(false);
  });

  it("prevents the same saving throw from being requested twice", () => {
    expect(
      isRepeatedAuthoritativeCheck(saveCheck("will"), [
        { actorId: "hero", save: "will", bonus: 4, result: { naturalRoll: 9, total: 13 } },
      ]),
    ).toBe(true);
    expect(
      isRepeatedAuthoritativeCheck(saveCheck("fort"), [
        { actorId: "hero", save: "will", bonus: 4, result: { naturalRoll: 9, total: 13 } },
      ]),
    ).toBe(false);
  });
});
