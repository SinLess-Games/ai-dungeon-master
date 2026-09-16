import type {
  AtlasBiome,
  AtlasLegendEntry,
  AtlasPathKind,
  AtlasPlaceKind,
  AtlasPoint,
  WorldAtlasDocument,
} from "./atlas";

export type WorldAtlasEdit =
  | {
      type: "place.create";
      id: string;
      name: string;
      kind: AtlasPlaceKind;
      x: number;
      y: number;
      description: string;
      tags: string[];
      population?: number;
    }
  | {
      type: "place.update";
      placeId: string;
      name?: string;
      kind?: AtlasPlaceKind;
      description?: string;
      tags?: string[];
      population?: number | null;
    }
  | { type: "place.move"; placeId: string; x: number; y: number }
  | { type: "place.delete"; placeId: string }
  | {
      type: "region.create";
      id: string;
      name: string;
      biome: AtlasBiome;
      x: number;
      y: number;
      importance: number;
    }
  | {
      type: "region.update";
      regionId: string;
      name?: string;
      biome?: AtlasBiome;
      importance?: number;
    }
  | { type: "region.move"; regionId: string; x: number; y: number }
  | { type: "region.delete"; regionId: string }
  | {
      type: "path.create";
      id: string;
      kind: AtlasPathKind;
      fromPlaceId: string;
      toPlaceId: string;
      points?: AtlasPoint[];
    }
  | {
      type: "path.update";
      pathId: string;
      kind?: AtlasPathKind;
      points?: AtlasPoint[];
    }
  | { type: "path.delete"; pathId: string };

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

function pointDistance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polylineDistance(points: readonly AtlasPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += pointDistance(points[index - 1]!, points[index]!);
  }
  return total;
}

function assertPoint(atlas: WorldAtlasDocument, point: AtlasPoint): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError("Map coordinates must be finite numbers.");
  }
  if (point.x < 0 || point.x > atlas.widthMiles || point.y < 0 || point.y > atlas.heightMiles) {
    throw new RangeError("Map coordinates must remain inside the world atlas.");
  }
}

function nearestLandmass(atlas: WorldAtlasDocument, point: AtlasPoint) {
  return atlas.landmasses.reduce((best, candidate) =>
    pointDistance(point, candidate.center) < pointDistance(point, best.center) ? candidate : best,
  );
}

function nearestRegion(atlas: WorldAtlasDocument, landmassId: string, point: AtlasPoint) {
  const candidates = atlas.regions.filter((region) => region.landmassId === landmassId);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) =>
    pointDistance(point, candidate.center) < pointDistance(point, best.center) ? candidate : best,
  );
}

function rebuildLegend(atlas: WorldAtlasDocument): AtlasLegendEntry[] {
  const used = new Set<AtlasPlaceKind | AtlasPathKind>();
  atlas.places.forEach((place) => used.add(place.kind));
  atlas.paths.forEach((path) => used.add(path.kind));
  return [...used]
    .sort((left, right) => LEGEND_LABELS[left].localeCompare(LEGEND_LABELS[right]))
    .map((kind) => ({ kind, label: LEGEND_LABELS[kind] }));
}

