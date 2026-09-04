/**
 * World model: regions, settlements, dungeons, routes, factions and the party
 * marker. Coordinates are normalised 0-100 so the world map scales to any size.
 */

export type TerrainKind =
  | "plains"
  | "forest"
  | "hills"
  | "mountains"
  | "desert"
  | "swamp"
  | "tundra"
  | "jungle"
  | "coast"
  | "sea"
  | "wasteland"
  | "underdark";

export const TERRAIN_KINDS: { id: TerrainKind; label: string; color: string; speed: number }[] = [
  { id: "plains", label: "Plains", color: "#7c8f4a", speed: 1 },
  { id: "forest", label: "Forest", color: "#3f6b3f", speed: 0.5 },
  { id: "hills", label: "Hills", color: "#8a7f45", speed: 0.75 },
  { id: "mountains", label: "Mountains", color: "#6d6a63", speed: 0.33 },
  { id: "desert", label: "Desert", color: "#c2a765", speed: 0.75 },
  { id: "swamp", label: "Swamp", color: "#4c5f45", speed: 0.5 },
  { id: "tundra", label: "Tundra", color: "#9fb0b8", speed: 0.75 },
  { id: "jungle", label: "Jungle", color: "#2f5c3a", speed: 0.33 },
  { id: "coast", label: "Coast", color: "#6f9aa8", speed: 1 },
  { id: "sea", label: "Sea", color: "#2c4a68", speed: 1 },
  { id: "wasteland", label: "Wasteland", color: "#7a5c4a", speed: 0.75 },
  { id: "underdark", label: "Underdark", color: "#3b3350", speed: 0.5 },
];

export type SiteKind =
  | "city"
  | "town"
  | "village"
  | "keep"
  | "dungeon"
  | "ruin"
  | "lair"
  | "wonder"
  | "camp"
  | "port";

export const SITE_KINDS: { id: SiteKind; label: string; glyph: string }[] = [
  { id: "city", label: "City", glyph: "🏙" },
  { id: "town", label: "Town", glyph: "🏘" },
  { id: "village", label: "Village", glyph: "🏡" },
  { id: "keep", label: "Keep / fort", glyph: "🏰" },
  { id: "dungeon", label: "Dungeon", glyph: "⛓" },
  { id: "ruin", label: "Ruin", glyph: "🏛" },
  { id: "lair", label: "Lair", glyph: "🐉" },
  { id: "wonder", label: "Wonder", glyph: "✨" },
  { id: "camp", label: "Camp", glyph: "⛺" },
  { id: "port", label: "Port", glyph: "⚓" },
];

export interface WorldRegion {
  id: string;
  name: string;
  terrain: TerrainKind;
  description?: string;
  /** Normalised rect, 0-100. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldSite {
  id: string;
  name: string;
  kind: SiteKind;
  x: number;
  y: number;
  regionId?: string;
  description?: string;
  population?: number;
  government?: string;
  discovered: boolean;
  /** Tactical map that this site opens into. */
  mapId?: string;
}

export interface WorldRoute {
  id: string;
  fromSiteId: string;
  toSiteId: string;
  kind: "road" | "trail" | "river" | "sea";
}

export interface WorldFaction {
  id: string;
  name: string;
  description?: string;
  standing: number;
}

export interface WorldEra {
  id: string;
  name: string;
  summary: string;
}

export interface World {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  themes: string[];
  history: WorldEra[];
  pantheon: { id: string; name: string; domain: string; alignment?: string }[];
  regions: WorldRegion[];
  sites: WorldSite[];
  routes: WorldRoute[];
  factions: WorldFaction[];
  party: { x: number; y: number; siteId?: string };
  /** Miles per normalised unit — used for travel time. */
  scaleMilesPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

export const WORLD_THEMES = [
  "High fantasy",
  "Grim-dark",
  "Steampunk / magi-tech",
  "Sword & sorcery",
  "Post-apocalyptic",
  "Planar",
  "Nautical",
  "Frontier",
  "Gothic horror",
  "Mythic epic",
  "Fairytale",
  "Science fantasy",
];

export function emptyWorld(id: string, name: string): World {
  const now = new Date().toISOString();
  return {
    id,
    name,
    themes: [],
    history: [],
    pantheon: [],
    regions: [],
    sites: [],
    routes: [],
    factions: [],
    party: { x: 50, y: 50 },
    scaleMilesPerUnit: 30,
    createdAt: now,
    updatedAt: now,
  };
}

const TERRAIN_SPEED = new Map(TERRAIN_KINDS.map((t) => [t.id, t.speed]));

/** Straight-line distance in miles between two normalised points. */
export function worldDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
  scale: number,
) {
  return Math.hypot(b.x - a.x, b.y - a.y) * scale;
}

/** Days of travel at a given overland speed (miles/day) across a terrain. */
export function travelDays(miles: number, milesPerDay: number, terrain: TerrainKind) {
  const factor = TERRAIN_SPEED.get(terrain) ?? 1;
  const effective = Math.max(1, milesPerDay * factor);
  return miles / effective;
}

/** Which region contains a point, if any. */
export function regionAt(world: World, x: number, y: number): WorldRegion | undefined {
  return [...world.regions]
    .reverse()
    .find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}
