import { describe, it, expect } from "vitest";
import {
  abilityMod,
  babForClass,
  saveForClass,
  babAttacks,
  totalLevel,
  gestaltTrack,
  xpForLevel,
  levelFromXp,
  computeCharacter,
  skillName,
  formatMod,
} from "@/lib/rules/engine";
import { emptyCharacter } from "@/lib/rules/character";
import { CLASSES, CLASS_BY_ID } from "@/lib/rules/classes";
import { RACES, RACE_BY_ID } from "@/lib/rules/races";
import { SKILLS, SKILL_BY_ID } from "@/lib/rules/skills";
import { FEATS, FEAT_BY_ID } from "@/lib/rules/feats";
import { prereqIssues, qualifiesFor } from "@/lib/rules/prereq";
import { movementModes, formatMovement } from "@/lib/rules/movement";
import { ARMORS, SHIELDS, WEAPONS, GEAR, carryingCapacity } from "@/lib/rules/equipment";
import { SPELLS, POWERS, maxSpellLevel, spellLevelFor } from "@/lib/rules/spells";
import { COMPENDIUM_SPELLS } from "@/lib/rules/spell-compendium";
import {
  LEADERSHIP_TABLE,
  leadershipLookup,
  totalFollowers,
  LEADERSHIP_MIN_SCORE,
  LEADERSHIP_MAX_SCORE,
} from "@/lib/rules/leadership";
import { ABILITIES, ABILITY_NAMES, ALIGNMENTS } from "@/lib/rules/types";

describe("rules engine", () => {
  it("computes ability modifiers", () => {
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(18)).toBe(4);
    expect(abilityMod(7)).toBe(-2);
  });

  it("computes BAB and saves by progression", () => {
    expect(babForClass("full", 10)).toBe(10);
    expect(babForClass("threeQuarter", 10)).toBe(7);
    expect(babForClass("half", 10)).toBe(5);
    expect(saveForClass("good", 10)).toBe(7);
    expect(saveForClass("poor", 10)).toBe(3);
    expect(babAttacks(11)).toEqual([11, 6, 1]);
    expect(babAttacks(3)).toEqual([3]);
  });

  it("tracks levels, gestalt and XP", () => {
    const c = emptyCharacter("x");
    c.classes = [{ classId: "fighter", levels: 3 }, { classId: "rogue", levels: 2 }];
    expect(totalLevel(c)).toBe(5);
    expect(gestaltTrack(c)).toEqual([]);

    c.gestalt = true;
    c.classesB = [{ classId: "wizard", levels: 6 }];
    expect(gestaltTrack(c)).toHaveLength(1);
    expect(totalLevel(c)).toBe(6);

    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(6))).toBe(6);
  });

  it("derives a full stat block for a character", () => {
    const c = emptyCharacter("hero");
    c.name = "Mira";
    c.raceId = "human";
    c.classes = [{ classId: "fighter", levels: 4 }];
    c.abilities = { str: 16, dex: 14, con: 14, int: 12, wis: 10, cha: 8 };
    c.armorId = ARMORS[1]!.id;
    c.skillRanks = { [SKILLS[0]!.id]: 4 };

    const d = computeCharacter(c);
    expect(d.level).toBe(4);
    expect(d.bab).toBe(4);
    expect(d.ac.total).toBeGreaterThan(10);
    expect(d.hpMax).toBeGreaterThan(0);
    expect(d.saves.fort).toBeGreaterThan(0);
    expect(Array.isArray(d.skills)).toBe(true);
    expect(d.load.light).toBeGreaterThan(0);
  });

  it("handles an unarmoured spellcaster with encumbrance", () => {
    const c = emptyCharacter("wiz");
    c.raceId = RACES[1]!.id;
    c.classes = [{ classId: "wizard", levels: 7 }];
    c.abilities = { str: 8, dex: 16, con: 12, int: 18, wis: 12, cha: 10 };
    c.encumbranceEnabled = true;
    c.inventory = [
      { id: "i1", name: "Books", quantity: 10, weight: 5, cost: 1, location: "person" },
    ];
    const d = computeCharacter(c);
    expect(d.level).toBe(7);
    expect(d.bab).toBe(3);
    expect(d.load).toBeTruthy();
  });

  it("formats helpers", () => {
    expect(formatMod(3)).toBe("+3");
    expect(formatMod(-2)).toBe("-2");
    expect(skillName(SKILLS[0]!.id)).toBe(SKILLS[0]!.name);
  });
});

