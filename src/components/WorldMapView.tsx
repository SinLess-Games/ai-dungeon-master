import { useEffect, useMemo, useRef, useState } from "react";
import {
  SITE_KINDS,
  type TerrainKind,
  type World,
  type WorldRegion,
  type WorldSite,
} from "@/lib/world";

const SITE_LABEL = new Map(SITE_KINDS.map((s) => [s.id, s.label]));

/* ------------------------------------------------------------------ */
/* deterministic pseudo-random helpers                                  */
/* ------------------------------------------------------------------ */

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

type Pt = [number, number];

/* ------------------------------------------------------------------ */
/* terrain palette — painted atlas look                                 */
/* ------------------------------------------------------------------ */

type Paint = { base: string; shade: string; ink: string; deep: string };

const PAINT: Record<TerrainKind, Paint> = {
  plains: { base: "#d3d29a", shade: "#bcbc7f", ink: "#79803f", deep: "#a8ab6c" },
  forest: { base: "#a8bf88", shade: "#8aa96c", ink: "#3f6234", deep: "#7c9c60" },
  hills: { base: "#cfc48a", shade: "#b8aa6d", ink: "#7d6c35", deep: "#ad9d61" },
  mountains: { base: "#cec6b4", shade: "#b0a795", ink: "#5b5348", deep: "#9d9484" },
  desert: { base: "#efe0ad", shade: "#e1cd8e", ink: "#a48c4b", deep: "#d8c07f" },
  swamp: { base: "#adb888", shade: "#909d6b", ink: "#4f5c38", deep: "#84925f" },
  tundra: { base: "#e8eef0", shade: "#cfdadf", ink: "#7f939d", deep: "#c4d2d8" },
  jungle: { base: "#93b878", shade: "#6f9a58", ink: "#2f5a2f", deep: "#628c4d" },
  coast: { base: "#e0d8ac", shade: "#cbc294", ink: "#8b8355", deep: "#c0b684" },
  sea: { base: "#9dbdcb", shade: "#84a7b8", ink: "#4d7488", deep: "#7fa2b4" },
  wasteland: { base: "#ddc7a5", shade: "#c6ab86", ink: "#7f6547", deep: "#bda07c" },
  underdark: { base: "#bab2c5", shade: "#a096ae", ink: "#584f68", deep: "#968ba6" },
};

/* ------------------------------------------------------------------ */
/* coastline: fractal midpoint displacement around an ellipse           */
/* ------------------------------------------------------------------ */

function coastPoints(r: WorldRegion): Pt[] {
  const rand = rng(hash(r.id + r.name));
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  // oversized so neighbouring regions fuse into a single continent
  const rx = (r.w / 2) * 1.34;
  const ry = (r.h / 2) * 1.34;

  let pts: Pt[] = [];
  const base = 16;
  for (let i = 0; i < base; i++) {
    const a = (i / base) * Math.PI * 2;
    const wobble = 0.72 + rand() * 0.4;
    pts.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble]);
  }

  // 4 rounds of midpoint displacement => fjords, headlands, bays
  let rough = 0.5;
  for (let pass = 0; pass < 5; pass++) {
    const next: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      const q = pts[(i + 1) % pts.length]!;
      next.push(p);
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const len = Math.hypot(dx, dy) || 0.001;
      const off = (rand() - 0.5) * len * rough;
      next.push([mx + (-dy / len) * off, my + (dx / len) * off]);
    }
    pts = next;
    rough *= 0.66;
  }
  return pts;
}

/** Smooth closed path through points (Catmull-Rom → cubic bezier). */
function smoothPath(pts: Pt[], tension = 14) {
  if (!pts.length) return "";
  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % pts.length]!;
    const p3 = pts[(i + 2) % pts.length]!;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / tension, p1[1] + (p2[1] - p0[1]) / tension];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / tension, p2[1] - (p3[1] - p1[1]) / tension];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

/* ------------------------------------------------------------------ */
/* terrain features: ridges, woods, dunes                               */
/* ------------------------------------------------------------------ */

interface Feature {
  kind: "peak" | "hill" | "tree" | "dune" | "marsh" | "ice" | "grass";
  x: number;
  y: number;
  s: number;
}

