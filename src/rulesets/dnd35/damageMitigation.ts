import { engineSuccess, type EngineResult } from "@engine/result";

export type Dnd35DamageType =
  | "bludgeoning"
  | "piercing"
  | "slashing"
  | "acid"
  | "cold"
  | "electricity"
  | "fire"
  | "sonic"
  | "force"
  | "positive_energy"
  | "negative_energy"
  | "untyped";

export interface TypedDamageAmount {
  id: string;
  type: Dnd35DamageType;
  amount: number;
  nonlethal?: boolean;
  bypassesDamageReduction?: boolean;
}

export interface DamageReductionRule {
  amount: number;
  bypassedBy?: readonly string[];
}

export interface DamageMitigationInput {
  damage: readonly TypedDamageAmount[];
  energyResistances?: Partial<Record<Dnd35DamageType, number>>;
  immunities?: readonly Dnd35DamageType[];
  damageReduction?: DamageReductionRule;
  attackQualities?: readonly string[];
}

export interface MitigatedDamageComponent extends TypedDamageAmount {
  resisted: number;
  reducedByDamageReduction: number;
  finalAmount: number;
}

export interface DamageMitigationResult {
  components: readonly MitigatedDamageComponent[];
  totalIncoming: number;
  totalPrevented: number;
  totalApplied: number;
  lethalApplied: number;
  nonlethalApplied: number;
}

const PHYSICAL = new Set<Dnd35DamageType>(["bludgeoning", "piercing", "slashing"]);

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

function damageReductionApplies(
  component: TypedDamageAmount,
  rule: DamageReductionRule | undefined,
  attackQualities: readonly string[],
): boolean {
  if (!rule || !PHYSICAL.has(component.type) || component.bypassesDamageReduction) return false;
  if (!rule.bypassedBy || rule.bypassedBy.length === 0) return true;
  return !rule.bypassedBy.some((quality) => attackQualities.includes(quality));
}

/**
 * Resolve common resistance/immunity/DR layers. Damage reduction is applied to
 * the physical damage packet once, not once per physical damage type.
 */
export function mitigateDamage(input: DamageMitigationInput): EngineResult<DamageMitigationResult> {
  const immunities = new Set(input.immunities ?? []);
  const attackQualities = input.attackQualities ?? [];
  const dr = input.damageReduction;
  if (dr) assertNonNegativeInteger(dr.amount, "Damage reduction");

  let remainingDr = dr?.amount ?? 0;
  const components: MitigatedDamageComponent[] = [];

  for (const component of input.damage) {
    if (!component.id.trim()) throw new RangeError("Damage component id cannot be empty.");
    assertNonNegativeInteger(component.amount, "Damage amount");

    let resisted = 0;
    if (immunities.has(component.type)) {
      resisted = component.amount;
    } else {
      const resistance = input.energyResistances?.[component.type] ?? 0;
      assertNonNegativeInteger(resistance, `${component.type} resistance`);
      resisted = Math.min(component.amount, resistance);
    }

    const afterResistance = component.amount - resisted;
    let reducedByDamageReduction = 0;
    if (remainingDr > 0 && damageReductionApplies(component, dr, attackQualities)) {
      reducedByDamageReduction = Math.min(afterResistance, remainingDr);
      remainingDr -= reducedByDamageReduction;
    }

    const finalAmount = afterResistance - reducedByDamageReduction;
    components.push({
      ...component,
      resisted,
      reducedByDamageReduction,
      finalAmount,
    });
  }

  const totalIncoming = components.reduce((sum, component) => sum + component.amount, 0);
  const totalApplied = components.reduce((sum, component) => sum + component.finalAmount, 0);
  const nonlethalApplied = components.reduce(
    (sum, component) => sum + (component.nonlethal ? component.finalAmount : 0),
    0,
  );

  return engineSuccess({
    components,
    totalIncoming,
    totalPrevented: totalIncoming - totalApplied,
    totalApplied,
    lethalApplied: totalApplied - nonlethalApplied,
    nonlethalApplied,
  });
}
