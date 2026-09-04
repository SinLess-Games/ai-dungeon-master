/**
 * Tactical map model. Rendered in 2.5D isometric projection: a square grid
 * (5 ft per square) where every tile carries an elevation, and props (walls,
 * doors, stairs) stand on top of tiles. Multiple levels stack into dungeons.
 */

export type MapTerrain =
  | "stone"
  | "dirt"
  | "grass"
  | "wood"
  | "sand"
  | "water"
  | "lava"
  | "ice"
  | "rubble"
  | "void";

export const MAP_TERRAINS: {
  id: MapTerrain;
  label: string;
  top: string;
  side: string;
  difficult?: boolean;
}[] = [
  { id: "stone", label: "Stone", top: "#6f6b64", side: "#4a4741" },
  { id: "dirt", label: "Dirt", top: "#7b6244", side: "#54432f" },
  { id: "grass", label: "Grass", top: "#5c7a42", side: "#3d522c" },
  { id: "wood", label: "Wood", top: "#8a6339", side: "#5d4326" },
  { id: "sand", label: "Sand", top: "#c3a86c", side: "#8b7749" },
  { id: "water", label: "Water", top: "#33638f", side: "#22456381", difficult: true },
  { id: "lava", label: "Lava", top: "#b3441c", side: "#6f2810", difficult: true },
  { id: "ice", label: "Ice", top: "#a8c8d8", side: "#748d99", difficult: true },
  { id: "rubble", label: "Rubble", top: "#6b6155", side: "#473f37", difficult: true },
  { id: "void", label: "Void / pit", top: "#0d1220", side: "#080b13" },
];

export type PropKind = "wall" | "door" | "window" | "stairs" | "ladder" | "pillar" | "rubblepile";

export const PROP_KINDS: { id: PropKind; label: string; blocksSight: boolean }[] = [
  { id: "wall", label: "Wall", blocksSight: true },
  { id: "door", label: "Door", blocksSight: true },
  { id: "window", label: "Window", blocksSight: false },
  { id: "stairs", label: "Stairs", blocksSight: false },
  { id: "ladder", label: "Ladder", blocksSight: false },
  { id: "pillar", label: "Pillar", blocksSight: true },
  { id: "rubblepile", label: "Rubble pile", blocksSight: false },
];

export type TokenSize = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan" | "colossal";

export const TOKEN_SIZES: { id: TokenSize; label: string; squares: number }[] = [
  { id: "tiny", label: "Tiny", squares: 1 },
  { id: "small", label: "Small", squares: 1 },
  { id: "medium", label: "Medium", squares: 1 },
  { id: "large", label: "Large", squares: 2 },
  { id: "huge", label: "Huge", squares: 3 },
  { id: "gargantuan", label: "Gargantuan", squares: 4 },
  { id: "colossal", label: "Colossal", squares: 6 },
];

export interface MapTile {
  /** Terrain id. */
  t: MapTerrain;
  /** Elevation in 5 ft steps. */
  e: number;
}

export interface MapProp {
  id: string;
  levelId: string;
  x: number;
  y: number;
  kind: PropKind;
  /** Height in 5 ft steps above the tile. */
  height: number;
  open?: boolean;
  /** For stairs/ladders: which level they lead to. */
  targetLevelId?: string;
}

export interface MapToken {
  id: string;
  levelId: string;
  name: string;
  x: number;
  y: number;
  size: TokenSize;
  /** Flying/climbing height above the tile, in 5 ft steps. */
  altitude: number;
  color: string;
  faction: "party" | "ally" | "enemy" | "neutral";
  hp?: number;
  maxHp?: number;
  conditions: string[];
  portraitUrl?: string;
}

export interface MapTrap {
  id: string;
  levelId: string;
  x: number;
  y: number;
  name: string;
  trigger: string;
  searchDC: number;
  disableDC: number;
  save?: string;
  damage?: string;
  found: boolean;
  sprung: boolean;
}

export interface MapLevel {
  id: string;
  name: string;
  /** Stack order: higher is further up. */
  z: number;
  width: number;
  height: number;
  tiles: MapTile[];
  /** Revealed squares when fog is on. */
  revealed: boolean[];
}

