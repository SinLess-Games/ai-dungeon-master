import { engineFailure, engineSuccess, type EngineResult } from "./result";
import { assertEngineId, isJsonObject, type JsonObject, type JsonValue } from "./types";

export interface SnapshotValue {
  exists: boolean;
  value: JsonValue;
}

export interface StateDelta {
  id: string;
  entityId: string;
  path: readonly string[];
  before: SnapshotValue;
  after: SnapshotValue;
  sourceId?: string;
  reason?: string;
}

export type EngineState = Readonly<Record<string, JsonObject>>;
export type DeltaApplyMode = "verify" | "force";

export interface EffectDescriptor<Payload extends JsonObject = JsonObject> {
  id: string;
  type: string;
  sourceId: string | null;
  targetIds: readonly string[];
  payload: Payload;
}

export type EffectHandler = (
  effect: EffectDescriptor,
  state: EngineState,
) => EngineResult<readonly StateDelta[]>;

export interface EffectResolution {
  state: EngineState;
  deltas: readonly StateDelta[];
}

export function existingValue(value: JsonValue): SnapshotValue {
  return { exists: true, value };
}

export function missingValue(): SnapshotValue {
  return { exists: false, value: null };
}

function deepEqual(left: JsonValue, right: JsonValue): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => {
      const other = right[index];
      return other !== undefined && deepEqual(value, other);
    });
  }
  if (isJsonObject(left) && isJsonObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => key in right && deepEqual(left[key] ?? null, right[key] ?? null));
  }
  return false;
}

function readPath(entity: JsonObject | undefined, path: readonly string[]): SnapshotValue {
  if (!entity) return missingValue();
  if (path.length === 0) return existingValue(entity);

  let current: JsonValue = entity;
  for (const segment of path) {
    if (!isJsonObject(current) || !(segment in current)) return missingValue();
    current = current[segment] ?? null;
  }
  return existingValue(current);
}

function snapshotsEqual(left: SnapshotValue, right: SnapshotValue): boolean {
  return left.exists === right.exists && (!left.exists || deepEqual(left.value, right.value));
}

function writeNested(current: JsonObject, path: readonly string[], snapshot: SnapshotValue): JsonObject {
  const [head, ...tail] = path;
  if (!head) return current;
  const clone: Record<string, JsonValue> = { ...current };

  if (tail.length === 0) {
    if (snapshot.exists) clone[head] = snapshot.value;
    else delete clone[head];
    return clone;
  }

  const child = current[head];
  const childObject = child !== undefined && isJsonObject(child) ? child : {};
  clone[head] = writeNested(childObject, tail, snapshot);
  return clone;
}

export function createStateDelta(
  state: EngineState,
  input: {
    id: string;
    entityId: string;
    path?: readonly string[];
    after: SnapshotValue;
    sourceId?: string;
    reason?: string;
  },
): StateDelta {
  assertEngineId(input.id, "Delta id");
  assertEngineId(input.entityId, "Delta entity id");
  const path = input.path ?? [];
  const before = readPath(state[input.entityId], path);

  if (path.length === 0 && input.after.exists && !isJsonObject(input.after.value)) {
    throw new TypeError("A root entity delta must contain a JSON object.");
  }

  return {
    id: input.id,
    entityId: input.entityId,
    path: [...path],
    before,
    after: input.after,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  };
}

export function applyStateDelta(
  state: EngineState,
  delta: StateDelta,
  mode: DeltaApplyMode = "verify",
): EngineResult<EngineState> {
  const current = readPath(state[delta.entityId], delta.path);
  if (mode === "verify" && !snapshotsEqual(current, delta.before)) {
    return engineFailure("DELTA_CONFLICT", `State changed before delta ${delta.id} could be applied.`, {
      path: `${delta.entityId}.${delta.path.join(".")}`.replace(/\.$/, ""),
    });
  }

  const next: Record<string, JsonObject> = { ...state };
  if (delta.path.length === 0) {
    if (!delta.after.exists) {
      delete next[delta.entityId];
    } else if (isJsonObject(delta.after.value)) {
      next[delta.entityId] = delta.after.value;
    } else {
      return engineFailure("INVALID_ROOT_DELTA", "Root entity deltas must contain a JSON object.");
    }
    return engineSuccess(next);
  }

  const entity = state[delta.entityId];
  if (!entity) {
    return engineFailure("ENTITY_NOT_FOUND", `Entity ${delta.entityId} does not exist.`);
  }
  next[delta.entityId] = writeNested(entity, delta.path, delta.after);
  return engineSuccess(next);
}

export function applyStateDeltas(
  state: EngineState,
  deltas: readonly StateDelta[],
  mode: DeltaApplyMode = "verify",
): EngineResult<EngineState> {
  let current: EngineState = state;
  const seen = new Set<string>();

  for (const delta of deltas) {
    if (seen.has(delta.id)) return engineFailure("DUPLICATE_DELTA", `Duplicate delta id: ${delta.id}`);
    seen.add(delta.id);
    const applied = applyStateDelta(current, delta, mode);
    if (!applied.ok) return applied;
    current = applied.value;
  }

  return engineSuccess(current);
}

export function reverseStateDelta(delta: StateDelta): StateDelta {
  return { ...delta, before: delta.after, after: delta.before };
}

export function reverseStateDeltas(deltas: readonly StateDelta[]): readonly StateDelta[] {
  return [...deltas].reverse().map(reverseStateDelta);
}

export function resolveEffectBatch(
  state: EngineState,
  effects: readonly EffectDescriptor[],
  handlers: Readonly<Record<string, EffectHandler>>,
): EngineResult<EffectResolution> {
  let current = state;
  const allDeltas: StateDelta[] = [];
  const effectIds = new Set<string>();
  const deltaIds = new Set<string>();

  for (const effect of effects) {
    if (!effect.id.trim()) throw new RangeError("Effect id cannot be empty.");
    if (!effect.type.trim()) throw new RangeError("Effect type cannot be empty.");
    if (effectIds.has(effect.id)) return engineFailure("DUPLICATE_EFFECT", `Duplicate effect id: ${effect.id}`);
    effectIds.add(effect.id);

    const handler = handlers[effect.type];
    if (!handler) return engineFailure("EFFECT_HANDLER_NOT_FOUND", `No effect handler is registered for ${effect.type}.`);
    const resolved = handler(effect, current);
    if (!resolved.ok) return resolved;

    for (const delta of resolved.value) {
      if (deltaIds.has(delta.id)) return engineFailure("DUPLICATE_DELTA", `Duplicate delta id: ${delta.id}`);
      deltaIds.add(delta.id);
    }

    const applied = applyStateDeltas(current, resolved.value);
    if (!applied.ok) return applied;
    current = applied.value;
    allDeltas.push(...resolved.value);
  }

  return engineSuccess({ state: current, deltas: allDeltas });
}
