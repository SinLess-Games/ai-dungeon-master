import { describe, expect, it } from "vitest";
import {
  clericAlignmentMatchesDeity,
  firstLevelBonusLanguageCount,
  isStandardDruidAnimalCompanion,
  isStandardFamiliar,
  psionDisciplineClassSkills,
  rollStartingWealth,
  wizardProhibitedSchoolCount,
} from "@/modules/characters/domain/creationRules";

describe("character creation rules", () => {
  it("rolls starting wealth deterministically and converts GP to copper", () => {
    const rolls = [1, 2, 3, 4];
    let index = 0;
    const result = rollStartingWealth(
      { diceCount: 4, dieSides: 4, multiplierGp: 10 },
      () => rolls[index++]!,
    );

    expect(result).toEqual({
      rolls: [1, 2, 3, 4],
      goldPieces: 100,
      copperPieces: 10_000,
    });
  });

  it("rejects malformed wealth formulas and out-of-range die results", () => {
    expect(() => rollStartingWealth({ diceCount: 0, dieSides: 4, multiplierGp: 10 })).toThrow(
      /dice count/i,
    );
    expect(() => rollStartingWealth({ diceCount: 1, dieSides: 0, multiplierGp: 10 })).toThrow(
      /die size/i,
    );
    expect(() => rollStartingWealth({ diceCount: 1, dieSides: 4, multiplierGp: 0 })).toThrow(
      /multiplier/i,
    );
    expect(() =>
      rollStartingWealth({ diceCount: 1, dieSides: 4, multiplierGp: 10 }, () => 5),
    ).toThrow(/between 1 and 4/i);
  });

  it("enforces the cleric one-step deity alignment rule", () => {
    expect(clericAlignmentMatchesDeity("LG", "LG")).toBe(true);
    expect(clericAlignmentMatchesDeity("LG", "NG")).toBe(true);
    expect(clericAlignmentMatchesDeity("LG", "LN")).toBe(true);
    expect(clericAlignmentMatchesDeity("LG", "CG")).toBe(false);
    expect(clericAlignmentMatchesDeity("LG", "N")).toBe(false);
    expect(clericAlignmentMatchesDeity("N", "N")).toBe(true);
    expect(clericAlignmentMatchesDeity("N", "NG")).toBe(false);
    expect(clericAlignmentMatchesDeity("INVALID", "N")).toBe(false);
  });

  it("derives first-level bonus languages from the effective Intelligence modifier", () => {
    expect(firstLevelBonusLanguageCount(18)).toBe(4);
    expect(firstLevelBonusLanguageCount(12)).toBe(1);
    expect(firstLevelBonusLanguageCount(10)).toBe(0);
    expect(firstLevelBonusLanguageCount(8)).toBe(0);
  });

  it("maps psion disciplines to the correct extra class skills", () => {
    expect(psionDisciplineClassSkills(" Telepathy ")).toEqual([
      "bluff",
      "diplomacy",
      "gather-information",
      "sense-motive",
    ]);
    expect(psionDisciplineClassSkills("psychoportation")).toContain("survival");
    expect(psionDisciplineClassSkills("unknown")).toEqual([]);
  });

  it("normalizes standard familiar and animal companion names", () => {
    expect(isStandardFamiliar(" Cat ")).toBe(true);
    expect(isStandardFamiliar("Dire Wolf")).toBe(false);
    expect(isStandardDruidAnimalCompanion(" WOLF ")).toBe(true);
    expect(isStandardDruidAnimalCompanion("Tiger")).toBe(false);
  });

  it("uses the specialist wizard prohibited-school counts", () => {
    expect(wizardProhibitedSchoolCount("Divination")).toBe(1);
    expect(wizardProhibitedSchoolCount(" evocation ")).toBe(2);
  });
});
