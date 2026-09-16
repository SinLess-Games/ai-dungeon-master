export const WORLD_ATLAS_VERSION = 1;
export const WORLD_ATLAS_GENERATOR_VERSION = "campaign-atlas-v2";

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

const MIDDLE = ["a", "ae", "an", "ar", "en", "er", "ia", "in", "ir", "or", "ra", "ri", "ro", "ul", "yr"] as const;
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

const SETTLEMENT_KINDS = new Set<AtlasPlaceKind>([
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
]);

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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function choose<T>(random: () => number, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError("Cannot choose from an empty collection.");
  return items[Math.floor(random() * items.length)]!;
}

function nameFor(seed: string, namespace: string, index: number): string {
  const random = mulberry32(hash32(`${seed}:${namespace}:${index}`));
  return `${choose(random, FIRST)}${random() > 0.46 ? choose(random, MIDDLE) : ""}${choose(random, END)}`;
}

function campaignHas(styles: ReadonlySet<string>, ...ids: string[]): boolean {
  return ids.some((id) => styles.has(id));
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

function dimensionsFor(input: WorldAtlasGenerationInput): { width: number; height: number } {
  if (input.scale === "epic") return { width: 18_000, height: 10_000 };
  if (input.scale === "paragon") return { width: 15_500, height: 8_750 };
  return { width: 13_500, height: 7_600 };
}

function coastlinePoints(input: {
  seed: string;
  landmassId: string;
  center: AtlasPoint;
  radiusX: number;
  radiusY: number;
  width: number;
  height: number;
}): AtlasPoint[] {
  const random = mulberry32(hash32(`${input.seed}:coast:${input.landmassId}`));
  const rotation = (random() - 0.5) * 0.56;
  const phase2 = random() * Math.PI * 2;
  const phase3 = random() * Math.PI * 2;
  const phase5 = random() * Math.PI * 2;
  const phase8 = random() * Math.PI * 2;
  const vertexCount = 64 + Math.floor(random() * 17);
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);

  return Array.from({ length: vertexCount }, (_, index) => {
    const angle = (index / vertexCount) * Math.PI * 2;
    const coast =
      1 +
      Math.sin(angle * 2 + phase2) * 0.1 +
      Math.sin(angle * 3 + phase3) * 0.06 +
      Math.sin(angle * 5 + phase5) * 0.035 +
      Math.sin(angle * 8 + phase8) * 0.02;
    const asymmetry = 1 + Math.sin(angle + phase3) * 0.035;
    const localX = Math.cos(angle) * input.radiusX * coast * asymmetry;
    const localY = Math.sin(angle) * input.radiusY * coast;
    const rotatedX = localX * cosRotation - localY * sinRotation;
    const rotatedY = localX * sinRotation + localY * cosRotation;
    return {
      x: clamp(input.center.x + rotatedX, 80, input.width - 80),
      y: clamp(input.center.y + rotatedY, 80, input.height - 80),
    };
  });
}

function makeLandmasses(
  input: WorldAtlasGenerationInput,
  width: number,
  height: number,
  random: () => number,
): AtlasLandmass[] {
  const styles = new Set(input.styleIds ?? []);
  const maritime = input.templateId === "isles-and-seas" || campaignHas(styles, "seafaring", "pirates");
  const count = maritime
    ? 6 + Math.floor(random() * 3)
    : input.templateId === "dangerous-frontier"
      ? 4 + Math.floor(random() * 2)
      : 5 + Math.floor(random() * 2);
  const columns = 3;
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const result: AtlasLandmass[] = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const center: AtlasPoint = {
      x: clamp(
        column * cellWidth + cellWidth * (0.4 + random() * 0.2),
        width * 0.08,
        width * 0.92,
      ),
      y: clamp(
        row * cellHeight + cellHeight * (0.38 + random() * 0.24),
        height * 0.1,
        height * 0.9,
      ),
    };
    const radiusX = cellWidth * (maritime ? 0.2 + random() * 0.11 : 0.25 + random() * 0.12);
    const radiusY = cellHeight * (maritime ? 0.24 + random() * 0.13 : 0.29 + random() * 0.13);
    const id = `land-${index + 1}`;
    result.push({
      id,
      name: nameFor(input.seed, "continent", index),
      points: coastlinePoints({ seed: input.seed, landmassId: id, center, radiusX, radiusY, width, height }),
      center,
      radiusX,
      radiusY,
      biome: choose(random, BIOMES),
    });
  }
  return result;
}

