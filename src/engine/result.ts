import type { EngineIssue, JsonObject } from "./types";

export type EngineResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: readonly EngineIssue[];
    };

export function engineSuccess<T>(value: T): EngineResult<T> {
  return { ok: true, value };
}

export function engineFailure(
  code: string,
  message: string,
  options: { path?: string; details?: JsonObject } = {},
): EngineResult<never> {
  return {
    ok: false,
    errors: [
      {
        code,
        message,
        ...(options.path ? { path: options.path } : {}),
        ...(options.details ? { details: options.details } : {}),
      },
    ],
  };
}

export function engineFailures(errors: readonly EngineIssue[]): EngineResult<never> {
  if (errors.length === 0) {
    throw new RangeError("engineFailures requires at least one error.");
  }
  return { ok: false, errors: [...errors] };
}

export function combineEngineResults<T>(results: readonly EngineResult<T>[]): EngineResult<readonly T[]> {
  const errors = results.flatMap((result) => (result.ok ? [] : result.errors));
  if (errors.length > 0) return engineFailures(errors);
  return engineSuccess(results.flatMap((result) => (result.ok ? [result.value] : [])));
}
