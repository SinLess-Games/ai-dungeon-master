import { engineFailure, engineSuccess, type EngineResult } from "@/engine";

export type Dnd35ActionKind =
  | "standard"
  | "move"
  | "full_round"
  | "swift"
  | "immediate"
  | "free"
  | "attack_of_opportunity";

export interface Dnd35ActionEconomy {
  standardAvailable: boolean;
  moveAvailable: boolean;
  swiftAvailable: boolean;
  /** An off-turn immediate action consumes the swift action on the next turn. */
  swiftDebtNextTurn: boolean;
  attacksOfOpportunityPerRound: number;
  attacksOfOpportunityRemaining: number;
}

export interface ImmediateActionOptions {
  /** D&D 3.5 does not permit immediate actions while flat-footed. */
  flatFooted?: boolean;
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
    swiftDebtNextTurn: false,
    attacksOfOpportunityPerRound,
    attacksOfOpportunityRemaining: attacksOfOpportunityPerRound,
  };
}

/** Reset per-turn actions while preserving the current round's AoO usage. */
export function beginDnd35Turn(state: Dnd35ActionEconomy): Dnd35ActionEconomy {
  const swiftAvailable = !state.swiftDebtNextTurn;
  return {
    ...state,
    standardAvailable: true,
    moveAvailable: true,
    swiftAvailable,
    swiftDebtNextTurn: false,
  };
}

/** Reset the attack-of-opportunity allowance at the ruleset's round boundary. */
export function beginDnd35Round(state: Dnd35ActionEconomy): Dnd35ActionEconomy {
  return {
    ...state,
    attacksOfOpportunityRemaining: state.attacksOfOpportunityPerRound,
  };
}

/**
 * Spend an immediate action. During the actor's own turn it consumes the same
 * swift-action allowance; outside the turn it creates a swift-action debt for
 * the actor's next turn. Immediate actions are unavailable while flat-footed.
 */
export function spendImmediateAction(
  state: Dnd35ActionEconomy,
  duringOwnTurn: boolean,
  options: ImmediateActionOptions = {},
): EngineResult<Dnd35ActionEconomy> {
  if (options.flatFooted) {
    return engineFailure(
      "DND35_IMMEDIATE_FLAT_FOOTED",
      "Immediate actions cannot be taken while flat-footed.",
    );
  }

  if (duringOwnTurn) {
    if (!state.swiftAvailable) {
      return engineFailure(
        "DND35_IMMEDIATE_ACTION_SPENT",
        "No swift/immediate action remains this turn.",
      );
    }
    return engineSuccess({ ...state, swiftAvailable: false });
  }

  if (state.swiftDebtNextTurn) {
    return engineFailure(
      "DND35_IMMEDIATE_ACTION_DEBT",
      "The next turn's swift action is already committed to an immediate action.",
    );
  }
  return engineSuccess({ ...state, swiftDebtNextTurn: true });
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
      return engineFailure(
        "DND35_MOVE_ACTION_SPENT",
        "No move or convertible standard action remains this turn.",
      );

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

    case "immediate":
      return spendImmediateAction(state, true);

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
