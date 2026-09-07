import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import {
  spendDnd35Action,
  spendImmediateAction,
  type Dnd35ActionEconomy,
  type Dnd35ActionKind,
} from "./actionEconomy";
import {
  expendPreparedSpell,
  expendSpontaneousSlot,
  type PreparedSpellState,
  type SpontaneousSlotState,
} from "./spellcastingRuntime";

export type SpellCastingResource =
  | { kind: "prepared"; state: PreparedSpellState }
  | { kind: "spontaneous"; state: SpontaneousSlotState }
  | { kind: "at_will" };

export interface SpellCastCommit {
  actionEconomy: Dnd35ActionEconomy;
  resource: SpellCastingResource;
}

function spendCastingAction(
  state: Dnd35ActionEconomy,
  actionKind: Dnd35ActionKind,
  immediateOutsideOwnTurn: boolean,
  actorFlatFooted: boolean,
): EngineResult<Dnd35ActionEconomy> {
  if (actionKind === "immediate" && immediateOutsideOwnTurn) {
    return spendImmediateAction(state, false, { flatFooted: actorFlatFooted });
  }
  if (actionKind === "immediate" && actorFlatFooted) {
    return spendImmediateAction(state, true, { flatFooted: true });
  }
  return spendDnd35Action(state, actionKind);
}

/**
 * Atomically validate and consume the action plus prepared/spontaneous resource
 * for a spell cast. Callers apply spell effects only after this succeeds.
 */
export function commitSpellCast(input: {
  actionEconomy: Dnd35ActionEconomy;
  actionKind: Dnd35ActionKind;
  resource: SpellCastingResource;
  immediateOutsideOwnTurn?: boolean;
  actorFlatFooted?: boolean;
}): EngineResult<SpellCastCommit> {
  const action = spendCastingAction(
    input.actionEconomy,
    input.actionKind,
    input.immediateOutsideOwnTurn ?? false,
    input.actorFlatFooted ?? false,
  );
  if (!action.ok) return action;

  let resource: SpellCastingResource;
  if (input.resource.kind === "prepared") {
    const spent = expendPreparedSpell(input.resource.state);
    if (!spent.ok) return spent;
    resource = { kind: "prepared", state: spent.value };
  } else if (input.resource.kind === "spontaneous") {
    const spent = expendSpontaneousSlot(input.resource.state);
    if (!spent.ok) return spent;
    resource = { kind: "spontaneous", state: spent.value };
  } else {
    resource = { kind: "at_will" };
  }

  return engineSuccess({ actionEconomy: action.value, resource });
}

export function validateSpellCastLevel(input: {
  spellLevel: number;
  slotLevel: number;
  metamagicAdjustment?: number;
}): EngineResult<{ effectiveSlotLevel: number }> {
  if (!Number.isSafeInteger(input.spellLevel) || input.spellLevel < 0 || input.spellLevel > 9) {
    throw new RangeError("Spell level must be an integer from 0 through 9.");
  }
  if (!Number.isSafeInteger(input.slotLevel) || input.slotLevel < 0) {
    throw new RangeError("Slot level must be a non-negative safe integer.");
  }
  const adjustment = input.metamagicAdjustment ?? 0;
  if (!Number.isSafeInteger(adjustment) || adjustment < 0) {
    throw new RangeError("Metamagic adjustment must be a non-negative safe integer.");
  }

  const effectiveSlotLevel = input.spellLevel + adjustment;
  if (input.slotLevel < effectiveSlotLevel) {
    return engineFailure(
      "DND35_SPELL_SLOT_TOO_LOW",
      `The spell requires a level ${effectiveSlotLevel} slot after metamagic adjustments.`,
    );
  }
  return engineSuccess({ effectiveSlotLevel });
}
