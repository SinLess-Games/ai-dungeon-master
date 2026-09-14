import { describe, expect, it, vi } from "vitest";
import {
  executeGameCommand,
  type GameCommandHandlers,
} from "@/modules/game/server/gameCommandService";

function handlers() {
  return {
    startEncounter: vi.fn(async (_deps, input) => ({ started: input })),
    endTurn: vi.fn(async (_deps, input) => ({ endedTurn: input })),
    finishEncounter: vi.fn(async (_deps, input) => ({ finished: input })),
    attack: vi.fn(async (_deps, input) => ({ attacked: input })),
    skillCheck: vi.fn(async (_deps, input) => ({ skill: input })),
    savingThrow: vi.fn(async (_deps, input) => ({ save: input })),
    castPrepared: vi.fn(async (_deps, input) => ({ prepared: input })),
    castSpontaneous: vi.fn(async (_deps, input) => ({ spontaneous: input })),
    manifestPower: vi.fn(async (_deps, input) => ({ power: input })),
  } as unknown as GameCommandHandlers;
}

const deps = {} as Parameters<typeof executeGameCommand>[0];

describe("unified game command service", () => {
  it("routes mixed actor attacks through the authoritative combat handler", async () => {
    const h = handlers();
    const result = await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "combat.attack",
        attackerId: "monster-1",
        targetId: "hero-1",
        kind: "melee",
        monsterAttackId: "claw",
      },
      h,
    );

    expect(result.type).toBe("combat.attack");
    expect(h.attack).toHaveBeenCalledOnce();
    expect(h.attack).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      attackerId: "monster-1",
      targetId: "hero-1",
      kind: "melee",
      monsterAttackId: "claw",
    });
  });

  it("forwards a player-supplied natural roll to a skill check", async () => {
    const h = handlers();
    const result = await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "check.skill",
        actorId: "rogue-1",
        skillId: "search",
        specialization: "traps",
        dc: 18,
        roll: 14,
      },
      h,
    );

    expect(result.type).toBe("check.skill");
    expect(h.skillCheck).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "rogue-1",
      skillId: "search",
      specialization: "traps",
      dc: 18,
      roll: 14,
    });
  });

  it("forwards a player-supplied natural roll to a saving throw", async () => {
    const h = handlers();
    const result = await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "check.save",
        actorId: "cleric-1",
        save: "will",
        dc: 17,
        sourceId: "rune-1",
        roll: 9,
      },
      h,
    );

    expect(result.type).toBe("check.save");
    expect(h.savingThrow).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "cleric-1",
      save: "will",
      dc: 17,
      sourceId: "rune-1",
      roll: 9,
    });
  });

  it("routes resolved prepared spell casts with authoritative targets", async () => {
    const h = handlers();
    const result = await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "spell.cast.prepared",
        actorId: "wizard-1",
        castingTrackId: "wizard-track",
        spellId: "fireball",
        preparationId: "prep-1",
        targetIds: ["goblin-1", "goblin-2"],
      },
      h,
    );

    expect(result.type).toBe("spell.cast.prepared");
    expect(h.castPrepared).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "wizard-1",
      castingTrackId: "wizard-track",
      spellId: "fireball",
      preparationId: "prep-1",
      targetIds: ["goblin-1", "goblin-2"],
    });
  });

  it("keeps encounter lifecycle commands on the same command boundary", async () => {
    const h = handlers();
    await executeGameCommand(
      deps,
      "campaign-1",
      { type: "encounter.start", participantIds: ["hero-1", "goblin-1"] },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      { type: "encounter.end_turn", encounterId: "encounter-1", actorId: "hero-1" },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      { type: "encounter.finish", encounterId: "encounter-1", status: "completed" },
      h,
    );

    expect(h.startEncounter).toHaveBeenCalledOnce();
    expect(h.endTurn).toHaveBeenCalledOnce();
    expect(h.finishEncounter).toHaveBeenCalledOnce();
  });
});
