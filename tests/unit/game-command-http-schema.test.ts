import { describe, expect, it } from "vitest";
import { gameCommandSchema } from "@/modules/game/server/gameCommandRoutes";

describe("public game command schema", () => {
  it("accepts a normal attack while leaving its rolls authoritative on the server", () => {
    expect(
      gameCommandSchema.parse({
        type: "combat.attack",
        attackerId: "hero-1",
        targetId: "goblin-1",
        kind: "melee",
        weaponInventoryId: "longsword-stack",
      }),
    ).toEqual({
      type: "combat.attack",
      attackerId: "hero-1",
      targetId: "goblin-1",
      kind: "melee",
      weaponInventoryId: "longsword-stack",
    });
  });

  it("rejects client-supplied attack, confirmation, and damage roll overrides", () => {
    expect(() =>
      gameCommandSchema.parse({
        type: "combat.attack",
        attackerId: "hero-1",
        targetId: "goblin-1",
        kind: "melee",
        attackRoll: 20,
      }),
    ).toThrow();

    expect(() =>
      gameCommandSchema.parse({
        type: "combat.attack",
        attackerId: "hero-1",
        targetId: "goblin-1",
        kind: "melee",
        confirmationRoll: 20,
      }),
    ).toThrow();

    expect(() =>
      gameCommandSchema.parse({
        type: "combat.attack",
        attackerId: "hero-1",
        targetId: "goblin-1",
        kind: "melee",
        damageRolls: [8],
      }),
    ).toThrow();
  });

  it("still accepts an explicitly supplied natural d20 for player-facing checks", () => {
    expect(
      gameCommandSchema.parse({
        type: "check.skill",
        actorId: "hero-1",
        skillId: "search",
        dc: 18,
        roll: 14,
      }),
    ).toMatchObject({ type: "check.skill", roll: 14 });

    expect(
      gameCommandSchema.parse({
        type: "check.save",
        actorId: "hero-1",
        save: "will",
        dc: 17,
        roll: 9,
      }),
    ).toMatchObject({ type: "check.save", roll: 9 });
  });
});
