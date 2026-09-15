export const WORLD_ATLAS_VERSION = 1;
export const WORLD_ATLAS_GENERATOR_VERSION = "campaign-atlas-v1";

export type AtlasBiome =
  | "temperate"
  | "forest"
  | "tundra"
  | "desert"
  | "steppe"
  | "swamp"
  | "jungle"
  | "highlands"
  | "badlands"
  | "enchanted";

export type AtlasPlaceKind =
  | "capital"
  | "city"
  | "town"
  | "village"
  | "hamlet"
  | "port"
  | "fort"
  | "castle"
  | "dungeon"
  | "ruin"
  | "temple"
  | "tower"
  | "mine"
  | "cave"
  | "landmark"
  | "planar-gate";

export type AtlasPathKind = "road" | "trail" | "sea-route";

export interface AtlasPoint {
  x: number;
  y: number;
}

export interface AtlasLandmass {
  id: string;
  name: string;
  points: AtlasPoint[];
  center: AtlasPoint;
  radiusX: number;
  radiusY: number;
  biome: AtlasBiome;
}

export interface AtlasRegion {
  id: string;
  landmassId: string;
  name: string;
  center: AtlasPoint;
  biome: AtlasBiome;
  importance: number;
}

export interface AtlasMountainRange {
  id: string;
  name: string;
  landmassId: string;
  points: AtlasPoint[];
}

export interface AtlasRiver {
  id: string;
  name: string;
  landmassId: string;
  points: AtlasPoint[];
}

export interface AtlasPlace {
  id: string;
  landmassId: string;
  regionId: string | null;
  name: string;
  kind: AtlasPlaceKind;
  x: number;
  y: number;
  importance: number;
  population?: number;
  description: string;
  tags: string[];
}

export interface AtlasPath {
  id: string;
  kind: AtlasPathKind;
  fromPlaceId: string;
  toPlaceId: string;
  distanceMiles: number;
  points: AtlasPoint[];
}

export interface AtlasLegendEntry {
  kind: AtlasPlaceKind | AtlasPathKind;
  label: string;
}

export interface WorldAtlasDocument {
  atlasVersion: number;
  generatorVersion: string;
  title: string;
  seed: string;
  widthMiles: number;
  heightMiles: number;
  northUp: true;
  landmasses: AtlasLandmass[];
  regions: AtlasRegion[];
  mountainRanges: AtlasMountainRange[];
  rivers: AtlasRiver[];
  places: AtlasPlace[];
  paths: AtlasPath[];
  legend: AtlasLegendEntry[];
  campaignDecisions: {
    templateId: string | null;
    styleIds: string[];
    structure: string | null;
    scale: string | null;
    pace: string | null;
    multiPlanar: boolean;
    epic: boolean;
  };
  metadata: {
    generatedAt: string;
    artDirection: "illustrated-fantasy-atlas";
    renderStatus: "pending" | "ready";
  };
}

export interface WorldAtlasGenerationInput {
  seed: string;
  title: string;
  templateId?: string | null;
  styleIds?: readonly string[];
  structure?: string | null;
  scale?: string | null;
  pace?: string | null;
  multiPlanar?: boolean;
  epic?: boolean;
  generatedAt?: string;
}

const BIOMES: readonly AtlasBiome[] = [
  "temperate",
  "forest",
  "tundra",
  "desert",
  "steppe",
  "swamp",
  "jungle",
  "highlands",
  "badlands",
  "enchanted",
];

const FIRST = [
  "Aer",
  "Ash",
  "Bal",
  "Bel",
  "Cael",
  "Cor",
  "Dra",
  "Eld",
  "Fal",
  "Galen",
  "Harth",
  "Ily",
  "Kor",
  "Lor",
  "Myr",
  "Nor",
  "Or",
  "Raven",
  "Syl",
  "Thal",
  "Val",
  "Vey",
  "Wyr",
  "Yar",
  "Zel",
] as const;

const MIDDLE = [
  "a",
  "ae",
  "an",
  "ar",
  "en",
  "er",
  "ia",
  "in",
  "ir",
  "or",
  "ra",
  "ri",
  "ro",
  "ul",
  "yr",
] as const;

