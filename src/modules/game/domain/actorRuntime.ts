import { abilityModifier, calculateArmorClass, type Dnd35Size } from "@/rulesets/dnd35";

export interface MonsterHitPointDefinition {
  hitDiceNumerator: number;
  hitDiceDenominator: number;
  hitDie: number;
  hitPointBonus: number;
}

export function deriveMonsterMaximumHitPoints(
  definition: MonsterHitPointDefinition,
  rollIntegerHitDice?: (count: number, sides: number) => number,
): number {
  const { hitDiceNumerator, hitDiceDenominator, hitDie, hitPointBonus } = definition;
  if (
    !Number.isSafeInteger(hitDiceNumerator) ||
    hitDiceNumerator < 1 ||
    !Number.isSafeInteger(hitDiceDenominator) ||
    hitDiceDenominator < 1 ||
    !Number.isSafeInteger(hitDie) ||
    hitDie < 1 ||
    !Number.isSafeInteger(hitPointBonus)
  ) {
    throw new RangeError("Monster Hit Dice and hit-point bonus must be valid integers.");
  }

  let rolled: number;
  if (hitDiceDenominator === 1 && rollIntegerHitDice) {
    rolled = rollIntegerHitDice(hitDiceNumerator, hitDie);
  } else {
    // Fractional HD do not map cleanly to an integer dice expression. Use the
    // exact mathematical die average, then round down as D&D integer HP state.
    rolled = Math.floor((hitDiceNumerator / hitDiceDenominator) * ((hitDie + 1) / 2));
  }
  return Math.max(1, rolled + hitPointBonus);
}

export function monsterInitiativeModifier(dexterity: number | null): number {
  return dexterity === null ? 0 : abilityModifier(dexterity);
}

export function monsterArmorClass(input: {
  dexterity: number | null;
  size: Dnd35Size;
  naturalArmor: number;
  armorBonus: number;
  shieldBonus: number;
  deflectionBonus: number;
}) {
  return calculateArmorClass({
    dexterityModifier: monsterInitiativeModifier(input.dexterity),
    size: input.size,
    modifiers: [
      {
        id: "monster:natural",
        source: "monster natural armor",
        kind: "natural-armor",
        value: input.naturalArmor,
      },
      {
        id: "monster:armor",
        source: "monster armor",
        kind: "armor",
        value: input.armorBonus,
      },
      {
        id: "monster:shield",
        source: "monster shield",
        kind: "shield",
        value: input.shieldBonus,
      },
      {
        id: "monster:deflection",
        source: "monster deflection",
        kind: "deflection",
        value: input.deflectionBonus,
      },
    ],
  });
}
