import { engineFailures, engineSuccess, type EngineResult } from "./result";
import type { EngineIssue, EntityRef, JsonObject } from "./types";

export interface TargetSpec {
  minimum: number;
  maximum: number;
  allowSelf?: boolean;
  distinct?: boolean;
  allowedKinds?: readonly string[];
  requiredTags?: readonly string[];
  forbiddenTags?: readonly string[];
}

function validateCount(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function validateTargets(
  actorId: string,
  targets: readonly EntityRef[],
  spec: TargetSpec,
): EngineResult<readonly EntityRef[]> {
  validateCount(spec.minimum, "Target minimum");
  validateCount(spec.maximum, "Target maximum");
  if (spec.maximum < spec.minimum) throw new RangeError("Target maximum cannot be less than minimum.");

  const errors: EngineIssue[] = [];
  if (targets.length < spec.minimum || targets.length > spec.maximum) {
    errors.push({
      code: "TARGET_COUNT",
      message: `Expected between ${spec.minimum} and ${spec.maximum} targets; received ${targets.length}.`,
      details: { minimum: spec.minimum, maximum: spec.maximum, actual: targets.length } as JsonObject,
    });
  }

  const seen = new Set<string>();
  for (const target of targets) {
    if (!target.id.trim()) {
      errors.push({ code: "INVALID_TARGET", message: "Target id cannot be empty." });
      continue;
    }
    if (spec.allowSelf === false && target.id === actorId) {
      errors.push({ code: "SELF_TARGET_NOT_ALLOWED", message: "This action cannot target its actor." });
    }
    if (spec.distinct !== false && seen.has(target.id)) {
      errors.push({ code: "DUPLICATE_TARGET", message: `Target ${target.id} was selected more than once.` });
    }
    seen.add(target.id);

    if (spec.allowedKinds && (!target.kind || !spec.allowedKinds.includes(target.kind))) {
      errors.push({
        code: "TARGET_KIND_NOT_ALLOWED",
        message: `Target ${target.id} is not an allowed kind.`,
      });
    }

    const tags = new Set(target.tags ?? []);
    for (const tag of spec.requiredTags ?? []) {
      if (!tags.has(tag)) {
        errors.push({
          code: "TARGET_MISSING_TAG",
          message: `Target ${target.id} is missing required tag ${tag}.`,
        });
      }
    }
    for (const tag of spec.forbiddenTags ?? []) {
      if (tags.has(tag)) {
        errors.push({
          code: "TARGET_FORBIDDEN_TAG",
          message: `Target ${target.id} has forbidden tag ${tag}.`,
        });
      }
    }
  }

  return errors.length > 0 ? engineFailures(errors) : engineSuccess([...targets]);
}
