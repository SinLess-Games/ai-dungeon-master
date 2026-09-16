import type {
  AtlasLandmass,
  AtlasPath,
  AtlasPathKind,
  AtlasPlace,
  AtlasPlaceKind,
  AtlasPoint,
  WorldAtlasDocument,
} from "./atlas";
import type { CampaignAtlasRequest } from "./campaignAtlas";
import { generateRealisticCampaignWorldAtlas } from "./realisticCampaignAtlas";

export const STRICT_REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v5";

export type AtlasRouteDensity = "sparse" | "balanced" | "dense";

/**
 * Bounded knobs that a higher-level planner (including AI) may use to make the
 * deterministic engine stricter. The planner never supplies coordinates or
 * routes directly; it only tightens world-scale realism constraints.
 */
export interface AtlasRealismDirectives {
  settlementSpacingMultiplier?: number;
  maxCitiesPerLandmass?: number;
  maxTownsPerLandmass?: number;
  maxPortsPerLandmass?: number;
  maxFortificationsPerLandmass?: number;
  maxVillagesPerLandmass?: number;
  maxHamletsPerLandmass?: number;
  routeDensity?: AtlasRouteDensity;
  wildernessSiteTrailThreshold?: number;
}

interface NormalizedRealismDirectives {
  settlementSpacingMultiplier: number;
  maxCitiesPerLandmass: number;
  maxTownsPerLandmass: number;
  maxPortsPerLandmass: number;
  maxFortificationsPerLandmass: number;
  maxVillagesPerLandmass: number;
  maxHamletsPerLandmass: number;
  routeDensity: AtlasRouteDensity;
  wildernessSiteTrailThreshold: number;
}

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

const MAJOR_SETTLEMENT_KINDS = new Set<AtlasPlaceKind>([
  "capital",
  "city",
  "town",
  "port",
  "fort",
  "castle",
]);

