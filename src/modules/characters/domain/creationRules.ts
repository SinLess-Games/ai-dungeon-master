import { abilityModifier } from "@/rulesets/dnd35";

export interface StartingWealthFormula {
  diceCount: number;
  dieSides: number;
  multiplierGp: number;
}

export interface StartingWealthRoll {
  rolls: number[];
  goldPieces: number;
  copperPieces: number;
}

/** Roll source-backed starting wealth once. The injected roller makes the rule deterministic in tests. */
export function rollStartingWealth(
  formula: StartingWealthFormula,
  rollDie: (sides: number) => number = secureDie,
): StartingWealthRoll {
  if (!Number.isSafeInteger(formula.diceCount) || formula.diceCount < 1) {
    throw new RangeError("Starting-wealth dice count must be a positive integer.");
  }
  if (!Number.isSafeInteger(formula.dieSides) || formula.dieSides < 1) {
    throw new RangeError("Starting-wealth die size must be a positive integer.");
  }
  if (!Number.isSafeInteger(formula.multiplierGp) || formula.multiplierGp < 1) {
    throw new RangeError("Starting-wealth GP multiplier must be a positive integer.");
  }

  const rolls = Array.from({ length: formula.diceCount }, () => {
    const value = rollDie(formula.dieSides);
    if (!Number.isSafeInteger(value) || value < 1 || value > formula.dieSides) {
      throw new RangeError(`Die result must be between 1 and ${formula.dieSides}.`);
    }
    return value;
  });
  const goldPieces = rolls.reduce((sum, value) => sum + value, 0) * formula.multiplierGp;
  return { rolls, goldPieces, copperPieces: goldPieces * 100 };
}

function secureDie(sides: number): number {
  // Rejection sampling avoids modulo bias while remaining Worker-compatible.
  const maximum = 0x1_0000_0000;
  const limit = maximum - (maximum % sides);
  const buffer = new Uint32Array(1);
  let value = maximum;
  while (value >= limit) {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? maximum;
  }
  return (value % sides) + 1;
}

const ALIGNMENT_AXES: Record<string, readonly [number, number]> = {
  LG: [1, 1],
  NG: [0, 1],
  CG: [-1, 1],
  LN: [1, 0],
  N: [0, 0],
  CN: [-1, 0],
  LE: [1, -1],
  NE: [0, -1],
  CE: [-1, -1],
};

/** PHB cleric alignment must be within one step along one alignment axis; a neutral cleric needs a neutral deity. */
export function clericAlignmentMatchesDeity(characterAlignment: string, deityAlignment: string): boolean {
  const character = ALIGNMENT_AXES[characterAlignment];
  const deity = ALIGNMENT_AXES[deityAlignment];
  if (!character || !deity) return false;
  if (characterAlignment === "N") return deityAlignment === "N";
  return Math.abs(character[0] - deity[0]) + Math.abs(character[1] - deity[1]) <= 1;
}

export function firstLevelBonusLanguageCount(effectiveIntelligence: number): number {
  return Math.max(0, abilityModifier(effectiveIntelligence));
}

/** XPH p.20: a psion's primary discipline adds these class skills to the shared psion list. */
export const psionDisciplineClassSkillSlugs: Readonly<Record<string, readonly string[]>> = {
  clairsentience: ["gather-information", "listen", "spot"],
  metacreativity: ["bluff", "disguise", "use-psionic-device"],
  psychokinesis: ["autohypnosis", "disable-device", "intimidate"],
  psychometabolism: ["autohypnosis", "balance", "heal"],
  psychoportation: ["climb", "jump", "ride", "survival", "swim"],
  telepathy: ["bluff", "diplomacy", "gather-information", "sense-motive"],
};

export function psionDisciplineClassSkills(disciplineSlug: string): readonly string[] {
  return psionDisciplineClassSkillSlugs[disciplineSlug.trim().toLowerCase()] ?? [];
}

export interface DragonShamanTotemRule {
  name: string;
  alignments: readonly string[];
  classSkills: readonly string[];
  breathWeapon: string;
}

/** PHB II Totem Dragon table. Descriptions are concise mechanical data for creator validation. */
export const dragonShamanTotems: Readonly<Record<string, DragonShamanTotemRule>> = {
  black: { name: "Black", alignments: ["NE", "CE", "CN"], classSkills: ["hide", "move-silently", "swim"], breathWeapon: "Line of acid" },
  blue: { name: "Blue", alignments: ["NE", "LE", "LN"], classSkills: ["bluff", "hide", "spellcraft"], breathWeapon: "Line of electricity" },
  brass: { name: "Brass", alignments: ["NG", "CG", "CN"], classSkills: ["bluff", "gather-information", "survival"], breathWeapon: "Line of fire" },
  bronze: { name: "Bronze", alignments: ["NG", "LG", "LN"], classSkills: ["disguise", "survival", "swim"], breathWeapon: "Line of electricity" },
  copper: { name: "Copper", alignments: ["NG", "CG", "CN"], classSkills: ["bluff", "hide", "jump"], breathWeapon: "Line of acid" },
  gold: { name: "Gold", alignments: ["NG", "LG", "LN"], classSkills: ["disguise", "heal", "swim"], breathWeapon: "Cone of fire" },
  green: { name: "Green", alignments: ["NE", "LE", "LN"], classSkills: ["bluff", "hide", "move-silently"], breathWeapon: "Cone of acid" },
  red: { name: "Red", alignments: ["NE", "CE", "CN"], classSkills: ["appraise", "bluff", "jump"], breathWeapon: "Cone of fire" },
  silver: { name: "Silver", alignments: ["NG", "LG", "LN"], classSkills: ["bluff", "disguise", "jump"], breathWeapon: "Cone of cold" },
  white: { name: "White", alignments: ["NE", "CE", "CN"], classSkills: ["hide", "move-silently", "swim"], breathWeapon: "Cone of cold" },
};

export function dragonShamanTotemOptions(alignment: string) {
  return Object.entries(dragonShamanTotems)
    .filter(([, rule]) => rule.alignments.includes(alignment))
    .map(([slug, rule]) => ({ slug, ...rule }));
}

export function dragonShamanTotemClassSkills(totemSlug: string): readonly string[] {
  return dragonShamanTotems[totemSlug.trim().toLowerCase()]?.classSkills ?? [];
}

export const standardFamiliarChoices = [
  "bat",
  "cat",
  "hawk",
  "lizard",
  "owl",
  "rat",
  "raven",
  "tiny viper snake",
  "toad",
  "weasel",
] as const;

export const standardDruidAnimalCompanionChoices = [
  "badger",
  "camel",
  "dire rat",
  "dog",
  "riding dog",
  "eagle",
  "hawk",
  "heavy horse",
  "light horse",
  "owl",
  "pony",
  "small viper snake",
  "medium viper snake",
  "wolf",
] as const;

export function isStandardFamiliar(value: string): boolean {
  return (standardFamiliarChoices as readonly string[]).includes(value.trim().toLowerCase());
}

export function isStandardDruidAnimalCompanion(value: string): boolean {
  return (standardDruidAnimalCompanionChoices as readonly string[]).includes(value.trim().toLowerCase());
}

/** A non-divination specialist prohibits two schools; a diviner prohibits one. */
export function wizardProhibitedSchoolCount(specialistSchoolSlug: string): number {
  return specialistSchoolSlug.trim().toLowerCase() === "divination" ? 1 : 2;
}
