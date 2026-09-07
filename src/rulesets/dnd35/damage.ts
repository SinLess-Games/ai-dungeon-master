import { rollDice, type DiceRollResult, type RandomSource } from "@/engine";

export interface DamageComponent {
  id: string;
  source: string;
  dice?: string;
  flat?: number;
  /** Weapon/base damage and normal static bonuses are typically multiplied. Extra dice usually are not. */
  criticalEligible?: boolean;
}

export interface DamageComponentResult {
  id: string;
  source: string;
  criticalEligible: boolean;
  repetitions: number;
  rolls: readonly DiceRollResult[];
  flatPerRepetition: number;
  total: number;
}

export interface DamageResolution {
  criticalMultiplier: number;
  components: readonly DamageComponentResult[];
  total: number;
}

export function resolveDamage(input: {
  components: readonly DamageComponent[];
  criticalMultiplier?: number;
  random?: RandomSource;
}): DamageResolution {
  const criticalMultiplier = input.criticalMultiplier ?? 1;
  if (!Number.isSafeInteger(criticalMultiplier) || criticalMultiplier < 1) {
    throw new RangeError("Critical multiplier must be a positive safe integer.");
  }

  const seen = new Set<string>();
  const components: DamageComponentResult[] = [];

  for (const component of input.components) {
    if (!component.id.trim()) throw new RangeError("Damage component id cannot be empty.");
    if (!component.source.trim()) throw new RangeError("Damage component source cannot be empty.");
    if (seen.has(component.id)) throw new Error(`Duplicate damage component id: ${component.id}`);
    seen.add(component.id);

    const flat = component.flat ?? 0;
    if (!Number.isFinite(flat)) throw new RangeError("Damage flat bonus must be finite.");
    if (component.dice === undefined && component.flat === undefined) {
      throw new RangeError("Damage component must provide dice, flat damage, or both.");
    }

    const criticalEligible = component.criticalEligible ?? true;
    const repetitions = criticalEligible ? criticalMultiplier : 1;
    const rolls: DiceRollResult[] = [];
    let total = 0;

    for (let index = 0; index < repetitions; index += 1) {
      if (component.dice !== undefined) {
        const roll = rollDice(
          component.dice,
          input.random === undefined ? {} : { random: input.random },
        );
        rolls.push(roll);
        total += roll.total;
      }
      total += flat;
    }

    components.push({
      id: component.id,
      source: component.source,
      criticalEligible,
      repetitions,
      rolls,
      flatPerRepetition: flat,
      total,
    });
  }

  return {
    criticalMultiplier,
    components,
    total: components.reduce((sum, component) => sum + component.total, 0),
  };
}