const END = [
  "dor",
  "fall",
  "gard",
  "heim",
  "hold",
  "ia",
  "mere",
  "mont",
  "ora",
  "reach",
  "ren",
  "ria",
  "scar",
  "spire",
  "vale",
  "var",
  "watch",
  "wyn",
] as const;

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function choose<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function nameFor(seed: string, namespace: string, index: number): string {
  const random = mulberry32(hash32(`${seed}:${namespace}:${index}`));
  const first = choose(random, FIRST);
  const middle = random() > 0.46 ? choose(random, MIDDLE) : "";
  const end = choose(random, END);
  return `${first}${middle}${end}`;
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathDistance(points: readonly AtlasPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }
  return total;
}

function campaignHas(styles: ReadonlySet<string>, ...ids: string[]): boolean {
  return ids.some((id) => styles.has(id));
}

function worldDimensions(input: WorldAtlasGenerationInput): { width: number; height: number } {
  if (input.scale === "epic") return { width: 18_000, height: 10_000 };
  if (input.scale === "paragon") return { width: 15_500, height: 8_750 };
  return { width: 13_500, height: 7_600 };
}

function landmassCount(input: WorldAtlasGenerationInput, random: () => number): number {
  const styles = new Set(input.styleIds ?? []);
  const maritime =
    input.templateId === "isles-and-seas" || campaignHas(styles, "seafaring", "pirates");
  if (maritime) return 7 + Math.floor(random() * 3);
  if (input.templateId === "dangerous-frontier") return 4 + Math.floor(random() * 2);
  return 5 + Math.floor(random() * 3);
}

function generateLandmasses(
  input: WorldAtlasGenerationInput,
  width: number,
  height: number,
  random: () => number,
): AtlasLandmass[] {
  const count = landmassCount(input, random);
  const maritime =
    input.templateId === "isles-and-seas" ||
    campaignHas(new Set(input.styleIds ?? []), "seafaring", "pirates");
  const result: AtlasLandmass[] = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const columns = 3;
    const rows = Math.ceil(count / columns);
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const center = {
      x: clamp(
        column * cellWidth + cellWidth * (0.35 + random() * 0.3),
        width * 0.08,
        width * 0.92,
      ),
      y: clamp(
        row * cellHeight + cellHeight * (0.32 + random() * 0.36),
        height * 0.1,
        height * 0.9,
      ),
    };
    const radiusX =
      cellWidth * (maritime ? 0.22 + random() * 0.17 : 0.3 + random() * 0.2);
    const radiusY =
      cellHeight * (maritime ? 0.28 + random() * 0.2 : 0.36 + random() * 0.22);
    const vertices = 24 + Math.floor(random() * 14);
    const points: AtlasPoint[] = [];
    for (let pointIndex = 0; pointIndex < vertices; pointIndex += 1) {
      const angle = (pointIndex / vertices) * Math.PI * 2;
      const wobble = 0.72 + random() * 0.36;
      points.push({
        x: clamp(center.x + Math.cos(angle) * radiusX * wobble, 60, width - 60),
        y: clamp(center.y + Math.sin(angle) * radiusY * wobble, 60, height - 60),
      });
    }
    result.push({
      id: `land-${index + 1}`,
      name: nameFor(input.seed, "continent", index),
      points,
      center,
      radiusX,
      radiusY,
      biome: choose(random, BIOMES),
    });
  }
  return result;
}

function pointOnLand(random: () => number, landmass: AtlasLandmass, edge = 0.68): AtlasPoint {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * edge;
  return {
    x: landmass.center.x + Math.cos(angle) * landmass.radiusX * radius,
    y: landmass.center.y + Math.sin(angle) * landmass.radiusY * radius,
  };
}

function generateRegions(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  random: () => number,
): AtlasRegion[] {
  const regions: AtlasRegion[] = [];
  for (const landmass of landmasses) {
    const count = 3 + Math.floor(random() * 4);
    for (let index = 0; index < count; index += 1) {
      regions.push({
        id: `region-${regions.length + 1}`,
        landmassId: landmass.id,
        name: nameFor(input.seed, `region:${landmass.id}`, index),
        center: pointOnLand(random, landmass, 0.58),
        biome: random() > 0.55 ? choose(random, BIOMES) : landmass.biome,
        importance: 0.55 + random() * 0.45,
      });
    }
  }
  return regions;
}

