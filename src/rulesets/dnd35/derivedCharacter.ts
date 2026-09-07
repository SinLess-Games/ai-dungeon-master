import { abilityModifier, effectiveAbilityScore, type EffectiveAbilityScoreInput } from "./abilities";
import {
  aggregateClassProgression,
  hitPointsFromGainedLevels,
  type AggregatedClassProgression,
  type RuntimeClassLevelRow,
} from "./classProgression";
import {
  calculateArmorClass,
  calculateGrappleModifier,
  calculateInitiative,
  type ArmorClassModifier,
  type ArmorClassResult,
} from "./combat";
import type { HitPointCalculation } from "./health";
import type { Dnd35Modifier, Dnd35ModifierResolution } from "./modifiers";
import { effectiveCharacterLevel, type RuntimeRaceDefinition } from "./raceRuntime";
import { calculateSavingThrowBonus, type SavingThrowBonusCalculation } from "./saves";
import type { Dnd35Ability, Dnd35Save } from "./types";

const ABILITIES: readonly Dnd35Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface DerivedAbilityScore {
  score: number;
  modifier: number;
}

export interface DerivedCharacterStats {
  abilities: Record<Dnd35Ability, DerivedAbilityScore>;
  progression: AggregatedClassProgression;
  effectiveCharacterLevel: number;
  armorClass: ArmorClassResult;
  savingThrows: Record<Dnd35Save, SavingThrowBonusCalculation>;
  initiative: Dnd35ModifierResolution;
  grapple: Dnd35ModifierResolution;
  hitPoints: HitPointCalculation;
  landSpeedFeet: number;
}

export interface DerivedCharacterInput {
  abilities: Record<Dnd35Ability, EffectiveAbilityScoreInput>;
  classLevels: readonly RuntimeClassLevelRow[];
  race: RuntimeRaceDefinition;
  gainedHitPoints: readonly number[];
  abilityAdjustments?: Partial<Record<Dnd35Ability, number>>;
  armorClassModifiers?: readonly ArmorClassModifier[];
  maxDexterityBonus?: number | null;
  retainDexterityWhenFlatFooted?: boolean;
  saveModifiers?: Partial<Record<Dnd35Save, readonly Dnd35Modifier[]>>;
  initiativeModifiers?: readonly Dnd35Modifier[];
  grappleModifiers?: readonly Dnd35Modifier[];
  perHitDieHitPointBonus?: number;
}

function deriveAbilities(input: DerivedCharacterInput): Record<Dnd35Ability, DerivedAbilityScore> {
  const result = {} as Record<Dnd35Ability, DerivedAbilityScore>;
  for (const ability of ABILITIES) {
    const base = input.abilities[ability];
    const additionalAdjustment = input.abilityAdjustments?.[ability] ?? 0;
    if (!Number.isSafeInteger(additionalAdjustment)) {
      throw new RangeError(`Additional ${ability.toUpperCase()} adjustment must be a safe integer.`);
    }
    const score = effectiveAbilityScore({
      ...base,
      temporaryAdjustment: (base.temporaryAdjustment ?? 0) + additionalAdjustment,
    });
    if (score === null) {
      throw new Error(
        `Derived player-character statistics require a numeric ${ability.toUpperCase()} score; nonability semantics must use a specialized creature adapter.`,
      );
    }
    result[ability] = { score, modifier: abilityModifier(score) };
  }
  return result;
}

/**
 * Assemble the commonly displayed derived character sheet values from pure
 * runtime inputs. Persistence/repositories remain responsible for collecting
 * the rows and effect sources supplied to this function.
 */
export function calculateDerivedCharacterStats(input: DerivedCharacterInput): DerivedCharacterStats {
  const abilities = deriveAbilities(input);
  const progression = aggregateClassProgression(input.classLevels);
  const racialNaturalArmor = input.race.naturalArmor ?? 0;
  const armorClassModifiers: ArmorClassModifier[] = [
    ...(input.armorClassModifiers ?? []),
    ...(racialNaturalArmor > 0
      ? [
          {
            id: `race:${input.race.id}:natural-armor`,
            source: input.race.id,
            kind: "natural-armor",
            value: racialNaturalArmor,
          } satisfies ArmorClassModifier,
        ]
      : []),
  ];

  const armorClass = calculateArmorClass({
    dexterityModifier: abilities.dex.modifier,
    size: input.race.size,
    modifiers: armorClassModifiers,
    ...(input.maxDexterityBonus === undefined
      ? {}
      : { maxDexterityBonus: input.maxDexterityBonus }),
    ...(input.retainDexterityWhenFlatFooted === undefined
      ? {}
      : { retainDexterityWhenFlatFooted: input.retainDexterityWhenFlatFooted }),
  });

  const savingThrows: Record<Dnd35Save, SavingThrowBonusCalculation> = {
    fort: calculateSavingThrowBonus({
      baseSaveBonus: progression.fort,
      abilityModifier: abilities.con.modifier,
      modifiers: input.saveModifiers?.fort ?? [],
    }),
    ref: calculateSavingThrowBonus({
      baseSaveBonus: progression.ref,
      abilityModifier: abilities.dex.modifier,
      modifiers: input.saveModifiers?.ref ?? [],
    }),
    will: calculateSavingThrowBonus({
      baseSaveBonus: progression.will,
      abilityModifier: abilities.wis.modifier,
      modifiers: input.saveModifiers?.will ?? [],
    }),
  };

  const initiative = calculateInitiative(
    abilities.dex.modifier,
    input.initiativeModifiers ?? [],
  );
  const grapple = calculateGrappleModifier({
    baseAttackBonus: progression.baseAttackBonus,
    strengthModifier: abilities.str.modifier,
    size: input.race.size,
    modifiers: input.grappleModifiers ?? [],
  });
  const hitPoints = hitPointsFromGainedLevels({
    gainedHitPoints: input.gainedHitPoints,
    constitutionModifier: abilities.con.modifier,
    ...(input.perHitDieHitPointBonus === undefined
      ? {}
      : { perHitDieBonus: input.perHitDieHitPointBonus }),
  });

  return {
    abilities,
    progression,
    effectiveCharacterLevel: effectiveCharacterLevel({
      classLevels: progression.characterLevel,
      race: input.race,
    }),
    armorClass,
    savingThrows,
    initiative,
    grapple,
    hitPoints,
    landSpeedFeet: input.race.baseSpeedFeet,
  };
}
