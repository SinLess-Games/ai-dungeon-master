/** Deterministic-ish starter world generator: regions, sites, roads, factions. */

import { emptyWorld, type SiteKind, type TerrainKind, type World } from "./world";
import { newId } from "./storage";

const REGION_NAMES = [
  "Greenmarch",
  "Ashen Reach",
  "Wyrmspine",
  "Saltmere",
  "Thornwood",
  "Sunder Waste",
  "Palefrost",
  "Verdant Deep",
];

const SITE_NAMES = [
  "Aldervale",
  "Ninehearth",
  "Blackford",
  "Stonewatch",
  "Gullhaven",
  "Redcairn",
  "Emberfall",
  "Duskwell",
  "Vaultgate",
  "Highmoor",
];

const DUNGEON_NAMES = [
  "The Sunken Vault",
  "Barrow of the Ninth King",
  "Hollow of Broken Wings",
  "The Rustworks",
];

const FACTIONS = [
  { name: "The Gilded Compact", description: "Merchant princes who buy law by the yard." },
  { name: "Order of the Pale Lantern", description: "Monster hunters, zealous and underfunded." },
  { name: "The Hollow Court", description: "Fey nobility that collects favours, never coin." },
  { name: "Ashguard Legion", description: "Veteran soldiery holding a border nobody funds." },
];

const GODS = [
  { name: "Aureth", domain: "Sun, oaths, healing", alignment: "NG" },
  { name: "Vashken", domain: "Storms, war, courage", alignment: "CN" },
  { name: "Mora", domain: "Death, memory, endings", alignment: "LN" },
  { name: "The Quiet Third", domain: "Secrets, thresholds, madness", alignment: "CE" },
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length]!;
}

export function starterWorld(id: string, name: string, themes: string[] = []): World {
  const world = emptyWorld(id, name);
  world.themes = themes;
  world.description =
    "A freshly drawn frontier: a walled capital, roads that end in rumour, and a dungeon somebody sealed for a reason.";

  const terrains: TerrainKind[] = ["plains", "forest", "hills", "mountains", "swamp", "coast"];
  const layout = [
    { x: 4, y: 6, w: 30, h: 26 },
    { x: 36, y: 4, w: 28, h: 22 },
    { x: 66, y: 8, w: 28, h: 26 },
    { x: 6, y: 36, w: 32, h: 28 },
    { x: 40, y: 30, w: 26, h: 24 },
    { x: 68, y: 38, w: 26, h: 26 },
  ];
  world.regions = layout.map((rect, i) => ({
    id: newId(),
    name: pick(REGION_NAMES, i),
    terrain: pick(terrains, i),
    ...rect,
  }));

  const siteSpecs: { kind: SiteKind; x: number; y: number }[] = [
    { kind: "city", x: 48, y: 16 },
    { kind: "town", x: 20, y: 22 },
    { kind: "village", x: 24, y: 50 },
    { kind: "port", x: 80, y: 22 },
    { kind: "keep", x: 56, y: 42 },
    { kind: "dungeon", x: 78, y: 52 },
    { kind: "ruin", x: 14, y: 12 },
  ];
  world.sites = siteSpecs.map((s, i) => ({
    id: newId(),
    name: s.kind === "dungeon" ? pick(DUNGEON_NAMES, i) : pick(SITE_NAMES, i),
    kind: s.kind,
    x: s.x,
    y: s.y,
    discovered: i < 3,
    description:
      s.kind === "dungeon"
        ? "Sealed generations ago. The seals are failing."
        : "A place with more history than coin.",
  }));

  const capital = world.sites[0]!;
  world.routes = world.sites.slice(1, 5).map((s) => ({
    id: newId(),
    fromSiteId: capital.id,
    toSiteId: s.id,
    kind: "road" as const,
  }));

  world.factions = FACTIONS.map((f) => ({ id: newId(), standing: 0, ...f }));
  world.pantheon = GODS.map((g) => ({ id: newId(), ...g }));
  world.history = [
    { id: newId(), name: "The Long Crown", summary: "A single dynasty held the roads for four centuries." },
    { id: newId(), name: "The Sundering", summary: "Something under the mountains woke and the maps stopped agreeing." },
    { id: newId(), name: "Now", summary: "Petty lords, hungry guilds, and open dungeons." },
  ];
  world.party = { x: capital.x, y: capital.y, siteId: capital.id };
  return world;
}