function generateMountains(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  random: () => number,
): AtlasMountainRange[] {
  const ranges: AtlasMountainRange[] = [];
  for (const landmass of landmasses) {
    const count = 1 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const start = pointOnLand(random, landmass, 0.38);
      const angle = random() * Math.PI;
      const length = Math.min(landmass.radiusX, landmass.radiusY) * (0.45 + random() * 0.5);
      const points: AtlasPoint[] = [];
      const nodes = 5 + Math.floor(random() * 5);
      for (let node = 0; node < nodes; node += 1) {
        const ratio = node / Math.max(1, nodes - 1);
        points.push({
          x: start.x + Math.cos(angle) * length * (ratio - 0.5) + (random() - 0.5) * 90,
          y: start.y + Math.sin(angle) * length * (ratio - 0.5) + (random() - 0.5) * 90,
        });
      }
      ranges.push({
        id: `mountains-${ranges.length + 1}`,
        name: `The ${nameFor(input.seed, `mountains:${landmass.id}`, index)} Mountains`,
        landmassId: landmass.id,
        points,
      });
    }
  }
  return ranges;
}

function generateRivers(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  ranges: readonly AtlasMountainRange[],
  random: () => number,
): AtlasRiver[] {
  const rivers: AtlasRiver[] = [];
  for (const landmass of landmasses) {
    const localRanges = ranges.filter((range) => range.landmassId === landmass.id);
    const count = 2 + Math.floor(random() * 4);
    for (let index = 0; index < count; index += 1) {
      const range = choose(random, localRanges.length ? localRanges : ranges);
      const start = range?.points[Math.floor(random() * Math.max(1, range.points.length))] ?? landmass.center;
      const coastAngle = Math.atan2(start.y - landmass.center.y, start.x - landmass.center.x) +
        (random() - 0.5) * 1.4;
      const end = {
        x: landmass.center.x + Math.cos(coastAngle) * landmass.radiusX * 0.82,
        y: landmass.center.y + Math.sin(coastAngle) * landmass.radiusY * 0.82,
      };
      const points: AtlasPoint[] = [];
      const nodes = 6 + Math.floor(random() * 5);
      for (let node = 0; node < nodes; node += 1) {
        const ratio = node / Math.max(1, nodes - 1);
        points.push({
          x: start.x + (end.x - start.x) * ratio + Math.sin(ratio * Math.PI * 3) * (20 + random() * 35),
          y: start.y + (end.y - start.y) * ratio + Math.cos(ratio * Math.PI * 2) * (15 + random() * 30),
        });
      }
      rivers.push({
        id: `river-${rivers.length + 1}`,
        name: `${nameFor(input.seed, `river:${landmass.id}`, index)} River`,
        landmassId: landmass.id,
        points,
      });
    }
  }
  return rivers;
}

