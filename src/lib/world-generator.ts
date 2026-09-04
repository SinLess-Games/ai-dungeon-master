/** Randomised starter world generator: regions, sites, roads, factions. */

import { emptyWorld, type SiteKind, type TerrainKind, type World } from "./world";
import { newId } from "./storage";

/* ------------------------------------------------------------------ random */

function makeRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // extra entropy so two worlds made in the same session never match
  h ^= Math.floor(Math.random() * 0xffffffff);
  let s = h >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

type Rng = () => number;
const int = (r: Rng, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const take = <T,>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length)]!;
function shuffle<T>(r: Rng, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/* -------------------------------------------------------------------- names */

const REGION_A = [
  "Green", "Ashen", "Wyrm", "Salt", "Thorn", "Sunder", "Pale", "Verdant", "Iron", "Storm",
  "Grey", "Ember", "Mourn", "Bright", "Hollow", "Rime", "Gloam", "Amber", "Black", "Silver",
];
const REGION_B = [
  "march", "reach", "spine", "mere", "wood", "waste", "frost", "deep", "fen", "vale",
  "hollow", "moor", "expanse", "downs", "wilds", "barrens", "hills", "coast", "shard", "run",
];
const SITE_A = [
  "Alder", "Nine", "Black", "Stone", "Gull", "Red", "Ember", "Dusk", "Vault", "High",
  "Cold", "Bram", "Fen", "Oak", "Wind", "Grim", "Well", "Hart", "Mist", "Kestrel",
];
const SITE_B = [
  "vale", "hearth", "ford", "watch", "haven", "cairn", "fall", "well", "gate", "moor",
  "bridge", "crest", "hold", "barrow", "mill", "reach", "stead", "keep", "port", "row",
];
const DUNGEON_A = ["Sunken", "Broken", "Hollow", "Rusted", "Weeping", "Buried", "Shattered", "Forgotten"];
const DUNGEON_B = [
  "Vault", "Barrow", "Warrens", "Works", "Halls", "Crypt", "Cistern", "Labyrinth",
];

const FACTIONS = [
  { name: "The Gilded Compact", description: "Merchant princes who buy law by the yard." },
  { name: "Order of the Pale Lantern", description: "Monster hunters, zealous and underfunded." },
  { name: "The Hollow Court", description: "Fey nobility that collects favours, never coin." },
  { name: "Ashguard Legion", description: "Veteran soldiery holding a border nobody funds." },
  { name: "The Quiet Ledger", description: "Information brokers who never forget a debt." },
  { name: "Cinderhand Cabal", description: "Wizards who consider laws a temporary condition." },
  { name: "The Drowned Fleet", description: "Free captains who tax every coast they visit." },
  { name: "Wardens of the Deeproot", description: "Druids holding the treeline against the plough." },
];

const GODS = [
  { name: "Aureth", domain: "Sun, oaths, healing", alignment: "NG" },
  { name: "Vashken", domain: "Storms, war, courage", alignment: "CN" },
  { name: "Mora", domain: "Death, memory, endings", alignment: "LN" },
  { name: "The Quiet Third", domain: "Secrets, thresholds, madness", alignment: "CE" },
  { name: "Halvenne", domain: "Harvest, hearth, mercy", alignment: "NG" },
  { name: "Kor-Ushal", domain: "Stone, craft, debt", alignment: "LN" },
  { name: "Sethriel", domain: "Stars, fate, travel", alignment: "N" },
  { name: "The Red Hound", domain: "Hunt, blood, vengeance", alignment: "CE" },
];

const HISTORY = [
  { name: "The Long Crown", summary: "A single dynasty held the roads for four centuries." },
  { name: "The Sundering", summary: "Something under the mountains woke and the maps stopped agreeing." },
  { name: "The Salt Years", summary: "A sea rose where farmland was, and never went back." },
  { name: "The Ember War", summary: "Two kingdoms burned each other's granaries and both lost." },
  { name: "The Silence", summary: "For one year no god answered any prayer. Nobody agrees why." },
  { name: "The Broken Concord", summary: "The old alliance died over a border nobody can now find." },
];

/* ---------------------------------------------------------------- generator */

/** Cut the map into an irregular patchwork of region rects. */
function carveRegions(r: Rng, count: number) {
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : int(r, 3, 4);
  const rows = Math.ceil(count / cols);
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const cw = 96 / cols;
    const ch = 64 / rows;
    const jx = (r() - 0.5) * cw * 0.25;
    const jy = (r() - 0.5) * ch * 0.25;
    rects.push({
      x: Math.max(2, 2 + cx * cw + jx),
      y: Math.max(2, 4 + cy * ch + jy),
      w: cw * (0.75 + r() * 0.4),
      h: ch * (0.75 + r() * 0.4),
    });
  }
  return rects;
}

