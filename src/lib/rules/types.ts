export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type AbilityKey = (typeof ABILITIES)[number];

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const ABILITY_EXPLAIN: Record<AbilityKey, string> = {
  str: "Raw muscle. Adds to melee attack and damage rolls, Climb, Jump, Swim, and how much you can carry.",
  dex: "Agility and reflexes. Adds to Armor Class, ranged attacks, Reflex saves, Hide, Move Silently, and initiative.",
  con: "Health and stamina. Adds hit points every single level and powers Fortitude saves. Nobody dumps Con.",
  int: "Reasoning and memory. Sets bonus skill points per level, Knowledge skills, and wizard spellcasting.",
  wis: "Perception and willpower. Adds to Will saves, Spot, Listen, Sense Motive, and cleric/druid spellcasting.",
  cha: "Force of personality. Drives Diplomacy, Bluff, Intimidate, sorcerer/bard casting, and turning undead.",
};

export type Alignment =
  | "LG"
  | "NG"
  | "CG"
  | "LN"
  | "N"
  | "CN"
  | "LE"
  | "NE"
  | "CE";

export const ALIGNMENTS: { key: Alignment; name: string; blurb: string }[] = [
  { key: "LG", name: "Lawful Good", blurb: "The crusader. Honor and compassion together." },
  { key: "NG", name: "Neutral Good", blurb: "The benefactor. Does good without bias for or against order." },
  { key: "CG", name: "Chaotic Good", blurb: "The rebel. Follows conscience over rules." },
  { key: "LN", name: "Lawful Neutral", blurb: "The judge. Order above all." },
  { key: "N", name: "True Neutral", blurb: "The undecided. Balance, or simple self-interest." },
  { key: "CN", name: "Chaotic Neutral", blurb: "The free spirit. Follows whims." },
  { key: "LE", name: "Lawful Evil", blurb: "The dominator. Uses order to take what it wants." },
  { key: "NE", name: "Neutral Evil", blurb: "The malefactor. Does whatever it can get away with." },
  { key: "CE", name: "Chaotic Evil", blurb: "The destroyer. Violence, greed, and cruelty." },
];

export type Size = "Fine" | "Diminutive" | "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan" | "Colossal";

export type RaceCategory = "core" | "planetouched" | "monstrous" | "savage" | "powerful" | "epic";

export interface RacialHitDice {
  count: number;
  hitDie: number;
  type: string;
  bab: BabProgression;
  saves: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression };
  skillPointsPerHd?: number;
}

export interface Race {
  id: string;
  name: string;
  size: Size;
  speed: number;
  abilityMods: Partial<Record<AbilityKey, number>>;
  bonusSkillPointsPerLevel?: number;
  bonusFeatsAtFirst?: number;
  favoredClass: string;
  traits: string[];
  blurb: string;
  category?: RaceCategory;
  /** Effective character level added on top of class levels and racial HD. */
  levelAdjustment?: number;
  racialHitDice?: RacialHitDice;
  naturalArmor?: number;
  creatureType?: string;
}


export type SaveProgression = "good" | "poor";
export type BabProgression = "full" | "threeQuarter" | "half";

export interface CharClass {
  id: string;
  name: string;
  kind: "base" | "prestige";
  hitDie: number;
  skillPoints: number;
  bab: BabProgression;
  saves: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression };
  classSkills: string[];
  casting?: { ability: AbilityKey; type: "prepared" | "spontaneous" | "psionic"; label: string };
  alignmentRequirement?: string;
  features: { level: number; name: string; text: string }[];
  blurb: string;
  playsLike: string;
}

export interface Skill {
  id: string;
  name: string;
  ability: AbilityKey;
  trainedOnly: boolean;
  armorCheckPenalty: boolean;
  explain: string;
}

export interface Feat {
  id: string;
  name: string;
  type: "General" | "Fighter" | "Metamagic" | "Item Creation" | "Psionic";
  prereq?: string;
  benefit: string;
}
