import { describe, expect, it } from "vitest";
import {
  deriveMonsterMaximumHitPoints,
  monsterArmorClass,
  monsterInitiativeModifier,
} from "@/modules/game/domain/actorRuntime";

describe("runtime game actor derivation", () => {
  it("rolls integer monster Hit Dice through the injected deterministic source", () => {
    const calls: Array<[number, number]> = [];
    const hp = deriveMonsterMaximumHitPoints(
      {
        hitDiceNumerator: 4,
        hitDiceDenominator: 1,
        hitDie: 8,
        hitPointBonus: 8,
      },
      (count, sides) => {
        calls.push([count, sides]);
        return 20;
      },
    );

    expect(calls).toEqual([[4, 8]]);
    expect(hp).toBe(28);
  });

  it("uses the mathematical die average for fractional Hit Dice", () => {
    expect(
      deriveMonsterMaximumHitPoints({
        hitDiceNumerator: 1,
        hitDiceDenominator: 2,
        hitDie: 8,
        hitPointBonus: 0,
      }),
    ).toBe(2);
  });

  it("never creates a monster instance below one maximum hit point", () => {
    expect(
      deriveMonsterMaximumHitPoints(
        {
          hitDiceNumerator: 1,
          hitDiceDenominator: 1,
          hitDie: 4,
          hitPointBonus: -20,
        },
        () => 1,
      ),
    ).toBe(1);
  });

  it("derives initiative and all three AC modes from the ruleset", () => {
    expect(monsterInitiativeModifier(14)).toBe(2);
    expect(monsterInitiativeModifier(null)).toBe(0);

    const armorClass = monsterArmorClass({
      dexterity: 14,
      size: "medium",
      naturalArmor: 3,
      armorBonus: 2,
      shieldBonus: 1,
      deflectionBonus: 1,
    });

    expect(armorClass.normal).toBe(19);
    expect(armorClass.touch).toBe(13);
    expect(armorClass.flatFooted).toBe(17);
  });
});