function placePlan(input: WorldAtlasGenerationInput): Record<AtlasPlaceKind, number> {
  const styles = new Set(input.styleIds ?? []);
  const plan: Record<AtlasPlaceKind, number> = {
    capital: 5,
    city: 10,
    town: 18,
    village: 18,
    hamlet: 10,
    port: 8,
    fort: 7,
    castle: 5,
    dungeon: 10,
    ruin: 12,
    temple: 7,
    tower: 5,
    mine: 6,
    cave: 8,
    landmark: 10,
    "planar-gate": input.multiPlanar || campaignHas(styles, "planar", "cosmic-horror") ? 4 : 0,
  };

  if (input.templateId === "dangerous-frontier" || campaignHas(styles, "exploration", "wilderness", "west-marches", "hexcrawl")) {
    plan.city -= 3;
    plan.town -= 4;
    plan.ruin += 8;
    plan.cave += 7;
    plan.landmark += 8;
  }
  if (input.templateId === "fractured-kingdoms" || campaignHas(styles, "political-intrigue", "war", "military")) {
    plan.capital += 2;
    plan.fort += 10;
    plan.castle += 7;
    plan.city += 5;
  }
  if (input.templateId === "ancient-ruins" || campaignHas(styles, "dungeon-crawl", "megadungeon", "sword-and-sorcery")) {
    plan.dungeon += 12;
    plan.ruin += 14;
    plan.tower += 5;
  }
  if (input.templateId === "wild-magic" || campaignHas(styles, "high-fantasy", "mythic")) {
    plan.temple += 5;
    plan.tower += 6;
    plan.landmark += 7;
  }
  if (input.templateId === "isles-and-seas" || campaignHas(styles, "seafaring", "pirates")) {
    plan.port += 16;
    plan.city += 3;
    plan.landmark += 4;
  }
  if (campaignHas(styles, "urban")) {
    plan.city += 12;
    plan.town += 8;
    plan.village -= 6;
  }
  if (campaignHas(styles, "gothic-horror", "dark-fantasy", "grimdark")) {
    plan.ruin += 6;
    plan.castle += 4;
    plan.temple += 3;
  }
  if (input.epic || input.scale === "epic") {
    plan.landmark += 8;
    plan.castle += 4;
    plan["planar-gate"] += 3;
  }

  for (const key of Object.keys(plan) as AtlasPlaceKind[]) {
    plan[key] = Math.max(0, plan[key]);
  }
  return plan;
}

function placeImportance(kind: AtlasPlaceKind, random: () => number): number {
  const base: Record<AtlasPlaceKind, number> = {
    capital: 1,
    city: 0.88,
    town: 0.7,
    village: 0.52,
    hamlet: 0.38,
    port: 0.74,
    fort: 0.68,
    castle: 0.78,
    dungeon: 0.62,
    ruin: 0.5,
    temple: 0.58,
    tower: 0.5,
    mine: 0.4,
    cave: 0.34,
    landmark: 0.66,
    "planar-gate": 0.8,
  };
  return clamp(base[kind] + (random() - 0.5) * 0.14, 0.2, 1);
}

function populationFor(kind: AtlasPlaceKind, random: () => number): number | undefined {
  switch (kind) {
    case "capital":
      return Math.round(18_000 + random() * 72_000);
    case "city":
      return Math.round(6_000 + random() * 28_000);
    case "port":
      return Math.round(2_500 + random() * 20_000);
    case "town":
      return Math.round(900 + random() * 5_000);
    case "village":
      return Math.round(120 + random() * 850);
    case "hamlet":
      return Math.round(25 + random() * 120);
    case "fort":
    case "castle":
      return Math.round(80 + random() * 1_100);
    default:
      return undefined;
  }
}

function describePlace(kind: AtlasPlaceKind, regionName: string, tags: readonly string[]): string {
  const subject: Record<AtlasPlaceKind, string> = {
    capital: "A major seat of power",
    city: "A large settlement",
    town: "A busy regional settlement",
    village: "A small settled community",
    hamlet: "A tiny rural settlement",
    port: "A coastal trade settlement",
    fort: "A fortified military holding",
    castle: "A defensible noble stronghold",
    dungeon: "A dangerous delve site",
    ruin: "The remains of an older age",
    temple: "A sacred or religious site",
    tower: "A prominent isolated tower",
    mine: "A worked mineral site",
    cave: "A notable cave system",
    landmark: "A major natural or supernatural landmark",
    "planar-gate": "A place where planar boundaries are thin",
  };
  const suffix = tags.length ? ` associated with ${tags.slice(0, 2).join(" and ")}` : "";
  return `${subject[kind]} in ${regionName}${suffix}.`;
}

