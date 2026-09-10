import { describe, expect, it } from "vitest";
import {
  firstClassSkillPointBudget,
  generalFeatSlotsForTotalHitDice,
  monsterEffectiveCharacterLevel,
  racialBaseBonuses,
  racialHitPoints,
  racialSkillPointBudget,
} from "@/modules/characters/domain/monsterRaceCreation";

describe("D&D 3.5 monster PC creation rules", () => {
  it("uses racial HD + class levels + level adjustment for ECL", () => {
    expect(monsterEffectiveCharacterLevel(12, 1, 8)).toBe(21);
    expect(monsterEffectiveCharacterLevel(0, 1, 6)).toBe(7);
  });

  it("grants general feats by total Hit Dice rather than ECL", () => {
    expect(generalFeatSlotsForTotalHitDice(1)).toBe(1);
    expect(generalFeatSlotsForTotalHitDice(5)).toBe(2);
    expect(generalFeatSlotsForTotalHitDice(7)).toBe(3);
    expect(generalFeatSlotsForTotalHitDice(13)).toBe(5);
  });

  it("applies the racial first-HD skill multiplier and not a second class x4 multiplier", () => {
    expect(racialSkillPointBudget(6, 2, 0)).toBe(18);
    expect(racialSkillPointBudget(6, 8, 3)).toBe(99);
    expect(firstClassSkillPointBudget(6, 4, 2)).toBe(6);
    expect(firstClassSkillPointBudget(0, 4, 2)).toBe(24);
  });

  it("derives racial BAB and saves from the creature-type chassis", () => {
    expect(racialBaseBonuses({
      raceSlug: "minotaur",
      racialHitDice: 6,
      racialHitDie: 8,
      levelAdjustment: 2,
      creatureSkillPointsPerHitDie: 2,
      creatureBabProgression: "full",
      creatureFortProgression: "poor",
      creatureRefProgression: "good",
      creatureWillProgression: "good",
    })).toEqual({ baseAttackBonus: 6, fort: 2, ref: 5, will: 5 });

    expect(racialBaseBonuses({
      raceSlug: "trumpet-archon",
      racialHitDice: 12,
      racialHitDie: 8,
      levelAdjustment: 8,
      creatureSkillPointsPerHitDie: 8,
      creatureBabProgression: "full",
      creatureFortProgression: "good",
      creatureRefProgression: "good",
      creatureWillProgression: "good",
    })).toEqual({ baseAttackBonus: 12, fort: 8, ref: 8, will: 8 });

    expect(racialBaseBonuses({
      raceSlug: "astral-deva",
      racialHitDice: 12,
      racialHitDie: 8,
      levelAdjustment: 8,
      creatureSkillPointsPerHitDie: 8,
      creatureBabProgression: "full",
      creatureFortProgression: "good",
      creatureRefProgression: "good",
      creatureWillProgression: "good",
    })).toEqual({ baseAttackBonus: 12, fort: 8, ref: 8, will: 8 });
  });

  it("uses source-backed save overrides for humanoid racial Hit Dice", () => {
    expect(racialBaseBonuses({
      raceSlug: "locathah",
      racialHitDice: 2,
      racialHitDie: 8,
      levelAdjustment: 1,
      creatureSkillPointsPerHitDie: 2,
      creatureBabProgression: "three_quarters",
      creatureFortProgression: "poor",
      creatureRefProgression: "good",
      creatureWillProgression: "poor",
    })).toEqual({ baseAttackBonus: 1, fort: 3, ref: 0, will: 0 });

    expect(racialBaseBonuses({
      raceSlug: "bugbear",
      racialHitDice: 3,
      racialHitDie: 8,
      levelAdjustment: 1,
      creatureSkillPointsPerHitDie: 2,
      creatureBabProgression: "three_quarters",
      creatureFortProgression: "poor",
      creatureRefProgression: "good",
      creatureWillProgression: "poor",
    })).toEqual({ baseAttackBonus: 2, fort: 1, ref: 3, will: 1 });

    expect(racialBaseBonuses({
      raceSlug: "flind",
      racialHitDice: 2,
      racialHitDie: 8,
      levelAdjustment: 2,
      creatureSkillPointsPerHitDie: 2,
      creatureBabProgression: "three_quarters",
      creatureFortProgression: "custom",
      creatureRefProgression: "custom",
      creatureWillProgression: "custom",
    })).toEqual({ baseAttackBonus: 1, fort: 3, ref: 0, will: 0 });

    expect(racialBaseBonuses({
      raceSlug: "varag",
      racialHitDice: 3,
      racialHitDie: 8,
      levelAdjustment: 2,
      creatureSkillPointsPerHitDie: 2,
      creatureBabProgression: "three_quarters",
      creatureFortProgression: "custom",
      creatureRefProgression: "custom",
      creatureWillProgression: "custom",
    })).toEqual({ baseAttackBonus: 2, fort: 1, ref: 3, will: 1 });
  });

  it("uses average racial Hit Dice plus Constitution and a one-hit-point-per-HD floor", () => {
    expect(racialHitPoints(6, 8, 2)).toBe(39);
    expect(racialHitPoints(12, 8, 6)).toBe(126);
    expect(racialHitPoints(4, 8, -10)).toBe(4);
  });
});