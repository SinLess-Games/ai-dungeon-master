import { advanceDuration, validateDuration, type Duration, type TimeStep } from "./time";
import { assertEngineId } from "./types";

export type ConditionStackingMode = "independent" | "stack" | "refresh" | "replace";

export interface ConditionInstance {
  id: string;
  definitionId: string;
  targetId: string;
  sourceId: string | null;
  stacks: number;
  maxStacks: number;
  duration: Duration;
  appliedAt: number;
  enabled: boolean;
}

export interface ConditionPolicy {
  stacking: ConditionStackingMode;
  refreshDurationOnStack?: boolean;
}

export interface ConditionChange {
  conditions: readonly ConditionInstance[];
  addedIds: readonly string[];
  updatedIds: readonly string[];
  removedIds: readonly string[];
}

function validateCondition(condition: ConditionInstance): ConditionInstance {
  assertEngineId(condition.id, "Condition id");
  assertEngineId(condition.definitionId, "Condition definition id");
  assertEngineId(condition.targetId, "Condition target id");
  if (!Number.isSafeInteger(condition.stacks) || condition.stacks < 1) {
    throw new RangeError("Condition stacks must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(condition.maxStacks) || condition.maxStacks < 1) {
    throw new RangeError("Condition maxStacks must be a positive safe integer.");
  }
  if (condition.stacks > condition.maxStacks) {
    throw new RangeError("Condition stacks cannot exceed maxStacks.");
  }
  if (!Number.isFinite(condition.appliedAt)) throw new RangeError("Condition appliedAt must be finite.");
  validateDuration(condition.duration);
  return condition;
}

export function applyCondition(
  input: readonly ConditionInstance[],
  incoming: ConditionInstance,
  policy: ConditionPolicy,
): ConditionChange {
  validateCondition(incoming);
  const existingIds = new Set(input.map((condition) => condition.id));
  if (existingIds.has(incoming.id)) throw new Error(`Duplicate condition id: ${incoming.id}`);
  input.forEach(validateCondition);

  const matching = input.filter(
    (condition) =>
      condition.enabled &&
      condition.targetId === incoming.targetId &&
      condition.definitionId === incoming.definitionId,
  );

  if (policy.stacking === "independent" || matching.length === 0) {
    return {
      conditions: [...input, incoming],
      addedIds: [incoming.id],
      updatedIds: [],
      removedIds: [],
    };
  }

  if (policy.stacking === "replace") {
    const removed = new Set(matching.map((condition) => condition.id));
    return {
      conditions: [...input.filter((condition) => !removed.has(condition.id)), incoming],
      addedIds: [incoming.id],
      updatedIds: [],
      removedIds: [...removed],
    };
  }

  const selected = matching[0];
  if (!selected) throw new Error("Condition matching invariant failed.");

  const updated: ConditionInstance =
    policy.stacking === "refresh"
      ? {
          ...selected,
          duration: incoming.duration,
          sourceId: incoming.sourceId,
          appliedAt: incoming.appliedAt,
        }
      : {
          ...selected,
          stacks: Math.min(selected.maxStacks, selected.stacks + incoming.stacks),
          ...(policy.refreshDurationOnStack ? { duration: incoming.duration } : {}),
        };

  return {
    conditions: input.map((condition) => (condition.id === selected.id ? updated : condition)),
    addedIds: [],
    updatedIds: [selected.id],
    removedIds: [],
  };
}

export function removeCondition(
  input: readonly ConditionInstance[],
  conditionId: string,
): ConditionChange {
  const exists = input.some((condition) => condition.id === conditionId);
  return {
    conditions: exists ? input.filter((condition) => condition.id !== conditionId) : [...input],
    addedIds: [],
    updatedIds: [],
    removedIds: exists ? [conditionId] : [],
  };
}

export function advanceConditions(
  input: readonly ConditionInstance[],
  step: TimeStep,
): ConditionChange {
  const expired: string[] = [];
  const updated: string[] = [];
  const conditions: ConditionInstance[] = [];

  for (const condition of input) {
    validateCondition(condition);
    if (!condition.enabled) {
      conditions.push(condition);
      continue;
    }
    const advanced = advanceDuration(condition.duration, step);
    if (advanced.expired) {
      expired.push(condition.id);
      continue;
    }
    if (advanced.changed) updated.push(condition.id);
    conditions.push(advanced.changed ? { ...condition, duration: advanced.after } : condition);
  }

  return { conditions, addedIds: [], updatedIds: updated, removedIds: expired };
}

export function selectConditions(
  input: readonly ConditionInstance[],
  targetId: string,
  definitionId?: string,
): readonly ConditionInstance[] {
  return input.filter(
    (condition) =>
      condition.enabled &&
      condition.targetId === targetId &&
      (definitionId === undefined || condition.definitionId === definitionId),
  );
}