function features(r: WorldRegion): Feature[] {
  const rand = rng(hash("feat" + r.id));
  const out: Feature[] = [];
  const area = r.w * r.h;

  const push = (kind: Feature["kind"], x: number, y: number, s: number) =>
    out.push({ kind, x, y, s });

  const inX = (t: number) => r.x + r.w * (0.1 + t * 0.8);
  const inY = (t: number) => r.y + r.h * (0.12 + t * 0.76);

  if (r.terrain === "mountains" || r.terrain === "hills") {
    // ridges: chains of peaks following a wandering spine
    const chains = Math.max(2, Math.round(area / 130));
    for (let c = 0; c < chains; c++) {
      let x = inX(rand());
      let y = inY(rand());
      const dir = rand() * Math.PI;
      const n = 4 + Math.floor(rand() * 6);
      for (let i = 0; i < n; i++) {
        push(r.terrain === "mountains" ? "peak" : "hill", x, y, 0.75 + rand() * 0.6);
        x += Math.cos(dir + (rand() - 0.5) * 0.9) * (1.6 + rand());
        y += Math.sin(dir + (rand() - 0.5) * 0.9) * (0.9 + rand() * 0.6);
      }
    }
  } else if (r.terrain === "forest" || r.terrain === "jungle" || r.terrain === "swamp") {
    const clumps = Math.max(3, Math.round(area / 85));
    for (let c = 0; c < clumps; c++) {
      const cx = inX(rand());
      const cy = inY(rand());
      const n = 4 + Math.floor(rand() * 7);
      for (let i = 0; i < n; i++) {
        push(
          r.terrain === "swamp" && rand() > 0.5 ? "marsh" : "tree",
          cx + (rand() - 0.5) * 5,
          cy + (rand() - 0.5) * 3.4,
          0.7 + rand() * 0.5,
        );
      }
    }
  } else if (r.terrain === "desert" || r.terrain === "wasteland") {
    const n = Math.max(6, Math.round(area / 55));
    for (let i = 0; i < n; i++) push("dune", inX(rand()), inY(rand()), 0.8 + rand() * 0.7);
  } else if (r.terrain === "tundra") {
    const n = Math.max(6, Math.round(area / 55));
    for (let i = 0; i < n; i++) push("ice", inX(rand()), inY(rand()), 0.8 + rand() * 0.6);
  } else {
    const n = Math.max(6, Math.round(area / 60));
    for (let i = 0; i < n; i++) push("grass", inX(rand()), inY(rand()), 0.8 + rand() * 0.5);
    // a few lonely copses on open ground
    for (let i = 0; i < Math.round(n / 3); i++)
      push("tree", inX(rand()), inY(rand()), 0.6 + rand() * 0.3);
  }

  return out.sort((a, b) => a.y - b.y);
}

