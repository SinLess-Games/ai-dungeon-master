import { mathRandomSource, rollDie, type RandomSource } from "@/engine";
import type { Dnd35Size } from "./types";

const SIZE_ORDER: readonly Dnd35Size[] = [
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

function resolveRoll(explicit: number | undefined, random: RandomSource): number {
  if (explicit === undefined) return rollDie(20, random);
  if (!Number.isSafeInteger(explicit) || explicit < 1 || explicit > 20) {
    throw new RangeError("Maneuver roll must be an integer from 1 through 20.");
  }
  return explicit;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

/** +4 per size category larger than the opponent, -4 per category smaller. */
export function maneuverSizeModifier(actorSize: Dnd35Size, opponentSize: Dnd35Size): number {
  const actorIndex = SIZE_ORDER.indexOf(actorSize);
  const opponentIndex = SIZE_ORDER.indexOf(opponentSize);
  return (actorIndex - opponentIndex) * 4;
}

export interface OpposedManeuverResult {
  attackerRoll: number;
  defenderRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  attackerSucceeded: boolean;
  margin: number;
}

/**
 * Resolve opposed checks such as the Strength contest portion of trip/bull rush.
 * Exact ties favor the defender unless a more specific rule overrides it.
 */
export function resolveOpposedManeuver(input: {
  attackerBonus: number;
  defenderBonus: number;
  attackerRoll?: number;
  defenderRoll?: number;
  random?: RandomSource;
}): OpposedManeuverResult {
  assertFinite(input.attackerBonus, "Attacker maneuver bonus");
  assertFinite(input.defenderBonus, "Defender maneuver bonus");
  const random = input.random ?? mathRandomSource;
  const attackerRoll = resolveRoll(input.attackerRoll, random);
  const defenderRoll = resolveRoll(input.defenderRoll, random);
  const attackerTotal = attackerRoll + input.attackerBonus;
  const defenderTotal = defenderRoll + input.defenderBonus;

  return {
    attackerRoll,
    defenderRoll,
    attackerTotal,
    defenderTotal,
    attackerSucceeded: attackerTotal > defenderTotal,
    margin: attackerTotal - defenderTotal,
  };
}

export interface GrappleContestResult {
  leftRoll: number;
  rightRoll: number;
  leftTotal: number;
  rightTotal: number;
  winnerId: string | null;
  rerollRequired: boolean;
}

/**
 * Grapple checks break equal totals by the higher grapple modifier; if those are
 * also equal, the rules require another roll.
 */
export function resolveGrappleContest(input: {
  leftId: string;
  leftModifier: number;
  rightId: string;
  rightModifier: number;
  leftRoll?: number;
  rightRoll?: number;
  random?: RandomSource;
}): GrappleContestResult {
  if (!input.leftId.trim() || !input.rightId.trim() || input.leftId === input.rightId) {
    throw new RangeError("Grapple contestants must have distinct non-empty ids.");
  }
  assertFinite(input.leftModifier, "Left grapple modifier");
  assertFinite(input.rightModifier, "Right grapple modifier");

  const random = input.random ?? mathRandomSource;
  const leftRoll = resolveRoll(input.leftRoll, random);
  const rightRoll = resolveRoll(input.rightRoll, random);
  const leftTotal = leftRoll + input.leftModifier;
  const rightTotal = rightRoll + input.rightModifier;

  let winnerId: string | null;
  let rerollRequired = false;

  if (leftTotal > rightTotal) winnerId = input.leftId;
  else if (rightTotal > leftTotal) winnerId = input.rightId;
  else if (input.leftModifier > input.rightModifier) winnerId = input.leftId;
  else if (input.rightModifier > input.leftModifier) winnerId = input.rightId;
  else {
    winnerId = null;
    rerollRequired = true;
  }

  return { leftRoll, rightRoll, leftTotal, rightTotal, winnerId, rerollRequired };
}
