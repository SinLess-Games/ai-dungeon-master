export type Duration =
  | { kind: "permanent" }
  | { kind: "turns"; remaining: number }
  | { kind: "rounds"; remaining: number }
  | { kind: "elapsed"; remainingMs: number };

export type TimeStep =
  | { kind: "turn"; amount?: number }
  | { kind: "round"; amount?: number }
  | { kind: "elapsed"; milliseconds: number };

export interface DurationAdvance {
  before: Duration;
  after: Duration;
  expired: boolean;
  changed: boolean;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer.`);
}

export function validateDuration(duration: Duration): Duration {
  if (duration.kind === "permanent") return duration;
  if (duration.kind === "elapsed") {
    assertNonNegativeInteger(duration.remainingMs, "Duration milliseconds");
    return duration;
  }
  assertNonNegativeInteger(duration.remaining, "Duration remaining");
  return duration;
}

export function advanceDuration(duration: Duration, step: TimeStep): DurationAdvance {
  validateDuration(duration);
  if (duration.kind === "permanent") {
    return { before: duration, after: duration, expired: false, changed: false };
  }

  if (duration.kind === "elapsed") {
    if (step.kind !== "elapsed") return { before: duration, after: duration, expired: false, changed: false };
    assertNonNegativeInteger(step.milliseconds, "Elapsed milliseconds");
    const after: Duration = { kind: "elapsed", remainingMs: Math.max(0, duration.remainingMs - step.milliseconds) };
    return { before: duration, after, expired: after.remainingMs === 0, changed: after.remainingMs !== duration.remainingMs };
  }

  const expectedStep = duration.kind === "turns" ? "turn" : "round";
  if (step.kind !== expectedStep) return { before: duration, after: duration, expired: false, changed: false };
  const amount = step.amount ?? 1;
  assertNonNegativeInteger(amount, "Time step amount");
  const after: Duration = { kind: duration.kind, remaining: Math.max(0, duration.remaining - amount) };
  return { before: duration, after, expired: after.remaining === 0, changed: after.remaining !== duration.remaining };
}
