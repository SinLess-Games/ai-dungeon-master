export interface Weapon {
  id: string;
  name: string;
  category: "simple" | "martial" | "exotic";
  kind: "melee" | "ranged";
  damage: string;
  critical: string;
  range?: number;
  weight: number;
  cost: number;
  damageType: string;
}

export const WEAPONS: Weapon[] = [
  { id: "dagger", name: "Dagger", category: "simple", kind: "melee", damage: "1d4", critical: "19-20/x2", range: 10, weight: 1, cost: 2, damageType: "Piercing or slashing" },
  { id: "club", name: "Club", category: "simple", kind: "melee", damage: "1d6", critical: "x2", weight: 3, cost: 0, damageType: "Bludgeoning" },
  { id: "quarterstaff", name: "Quarterstaff", category: "simple", kind: "melee", damage: "1d6/1d6", critical: "x2", weight: 4, cost: 0, damageType: "Bludgeoning" },
  { id: "spear", name: "Spear", category: "simple", kind: "melee", damage: "1d8", critical: "x3", range: 20, weight: 6, cost: 2, damageType: "Piercing" },
  { id: "light-crossbow", name: "Light Crossbow", category: "simple", kind: "ranged", damage: "1d8", critical: "19-20/x2", range: 80, weight: 4, cost: 35, damageType: "Piercing" },
  { id: "longsword", name: "Longsword", category: "martial", kind: "melee", damage: "1d8", critical: "19-20/x2", weight: 4, cost: 15, damageType: "Slashing" },
  { id: "battleaxe", name: "Battleaxe", category: "martial", kind: "melee", damage: "1d8", critical: "x3", weight: 6, cost: 10, damageType: "Slashing" },
  { id: "greatsword", name: "Greatsword", category: "martial", kind: "melee", damage: "2d6", critical: "19-20/x2", weight: 8, cost: 50, damageType: "Slashing" },
  { id: "greataxe", name: "Greataxe", category: "martial", kind: "melee", damage: "1d12", critical: "x3", weight: 12, cost: 20, damageType: "Slashing" },
  { id: "warhammer", name: "Warhammer", category: "martial", kind: "melee", damage: "1d8", critical: "x3", weight: 5, cost: 12, damageType: "Bludgeoning" },
  { id: "rapier", name: "Rapier", category: "martial", kind: "melee", damage: "1d6", critical: "18-20/x2", weight: 2, cost: 20, damageType: "Piercing" },
  { id: "shortsword", name: "Short Sword", category: "martial", kind: "melee", damage: "1d6", critical: "19-20/x2", weight: 2, cost: 10, damageType: "Piercing" },
  { id: "longbow", name: "Longbow", category: "martial", kind: "ranged", damage: "1d8", critical: "x3", range: 100, weight: 3, cost: 75, damageType: "Piercing" },
  { id: "shortbow", name: "Shortbow", category: "martial", kind: "ranged", damage: "1d6", critical: "x3", range: 60, weight: 2, cost: 30, damageType: "Piercing" },
  { id: "sling", name: "Sling", category: "simple", kind: "ranged", damage: "1d4", critical: "x2", range: 50, weight: 0, cost: 0, damageType: "Bludgeoning" },
  { id: "scythe", name: "Scythe", category: "martial", kind: "melee", damage: "2d4", critical: "x4", weight: 10, cost: 18, damageType: "Piercing or slashing" },
];

export interface Armor {
  id: string;
  name: string;
  type: "light" | "medium" | "heavy" | "shield";
  acBonus: number;
  maxDex: number | null;
  checkPenalty: number;
  spellFailure: number;
  weight: number;
  cost: number;
}

export const ARMORS: Armor[] = [
  { id: "none", name: "No armor", type: "light", acBonus: 0, maxDex: null, checkPenalty: 0, spellFailure: 0, weight: 0, cost: 0 },
  { id: "padded", name: "Padded", type: "light", acBonus: 1, maxDex: 8, checkPenalty: 0, spellFailure: 5, weight: 10, cost: 5 },
  { id: "leather", name: "Leather", type: "light", acBonus: 2, maxDex: 6, checkPenalty: 0, spellFailure: 10, weight: 15, cost: 10 },
  { id: "studded-leather", name: "Studded Leather", type: "light", acBonus: 3, maxDex: 5, checkPenalty: -1, spellFailure: 15, weight: 20, cost: 25 },
  { id: "chain-shirt", name: "Chain Shirt", type: "light", acBonus: 4, maxDex: 4, checkPenalty: -2, spellFailure: 20, weight: 25, cost: 100 },
  { id: "hide", name: "Hide", type: "medium", acBonus: 3, maxDex: 4, checkPenalty: -3, spellFailure: 20, weight: 25, cost: 15 },
  { id: "scale-mail", name: "Scale Mail", type: "medium", acBonus: 4, maxDex: 3, checkPenalty: -4, spellFailure: 25, weight: 30, cost: 50 },
  { id: "chainmail", name: "Chainmail", type: "medium", acBonus: 5, maxDex: 2, checkPenalty: -5, spellFailure: 30, weight: 40, cost: 150 },
  { id: "breastplate", name: "Breastplate", type: "medium", acBonus: 5, maxDex: 3, checkPenalty: -4, spellFailure: 25, weight: 30, cost: 200 },
  { id: "splint-mail", name: "Splint Mail", type: "heavy", acBonus: 6, maxDex: 0, checkPenalty: -7, spellFailure: 40, weight: 45, cost: 200 },
  { id: "banded-mail", name: "Banded Mail", type: "heavy", acBonus: 6, maxDex: 1, checkPenalty: -6, spellFailure: 35, weight: 35, cost: 250 },
  { id: "half-plate", name: "Half-Plate", type: "heavy", acBonus: 7, maxDex: 0, checkPenalty: -7, spellFailure: 40, weight: 50, cost: 600 },
  { id: "full-plate", name: "Full Plate", type: "heavy", acBonus: 8, maxDex: 1, checkPenalty: -6, spellFailure: 35, weight: 50, cost: 1500 },
];

