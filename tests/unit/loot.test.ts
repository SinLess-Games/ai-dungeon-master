import { describe, it, expect } from "vitest";
import {
  LOOT_LOCATIONS,
  locationLabel,
  newItem,
  addItem,
  updateItem,
  removeItem,
  moveItem,
  transferItem,
  splitGold,
  planEqualSplit,
  totalWeight,
  totalValue,
  withEvent,
} from "@/lib/loot";
import { emptyCharacter } from "@/lib/rules/character";

function hero(name = "Hero") {
  return { ...emptyCharacter(`c-${name}`), name };
}

describe("loot", () => {
  it("labels locations", () => {
    expect(LOOT_LOCATIONS).toHaveLength(3);
    expect(locationLabel("party")).toBe("Party pool");
    expect(locationLabel("nowhere" as never)).toBe("nowhere");
  });

  it("creates items with history", () => {
    const item = newItem({ name: "Longsword", cost: 15, weight: 4, note: "from the crypt" });
    expect(item.quantity).toBe(1);
    expect(item.location).toBe("person");
    expect(item.history?.[0]!.text).toContain("crypt");
    const later = withEvent(item, "Given to Mira");
    expect(later.history).toHaveLength(2);
  });

  it("adds, updates and removes items", () => {
    let c = hero();
    const item = newItem({ name: "Rope" });
    c = addItem(c, item);
    expect(c.inventory).toHaveLength(1);
    c = updateItem(c, item.id, { quantity: 3 });
    expect(c.inventory[0]!.quantity).toBe(3);
    c = removeItem(c, item.id);
    expect(c.inventory).toHaveLength(0);
  });

  it("moves whole stacks and splits partial stacks", () => {
    let c = hero();
    const item = newItem({ name: "Potion", quantity: 5 });
    c = addItem(c, item);

    c = moveItem(c, item.id, "party");
    expect(c.inventory[0]!.location).toBe("party");

    c = moveItem(c, item.id, "stored", { quantity: 2, container: "Wagon" });
    const stored = c.inventory.find((i) => i.location === "stored");
    const left = c.inventory.find((i) => i.location === "party");
    expect(stored?.quantity).toBe(2);
    expect(stored?.container).toBe("Wagon");
    expect(left?.quantity).toBe(3);

    expect(moveItem(c, "missing", "person")).toBe(c);
  });

  it("transfers items between heroes", () => {
    let from = hero("Mira");
    const to = hero("Dain");
    const item = newItem({ name: "Wand", quantity: 2 });
    from = addItem(from, item);

    const res = transferItem(from, to, item.id, 1);
    expect(res.from.inventory[0]!.quantity).toBe(1);
    expect(res.to.inventory).toHaveLength(1);
    expect(res.to.inventory[0]!.quantity).toBe(1);

    const none = transferItem(from, to, "nope");
    expect(none.from.inventory).toHaveLength(1);
  });

  it("splits gold and loot fairly", () => {
    const split = splitGold(101, 4);
    expect(split.each).toBeGreaterThan(0);
    expect(split.each * 4 + split.remainder).toBeCloseTo(101, 2);

    const items = [
      newItem({ name: "Gem", cost: 100, quantity: 2 }),
      newItem({ name: "Sword", cost: 50 }),
    ];
    const plan = planEqualSplit(items, ["a", "b"]);
    expect(plan.size).toBe(2);
    expect(plan.get("a")!.length).toBeGreaterThan(0);
    expect(planEqualSplit(items, []).size).toBe(0);

  });

  it("totals weight and value", () => {
    const items = [
      newItem({ name: "Plate", weight: 50, cost: 1500 }),
      newItem({ name: "Arrows", weight: 0.1, cost: 1, quantity: 20 }),
    ];
    expect(totalWeight(items)).toBeCloseTo(52, 1);
    expect(totalValue(items)).toBeCloseTo(1520, 1);
  });
});
