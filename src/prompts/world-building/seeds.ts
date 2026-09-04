/**
 * Randomised world seeds. Each seed is a directive handed to the world-smith so
 * two worlds built with the same themes still come out different. Picks are
 * deterministic per world id so reopening a world does not reshuffle it.
 */

type Theme =
  | "any"
  | "dark"
  | "whimsical"
  | "grand"
  | "wilderness"
  | "urban"
  | "nautical"
  | "planar"
  | "frontier";

interface WorldSeed {
  id: string;
  label: string;
  themes: Theme[];
  text: (name: string) => string;
}

export const WORLD_SEEDS: WorldSeed[] = [
  {
    id: "after-the-fall",
    label: "After the fall",
    themes: ["any", "dark", "grand", "frontier"],
    text: (n) =>
      `Build ${n} as a land living in the wreckage of something enormous that ended a generation ago. Every region should carry one physical scar from it, and the people should disagree about whose fault it was. Nobody in power was innocent.`,
  },
  {
    id: "borderlands-under-pressure",
    label: "Borderlands under pressure",
    themes: ["any", "frontier", "wilderness"],
    text: (n) =>
      `Build ${n} as a frontier where settled land meets something that will not stay pushed back. Put the safe towns along one edge, thin them out toward the wild, and make the last outpost a place people are paid too much to live in.`,
  },
  {
    id: "many-crowns",
    label: "Too many crowns",
    themes: ["any", "grand", "urban"],
    text: (n) =>
      `Build ${n} around a succession nobody can settle. Three or four powers each hold a legitimate claim, each controls different terrain and resources, and each has already done something unforgivable. War has not started yet. It is weeks away.`,
  },
  {
    id: "drowned-coast",
    label: "The drowned coast",
    themes: ["nautical", "dark", "any"],
    text: (n) =>
      `Build ${n} as a coastline where the sea has been taking land for a century. Ports move inland, old towns stand in the shallows, and salvage is the biggest industry. Something under the water is doing this on purpose.`,
  },
  {
    id: "buried-machine",
    label: "The buried thing",
    themes: ["any", "grand", "dark"],
    text: (n) =>
      `Build ${n} on top of something vast and buried — a structure, a body, or an engine — that predates every nation on the map. Roads, cities and borders should all be shaped by it without anyone admitting so. Only one faction knows what it is.`,
  },
  {
    id: "trade-web",
    label: "The trade web",
    themes: ["urban", "any", "nautical"],
    text: (n) =>
      `Build ${n} as a network of city-states bound by one dependency they all share and none can produce alone. Rivers, roads and sea lanes carry it. Whoever cuts a route starts a war, so everyone fights with money, law and knives instead.`,
  },
  {
    id: "cold-year",
    label: "The long cold",
    themes: ["any", "dark", "wilderness"],
    text: (n) =>
      `Build ${n} in the third year of a winter that should have broken. Harvests are gone, herds are moving, and old borders mean nothing next to who holds a warm valley. Give me one place where it is inexplicably still summer.`,
  },
  {
    id: "gods-answering",
    label: "Gods still answering",
    themes: ["any", "grand", "whimsical"],
    text: (n) =>
      `Build ${n} as a world where the gods intervene visibly and often, and it is a problem. Temples function as governments, miracles are contested evidence, and at least two deities are actively working against each other through their followers.`,
  },
  {
    id: "quiet-country",
    label: "Quiet country, loud secret",
    themes: ["any", "whimsical", "wilderness"],
    text: (n) =>
      `Build ${n} as a pleasant, prosperous, well-governed land — genuinely nice to travel in. Bury one arrangement underneath it that keeps it that way and that decent people would refuse to accept if they understood it.`,
  },
  {
    id: "thin-walls",
    label: "Thin walls",
    themes: ["planar", "any", "dark"],
    text: (n) =>
      `Build ${n} where the boundary to other planes is worn through in specific, mapped places. Towns grow around the useful breaches and quarantine the rest. Local law, trade and religion should all have adapted to that fact.`,
  },
  {
    id: "roads-of-the-dead",
    label: "Roads of the dead",
    themes: ["dark", "any"],
    text: (n) =>
      `Build ${n} as a land where the dead do not stay put and everyone has practical, unromantic customs for it. Grave-roads, night curfews, licensed diggers. Make one region that has stopped bothering, and show what that costs them.`,
  },
  {
    id: "young-world",
    label: "Newly opened land",
    themes: ["frontier", "wilderness", "any"],
    text: (n) =>
      `Build ${n} as land that was unreachable until recently and is now being carved up fast. Charters, claim-jumpers, and people already living there who were never asked. Maps should be wrong on purpose in at least one place.`,
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

function themeTags(themes: string[]): Theme[] {
  const tags = new Set<Theme>(["any"]);
  for (const t of themes) {
    const s = t.toLowerCase();
    if (s.includes("grim") || s.includes("gothic") || s.includes("horror")) tags.add("dark");
    if (s.includes("fairytale")) tags.add("whimsical");
    if (s.includes("mythic") || s.includes("high fantasy") || s.includes("epic")) tags.add("grand");
    if (s.includes("nautical")) tags.add("nautical");
    if (s.includes("planar")) tags.add("planar");
    if (s.includes("frontier") || s.includes("post-apoc")) tags.add("frontier");
    if (s.includes("sword") || s.includes("science")) tags.add("wilderness");
  }
  return [...tags];
}

/** Deterministically choose a seed directive for a world. */
export function pickWorldSeed(worldId: string, name: string, themes: string[] = []): string {
  const tags = themeTags(themes);
  const pool = WORLD_SEEDS.filter((s) => s.themes.some((t) => tags.includes(t)));
  const list = pool.length ? pool : WORLD_SEEDS;
  return list[hash(worldId) % list.length]!.text(name || "this world");
}
