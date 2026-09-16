import type { AtlasBiome, AtlasPath, AtlasPlace, WorldAtlasDocument } from "./atlas";

export type TravelWeather =
  | "clear"
  | "rain"
  | "snow"
  | "heavy-snow"
  | "sleet"
  | "hail"
  | "fog"
  | "storm"
  | "blizzard"
  | "duststorm";

export type Dnd35TravelTerrain =
  | "desert"
  | "forest"
  | "hills"
  | "jungle"
  | "moor"
  | "mountains"
  | "plains"
  | "swamp"
  | "tundra";

export interface TravelRouteLeg {
  pathId: string;
  fromPlaceId: string;
  toPlaceId: string;
  distanceMiles: number;
  terrain: Dnd35TravelTerrain;
  terrainMultiplier: number;
}

export interface TravelRoutePlan {
  fromPlaceId: string;
  toPlaceId: string;
  placeIds: string[];
  pathIds: string[];
  legs: TravelRouteLeg[];
  distanceMiles: number;
  equivalentMiles: number;
  terrainMultiplier: number;
}

export interface Dnd35TravelTiming {
  partySpeedFeet: number;
  milesPerHour: number;
  terrainMultiplier: number;
  weatherMultiplier: number;
  effectiveMilesPerHour: number;
  travelMinutes: number;
  elapsedClockMinutes: number;
  travelDays: number;
  overnightRestMinutes: number;
}

const TRACKLESS_MULTIPLIERS: Record<Dnd35TravelTerrain, number> = {
  desert: 0.5,
  forest: 0.5,
  hills: 0.5,
  jungle: 0.25,
  moor: 0.75,
  mountains: 0.5,
  plains: 0.75,
  swamp: 0.5,
  tundra: 0.75,
};

const ROAD_TRAIL_MULTIPLIERS: Record<Dnd35TravelTerrain, number> = {
  desert: 0.5,
  forest: 1,
  hills: 0.75,
  jungle: 0.75,
  moor: 1,
  mountains: 0.75,
  plains: 1,
  swamp: 0.75,
  tundra: 0.75,
};

export function atlasBiomeToTravelTerrain(biome: AtlasBiome): Dnd35TravelTerrain {
  switch (biome) {
    case "desert":
      return "desert";
    case "forest":
      return "forest";
    case "jungle":
      return "jungle";
    case "swamp":
      return "swamp";
    case "tundra":
      return "tundra";
    case "highlands":
    case "badlands":
      return "hills";
    case "steppe":
    case "temperate":
      return "plains";
    case "enchanted":
      return "moor";
  }
}

/**
 * D&D 3.5 terrain multipliers for overland travel. Atlas `road` and `trail`
 * paths use the Road or Trail column. Trackless is exposed for future freeform
 * routing; sea routes intentionally require a separate vehicle system.
 */
export function dnd35TerrainMultiplier(
  terrain: Dnd35TravelTerrain,
  surface: "highway" | "road-or-trail" | "trackless",
): number {
  if (surface === "highway") return terrain === "mountains" ? 0.75 : 1;
  if (surface === "road-or-trail") return ROAD_TRAIL_MULTIPLIERS[terrain];
  return TRACKLESS_MULTIPLIERS[terrain];
}

/**
 * Fixed movement multipliers are only applied where 3.5 gives a concrete
 * movement cost. Rain/fog/storm still affect encounter/navigation policy but
 * do not invent an unsupported universal overland-speed scalar.
 */
export function weatherMovementMultiplier(weather: TravelWeather): number {
  switch (weather) {
    case "snow":
    case "sleet":
    case "hail":
      return 0.5;
    case "heavy-snow":
    case "blizzard":
      return 0.25;
    default:
      return 1;
  }
}

function placeBiome(atlas: WorldAtlasDocument, place: AtlasPlace): AtlasBiome {
  if (place.regionId) {
    const region = atlas.regions.find((entry) => entry.id === place.regionId);
    if (region) return region.biome;
  }
  return atlas.landmasses.find((entry) => entry.id === place.landmassId)?.biome ?? "temperate";
}

function pathTerrain(atlas: WorldAtlasDocument, path: AtlasPath): Dnd35TravelTerrain {
  const from = atlas.places.find((place) => place.id === path.fromPlaceId);
  const to = atlas.places.find((place) => place.id === path.toPlaceId);
  if (from && to) {
    const fromTerrain = atlasBiomeToTravelTerrain(placeBiome(atlas, from));
    const toTerrain = atlasBiomeToTravelTerrain(placeBiome(atlas, to));
    return dnd35TerrainMultiplier(fromTerrain, "road-or-trail") <=
      dnd35TerrainMultiplier(toTerrain, "road-or-trail")
      ? fromTerrain
      : toTerrain;
  }
  if (from) return atlasBiomeToTravelTerrain(placeBiome(atlas, from));
  if (to) return atlasBiomeToTravelTerrain(placeBiome(atlas, to));
  return "plains";
}

function edgeCost(atlas: WorldAtlasDocument, path: AtlasPath): number | null {
  if (path.kind === "sea-route") return null;
  const terrain = pathTerrain(atlas, path);
  return path.distanceMiles / dnd35TerrainMultiplier(terrain, "road-or-trail");
}

