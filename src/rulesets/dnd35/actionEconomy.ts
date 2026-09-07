import { engineFailure, engineSuccess, type EngineResult } from "@/engine";

export type Dnd35ActionKind =
  | "standard"
  | "move"
  | "full_round"
  | "swift"
  | "free"
  | "attack_of_opportunity";

export interface Dnd35ActionEconomy {
  standardAvailable: boolean;
  moveAvailable: boolean;
  swiftAvailable: boolean;
  attacksOfOpportunityPerRound: number;
  attacksOfOpportunityRemaining: number;
}

function assertAttacksOfOpportunity(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Attacks of opportunity must be a non-negative safe integer.");
  }
}

export function createDnd35ActionEconomy(
  attacksOfOpportunityPerRound = 1,
): Dnd35ActionEconomy {
  assertAttacksOfOpportunity(attacksOfOpportunityPerRound);
  return {
    standardAvailable: true,
    moveAvailable: true,
    swiftAvailable: true,
    attacksOfOpportunityPerRound,
    attacksOfOpportunityRemaining: attacksOfOpportunityPerRound,
  };
}

/** Reset per-turn actions while preserving the current round's AoO usage. */
export function beginDnd35Turn(state: Dnd35ActionEconomy): Dnd35ActionEconomy {
  return {
    ...state,
    standardAvailable: true,
    moveAvailable: true,
    swiftAvailable: true,
  };
}

/** Reset the attack-of-opportunity allowance at the ruleset's round boundary. */
export function beginDnd35Round(state: Dnd35ActionEconomy): Dnd35ActionEconomy {
  return {
    ...state,
    attacksOfOpportunityRemaining: state.attacksOfOpportunityPerRound,
  };
}

export function spendDnd35Action(
  state: Dnd35ActionEconomy,
  kind: Dnd35ActionKind,
): EngineResult<Dnd35ActionEconomy> {
  switch (kind) {
    case "free":
      return engineSuccess({ ...state });

    case "standard":
      if (!state.standardAvailable) {
        return engineFailure("DND35_STANDARD_ACTION_SPENT", "No standard action remains this turn.");
      }
      return engineSuccess({ ...state, standardAvailable: false });

    case "move":
      if (state.moveAvailable) {
        return engineSuccess({ ...state, moveAvailable: false });
      }
      // A standard action may be exchanged for a move action.
      if (state.standardAvailable) {
        return engineSuccess({ ...state, standardAvailable: false });
      }
      return engineFailure("DND35_MOVE_ACTION_SPENT", "No move or convertible standard action remains this turn.");

    case "full_round":
      if (!state.standardAvailable || !state.moveAvailable) {
        return engineFailure(
          "DND35_FULL_ROUND_UNAVAILABLE",
          "A full-round action requires both the standard and move actions to remain available.",
        );
      }
      return engineSuccess({ ...state, standardAvailable: false, moveAvailable: false });

    case "swift":
      if (!state.swiftAvailable) {
        return engineFailure("DND35_SWIFT_ACTION_SPENT", "No swift action remains this turn.");
      }
      return engineSuccess({ ...state, swiftAvailable: false });

    case "attack_of_opportunity":
      if (state.attacksOfOpportunityRemaining < 1) {
        return engineFailure(
          "DND35_AOO_SPENT",
          "No attacks of opportunity remain in the current round.",
        );
      }
      return engineSuccess({
        ...state,
        attacksOfOpportunityRemaining: state.attacksOfOpportunityRemaining - 1,
      });
  }
}
