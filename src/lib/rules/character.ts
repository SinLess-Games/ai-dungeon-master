import type { AbilityKey, Alignment } from "./types";

export interface ClassLevel {
  classId: string;
  levels: number;
}

export interface ItemEvent {
  id: string;
  at: string;
  /** plain-language description: "Found in the crypt", "Moved to party pool" */
  text: string;
}

export type LootLocation = "person" | "stored" | "party";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  cost: number;
  note?: string | undefined;
  /** where the item lives: carried on the character, in a stash, or the party pool */
  location: LootLocation;
  container?: string | undefined;
  /** provenance: where it came from, who held it, when it moved */
  history?: ItemEvent[];
}


export interface DmGrant {
  id: string;
  at: string;
  kind: "feat" | "skill-points" | "ability" | "ability-score" | "alignment" | "xp";
  detail: string;
  reason: string;
}

export interface Character {
  id: string;
  name: string;
  portraitUrl?: string;
  raceId: string;
  classes: ClassLevel[];
  /** Gestalt: a second, parallel class track (Unearthed Arcana variant). */
  gestalt?: boolean;
  classesB?: ClassLevel[];
  alignment: Alignment;
  deity?: string;
  abilities: Record<AbilityKey, number>;
  /** ability increases taken at 4th, 8th, 12th ... */
  abilityIncreases: AbilityKey[];
  skillRanks: Record<string, number>;
  featIds: string[];
  /** spells or powers chosen at creation and on level up */
  spellIds: string[];
  powerIds: string[];
  armorId: string;
  shieldId: string;
  weaponIds: string[];
  inventory: InventoryItem[];
  gold: number;
  xp: number;
  hp: { current: number; max: number; temp: number; nonlethal: number };
  conditions: string[];
  notes: string;
  grants: DmGrant[];
  encumbranceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function emptyCharacter(id: string): Character {
  return {
    id,
    name: "",
    raceId: "human",
    classes: [{ classId: "fighter", levels: 1 }],
    gestalt: false,
    classesB: [],
    alignment: "NG",
    abilities: { str: 13, dex: 13, con: 13, int: 12, wis: 12, cha: 10 },
    abilityIncreases: [],
    skillRanks: {},
    featIds: [],
    spellIds: [],
    powerIds: [],
    armorId: "none",
    shieldId: "no-shield",
    weaponIds: [],
    inventory: [],
    gold: 0,
    xp: 0,
    hp: { current: 0, max: 0, temp: 0, nonlethal: 0 },
    conditions: [],
    notes: "",
    grants: [],
    encumbranceEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