export function planAtlasRoute(
  atlas: WorldAtlasDocument,
  fromPlaceId: string,
  toPlaceId: string,
): TravelRoutePlan | null {
  if (fromPlaceId === toPlaceId) return null;
  const placeIds = new Set(atlas.places.map((place) => place.id));
  if (!placeIds.has(fromPlaceId) || !placeIds.has(toPlaceId)) return null;

  const distanceByPlace = new Map<string, number>([[fromPlaceId, 0]]);
  const previous = new Map<string, { placeId: string; pathId: string }>();
  const remaining = new Set(placeIds);

  while (remaining.size > 0) {
    let currentId: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const candidateId of remaining) {
      const candidateDistance = distanceByPlace.get(candidateId) ?? Number.POSITIVE_INFINITY;
      if (candidateDistance < currentDistance) {
        currentDistance = candidateDistance;
        currentId = candidateId;
      }
    }
    if (!currentId || !Number.isFinite(currentDistance)) break;
    remaining.delete(currentId);
    if (currentId === toPlaceId) break;

    for (const path of atlas.paths) {
      const nextId =
        path.fromPlaceId === currentId
          ? path.toPlaceId
          : path.toPlaceId === currentId
            ? path.fromPlaceId
            : null;
      if (!nextId || !remaining.has(nextId)) continue;
      const cost = edgeCost(atlas, path);
      if (cost === null) continue;
      const nextDistance = currentDistance + cost;
      if (nextDistance >= (distanceByPlace.get(nextId) ?? Number.POSITIVE_INFINITY)) continue;
      distanceByPlace.set(nextId, nextDistance);
      previous.set(nextId, { placeId: currentId, pathId: path.id });
    }
  }

  if (!previous.has(toPlaceId)) return null;
  const reversedPlaces = [toPlaceId];
  const reversedPaths: string[] = [];
  let cursor = toPlaceId;
  while (cursor !== fromPlaceId) {
    const step = previous.get(cursor);
    if (!step) return null;
    reversedPaths.push(step.pathId);
    reversedPlaces.push(step.placeId);
    cursor = step.placeId;
  }
  const routePlaceIds = reversedPlaces.reverse();
  const routePathIds = reversedPaths.reverse();
  const legs: TravelRouteLeg[] = [];
  let actualDistance = 0;
  let equivalentMiles = 0;

  routePathIds.forEach((pathId, index) => {
    const path = atlas.paths.find((entry) => entry.id === pathId);
    const from = routePlaceIds[index];
    const to = routePlaceIds[index + 1];
    if (!path || !from || !to) return;
    const terrain = pathTerrain(atlas, path);
    const terrainMultiplier = dnd35TerrainMultiplier(terrain, "road-or-trail");
    actualDistance += path.distanceMiles;
    equivalentMiles += path.distanceMiles / terrainMultiplier;
    legs.push({
      pathId,
      fromPlaceId: from,
      toPlaceId: to,
      distanceMiles: path.distanceMiles,
      terrain,
      terrainMultiplier,
    });
  });
  if (legs.length !== routePathIds.length || actualDistance <= 0 || equivalentMiles <= 0) return null;

  return {
    fromPlaceId,
    toPlaceId,
    placeIds: routePlaceIds,
    pathIds: routePathIds,
    legs,
    distanceMiles: actualDistance,
    equivalentMiles,
    terrainMultiplier: actualDistance / equivalentMiles,
  };
}

/** Normal walking pace: 30 ft. speed = 3 mph and 24 miles per 8-hour day. */
export function calculateDnd35TravelTiming(input: {
  route: TravelRoutePlan;
  partySpeedFeet: number;
  weather: TravelWeather;
}): Dnd35TravelTiming {
  if (!Number.isFinite(input.partySpeedFeet) || input.partySpeedFeet <= 0) {
    throw new RangeError("Party land speed must be positive.");
  }
  const milesPerHour = input.partySpeedFeet / 10;
  const weatherMultiplier = weatherMovementMultiplier(input.weather);
  const effectiveMilesPerHour = milesPerHour * input.route.terrainMultiplier * weatherMultiplier;
  if (effectiveMilesPerHour <= 0) throw new RangeError("Travel speed must remain positive.");
  const travelHours = input.route.distanceMiles / effectiveMilesPerHour;
  const travelMinutes = Math.max(1, Math.ceil(travelHours * 60));
  const travelDays = Math.max(1, Math.ceil(travelHours / 8));
  const overnightRestMinutes = Math.max(0, travelDays - 1) * 16 * 60;
  return {
    partySpeedFeet: input.partySpeedFeet,
    milesPerHour,
    terrainMultiplier: input.route.terrainMultiplier,
    weatherMultiplier,
    effectiveMilesPerHour,
    travelMinutes,
    elapsedClockMinutes: travelMinutes + overnightRestMinutes,
    travelDays,
    overnightRestMinutes,
  };
}

/**
 * Endless Codex encounter policy layered on top of 3.5 movement/weather rules.
 * 3.5 does not define one universal percentage for every wilderness campaign,
 * so the threshold is explicit and auditable rather than presented as RAW.
 */
export function travelEncounterPolicy(input: {
  route: TravelRoutePlan;
  weather: TravelWeather;
  travelMinutes: number;
}): { checks: number; threshold: number } {
  const difficultTerrain = input.route.terrainMultiplier < 0.75;
  const inclement = ["rain", "snow", "sleet", "hail", "fog", "storm", "blizzard", "duststorm"].includes(
    input.weather,
  );
  const severe = ["storm", "blizzard", "duststorm"].includes(input.weather);
  const threshold = Math.min(35, 10 + (difficultTerrain ? 5 : 0) + (inclement ? 5 : 0) + (severe ? 5 : 0));
  return {
    checks: Math.max(1, Math.ceil(input.travelMinutes / (4 * 60))),
    threshold,
  };
}
