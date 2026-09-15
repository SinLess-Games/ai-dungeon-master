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
    damage: vi.fn(async (_deps, input) => ({ damage: input })),
    heal: vi.fn(async (_deps, input) => ({ healing: input })),
    applyCondition: vi.fn(async (_deps, input) => ({ appliedCondition: input })),
    removeCondition: vi.fn(async (_deps, input) => ({ removedCondition: input })),
    grantItem: vi.fn(async (_deps, input) => ({ grantedItem: input })),
    removeItem: vi.fn(async (_deps, input) => ({ removedItem: input })),
    grantXp: vi.fn(async (_deps, input) => ({ grantedXp: input })),
    recordAlignment: vi.fn(async (_deps, input) => ({ alignment: input })),
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

  it("forwards explicit attack, confirmation, and damage rolls", async () => {
    const h = handlers();
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "combat.attack",
        attackerId: "fighter-1",
        targetId: "orc-1",
        kind: "melee",
        weaponInventoryId: "longsword-stack",
        attackRoll: 19,
        confirmationRoll: 17,
        damageRolls: [7],
      },
      h,
    );

    expect(h.attack).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      attackerId: "fighter-1",
      targetId: "orc-1",
      kind: "melee",
      weaponInventoryId: "longsword-stack",
      attackRoll: 19,
      confirmationRoll: 17,
      damageRolls: [7],
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

  it("routes direct health changes and conditions through authoritative handlers", async () => {
    const h = handlers();
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "health.damage",
        targetId: "hero-1",
        amount: 6,
        sourceActorId: "trap-actor",
        reason: "A falling stone strikes the hero.",
      },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "health.heal",
        targetId: "hero-1",
        amount: 4,
        reason: "The healing spring restores vitality.",
      },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "condition.apply",
        targetId: "hero-1",
        conditionId: "condition-prone",
        durationKind: "rounds",
        remainingRounds: 2,
        reason: "The shockwave knocks the hero down.",
      },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "condition.remove",
        runtimeConditionId: "runtime-prone-1",
        reason: "The hero stands up.",
      },
      h,
    );

    expect(h.damage).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      targetId: "hero-1",
      amount: 6,
      sourceActorId: "trap-actor",
      reason: "A falling stone strikes the hero.",
    });
    expect(h.heal).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      targetId: "hero-1",
      amount: 4,
      reason: "The healing spring restores vitality.",
    });
    expect(h.applyCondition).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      targetId: "hero-1",
      conditionId: "condition-prone",
      durationKind: "rounds",
      remainingRounds: 2,
      reason: "The shockwave knocks the hero down.",
    });
    expect(h.removeCondition).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      runtimeConditionId: "runtime-prone-1",
      reason: "The hero stands up.",
    });
  });

  it("routes inventory and XP grants through the same command boundary", async () => {
    const h = handlers();
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "inventory.grant",
        actorId: "hero-1",
        itemId: "item-potion",
        quantity: 2,
        location: "carried",
        reason: "Treasure from the ruined shrine.",
      },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "inventory.remove",
        actorId: "hero-1",
        inventoryId: "potion-stack",
        quantity: 1,
        reason: "The potion is consumed.",
      },
      h,
    );
    await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "progression.xp.grant",
        actorId: "hero-1",
        amount: 300,
        reason: "The party overcame the shrine guardian.",
      },
      h,
    );

    expect(h.grantItem).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "hero-1",
      itemId: "item-potion",
      quantity: 2,
      location: "carried",
      reason: "Treasure from the ruined shrine.",
    });
    expect(h.removeItem).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "hero-1",
      inventoryId: "potion-stack",
      quantity: 1,
      reason: "The potion is consumed.",
    });
    expect(h.grantXp).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "hero-1",
      amount: 300,
      reason: "The party overcame the shrine guardian.",
    });
  });

  it("records bounded alignment drift through the deterministic handler", async () => {
    const h = handlers();
    const result = await executeGameCommand(
      deps,
      "campaign-1",
      {
        type: "alignment.record",
        actorId: "hero-1",
        lawChaosDelta: -3,
        goodEvilDelta: 6,
        reason: "The hero broke an unjust order to protect innocent prisoners.",
      },
      h,
    );

    expect(result.type).toBe("alignment.record");
    expect(h.recordAlignment).toHaveBeenCalledWith(deps, {
      campaignId: "campaign-1",
      actorId: "hero-1",
      lawChaosDelta: -3,
      goodEvilDelta: 6,
      reason: "The hero broke an unjust order to protect innocent prisoners.",
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
