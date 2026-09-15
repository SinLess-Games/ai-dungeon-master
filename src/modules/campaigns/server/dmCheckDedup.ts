import type { DmTurnDecision } from "./dmToolPlanner";

type CheckDecision = Extract<DmTurnDecision, { kind: "check" }>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapResult(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) return null;
  const nested = asRecord(record["value"]);
  return nested ?? record;
}

function sameSpecialization(requested: string | undefined, resolved: unknown): boolean {
  if (typeof resolved !== "string") return true;
  return resolved === (requested ?? "");
}

/**
 * Returns true when the planner asks the player to repeat a check that already
 * has an authoritative result in the current continuation. A resolved check is
 * final: the DM may continue narration or request a different check, but it may
 * not ask for another roll of the same skill/save just because the turn was
 * replanned after the first roll.
 */
export function isRepeatedAuthoritativeCheck(
  decision: DmTurnDecision,
  authoritativeResults: readonly unknown[],
): decision is CheckDecision {
  if (decision.kind !== "check") return false;

  return authoritativeResults.some((value) => {
    const result = unwrapResult(value);
    if (!result) return false;

    if (decision.check.type === "check.skill") {
      return (
        result["allowed"] !== false &&
        result["skillId"] === decision.check.skillId &&
        sameSpecialization(decision.check.specialization, result["specialization"])
      );
    }

    return result["save"] === decision.check.save;
  });
}
