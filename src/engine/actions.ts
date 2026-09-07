import { evaluatePrerequisite, type Prerequisite, type PrerequisiteContext } from "./prerequisites";
import { engineFailures, engineSuccess, type EngineResult } from "./result";
import { spendResource, type ResourceState } from "./resources";
import { validateTargets, type TargetSpec } from "./targets";
import type { EngineIssue, EntityRef } from "./types";

export interface ActionResourceCost {
  resource: string;
  amount: number;
}

export interface ActionDefinition {
  id: string;
  enabled?: boolean;
  phase?: string;
  prerequisite?: Prerequisite;
  targeting?: TargetSpec;
  costs?: readonly ActionResourceCost[];
}

export interface ActionContext {
  actorId: string;
  targets: readonly EntityRef[];
  phase?: string;
  prerequisiteContext?: PrerequisiteContext;
  resources?: Readonly<Record<string, ResourceState>>;
}

export interface ValidatedAction {
  actionId: string;
  actorId: string;
  targets: readonly EntityRef[];
  costs: readonly ActionResourceCost[];
}

export function validateAction(
  definition: ActionDefinition,
  context: ActionContext,
): EngineResult<ValidatedAction> {
  if (!definition.id.trim()) throw new RangeError("Action id cannot be empty.");
  if (!context.actorId.trim()) throw new RangeError("Action actor id cannot be empty.");

  const errors: EngineIssue[] = [];

  if (definition.enabled === false) {
    errors.push({ code: "ACTION_UNAVAILABLE", message: `Action ${definition.id} is disabled.` });
  }

  if (definition.phase !== undefined && definition.phase !== context.phase) {
    errors.push({
      code: "ACTION_PHASE",
      message: `Action ${definition.id} is not available in the current phase.`,
    });
  }

  if (definition.targeting) {
    const targetResult = validateTargets(context.actorId, context.targets, definition.targeting);
    if (!targetResult.ok) errors.push(...targetResult.errors);
  } else if (context.targets.length > 0) {
    errors.push({
      code: "TARGET_COUNT",
      message: `Action ${definition.id} does not accept targets.`,
    });
  }

  if (definition.prerequisite) {
    if (!context.prerequisiteContext) {
      errors.push({
        code: "PREREQUISITE_CONTEXT_MISSING",
        message: `Action ${definition.id} requires prerequisite context.`,
      });
    } else {
      const evaluation = evaluatePrerequisite(definition.prerequisite, context.prerequisiteContext);
      for (const failure of evaluation.failures) {
        errors.push({
          code: "PREREQUISITE_FAILED",
          message: failure.message,
          path: failure.path,
        });
      }
    }
  }

  const costs = definition.costs ?? [];
  for (const cost of costs) {
    if (!cost.resource.trim()) throw new RangeError("Action resource cost key cannot be empty.");
    if (!Number.isFinite(cost.amount) || cost.amount < 0) {
      throw new RangeError(`Action resource cost ${cost.resource} must be a non-negative finite number.`);
    }
    const pool = context.resources?.[cost.resource];
    if (!pool) {
      errors.push({
        code: "RESOURCE_NOT_FOUND",
        message: `Required resource ${cost.resource} is unavailable.`,
      });
      continue;
    }
    try {
      spendResource(pool, cost.amount, "reject");
    } catch {
      errors.push({
        code: "INSUFFICIENT_RESOURCE",
        message: `Not enough ${cost.resource} to perform ${definition.id}.`,
      });
    }
  }

  if (errors.length > 0) return engineFailures(errors);

  return engineSuccess({
    actionId: definition.id,
    actorId: context.actorId,
    targets: [...context.targets],
    costs: [...costs],
  });
}
