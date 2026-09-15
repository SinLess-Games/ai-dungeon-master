import { describe, expect, it } from "vitest";
import {
  parseDmTurnDecision,
  validateDmTurnDecision,
  type DmPlannerContext,
} from "@/modules/campaigns/server/dmToolPlanner";

function context(): DmPlannerContext {
  return {
    actors: [
      { id: "hero-1", characterId: "hero-1", name: "Ari", kind: "character", status: "active" },
      { id: "goblin-1", characterId: null, name: "Goblin", kind: "monster", status: "active" },
    ],
    encounter: {
      id: "encounter-1",
      roundNumber: 1,
      activeTurnIndex: 0,
      currentActorId: "hero-1",
      participantIds: ["hero-1", "goblin-1"],
    },
    activeConditions: [
      {
        runtimeConditionId: "condition-instance-1",
        actorId: "goblin-1",
        conditionId: "condition-prone",
        name: "Prone",
        durationKind: "special",
        remainingRounds: null,
      },
    ],
    character: {
      character: { id: "hero-1", name: "Ari", actorId: "hero-1" },
      skills: [
        {
          id: "skill-search",
          name: "Search",
          ability: "int",
          specialization: "",
          ranks: 5,
          trainedOnly: false,
        },
      ],
      weapons: [
        {
          inventoryId: "weapon-stack-1",
          itemId: "longsword",
          name: "Longsword",
          attackKind: "melee",
          handedness: "one_handed",
          quantity: 1,
        },
      ],
      castingTracks: [
        {
          id: "wizard-track",
          mode: "prepared",
          tradition: "arcane",
          trackKey: "wizard",
          prepared: [
            {
              preparationId: "prep-fireball",
              spellId: "spell-fireball",
              name: "Fireball",
              slotLevel: 3,
              remaining: 1,
              actionType: "standard",
              rangeText: "Long",
              targetText: null,
            },
          ],
          spontaneous: [],
          powers: [],
        },
      ],
      inventory: [
        {
          inventoryId: "rope-stack",
          itemId: "rope",
          name: "Silk Rope",
          quantity: 2,
          equipped: false,
          location: "carried",
        },
      ],
      alignment: {
        alignment: "NG",
        lawChaosScore: 0,
        goodEvilScore: 50,
      },
    },
  };
}

