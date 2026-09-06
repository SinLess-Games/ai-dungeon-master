export type ResourceBoundaryMode = "clamp" | "reject";

export interface ResourceState {
  current: number;
  minimum: number;
  maximum: number;
}

export interface ResourceChange {
  before: ResourceState;
  after: ResourceState;
  requestedDelta: number;
  appliedDelta: number;
  clamped: boolean;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite.`);
  }
}

export function createResource(
  current: number,
  minimum: number,
  maximum: number,
): ResourceState {
  assertFinite(current, "Resource current");
  assertFinite(minimum, "Resource minimum");
  assertFinite(maximum, "Resource maximum");

  if (maximum < minimum) {
    throw new RangeError("Resource maximum must be greater than or equal to minimum.");
  }

  if (current < minimum || current > maximum) {
    throw new RangeError("Resource current must be within its minimum and maximum bounds.");
  }

  return { current, minimum, maximum };
}

export function adjustResource(
  state: ResourceState,
  delta: number,
  mode: ResourceBoundaryMode = "clamp",
): ResourceChange {
  const before = createResource(state.current, state.minimum, state.maximum);
  assertFinite(delta, "Resource delta");

  const requested = before.current + delta;

  if (mode === "reject" && (requested < before.minimum || requested > before.maximum)) {
    throw new RangeError("Resource adjustment would exceed its configured bounds.");
  }

  const nextCurrent = Math.min(before.maximum, Math.max(before.minimum, requested));
  const after = createResource(nextCurrent, before.minimum, before.maximum);

  return {
    before,
    after,
    requestedDelta: delta,
    appliedDelta: after.current - before.current,
    clamped: after.current !== requested,
  };
}

export function spendResource(
  state: ResourceState,
  amount: number,
  mode: ResourceBoundaryMode = "reject",
): ResourceChange {
  assertFinite(amount, "Resource spend amount");

  if (amount < 0) {
    throw new RangeError("Resource spend amount cannot be negative.");
  }

  return adjustResource(state, -amount, mode);
}

export function restoreResource(
  state: ResourceState,
  amount: number,
  mode: ResourceBoundaryMode = "clamp",
): ResourceChange {
  assertFinite(amount, "Resource restore amount");

  if (amount < 0) {
    throw new RangeError("Resource restore amount cannot be negative.");
  }

  return adjustResource(state, amount, mode);
}

export function setResourceCurrent(
  state: ResourceState,
  current: number,
  mode: ResourceBoundaryMode = "reject",
): ResourceChange {
  assertFinite(current, "Resource current");
  return adjustResource(state, current - state.current, mode);
}
