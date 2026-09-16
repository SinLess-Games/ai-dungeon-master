import type {
  AtlasLandmass,
  AtlasPath,
  AtlasPoint,
  WorldAtlasDocument,
} from "./atlas";

type PlannedGeography = "supercontinent" | "continents" | "archipelago";

interface TargetLayout {
  center: AtlasPoint;
  radiusX: number;
  radiusY: number;
}

interface LandmassTransform {
  source: AtlasLandmass;
  target: TargetLayout;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: string, namespace: string): number {
  return hash32(`${seed}:${namespace}`) / 4294967295;
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

function plannedGeography(atlas: WorldAtlasDocument): PlannedGeography | null {
  const metadata = asRecord(atlas.metadata);
  const aiPlanning = asRecord(metadata["aiPlanning"]);
  const plan = asRecord(aiPlanning["plan"]);
  const geography = plan["geography"];
  return geography === "supercontinent" || geography === "continents" || geography === "archipelago"
    ? geography
    : null;
}

function explicitlyMaritime(atlas: WorldAtlasDocument): boolean {
  if (plannedGeography(atlas) === "archipelago") return true;
  const template = atlas.campaignDecisions.templateId?.toLowerCase() ?? "";
  const styles = atlas.campaignDecisions.styleIds.map((value) => value.toLowerCase());
  return (
    template === "isles-and-seas" ||
    styles.some((value) =>
      ["seafaring", "pirates", "archipelago", "islands", "isles", "naval"].includes(value),
    )
  );
}

function targetLayouts(atlas: WorldAtlasDocument): TargetLayout[] {
  const { widthMiles: width, heightMiles: height } = atlas;
  const count = atlas.landmasses.length;
  const jitterX = (seeded(atlas.seed, "continental-scale-x") - 0.5) * width * 0.018;
  const jitterY = (seeded(atlas.seed, "continental-scale-y") - 0.5) * height * 0.018;

  if (count <= 1) {
    return [
      {
        center: { x: width * 0.5 + jitterX, y: height * 0.5 + jitterY },
        radiusX: width * 0.46,
        radiusY: height * 0.44,
      },
    ];
  }

  if (count === 2) {
    return [
      {
        center: { x: width * 0.31 + jitterX, y: height * 0.5 + jitterY },
        radiusX: width * 0.28,
        radiusY: height * 0.4,
      },
      {
        center: { x: width * 0.8 - jitterX, y: height * 0.48 - jitterY },
        radiusX: width * 0.18,
        radiusY: height * 0.32,
      },
    ];
  }

  return [
    {
      center: { x: width * 0.31 + jitterX, y: height * 0.5 + jitterY },
      radiusX: width * 0.27,
      radiusY: height * 0.4,
    },
    {
      center: { x: width * 0.79 - jitterX, y: height * 0.27 + jitterY },
      radiusX: width * 0.17,
      radiusY: height * 0.2,
    },
    {
      center: { x: width * 0.79 - jitterX, y: height * 0.74 - jitterY },
      radiusX: width * 0.17,
      radiusY: height * 0.18,
    },
  ];
}

function transformPoint(point: AtlasPoint, transform: LandmassTransform): AtlasPoint {
  const source = transform.source;
  const target = transform.target;
  return {
    x:
      target.center.x +
      ((point.x - source.center.x) / Math.max(1, source.radiusX)) * target.radiusX,
    y:
      target.center.y +
      ((point.y - source.center.y) / Math.max(1, source.radiusY)) * target.radiusY,
  };
}

function transformLandmass(
  landmass: AtlasLandmass,
  target: TargetLayout,
): AtlasLandmass {
  const transform: LandmassTransform = { source: landmass, target };
  return {
    ...landmass,
    center: target.center,
    radiusX: target.radiusX,
    radiusY: target.radiusY,
    points: landmass.points.map((point) => transformPoint(point, transform)),
  };
}

function transformPath(
  path: AtlasPath,
  transforms: ReadonlyMap<string, LandmassTransform>,
  originalPlaceLandmass: ReadonlyMap<string, string>,
): AtlasPath {
  if (path.kind === "sea-route") return path;
  const landmassId = originalPlaceLandmass.get(path.fromPlaceId);
  const transform = landmassId ? transforms.get(landmassId) : undefined;
  if (!transform) return path;
  const points = path.points.map((point) => transformPoint(point, transform));
  return {
    ...path,
    points,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
  };
}

/**
 * Make non-maritime campaign worlds read at a true continental scale.
 *
 * Earlier generation already decided how many landmasses the campaign should
 * have, but the resulting shapes occupied too little of the world canvas and
 * visually read as islands. This pass preserves every authoritative entity and
 * relationship while enlarging/repositioning the final 1-3 landmasses into a
 * dominant continental composition. Explicit archipelago campaigns are never
 * modified. Coastal integrity runs after this pass and rebuilds sea lanes from
 * the transformed ports.
 */
export function enforceContinentalAtlasScale(atlas: WorldAtlasDocument): WorldAtlasDocument {
  if (explicitlyMaritime(atlas) || atlas.landmasses.length === 0 || atlas.landmasses.length > 3) {
    return atlas;
  }

  const layouts = targetLayouts(atlas);
  const transforms = new Map<string, LandmassTransform>();
  atlas.landmasses.forEach((landmass, index) => {
    transforms.set(landmass.id, {
      source: landmass,
      target: layouts[Math.min(index, layouts.length - 1)]!,
    });
  });

  const originalPlaceLandmass = new Map(
    atlas.places.map((place) => [place.id, place.landmassId] as const),
  );

  const landmasses = atlas.landmasses.map((landmass, index) =>
    transformLandmass(landmass, layouts[Math.min(index, layouts.length - 1)]!),
  );

  const regions = atlas.regions.map((region) => {
    const transform = transforms.get(region.landmassId);
    return transform
      ? { ...region, center: transformPoint(region.center, transform) }
      : region;
  });

  const mountainRanges = atlas.mountainRanges.map((range) => {
    const transform = transforms.get(range.landmassId);
    return transform
      ? { ...range, points: range.points.map((point) => transformPoint(point, transform)) }
      : range;
  });

  const rivers = atlas.rivers.map((river) => {
    const transform = transforms.get(river.landmassId);
    return transform
      ? { ...river, points: river.points.map((point) => transformPoint(point, transform)) }
      : river;
  });

  const places = atlas.places.map((place) => {
    const transform = transforms.get(place.landmassId);
    if (!transform) return place;
    const point = transformPoint(place, transform);
    return { ...place, x: point.x, y: point.y };
  });

  const paths = atlas.paths.map((path) =>
    transformPath(path, transforms, originalPlaceLandmass),
  );

  return {
    ...atlas,
    landmasses,
    regions,
    mountainRanges,
    rivers,
    places,
    paths,
    metadata: {
      ...atlas.metadata,
      continentalScale: {
        applied: true,
        landmassCount: landmasses.length,
        primaryWidthRatio: landmasses[0]
          ? Number(((landmasses[0].radiusX * 2) / atlas.widthMiles).toFixed(3))
          : 0,
        primaryHeightRatio: landmasses[0]
          ? Number(((landmasses[0].radiusY * 2) / atlas.heightMiles).toFixed(3))
          : 0,
      },
    },
  } as WorldAtlasDocument;
}
