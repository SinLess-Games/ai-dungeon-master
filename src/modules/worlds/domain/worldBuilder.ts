import type {
  AtlasPath,
  AtlasPlace,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "./atlas";
import {
  calculateOverlandTravel,
  terrainForPath,
  travelEncounterChance,
  type AtlasTravelTerrain,
  type AtlasTravelWeather,
} from "./overlandTravel";

export interface AtlasPartyPosition {
  placeId: string;
  x: number;
  y: number;
}

export interface AtlasTravelRecord {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  pathIds: string[];
  distanceMiles: number;
  durationMinutes: number;
  speedFeet: number;
  weather: AtlasTravelWeather;
  startedCampaignMinute: number;
  endedCampaignMinute: number;
  encounterTriggered: boolean;
}

export interface AtlasPendingTravelEncounter {
  id: string;
  travelRecordId: string;
  placeId: string;
  chance: number;
  roll: number;
  createdCampaignMinute: number;
}

export interface AtlasExplorationState {
  discoveredPlaceIds: string[];
  discoveredRegionIds: string[];
  partyPosition: AtlasPartyPosition;
  weather: AtlasTravelWeather;
  campaignMinutes: number;
  travelHistory: AtlasTravelRecord[];
  pendingEncounter: AtlasPendingTravelEncounter | null;
}

export interface AtlasTravelSegment {
  pathId: string;
  fromPlaceId: string;
  toPlaceId: string;
  distanceMiles: number;
  terrain: AtlasTravelTerrain;
  durationMinutes: number;
  effectiveMilesPerDay: number;
}

export interface AtlasTravelPlan {
  fromPlaceId: string;
  toPlaceId: string;
  placeIds: string[];
  pathIds: string[];
  distanceMiles: number;
  durationMinutes: number;
  speedFeet: number;
  weather: AtlasTravelWeather;
  encounterChance: number;
  segments: AtlasTravelSegment[];
}

export interface AtlasInspectorIssue {
  code: string;
  message: string;
  entityId: string | null;
}

export interface AtlasInspectorReport {
  placeCount: number;
  regionCount: number;
  pathCount: number;
  landmassCount: number;
  discoveredPlaceCount: number;
  discoveredRegionCount: number;
  issues: AtlasInspectorIssue[];
}

export type AtlasPlacePatch = Partial<
  Pick<
    AtlasPlace,
    | "landmassId"
    | "regionId"
    | "name"
    | "kind"
    | "x"
    | "y"
    | "importance"
    | "population"
    | "description"
    | "tags"
  >
>;

export type AtlasRegionPatch = Partial<
  Pick<AtlasRegion, "landmassId" | "name" | "center" | "biome" | "importance">
>;

export type AtlasPathPatch = Partial<
  Pick<AtlasPath, "kind" | "fromPlaceId" | "toPlaceId" | "distanceMiles" | "points">
>;

export type WorldAtlasEditOperation =
  | { type: "place.create"; place: AtlasPlace }
  | { type: "place.update"; id: string; patch: AtlasPlacePatch }
  | { type: "place.delete"; id: string }
  | { type: "region.create"; region: AtlasRegion }
  | { type: "region.update"; id: string; patch: AtlasRegionPatch }
  | { type: "region.delete"; id: string }
  | { type: "path.create"; path: AtlasPath }
  | { type: "path.update"; id: string; patch: AtlasPathPatch }
  | { type: "path.delete"; id: string };

type RuntimeAtlas = WorldAtlasDocument & { exploration?: AtlasExplorationState };

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

function uniqueKnownIds(values: readonly string[], known: ReadonlySet<string>): string[] {
  return [...new Set(values.filter((value) => known.has(value)))];
}

function startingPlace(atlas: WorldAtlasDocument): AtlasPlace {
  const ranked = [...atlas.places].sort((a, b) => {
    if (a.kind === "capital" && b.kind !== "capital") return -1;
    if (a.kind !== "capital" && b.kind === "capital") return 1;
    return b.importance - a.importance;
  });
  const first = ranked[0];
  if (!first) throw new RangeError("A world atlas needs at least one place for exploration.");
  return first;
}

export function createInitialExplorationState(atlas: WorldAtlasDocument): AtlasExplorationState {
  const start = startingPlace(atlas);
  return {
    discoveredPlaceIds: [start.id],
    discoveredRegionIds: start.regionId ? [start.regionId] : [],
    partyPosition: { placeId: start.id, x: start.x, y: start.y },
    weather: "clear",
    campaignMinutes: 0,
    travelHistory: [],
    pendingEncounter: null,
  };
}

export function explorationState(atlas: WorldAtlasDocument): AtlasExplorationState {
  const runtime = atlas as RuntimeAtlas;
  const stored = runtime.exploration;
  if (!stored) return createInitialExplorationState(atlas);

  const placeIds = new Set(atlas.places.map((place) => place.id));
  const regionIds = new Set(atlas.regions.map((region) => region.id));
  const fallback = startingPlace(atlas);
  const positionPlace = atlas.places.find((place) => place.id === stored.partyPosition?.placeId);
  const position = positionPlace ?? fallback;

  return {
    discoveredPlaceIds: uniqueKnownIds(stored.discoveredPlaceIds ?? [], placeIds).length
      ? uniqueKnownIds(stored.discoveredPlaceIds ?? [], placeIds)
      : [position.id],
    discoveredRegionIds: uniqueKnownIds(stored.discoveredRegionIds ?? [], regionIds),
    partyPosition: { placeId: position.id, x: position.x, y: position.y },
    weather: stored.weather ?? "clear",
    campaignMinutes:
      Number.isFinite(stored.campaignMinutes) && stored.campaignMinutes >= 0
        ? Math.floor(stored.campaignMinutes)
        : 0,
    travelHistory: Array.isArray(stored.travelHistory) ? stored.travelHistory.slice(-100) : [],
    pendingEncounter: stored.pendingEncounter ?? null,
  };
}

export function withExplorationState(
  atlas: WorldAtlasDocument,
  state: AtlasExplorationState,
): WorldAtlasDocument {
  return { ...atlas, exploration: state } as RuntimeAtlas;
}

function normalizePath(atlas: WorldAtlasDocument, path: AtlasPath): AtlasPath {
  const from = atlas.places.find((place) => place.id === path.fromPlaceId);
  const to = atlas.places.find((place) => place.id === path.toPlaceId);
  if (!from || !to) return path;
  const points = path.points.length >= 2 ? [...path.points] : [];
  if (points.length < 2) {
    points.push({ x: from.x, y: from.y }, { x: to.x, y: to.y });
  } else {
    points[0] = { x: from.x, y: from.y };
    points[points.length - 1] = { x: to.x, y: to.y };
  }
  return {
    ...path,
    points,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
  };
}

function normalizeAttachedPaths(atlas: WorldAtlasDocument, placeId: string): WorldAtlasDocument {
  const next = {
    ...atlas,
    paths: atlas.paths.map((path) =>
      path.fromPlaceId === placeId || path.toPlaceId === placeId ? normalizePath(atlas, path) : path,
    ),
  };
  return next;
}

export function applyAtlasEdit(
  atlas: WorldAtlasDocument,
  operation: WorldAtlasEditOperation,
): WorldAtlasDocument {
  switch (operation.type) {
    case "place.create": {
      if (atlas.places.some((place) => place.id === operation.place.id)) {
        throw new RangeError(`Place ${operation.place.id} already exists.`);
      }
      return { ...atlas, places: [...atlas.places, operation.place] };
    }
    case "place.update": {
      if (!atlas.places.some((place) => place.id === operation.id)) {
        throw new RangeError(`Place ${operation.id} does not exist.`);
      }
      const next = {
        ...atlas,
        places: atlas.places.map((place) =>
          place.id === operation.id ? { ...place, ...operation.patch } : place,
        ),
      };
      return normalizeAttachedPaths(next, operation.id);
    }
    case "place.delete": {
      const remaining = atlas.places.filter((place) => place.id !== operation.id);
      if (remaining.length === atlas.places.length) {
        throw new RangeError(`Place ${operation.id} does not exist.`);
      }
      const state = explorationState(atlas);
      if (state.partyPosition.placeId === operation.id) {
        throw new RangeError("Move the party before deleting its current place.");
      }
      return withExplorationState(
        {
          ...atlas,
          places: remaining,
          paths: atlas.paths.filter(
            (path) => path.fromPlaceId !== operation.id && path.toPlaceId !== operation.id,
          ),
        },
        {
          ...state,
          discoveredPlaceIds: state.discoveredPlaceIds.filter((id) => id !== operation.id),
        },
      );
    }
    case "region.create": {
      if (atlas.regions.some((region) => region.id === operation.region.id)) {
        throw new RangeError(`Region ${operation.region.id} already exists.`);
      }
      return { ...atlas, regions: [...atlas.regions, operation.region] };
    }
    case "region.update": {
      if (!atlas.regions.some((region) => region.id === operation.id)) {
        throw new RangeError(`Region ${operation.id} does not exist.`);
      }
      return {
        ...atlas,
        regions: atlas.regions.map((region) =>
          region.id === operation.id ? { ...region, ...operation.patch } : region,
        ),
      };
    }
    case "region.delete": {
      if (!atlas.regions.some((region) => region.id === operation.id)) {
        throw new RangeError(`Region ${operation.id} does not exist.`);
      }
      const state = explorationState(atlas);
      return withExplorationState(
        {
          ...atlas,
          regions: atlas.regions.filter((region) => region.id !== operation.id),
          places: atlas.places.map((place) =>
            place.regionId === operation.id ? { ...place, regionId: null } : place,
          ),
        },
        {
          ...state,
          discoveredRegionIds: state.discoveredRegionIds.filter((id) => id !== operation.id),
        },
      );
    }
    case "path.create": {
      if (atlas.paths.some((path) => path.id === operation.path.id)) {
        throw new RangeError(`Path ${operation.path.id} already exists.`);
      }
      const next = { ...atlas, paths: [...atlas.paths, operation.path] };
      return {
        ...next,
        paths: next.paths.map((path) =>
          path.id === operation.path.id ? normalizePath(next, path) : path,
        ),
      };
    }
    case "path.update": {
      if (!atlas.paths.some((path) => path.id === operation.id)) {
        throw new RangeError(`Path ${operation.id} does not exist.`);
      }
      const next = {
        ...atlas,
        paths: atlas.paths.map((path) =>
          path.id === operation.id ? { ...path, ...operation.patch } : path,
        ),
      };
      return {
        ...next,
        paths: next.paths.map((path) =>
          path.id === operation.id ? normalizePath(next, path) : path,
        ),
      };
    }
    case "path.delete": {
      if (!atlas.paths.some((path) => path.id === operation.id)) {
        throw new RangeError(`Path ${operation.id} does not exist.`);
      }
      return { ...atlas, paths: atlas.paths.filter((path) => path.id !== operation.id) };
    }
  }
}

export function inspectAtlas(atlas: WorldAtlasDocument): AtlasInspectorReport {
  const issues: AtlasInspectorIssue[] = [];
  const placeIds = new Set(atlas.places.map((place) => place.id));
  const regionIds = new Set(atlas.regions.map((region) => region.id));
  const landmassIds = new Set(atlas.landmasses.map((landmass) => landmass.id));

  for (const place of atlas.places) {
    if (!landmassIds.has(place.landmassId)) {
      issues.push({
        code: "place.missing_landmass",
        message: `${place.name} references a missing landmass.`,
        entityId: place.id,
      });
    }
    if (place.regionId && !regionIds.has(place.regionId)) {
      issues.push({
        code: "place.missing_region",
        message: `${place.name} references a missing region.`,
        entityId: place.id,
      });
    }
  }

  for (const region of atlas.regions) {
    if (!landmassIds.has(region.landmassId)) {
      issues.push({
        code: "region.missing_landmass",
        message: `${region.name} references a missing landmass.`,
        entityId: region.id,
      });
    }
  }

  for (const path of atlas.paths) {
    if (!placeIds.has(path.fromPlaceId) || !placeIds.has(path.toPlaceId)) {
      issues.push({
        code: "path.missing_endpoint",
        message: `${path.id} has a missing endpoint.`,
        entityId: path.id,
      });
    }
    if (path.distanceMiles <= 0 || path.points.length < 2) {
      issues.push({
        code: "path.invalid_geometry",
        message: `${path.id} has invalid travel geometry.`,
        entityId: path.id,
      });
    }
  }

  const state = explorationState(atlas);
  return {
    placeCount: atlas.places.length,
    regionCount: atlas.regions.length,
    pathCount: atlas.paths.length,
    landmassCount: atlas.landmasses.length,
    discoveredPlaceCount: state.discoveredPlaceIds.length,
    discoveredRegionCount: state.discoveredRegionIds.length,
    issues,
  };
}

interface RouteEdge {
  path: AtlasPath;
  to: string;
}

export function findAtlasRoute(
  atlas: WorldAtlasDocument,
  fromPlaceId: string,
  toPlaceId: string,
  options: { allowSeaRoutes?: boolean } = {},
): { placeIds: string[]; pathIds: string[]; distanceMiles: number } | null {
  if (fromPlaceId === toPlaceId) {
    return { placeIds: [fromPlaceId], pathIds: [], distanceMiles: 0 };
  }
  const placeIds = new Set(atlas.places.map((place) => place.id));
  if (!placeIds.has(fromPlaceId) || !placeIds.has(toPlaceId)) return null;

  const graph = new Map<string, RouteEdge[]>();
  for (const path of atlas.paths) {
    if (!options.allowSeaRoutes && path.kind === "sea-route") continue;
    if (!placeIds.has(path.fromPlaceId) || !placeIds.has(path.toPlaceId)) continue;
    graph.set(path.fromPlaceId, [
      ...(graph.get(path.fromPlaceId) ?? []),
      { path, to: path.toPlaceId },
    ]);
    graph.set(path.toPlaceId, [
      ...(graph.get(path.toPlaceId) ?? []),
      { path, to: path.fromPlaceId },
    ]);
  }

  const distances = new Map<string, number>([[fromPlaceId, 0]]);
  const previous = new Map<string, { placeId: string; pathId: string }>();
  const pending = new Set<string>(placeIds);

  while (pending.size > 0) {
    let current: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const candidate of pending) {
      const value = distances.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (value < currentDistance) {
        current = candidate;
        currentDistance = value;
      }
    }
    if (current === null || !Number.isFinite(currentDistance)) break;
    pending.delete(current);
    if (current === toPlaceId) break;

    for (const edge of graph.get(current) ?? []) {
      if (!pending.has(edge.to)) continue;
      const candidateDistance = currentDistance + Math.max(1, edge.path.distanceMiles);
      if (candidateDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidateDistance);
        previous.set(edge.to, { placeId: current, pathId: edge.path.id });
      }
    }
  }

  if (!previous.has(toPlaceId)) return null;
  const routePlaces = [toPlaceId];
  const routePaths: string[] = [];
  let cursor = toPlaceId;
  while (cursor !== fromPlaceId) {
    const step = previous.get(cursor);
    if (!step) return null;
    routePaths.unshift(step.pathId);
    routePlaces.unshift(step.placeId);
    cursor = step.placeId;
  }

  return {
    placeIds: routePlaces,
    pathIds: routePaths,
    distanceMiles: distances.get(toPlaceId) ?? 0,
  };
}

