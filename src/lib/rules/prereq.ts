import type { Feat } from "./types";
import { FEATS } from "./feats";
import { SKILLS } from "./skills";
import { CLASSES } from "./classes";
import { RACES } from "./races";
import type { Character } from "./character";
import type { DerivedStats } from "./engine";

const FEAT_NAMES = new Map(FEATS.map((f) => [f.name.toLowerCase(), f.id]));
const SKILL_BY_NAME = new Map(SKILLS.map((s) => [s.name.toLowerCase(), s.id]));
const CLASS_NAMES = new Set(CLASSES.map((c) => c.name.toLowerCase()));
const RACE_NAMES = new Set(RACES.map((r) => r.name.toLowerCase()));

const ABILITY_WORDS: Record<string, "str" | "dex" | "con" | "int" | "wis" | "cha"> = {
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
};

export interface PrereqContext {
  char: Character;
  derived: DerivedStats;
}

function classLevel(c: Character, name: string): number {
  const id = CLASSES.find((k) => k.name.toLowerCase() === name)?.id;
  if (!id) return 0;
  const a = c.classes.filter((e) => e.classId === id).reduce((s, e) => s + e.level, 0);
  const b = (c.classesB ?? []).filter((e) => e.classId === id).reduce((s, e) => s + e.level, 0);
  return Math.max(a, b);
}

function ranksIn(ctx: PrereqContext, skillId: string): number {
  return ctx.char.skillRanks?.[skillId] ?? 0;
}

/** Evaluate one clause. Returns true (met), false (not met), or null (not understood). */
function evalClause(raw: string, ctx: PrereqContext): boolean | null {
  const clause = raw.trim().replace(/\.$/, "");
  if (!clause) return true;
  const lower = clause.toLowerCase();
  const { derived } = ctx;

  // Alternatives: "Dwarf or gnome"
  if (/\bor\b/.test(lower)) {
    const parts = lower.split(/\bor\b/).map((p) => p.trim()).filter(Boolean);
    const results = parts.map((p) => evalClause(p, ctx));
    if (results.some((r) => r === true)) return true;
    if (results.every((r) => r === false)) return false;
    return null;
  }

  // Ability score: "Str 13", "Dex 15+"
  let m = lower.match(/^(str|dex|con|int|wis|cha)\s+(\d+)\+?$/);
  if (m) {
    const key = ABILITY_WORDS[m[1]!]!;
    return (derived.abilityScores[key] ?? 10) >= Number(m[2]);
  }

  // Base attack bonus
  m = lower.match(/^(?:bab|base attack bonus)\s*\+?(\d+)$/);
  if (m) return derived.bab >= Number(m[1]);

  // Caster level
  m = lower.match(/^caster level\s+(\d+)/);
  if (m) return derived.casting ? derived.level >= Number(m[1]) : false;

  // Character level / ECL
  m = lower.match(/^character level\s+(\d+)/);
  if (m) return derived.ecl >= Number(m[1]);

  // Class level: "Cleric level 3rd", "Fighter level 4th"
  m = lower.match(/^([a-z' ]+?)\s+level\s+(\d+)/);
  if (m && CLASS_NAMES.has(m[1]!.trim())) {
    return classLevel(ctx.char, m[1]!.trim()) >= Number(m[2]);
  }

  // Skill ranks: "Tumble 5 ranks" or "5 ranks in Tumble"
  m = lower.match(/^(.+?)\s+(\d+)\s+ranks?$/);
  if (m) {
    const id = SKILL_BY_NAME.get(m[1]!.trim());
    if (id) return ranksIn(ctx, id) >= Number(m[2]);
    return null;
  }
  m = lower.match(/^(\d+)\s+ranks?\s+in\s+(.+)$/);
  if (m) {
    const id = SKILL_BY_NAME.get(m[2]!.trim());
    if (id) return ranksIn(ctx, id) >= Number(m[1]);
    return null;
  }

  // Race requirement
  if (RACE_NAMES.has(lower)) return derived.race.name.toLowerCase() === lower;

  // Feat requirement
  const featId = FEAT_NAMES.get(lower);
  if (featId) return ctx.char.featIds.includes(featId);

  return null;
}

export function prereqIssues(feat: Feat, ctx: PrereqContext): string[] {
  const issues: string[] = [];
  if (feat.type === "Epic" && ctx.derived.ecl < 21) issues.push("Epic feats require character level 21st");
  if (feat.prereq) {
    for (const clause of feat.prereq.split(/[,;]/)) {
      if (evalClause(clause, ctx) === false) issues.push(clause.trim());
    }
  }
  return issues;
}

export function qualifiesFor(feat: Feat, ctx: PrereqContext): boolean {
  return prereqIssues(feat, ctx).length === 0;
}
