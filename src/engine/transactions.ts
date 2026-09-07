import type { EngineEvent } from "./events";
import { engineFailure, engineSuccess, type EngineResult } from "./result";

export interface TransactionStepResult<State, Output = unknown> {
  state: State;
  output?: Output;
  events?: readonly EngineEvent[];
}

export interface TransactionStep<State, Output = unknown> {
  id: string;
  execute(state: Readonly<State>): EngineResult<TransactionStepResult<State, Output>>;
}

export interface TransactionRecord<Output = unknown> {
  stepId: string;
  output?: Output;
}

export interface TransactionResult<State> {
  state: State;
  records: readonly TransactionRecord[];
  events: readonly EngineEvent[];
}

/**
 * Run a pure in-memory engine transaction.
 *
 * Each step receives the previous step's state and must return a new state.
 * If any step fails, no final state is returned, so callers can keep the
 * original state unchanged. Database transactionality remains the
 * responsibility of the persistence layer.
 */
export function runTransaction<State>(
  initialState: State,
  steps: readonly TransactionStep<State>[],
): EngineResult<TransactionResult<State>> {
  const ids = new Set<string>();
  let state = initialState;
  const records: TransactionRecord[] = [];
  const events: EngineEvent[] = [];

  for (const step of steps) {
    if (!step.id.trim()) throw new RangeError("Transaction step id cannot be empty.");
    if (ids.has(step.id)) return engineFailure("DUPLICATE_TRANSACTION_STEP", `Duplicate transaction step id: ${step.id}`);
    ids.add(step.id);

    let result: EngineResult<TransactionStepResult<State>>;
    try {
      result = step.execute(state);
    } catch (error) {
      return engineFailure(
        "TRANSACTION_STEP_THROWN",
        error instanceof Error ? error.message : `Transaction step ${step.id} threw an error.`,
        { details: { stepId: step.id } },
      );
    }

    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors.map((error) => ({
          ...error,
          details: { ...(error.details ?? {}), stepId: step.id },
        })),
      };
    }

    state = result.value.state;
    records.push({
      stepId: step.id,
      ...(result.value.output !== undefined ? { output: result.value.output } : {}),
    });
    if (result.value.events) events.push(...result.value.events);
  }

  return engineSuccess({ state, records, events });
}
