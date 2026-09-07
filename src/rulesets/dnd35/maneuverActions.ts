import { engineFailure, engineSuccess, type EngineResult } from "@/engine";
import { resolveAttackRoll, type AttackRollResult } from "./combat";
import { maneuverSizeModifier, resolveOpposedManeuver, type OpposedManeuverResult } from "./maneuvers";
import type { Dnd35Size } from "./types";

export interface TripResolution {
  touchAttack: AttackRollResult;
  opposedCheck: OpposedManeuverResult | null;
  tripped: boolean;
  counterTripAvailable: boolean;
}

/** Resolve the core trip sequence: touch attack, then opposed Str vs best Str/Dex check. */
export function resolveTripAttempt(input: {
  attackBonus: number;
  touchArmorClass: number;
  attackRoll?: number;
  attackerStrengthModifier: number;
  attackerSize: Dnd35Size;
  defenderStrengthModifier: number;
  defenderDexterityModifier: number;
  defenderSize: Dnd35Size;
  attackerExtraModifier?: number;
  defenderExtraModifier?: number;
  attackerCheckRoll?: number;
  defenderCheckRoll?: number;
}): TripResolution {
  const touchAttack = resolveAttackRoll({
    attackBonus: input.attackBonus,
    armorClass: input.touchArmorClass,
    ...(input.attackRoll === undefined ? {} : { roll: input.attackRoll }),
  });
  if (!touchAttack.hit) {
    return { touchAttack, opposedCheck: null, tripped: false, counterTripAvailable: false };
  }

  const attackerBonus =
    input.attackerStrengthModifier +
    maneuverSizeModifier(input.attackerSize, input.defenderSize) +
    (input.attackerExtraModifier ?? 0);
  const defenderBonus =
    Math.max(input.defenderStrengthModifier, input.defenderDexterityModifier) +
    (input.defenderExtraModifier ?? 0);
  const opposedCheck = resolveOpposedManeuver({
    attackerBonus,
    defenderBonus,
    ...(input.attackerCheckRoll === undefined ? {} : { attackerRoll: input.attackerCheckRoll }),
    ...(input.defenderCheckRoll === undefined ? {} : { defenderRoll: input.defenderCheckRoll }),
  });

  return {
    touchAttack,
    opposedCheck,
    tripped: opposedCheck.attackerSucceeded,
    counterTripAvailable: !opposedCheck.attackerSucceeded,
  };
}

export interface BullRushResolution {
  opposedCheck: OpposedManeuverResult;
  succeeded: boolean;
  minimumPushFeet: number;
  additionalPushFeet: number;
  totalPushFeet: number;
}

/** Resolve the opposed Strength portion of a bull rush after entry/AoO handling. */
export function resolveBullRush(input: {
  attackerStrengthModifier: number;
  defenderStrengthModifier: number;
  attackerSize: Dnd35Size;
  defenderSize: Dnd35Size;
  attackerCharging?: boolean;
  attackerExtraModifier?: number;
  defenderExtraModifier?: number;
  attackerRoll?: number;
  defenderRoll?: number;
}): BullRushResolution {
  const attackerBonus =
    input.attackerStrengthModifier +
    maneuverSizeModifier(input.attackerSize, input.defenderSize) +
    (input.attackerCharging ? 2 : 0) +
    (input.attackerExtraModifier ?? 0);
  const defenderBonus = input.defenderStrengthModifier + (input.defenderExtraModifier ?? 0);
  const opposedCheck = resolveOpposedManeuver({
    attackerBonus,
    defenderBonus,
    ...(input.attackerRoll === undefined ? {} : { attackerRoll: input.attackerRoll }),
    ...(input.defenderRoll === undefined ? {} : { defenderRoll: input.defenderRoll }),
  });
  if (!opposedCheck.attackerSucceeded) {
    return { opposedCheck, succeeded: false, minimumPushFeet: 0, additionalPushFeet: 0, totalPushFeet: 0 };
  }

  const minimumPushFeet = 5;
  const additionalPushFeet = Math.floor(Math.max(0, opposedCheck.margin - 1) / 5) * 5;
  return {
    opposedCheck,
    succeeded: true,
    minimumPushFeet,
    additionalPushFeet,
    totalPushFeet: minimumPushFeet + additionalPushFeet,
  };
}

export interface DisarmResolution {
  attackerTotal: number;
  defenderTotal: number;
  succeeded: boolean;
  counterDisarmAvailable: boolean;
}

/** Resolve the opposed attack-roll part of a disarm attempt after AoO/touch handling. */
export function resolveDisarmAttempt(input: {
  attackerAttackBonus: number;
  defenderAttackBonus: number;
  attackerWeaponSizeDifference?: number;
  attackerTwoHanded?: boolean;
  defenderTwoHanded?: boolean;
  attackerLightWeapon?: boolean;
  defenderLightWeapon?: boolean;
  attackerExtraModifier?: number;
  defenderExtraModifier?: number;
  attackerRoll: number;
  defenderRoll: number;
}): EngineResult<DisarmResolution> {
  if (!Number.isSafeInteger(input.attackerRoll) || input.attackerRoll < 1 || input.attackerRoll > 20) {
    throw new RangeError("Attacker disarm roll must be from 1 through 20.");
  }
  if (!Number.isSafeInteger(input.defenderRoll) || input.defenderRoll < 1 || input.defenderRoll > 20) {
    throw new RangeError("Defender disarm roll must be from 1 through 20.");
  }
  const sizeDifference = input.attackerWeaponSizeDifference ?? 0;
  if (!Number.isSafeInteger(sizeDifference)) throw new RangeError("Weapon size difference must be an integer.");

  const attackerBonus =
    input.attackerAttackBonus +
    sizeDifference * 4 +
    (input.attackerTwoHanded ? 4 : 0) +
    (input.attackerLightWeapon ? -4 : 0) +
    (input.attackerExtraModifier ?? 0);
  const defenderBonus =
    input.defenderAttackBonus +
    (input.defenderTwoHanded ? 4 : 0) +
    (input.defenderLightWeapon ? -4 : 0) +
    (input.defenderExtraModifier ?? 0);

  const attackerTotal = input.attackerRoll + attackerBonus;
  const defenderTotal = input.defenderRoll + defenderBonus;
  const succeeded = attackerTotal > defenderTotal;
  return engineSuccess({
    attackerTotal,
    defenderTotal,
    succeeded,
    counterDisarmAvailable: !succeeded,
  });
}

export function validateTripSize(attackerSize: Dnd35Size, defenderSize: Dnd35Size): EngineResult<true> {
  const order: readonly Dnd35Size[] = [
    "fine",
    "diminutive",
    "tiny",
    "small",
    "medium",
    "large",
    "huge",
    "gargantuan",
    "colossal",
  ];
  if (order.indexOf(defenderSize) - order.indexOf(attackerSize) > 1) {
    return engineFailure(
      "DND35_TRIP_SIZE_LIMIT",
      "A creature normally cannot trip an opponent more than one size category larger.",
    );
  }
  return engineSuccess(true);
}