describe("rules data", () => {
  it("has consistent lookup tables", () => {
    expect(CLASSES.length).toBeGreaterThan(10);
    expect(CLASS_BY_ID[CLASSES[0]!.id]).toBeTruthy();
    expect(RACE_BY_ID[RACES[0]!.id]).toBeTruthy();
    expect(SKILL_BY_ID[SKILLS[0]!.id]).toBeTruthy();
    expect(FEAT_BY_ID[FEATS[0]!.id]).toBeTruthy();
    expect(ABILITIES).toHaveLength(6);
    expect(ABILITY_NAMES.str).toBeTruthy();
    expect(ALIGNMENTS.length).toBe(9);
  });

  it("checks feat prerequisites", () => {
    const char = emptyCharacter("prereq");
    char.raceId = "human";
    char.classes = [{ classId: "fighter", levels: 1 }];
    const ctx = { char, derived: computeCharacter(char) };
    const gated = FEATS.find((f) => f.prereq && f.prereq.length > 0)!;
    const issues = prereqIssues(gated, ctx);
    expect(Array.isArray(issues)).toBe(true);
    expect(qualifiesFor(gated, ctx)).toBe(issues.length === 0);
  });

  it("describes movement modes", () => {
    const modes = movementModes(RACES[0]!, 30);
    expect(modes.length).toBeGreaterThan(0);
    expect(formatMovement(modes[0]!)).toMatch(/ft/);
  });

  it("prices and weighs equipment", () => {
    expect(WEAPONS.length).toBeGreaterThan(0);
    expect(SHIELDS.length).toBeGreaterThan(0);
    expect(GEAR.length).toBeGreaterThan(0);
    const cap = carryingCapacity(16);
    expect(cap.light).toBeLessThan(cap.medium);
    expect(cap.medium).toBeLessThan(cap.heavy);
    expect(carryingCapacity(16, 2).heavy).toBeGreaterThan(cap.heavy);
  });

  it("knows spells and powers", () => {
    expect(SPELLS.length).toBeGreaterThan(0);
    expect(POWERS.length).toBeGreaterThan(0);
    expect(maxSpellLevel(9, "full")).toBeGreaterThan(0);
    expect(maxSpellLevel(1, "half")).toBe(0);
    const spell = SPELLS[0]!;
    const lvl = spellLevelFor(spell, "wizard", "arcane");
    expect(lvl === undefined || typeof lvl === "number").toBe(true);
  });

  it("has a fully described spell compendium", () => {
    expect(COMPENDIUM_SPELLS.length).toBeGreaterThan(800);
    const missing = COMPENDIUM_SPELLS.filter((s) => !s.name || !s.mechanics);
    expect(missing).toHaveLength(0);
  });

  it("looks up leadership", () => {
    expect(LEADERSHIP_TABLE.length).toBeGreaterThan(100);
    const row = leadershipLookup(20);
    expect(row[0]).toBeLessThanOrEqual(20);
    expect(totalFollowers(row)).toBeGreaterThanOrEqual(0);
    expect(leadershipLookup(LEADERSHIP_MIN_SCORE - 50)[0]).toBe(LEADERSHIP_MIN_SCORE);
    expect(leadershipLookup(LEADERSHIP_MAX_SCORE + 50)[0]).toBe(LEADERSHIP_MAX_SCORE);
  });
});