const SETTLEMENT_RANK: Record<AtlasPlaceKind, number> = {
  capital: 10,
  city: 9,
  port: 8,
  town: 7,
  castle: 6,
  fort: 6,
  village: 5,
  hamlet: 4,
  temple: 3,
  tower: 3,
  mine: 3,
  ruin: 2,
  dungeon: 2,
  cave: 2,
  landmark: 2,
  "planar-gate": 2,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function integer(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  return Math.round(clamp(value ?? fallback, minimum, maximum));
}

function normalizeDirectives(input: AtlasRealismDirectives = {}): NormalizedRealismDirectives {
  return {
    settlementSpacingMultiplier: clamp(input.settlementSpacingMultiplier ?? 1, 0.9, 2.5),
    maxCitiesPerLandmass: integer(input.maxCitiesPerLandmass, 4, 1, 8),
    maxTownsPerLandmass: integer(input.maxTownsPerLandmass, 8, 1, 16),
    maxPortsPerLandmass: integer(input.maxPortsPerLandmass, 3, 0, 6),
    maxFortificationsPerLandmass: integer(input.maxFortificationsPerLandmass, 6, 0, 12),
    maxVillagesPerLandmass: integer(input.maxVillagesPerLandmass, 12, 1, 24),
    maxHamletsPerLandmass: integer(input.maxHamletsPerLandmass, 12, 0, 24),
    routeDensity: input.routeDensity ?? "balanced",
    wildernessSiteTrailThreshold: clamp(input.wildernessSiteTrailThreshold ?? 0.68, 0.5, 0.95),
  };
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

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

function spacingFactor(kind: AtlasPlaceKind): number {
  switch (kind) {
    case "capital":
      return 0.2;
    case "city":
      return 0.16;
    case "port":
      return 0.13;
    case "town":
      return 0.12;
    case "castle":
    case "fort":
      return 0.1;
    case "village":
      return 0.07;
    case "hamlet":
      return 0.045;
    default:
      return 0.04;
  }
}

export function strictSettlementMinimumSpacing(
  landmass: AtlasLandmass,
  kind: AtlasPlaceKind,
  multiplier = 1,
): number {
  return Math.min(landmass.radiusX, landmass.radiusY) * spacingFactor(kind) * multiplier;
}

function pairMinimumSpacing(
  landmass: AtlasLandmass,
  left: AtlasPlaceKind,
  right: AtlasPlaceKind,
  directives: NormalizedRealismDirectives,
): number {
  const minimum = Math.max(
    strictSettlementMinimumSpacing(landmass, left, directives.settlementSpacingMultiplier),
    strictSettlementMinimumSpacing(landmass, right, directives.settlementSpacingMultiplier),
  );
  return (left === "capital" || left === "city") && (right === "capital" || right === "city")
    ? minimum * 1.15
    : minimum;
}

function quotaAllows(
  place: AtlasPlace,
  counts: Map<AtlasPlaceKind | "fortifications", number>,
  directives: NormalizedRealismDirectives,
): boolean {
  const value = (key: AtlasPlaceKind | "fortifications") => counts.get(key) ?? 0;
  switch (place.kind) {
    case "capital":
      return value("capital") < 1;
    case "city":
      return value("city") < directives.maxCitiesPerLandmass;
    case "town":
      return value("town") < directives.maxTownsPerLandmass;
    case "port":
      return value("port") < directives.maxPortsPerLandmass;
    case "fort":
    case "castle":
      return value("fortifications") < directives.maxFortificationsPerLandmass;
    case "village":
      return value("village") < directives.maxVillagesPerLandmass;
    case "hamlet":
      return value("hamlet") < directives.maxHamletsPerLandmass;
    default:
      return true;
  }
}

function incrementQuota(
  place: AtlasPlace,
  counts: Map<AtlasPlaceKind | "fortifications", number>,
): void {
  counts.set(place.kind, (counts.get(place.kind) ?? 0) + 1);
  if (place.kind === "fort" || place.kind === "castle") {
    counts.set("fortifications", (counts.get("fortifications") ?? 0) + 1);
  }
}

function pruneCrowdedSettlements(
  atlas: WorldAtlasDocument,
  directives: NormalizedRealismDirectives,
): AtlasPlace[] {
  const kept: AtlasPlace[] = [];

  for (const landmass of atlas.landmasses) {
    const local = atlas.places.filter((place) => place.landmassId === landmass.id);
    const settlements = local
      .filter((place) => SETTLEMENT_KINDS.has(place.kind))
      .sort(
        (left, right) =>
          SETTLEMENT_RANK[right.kind] - SETTLEMENT_RANK[left.kind] ||
          right.importance - left.importance ||
          left.id.localeCompare(right.id),
      );
    const accepted: AtlasPlace[] = [];
    const counts = new Map<AtlasPlaceKind | "fortifications", number>();

    for (const settlement of settlements) {
      if (!quotaAllows(settlement, counts, directives)) continue;
      const fits = accepted.every(
        (other) =>
          distance(settlement, other) >=
          pairMinimumSpacing(landmass, settlement.kind, other.kind, directives),
      );
      if (!fits) continue;
      accepted.push(settlement);
      incrementQuota(settlement, counts);
    }

    kept.push(...accepted, ...local.filter((place) => !SETTLEMENT_KINDS.has(place.kind)));
  }

  return kept;
}

function pathKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join(":");
}

function pathDistance(points: readonly AtlasPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }
  return total;
}