function biomeForSegment(
  atlas: WorldAtlasDocument,
  fromPlaceId: string,
  toPlaceId: string,
) {
  const destination = atlas.places.find((place) => place.id === toPlaceId);
  const source = atlas.places.find((place) => place.id === fromPlaceId);
  const place = destination ?? source;
  const region = place?.regionId
    ? atlas.regions.find((candidate) => candidate.id === place.regionId)
    : null;
  const landmass = place
    ? atlas.landmasses.find((candidate) => candidate.id === place.landmassId)
    : null;
  return region?.biome ?? landmass?.biome ?? "temperate";
}

export function planAtlasTravel(input: {
  atlas: WorldAtlasDocument;
  state: AtlasExplorationState;
  destinationPlaceId: string;
  speedFeet: number;
  weather?: AtlasTravelWeather;
}): AtlasTravelPlan {
  const route = findAtlasRoute(
    input.atlas,
    input.state.partyPosition.placeId,
    input.destinationPlaceId,
  );
  if (!route) throw new RangeError("No overland road or trail route reaches that destination.");
  if (route.pathIds.length === 0) throw new RangeError("The party is already at that destination.");

  const weather = input.weather ?? input.state.weather;
  const segments: AtlasTravelSegment[] = [];
  let totalMinutes = 0;
  let combinedNoEncounterChance = 1;

  for (let index = 0; index < route.pathIds.length; index += 1) {
    const pathId = route.pathIds[index]!;
    const path = input.atlas.paths.find((candidate) => candidate.id === pathId);
    const fromPlaceId = route.placeIds[index]!;
    const toPlaceId = route.placeIds[index + 1]!;
    if (!path) throw new RangeError(`Travel path ${pathId} is unavailable.`);
    const biome = biomeForSegment(input.atlas, fromPlaceId, toPlaceId);
    const terrain = terrainForPath(path.kind, biome);
    const timing = calculateOverlandTravel({
      distanceMiles: Math.max(1, path.distanceMiles),
      speedFeet: input.speedFeet,
      terrain,
      weather,
    });
    totalMinutes += timing.durationMinutes;
    const chance = travelEncounterChance({
      terrain,
      weather,
      distanceMiles: path.distanceMiles,
    });
    combinedNoEncounterChance *= 1 - chance;
    segments.push({
      pathId,
      fromPlaceId,
      toPlaceId,
      distanceMiles: path.distanceMiles,
      terrain,
      durationMinutes: timing.durationMinutes,
      effectiveMilesPerDay: timing.effectiveMilesPerDay,
    });
  }

  return {
    fromPlaceId: input.state.partyPosition.placeId,
    toPlaceId: input.destinationPlaceId,
    placeIds: route.placeIds,
    pathIds: route.pathIds,
    distanceMiles: route.distanceMiles,
    durationMinutes: totalMinutes,
    speedFeet: input.speedFeet,
    weather,
    encounterChance: Math.min(0.9, 1 - combinedNoEncounterChance),
    segments,
  };
}

