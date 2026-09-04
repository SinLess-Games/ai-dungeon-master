/**
 * Randomised battle-map seeds. One directive per map so repeated dungeons stop
 * looking like the same box. Picks are deterministic per map id.
 */

import type { MapKind } from "@/lib/tacticalmap";

interface MapSeed {
  id: string;
  label: string;
  kinds: (MapKind | "any")[];
  text: (name: string) => string;
}

export const MAP_SEEDS: MapSeed[] = [
  {
    id: "vertical-fight",
    label: "Fight with a floor above it",
    kinds: ["any", "dungeon", "keep", "ruin", "city"],
    text: (n) =>
      `Lay out ${n} as a two-level space where the upper level overlooks the lower one. Ranged enemies start high, ladders and stairs are few and exposed, and the drop is far enough to hurt.`,
  },
  {
    id: "chokepoint-and-flood",
    label: "Chokepoint the enemy can open",
    kinds: ["any", "dungeon", "cave", "keep"],
    text: (n) =>
      `Lay out ${n} around a single narrow crossing that heavily favours defenders — and give the attackers one way to change that: a collapsible wall, a sluice, a second door they have to find first.`,
  },
  {
    id: "pillars-and-sight",
    label: "Broken sightlines",
    kinds: ["any", "dungeon", "ruin", "keep"],
    text: (n) =>
      `Lay out ${n} as a large hall broken by pillars and half-walls so nobody can see the whole room from any square. Reward movement and flanking; punish standing still in the open middle.`,
  },
  {
    id: "hazard-centre",
    label: "The dangerous middle",
    kinds: ["any", "cave", "dungeon", "ruin"],
    text: (n) =>
      `Lay out ${n} with a hazard occupying the centre — a pit, a fire, deep water, a broken floor — so the fastest route across the room is also the one that can kill you. Put the objective on the far side.`,
  },
  {
    id: "streets-and-roofs",
    label: "Streets and roofs",
    kinds: ["city", "town", "village", "any"],
    text: (n) =>
      `Lay out ${n} as three or four intersecting streets with solid buildings between them, plus roof access at two points. Crowd cover at ground level, clear lines from above, and one alley that is a dead end.`,
  },
  {
    id: "slope",
    label: "The whole map tilts",
    kinds: ["wilderness", "cave", "ruin", "any"],
    text: (n) =>
      `Lay out ${n} on a continuous slope so one side always holds the high ground. Give the low side broken cover and one flanking path that climbs out of sight.`,
  },
  {
    id: "ambush-shape",
    label: "Built for an ambush",
    kinds: ["wilderness", "camp", "cave", "any"],
    text: (n) =>
      `Lay out ${n} so the obvious route through is overlooked from two hidden positions. Mark where the ambushers wait, where their line of retreat runs, and the one square from which the party could spot them early.`,
  },
  {
    id: "collapsing",
    label: "It is coming apart",
    kinds: ["ruin", "dungeon", "cave", "any"],
    text: (n) =>
      `Lay out ${n} as a structurally failing space: rubble piles, floor sections that will not take weight, a ceiling that has already come down in one place. Include which squares fail and what is below them.`,
  },
  {
    id: "ring-defence",
    label: "Layered defence",
    kinds: ["keep", "camp", "town", "any"],
    text: (n) =>
      `Lay out ${n} as concentric layers — outer barrier, open ground, inner strongpoint. Defenders have prepared positions and an alarm; attackers have exactly one weakness in the outer layer to find.`,
  },
  {
    id: "dark-and-close",
    label: "Dark and close",
    kinds: ["cave", "dungeon", "any"],
    text: (n) =>
      `Lay out ${n} as tight, twisting, low-visibility ground where light sources decide the fight. Fog of war on. Few squares of straight sightline, several places for something large to be waiting.`,
  },
  {
    id: "water-line",
    label: "Water across the middle",
    kinds: ["wilderness", "cave", "ruin", "any"],
    text: (n) =>
      `Lay out ${n} with water dividing the space — a ford, a river, a flooded floor. Crossing is slow and exposed; there is one bridge, and one place shallow enough to risk.`,
  },
  {
    id: "trapped-approach",
    label: "Trapped approach",
    kinds: ["dungeon", "ruin", "keep", "any"],
    text: (n) =>
      `Lay out ${n} so the approach corridor is trapped and the defenders know exactly where the traps are. Give me the spot DCs, disable DCs, and how the defenders use the delay.`,
  },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministically choose a layout directive for a tactical map. */
export function pickMapSeed(mapId: string, name: string, kind: MapKind | "any" = "any"): string {
  const pool = MAP_SEEDS.filter((s) => s.kinds.includes(kind) || s.kinds.includes("any"));
  const list = pool.length ? pool : MAP_SEEDS;
  return list[hash(mapId) % list.length]!.text(name || "this map");
}