function FeatureMark({ f, ink }: { f: Feature; ink: string }) {
  const { x, y, s } = f;
  switch (f.kind) {
    case "peak": {
      const h = 2.5 * s;
      const w = 1.7 * s;
      return (
        <g>
          <path d={`M ${x - w} ${y} L ${x - w * 0.2} ${y - h} L ${x + w} ${y} Z`} fill="#efe9dd" stroke={ink} strokeWidth={0.16} strokeLinejoin="round" />
          <path d={`M ${x - w * 0.2} ${y - h} L ${x + w} ${y} L ${x + w * 0.15} ${y} Z`} fill={ink} opacity={0.32} />
          <path d={`M ${x - w * 0.55} ${y - h * 0.52} L ${x - w * 0.2} ${y - h} L ${x + w * 0.2} ${y - h * 0.5} L ${x} ${y - h * 0.62} Z`} fill="#ffffff" opacity={0.9} />
        </g>
      );
    }
    case "hill":
      return (
        <g>
          <path d={`M ${x - 1.5 * s} ${y} q ${0.75 * s} ${-1.5 * s} ${1.5 * s} 0 Z`} fill="#e3dcc6" stroke={ink} strokeWidth={0.14} />
          <path d={`M ${x + 0.1 * s} ${y - 0.75 * s} q ${0.5 * s} ${0.35 * s} ${0.65 * s} ${0.75 * s} L ${x + 0.1 * s} ${y} Z`} fill={ink} opacity={0.22} />
        </g>
      );
    case "tree":
      return (
        <g>
          <path d={`M ${x} ${y + 0.4 * s} L ${x} ${y - 0.3 * s}`} stroke={ink} strokeWidth={0.16} />
          <path
            d={`M ${x} ${y - 1.9 * s} L ${x + 0.85 * s} ${y - 0.2 * s} L ${x - 0.85 * s} ${y - 0.2 * s} Z`}
            fill={ink}
            fillOpacity={0.55}
            stroke={ink}
            strokeWidth={0.14}
            strokeLinejoin="round"
          />
        </g>
      );
    case "marsh":
      return (
        <g stroke={ink} strokeWidth={0.15} opacity={0.75}>
          <path d={`M ${x - 1.1 * s} ${y} h ${1.4 * s}`} />
          <path d={`M ${x - 0.5 * s} ${y + 0.6 * s} h ${1.4 * s}`} />
        </g>
      );
    case "dune":
      return (
        <path
          d={`M ${x - 1.4 * s} ${y} q ${0.7 * s} ${-0.8 * s} ${1.4 * s} 0 q ${0.7 * s} ${0.8 * s} ${1.4 * s} 0`}
          fill="none"
          stroke={ink}
          strokeWidth={0.15}
          strokeLinecap="round"
          opacity={0.65}
        />
      );
    case "ice":
      return (
        <g stroke={ink} strokeWidth={0.13} opacity={0.6}>
          <path d={`M ${x - 0.9 * s} ${y} h ${1.8 * s}`} />
          <path d={`M ${x - 0.45 * s} ${y + 0.55 * s} h ${1.2 * s}`} />
        </g>
      );
    default:
      return (
        <g stroke={ink} strokeWidth={0.12} opacity={0.45}>
          <path d={`M ${x - 0.8 * s} ${y} q ${0.4 * s} ${-0.45 * s} ${0.8 * s} 0`} />
          <path d={`M ${x + 0.3 * s} ${y + 0.5 * s} q ${0.35 * s} ${-0.4 * s} ${0.7 * s} 0`} />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* settlement marks                                                     */
/* ------------------------------------------------------------------ */

function SiteGlyph({ kind, x, y, gold }: { kind: WorldSite["kind"]; x: number; y: number; gold: string }) {
  const ink = "#3c3427";
  switch (kind) {
    case "city":
      return (
        <g stroke={ink} strokeWidth={0.16} strokeLinejoin="round">
          <rect x={x - 1.7} y={y - 1.1} width={3.4} height={1.7} fill="#f0e3c2" />
          <rect x={x - 1.5} y={y - 2.3} width={0.8} height={1.2} fill="#e7d8b3" />
          <rect x={x - 0.4} y={y - 2.8} width={0.9} height={1.7} fill="#e7d8b3" />
          <rect x={x + 0.8} y={y - 2.2} width={0.8} height={1.1} fill="#e7d8b3" />
          <path d={`M ${x - 1.5} ${y - 2.3} l 0.4 -0.7 l 0.4 0.7 Z`} fill="#a4442b" />
          <path d={`M ${x - 0.4} ${y - 2.8} l 0.45 -0.8 l 0.45 0.8 Z`} fill="#a4442b" />
          <path d={`M ${x + 0.8} ${y - 2.2} l 0.4 -0.7 l 0.4 0.7 Z`} fill="#a4442b" />
        </g>
      );
    case "town":
      return (
        <g stroke={ink} strokeWidth={0.16} strokeLinejoin="round">
          <rect x={x - 1.2} y={y - 0.9} width={2.4} height={1.4} fill="#f0e3c2" />
          <path d={`M ${x - 1.4} ${y - 0.9} L ${x} ${y - 2} L ${x + 1.4} ${y - 0.9} Z`} fill="#a4442b" />
        </g>
      );
    case "village":
    case "camp":
      return (
        <g stroke={ink} strokeWidth={0.15} strokeLinejoin="round" fill="#f0e3c2">
          <path d={`M ${x - 1.1} ${y + 0.4} L ${x - 0.35} ${y - 1.1} L ${x + 0.4} ${y + 0.4} Z`} />
          <path d={`M ${x + 0.1} ${y + 0.4} L ${x + 0.8} ${y - 0.7} L ${x + 1.4} ${y + 0.4} Z`} />
        </g>
      );
    case "keep":
      return (
        <g stroke={ink} strokeWidth={0.16} strokeLinejoin="round" fill="#e6d9bb">
          <rect x={x - 1.4} y={y - 1.4} width={2.8} height={2} />
          <rect x={x - 1.8} y={y - 2.3} width={0.85} height={1} />
          <rect x={x + 0.95} y={y - 2.3} width={0.85} height={1} />
          <path d={`M ${x - 0.35} ${y - 2.4} l 1.2 0.4 l -1.2 0.4 Z`} fill="#a4442b" stroke="none" />
          <path d={`M ${x - 0.35} ${y - 2.5} v 1.1`} />
        </g>
      );
    case "ruin":
      return (
        <g stroke={ink} strokeWidth={0.18} fill="none" strokeLinecap="round">
          <path d={`M ${x - 1.3} ${y + 0.5} L ${x - 1.3} ${y - 1.1} M ${x - 0.2} ${y + 0.5} L ${x - 0.2} ${y - 1.7} M ${x + 1.1} ${y + 0.5} L ${x + 1.1} ${y - 0.7}`} />
          <path d={`M ${x - 1.6} ${y - 1.4} L ${x + 0.1} ${y - 1.9}`} opacity={0.8} />
          <path d={`M ${x - 1.7} ${y + 0.55} L ${x + 1.6} ${y + 0.55}`} />
        </g>
      );
    case "dungeon":
      return (
        <g stroke={ink} strokeWidth={0.18}>
          <path d={`M ${x - 1.6} ${y + 0.6} q ${1.6} ${-2.6} ${3.2} 0 Z`} fill="#cfc3a8" />
          <path d={`M ${x - 0.65} ${y + 0.6} q ${0.65} ${-1.3} ${1.3} 0 Z`} fill="#241f18" />
        </g>
      );
    case "lair":
      return (
        <g stroke={ink} strokeWidth={0.15} fill="#8d3a2c" strokeLinejoin="round">
          <path d={`M ${x - 1.7} ${y + 0.5} q ${0.9} ${-1.6} ${1.9} ${-0.9} q ${0.7} ${-1.1} ${1.5} ${-0.2} q ${-0.5} ${1.6} ${-1.6} ${1.5} q ${-1} ${0.6} ${-1.8} ${-0.4} Z`} />
        </g>
      );
    case "port":
      return (
        <g stroke={ink} strokeWidth={0.2} fill="none" strokeLinecap="round">
          <path d={`M ${x} ${y - 1.7} L ${x} ${y + 0.9}`} />
          <path d={`M ${x - 0.9} ${y - 1.1} L ${x + 0.9} ${y - 1.1}`} />
          <path d={`M ${x - 1.2} ${y + 0.1} q ${1.2} ${1.5} ${2.4} 0`} />
        </g>
      );
    default:
      return (
        <g stroke={gold} strokeWidth={0.18} fill="#f5e7bd" strokeLinejoin="round">
          <path
            d={`M ${x} ${y - 1.7} L ${x + 0.55} ${y - 0.55} L ${x + 1.7} ${y - 0.4} L ${x + 0.85} ${y + 0.45} L ${x + 1.05} ${y + 1.6} L ${x} ${y + 1} L ${x - 1.05} ${y + 1.6} L ${x - 0.85} ${y + 0.45} L ${x - 1.7} ${y - 0.4} L ${x - 0.55} ${y - 0.55} Z`}
          />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* meandering roads / rivers: never a straight line                     */
/* ------------------------------------------------------------------ */

/** Catmull-Rom through an open list of points, rendered as smooth beziers. */
function curveThrough(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* keep settlements on dry land                                         */
/* ------------------------------------------------------------------ */

function pointInPoly(pts: Pt[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const LAND_SITES = new Set([
  "city",
  "town",
  "village",
  "keep",
  "camp",
  "ruin",
  "dungeon",
  "lair",
  "wonder",
  "wood",
  "forest",
  "mountain",
  "landmark",
  "site",
  "port",
  "harbor",
  "tower",
  "temple",
  "mine",
  "fort",
]);

/** Nudge a settlement inland until it sits inside a landmass. */
function snapToLand(s: WorldSite, polys: Pt[][], inland: number): { x: number; y: number } {
  if (!polys.length) return { x: s.x, y: s.y };
  const isLand = (x: number, y: number) => polys.some((p) => pointInPoly(p, x, y));
  if (isLand(s.x, s.y)) return { x: s.x, y: s.y };

  // spiral outward for the closest dry-land point
  let best: { x: number; y: number } | null = null;
  let bestD = Infinity;
  for (let r = 0.6; r <= 26 && !best; r += 0.6) {
    for (let a = 0; a < 48; a++) {
      const ang = (a / 48) * Math.PI * 2;
      const x = s.x + Math.cos(ang) * r;
      const y = s.y + Math.sin(ang) * r;
      if (!isLand(x, y)) continue;
      // step a little further inland so the glyph is clear of the shoreline
      const ix = x + Math.cos(ang) * inland;
      const iy = y + Math.sin(ang) * inland;
      const use = isLand(ix, iy) ? { x: ix, y: iy } : { x, y };
      const d = Math.hypot(use.x - s.x, use.y - s.y);
      if (d < bestD) {
        bestD = d;
        best = use;
      }
    }
    if (bestD < Infinity) break;
  }
  return best ?? { x: s.x, y: s.y };
}



function wanderPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  seed: string,
  kind: string,
): string {
  const rand = rng(hash(seed + kind));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // three overlapping waves give a wandering, terrain-following line
  const waves = [0, 1, 2].map(() => ({
    amp: (rand() - 0.5) * (kind === "river" ? 0.3 : 0.26) * len,
    freq: 1 + Math.floor(rand() * 3),
    phase: rand() * Math.PI * 2,
  }));
  const bias = (rand() - 0.5) * (kind === "river" ? 0.24 : 0.2) * len;

  const steps = Math.max(6, Math.min(16, Math.round(len / 4)));
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const taper = Math.sin(Math.PI * t); // pinned at both settlements
    let off = bias * taper;
    for (const w of waves) off += w.amp * taper * Math.sin(w.freq * Math.PI * t + w.phase);
    // small along-track jitter so the line is not evenly paced
    const jitter = i === 0 || i === steps ? 0 : (rand() - 0.5) * 0.9;
    pts.push([
      a.x + dx * t + nx * off + (dx / len) * jitter,
      a.y + dy * t + ny * off + (dy / len) * jitter,
    ]);
  }
  return curveThrough(pts);
}

export interface WorldMapViewProps {

  world: World;
  selectedSiteId?: string | null;
  onSelectSite?: (site: WorldSite) => void;
  onMapClick?: (x: number, y: number) => void;
  showUndiscovered?: boolean;
  className?: string;
  /** AI-painted backdrop; when present the drawn terrain is replaced by it. */
  artUrl?: string | undefined;
}

/** Illustrated overland atlas map. Coordinates are normalised 0-100. */
export function WorldMapView({
  world,
  selectedSiteId,
  onSelectSite,
  onMapClick,
  showUndiscovered = true,
  className,
  artUrl,
}: WorldMapViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const gold = "#9c7c34";

  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const land = useMemo(
    () =>
      world.regions.map((r) => {
        const pts = coastPoints(r);
        return { region: r, d: smoothPath(pts), feats: features(r) };
      }),
    [world.regions],
  );

  const clampView = (z: number, x: number, y: number) => ({
    z,
    x: Math.min(0, Math.max(100 * (1 - z), x)),
    y: Math.min(0, Math.max(70 * (1 - z), y)),
  });

  /** Zoom around a point given in map units. */
  const zoomAt = (mx: number, my: number, factor: number) => {
    setView((v) => {
      const z = Math.min(10, Math.max(1, v.z * factor));
      const k = z / v.z;
      return clampView(z, mx - (mx - v.x) * k, my - (my - v.y) * k);
    });
  };

  const toMap = (clientX: number, clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 70,
    };
  };

  const zoomRef = useRef(zoomAt);
  zoomRef.current = zoomAt;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 70;
      zoomRef.current(mx, my, Math.exp(-dy * 0.0018));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / rect.width) * 100;
    const dy = ((e.clientY - d.y) / rect.height) * 70;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) d.moved = true;
    d.x = e.clientX;
    d.y = e.clientY;
    setView((v) => clampView(v.z, v.x + dx, v.y + dy));
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const moved = drag.current?.moved;
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (moved) return;
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onMapClick || !ref.current) return;
    const p = toMap(e.clientX, e.clientY);
    const x = (p.x - view.x) / view.z;
    const y = (p.y - view.y) / view.z;
    onMapClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }

  // settlements must sit on land, never in open water
  const placed = useMemo(() => {
    const polys = world.regions.map((r) => coastPoints(r));
    const map = new Map<string, { x: number; y: number }>();
    for (const s of world.sites) {
      const needsLand = LAND_SITES.has(s.kind);
      const inland = 1.2;
      map.set(s.id, needsLand ? snapToLand(s, polys, inland) : { x: s.x, y: s.y });
    }
    return map;
  }, [world.regions, world.sites]);

  const at = (s: WorldSite) => placed.get(s.id) ?? { x: s.x, y: s.y };

  // labels keep a constant on-screen size as the map is zoomed
  const ts = (base: number) => +(base / view.z).toFixed(3);

  const sites = world.sites.filter((s) => showUndiscovered || s.discovered);
  const siteById = new Map(world.sites.map((s) => [s.id, s]));


  return (
    <div className={`relative overflow-hidden ${className ?? "h-full w-full"}`}>
    <svg
      ref={ref}
      viewBox="0 0 100 70"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="h-full w-full touch-none rounded-lg border border-border"
      style={{ fontFamily: "'Cinzel', 'EB Garamond', serif", cursor: drag.current ? "grabbing" : "grab" }}
      role="img"
      aria-label="World map"
    >

      <defs>
        <radialGradient id="wm-ocean" cx="50%" cy="42%" r="80%">
          <stop offset="0%" stopColor="#6f96aa" />
          <stop offset="60%" stopColor="#5b8296" />
          <stop offset="100%" stopColor="#3f6376" />
        </radialGradient>
        <pattern id="wm-grid" width="6.25" height="6.25" patternUnits="userSpaceOnUse">
          <path d="M 6.25 0 L 0 0 0 6.25" fill="none" stroke="rgba(233,244,247,0.13)" strokeWidth="0.09" />
        </pattern>

        {/* ocean water texture */}
        <filter id="wm-water" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="4" seed="7" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
        </filter>

        {/* paper grain over everything */}
        <filter id="wm-paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="4" seed="3" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.16" />
          </feComponentTransfer>
        </filter>

        {/* ragged, hand-inked edges on the whole landmass */}
        <filter id="wm-rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="0.55" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="wm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.5" dy="0.7" stdDeviation="0.7" floodColor="#1d3440" floodOpacity="0.45" />
        </filter>

        <filter id="wm-blur1"><feGaussianBlur stdDeviation="0.5" /></filter>
        <filter id="wm-blur2"><feGaussianBlur stdDeviation="1.1" /></filter>
        <filter id="wm-blur3"><feGaussianBlur stdDeviation="2" /></filter>

        {/* coastal ink line drawn once around the merged silhouette */}
        <filter id="wm-outline" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.3" result="fat" />
          <feFlood floodColor="#2f4a55" result="ink" />
          <feComposite in="ink" in2="fat" operator="in" result="edge" />
          <feMerge>
            <feMergeNode in="edge" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* inner shore shading: darker where land meets water */}
        <filter id="wm-shore" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="erode" radius="1.1" result="core" />
          <feComposite in="SourceAlpha" in2="core" operator="out" result="rim" />
          <feGaussianBlur in="rim" stdDeviation="0.7" result="soft" />
          <feFlood floodColor="#6b5a34" result="c" />
          <feComposite in="c" in2="soft" operator="in" />
        </filter>

        {world.regions.map((r) => (
          <clipPath key={r.id} id={`wm-clip-${r.id}`}>
            <path d={smoothPath(coastPoints(r))} />
          </clipPath>
        ))}
        <clipPath id="wm-clip-land">
          {land.map(({ region, d }) => (
            <path key={region.id} d={d} />
          ))}
        </clipPath>
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>


      {artUrl && (
        <image
          href={artUrl}
          x="0"
          y="0"
          width="100"
          height="70"
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {!artUrl && (
        <>
      {/* ---------------- ocean ---------------- */}
      <rect x="0" y="0" width="100" height="70" fill="url(#wm-ocean)" />
      <rect x="0" y="0" width="100" height="70" filter="url(#wm-water)" opacity="0.5" />
      <rect x="0" y="0" width="100" height="70" fill="url(#wm-grid)" />

      {/* ---------------- bathymetry bands around the coast ---------------- */}
      {[
        { f: "url(#wm-blur3)", w: 6.5, o: 0.34 },
        { f: "url(#wm-blur2)", w: 3.6, o: 0.4 },
        { f: "url(#wm-blur1)", w: 1.5, o: 0.5 },
      ].map((band, i) => (
        <g key={i} filter={band.f} opacity={band.o}>
          {land.map(({ region, d }) => (
            <path key={region.id} d={d} fill="#cfe6ec" stroke="#cfe6ec" strokeWidth={band.w} />
          ))}
        </g>
      ))}

      {/* ---------------- continent ---------------- */}
      <g filter="url(#wm-shadow)">
        <g filter="url(#wm-rough)">
          <g filter="url(#wm-outline)">
            {/* terrain fills */}
            {land.map(({ region, d }) => {
              const paint = PAINT[region.terrain] ?? PAINT.plains;
              return (
                <g key={region.id}>
                  <path d={d} fill={paint.base} />
                  <g clipPath={`url(#wm-clip-${region.id})`}>
                    <path d={d} fill="none" stroke={paint.deep} strokeWidth="4.5" opacity="0.35" />
                    <path d={d} fill="none" stroke={paint.shade} strokeWidth="1.8" opacity="0.45" />
                  </g>
                </g>
              );
            })}

            {/* soften the seams between neighbouring regions */}
            <g clipPath="url(#wm-clip-land)" filter="url(#wm-blur2)" opacity="0.55">
              {land.map(({ region, d }) => (
                <path key={`blend-${region.id}`} d={d} fill={(PAINT[region.terrain] ?? PAINT.plains).base} />
              ))}
            </g>

            {/* drawn terrain on top of the paint */}
            {land.map(({ region, feats }) => {
              const paint = PAINT[region.terrain] ?? PAINT.plains;
              return (
                <g key={`feat-${region.id}`} clipPath={`url(#wm-clip-${region.id})`}>
                  {feats.map((f, i) => (
                    <FeatureMark key={i} f={f} ink={paint.ink} />
                  ))}
                </g>
              );
            })}


            {/* shoreline sand shading inside the coast */}
            <g filter="url(#wm-shore)" opacity="0.5">
              {land.map(({ region, d }) => (
                <path key={`shore-${region.id}`} d={d} fill="#000" />
              ))}
            </g>
          </g>
        </g>
      </g>

      {/* ---------------- roads, rivers, sea lanes ---------------- */}
      {world.routes.map((route) => {
        const fa = siteById.get(route.fromSiteId);
        const fb = siteById.get(route.toSiteId);
        if (!fa || !fb) return null;
        const a = at(fa);
        const b = at(fb);
        const d = wanderPath(a, b, route.id, route.kind);
        const water = route.kind === "river" || route.kind === "sea";
        return (
          <g key={route.id}>
            {route.kind === "road" && (
              <path d={d} fill="none" stroke="#f2e8cd" strokeWidth="0.85" opacity="0.55" strokeLinecap="round" />
            )}
            <path
              d={d}
              fill="none"
              stroke={water ? "#4d7f96" : "#6b5636"}
              strokeWidth={route.kind === "river" ? 0.4 : route.kind === "road" ? 0.32 : 0.24}
              strokeDasharray={route.kind === "trail" ? "0.8 0.9" : route.kind === "sea" ? "1.6 1.1" : undefined}
              opacity={0.85}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
        </>
      )}



      {/* ---------------- region names ---------------- */}
      {world.regions.map((r) => (
        <text
          key={`label-${r.id}`}
          x={r.x + r.w / 2}
          y={r.y + r.h * 0.24}
          textAnchor="middle"
          fontSize={ts(2.6)}
          letterSpacing={ts(0.45)}
          fill="#4c3f28"
          opacity="0.85"
          stroke="#f6efd9"
          strokeWidth={ts(0.6)}
          paintOrder="stroke"
          style={{ textTransform: "uppercase" }}
        >
          {r.name}
        </text>
      ))}

      {/* ---------------- sites ---------------- */}
      {sites.map((s) => {
        const selected = s.id === selectedSiteId;
        const p = at(s);
        return (
          <g
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite?.(s);
            }}
            style={{ cursor: onSelectSite ? "pointer" : "default" }}
            opacity={s.discovered ? 1 : 0.42}
          >
            <title>{`${s.name} — ${SITE_LABEL.get(s.kind) ?? s.kind}`}</title>
            <g transform={`translate(${p.x} ${p.y}) scale(${1 / view.z})`}>
              {selected && <circle r="3.4" fill="none" stroke={gold} strokeWidth="0.35" />}
              <SiteGlyph kind={s.kind} x={0} y={0} gold={gold} />
            </g>
            <text
              x={p.x}
              y={p.y + ts(3)}
              textAnchor="middle"
              fontSize={ts(1.7)}
              fill="#2e2418"
              stroke="#f7f0dc"
              strokeWidth={ts(0.5)}
              paintOrder="stroke"
            >
              {s.name}
            </text>
          </g>
        );
      })}

      {/* ---------------- party ---------------- */}
      <g>
        <g transform={`translate(${world.party.x} ${world.party.y}) scale(${1 / view.z})`}>
          <circle r="1.4" fill="#a72b27" stroke="#f7f0dc" strokeWidth="0.35" />
          <circle r="2.7" fill="none" stroke="#a72b27" strokeWidth="0.2" opacity="0.55" />
        </g>
        <text
          x={world.party.x}
          y={world.party.y - ts(3.2)}
          textAnchor="middle"
          fontSize={ts(1.8)}
          fill="#7d1f1c"
          stroke="#f7f0dc"
          strokeWidth={ts(0.55)}
          paintOrder="stroke"
        >
          Party
        </text>
      </g>

      </g>

      {/* ---------------- compass rose (fixed) ---------------- */}
      <g transform="translate(92.5,10)" opacity="0.9" pointerEvents="none">
        <circle r="5" fill="#f4ecd6" fillOpacity="0.85" stroke={gold} strokeWidth="0.3" />
        <circle r="3.6" fill="none" stroke={gold} strokeWidth="0.12" opacity="0.7" />
        <path d="M 0 -4.2 L 0.9 0 L 0 4.2 L -0.9 0 Z" fill="#3c3427" />
        <path d="M -4.2 0 L 0 -0.9 L 4.2 0 L 0 0.9 Z" fill={gold} />
        <path d="M -2.6 -2.6 L 0.5 -0.5 L 2.6 2.6 L -0.5 0.5 Z" fill="#3c3427" opacity="0.45" />
        <text y="-5.4" textAnchor="middle" fontSize="1.7" fill="#3c3427">N</text>
      </g>

      {/* ---------------- neat map border ---------------- */}
      <rect x="0.6" y="0.6" width="98.8" height="68.8" fill="none" stroke="#2f4a55" strokeWidth="0.5" opacity="0.7" pointerEvents="none" />
      <rect x="1.5" y="1.5" width="97" height="67" fill="none" stroke="#f4ecd6" strokeWidth="0.18" opacity="0.35" pointerEvents="none" />

      {/* ---------------- paper grain ---------------- */}
      <rect x="0" y="0" width="100" height="70" filter="url(#wm-paper)" opacity="0.4" pointerEvents="none" />
    </svg>

      <div className="pointer-events-auto absolute bottom-2 left-2 flex gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomAt(50, 35, 1.4)}
          className="size-7 rounded border border-border bg-background/85 text-sm font-semibold leading-none shadow-sm hover:bg-background"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomAt(50, 35, 1 / 1.4)}
          className="size-7 rounded border border-border bg-background/85 text-sm font-semibold leading-none shadow-sm hover:bg-background"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset the view"
          onClick={() => setView({ z: 1, x: 0, y: 0 })}
          className="h-7 rounded border border-border bg-background/85 px-2 text-xs shadow-sm hover:bg-background"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

