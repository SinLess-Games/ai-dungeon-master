import { engineFailure, engineSuccess, type EngineResult } from "@engine/result";
import { healthStateForHitPoints, type Dnd35HealthState } from "./health";

export type Dnd35ConsciousnessState =
  | "conscious"
  | "staggered"
  | "unconscious"
  | "disabled"
  | "dying"
  | "dead";

export interface Dnd35HealthPool {
  maximumHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
  stable: boolean;
}

export interface DamageApplication {
  before: Dnd35HealthPool;
  after: Dnd35HealthPool;
  incomingDamage: number;
  absorbedByTemporaryHitPoints: number;
  hitPointDamage: number;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function validateHealthPool(pool: Dnd35HealthPool): Dnd35HealthPool {
  if (!Number.isSafeInteger(pool.maximumHitPoints) || pool.maximumHitPoints < 1) {
    throw new RangeError("Maximum hit points must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(pool.currentHitPoints) || pool.currentHitPoints > pool.maximumHitPoints) {
    throw new RangeError("Current hit points must be a safe integer no greater than maximum hit points.");
  }
  assertNonNegativeInteger(pool.temporaryHitPoints, "Temporary hit points");
  assertNonNegativeInteger(pool.nonlethalDamage, "Nonlethal damage");
  return pool;
}

export function consciousnessState(pool: Dnd35HealthPool): Dnd35ConsciousnessState {
  validateHealthPool(pool);
  const hpState: Dnd35HealthState = healthStateForHitPoints(pool.currentHitPoints);
  if (hpState === "dead") return "dead";
  if (hpState === "dying") return "dying";
  if (hpState === "disabled") return "disabled";
  if (pool.nonlethalDamage > pool.currentHitPoints) return "unconscious";
  if (pool.nonlethalDamage === pool.currentHitPoints && pool.nonlethalDamage > 0) return "staggered";
  return "conscious";
}

export function applyLethalDamage(
  pool: Dnd35HealthPool,
  damage: number,
): DamageApplication {
  validateHealthPool(pool);
  assertNonNegativeInteger(damage, "Lethal damage");
  const absorbedByTemporaryHitPoints = Math.min(pool.temporaryHitPoints, damage);
  const hitPointDamage = damage - absorbedByTemporaryHitPoints;
  const after: Dnd35HealthPool = {
    ...pool,
    temporaryHitPoints: pool.temporaryHitPoints - absorbedByTemporaryHitPoints,
    currentHitPoints: pool.currentHitPoints - hitPointDamage,
    stable: hitPointDamage === 0 ? pool.stable : false,
  };
  return {
    before: { ...pool },
    after,
    incomingDamage: damage,
    absorbedByTemporaryHitPoints,
    hitPointDamage,
  };
}

export function applyNonlethalDamage(pool: Dnd35HealthPool, damage: number): Dnd35HealthPool {
  validateHealthPool(pool);
  assertNonNegativeInteger(damage, "Nonlethal damage");
  return { ...pool, nonlethalDamage: pool.nonlethalDamage + damage };
}

/** Magical/positive healing restores HP and removes the same amount of nonlethal damage. */
export function applyHealing(pool: Dnd35HealthPool, healing: number): Dnd35HealthPool {
  validateHealthPool(pool);
  assertNonNegativeInteger(healing, "Healing");
  return {
    ...pool,
    currentHitPoints: Math.min(pool.maximumHitPoints, pool.currentHitPoints + healing),
    nonlethalDamage: Math.max(0, pool.nonlethalDamage - healing),
    stable: pool.currentHitPoints + healing >= 0 ? true : pool.stable,
  };
}

export function grantTemporaryHitPoints(pool: Dnd35HealthPool, amount: number): Dnd35HealthPool {
  validateHealthPool(pool);
  assertNonNegativeInteger(amount, "Temporary hit points");
  // Temporary HP from the same general pool do not stack; keep the higher value.
  return { ...pool, temporaryHitPoints: Math.max(pool.temporaryHitPoints, amount) };
}

/**
 * Core 3.5 dying check: an unstable dying creature has a 10% chance to stabilize;
 * otherwise it loses 1 HP. A caller can bypass this when campaign variants apply.
 */
export function resolveDyingStabilization(
  pool: Dnd35HealthPool,
  percentileRoll: number,
): EngineResult<Dnd35HealthPool> {
  validateHealthPool(pool);
  if (!Number.isSafeInteger(percentileRoll) || percentileRoll < 1 || percentileRoll > 100) {
    throw new RangeError("Stabilization roll must be an integer from 1 through 100.");
  }
  if (healthStateForHitPoints(pool.currentHitPoints) !== "dying") {
    return engineFailure("DND35_NOT_DYING", "Stabilization checks only apply to dying creatures.");
  }
  if (pool.stable) return engineSuccess({ ...pool });
  if (percentileRoll <= 10) return engineSuccess({ ...pool, stable: true });
  return engineSuccess({ ...pool, currentHitPoints: pool.currentHitPoints - 1 });
}
