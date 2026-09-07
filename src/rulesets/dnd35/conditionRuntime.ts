import type { ConditionInstance, ConditionPolicy } from "@engine/conditions";
import type { Duration } from "@engine/time";
import type { Dnd35Modifier } from "./modifiers";
import {
  modifiersFromRuleEffects,
  type Dnd35ModifierTarget,
  type Dnd35RuntimeRuleEffect,
  type RuleEffectSource,
} from "./ruleEffects";

export type PersistedConditionDurationKind =
  | "rounds"
  | "until_time"
  | "permanent"
  | "concentration"
  | "special";

export type PersistedConditionStacking = "replace" | "independent" | "cumulative" | "special";

export interface PersistedConditionRuntimeRow {
  id: string;
  characterId: string;
  conditionId: string;
  durationKind: PersistedConditionDurationKind;
  remainingRounds: number | null;
  expiresAt: Date | number | null;
  sourceCharacterId?: string | null;
  appliedAt?: Date | number;
}

export interface RuntimeConditionDefinition {
  id: string;
  name?: string;
  stacking: PersistedConditionStacking;
  effects?: readonly Dnd35RuntimeRuleEffect[] | null;
}

export interface AdaptedDnd35Condition {
  instance: ConditionInstance;
  policy: ConditionPolicy;
  endsOnConcentrationLoss: boolean;
  specialDuration: boolean;
}

function epochMilliseconds(value: Date | number): number {
  const milliseconds = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError(
      "Condition timestamp must be a non-negative finite epoch-millisecond value.",
    );
  }
  return milliseconds;
}

function persistedDurationToEngine(
  row: PersistedConditionRuntimeRow,
  nowMs: number,
): { duration: Duration; endsOnConcentrationLoss: boolean; specialDuration: boolean } {
  switch (row.durationKind) {
    case "rounds": {
      if (
        row.remainingRounds === null ||
        !Number.isSafeInteger(row.remainingRounds) ||
        row.remainingRounds < 0
      ) {
        throw new RangeError(
          "Round-based conditions require a non-negative remaining-round count.",
        );
      }
      return {
        duration: { kind: "rounds", remaining: row.remainingRounds },
        endsOnConcentrationLoss: false,
        specialDuration: false,
      };
    }
    case "until_time": {
      if (row.expiresAt === null) throw new RangeError("Timed conditions require expiresAt.");
      const remainingMs = Math.max(0, Math.floor(epochMilliseconds(row.expiresAt) - nowMs));
      return {
        duration: { kind: "elapsed", remainingMs },
        endsOnConcentrationLoss: false,
        specialDuration: false,
      };
    }
    case "permanent":
      return {
        duration: { kind: "permanent" },
        endsOnConcentrationLoss: false,
        specialDuration: false,
      };
    case "concentration":
      return {
        duration: { kind: "permanent" },
        endsOnConcentrationLoss: true,
        specialDuration: false,
      };
    case "special":
      return {
        duration: { kind: "permanent" },
        endsOnConcentrationLoss: false,
        specialDuration: true,
      };
  }
}

export function conditionPolicyFromPersistence(
  stacking: PersistedConditionStacking,
  specialPolicy?: ConditionPolicy,
): ConditionPolicy {
  switch (stacking) {
    case "replace":
      return { stacking: "replace" };
    case "independent":
      return { stacking: "independent" };
    case "cumulative":
      return { stacking: "stack", refreshDurationOnStack: false };
    case "special":
      if (!specialPolicy) {
        throw new Error("Special condition stacking requires an explicit ruleset policy.");
      }
      return specialPolicy;
  }
}

export function adaptPersistedCondition(
  row: PersistedConditionRuntimeRow,
  definition: RuntimeConditionDefinition,
  options: {
    nowMs?: number;
    maxStacks?: number;
    stacks?: number;
    enabled?: boolean;
    specialPolicy?: ConditionPolicy;
  } = {},
): AdaptedDnd35Condition {
  if (!row.id.trim() || !row.characterId.trim() || !row.conditionId.trim()) {
    throw new RangeError("Persisted condition ids cannot be empty.");
  }
  if (definition.id !== row.conditionId) {
    throw new Error("Condition definition does not match the persisted condition row.");
  }

  const nowMs = options.nowMs ?? Date.now();
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new RangeError("nowMs must be non-negative and finite.");
  }
  const adaptedDuration = persistedDurationToEngine(row, nowMs);
  const appliedAt = row.appliedAt === undefined ? nowMs : epochMilliseconds(row.appliedAt);
  const stacks = options.stacks ?? 1;
  const maxStacks =
    options.maxStacks ?? (definition.stacking === "cumulative" ? Number.MAX_SAFE_INTEGER : 1);

  return {
    instance: {
      id: row.id,
      definitionId: row.conditionId,
      targetId: row.characterId,
      sourceId: row.sourceCharacterId?.trim() || null,
      stacks,
      maxStacks,
      duration: adaptedDuration.duration,
      appliedAt,
      enabled: options.enabled ?? true,
    },
    policy: conditionPolicyFromPersistence(definition.stacking, options.specialPolicy),
    endsOnConcentrationLoss: adaptedDuration.endsOnConcentrationLoss,
    specialDuration: adaptedDuration.specialDuration,
  };
}

/** Resolve active modifiers contributed by a condition definition plus optional instance effects. */
export function conditionModifiers(input: {
  definition: RuntimeConditionDefinition;
  instanceEffects?: readonly Dnd35RuntimeRuleEffect[];
  target: Dnd35ModifierTarget;
  sourceInstanceId: string;
  evaluateWhen?: (expression: string) => boolean;
}): readonly Dnd35Modifier[] {
  const effects = [...(input.definition.effects ?? []), ...(input.instanceEffects ?? [])];
  const options = input.evaluateWhen ? { evaluateWhen: input.evaluateWhen } : {};
  const source: RuleEffectSource = {
    id: input.sourceInstanceId,
    ...(input.definition.name === undefined ? {} : { name: input.definition.name }),
  };
  return modifiersFromRuleEffects(effects, input.target, source, options);
}