const TERRAIN_POOLS: Record<string, TerrainKind[]> = {
  temperate: ["plains", "forest", "hills", "mountains", "coast", "swamp"],
  frozen: ["tundra", "mountains", "hills", "plains", "coast", "forest"],
  arid: ["desert", "wasteland", "hills", "plains", "mountains", "coast"],
  tropical: ["jungle", "swamp", "coast", "hills", "plains", "mountains"],
  blighted: ["wasteland", "swamp", "mountains", "plains", "underdark", "hills"],
};

export function starterWorld(id: string, name: string, themes: string[] = []): World {
  const r = makeRng(`${id}|${name}|${themes.join(",")}`);
  const world = emptyWorld(id, name);
  world.themes = themes;

  const climate = take(r, Object.keys(TERRAIN_POOLS));
  const terrains = shuffle(r, TERRAIN_POOLS[climate]!);

  world.description = take(r, [
    "A freshly drawn frontier: a walled capital, roads that end in rumour, and a dungeon somebody sealed for a reason.",
    "Old empire, new cracks. The roads are patrolled in daylight only, and the maps are ten years out of date.",
    "A land of small, jealous holds strung between wilderness that nobody has surveyed twice.",
    "Trade keeps this place alive and trade is being strangled somewhere upriver.",
    "The border moved and left half the settlements on the wrong side of it.",
  ]);

  const regionNames = shuffle(r, REGION_A);
  const regionTails = shuffle(r, REGION_B);
  const rects = carveRegions(r, int(r, 5, 8));
  world.regions = rects.map((rect, i) => ({
    id: newId(),
    name: `${regionNames[i % regionNames.length]}${regionTails[i % regionTails.length]}`,
    terrain: terrains[i % terrains.length]!,
    ...rect,
  }));

  const siteHeads = shuffle(r, SITE_A);
  const siteTails = shuffle(r, SITE_B);
  const kinds: SiteKind[] = ["city", "town", "town", "village", "village", "keep", "port", "ruin", "dungeon", "lair", "camp", "wonder"];
  const extra = shuffle(r, kinds.slice(3));
  const plan: SiteKind[] = ["city", "town", "village", ...extra.slice(0, int(r, 5, 9))];

  world.sites = plan.map((kind, i) => {
    const region = world.regions[int(r, 0, world.regions.length - 1)]!;
    const x = Math.min(97, Math.max(3, region.x + 4 + r() * Math.max(6, region.w - 8)));
    const y = Math.min(67, Math.max(3, region.y + 4 + r() * Math.max(6, region.h - 8)));
    const dungeonish = kind === "dungeon" || kind === "ruin" || kind === "lair";
    return {
      id: newId(),
      name: dungeonish
        ? `${take(r, ["The", "The"])} ${take(r, DUNGEON_A)} ${take(r, DUNGEON_B)}`
        : `${siteHeads[i % siteHeads.length]}${siteTails[i % siteTails.length]}`,
      kind,
      x,
      y,
      regionId: region.id,
      discovered: i < int(r, 2, 4),
      description: dungeonish
        ? take(r, [
            "Sealed generations ago. The seals are failing.",
            "Locals will guide you to the gate and no further.",
            "Something in there still keeps a schedule.",
          ])
        : take(r, [
            "A place with more history than coin.",
            "Prosperous, and nervous about staying that way.",
            "Half-emptied by a bad winter and worse taxes.",
            "Governed by whoever paid the garrison last.",
          ]),
    };
  });

  const capital = world.sites[0]!;
  const linked = shuffle(r, world.sites.slice(1)).slice(0, int(r, 3, 6));
  world.routes = linked.map((s) => ({
    id: newId(),
    fromSiteId: capital.id,
    toSiteId: s.id,
    kind: (r() < 0.2 ? "river" : r() < 0.3 ? "trail" : "road") as "road" | "trail" | "river",
  }));

  world.factions = shuffle(r, FACTIONS)
    .slice(0, int(r, 3, 5))
    .map((f) => ({ id: newId(), standing: 0, ...f }));
  world.pantheon = shuffle(r, GODS)
    .slice(0, int(r, 3, 6))
    .map((g) => ({ id: newId(), ...g }));
  world.history = [
    ...shuffle(r, HISTORY)
      .slice(0, int(r, 2, 3))
      .map((h) => ({ id: newId(), ...h })),
    { id: newId(), name: "Now", summary: "Petty lords, hungry guilds, and open dungeons." },
  ];
  world.party = { x: capital.x, y: capital.y, siteId: capital.id };
  return world;
}
