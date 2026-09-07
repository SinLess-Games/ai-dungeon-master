import type { Dnd35Size } from "./types";

export type MovementMode = "land" | "climb" | "swim" | "fly" | "burrow" | "glide" | "other";
export type Maneuverability = "clumsy" | "poor" | "average" | "good" | "perfect";

export interface RuntimeRaceDefinition {
  id: string;
  size: Dnd35Size;
  baseSpeedFeet: number;
  levelAdjustment?: number | null;
  racialHitDice?: number;
  racialHitDie?: number | null;
  naturalArmor?: number;
  bonusSkillPointsPerLevel?: number;
  bonusFeatsAtFirstLevel?: number;
}

export interface RuntimeRaceMovement {
  mode: Exclude<MovementMode, "land">;
  feet?: number | null;
  baseSpeedMultiplier?: number | null;
  maneuverability?: Maneuverability | null;
}

export interface ResolvedMovementSpeed {
  mode: MovementMode;
  feet: number;
  maneuverability?: Maneuverability;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function validateRuntimeRace(race: RuntimeRaceDefinition): RuntimeRaceDefinition {
  if (!race.id.trim()) throw new RangeError("Race id cannot be empty.");
  assertNonNegativeInteger(race.baseSpeedFeet, "Race base speed");
  const levelAdjustment = race.levelAdjustment ?? 0;
  const racialHitDice = race.racialHitDice ?? 0;
  const naturalArmor = race.naturalArmor ?? 0;
  const bonusSkillPointsPerLevel = race.bonusSkillPointsPerLevel ?? 0;
  const bonusFeatsAtFirstLevel = race.bonusFeatsAtFirstLevel ?? 0;
  assertNonNegativeInteger(levelAdjustment, "Race level adjustment");
  assertNonNegativeInteger(racialHitDice, "Race racial hit dice");
  assertNonNegativeInteger(naturalArmor, "Race natural armor");
  assertNonNegativeInteger(bonusSkillPointsPerLevel, "Race bonus skill points");
  assertNonNegativeInteger(bonusFeatsAtFirstLevel, "Race bonus feats");
  if (racialHitDice > 0) {
    if (race.racialHitDie === null || race.racialHitDie === undefined) {
      throw new RangeError("A race with racial hit dice must define a racial hit die.");
    }
    if (!Number.isSafeInteger(race.racialHitDie) || race.racialHitDie < 1) {
      throw new RangeError("Racial hit die must be a positive safe integer.");
    }
  }
  return race;
}

/** Effective character level = class levels + racial HD + level adjustment. */
export function effectiveCharacterLevel(input: {
  classLevels: number;
  race: RuntimeRaceDefinition;
}): number {
  assertNonNegativeInteger(input.classLevels, "Class levels");
  validateRuntimeRace(input.race);
  return input.classLevels + (input.race.racialHitDice ?? 0) + (input.race.levelAdjustment ?? 0);
}

export function raceNaturalArmorBonus(race: RuntimeRaceDefinition): number {
  validateRuntimeRace(race);
  return race.naturalArmor ?? 0;
}

export function raceBonusFeatCountAtFirstLevel(race: RuntimeRaceDefinition): number {
  validateRuntimeRace(race);
  return race.bonusFeatsAtFirstLevel ?? 0;
}

export function raceBonusSkillPointsPerLevel(race: RuntimeRaceDefinition): number {
  validateRuntimeRace(race);
  return race.bonusSkillPointsPerLevel ?? 0;
}

export function resolveRaceMovement(
  race: RuntimeRaceDefinition,
  additionalModes: readonly RuntimeRaceMovement[] = [],
): readonly ResolvedMovementSpeed[] {
  validateRuntimeRace(race);
  const seen = new Set<MovementMode>(["land"]);
  const result: ResolvedMovementSpeed[] = [{ mode: "land", feet: race.baseSpeedFeet }];

  for (const movement of additionalModes) {
    if (seen.has(movement.mode)) throw new Error(`Duplicate movement mode: ${movement.mode}.`);
    seen.add(movement.mode);

    const hasFeet = movement.feet !== undefined && movement.feet !== null;
    const hasMultiplier =
      movement.baseSpeedMultiplier !== undefined && movement.baseSpeedMultiplier !== null;
    if (hasFeet === hasMultiplier) {
      throw new RangeError(
        `Movement ${movement.mode} must define exactly one of feet or baseSpeedMultiplier.`,
      );
    }

    let feet: number;
    if (hasFeet) {
      assertNonNegativeInteger(movement.feet as number, `${movement.mode} speed`);
      feet = movement.feet as number;
    } else {
      const multiplier = movement.baseSpeedMultiplier as number;
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        throw new RangeError("Movement speed multiplier must be positive and finite.");
      }
      feet = Math.floor(race.baseSpeedFeet * multiplier);
    }

    result.push({
      mode: movement.mode,
      feet,
      ...(movement.maneuverability === undefined || movement.maneuverability === null
        ? {}
        : { maneuverability: movement.maneuverability }),
    });
  }

  return result;
}
