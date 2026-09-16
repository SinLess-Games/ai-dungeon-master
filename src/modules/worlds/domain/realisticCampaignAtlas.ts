import {
  type AtlasLandmass,
  type AtlasPath,
  type AtlasPathKind,
  type AtlasPlace,
  type AtlasPlaceKind,
  type AtlasPoint,
  type AtlasRegion,
  type WorldAtlasDocument,
} from "./atlas";
import {
  generateCampaignWorldAtlas,
  type CampaignAtlasRequest,
} from "./campaignAtlas";

export const REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v4";

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

function pointInPolygon(point: AtlasPoint, polygon: readonly AtlasPoint[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index]!;
    const previousPoint = polygon[previous]!;
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y || Number.EPSILON) +
          currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function normalizedRadius(point: AtlasPoint, landmass: AtlasLandmass): number {
  const x = (point.x - landmass.center.x) / Math.max(1, landmass.radiusX);
  const y = (point.y - landmass.center.y) / Math.max(1, landmass.radiusY);
  return Math.hypot(x, y);
}

function targetRadius(kind: AtlasPlaceKind): number {
  switch (kind) {
    case "capital":
      return 0.32;
    case "city":
      return 0.44;
    case "town":
    case "castle":
    case "fort":
      return 0.52;
    case "port":
      return 0.79;
    case "village":
      return 0.61;
    case "hamlet":
      return 0.68;
    default:
      return 0.62;
  }
}

function spacingFactor(kind: AtlasPlaceKind): number {
  switch (kind) {
    case "capital":
      return 0.28;
    case "city":
      return 0.235;
    case "port":
      return 0.19;
    case "town":
      return 0.17;
    case "castle":
    case "fort":
      return 0.145;
    case "village":
      return 0.1;
    case "hamlet":
      return 0.072;
    default:
      return 0.065;
  }
}

export function realisticSettlementMinimumSpacing(
  landmass: AtlasLandmass,
  kind: AtlasPlaceKind,
): number {
  return Math.min(landmass.radiusX, landmass.radiusY) * spacingFactor(kind);
}

function pairMinimumSpacing(
  landmass: AtlasLandmass,
  left: AtlasPlaceKind,
  right: AtlasPlaceKind,
): number {
  const base = Math.max(
    realisticSettlementMinimumSpacing(landmass, left),
    realisticSettlementMinimumSpacing(landmass, right),
  );
  if (
    (left === "capital" || left === "city") &&
    (right === "capital" || right === "city")
  ) {
    return base * 1.12;
  }
  return base;
}

function randomCandidate(
  random: () => number,
  landmass: AtlasLandmass,
  kind: AtlasPlaceKind,
): AtlasPoint {
  const target = targetRadius(kind);
  const spread = kind === "port" ? 0.12 : 0.32;
  const angle = random() * Math.PI * 2;
  const radius = Math.max(0.08, Math.min(0.88, target + (random() - 0.5) * spread));
  return {
    x: landmass.center.x + Math.cos(angle) * landmass.radiusX * radius,
    y: landmass.center.y + Math.sin(angle) * landmass.radiusY * radius,
  };
}

function nearestFeatureDistance(
  point: AtlasPoint,
  features: readonly { points: readonly AtlasPoint[] }[],
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const feature of features) {
    for (const node of feature.points) best = Math.min(best, distance(point, node));
  }
  return best;
}

