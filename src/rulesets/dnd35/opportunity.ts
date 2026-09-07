export type ProvokingAction =
  | "leave_threatened_square"
  | "cast_spell"
  | "manifest_power"
  | "ranged_attack"
  | "unarmed_attack"
  | "stand_up"
  | "retrieve_item"
  | "drink_potion"
  | "load_crossbow"
  | "use_skill"
  | "other";

export interface OpportunityContext {
  action: ProvokingAction;
  threatened: boolean;
  fiveFootStep?: boolean;
  withdrawFirstSquare?: boolean;
  defensiveCastingSucceeded?: boolean;
  hasImprovedUnarmedStrike?: boolean;
  actionExplicitlyProvokes?: boolean;
  actionExplicitlyDoesNotProvoke?: boolean;
}

/**
 * Resolve core AoO provocation once the map layer has established whether the
 * actor is threatened. Specific feats/actions can override with explicit flags.
 */
export function provokesAttackOfOpportunity(context: OpportunityContext): boolean {
  if (!context.threatened) return false;
  if (context.actionExplicitlyDoesNotProvoke) return false;
  if (context.actionExplicitlyProvokes) return true;

  switch (context.action) {
    case "leave_threatened_square":
      return !context.fiveFootStep && !context.withdrawFirstSquare;
    case "cast_spell":
      return !context.defensiveCastingSucceeded;
    case "manifest_power":
      return !context.defensiveCastingSucceeded;
    case "ranged_attack":
    case "stand_up":
    case "retrieve_item":
    case "drink_potion":
    case "load_crossbow":
      return true;
    case "unarmed_attack":
      return !context.hasImprovedUnarmedStrike;
    case "use_skill":
    case "other":
      return false;
  }
}

export function fiveFootStepDistanceAllowed(distanceFeet: number): boolean {
  if (!Number.isFinite(distanceFeet) || distanceFeet < 0) {
    throw new RangeError("Five-foot-step distance must be non-negative and finite.");
  }
  return distanceFeet <= 5;
}
