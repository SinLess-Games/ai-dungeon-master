import { describe, expect, it } from "vitest";
import {
  effectiveRacialAbilityScore,
  monsterPcAbilityScore,
} from "@/modules/characters/domain/racialAbilityScores";

describe("DMG monster-PC ability score conversion", () => {
  it("matches the DMG minotaur Intelligence example", () => {
    expect(monsterPcAbilityScore(10, 7, "int")).toBe(6);
  });

  it("uses the separate Intelligence lookup table and preserves the minimum of 3", () => {
    expect(monsterPcAbilityScore(18, 7, "int")).toBe(14);
    expect(monsterPcAbilityScore(3, 7, "int")).toBe(3);
    expect(monsterPcAbilityScore(9, 3, "int")).toBe(3);
  });

  it("uses the physical and social ability lookup table", () => {
    expect(monsterPcAbilityScore(10, 7, "str")).toBe(6);
    expect(monsterPcAbilityScore(18, 1, "dex")).toBe(8);
    expect(monsterPcAbilityScore(12, 9, "cha")).toBe(10);
    expect(monsterPcAbilityScore(3, 9, "wis")).toBe(1);
  });

  it("keeps ordinary fixed racial modifiers unchanged", () => {
    expect(effectiveRacialAbilityScore({ baseScore: 15, ability: "str", fixedModifier: 8 })).toBe(23);
    expect(effectiveRacialAbilityScore({ baseScore: 12, ability: "cha", fixedModifier: -2 })).toBe(10);
  });

  it("rejects source combinations the DMG does not make playable", () => {
    expect(() => monsterPcAbilityScore(10, 2, "int")).toThrow(/not a playable monster PC/i);
    expect(() => monsterPcAbilityScore(19, 7, "int")).toThrow(/3 through 18/i);
  });
});
