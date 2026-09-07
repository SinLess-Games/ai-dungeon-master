export interface EncounterTurnPosition {
  roundNumber: number;
  turnOrder: number;
}

export interface RoundConditionAnchor {
  expiresEncounterRound: number;
  expiresTurnOrder: number;
}

export type RoundConditionTransition = "unchanged" | "decrement" | "expire";

function positiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function nonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

/**
 * Anchor an N-round effect to the initiative slot at which it was applied.
 *
 * D&D round durations return to the same initiative position rather than
 * expiring at the global top of a round. A one-round effect applied during
 * round 3, turn slot 2 therefore expires immediately before slot 2 in round 4.
 */
export function createRoundConditionAnchor(input: {
  currentRound: number;
  currentTurnOrder: number;
  durationRounds: number;
}): RoundConditionAnchor {
  positiveSafeInteger(input.currentRound, "Current round");
  nonNegativeSafeInteger(input.currentTurnOrder, "Current turn order");
  positiveSafeInteger(input.durationRounds, "Round duration");

  const expiresEncounterRound = input.currentRound + input.durationRounds;
  if (!Number.isSafeInteger(expiresEncounterRound)) {
    throw new RangeError("Round condition expiry exceeds the safe integer range.");
  }

  return {
    expiresEncounterRound,
    expiresTurnOrder: input.currentTurnOrder,
  };
}

/** Determine what should happen as the encounter enters a destination turn. */
export function roundConditionTransition(input: {
  anchor: RoundConditionAnchor;
  destination: EncounterTurnPosition;
  remainingRounds: number;
}): RoundConditionTransition {
  positiveSafeInteger(input.anchor.expiresEncounterRound, "Expiry round");
  nonNegativeSafeInteger(input.anchor.expiresTurnOrder, "Expiry turn order");
  positiveSafeInteger(input.destination.roundNumber, "Destination round");
  nonNegativeSafeInteger(input.destination.turnOrder, "Destination turn order");
  positiveSafeInteger(input.remainingRounds, "Remaining rounds");

  const passedExpiry =
    input.destination.roundNumber > input.anchor.expiresEncounterRound ||
    (input.destination.roundNumber === input.anchor.expiresEncounterRound &&
      input.destination.turnOrder >= input.anchor.expiresTurnOrder);
  if (passedExpiry) return "expire";

  if (
    input.destination.turnOrder === input.anchor.expiresTurnOrder &&
    input.destination.roundNumber < input.anchor.expiresEncounterRound &&
    input.remainingRounds > 1
  ) {
    return "decrement";
  }

  return "unchanged";
}
