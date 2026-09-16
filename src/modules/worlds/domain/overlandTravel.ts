import type { AtlasBiome, AtlasPathKind } from "./atlas";

export type AtlasTravelWeather =
  | "clear"
  | "rain"
  | "storm"
  | "snow"
  | "blizzard"
  | "extreme-heat"
  | "extreme-cold";

export type AtlasTravelTerrain =
  | "road"
  | "trail"
  | "plains"
  | "forest"
  | "desert"
  | "hills"
  | "jungle"
  | "moor"
  | "mountains"
  | "swamp"
  | "tundra"
  | "enchanted";

export interface OverlandTravelSegmentInput {
  distanceMiles: number;
  speedFeet: number;
  terrain: AtlasTravelTerrain;
  weather: AtlasTravelWeather;
  hoursPerDay?: number;
}

export interface OverlandTravelTiming {
  distanceMiles: number;
  speedFeet: number;
  terrain: AtlasTravelTerrain;
  weather: AtlasTravelWeather;
  terrainMultiplier: number;
  weatherMultiplier: number;
  effectiveMilesPerHour: number;
  effectiveMilesPerDay: number;
  durationMinutes: number;
  travelHours: number;
  travelDays: number;
  remainderHours: number;
  forcedMarchHoursPerDay: number;
}

const TRACKLESS_TERRAIN_MULTIPLIER: Record<AtlasTravelTerrain, number> = {
  road: 1,
  trail: 1,
  plains: 1,
  forest: 0.5,
  desert: 0.5,
  hills: 0.75,
  jungle: 0.25,
  moor: 0.75,
  mountains: 0.5,
  swamp: 0.5,
  tundra: 0.75,
  enchanted: 0.5,
};

const WEATHER_MULTIPLIER: Record<AtlasTravelWeather, number> = {
  clear: 1,
  rain: 0.75,
  storm: 0.5,
  snow: 0.5,
  blizzard: 0.25,
  "extreme-heat": 0.75,
  "extreme-cold": 0.75,
};

function positiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
  return value;
}

export function dnd35BaseMilesPerHour(speedFeet: number): number {
  return positiveFinite(speedFeet, "speedFeet") / 10;
}

export function dnd35BaseMilesPerDay(speedFeet: number): number {
  return dnd35BaseMilesPerHour(speedFeet) * 8;
}

export function travelTerrainMultiplier(terrain: AtlasTravelTerrain): number {
  return TRACKLESS_TERRAIN_MULTIPLIER[terrain];
}

export function travelWeatherMultiplier(weather: AtlasTravelWeather): number {
  return WEATHER_MULTIPLIER[weather];
}

export function terrainForBiome(biome: AtlasBiome): AtlasTravelTerrain {
  switch (biome) {
    case "forest":
      return "forest";
    case "desert":
    case "badlands":
      return "desert";
    case "jungle":
      return "jungle";
    case "swamp":
      return "swamp";
    case "tundra":
      return "tundra";
    case "highlands":
      return "hills";
    case "enchanted":
      return "enchanted";
    case "steppe":
    case "temperate":
      return "plains";
  }
}

export function terrainForPath(kind: AtlasPathKind, biome: AtlasBiome): AtlasTravelTerrain {
  if (kind === "road") return "road";
  if (kind === "trail") return "trail";
  return terrainForBiome(biome);
}

export function calculateOverlandTravel(
  input: OverlandTravelSegmentInput,
): OverlandTravelTiming {
  const distanceMiles = positiveFinite(input.distanceMiles, "distanceMiles");
  const speedFeet = positiveFinite(input.speedFeet, "speedFeet");
  const hoursPerDay = input.hoursPerDay ?? 8;
  positiveFinite(hoursPerDay, "hoursPerDay");

  const terrainMultiplier = travelTerrainMultiplier(input.terrain);
  const weatherMultiplier = travelWeatherMultiplier(input.weather);
  const effectiveMilesPerHour =
    dnd35BaseMilesPerHour(speedFeet) * terrainMultiplier * weatherMultiplier;
  const effectiveMilesPerDay = effectiveMilesPerHour * hoursPerDay;
  const travelHours = distanceMiles / effectiveMilesPerHour;
  const durationMinutes = Math.max(1, Math.ceil(travelHours * 60));
  const travelDays = Math.floor(travelHours / hoursPerDay);
  const remainderHours = travelHours - travelDays * hoursPerDay;

  return {
    distanceMiles,
    speedFeet,
    terrain: input.terrain,
    weather: input.weather,
    terrainMultiplier,
    weatherMultiplier,
    effectiveMilesPerHour,
    effectiveMilesPerDay,
    durationMinutes,
    travelHours,
    travelDays,
    remainderHours,
    forcedMarchHoursPerDay: Math.max(0, hoursPerDay - 8),
  };
}

export function travelEncounterChance(input: {
  terrain: AtlasTravelTerrain;
  weather: AtlasTravelWeather;
  distanceMiles: number;
}): number {
  const terrainRisk: Record<AtlasTravelTerrain, number> = {
    road: 0.06,
    trail: 0.1,
    plains: 0.09,
    forest: 0.12,
    desert: 0.1,
    hills: 0.11,
    jungle: 0.16,
    moor: 0.11,
    mountains: 0.14,
    swamp: 0.15,
    tundra: 0.1,
    enchanted: 0.18,
  };
  const weatherRisk: Record<AtlasTravelWeather, number> = {
    clear: 0,
    rain: 0.01,
    storm: 0.03,
    snow: 0.02,
    blizzard: 0.05,
    "extreme-heat": 0.02,
    "extreme-cold": 0.02,
  };
  const distanceFactor = Math.min(0.12, Math.max(0, input.distanceMiles) / 500);
  return Math.min(0.45, terrainRisk[input.terrain] + weatherRisk[input.weather] + distanceFactor);
}