export function commitAtlasTravel(input: {
  atlas: WorldAtlasDocument;
  state: AtlasExplorationState;
  plan: AtlasTravelPlan;
  travelId: string;
  encounterRoll: number;
}): AtlasExplorationState {
  if (!Number.isFinite(input.encounterRoll) || input.encounterRoll < 0 || input.encounterRoll > 1) {
    throw new RangeError("encounterRoll must be between 0 and 1.");
  }
  const destination = input.atlas.places.find((place) => place.id === input.plan.toPlaceId);
  if (!destination) throw new RangeError("Travel destination is unavailable.");
  const encounterTriggered = input.encounterRoll < input.plan.encounterChance;
  const endedCampaignMinute = input.state.campaignMinutes + input.plan.durationMinutes;
  const record: AtlasTravelRecord = {
    id: input.travelId,
    fromPlaceId: input.plan.fromPlaceId,
    toPlaceId: input.plan.toPlaceId,
    pathIds: [...input.plan.pathIds],
    distanceMiles: input.plan.distanceMiles,
    durationMinutes: input.plan.durationMinutes,
    speedFeet: input.plan.speedFeet,
    weather: input.plan.weather,
    startedCampaignMinute: input.state.campaignMinutes,
    endedCampaignMinute,
    encounterTriggered,
  };

  const discoveredPlaceIds = new Set(input.state.discoveredPlaceIds);
  const discoveredRegionIds = new Set(input.state.discoveredRegionIds);
  for (const placeId of input.plan.placeIds) {
    discoveredPlaceIds.add(placeId);
    const place = input.atlas.places.find((candidate) => candidate.id === placeId);
    if (place?.regionId) discoveredRegionIds.add(place.regionId);
  }

  return {
    ...input.state,
    discoveredPlaceIds: [...discoveredPlaceIds],
    discoveredRegionIds: [...discoveredRegionIds],
    partyPosition: { placeId: destination.id, x: destination.x, y: destination.y },
    weather: input.plan.weather,
    campaignMinutes: endedCampaignMinute,
    travelHistory: [...input.state.travelHistory, record].slice(-100),
    pendingEncounter: encounterTriggered
      ? {
          id: `travel-encounter-${input.travelId}`,
          travelRecordId: input.travelId,
          placeId: destination.id,
          chance: input.plan.encounterChance,
          roll: input.encounterRoll,
          createdCampaignMinute: endedCampaignMinute,
        }
      : null,
  };
}
