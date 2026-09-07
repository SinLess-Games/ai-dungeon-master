import { describe, expect, it } from "vitest";
import { validateDnd35CharacterReadiness } from "@/modules/characters/domain/readiness";

const completeAbilities = {
  str: 16,
  dex: 14,
  con: 14,
  int: 10,
  wis: 12,
  cha: 8,
} as const;

describe("D&D 3.5 character readiness", () => {
  it("accepts a minimally complete playable character", () => {
    const result = validateDnd35CharacterReadiness({
      extensionPresent: true,
      raceId: "human",
      abilityScores: completeAbilities,
      classLevelCount: 1,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects drafts without a race, six abilities, and a class level", () => {
    const result = validateDnd35CharacterReadiness({
      extensionPresent: true,
      raceId: null,
      abilityScores: { str: 10 },
      classLevelCount: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "DND35_CHARACTER_RACE_REQUIRED",
        "DND35_CHARACTER_ABILITY_REQUIRED",
        "DND35_CHARACTER_CLASS_LEVEL_REQUIRED",
      ]),
    );
  });

  it("rejects a generic character whose D&D extension was never created", () => {
    const result = validateDnd35CharacterReadiness({
      extensionPresent: false,
      raceId: "human",
      abilityScores: completeAbilities,
      classLevelCount: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("DND35_CHARACTER_EXTENSION_REQUIRED");
  });
});
