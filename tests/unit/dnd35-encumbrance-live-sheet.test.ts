import { describe, expect, it } from "vitest";
import {
  calculateEncumbranceState,
  combineArmorCheckPenalty,
  combineMaximumDexterityBonus,
  encumbrancePenaltyProfile,
  encumberedLandSpeed,
} from "@/rulesets/dnd35";

describe("live character sheet encumbrance", () => {
  it("applies medium-load restrictions to a normal 30-foot character", () => {
    const state = calculateEncumbranceState({
      strength: 10,
      carriedWeight: 34,
      baseLandSpeedFeet: 30,
      enabled: true,
    });

    expect(state.capacity).toMatchObject({
      lightMaximum: 33,
      mediumMaximum: 66,
      heavyMaximum: 100,
    });
    expect(state.actualLoad).toBe("medium");
    expect(state.load).toBe("medium");
    expect(state.maxDexterityBonus).toBe(3);
    expect(state.armorCheckPenalty).toBe(-3);
    expect(state.runMultiplier).toBe(4);
    expect(state.landSpeedFeet).toBe(20);
  });

  it("applies heavy-load restrictions without stacking them with armor", () => {
    const state = calculateEncumbranceState({
      strength: 10,
      carriedWeight: 67,
      baseLandSpeedFeet: 30,
      enabled: true,
    });

    expect(state.actualLoad).toBe("heavy");
    expect(state.maxDexterityBonus).toBe(1);
    expect(state.armorCheckPenalty).toBe(-6);
    expect(state.runMultiplier).toBe(3);
    expect(state.landSpeedFeet).toBe(20);

    expect(combineMaximumDexterityBonus(4, state.maxDexterityBonus)).toBe(1);
    expect(combineMaximumDexterityBonus(0, state.maxDexterityBonus)).toBe(0);
    expect(combineArmorCheckPenalty(-5, state.armorCheckPenalty)).toBe(-6);
    expect(combineArmorCheckPenalty(-8, state.armorCheckPenalty)).toBe(-8);
  });

  it("limits an overloaded character to a five-foot stagger while the load can be lifted", () => {
    const state = calculateEncumbranceState({
      strength: 10,
      carriedWeight: 150,
      baseLandSpeedFeet: 30,
      enabled: true,
    });

    expect(state.actualLoad).toBe("overloaded");
    expect(state.movement).toBe("stagger");
    expect(state.landSpeedFeet).toBe(5);
    expect(state.maxDexterityBonus).toBe(0);
    expect(state.runMultiplier).toBe(0);
  });

  it("makes a character immobile when carried weight exceeds lift-off-ground capacity", () => {
    const state = calculateEncumbranceState({
      strength: 10,
      carriedWeight: 201,
      baseLandSpeedFeet: 30,
      enabled: true,
    });

    expect(state.capacity.liftOffGround).toBe(200);
    expect(state.actualLoad).toBe("overloaded");
    expect(state.movement).toBe("immobile");
    expect(state.landSpeedFeet).toBe(0);
  });

  it("keeps reporting actual carried load while the player disables penalties", () => {
    const state = calculateEncumbranceState({
      strength: 10,
      carriedWeight: 80,
      baseLandSpeedFeet: 30,
      enabled: false,
    });

    expect(state.actualLoad).toBe("heavy");
    expect(state.load).toBe("light");
    expect(state.landSpeedFeet).toBe(30);
    expect(state.maxDexterityBonus).toBeNull();
    expect(state.armorCheckPenalty).toBe(0);
    expect(state.runMultiplier).toBe(4);
  });

  it("matches the armor movement progression across common racial base speeds", () => {
    const profile = encumbrancePenaltyProfile("medium");
    expect(encumberedLandSpeed(20, profile)).toBe(15);
    expect(encumberedLandSpeed(30, profile)).toBe(20);
    expect(encumberedLandSpeed(40, profile)).toBe(30);
    expect(encumberedLandSpeed(50, profile)).toBe(35);
    expect(encumberedLandSpeed(60, profile)).toBe(40);
  });

  it("uses the worse armor and encumbrance restriction rather than adding them", () => {
    expect(combineMaximumDexterityBonus(null, null)).toBeNull();
    expect(combineMaximumDexterityBonus(2, null)).toBe(2);
    expect(combineMaximumDexterityBonus(null, 3)).toBe(3);
    expect(combineMaximumDexterityBonus(2, 3)).toBe(2);
    expect(combineMaximumDexterityBonus(4, 3)).toBe(3);

    expect(combineArmorCheckPenalty(0, -3)).toBe(-3);
    expect(combineArmorCheckPenalty(-5, -3)).toBe(-5);
    expect(combineArmorCheckPenalty(-2, -6)).toBe(-6);
  });
});
