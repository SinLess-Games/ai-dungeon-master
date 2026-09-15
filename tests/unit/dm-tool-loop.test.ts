import { describe, expect, it, vi } from "vitest";
import { runDmToolLoop } from "@/modules/campaigns/server/dmToolLoop";
import type { DmTurnDecision } from "@/modules/campaigns/server/dmToolPlanner";

describe("AI DM tool execution loop", () => {
  it("executes authoritative commands until the planner reaches narration", async () => {
    const decisions: DmTurnDecision[] = [
      {
        kind: "command",
        command: {
          type: "encounter.start",
          participantIds: ["hero-1", "goblin-1"],
        },
      },
      {
        kind: "command",
        command: {
          type: "combat.attack",
          targetId: "goblin-1",
          kind: "melee",
          weaponInventoryId: "sword-stack",
        },
      },
      { kind: "narration", text: "The goblin reels beneath the blow." },
    ];
    const plan = vi.fn(async () => decisions.shift()!);
    const execute = vi.fn(async (command) => ({ eventId: `event:${command.type}` }));

    const result = await runDmToolLoop({ plan, execute, maxCommands: 4 });

    expect(result.decision).toEqual({
      kind: "narration",
      text: "The goblin reels beneath the blow.",
    });
    expect(result.executions).toHaveLength(2);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(plan).toHaveBeenCalledTimes(3);
    expect(plan.mock.calls[2]?.[0]).toHaveLength(2);
  });

  it("stops immediately when a player-supplied check is required", async () => {
    const execute = vi.fn();
    const result = await runDmToolLoop({
      plan: async () => ({
        kind: "check",
        preface: "Give me a Search check.",
        check: {
          type: "check.skill",
          skillId: "skill-search",
          dc: 18,
          reason: "Notice the hidden pressure plate.",
        },
      }),
      execute,
    });

    expect(result.decision.kind).toBe("check");
    expect(result.executions).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("feeds each authoritative result into the next planning step", async () => {
    const seen: unknown[][] = [];
    let call = 0;
    const result = await runDmToolLoop({
      plan: async (executions) => {
        seen.push(executions.map((entry) => entry.result));
        call += 1;
        if (call === 1) {
          return {
            kind: "command",
            command: {
              type: "progression.xp.grant",
              amount: 100,
              reason: "Objective completed.",
            },
          };
        }
        return { kind: "narration", text: "Experience awarded." };
      },
      execute: async () => ({ eventId: "xp-event", amount: 100 }),
    });

    expect(result.decision.kind).toBe("narration");
    expect(seen).toEqual([[], [{ eventId: "xp-event", amount: 100 }]]);
  });

  it("fails closed when the model attempts an unbounded command chain", async () => {
    await expect(
      runDmToolLoop({
        maxCommands: 2,
        plan: async () => ({
          kind: "command",
          command: {
            type: "progression.xp.grant",
            amount: 1,
            reason: "Looping command.",
          },
        }),
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toThrow("AI_DM_TOOL_LOOP_LIMIT");
  });

  it("rejects unsafe loop bounds", async () => {
    await expect(
      runDmToolLoop({
        maxCommands: 0,
        plan: async () => ({ kind: "narration", text: "No action." }),
        execute: async () => ({}),
      }),
    ).rejects.toThrow(RangeError);
  });
});