describe("AI DM turn planner", () => {
  it("parses narration and fenced JSON", () => {
    expect(
      parseDmTurnDecision('{"kind":"narration","text":"The corridor remains quiet."}'),
    ).toEqual({ kind: "narration", text: "The corridor remains quiet." });

    expect(
      parseDmTurnDecision(
        '```json\n{"kind":"narration","text":"A cold draft curls beneath the door."}\n```',
      ),
    ).toEqual({
      kind: "narration",
      text: "A cold draft curls beneath the door.",
    });
  });

  it("parses structured skill and saving throw requests", () => {
    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "The seam is almost invisible. Give me a Search check.",
          check: {
            type: "check.skill",
            skillId: "skill-search",
            dc: 18,
            reason: "Notice the concealed pressure plate.",
          },
        }),
      ),
    ).toMatchObject({
      kind: "check",
      check: { type: "check.skill", skillId: "skill-search", dc: 18 },
    });

    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "The rune erupts in violet light. Make a Will save.",
          check: {
            type: "check.save",
            save: "will",
            dc: 17,
            reason: "Resist the rune's compulsion.",
          },
        }),
      ),
    ).toMatchObject({
      kind: "check",
      check: { type: "check.save", save: "will", dc: 17 },
    });
  });

  it("parses attacks, casting, grants, conditions, health, and encounter commands", () => {
    const commands = [
      {
        type: "combat.attack",
        targetId: "goblin-1",
        kind: "melee",
        weaponInventoryId: "weapon-stack-1",
      },
      {
        type: "spell.cast.prepared",
        castingTrackId: "wizard-track",
        spellId: "spell-fireball",
        preparationId: "prep-fireball",
        targetIds: ["goblin-1"],
      },
      { type: "encounter.finish", status: "completed" },
      { type: "health.damage", targetId: "goblin-1", amount: 3, reason: "Falling debris." },
      {
        type: "condition.apply",
        targetId: "goblin-1",
        conditionRef: "prone",
        durationKind: "special",
        reason: "The creature is knocked down.",
      },
      {
        type: "inventory.grant",
        itemRef: "potion-of-cure-light-wounds",
        quantity: 1,
        reason: "Recovered treasure.",
      },
      {
        type: "progression.xp.grant",
        amount: 300,
        reason: "The encounter objective was overcome.",
      },
    ] as const;

    for (const command of commands) {
      expect(
        parseDmTurnDecision(JSON.stringify({ kind: "command", command })),
      ).toMatchObject({ kind: "command", command: { type: command.type } });
    }
  });

  it("accepts only attacks and spells backed by the authoritative context", () => {
    const ctx = context();
    const attack = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "combat.attack",
          targetId: "goblin-1",
          kind: "melee",
          weaponInventoryId: "weapon-stack-1",
        },
      }),
    );
    expect(validateDmTurnDecision(attack, ctx)).toEqual(attack);

    const spell = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "spell.cast.prepared",
          castingTrackId: "wizard-track",
          spellId: "spell-fireball",
          preparationId: "prep-fireball",
          targetIds: ["goblin-1"],
        },
      }),
    );
    expect(validateDmTurnDecision(spell, ctx)).toEqual(spell);
  });

  it("rejects invented actor, weapon, spell, condition, and inventory ids", () => {
    const ctx = context();
    const invalidCommands = [
      {
        type: "combat.attack",
        targetId: "dragon-that-does-not-exist",
        kind: "melee",
        weaponInventoryId: "weapon-stack-1",
      },
      {
        type: "combat.attack",
        targetId: "goblin-1",
        kind: "melee",
        weaponInventoryId: "invented-sword",
      },
      {
        type: "spell.cast.prepared",
        castingTrackId: "wizard-track",
        spellId: "wish",
        preparationId: "not-prepared",
        targetIds: ["goblin-1"],
      },
      {
        type: "condition.remove",
        runtimeConditionId: "invented-condition-instance",
        reason: "No such condition.",
      },
      {
        type: "inventory.remove",
        inventoryId: "invented-stack",
        quantity: 1,
        reason: "No such item.",
      },
    ] as const;

    for (const command of invalidCommands) {
      const decision = parseDmTurnDecision(JSON.stringify({ kind: "command", command }));
      expect(() => validateDmTurnDecision(decision, ctx)).toThrow();
    }
  });

  it("requires round conditions to carry exactly one valid round duration", () => {
    const ctx = context();
    const missingRounds = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "condition.apply",
          targetId: "goblin-1",
          conditionRef: "stunned",
          durationKind: "rounds",
          reason: "The effect lasts for two rounds.",
        },
      }),
    );
    expect(() => validateDmTurnDecision(missingRounds, ctx)).toThrow(
      "AI_DM_CONDITION_DURATION_INVALID",
    );

    const strayRounds = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "condition.apply",
          targetId: "goblin-1",
          conditionRef: "prone",
          durationKind: "special",
          remainingRounds: 2,
          reason: "Prone persists until the creature stands.",
        },
      }),
    );
    expect(() => validateDmTurnDecision(strayRounds, ctx)).toThrow(
      "AI_DM_CONDITION_DURATION_INVALID",
    );

    const validRounds = parseDmTurnDecision(
      JSON.stringify({
        kind: "command",
        command: {
          type: "condition.apply",
          targetId: "goblin-1",
          conditionRef: "stunned",
          durationKind: "rounds",
          remainingRounds: 2,
          reason: "The effect lasts for two rounds.",
        },
      }),
    );
    expect(validateDmTurnDecision(validRounds, ctx)).toEqual(validRounds);
  });

  it("rejects unavailable skills and malformed or unsafe planner output", () => {
    const decision = parseDmTurnDecision(
      JSON.stringify({
        kind: "check",
        preface: "Roll.",
        check: {
          type: "check.skill",
          skillId: "invented-skill",
          dc: 15,
          reason: "Not in the character's skill catalog.",
        },
      }),
    );
    expect(() => validateDmTurnDecision(decision, context())).toThrow(
      "AI_DM_REQUESTED_UNAVAILABLE_SKILL",
    );

    expect(() =>
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "Roll.",
          check: {
            type: "check.skill",
            skillId: "skill-search",
            dc: -1,
            reason: "Invalid negative DC.",
          },
        }),
      ),
    ).toThrow();

    expect(() => parseDmTurnDecision('{"kind":"mutate_hp","amount":999}')).toThrow();
  });
});
