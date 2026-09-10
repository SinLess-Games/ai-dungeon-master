import {
  baseAttackBonusForClass,
  baseSaveBonusForClass,
  type BaseAttackProgression,
  type SaveProgression,
} from "@/rulesets/dnd35";

export interface MonsterRaceProgression {
  raceSlug: string;
  racialHitDice: number;
  racialHitDie: number | null;
  levelAdjustment: number;
  creatureSkillPointsPerHitDie: number | null;
  creatureBabProgression: BaseAttackProgression | null;
  creatureFortProgression: SaveProgression | null;
  creatureRefProgression: SaveProgression | null;
  creatureWillProgression: SaveProgression | null;
}

export interface RacialBaseBonuses {
  baseAttackBonus: number;
  fort: number;
  ref: number;
  will: number;
}

/**
 * Humanoid racial Hit Dice do not have one universal good-save progression: the
 * good save depends on the specific humanoid race. Keep the exact MM racial-HD
 * chassis here until race progression is represented relationally in content data.
 */
const racialBaseBonusOverrides: Readonly<
  Record<string, { racialHitDice: number; bonuses: RacialBaseBonuses }>
> = {
  bugbear: { racialHitDice: 3, bonuses: { baseAttackBonus: 2, fort: 1, ref: 3, will: 1 } },
  gnoll: { racialHitDice: 2, bonuses: { baseAttackBonus: 1, fort: 3, ref: 0, will: 0 } },
  lizardfolk: { racialHitDice: 2, bonuses: { baseAttackBonus: 1, fort: 0, ref: 3, will: 0 } },
  troglodyte: { racialHitDice: 2, bonuses: { baseAttackBonus: 1, fort: 3, ref: 0, will: 0 } },
  locathah: { racialHitDice: 2, bonuses: { baseAttackBonus: 1, fort: 3, ref: 0, will: 0 } },
  flind: { racialHitDice: 2, bonuses: { baseAttackBonus: 1, fort: 3, ref: 0, will: 0 } },
  varag: { racialHitDice: 3, bonuses: { baseAttackBonus: 2, fort: 1, ref: 3, will: 1 } },
};

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative integer.`);
  return value;
}

/** SRD monster PCs use racial HD + class levels + level adjustment for ECL. */
export function monsterEffectiveCharacterLevel(
  racialHitDice: number,
  classLevels: number,
  levelAdjustment: number,
): number {
  return nonNegativeInteger(racialHitDice, "Racial Hit Dice")
    + nonNegativeInteger(classLevels, "Class levels")
    + nonNegativeInteger(levelAdjustment, "Level adjustment");
}

/** Feat acquisition is based on total Hit Dice, never ECL. */
export function generalFeatSlotsForTotalHitDice(totalHitDice: number): number {
  nonNegativeInteger(totalHitDice, "Total Hit Dice");
  if (totalHitDice < 1) return 0;
  return 1 + Math.floor(totalHitDice / 3);
}

/**
 * Racial skill points already include the x4 first-HD multiplier.
 * SRD racial skills use (HD + 3) × max(1, type skill points + Int modifier).
 */
export function racialSkillPointBudget(
  racialHitDice: number,
  skillPointsPerHitDie: number | null,
  intelligenceModifier: number,
): number {
  nonNegativeInteger(racialHitDice, "Racial Hit Dice");
  if (racialHitDice <= 1) return 0;
  if (skillPointsPerHitDie === null) throw new RangeError("Creature type skill points are required for retained racial Hit Dice.");
  nonNegativeInteger(skillPointsPerHitDie, "Creature type skill points");
  return (racialHitDice + 3) * Math.max(1, skillPointsPerHitDie + intelligenceModifier);
}

/** A monster with >1 racial HD does not multiply its first class-level skill points by four. */
export function firstClassSkillPointBudget(
  racialHitDice: number,
  classSkillPointsPerLevel: number,
  intelligenceModifier: number,
  racialBonusSkillPointsPerLevel = 0,
): number {
  nonNegativeInteger(racialHitDice, "Racial Hit Dice");
  nonNegativeInteger(classSkillPointsPerLevel, "Class skill points");
  nonNegativeInteger(racialBonusSkillPointsPerLevel, "Racial bonus skill points");
  const perLevel = Math.max(1, classSkillPointsPerLevel + intelligenceModifier) + racialBonusSkillPointsPerLevel;
  return racialHitDice > 1 ? perLevel : perLevel * 4;
}

/** Deterministic racial HP uses the same average-die convention as SRD monster stat blocks. */
export function racialHitPoints(
  racialHitDice: number,
  racialHitDie: number | null,
  constitutionModifier: number,
): number {
  nonNegativeInteger(racialHitDice, "Racial Hit Dice");
  if (racialHitDice === 0) return 0;
  if (racialHitDie === null || !Number.isSafeInteger(racialHitDie) || racialHitDie < 1) {
    throw new RangeError("A race with retained racial Hit Dice must define a racial Hit Die.");
  }
  const averageDice = Math.floor((racialHitDice * (racialHitDie + 1)) / 2);
  return Math.max(racialHitDice, averageDice + racialHitDice * constitutionModifier);
}

export function racialBaseBonuses(progression: MonsterRaceProgression): RacialBaseBonuses {
  const levels = nonNegativeInteger(progression.racialHitDice, "Racial Hit Dice");
  if (levels === 0) return { baseAttackBonus: 0, fort: 0, ref: 0, will: 0 };

  const raceSlug = progression.raceSlug.trim().toLowerCase();
  const override = racialBaseBonusOverrides[raceSlug];
  if (override) {
    if (override.racialHitDice !== levels) {
      throw new RangeError(`Racial Hit Dice do not match the source-backed progression for ${progression.raceSlug}.`);
    }
    return override.bonuses;
  }

  if (!progression.creatureBabProgression || progression.creatureBabProgression === "custom") {
    throw new RangeError(`Creature BAB progression is unavailable for ${progression.raceSlug}.`);
  }
  if (!progression.creatureFortProgression || progression.creatureFortProgression === "custom"
    || !progression.creatureRefProgression || progression.creatureRefProgression === "custom"
    || !progression.creatureWillProgression || progression.creatureWillProgression === "custom") {
    throw new RangeError(`Creature save progression is unavailable for ${progression.raceSlug}.`);
  }
  return {
    baseAttackBonus: baseAttackBonusForClass(levels, progression.creatureBabProgression),
    fort: baseSaveBonusForClass(levels, progression.creatureFortProgression),
    ref: baseSaveBonusForClass(levels, progression.creatureRefProgression),
    will: baseSaveBonusForClass(levels, progression.creatureWillProgression),
  };
}
