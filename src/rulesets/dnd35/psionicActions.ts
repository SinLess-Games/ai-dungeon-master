import { engineSuccess, type EngineResult } from "@/engine";
import {
  spendDnd35Action,
  spendImmediateAction,
  type Dnd35ActionEconomy,
  type Dnd35ActionKind,
} from "./actionEconomy";
import {
  expendPsionicFocus,
  planPowerManifestation,
  spendPowerPoints,
  type PlannedPowerManifestation,
  type PowerAugmentationOption,
  type PsionicFocusState,
} from "./psionicsRuntime";

export interface PowerManifestCommit {
  actionEconomy: Dnd35ActionEconomy;
  focus: PsionicFocusState;
  manifestation: PlannedPowerManifestation;
  powerPointsAfter: number;
}

/** Atomically consume the action, optional focus, and PP for a manifestation. */
export function commitPowerManifestation(input: {
  actionEconomy: Dnd35ActionEconomy;
  actionKind: Dnd35ActionKind;
  immediateOutsideOwnTurn?: boolean;
  currentPowerPoints: number;
  maximumPowerPoints: number;
  baseCost: number;
  manifesterLevel: number;
  augmentations?: readonly PowerAugmentationOption[];
  focus: PsionicFocusState;
  requiresFocus?: boolean;
  expendFocus?: boolean;
  ignoreManifesterLevelCap?: boolean;
}): EngineResult<PowerManifestCommit> {
  const action =
    input.actionKind === "immediate" && input.immediateOutsideOwnTurn
      ? spendImmediateAction(input.actionEconomy, false)
      : spendDnd35Action(input.actionEconomy, input.actionKind);
  if (!action.ok) return action;

  const manifestation = planPowerManifestation({
    baseCost: input.baseCost,
    manifesterLevel: input.manifesterLevel,
    currentPowerPoints: input.currentPowerPoints,
    ...(input.augmentations === undefined ? {} : { augmentations: input.augmentations }),
    ...(input.ignoreManifesterLevelCap === undefined
      ? {}
      : { ignoreManifesterLevelCap: input.ignoreManifesterLevelCap }),
  });
  if (!manifestation.ok) return manifestation;

  let focus = input.focus;
  if (input.requiresFocus && !focus.focused) {
    return {
      ok: false,
      errors: [
        {
          code: "PSIONIC_FOCUS_REQUIRED",
          message: "This manifestation requires psionic focus.",
        },
      ],
    };
  }
  if (input.expendFocus) {
    const spentFocus = expendPsionicFocus(focus);
    if (!spentFocus.ok) return spentFocus;
    focus = spentFocus.value;
  }

  const pp = spendPowerPoints({
    current: input.currentPowerPoints,
    maximum: input.maximumPowerPoints,
    amount: manifestation.value.totalCost,
  });
  if (!pp.ok) return pp;

  return engineSuccess({
    actionEconomy: action.value,
    focus,
    manifestation: manifestation.value,
    powerPointsAfter: pp.value.after.current,
  });
}