export type MapKind =
  | "dungeon"
  | "cave"
  | "city"
  | "town"
  | "village"
  | "keep"
  | "camp"
  | "ruin"
  | "wilderness";

export interface TacticalMap {
  id: string;
  worldId?: string;
  siteId?: string;
  name: string;
  kind: MapKind;
  levels: MapLevel[];
  props: MapProp[];
  tokens: MapToken[];
  traps: MapTrap[];
  activeLevelId: string;
  fogEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function makeLevel(id: string, name: string, z: number, width = 24, height = 24): MapLevel {
  return {
    id,
    name,
    z,
    width,
    height,
    tiles: Array.from({ length: width * height }, () => ({ t: "stone" as MapTerrain, e: 0 })),
    revealed: Array.from({ length: width * height }, () => false),
  };
}

export function emptyMap(id: string, name: string, levelId: string, kind: MapKind = "dungeon"): TacticalMap {
  const now = new Date().toISOString();
  return {
    id,
    name,
    kind,
    levels: [makeLevel(levelId, "Ground floor", 0)],
    props: [],
    tokens: [],
    traps: [],
    activeLevelId: levelId,
    fogEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function tileIndex(level: MapLevel, x: number, y: number) {
  return y * level.width + x;
}

export function tileAt(level: MapLevel, x: number, y: number): MapTile | undefined {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return undefined;
  return level.tiles[tileIndex(level, x, y)];
}

/** 3.5 diagonal counting: every second diagonal costs 10 ft. */
export function gridDistanceFeet(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const diag = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diag;
  return (straight + diag + Math.floor(diag / 2)) * 5;
}

/** Falling damage: 1d6 per 10 ft, capped at 20d6. */
export function fallingDamage(feet: number) {
  const dice = Math.min(20, Math.floor(feet / 10));
  return dice > 0 ? `${dice}d6` : "none";
}

/** High ground grants +1 on melee attacks in 3.5. */
export function highGroundBonus(attackerZ: number, defenderZ: number) {
  return attackerZ > defenderZ ? 1 : 0;
}

/** Cover from an elevation difference and intervening blocking props. */
export function coverBonus(blocked: boolean, partial: boolean) {
  if (blocked) return { ac: 4, reflex: 2, label: "Cover" };
  if (partial) return { ac: 2, reflex: 1, label: "Partial cover" };
  return { ac: 0, reflex: 0, label: "No cover" };
}

const BLOCKING = new Set(PROP_KINDS.filter((p) => p.blocksSight).map((p) => p.id));

/** Bresenham line of sight on the active level, respecting props and elevation. */
export function hasLineOfSight(
  level: MapLevel,
  props: MapProp[],
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const blockers = new Set(
    props
      .filter((p) => p.levelId === level.id && BLOCKING.has(p.kind) && !(p.kind === "door" && p.open))
      .map((p) => `${p.x},${p.y}`),
  );
  let x0 = a.x;
  let y0 = a.y;
  const dx = Math.abs(b.x - x0);
  const dy = -Math.abs(b.y - y0);
  const sx = x0 < b.x ? 1 : -1;
  const sy = y0 < b.y ? 1 : -1;
  let err = dx + dy;
  const startE = tileAt(level, a.x, a.y)?.e ?? 0;
  const endE = tileAt(level, b.x, b.y)?.e ?? 0;
  const maxE = Math.max(startE, endE);
  for (;;) {
    if (x0 === b.x && y0 === b.y) return true;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
    if (x0 === b.x && y0 === b.y) return true;
    if (blockers.has(`${x0},${y0}`)) return false;
    const t = tileAt(level, x0, y0);
    if (t && t.e > maxE) return false;
  }
}

/** Reveal squares within a radius of a point (fog of war). */
export function revealAround(level: MapLevel, props: MapProp[], x: number, y: number, radius: number) {
  for (let ty = Math.max(0, y - radius); ty <= Math.min(level.height - 1, y + radius); ty++) {
    for (let tx = Math.max(0, x - radius); tx <= Math.min(level.width - 1, x + radius); tx++) {
      if (Math.hypot(tx - x, ty - y) > radius) continue;
      if (hasLineOfSight(level, props, { x, y }, { x: tx, y: ty })) {
        level.revealed[tileIndex(level, tx, ty)] = true;
      }
    }
  }
}
