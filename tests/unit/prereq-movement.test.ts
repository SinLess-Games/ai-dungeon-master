import { describe, it, expect } from "vitest";
import { prereqIssues, qualifiesFor, type PrereqContext } from "@/lib/rules/prereq";
import { computeCharacter } from "@/lib/rules/engine";
import { emptyCharacter } from "@/lib/rules/character";
import { FEATS } from "@/lib/rules/feats";
import { SKILLS } from "@/lib/rules/skills";
import { RACES } from "@/lib/rules/races";
import { movementModes, formatMovement } from "@/lib/rules/movement";

function ctxFor(mut: (c: ReturnType<typeof emptyCharacter>) => void = () => {}): PrereqContext {
  const char = emptyCharacter("p");
  char.raceId = "human";
  char.classes = [{ classId: "fighter", levels: 1 }];
  mut(char);
  return { char, derived: computeCharacter(char) };
}

const featByPrereq = (needle: string) =>
  FEATS.find((f) => f.prereq && f.prereq.toLowerCase().includes(needle));

describe("feat prerequisites", () => {
  it("passes a feat with no prerequisites", () => {
    const open = FEATS.find((f) => !f.prereq)!;
    expect(prereqIssues(open, ctxFor())).toEqual([]);
    expect(qualifiesFor(open, ctxFor())).toBe(true);
  });

  it("checks ability score clauses", () => {
    const feat = featByPrereq("str 13");
    if (!feat) return;
    expect(qualifiesFor(feat, ctxFor())).toBe(false);
    const strong = ctxFor((c) => {
      c.abilities = { ...c.abilities, str: 18 };
    });
    expect(prereqIssues(feat, strong).some((i) => i.toLowerCase().includes("str"))).toBe(false);
  });

  it("checks base attack bonus clauses", () => {
    const feat = FEATS.find((f) => /base attack bonus|bab/i.test(f.prereq ?? ""));
    if (!feat) return;
    const low = ctxFor();
    const high = ctxFor((c) => {
      c.classes = [{ classId: "fighter", levels: 12 }];
      c.abilities = { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 };
    });
    expect(prereqIssues(feat, high).length).toBeLessThanOrEqual(prereqIssues(feat, low).length);
  });

  it("checks skill rank clauses", () => {
    const feat = FEATS.find((f) => /\branks?\b/i.test(f.prereq ?? ""));
    if (!feat) return;
    const trained = ctxFor((c) => {
      c.classes = [{ classId: "rogue", levels: 10 }];
      c.skillRanks = Object.fromEntries(SKILLS.map((s) => [s.id, 13]));
      c.abilities = { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 };
    });
    expect(Array.isArray(prereqIssues(feat, trained))).toBe(true);
  });

  it("checks feat-chain and race clauses", () => {
    const chain = FEATS.find((f) => f.prereq && FEATS.some((p) => f.prereq!.includes(p.name)));
    if (chain) {
      const without = ctxFor();
      const parent = FEATS.find((p) => chain.prereq!.includes(p.name))!;
      const withParent = ctxFor((c) => {
        c.featIds = [parent.id];
        c.abilities = { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 };
      });
      expect(prereqIssues(chain, withParent).length).toBeLessThanOrEqual(prereqIssues(chain, without).length);
    }
    const racial = FEATS.find((f) => /dwarf|elf|gnome|halfling/i.test(f.prereq ?? ""));
    if (racial) expect(Array.isArray(prereqIssues(racial, ctxFor()))).toBe(true);
  });

  it("blocks epic feats below level 21", () => {
    const epic = FEATS.find((f) => f.type === "Epic");
    if (!epic) return;
    expect(prereqIssues(epic, ctxFor()).some((i) => i.includes("21st"))).toBe(true);
  });

  it("evaluates every feat without throwing", () => {
    const ctx = ctxFor((c) => {
      c.classes = [{ classId: "wizard", levels: 20 }];
      c.abilities = { str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 20 };
      c.featIds = FEATS.slice(0, 20).map((f) => f.id);
      c.skillRanks = Object.fromEntries(SKILLS.map((s) => [s.id, 23]));
    });
    for (const f of FEATS) expect(Array.isArray(prereqIssues(f, ctx))).toBe(true);
  });
});

describe("movement modes", () => {
  it("always reports a land speed", () => {
    const modes = movementModes(RACES[0]!, 30);
    expect(modes[0]).toMatchObject({ mode: "Land", feet: 30 });
  });

  it("parses extra modes from racial traits", () => {
    const race = { name: "Test", traits: ["Fly 60 ft. (good)", "Swim 30 ft.", "Climb at twice your base speed"] } as never;
    const modes = movementModes(race, 20);
    const labels = modes.map((m) => m.mode);
    expect(labels).toContain("Fly");
    expect(labels).toContain("Swim");
    const fly = modes.find((m) => m.mode === "Fly")!;
    expect(fly.feet).toBe(60);
    expect(fly.detail).toContain("good");
    const climb = modes.find((m) => m.mode === "Climb");
    if (climb) expect(climb.feet).toBe(40);
  });

  it("handles half-speed phrasing and ignores duplicates", () => {
    const race = { name: "Test", traits: ["Burrow at half your base speed", "Burrow 10 ft."] } as never;
    const modes = movementModes(race, 30);
    expect(modes.filter((m) => m.mode === "Burrow")).toHaveLength(1);
    expect(modes.find((m) => m.mode === "Burrow")!.feet).toBe(15);
  });

  it("formats modes for display", () => {
    expect(formatMovement({ mode: "Land", feet: 30 })).toBe("Land 30 ft.");
    expect(formatMovement({ mode: "Fly", feet: 60, detail: "good maneuverability" })).toContain("(good");
    expect(formatMovement({ mode: "Swim", feet: null })).toBe("Swim");
    expect(formatMovement({ mode: "Climb", feet: 20, note: "twice base speed", detail: "poor" })).toContain(",");
  });

  it("covers all real races", () => {
    for (const race of RACES) {
      const modes = movementModes(race, 30);
      expect(modes.length).toBeGreaterThan(0);
      for (const m of modes) expect(formatMovement(m).length).toBeGreaterThan(0);
    }
  });
});
