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
): number {
  return Math.min(landmass.radiusX, landmass.radiusY) * spacingFactor(kind);
}

function pairMinimumSpacing(
  landmass: AtlasLandmass,
  left: AtlasPlaceKind,
  right: AtlasPlaceKind,
): number {
  const minimum = Math.max(
    strictSettlementMinimumSpacing(landmass, left),
    strictSettlementMinimumSpacing(landmass, right),
  );
  return (left === "capital" || left === "city") && (right === "capital" || right === "city")
    ? minimum * 1.15
    : minimum;
}

function pruneCrowdedSettlements(atlas: WorldAtlasDocument): AtlasPlace[] {
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

    for (const settlement of settlements) {
      const fits = accepted.every(
        (other) =>
          distance(settlement, other) >=
          pairMinimumSpacing(landmass, settlement.kind, other.kind),
      );
      if (fits) accepted.push(settlement);
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

function rebuildRoutes(seed: string, places: readonly AtlasPlace[]): AtlasPath[] {
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

    const allSettlements = local.filter((place) => SETTLEMENT_KINDS.has(place.kind));
    const minor = local.filter((place) => place.kind === "village" || place.kind === "hamlet");
    for (const settlement of minor) {
      const destination = [...major].sort(
        (left, right) => distance(settlement, left) - distance(settlement, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", settlement, destination);
    }

    const sites = local.filter(
      (place) => !SETTLEMENT_KINDS.has(place.kind) && place.importance >= 0.68,
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
 * removes lower-ranked settlements that still cannot satisfy the final
 * continent's spacing constraints. This is intentional: a world map should
 * omit redundant population centers instead of drawing cities a few pixels
 * apart and implying impossible density at continental scale.
 */
export function generateStrictRealisticCampaignWorldAtlas(
  request: CampaignAtlasRequest,
): WorldAtlasDocument {
  const base = generateRealisticCampaignWorldAtlas(request);
  const places = pruneCrowdedSettlements(base);
  const paths = rebuildRoutes(base.seed, places);
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
