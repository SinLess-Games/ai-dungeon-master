export type FactOperator =
  | "exists"
  | "equals"
  | "not-equals"
  | "greater-than"
  | "greater-than-or-equal"
  | "less-than"
  | "less-than-or-equal"
  | "includes";

export type Prerequisite =
  | {
      kind: "all";
      requirements: readonly Prerequisite[];
    }
  | {
      kind: "any";
      requirements: readonly Prerequisite[];
    }
  | {
      kind: "not";
      requirement: Prerequisite;
    }
  | {
      kind: "fact";
      key: string;
      operator: FactOperator;
      value?: unknown;
      message?: string;
    }
  | {
      kind: "predicate";
      id: string;
      args?: Readonly<Record<string, unknown>>;
      message?: string;
    };

export interface PrerequisiteContext {
  getFact(key: string): unknown;
  evaluatePredicate?(
    id: string,
    args: Readonly<Record<string, unknown>> | undefined,
  ): boolean;
}

export interface PrerequisiteFailure {
  path: string;
  message: string;
  requirement: Prerequisite;
}

export interface PrerequisiteEvaluation {
  passed: boolean;
  failures: readonly PrerequisiteFailure[];
}

function compareNumbers(
  actual: unknown,
  expected: unknown,
  operator:
    | "greater-than"
    | "greater-than-or-equal"
    | "less-than"
    | "less-than-or-equal",
): boolean {
  if (typeof actual !== "number" || typeof expected !== "number") {
    return false;
  }

  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    return false;
  }

  switch (operator) {
    case "greater-than":
      return actual > expected;
    case "greater-than-or-equal":
      return actual >= expected;
    case "less-than":
      return actual < expected;
    case "less-than-or-equal":
      return actual <= expected;
  }
}

function includesValue(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "string" && typeof expected === "string") {
    return actual.includes(expected);
  }

  if (Array.isArray(actual)) {
    return actual.some((value) => Object.is(value, expected));
  }

  if (actual instanceof Set) {
    return actual.has(expected);
  }

  return false;
}

function evaluateFact(
  requirement: Extract<Prerequisite, { kind: "fact" }>,
  context: PrerequisiteContext,
): boolean {
  const actual = context.getFact(requirement.key);
  const expected = requirement.value;

  switch (requirement.operator) {
    case "exists":
      return actual !== undefined && actual !== null;
    case "equals":
      return Object.is(actual, expected);
    case "not-equals":
      return !Object.is(actual, expected);
    case "greater-than":
    case "greater-than-or-equal":
    case "less-than":
    case "less-than-or-equal":
      return compareNumbers(actual, expected, requirement.operator);
    case "includes":
      return includesValue(actual, expected);
  }
}

function defaultFailureMessage(requirement: Prerequisite): string {
  switch (requirement.kind) {
    case "all":
      return "All prerequisites must be satisfied.";
    case "any":
      return "At least one prerequisite must be satisfied.";
    case "not":
      return "The excluded prerequisite must not be satisfied.";
    case "fact":
      return `Fact prerequisite failed: ${requirement.key}.`;
    case "predicate":
      return `Predicate prerequisite failed: ${requirement.id}.`;
  }
}

function evaluateInternal(
  requirement: Prerequisite,
  context: PrerequisiteContext,
  path: string,
): PrerequisiteEvaluation {
  if (requirement.kind === "all") {
    const failures = requirement.requirements.flatMap((child, index) => {
      const evaluation = evaluateInternal(child, context, `${path}.all[${index}]`);
      return evaluation.failures;
    });

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  if (requirement.kind === "any") {
    if (requirement.requirements.length === 0) {
      return {
        passed: false,
        failures: [
          {
            path,
            message: defaultFailureMessage(requirement),
            requirement,
          },
        ],
      };
    }

    const evaluations = requirement.requirements.map((child, index) =>
      evaluateInternal(child, context, `${path}.any[${index}]`),
    );

    if (evaluations.some((evaluation) => evaluation.passed)) {
      return { passed: true, failures: [] };
    }

    return {
      passed: false,
      failures: evaluations.flatMap((evaluation) => evaluation.failures),
    };
  }

  if (requirement.kind === "not") {
    const nested = evaluateInternal(requirement.requirement, context, `${path}.not`);

    if (!nested.passed) {
      return { passed: true, failures: [] };
    }

    return {
      passed: false,
      failures: [
        {
          path,
          message: defaultFailureMessage(requirement),
          requirement,
        },
      ],
    };
  }

  if (requirement.kind === "fact") {
    const passed = evaluateFact(requirement, context);

    return passed
      ? { passed: true, failures: [] }
      : {
          passed: false,
          failures: [
            {
              path,
              message: requirement.message ?? defaultFailureMessage(requirement),
              requirement,
            },
          ],
        };
  }

  const evaluator = context.evaluatePredicate;
  const passed = evaluator ? evaluator(requirement.id, requirement.args) : false;

  return passed
    ? { passed: true, failures: [] }
    : {
        passed: false,
        failures: [
          {
            path,
            message: requirement.message ?? defaultFailureMessage(requirement),
            requirement,
          },
        ],
      };
}

/**
 * Evaluate a serializable prerequisite tree against facts supplied by the
 * caller. Rulesets decide which fact keys and custom predicates exist.
 */
export function evaluatePrerequisite(
  requirement: Prerequisite,
  context: PrerequisiteContext,
): PrerequisiteEvaluation {
  return evaluateInternal(requirement, context, "root");
}
