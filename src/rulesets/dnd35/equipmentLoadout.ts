import type { ArmorClassModifier } from "./combat";
import { armorAdjustedSpeed, type RuntimeArmor } from "./equipment";

export interface RuntimeShield {
  id: string;
  name?: string;
  acBonus: number;
  maxDexBonus: number | null;
  armorCheckPenalty: number;
  arcaneSpellFailurePercent: number;
  speedAt30Feet: number | null;
  speedAt20Feet: number | null;
  enhancementBonus?: number;
}

export interface DefensiveLoadout {
  armor?: RuntimeArmor | null;
  shield?: RuntimeShield | null;
}

export interface DefensiveLoadoutResolution {
  armorClassModifiers: readonly ArmorClassModifier[];
  maximumDexterityBonus: number | null;
  armorCheckPenalty: number;
  arcaneSpellFailurePercent: number;
  adjustedSpeedFeet: number;
}

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative and finite.`);
}

function validateShield(shield: RuntimeShield): void {
  if (!shield.id.trim()) throw new RangeError("Shield id cannot be empty.");
  assertNonNegative(shield.acBonus, "Shield AC bonus");
  if (shield.maxDexBonus !== null) assertNonNegative(shield.maxDexBonus, "Shield maximum Dexterity bonus");
  if (!Number.isFinite(shield.armorCheckPenalty) || shield.armorCheckPenalty > 0) {
    throw new RangeError("Shield armor check penalty must be zero or negative.");
  }
  if (
    !Number.isFinite(shield.arcaneSpellFailurePercent) ||
    shield.arcaneSpellFailurePercent < 0 ||
    shield.arcaneSpellFailurePercent > 100
  ) {
    throw new RangeError("Shield arcane spell failure must be between 0 and 100.");
  }
  const enhancement = shield.enhancementBonus ?? 0;
  assertNonNegative(enhancement, "Shield enhancement bonus");
}

function minimumNullable(values: readonly (number | null | undefined)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && value !== undefined);
  return finite.length === 0 ? null : Math.min(...finite);
}

export function resolveDefensiveLoadout(
  baseSpeedFeet: number,
  loadout: DefensiveLoadout,
): DefensiveLoadoutResolution {
  assertNonNegative(baseSpeedFeet, "Base speed");
  const armor = loadout.armor ?? null;
  const shield = loadout.shield ?? null;
  if (shield) validateShield(shield);

  const armorClassModifiers: ArmorClassModifier[] = [];
  if (armor) {
    const enhancement = armor.enhancementBonus ?? 0;
    armorClassModifiers.push({
      id: `armor:${armor.id}`,
      source: armor.name?.trim() || armor.id,
      kind: "armor",
      value: armor.acBonus + enhancement,
    });
  }
  if (shield) {
    armorClassModifiers.push({
      id: `shield:${shield.id}`,
      source: shield.name?.trim() || shield.id,
      kind: "shield",
      value: shield.acBonus + (shield.enhancementBonus ?? 0),
    });
  }

  let adjustedSpeedFeet = baseSpeedFeet;
  if (armor) adjustedSpeedFeet = armorAdjustedSpeed(adjustedSpeedFeet, armor);
  if (shield) {
    if (adjustedSpeedFeet === 30 && shield.speedAt30Feet !== null) adjustedSpeedFeet = shield.speedAt30Feet;
    else if (adjustedSpeedFeet === 20 && shield.speedAt20Feet !== null) adjustedSpeedFeet = shield.speedAt20Feet;
  }

  return {
    armorClassModifiers,
    maximumDexterityBonus: minimumNullable([armor?.maxDexBonus, shield?.maxDexBonus]),
    armorCheckPenalty: (armor?.armorCheckPenalty ?? 0) + (shield?.armorCheckPenalty ?? 0),
    arcaneSpellFailurePercent: Math.min(
      100,
      (armor?.arcaneSpellFailurePercent ?? 0) + (shield?.arcaneSpellFailurePercent ?? 0),
    ),
    adjustedSpeedFeet,
  };
}