function tagsFor(kind: AtlasPlaceKind, input: WorldAtlasGenerationInput): string[] {
  const styles = new Set(input.styleIds ?? []);
  const tags = [kind];
  if (campaignHas(styles, "war", "military") && ["fort", "castle", "city"].includes(kind)) tags.push("contested");
  if (campaignHas(styles, "mystery", "noir", "espionage") && ["city", "town", "port"].includes(kind)) tags.push("secrets");
  if (campaignHas(styles, "monster-hunting") && ["cave", "ruin", "dungeon", "landmark"].includes(kind)) tags.push("monster-territory");
  if (campaignHas(styles, "gothic-horror", "dark-fantasy") && ["ruin", "castle", "temple"].includes(kind)) tags.push("haunted");
  if (input.templateId === "wild-magic" && ["landmark", "tower", "planar-gate"].includes(kind)) tags.push("wild-magic");
  return tags;
}

function nearestRegion(point: AtlasPoint, landmassId: string, regions: readonly AtlasRegion[]): AtlasRegion | null {
  let selected: AtlasRegion | null = null;
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (const region of regions) {
    if (region.landmassId !== landmassId) continue;
    const next = distance(point, region.center);
    if (next < selectedDistance) {
      selected = region;
      selectedDistance = next;
    }
  }
  return selected;
}

function generatePlaces(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  regions: readonly AtlasRegion[],
  random: () => number,
): AtlasPlace[] {
  const plan = placePlan(input);
  const places: AtlasPlace[] = [];
  for (const [kind, count] of Object.entries(plan) as Array<[AtlasPlaceKind, number]>) {
    for (let index = 0; index < count; index += 1) {
      const landmass = choose(random, landmasses);
      const point = pointOnLand(random, landmass, kind === "port" ? 0.82 : 0.68);
      const region = nearestRegion(point, landmass.id, regions);
      const tags = tagsFor(kind, input);
      places.push({
        id: `place-${places.length + 1}`,
        landmassId: landmass.id,
        regionId: region?.id ?? null,
        name: nameFor(input.seed, `place:${kind}`, index),
        kind,
        x: point.x,
        y: point.y,
        importance: placeImportance(kind, random),
        ...(populationFor(kind, random) === undefined
          ? {}
          : { population: populationFor(kind, random) }),
        description: describePlace(kind, region?.name ?? landmass.name, tags),
        tags,
      });
    }
  }
  return places;
}

