import { CLASS_BY_ID } from "./classes";
import { RACE_BY_ID } from "./races";
import { SKILLS, SKILL_BY_ID } from "./skills";
import { ARMORS, SHIELDS, carryingCapacity } from "./equipment";
import type { Character } from "./character";
import type { AbilityKey, BabProgression, SaveProgression } from "./types";
import { ABILITIES } from "./types";

export function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

export function totalLevel(c: Character) {
  return c.classes.reduce((n, cl) => n + cl.levels, 0);
}

export function babForClass(prog: BabProgression, level: number) {
  if (prog === "full") return level;
  if (prog === "threeQuarter") return Math.floor((level * 3) / 4);
  return Math.floor(level / 2);
}

export function saveForClass(prog: SaveProgression, level: number) {
  return prog === "good" ? 2 + Math.floor(level / 2) : Math.floor(level / 3);
}

export function babAttacks(bab: number) {
  const out: number[] = [bab];
  let n = bab - 5;
  while (n > 0 && out.length < 4) {
    out.push(n);
    n -= 5;
  }
  return out;
}

/** XP thresholds for level N (3.5 standard track). */
export function xpForLevel(level: number) {
  return (level * (level - 1) * 1000) / 2;
}

export function levelFromXp(xp: number) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export const SIZE_AC_MOD: Record<string, number> = {
  Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0, Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8,
};

export const SIZE_CARRY_MULT: Record<string, number> = {
  Fine: 0.125, Diminutive: 0.25, Tiny: 0.5, Small: 0.75, Medium: 1, Large: 2, Huge: 4, Gargantuan: 8, Colossal: 16,
};

export interface DerivedStats {
  level: number;
  /** Class levels + racial Hit Dice + level adjustment. */
  ecl: number;
  levelAdjustment: number;
  racialHd: number;
  race: ReturnType<typeof raceOf>;
  abilityScores: Record<AbilityKey, number>;
  abilityMods: Record<AbilityKey, number>;
  hpMax: number;
  bab: number;
  attacks: number[];
  melee: number;
  ranged: number;
  grapple: number;
  initiative: number;
  ac: { total: number; touch: number; flatFooted: number; armor: number; shield: number; dex: number; size: number; natural: number };
  saves: { fort: number; ref: number; will: number };
  speed: number;
  armorCheckPenalty: number;
  spellFailure: number;
  maxDex: number | null;
  skillPointsTotal: number;
  skillPointsSpent: number;
  maxRanks: { classSkill: number; crossClass: number };
  classSkillIds: Set<string>;
  skills: { id: string; name: string; ability: AbilityKey; total: number; ranks: number; isClassSkill: boolean; trainedOnly: boolean }[];
  featSlots: number;
  abilityIncreaseSlots: number;
  load: { carried: number; light: number; medium: number; heavy: number; category: "light" | "medium" | "heavy" | "overloaded" };
  casting?: { label: string; ability: AbilityKey; dcBase: number };
}

function raceOf(c: Character) {
  return RACE_BY_ID[c.raceId] ?? RACE_BY_ID["human"]!;
}

