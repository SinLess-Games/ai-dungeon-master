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

  it("rejects direct d20 overrides for skill checks and saving throws", () => {
    expect(() =>
      gameCommandSchema.parse({
        type: "check.skill",
        actorId: "hero-1",
        skillId: "search",
        dc: 18,
        roll: 14,
      }),
    ).toThrow();

    expect(() =>
      gameCommandSchema.parse({
        type: "check.save",
        actorId: "hero-1",
        save: "will",
        dc: 17,
        roll: 9,
      }),
    ).toThrow();
  });

  it("accepts server-rolled public checks without an explicit natural d20", () => {
    expect(
      gameCommandSchema.parse({
        type: "check.skill",
        actorId: "hero-1",
        skillId: "search",
        dc: 18,
      }),
    ).toEqual({
      type: "check.skill",
      actorId: "hero-1",
      skillId: "search",
      dc: 18,
    });

    expect(
      gameCommandSchema.parse({
        type: "check.save",
        actorId: "hero-1",
        save: "will",
        dc: 17,
      }),
    ).toEqual({
      type: "check.save",
      actorId: "hero-1",
      save: "will",
      dc: 17,
    });
  });

  it("accepts bounded live-sheet inventory arrangement commands", () => {
    expect(
      gameCommandSchema.parse({
        type: "inventory.configure",
        actorId: "hero-1",
        inventoryId: "longsword-stack",
        location: "carried",
        equippedSlot: "main_hand",
        notes: "Primary weapon",
        reason: "The player equips the longsword.",
      }),
    ).toEqual({
      type: "inventory.configure",
      actorId: "hero-1",
      inventoryId: "longsword-stack",
      location: "carried",
      equippedSlot: "main_hand",
      notes: "Primary weapon",
      reason: "The player equips the longsword.",
    });
  });

  it("rejects invalid or empty inventory arrangement commands", () => {
    expect(() =>
      gameCommandSchema.parse({
        type: "inventory.configure",
        actorId: "hero-1",
        inventoryId: "longsword-stack",
        reason: "Nothing changed.",
      }),
    ).toThrow();

    expect(() =>
      gameCommandSchema.parse({
        type: "inventory.configure",
        actorId: "hero-1",
        inventoryId: "longsword-stack",
        equippedSlot: "backpack_strap",
        reason: "Invalid slot.",
      }),
    ).toThrow();
  });
});