function connectPlaces(
  kind: AtlasPathKind,
  candidates: readonly AtlasPlace[],
  maxConnections: number,
): AtlasPath[] {
  const paths: AtlasPath[] = [];
  const keys = new Set<string>();
  for (const place of candidates) {
    const nearby = candidates
      .filter((candidate) => candidate.id !== place.id)
      .map((candidate) => ({ candidate, distance: distance(place, candidate) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxConnections);
    for (const entry of nearby) {
      const key = [place.id, entry.candidate.id].sort().join(":");
      if (keys.has(key)) continue;
      keys.add(key);
      const midpoint = {
        x: (place.x + entry.candidate.x) / 2,
        y: (place.y + entry.candidate.y) / 2,
      };
      const points = [
        { x: place.x, y: place.y },
        midpoint,
        { x: entry.candidate.x, y: entry.candidate.y },
      ];
      paths.push({
        id: `path-${kind}-${paths.length + 1}`,
        kind,
        fromPlaceId: place.id,
        toPlaceId: entry.candidate.id,
        distanceMiles: Math.max(1, Math.round(pathDistance(points))),
        points,
      });
    }
  }
  return paths;
}

function generatePaths(places: readonly AtlasPlace[]): AtlasPath[] {
  const settlements = places.filter((place) =>
    ["capital", "city", "town", "village", "fort", "castle"].includes(place.kind),
  );
  const localRoads = connectPlaces("road", settlements, 2).filter((path) => {
    const from = places.find((place) => place.id === path.fromPlaceId);
    const to = places.find((place) => place.id === path.toPlaceId);
    return from?.landmassId === to?.landmassId;
  });
  const trails = connectPlaces(
    "trail",
    places.filter((place) => ["dungeon", "ruin", "temple", "tower", "mine", "cave"].includes(place.kind)),
    1,
  );
  const seaRoutes = connectPlaces(
    "sea-route",
    places.filter((place) => place.kind === "port"),
    2,
  );
  return [...localRoads, ...trails, ...seaRoutes];
}

const LEGEND_LABELS: Record<AtlasPlaceKind | AtlasPathKind, string> = {
  capital: "Capital",
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Hamlet",
  port: "Port",
  fort: "Fort",
  castle: "Castle",
  dungeon: "Dungeon",
  ruin: "Ruin",
  temple: "Temple",
  tower: "Tower",
  mine: "Mine",
  cave: "Cave",
  landmark: "Landmark",
  "planar-gate": "Planar Gate",
  road: "Road",
  trail: "Trail",
  "sea-route": "Sea Route",
};

function buildLegend(places: readonly AtlasPlace[], paths: readonly AtlasPath[]): AtlasLegendEntry[] {
  const used = new Set<AtlasPlaceKind | AtlasPathKind>();
  for (const place of places) used.add(place.kind);
  for (const path of paths) used.add(path.kind);
  return [...used]
    .sort((a, b) => LEGEND_LABELS[a].localeCompare(LEGEND_LABELS[b]))
    .map((kind) => ({ kind, label: LEGEND_LABELS[kind] }));
}

export function generateWorldAtlas(input: WorldAtlasGenerationInput): WorldAtlasDocument {
  const seed = input.seed.trim();
  if (!seed) throw new RangeError("World atlas generation requires a non-empty seed.");
  const random = mulberry32(hash32(`${seed}:${WORLD_ATLAS_GENERATOR_VERSION}`));
  const dimensions = worldDimensions(input);
  const landmasses = generateLandmasses(input, dimensions.width, dimensions.height, random);
  const regions = generateRegions(input, landmasses, random);
  const mountainRanges = generateMountains(input, landmasses, random);
  const rivers = generateRivers(input, landmasses, mountainRanges, random);
  const places = generatePlaces(input, landmasses, regions, random);
  const paths = generatePaths(places);

  return {
    atlasVersion: WORLD_ATLAS_VERSION,
    generatorVersion: WORLD_ATLAS_GENERATOR_VERSION,
    title: input.title,
    seed,
    widthMiles: dimensions.width,
    heightMiles: dimensions.height,
    northUp: true,
    landmasses,
    regions,
    mountainRanges,
    rivers,
    places,
    paths,
    legend: buildLegend(places, paths),
    campaignDecisions: {
      templateId: input.templateId ?? null,
      styleIds: [...(input.styleIds ?? [])],
      structure: input.structure ?? null,
      scale: input.scale ?? null,
      pace: input.pace ?? null,
      multiPlanar: input.multiPlanar ?? false,
      epic: input.epic ?? false,
    },
    metadata: {
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      artDirection: "illustrated-fantasy-atlas",
      renderStatus: "pending",
    },
  };
}

export function isWorldAtlasDocument(value: unknown): value is WorldAtlasDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<WorldAtlasDocument>;
  return (
    record.atlasVersion === WORLD_ATLAS_VERSION &&
    typeof record.title === "string" &&
    typeof record.widthMiles === "number" &&
    typeof record.heightMiles === "number" &&
    Array.isArray(record.landmasses) &&
    Array.isArray(record.places) &&
    Array.isArray(record.paths)
  );
}

export function atlasSearchText(atlas: WorldAtlasDocument): Array<{
  id: string;
  text: string;
  metadata: Record<string, string | number | boolean>;
}> {
  const regions = atlas.regions.map((region) => ({
    id: `region:${region.id}`,
    text: `${region.name}. ${region.biome} region in ${atlas.title}.`,
    metadata: {
      entityType: "region",
      entityId: region.id,
      name: region.name,
      worldTitle: atlas.title,
    },
  }));
  const places = atlas.places.map((place) => ({
    id: `place:${place.id}`,
    text: `${place.name}. ${place.description} Tags: ${place.tags.join(", ")}.`,
    metadata: {
      entityType: "place",
      entityId: place.id,
      name: place.name,
      kind: place.kind,
      worldTitle: atlas.title,
    },
  }));
  return [...regions, ...places];
}

export function hashedAtlasEmbedding(text: string, dimensions = 64): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const token of text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    const hash = hash32(token);
    const index = hash % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[index] = (vector[index] ?? 0) + sign;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}
