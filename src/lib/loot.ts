import type { Character, InventoryItem, ItemEvent, LootLocation } from "./rules/character";
import { newId } from "./storage";

export const LOOT_LOCATIONS: { id: LootLocation; label: string; blurb: string }[] = [
  { id: "person", label: "On person", blurb: "Carried right now — counts toward encumbrance." },
  { id: "stored", label: "Stored", blurb: "Stashes, strongholds, vaults, wagons and pack animals." },
  { id: "party", label: "Party pool", blurb: "Shared haul waiting to be split between heroes." },
];

export function locationLabel(loc: LootLocation) {
  return LOOT_LOCATIONS.find((l) => l.id === loc)?.label ?? loc;
}

export function event(text: string): ItemEvent {
  return { id: newId(), at: new Date().toISOString(), text };
}

export function withEvent(item: InventoryItem, text: string): InventoryItem {
  return { ...item, history: [...(item.history ?? []), event(text)] };
}

export function newItem(partial: Partial<InventoryItem> & { name: string }): InventoryItem {
  return {
    id: newId(),
    quantity: 1,
    weight: 0,
    cost: 0,
    location: "person",
    ...partial,
    history: [event(partial.note ? `Added — ${partial.note}` : "Added to inventory")],
  };
}

export function addItem(char: Character, item: InventoryItem): Character {
  return { ...char, inventory: [...char.inventory, item] };
}

export function updateItem(char: Character, id: string, patch: Partial<InventoryItem>): Character {
  return {
    ...char,
    inventory: char.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  };
}

export function removeItem(char: Character, id: string): Character {
  return { ...char, inventory: char.inventory.filter((i) => i.id !== id) };
}

/** Move some or all of a stack to another pool, logging the move. */
export function moveItem(
  char: Character,
  id: string,
  to: LootLocation,
  opts: { quantity?: number; container?: string } = {},
): Character {
  const item = char.inventory.find((i) => i.id === id);
  if (!item) return char;
  const qty = Math.max(1, Math.min(opts.quantity ?? item.quantity, item.quantity));
  const container = to === "stored" ? (opts.container ?? item.container) : undefined;
  const note = `Moved to ${locationLabel(to).toLowerCase()}${container ? ` (${container})` : ""}`;

  if (qty >= item.quantity) {
    return updateItem(char, id, {
      ...withEvent(item, note),
      location: to,
      ...(container ? { container } : { container: undefined }),
    });
  }

  const remaining = withEvent({ ...item, quantity: item.quantity - qty }, `Split ${qty} off — ${note.toLowerCase()}`);
  const moved: InventoryItem = withEvent(
    { ...item, id: newId(), quantity: qty, location: to, ...(container ? { container } : { container: undefined }) },
    `Split from ${item.name} stack — ${note.toLowerCase()}`,
  );
  return { ...char, inventory: [...char.inventory.map((i) => (i.id === id ? remaining : i)), moved] };
}

/** Hand part of a stack to another hero's on-person inventory. */
export function transferItem(
  from: Character,
  to: Character,
  id: string,
  quantity?: number,
): { from: Character; to: Character } {
  const item = from.inventory.find((i) => i.id === id);
  if (!item) return { from, to };
  const qty = Math.max(1, Math.min(quantity ?? item.quantity, item.quantity));
  const giverName = from.name || "an ally";
  const taker = withEvent(
    { ...item, id: newId(), quantity: qty, location: "person" as LootLocation, container: undefined },
    `Received from ${giverName}`,
  );
  const nextFrom =
    qty >= item.quantity
      ? removeItem(from, id)
      : updateItem(from, id, withEvent({ ...item, quantity: item.quantity - qty }, `Gave ${qty} to ${to.name || "an ally"}`));
  return { from: nextFrom, to: { ...to, inventory: [...to.inventory, taker] } };
}

/** Split gold evenly; the remainder stays with the holder. */
export function splitGold(total: number, shares: number) {
  if (shares < 1) return { each: 0, remainder: total };
  const each = Math.floor(total / shares);
  return { each, remainder: total - each * shares };
}

/** Deal party-pool items out evenly across the given hero ids. */
export function planEqualSplit(items: InventoryItem[], heroIds: string[]) {
  const plan = new Map<string, { itemId: string; quantity: number }[]>();
  heroIds.forEach((h) => plan.set(h, []));
  if (heroIds.length === 0) return plan;
  let cursor = 0;
  for (const item of items) {
    const base = Math.floor(item.quantity / heroIds.length);
    let leftover = item.quantity - base * heroIds.length;
    for (const hero of heroIds) {
      let qty = base;
      if (leftover > 0) {
        const pick = heroIds[cursor % heroIds.length];
        if (pick === hero) {
          qty += 1;
          leftover -= 1;
          cursor += 1;
        }
      }
      if (qty > 0) plan.get(hero)!.push({ itemId: item.id, quantity: qty });
    }
  }
  return plan;
}


export function totalWeight(items: InventoryItem[]) {
  return items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
}

export function totalValue(items: InventoryItem[]) {
  return items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
}