function candidateScore(input: {
  candidate: AtlasPoint;
  place: AtlasPlace;
  landmass: AtlasLandmass;
  alreadyPlaced: readonly AtlasPlace[];
  rivers: readonly { points: readonly AtlasPoint[] }[];
  mountains: readonly { points: readonly AtlasPoint[] }[];
}): number {
  if (!pointInPolygon(input.candidate, input.landmass.points)) return -1_000_000;

  let score = 0;
  const radial = normalizedRadius(input.candidate, input.landmass);
  score -= Math.abs(radial - targetRadius(input.place.kind)) * 160;

  for (const other of input.alreadyPlaced) {
    const required = pairMinimumSpacing(input.landmass, input.place.kind, other.kind);
    const actual = distance(input.candidate, other);
    if (actual < required) score -= (required - actual) * 8 + 12_000;
    else score += Math.min(2_000, actual * 0.06);
  }

  if (MAJOR_SETTLEMENT_KINDS.has(input.place.kind) && input.rivers.length > 0) {
    const riverDistance = nearestFeatureDistance(input.candidate, input.rivers);
    const scale = Math.min(input.landmass.radiusX, input.landmass.radiusY);
    score += Math.max(0, 900 - (riverDistance / Math.max(1, scale)) * 2_600);
  }

  if ((input.place.kind === "fort" || input.place.kind === "castle") && input.mountains.length > 0) {
    const mountainDistance = nearestFeatureDistance(input.candidate, input.mountains);
    const scale = Math.min(input.landmass.radiusX, input.landmass.radiusY);
    score += Math.max(0, 550 - (mountainDistance / Math.max(1, scale)) * 1_800);
  }

  return score;
}

function nearestRegion(
  point: AtlasPoint,
  landmassId: string,
  regions: readonly AtlasRegion[],
): AtlasRegion | null {
  const values = regions.filter((region) => region.landmassId === landmassId);
  let best: AtlasRegion | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const region of values) {
    const candidateDistance = distance(point, region.center);
    if (candidateDistance < bestDistance) {
      best = region;
      bestDistance = candidateDistance;
    }
  }
  return best;
}

function redistributeRegions(atlas: WorldAtlasDocument): AtlasRegion[] {
  const result: AtlasRegion[] = [];
  for (const landmass of atlas.landmasses) {
    const source = atlas.regions
      .filter((region) => region.landmassId === landmass.id)
      .sort((left, right) => right.importance - left.importance || left.id.localeCompare(right.id));
    const placed: AtlasRegion[] = [];
    const minimum = Math.min(landmass.radiusX, landmass.radiusY) * 0.22;

    for (const region of source) {
      const random = mulberry32(hash32(`${atlas.seed}:region-v4:${region.id}`));
      let best = region.center;
      let bestScore = -1_000_000;
      for (let attempt = 0; attempt < 96; attempt += 1) {
        const angle = random() * Math.PI * 2;
        const radius = Math.sqrt(random()) * 0.72;
        const candidate = {
          x: landmass.center.x + Math.cos(angle) * landmass.radiusX * radius,
          y: landmass.center.y + Math.sin(angle) * landmass.radiusY * radius,
        };
        if (!pointInPolygon(candidate, landmass.points)) continue;
        const nearest = placed.length
          ? Math.min(...placed.map((other) => distance(candidate, other.center)))
          : minimum * 2;
        const score = Math.min(nearest, minimum * 2) - Math.abs(radius - 0.46) * minimum;
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
        if (nearest >= minimum) break;
      }
      const next = { ...region, center: best };
      placed.push(next);
      result.push(next);
    }
  }
  return result;
}

function redistributePlaces(
  atlas: WorldAtlasDocument,
  regions: readonly AtlasRegion[],
): AtlasPlace[] {
  const result: AtlasPlace[] = [];

  for (const landmass of atlas.landmasses) {
    const source = atlas.places
      .filter((place) => place.landmassId === landmass.id)
      .sort(
        (left, right) =>
          SETTLEMENT_RANK[right.kind] - SETTLEMENT_RANK[left.kind] ||
          right.importance - left.importance ||
          left.id.localeCompare(right.id),
      );
    const placed: AtlasPlace[] = [];
    const rivers = atlas.rivers.filter((river) => river.landmassId === landmass.id);
    const mountains = atlas.mountainRanges.filter((range) => range.landmassId === landmass.id);

    for (const place of source) {
      const random = mulberry32(hash32(`${atlas.seed}:place-v4:${place.id}`));
      let bestPoint = { x: place.x, y: place.y };
      let bestScore = -1_000_000;

      for (let attempt = 0; attempt < 180; attempt += 1) {
        const candidate = randomCandidate(random, landmass, place.kind);
        const score = candidateScore({
          candidate,
          place,
          landmass,
          alreadyPlaced: placed,
          rivers,
          mountains,
        });
        if (score > bestScore) {
          bestPoint = candidate;
          bestScore = score;
        }
      }

      const region = nearestRegion(bestPoint, landmass.id, regions);
      const next: AtlasPlace = {
        ...place,
        x: bestPoint.x,
        y: bestPoint.y,
        regionId: region?.id ?? null,
      };
      placed.push(next);
      result.push(next);
    }
  }

  return result;
}

function pathKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join(":");
}

function curvedPath(seed: string, kind: AtlasPathKind, from: AtlasPlace, to: AtlasPlace): AtlasPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const perpendicular = { x: -dy / length, y: dx / length };
  const random = mulberry32(hash32(`${seed}:route-v4:${kind}:${pathKey(from.id, to.id)}`));
  const bend = (random() - 0.5) * length * (kind === "sea-route" ? 0.16 : 0.075);
  return [
    { x: from.x, y: from.y },
    {
      x: from.x + dx * 0.33 + perpendicular.x * bend,
      y: from.y + dy * 0.33 + perpendicular.y * bend,
    },
    {
      x: from.x + dx * 0.67 - perpendicular.x * bend * 0.45,
      y: from.y + dy * 0.67 - perpendicular.y * bend * 0.45,
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
    id: `realistic-path-${kind}-${paths.length + 1}`,
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

function rebuildRealisticRoutes(seed: string, places: readonly AtlasPlace[]): AtlasPath[] {
  const paths: AtlasPath[] = [];
  const seen = new Set<string>();
  const landmassIds = [...new Set(places.map((place) => place.landmassId))];

  for (const landmassId of landmassIds) {
    const local = places.filter((place) => place.landmassId === landmassId);
    const major = local
      .filter((place) => MAJOR_SETTLEMENT_KINDS.has(place.kind))
      .sort((left, right) => right.importance - left.importance);

    if (major.length > 1) {
      const connected = [major[0]!];
      const remaining = major.slice(1);
      while (remaining.length > 0) {
        const pair = nearestPair(remaining, connected);
        if (!pair) break;
        addPath(paths, seen, seed, "road", pair.from, pair.to);
        connected.push(pair.from);
        remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
      }
    }

    const minorSettlements = local.filter(
      (place) => place.kind === "village" || place.kind === "hamlet",
    );
    for (const settlement of minorSettlements) {
      const destination = [...major].sort(
        (left, right) => distance(settlement, left) - distance(settlement, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", settlement, destination);
    }

    const adventureSites = local.filter(
      (place) => !SETTLEMENT_KINDS.has(place.kind) && place.importance >= 0.62,
    );
    const settlements = local.filter((place) => SETTLEMENT_KINDS.has(place.kind));
    for (const site of adventureSites) {
      const destination = [...settlements].sort(
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
 * Final realism pass applied after the campaign-aware continent layout.
 *
 * v3 correctly chooses campaign-appropriate geography, but merging several
 * source landmasses into one continent can compress their already-generated
 * settlements. This pass redistributes the final geography, enforces a real
 * settlement hierarchy, associates population centers with rivers/coasts,
 * and rebuilds a sparse transport network at the scale of a world map.
 */
export function generateRealisticCampaignWorldAtlas(
  request: CampaignAtlasRequest,
): WorldAtlasDocument {
  const base = generateCampaignWorldAtlas(request);
  const regions = redistributeRegions(base);
  const places = redistributePlaces(base, regions);
  const paths = rebuildRealisticRoutes(base.seed, places);
  const usedKinds = new Set<string>([
    ...places.map((place) => place.kind),
    ...paths.map((path) => path.kind),
  ]);

  return {
    ...base,
    generatorVersion: REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    regions,
    places,
    paths,
    legend: base.legend.filter((entry) => usedKinds.has(entry.kind)),
  };
}
