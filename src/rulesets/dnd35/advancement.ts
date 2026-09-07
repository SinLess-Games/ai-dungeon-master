import { abilityScoreIncreaseCount, experienceForLevel, generalFeatSlotsAtLevel, levelForExperience } from "./progression";

export interface ExperienceAwardResult {
  beforeExperience: number;
  awardedExperience: number;
  afterExperience: number;
  beforeLevel: number;
  afterLevel: number;
  levelsGained: number;
  featChoicesGained: number;
  abilityIncreasesGained: number;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function awardExperience(currentExperience: number, awardedExperience: number): ExperienceAwardResult {
  assertNonNegativeInteger(currentExperience, "Current experience");
  assertNonNegativeInteger(awardedExperience, "Awarded experience");
  const afterExperience = currentExperience + awardedExperience;
  if (!Number.isSafeInteger(afterExperience)) throw new RangeError("Resulting experience exceeds the safe integer range.");

  const beforeLevel = levelForExperience(currentExperience);
  const afterLevel = levelForExperience(afterExperience);
  return {
    beforeExperience: currentExperience,
    awardedExperience,
    afterExperience,
    beforeLevel,
    afterLevel,
    levelsGained: afterLevel - beforeLevel,
    featChoicesGained: generalFeatSlotsAtLevel(afterLevel) - generalFeatSlotsAtLevel(beforeLevel),
    abilityIncreasesGained:
      abilityScoreIncreaseCount(afterLevel) - abilityScoreIncreaseCount(beforeLevel),
  };
}

export interface LevelMilestone {
  level: number;
  experienceRequired: number;
  generalFeat: boolean;
  abilityIncrease: boolean;
}

export function levelMilestonesBetween(beforeLevel: number, afterLevel: number): readonly LevelMilestone[] {
  if (!Number.isSafeInteger(beforeLevel) || beforeLevel < 1) {
    throw new RangeError("Before level must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(afterLevel) || afterLevel < beforeLevel) {
    throw new RangeError("After level must be a safe integer greater than or equal to before level.");
  }

  const milestones: LevelMilestone[] = [];
  for (let level = beforeLevel + 1; level <= afterLevel; level += 1) {
    milestones.push({
      level,
      experienceRequired: experienceForLevel(level),
      generalFeat: generalFeatSlotsAtLevel(level) > generalFeatSlotsAtLevel(level - 1),
      abilityIncrease: abilityScoreIncreaseCount(level) > abilityScoreIncreaseCount(level - 1),
    });
  }
  return milestones;
}

export function experienceUntilNextLevel(currentExperience: number): number {
  assertNonNegativeInteger(currentExperience, "Current experience");
  const currentLevel = levelForExperience(currentExperience);
  return experienceForLevel(currentLevel + 1) - currentExperience;
}