function pointOnLand(
  random: () => number,
  landmass: AtlasLandmass,
  maximumRadius = 0.68,
  minimumRadius = 0,
): AtlasPoint {
  const angle = random() * Math.PI * 2;
  const minimumSquared = minimumRadius * minimumRadius;
  const maximumSquared = maximumRadius * maximumRadius;
  const radius = Math.sqrt(minimumSquared + random() * (maximumSquared - minimumSquared));
  return {
    x: landmass.center.x + Math.cos(angle) * landmass.radiusX * radius,
    y: landmass.center.y + Math.sin(angle) * landmass.radiusY * radius,
  };
}

function makeRegions(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  random: () => number,
): AtlasRegion[] {
  const regions: AtlasRegion[] = [];
  for (const landmass of landmasses) {
    const count = 3 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      regions.push({
        id: `region-${regions.length + 1}`,
        landmassId: landmass.id,
        name: nameFor(input.seed, `region:${landmass.id}`, index),
        center: pointOnLand(random, landmass, 0.56),
        biome: random() > 0.6 ? choose(random, BIOMES) : landmass.biome,
        importance: 0.55 + random() * 0.45,
      });
    }
  }
  return regions;
}

function makeMountains(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  random: () => number,
): AtlasMountainRange[] {
  const ranges: AtlasMountainRange[] = [];
  for (const landmass of landmasses) {
    const count = 1 + Math.floor(random() * 2);
    for (let index = 0; index < count; index += 1) {
      const center = pointOnLand(random, landmass, 0.42);
      const angle = random() * Math.PI;
      const length = Math.min(landmass.radiusX, landmass.radiusY) * (0.38 + random() * 0.34);
      const nodes = 4 + Math.floor(random() * 3);
      const points = Array.from({ length: nodes }, (_, node): AtlasPoint => {
        const ratio = node / Math.max(1, nodes - 1) - 0.5;
        const lateral = (random() - 0.5) * Math.min(90, length * 0.12);
        return {
          x: center.x + Math.cos(angle) * length * ratio - Math.sin(angle) * lateral,
          y: center.y + Math.sin(angle) * length * ratio + Math.cos(angle) * lateral,
        };
      });
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

function makeRivers(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  ranges: readonly AtlasMountainRange[],
  random: () => number,
): AtlasRiver[] {
  const rivers: AtlasRiver[] = [];
  for (const landmass of landmasses) {
    const localRanges = ranges.filter((range) => range.landmassId === landmass.id);
    const count = 2 + Math.floor(random() * 2);
    for (let index = 0; index < count; index += 1) {
      const sourceRange = localRanges.length ? choose(random, localRanges) : null;
      const sourcePoints = sourceRange?.points ?? [];
      const start = sourcePoints.length ? choose(random, sourcePoints) : pointOnLand(random, landmass, 0.2);
      const angle =
        Math.atan2(start.y - landmass.center.y, start.x - landmass.center.x) +
        (random() - 0.5) * 1.1;
      const end: AtlasPoint = {
        x: landmass.center.x + Math.cos(angle) * landmass.radiusX * 0.78,
        y: landmass.center.y + Math.sin(angle) * landmass.radiusY * 0.78,
      };
      const nodeCount = 7 + Math.floor(random() * 3);
      const phase = random() * Math.PI * 2;
      const points = Array.from({ length: nodeCount }, (_, node): AtlasPoint => {
        const ratio = node / Math.max(1, nodeCount - 1);
        const meander = Math.sin(ratio * Math.PI * 3 + phase) * (18 + random() * 22);
        return {
          x: start.x + (end.x - start.x) * ratio - Math.sin(angle) * meander,
          y: start.y + (end.y - start.y) * ratio + Math.cos(angle) * meander,
        };
      });
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
    capital: 3,
    city: 5,
    town: 8,
    village: 9,
    hamlet: 4,
    port: 5,
    fort: 3,
    castle: 3,
    dungeon: 5,
    ruin: 6,
    temple: 3,
    tower: 3,
    mine: 2,
    cave: 4,
    landmark: 5,
    "planar-gate": input.multiPlanar || campaignHas(styles, "planar", "cosmic-horror") ? 2 : 0,
  };

  if (
    input.templateId === "dangerous-frontier" ||
    campaignHas(styles, "exploration", "wilderness", "west-marches", "hexcrawl")
  ) {
    plan.city -= 2;
    plan.town -= 2;
    plan.ruin += 4;
    plan.cave += 3;
    plan.landmark += 3;
  }
  if (
    input.templateId === "fractured-kingdoms" ||
    campaignHas(styles, "political-intrigue", "war", "military")
  ) {
    plan.capital += 1;
    plan.city += 3;
    plan.fort += 4;
    plan.castle += 3;
  }
  if (
    input.templateId === "ancient-ruins" ||
    campaignHas(styles, "dungeon-crawl", "megadungeon", "sword-and-sorcery")
  ) {
    plan.dungeon += 5;
    plan.ruin += 5;
    plan.tower += 2;
  }
  if (input.templateId === "wild-magic" || campaignHas(styles, "high-fantasy", "mythic")) {
    plan.temple += 2;
    plan.tower += 2;
    plan.landmark += 3;
  }
  if (input.templateId === "isles-and-seas" || campaignHas(styles, "seafaring", "pirates")) {
    plan.port += 8;
    plan.city += 2;
    plan.landmark += 2;
  }
  if (campaignHas(styles, "urban")) {
    plan.city += 6;
    plan.town += 4;
    plan.village -= 3;
  }
  if (campaignHas(styles, "gothic-horror", "dark-fantasy", "grimdark")) {
    plan.ruin += 3;
    plan.castle += 2;
    plan.temple += 1;
  }
  if (input.epic || input.scale === "epic") {
    plan.landmark += 4;
    plan.castle += 2;
    plan["planar-gate"] += 2;
  }
  for (const kind of Object.keys(plan) as AtlasPlaceKind[]) {
    plan[kind] = Math.max(0, plan[kind]);
  }
  return plan;
}

function nearestRegion(
  point: AtlasPoint,
  landmassId: string,
  regions: readonly AtlasRegion[],
): AtlasRegion | null {
  let selected: AtlasRegion | null = null;
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (const region of regions) {
    if (region.landmassId !== landmassId) continue;
    const nextDistance = distance(point, region.center);
    if (nextDistance < selectedDistance) {
      selected = region;
      selectedDistance = nextDistance;
    }
  }
  return selected;
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

function importanceFor(kind: AtlasPlaceKind, random: () => number): number {
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

function tagsFor(kind: AtlasPlaceKind, input: WorldAtlasGenerationInput): string[] {
  const styles = new Set(input.styleIds ?? []);
  const tags: string[] = [kind];
  if (campaignHas(styles, "war", "military") && ["fort", "castle", "city"].includes(kind)) {
    tags.push("contested");
  }
  if (
    campaignHas(styles, "mystery", "noir", "espionage") &&
    ["city", "town", "port"].includes(kind)
  ) {
    tags.push("secrets");
  }
  if (
    campaignHas(styles, "monster-hunting") &&
    ["cave", "ruin", "dungeon", "landmark"].includes(kind)
  ) {
    tags.push("monster-territory");
  }
  if (
    campaignHas(styles, "gothic-horror", "dark-fantasy") &&
    ["ruin", "castle", "temple"].includes(kind)
  ) {
    tags.push("haunted");
  }
  if (
    input.templateId === "wild-magic" &&
    ["landmark", "tower", "planar-gate"].includes(kind)
  ) {
    tags.push("wild-magic");
  }
  return tags;
}

function descriptionFor(kind: AtlasPlaceKind, regionName: string, tags: readonly string[]): string {
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
  const detail = tags.length > 1 ? ` associated with ${tags.slice(1, 3).join(" and ")}` : "";
  return `${subject[kind]} in ${regionName}${detail}.`;
}

function pointForKind(
  random: () => number,
  landmass: AtlasLandmass,
  kind: AtlasPlaceKind,
): AtlasPoint {
  if (kind === "port") return pointOnLand(random, landmass, 0.78, 0.69);
  if (kind === "capital" || kind === "city") return pointOnLand(random, landmass, 0.57, 0.08);
  if (kind === "town" || kind === "village" || kind === "hamlet") {
    return pointOnLand(random, landmass, 0.66, 0.08);
  }
  return pointOnLand(random, landmass, 0.72, 0.12);
}

function placeSpacing(landmass: AtlasLandmass, kind: AtlasPlaceKind): number {
  const base = Math.min(landmass.radiusX, landmass.radiusY);
  return base * (SETTLEMENT_KINDS.has(kind) ? 0.12 : 0.09);
}

function shuffledLandmasses(
  seed: string,
  kind: AtlasPlaceKind,
  landmasses: readonly AtlasLandmass[],
): AtlasLandmass[] {
  return [...landmasses]
    .map((landmass) => ({
      landmass,
      order: hash32(`${seed}:distribution:${kind}:${landmass.id}`),
    }))
    .sort((left, right) => left.order - right.order)
    .map(({ landmass }) => landmass);
}

function makePlaces(
  input: WorldAtlasGenerationInput,
  landmasses: readonly AtlasLandmass[],
  regions: readonly AtlasRegion[],
  random: () => number,
): AtlasPlace[] {
  const places: AtlasPlace[] = [];
  const plan = placePlan(input);

  for (const kind of Object.keys(plan) as AtlasPlaceKind[]) {
    const count = kind === "capital" ? Math.min(plan[kind], landmasses.length) : plan[kind];
    const distribution = shuffledLandmasses(input.seed, kind, landmasses);
    for (let index = 0; index < count; index += 1) {
      const landmass = distribution[index % distribution.length]!;
      const minimumSpacing = placeSpacing(landmass, kind);
      let point = pointForKind(random, landmass, kind);
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = pointForKind(random, landmass, kind);
        const crowded = places.some(
          (place) =>
            place.landmassId === landmass.id &&
            distance(candidate, { x: place.x, y: place.y }) < minimumSpacing,
        );
        point = candidate;
        if (!crowded) break;
      }
      const region = nearestRegion(point, landmass.id, regions);
      const tags = tagsFor(kind, input);
      const population = populationFor(kind, random);
      places.push({
        id: `place-${places.length + 1}`,
        landmassId: landmass.id,
        regionId: region?.id ?? null,
        name: nameFor(input.seed, `place:${kind}`, index),
        kind,
        x: point.x,
        y: point.y,
        importance: importanceFor(kind, random),
        ...(population === undefined ? {} : { population }),
        description: descriptionFor(kind, region?.name ?? landmass.name, tags),
        tags,
      });
    }
  }
  return places;
}

function pathKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join(":");
}

function curvedPathPoints(
  seed: string,
  kind: AtlasPathKind,
  from: AtlasPlace,
  to: AtlasPlace,
): AtlasPoint[] {
  const random = mulberry32(hash32(`${seed}:path:${kind}:${pathKey(from.id, to.id)}`));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const perpendicular = { x: -dy / length, y: dx / length };
  const bend = (random() - 0.5) * length * (kind === "sea-route" ? 0.22 : 0.12);
  return [
    { x: from.x, y: from.y },
    {
      x: from.x + dx * 0.34 + perpendicular.x * bend,
      y: from.y + dy * 0.34 + perpendicular.y * bend,
    },
    {
      x: from.x + dx * 0.68 - perpendicular.x * bend * 0.55,
      y: from.y + dy * 0.68 - perpendicular.y * bend * 0.55,
    },
    { x: to.x, y: to.y },
  ];
}

function addPath(
  paths: AtlasPath[],
  seen: Set<string>,
  seed: string,
  kind: AtlasPathKind,
  from: AtlasPlace,
  to: AtlasPlace,
): void {
  const key = pathKey(from.id, to.id);
  if (from.id === to.id || seen.has(key)) return;
  seen.add(key);
  const points = curvedPathPoints(seed, kind, from, to);
  paths.push({
    id: `path-${kind}-${paths.length + 1}`,
    kind,
    fromPlaceId: from.id,
    toPlaceId: to.id,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
    points,
  });
}

function closestPair(
  remaining: readonly AtlasPlace[],
  connected: readonly AtlasPlace[],
): { from: AtlasPlace; to: AtlasPlace } | null {
  let best: { from: AtlasPlace; to: AtlasPlace; miles: number } | null = null;
  for (const from of remaining) {
    for (const to of connected) {
      const miles = distance(from, to);
      if (!best || miles < best.miles) best = { from, to, miles };
    }
  }
  return best ? { from: best.from, to: best.to } : null;
}

function makePaths(input: WorldAtlasGenerationInput, places: readonly AtlasPlace[]): AtlasPath[] {
  const paths: AtlasPath[] = [];
  const seen = new Set<string>();
  const landmassIds = [...new Set(places.map((place) => place.landmassId))];

  for (const landmassId of landmassIds) {
    const settlements = places
      .filter((place) => place.landmassId === landmassId && SETTLEMENT_KINDS.has(place.kind))
      .sort((left, right) => right.importance - left.importance);
    if (settlements.length > 1) {
      const connected: AtlasPlace[] = [settlements[0]!];
      const remaining = settlements.slice(1);
      while (remaining.length > 0) {
        const pair = closestPair(remaining, connected);
        if (!pair) break;
        addPath(paths, seen, input.seed, "road", pair.from, pair.to);
        connected.push(pair.from);
        remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
      }

      const major = settlements.filter((place) => place.importance >= 0.72).slice(0, 4);
      for (const place of major) {
        const extra = settlements
          .filter((candidate) => candidate.id !== place.id && !seen.has(pathKey(place.id, candidate.id)))
          .sort((left, right) => distance(place, left) - distance(place, right))[0];
        if (extra) addPath(paths, seen, input.seed, "road", place, extra);
      }
    }

    const localSettlements = settlements;
    const adventureSites = places.filter(
      (place) => place.landmassId === landmassId && !SETTLEMENT_KINDS.has(place.kind),
    );
    for (const site of adventureSites) {
      const destination = [...localSettlements].sort(
        (left, right) => distance(site, left) - distance(site, right),
      )[0];
      if (destination) addPath(paths, seen, input.seed, "trail", site, destination);
    }
  }

  const primaryPorts = landmassIds
    .map((landmassId) =>
      places
        .filter((place) => place.landmassId === landmassId && place.kind === "port")
        .sort((left, right) => right.importance - left.importance)[0],
    )
    .filter((place): place is AtlasPlace => Boolean(place));

  if (primaryPorts.length > 1) {
    const connected: AtlasPlace[] = [primaryPorts[0]!];
    const remaining = primaryPorts.slice(1);
    while (remaining.length > 0) {
      const pair = closestPair(remaining, connected);
      if (!pair) break;
      addPath(paths, seen, input.seed, "sea-route", pair.from, pair.to);
      connected.push(pair.from);
      remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
    }
  }

  return paths;
}

function makeLegend(places: readonly AtlasPlace[], paths: readonly AtlasPath[]): AtlasLegendEntry[] {
  const used = new Set<AtlasPlaceKind | AtlasPathKind>();
  for (const place of places) used.add(place.kind);
  for (const path of paths) used.add(path.kind);
  return [...used]
    .sort((left, right) => LEGEND_LABELS[left].localeCompare(LEGEND_LABELS[right]))
    .map((kind) => ({ kind, label: LEGEND_LABELS[kind] }));
}

export function generateWorldAtlas(input: WorldAtlasGenerationInput): WorldAtlasDocument {
  const seed = input.seed.trim();
  if (!seed) throw new RangeError("World atlas generation requires a non-empty seed.");
  const random = mulberry32(hash32(`${seed}:${WORLD_ATLAS_GENERATOR_VERSION}`));
  const dimensions = dimensionsFor(input);
  const landmasses = makeLandmasses(input, dimensions.width, dimensions.height, random);
  const regions = makeRegions(input, landmasses, random);
  const mountainRanges = makeMountains(input, landmasses, random);
  const rivers = makeRivers(input, landmasses, mountainRanges, random);
  const places = makePlaces(input, landmasses, regions, random);
  const paths = makePaths(input, places);

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
    legend: makeLegend(places, paths),
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
    Array.isArray(record.regions) &&
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
  if (!Number.isInteger(dimensions) || dimensions < 1) {
    throw new RangeError("Embedding dimensions must be a positive integer.");
  }
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