function curvedPath(seed: string, kind: AtlasPathKind, from: AtlasPlace, to: AtlasPlace): AtlasPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const perpendicular = { x: -dy / length, y: dx / length };
  const random = mulberry32(hash32(`${seed}:strict-route:${kind}:${pathKey(from.id, to.id)}`));
  const bend = (random() - 0.5) * length * (kind === "sea-route" ? 0.15 : 0.07);
  return [
    { x: from.x, y: from.y },
    {
      x: from.x + dx * 0.34 + perpendicular.x * bend,
      y: from.y + dy * 0.34 + perpendicular.y * bend,
    },
    {
      x: from.x + dx * 0.68 - perpendicular.x * bend * 0.45,
      y: from.y + dy * 0.68 - perpendicular.y * bend * 0.45,
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
  const points = curvedPath(seed, kind, from, to);
  paths.push({
    id: `strict-path-${kind}-${paths.length + 1}`,
    kind,
    fromPlaceId: from.id,
    toPlaceId: to.id,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
    points,
  });
}

function nearestPair(
  remaining: readonly AtlasPlace[],
  connected: readonly AtlasPlace[],
): { from: AtlasPlace; to: AtlasPlace; miles: number } | null {
  let best: { from: AtlasPlace; to: AtlasPlace; miles: number } | null = null;
  for (const from of remaining) {
    for (const to of connected) {
      const miles = distance(from, to);
      if (!best || miles < best.miles) best = { from, to, miles };
    }
  }
  return best;
}

function trunkSettlements(
  major: readonly AtlasPlace[],
  routeDensity: AtlasRouteDensity,
): AtlasPlace[] {
  if (routeDensity !== "sparse") return [...major];
  const sparse = major.filter(
    (place) =>
      place.kind === "capital" ||
      place.kind === "city" ||
      place.kind === "port" ||
      (place.kind === "town" && place.importance >= 0.76) ||
      ((place.kind === "fort" || place.kind === "castle") && place.importance >= 0.84),
  );
  return sparse.length ? sparse : major.slice(0, Math.min(2, major.length));
}

function rebuildRoutes(
  seed: string,
  places: readonly AtlasPlace[],
  directives: NormalizedRealismDirectives,
): AtlasPath[] {
  const paths: AtlasPath[] = [];
  const seen = new Set<string>();
  const landmassIds = [...new Set(places.map((place) => place.landmassId))];

  for (const landmassId of landmassIds) {
    const local = places.filter((place) => place.landmassId === landmassId);
    const major = local
      .filter((place) => MAJOR_SETTLEMENT_KINDS.has(place.kind))
      .sort((left, right) => right.importance - left.importance);
    const trunk = trunkSettlements(major, directives.routeDensity);

    if (trunk.length > 1) {
      const connected = [trunk[0]!];
      const remaining = trunk.slice(1);
      while (remaining.length > 0) {
        const pair = nearestPair(remaining, connected);
        if (!pair) break;
        addPath(paths, seen, seed, "road", pair.from, pair.to);
        connected.push(pair.from);
        remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
      }
    }

    if (directives.routeDensity === "dense" && trunk.length > 2) {
      for (const settlement of trunk) {
        const nearest = trunk
          .filter((other) => other.id !== settlement.id)
          .sort((left, right) => distance(settlement, left) - distance(settlement, right))[0];
        if (nearest) addPath(paths, seen, seed, "road", settlement, nearest);
      }
    }

    const trunkIds = new Set(trunk.map((place) => place.id));
    for (const settlement of major.filter((place) => !trunkIds.has(place.id))) {
      const destination = [...trunk].sort(
        (left, right) => distance(settlement, left) - distance(settlement, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", settlement, destination);
    }

    const allSettlements = local.filter((place) => SETTLEMENT_KINDS.has(place.kind));
    const minor = local.filter((place) => place.kind === "village" || place.kind === "hamlet");
    const minorImportanceFloor =
      directives.routeDensity === "sparse" ? 0.72 : directives.routeDensity === "balanced" ? 0.56 : 0;
    for (const settlement of minor) {
      if (settlement.importance < minorImportanceFloor) continue;
      const destination = [...(trunk.length ? trunk : major)].sort(
        (left, right) => distance(settlement, left) - distance(settlement, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", settlement, destination);
    }

    const sites = local.filter(
      (place) =>
        !SETTLEMENT_KINDS.has(place.kind) &&
        place.importance >= directives.wildernessSiteTrailThreshold,
    );
    for (const site of sites) {
      const destination = [...allSettlements].sort(
        (left, right) => distance(site, left) - distance(site, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", site, destination);
    }
  }

  const ports = landmassIds
    .map((landmassId) =>
      places
        .filter((place) => place.landmassId === landmassId && place.kind === "port")
        .sort((left, right) => right.importance - left.importance)[0],
    )
    .filter((place): place is AtlasPlace => Boolean(place));

  if (ports.length > 1) {
    const connected = [ports[0]!];
    const remaining = ports.slice(1);
    while (remaining.length > 0) {
      const pair = nearestPair(remaining, connected);
      if (!pair) break;
      addPath(paths, seen, seed, "sea-route", pair.from, pair.to);
      connected.push(pair.from);
      remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
    }
  }

  return paths;
}

/**
 * World-scale realism layer. It keeps the terrain-aware v4 placement, then
 * removes lower-ranked settlements that cannot satisfy the final continent's
 * spacing and population-center constraints. Optional directives let a
 * validated planner tighten density without ever supplying authoritative map
 * coordinates.
 */
export function generateStrictRealisticCampaignWorldAtlas(
  request: CampaignAtlasRequest,
  inputDirectives: AtlasRealismDirectives = {},
): WorldAtlasDocument {
  const directives = normalizeDirectives(inputDirectives);
  const base = generateRealisticCampaignWorldAtlas(request);
  const places = pruneCrowdedSettlements(base, directives);
  const paths = rebuildRoutes(base.seed, places, directives);
  const usedKinds = new Set<string>([
    ...places.map((place) => place.kind),
    ...paths.map((path) => path.kind),
  ]);

  return {
    ...base,
    generatorVersion: STRICT_REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    places,
    paths,
    legend: base.legend.filter((entry) => usedKinds.has(entry.kind)),
  };
}
