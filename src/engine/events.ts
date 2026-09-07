import { engineFailure, engineSuccess, type EngineResult } from "./result";
import type { StateDelta } from "./effects";
import type { JsonObject } from "./types";

export interface EngineEvent<Payload extends JsonObject = JsonObject> {
  id: string;
  type: string;
  sequence: number;
  occurredAt: number;
  actorId: string | null;
  sourceId: string | null;
  targetIds: readonly string[];
  payload: Payload;
  deltas: readonly StateDelta[];
}

export interface EngineEventInput<Payload extends JsonObject = JsonObject> {
  id: string;
  type: string;
  occurredAt: number;
  actorId?: string | null;
  sourceId?: string | null;
  targetIds?: readonly string[];
  payload: Payload;
  deltas?: readonly StateDelta[];
}

export function appendEvent<Payload extends JsonObject>(
  log: readonly EngineEvent[],
  input: EngineEventInput<Payload>,
): EngineResult<readonly EngineEvent[]> {
  if (!input.id.trim()) throw new RangeError("Event id cannot be empty.");
  if (!input.type.trim()) throw new RangeError("Event type cannot be empty.");
  if (!Number.isFinite(input.occurredAt)) throw new RangeError("Event occurredAt must be finite.");
  if (log.some((event) => event.id === input.id)) {
    return engineFailure("DUPLICATE_EVENT", `Duplicate event id: ${input.id}`);
  }

  const sequence = (log.at(-1)?.sequence ?? 0) + 1;
  const event: EngineEvent<Payload> = {
    id: input.id,
    type: input.type,
    sequence,
    occurredAt: input.occurredAt,
    actorId: input.actorId ?? null,
    sourceId: input.sourceId ?? null,
    targetIds: [...(input.targetIds ?? [])],
    payload: input.payload,
    deltas: [...(input.deltas ?? [])],
  };

  return engineSuccess([...log, event]);
}

export function validateEventLog(log: readonly EngineEvent[]): EngineResult<void> {
  const ids = new Set<string>();
  for (let index = 0; index < log.length; index += 1) {
    const event = log[index];
    if (!event) continue;
    if (ids.has(event.id)) return engineFailure("DUPLICATE_EVENT", `Duplicate event id: ${event.id}`);
    ids.add(event.id);
    const expected = index + 1;
    if (event.sequence !== expected) {
      return engineFailure("EVENT_SEQUENCE", `Expected event sequence ${expected}, received ${event.sequence}.`);
    }
  }
  return engineSuccess(undefined);
}

export function replayEvents<State>(
  initialState: State,
  log: readonly EngineEvent[],
  reducer: (state: State, event: EngineEvent) => State,
): EngineResult<State> {
  const valid = validateEventLog(log);
  if (!valid.ok) return valid;

  let state = initialState;
  try {
    for (const event of log) state = reducer(state, event);
  } catch (error) {
    return engineFailure(
      "EVENT_REPLAY_FAILED",
      error instanceof Error ? error.message : "Event replay failed.",
    );
  }
  return engineSuccess(state);
}