export function computeCharacter(c: Character): DerivedStats {
  const race = raceOf(c);
  const level = Math.max(1, totalLevel(c));

  const scores = {} as Record<AbilityKey, number>;
  for (const a of ABILITIES) {
    scores[a] = (c.abilities[a] ?? 10) + (race.abilityMods[a] ?? 0);
  }
  for (const a of c.abilityIncreases) scores[a] = (scores[a] ?? 10) + 1;

  const mods = {} as Record<AbilityKey, number>;
  for (const a of ABILITIES) mods[a] = abilityMod(scores[a]!);

  // Hit points: max at 1st level of the first class, average (rounded up) after.
  let hpMax = 0;
  let first = true;
  for (const cl of c.classes) {
    const def = CLASS_BY_ID[cl.classId];
    if (!def) continue;
    for (let i = 0; i < cl.levels; i++) {
      if (first) {
        hpMax += def.hitDie;
        first = false;
      } else {
        hpMax += Math.floor(def.hitDie / 2) + 1;
      }
      hpMax += mods.con;
    }
  }
  const rhd = race.racialHitDice;
  if (rhd) {
    for (let i = 0; i < rhd.count; i++) {
      hpMax += Math.floor(rhd.hitDie / 2) + 1 + mods.con;
    }
  }
  hpMax = Math.max(level, hpMax);
  if (c.featIds.includes("toughness")) hpMax += 3;

  let bab = 0;
  let fort = 0;
  let ref = 0;
  let will = 0;
  const classSkillIds = new Set<string>();
  let skillPointsTotal = 0;
  let firstClass = true;
  let casting: DerivedStats["casting"];

  for (const cl of c.classes) {
    const def = CLASS_BY_ID[cl.classId];
    if (!def) continue;
    bab += babForClass(def.bab, cl.levels);
    fort += saveForClass(def.saves.fort, cl.levels);
    ref += saveForClass(def.saves.ref, cl.levels);
    will += saveForClass(def.saves.will, cl.levels);
    def.classSkills.forEach((s) => classSkillIds.add(s));

    const perLevel = Math.max(1, def.skillPoints + mods.int + (race.bonusSkillPointsPerLevel ?? 0));
    if (firstClass) {
      skillPointsTotal += perLevel * 4;
      skillPointsTotal += cl.levels > 1 ? perLevel * (cl.levels - 1) : 0;
      firstClass = false;
    } else {
      skillPointsTotal += perLevel * cl.levels;
    }
    if (def.casting && !casting) {
      casting = { label: def.casting.label, ability: def.casting.ability, dcBase: 10 + mods[def.casting.ability] };
    }
  }

  if (rhd) {
    bab += babForClass(rhd.bab, rhd.count);
    fort += saveForClass(rhd.saves.fort, rhd.count);
    ref += saveForClass(rhd.saves.ref, rhd.count);
    will += saveForClass(rhd.saves.will, rhd.count);
    const perHd = Math.max(1, (rhd.skillPointsPerHd ?? 2) + mods.int);
    skillPointsTotal += perHd * (rhd.count + 3);
  }

  const armor = ARMORS.find((a) => a.id === c.armorId) ?? ARMORS[0]!;
  const shield = SHIELDS.find((s) => s.id === c.shieldId) ?? SHIELDS[0]!;
  const maxDex =
    armor.maxDex === null && shield.maxDex === null
      ? null
      : Math.min(armor.maxDex ?? 99, shield.maxDex ?? 99);
  const dexToAc = maxDex === null ? mods.dex : Math.min(mods.dex, maxDex);
  const sizeMod = SIZE_AC_MOD[race.size] ?? 0;

  const natural = race.naturalArmor ?? 0;
  const acTotal = 10 + armor.acBonus + shield.acBonus + dexToAc + sizeMod + natural;
  const acTouch = 10 + dexToAc + sizeMod;
  const acFlat = 10 + armor.acBonus + shield.acBonus + sizeMod + natural;

  const initiative = mods.dex + (c.featIds.includes("improved-initiative") ? 4 : 0);
  if (c.featIds.includes("great-fortitude")) fort += 2;
  if (c.featIds.includes("lightning-reflexes")) ref += 2;
  if (c.featIds.includes("iron-will")) will += 2;

  const acp = armor.checkPenalty + shield.checkPenalty;

  const maxClassRanks = level + 3;
  const maxCrossRanks = (level + 3) / 2;

  let skillPointsSpent = 0;
  const skills = SKILLS.map((s) => {
    const ranks = c.skillRanks[s.id] ?? 0;
    const isClassSkill = classSkillIds.has(s.id);
    skillPointsSpent += isClassSkill ? ranks : ranks * 2;
    let total = ranks + mods[s.ability];
    if (s.armorCheckPenalty) total += acp;
    if (c.featIds.includes("alertness") && (s.id === "listen" || s.id === "spot")) total += 2;
    return { id: s.id, name: s.name, ability: s.ability, total, ranks, isClassSkill, trainedOnly: s.trainedOnly };
  });

  const totalHd = level + (rhd?.count ?? 0);
  const featSlots =
    1 + Math.floor(totalHd / 3) + (race.bonusFeatsAtFirst ?? 0) + fighterBonusFeats(c) + wizardBonusFeats(c);
  const abilityIncreaseSlots = Math.floor(level / 4);

  const carried = c.inventory
    .filter((i) => i.location === "person")
    .reduce((w, i) => w + i.weight * i.quantity, 0) + armor.weight + shield.weight;
  const cap = carryingCapacity(scores.str, SIZE_CARRY_MULT[race.size] ?? 1);
  const category: "light" | "medium" | "heavy" | "overloaded" =
    carried <= cap.light ? "light" : carried <= cap.medium ? "medium" : carried <= cap.heavy ? "heavy" : "overloaded";

  return {
    level,
    ecl: level + (rhd?.count ?? 0) + (race.levelAdjustment ?? 0),
    levelAdjustment: race.levelAdjustment ?? 0,
    racialHd: rhd?.count ?? 0,
    race,
    abilityScores: scores,
    abilityMods: mods,
    hpMax,
    bab,
    attacks: babAttacks(bab),
    melee: bab + mods.str + (["Small", "Tiny", "Diminutive", "Fine"].includes(race.size) ? 1 : 0),
    ranged: bab + mods.dex + (["Small", "Tiny", "Diminutive", "Fine"].includes(race.size) ? 1 : 0),
    grapple: bab + mods.str - sizeMod,
    initiative,
    ac: { total: acTotal, touch: acTouch, flatFooted: acFlat, armor: armor.acBonus, shield: shield.acBonus, dex: dexToAc, size: sizeMod, natural },
    saves: { fort: fort + mods.con, ref: ref + mods.dex, will: will + mods.wis },
    speed: race.speed,
    armorCheckPenalty: acp,
    spellFailure: armor.spellFailure + shield.spellFailure,
    maxDex,
    skillPointsTotal,
    skillPointsSpent,
    maxRanks: { classSkill: maxClassRanks, crossClass: maxCrossRanks },
    classSkillIds,
    skills,
    featSlots,
    abilityIncreaseSlots,
    load: { carried, light: cap.light, medium: cap.medium, heavy: cap.heavy, category },
    ...(casting ? { casting } : {}),
  };
}

function fighterBonusFeats(c: Character) {
  const f = c.classes.find((x) => x.classId === "fighter");
  if (!f) return 0;
  return 1 + Math.floor(f.levels / 2);
}

function wizardBonusFeats(c: Character) {
  const w = c.classes.find((x) => x.classId === "wizard");
  if (!w) return 0;
  return 1 + Math.floor(w.levels / 5);
}

export function skillName(id: string) {
  return SKILL_BY_ID[id]?.name ?? id;
}

export function formatMod(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}
