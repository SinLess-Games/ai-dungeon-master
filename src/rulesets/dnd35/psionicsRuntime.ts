import { resolveCheck, type CheckResult } from "@engine/checks";
import { createResource, spendResource, type ResourceChange } from "@engine/resources";
import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";

export interface PowerAugmentationOption {
  id: string;
  additionalPowerPoints: number;
  repeatable: boolean;
  applications?: number;
}

export interface PlannedPowerManifestation {
  baseCost: number;
  augmentationCost: number;
  totalCost: number;
  manifesterLevel: number;
  remainingPowerPoints: number;
  augmentations: readonly {
    id: string;
    applications: number;
    cost: number;
  }[];
}

export interface PsionicFocusState {
  focused: boolean;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function planPowerManifestation(input: {
  baseCost: number;
  manifesterLevel: number;
  currentPowerPoints: number;
  augmentations?: readonly PowerAugmentationOption[];
  ignoreManifesterLevelCap?: boolean;
}): EngineResult<PlannedPowerManifestation> {
  assertNonNegativeInteger(input.baseCost, "Base power cost");
  assertNonNegativeInteger(input.manifesterLevel, "Manifester level");
  assertNonNegativeInteger(input.currentPowerPoints, "Current power points");

  const planned: Array<{ id: string; applications: number; cost: number }> = [];
  let augmentationCost = 0;

  for (const augmentation of input.augmentations ?? []) {
    if (!augmentation.id.trim()) throw new RangeError("Power augmentation id cannot be empty.");
    assertNonNegativeInteger(augmentation.additionalPowerPoints, "Augmentation power-point cost");
    const applications = augmentation.applications ?? 1;
    if (!Number.isSafeInteger(applications) || applications < 1) {
      throw new RangeError("Augmentation applications must be a positive safe integer.");
    }
    if (!augmentation.repeatable && applications !== 1) {
      return engineFailure(
        "POWER_AUGMENT_NOT_REPEATABLE",
        `Augmentation ${augmentation.id} cannot be applied more than once.`,
      );
    }
    const cost = augmentation.additionalPowerPoints * applications;
    augmentationCost += cost;
    planned.push({ id: augmentation.id, applications, cost });
  }

  const totalCost = input.baseCost + augmentationCost;
  if (totalCost > input.currentPowerPoints) {
    return engineFailure("INSUFFICIENT_POWER_POINTS", "Not enough power points to manifest this power.");
  }
  if (!input.ignoreManifesterLevelCap && totalCost > input.manifesterLevel) {
    return engineFailure(
      "MANIFESTER_LEVEL_POWER_POINT_CAP",
      "A power cannot normally cost more power points than the manifester level.",
    );
  }

  return engineSuccess({
    baseCost: input.baseCost,
    augmentationCost,
    totalCost,
    manifesterLevel: input.manifesterLevel,
    remainingPowerPoints: input.currentPowerPoints - totalCost,
    augmentations: planned,
  });
}

export function spendPowerPoints(input: {
  current: number;
  maximum: number;
  amount: number;
}): EngineResult<ResourceChange> {
  assertNonNegativeInteger(input.current, "Current power points");
  assertNonNegativeInteger(input.maximum, "Maximum power points");
  assertNonNegativeInteger(input.amount, "Power-point spend amount");
  if (input.current > input.maximum) throw new RangeError("Current power points cannot exceed maximum power points.");

  try {
    const pool = createResource(input.current, 0, input.maximum);
    return engineSuccess(spendResource(pool, input.amount, "reject"));
  } catch {
    return engineFailure("INSUFFICIENT_POWER_POINTS", "Not enough power points are available.");
  }
}

export function expendPsionicFocus(state: PsionicFocusState): EngineResult<PsionicFocusState> {
  if (!state.focused) {
    return engineFailure("PSIONIC_FOCUS_REQUIRED", "The character is not psionically focused.");
  }
  return engineSuccess({ focused: false });
}

export function gainPsionicFocus(): PsionicFocusState {
  return { focused: true };
}

/** Power resistance is resolved as d20 + manifester level against PR. */
export function resolvePowerResistanceCheck(input: {
  manifesterLevel: number;
  powerResistance: number;
  roll?: number;
}): CheckResult {
  assertNonNegativeInteger(input.manifesterLevel, "Manifester level");
  assertNonNegativeInteger(input.powerResistance, "Power resistance");
  return resolveCheck({
    bonus: input.manifesterLevel,
    target: input.powerResistance,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
}

/** Psionic concentration uses the same basic d20 + skill modifier check shape. */
export function resolvePsionicConcentrationCheck(input: {
  modifier: number;
  dc: number;
  roll?: number;
}): CheckResult {
  if (!Number.isFinite(input.modifier)) throw new RangeError("Psionic concentration modifier must be finite.");
  assertNonNegativeInteger(input.dc, "Psionic concentration DC");
  return resolveCheck({
    bonus: input.modifier,
    target: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
}