export const SHIELDS: Armor[] = [
  { id: "no-shield", name: "No shield", type: "shield", acBonus: 0, maxDex: null, checkPenalty: 0, spellFailure: 0, weight: 0, cost: 0 },
  { id: "buckler", name: "Buckler", type: "shield", acBonus: 1, maxDex: null, checkPenalty: -1, spellFailure: 5, weight: 5, cost: 15 },
  { id: "light-shield", name: "Light Steel Shield", type: "shield", acBonus: 1, maxDex: null, checkPenalty: -1, spellFailure: 5, weight: 6, cost: 9 },
  { id: "heavy-shield", name: "Heavy Steel Shield", type: "shield", acBonus: 2, maxDex: null, checkPenalty: -2, spellFailure: 15, weight: 15, cost: 20 },
  { id: "tower-shield", name: "Tower Shield", type: "shield", acBonus: 4, maxDex: 2, checkPenalty: -10, spellFailure: 50, weight: 45, cost: 30 },
];

export const GEAR: { id: string; name: string; weight: number; cost: number; note?: string }[] = [
  { id: "backpack", name: "Backpack", weight: 2, cost: 2 },
  { id: "bedroll", name: "Bedroll", weight: 5, cost: 0.1 },
  { id: "rations", name: "Trail rations (1 day)", weight: 1, cost: 0.5 },
  { id: "rope", name: "Hemp rope (50 ft.)", weight: 10, cost: 1 },
  { id: "torch", name: "Torch", weight: 1, cost: 0.01 },
  { id: "lantern", name: "Hooded lantern", weight: 2, cost: 7 },
  { id: "thieves-tools", name: "Thieves' tools", weight: 1, cost: 30, note: "Required for Open Lock and Disable Device" },
  { id: "healers-kit", name: "Healer's kit", weight: 1, cost: 50, note: "+2 on Heal checks, 10 uses" },
  { id: "holy-symbol", name: "Silver holy symbol", weight: 1, cost: 25 },
  { id: "spell-component-pouch", name: "Spell component pouch", weight: 2, cost: 5 },
  { id: "spellbook", name: "Spellbook (blank)", weight: 3, cost: 15 },
  { id: "waterskin", name: "Waterskin", weight: 4, cost: 1 },
  { id: "crowbar", name: "Crowbar", weight: 5, cost: 2 },
  { id: "grappling-hook", name: "Grappling hook", weight: 4, cost: 1 },
  { id: "caltrops", name: "Caltrops", weight: 2, cost: 1 },
  { id: "alchemists-fire", name: "Alchemist's fire (flask)", weight: 1, cost: 20, note: "1d6 fire, 1d6 next round" },
  { id: "acid", name: "Acid (flask)", weight: 1, cost: 10, note: "1d6 acid damage" },
  { id: "tanglefoot-bag", name: "Tanglefoot bag", weight: 4, cost: 50, note: "Entangles a target" },
  { id: "potion-cure-light", name: "Potion of cure light wounds", weight: 0, cost: 50, note: "Heals 1d8+1" },
];

// Carrying capacity: max load for a light load, by Strength score (Medium creature).
const LIGHT_LOAD = [0, 3, 6, 10, 13, 16, 20, 23, 26, 30, 33, 38, 43, 50, 58, 66, 76, 86, 100, 116, 133, 153, 173, 200, 233, 266, 306, 346, 400, 466];

export function carryingCapacity(str: number, sizeMultiplier = 1) {
  let light: number;
  if (str <= 0) light = 0;
  else if (str < LIGHT_LOAD.length) light = LIGHT_LOAD[str]!;
  else {
    // Every +10 Strength quadruples capacity.
    const base = LIGHT_LOAD[((str - 20) % 10) + 20] ?? 133;
    light = base * Math.pow(4, Math.floor((str - 20) / 10));
  }
  light = Math.floor(light * sizeMultiplier);
  return { light, medium: light * 2, heavy: light * 3, liftOverHead: light * 3, drag: light * 15 };
}