function straightPath(from: AtlasPoint, to: AtlasPoint): AtlasPoint[] {
  return [
    from,
    { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
    to,
  ];
}

function withPendingRender(atlas: WorldAtlasDocument): WorldAtlasDocument {
  return {
    ...atlas,
    metadata: {
      ...atlas.metadata,
      renderStatus: "pending",
    },
  };
}

export function applyWorldAtlasEdit(
  atlas: WorldAtlasDocument,
  edit: WorldAtlasEdit,
): WorldAtlasDocument {
  let next: WorldAtlasDocument;
  switch (edit.type) {
    case "place.create": {
      const point = { x: edit.x, y: edit.y };
      assertPoint(atlas, point);
      if (atlas.places.some((place) => place.id === edit.id)) throw new Error("Atlas place id already exists.");
      const landmass = nearestLandmass(atlas, point);
      const region = nearestRegion(atlas, landmass.id, point);
      const population = edit.population;
      next = {
        ...atlas,
        places: [
          ...atlas.places,
          {
            id: edit.id,
            landmassId: landmass.id,
            regionId: region?.id ?? null,
            name: edit.name,
            kind: edit.kind,
            x: point.x,
            y: point.y,
            importance: 0.7,
            ...(population === undefined ? {} : { population }),
            description: edit.description,
            tags: [...edit.tags],
          },
        ],
      };
      break;
    }
    case "place.update": {
      if (!atlas.places.some((place) => place.id === edit.placeId)) throw new Error("Atlas place not found.");
      next = {
        ...atlas,
        places: atlas.places.map((place) => {
          if (place.id !== edit.placeId) return place;
          const population = edit.population;
          const base = {
            ...place,
            ...(edit.name === undefined ? {} : { name: edit.name }),
            ...(edit.kind === undefined ? {} : { kind: edit.kind }),
            ...(edit.description === undefined ? {} : { description: edit.description }),
            ...(edit.tags === undefined ? {} : { tags: [...edit.tags] }),
          };
          if (population === undefined) return base;
          if (population === null) {
            const { population: _removed, ...withoutPopulation } = base;
            return withoutPopulation;
          }
          return { ...base, population };
        }),
      };
      break;
    }
    case "place.move": {
      const point = { x: edit.x, y: edit.y };
      assertPoint(atlas, point);
      if (!atlas.places.some((place) => place.id === edit.placeId)) throw new Error("Atlas place not found.");
      const landmass = nearestLandmass(atlas, point);
      const region = nearestRegion(atlas, landmass.id, point);
      next = {
        ...atlas,
        places: atlas.places.map((place) =>
          place.id === edit.placeId
            ? { ...place, x: point.x, y: point.y, landmassId: landmass.id, regionId: region?.id ?? null }
            : place,
        ),
        paths: atlas.paths.map((path) => {
          if (path.fromPlaceId !== edit.placeId && path.toPlaceId !== edit.placeId) return path;
          const from = path.fromPlaceId === edit.placeId
            ? point
            : atlas.places.find((place) => place.id === path.fromPlaceId);
          const to = path.toPlaceId === edit.placeId
            ? point
            : atlas.places.find((place) => place.id === path.toPlaceId);
          if (!from || !to) return path;
          const points = straightPath(from, to);
          return { ...path, points, distanceMiles: Math.max(1, Math.round(polylineDistance(points))) };
        }),
      };
      break;
    }
    case "place.delete":
      if (!atlas.places.some((place) => place.id === edit.placeId)) throw new Error("Atlas place not found.");
      next = {
        ...atlas,
        places: atlas.places.filter((place) => place.id !== edit.placeId),
        paths: atlas.paths.filter(
          (path) => path.fromPlaceId !== edit.placeId && path.toPlaceId !== edit.placeId,
        ),
      };
      break;
    case "region.create": {
      const point = { x: edit.x, y: edit.y };
      assertPoint(atlas, point);
      if (atlas.regions.some((region) => region.id === edit.id)) throw new Error("Atlas region id already exists.");
      const landmass = nearestLandmass(atlas, point);
      next = {
        ...atlas,
        regions: [
          ...atlas.regions,
          {
            id: edit.id,
            landmassId: landmass.id,
            name: edit.name,
            center: point,
            biome: edit.biome,
            importance: edit.importance,
          },
        ],
      };
      break;
    }
    case "region.update":
      if (!atlas.regions.some((region) => region.id === edit.regionId)) throw new Error("Atlas region not found.");
      next = {
        ...atlas,
        regions: atlas.regions.map((region) =>
          region.id === edit.regionId
            ? {
                ...region,
                ...(edit.name === undefined ? {} : { name: edit.name }),
                ...(edit.biome === undefined ? {} : { biome: edit.biome }),
                ...(edit.importance === undefined ? {} : { importance: edit.importance }),
              }
            : region,
        ),
      };
      break;
    case "region.move": {
      const point = { x: edit.x, y: edit.y };
      assertPoint(atlas, point);
      if (!atlas.regions.some((region) => region.id === edit.regionId)) throw new Error("Atlas region not found.");
      const landmass = nearestLandmass(atlas, point);
      next = {
        ...atlas,
        regions: atlas.regions.map((region) =>
          region.id === edit.regionId
            ? { ...region, center: point, landmassId: landmass.id }
            : region,
        ),
      };
      break;
    }
    case "region.delete":
      if (!atlas.regions.some((region) => region.id === edit.regionId)) throw new Error("Atlas region not found.");
      next = {
        ...atlas,
        regions: atlas.regions.filter((region) => region.id !== edit.regionId),
        places: atlas.places.map((place) =>
          place.regionId === edit.regionId ? { ...place, regionId: null } : place,
        ),
      };
      break;
    case "path.create": {
      const from = atlas.places.find((place) => place.id === edit.fromPlaceId);
      const to = atlas.places.find((place) => place.id === edit.toPlaceId);
      if (!from || !to) throw new Error("Both path endpoints must exist.");
      if (from.id === to.id) throw new Error("A path requires two different places.");
      if (atlas.paths.some((path) => path.id === edit.id)) throw new Error("Atlas path id already exists.");
      const points = edit.points?.length ? edit.points.map((point) => ({ ...point })) : straightPath(from, to);
      points.forEach((point) => assertPoint(atlas, point));
      if (points.length < 2) throw new Error("A path requires at least two points.");
      next = {
        ...atlas,
        paths: [
          ...atlas.paths,
          {
            id: edit.id,
            kind: edit.kind,
            fromPlaceId: from.id,
            toPlaceId: to.id,
            distanceMiles: Math.max(1, Math.round(polylineDistance(points))),
            points,
          },
        ],
      };
      break;
    }
    case "path.update": {
      if (!atlas.paths.some((path) => path.id === edit.pathId)) throw new Error("Atlas path not found.");
      if (edit.points) {
        if (edit.points.length < 2) throw new Error("A path requires at least two points.");
        edit.points.forEach((point) => assertPoint(atlas, point));
      }
      next = {
        ...atlas,
        paths: atlas.paths.map((path) => {
          if (path.id !== edit.pathId) return path;
          const points = edit.points?.map((point) => ({ ...point })) ?? path.points;
          return {
            ...path,
            ...(edit.kind === undefined ? {} : { kind: edit.kind }),
            points,
            distanceMiles: Math.max(1, Math.round(polylineDistance(points))),
          };
        }),
      };
      break;
    }
    case "path.delete":
      if (!atlas.paths.some((path) => path.id === edit.pathId)) throw new Error("Atlas path not found.");
      next = { ...atlas, paths: atlas.paths.filter((path) => path.id !== edit.pathId) };
      break;
  }

  const pending = withPendingRender(next);
  return { ...pending, legend: rebuildLegend(pending) };
}
