import { useMemo, useRef } from "react";
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

/* ------------------------------------------------------------------ */
/* terrain palette — painted-map look                                   */
/* ------------------------------------------------------------------ */

type Paint = { base: string; shade: string; ink: string };

const PAINT: Record<TerrainKind, Paint> = {
  plains: { base: "#cfd39a", shade: "#b6bd80", ink: "#6f7742" },
  forest: { base: "#9fbb86", shade: "#7ea169", ink: "#3d6136" },
  hills: { base: "#cbc188", shade: "#b3a86e", ink: "#7a6c39" },
  mountains: { base: "#cfc7b6", shade: "#b1a795", ink: "#5c5449" },
  desert: { base: "#eddfae", shade: "#e0cd92", ink: "#a08a4d" },
  swamp: { base: "#a7b487", shade: "#8b9a6d", ink: "#4d5b3a" },
  tundra: { base: "#e4ecef", shade: "#cbd8de", ink: "#7d919b" },
  jungle: { base: "#8bb377", shade: "#679358", ink: "#2f5a30" },
  coast: { base: "#dcd7ac", shade: "#c8c295", ink: "#8a8355" },
  sea: { base: "#8fb4c4", shade: "#7aa2b5", ink: "#4d7488" },
  wasteland: { base: "#d9c3a4", shade: "#c3aa88", ink: "#7d6448" },
  underdark: { base: "#b6aec2", shade: "#9c93ab", ink: "#584f68" },
};

/** Organic coastline polygon inscribed in a region rect. */
function landPath(r: WorldRegion) {
  const rand = rng(hash(r.id + r.name));
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  // Slightly oversized so neighbouring regions fuse into one continent.
  const rx = (r.w / 2) * 1.24;
  const ry = (r.h / 2) * 1.24;
  const steps = 26;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wobble = 0.78 + rand() * 0.34;
    pts.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble]);
  }
  // Catmull-Rom -> cubic bezier for smooth coast
  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % pts.length]!;
    const p3 = pts[(i + 2) % pts.length]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]!.toFixed(2)} ${c1[1]!.toFixed(2)}, ${c2[0]!.toFixed(2)} ${c2[1]!.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

/** Scatter terrain doodads (mountains, trees, dunes…) inside a region. */
function doodads(r: WorldRegion) {
  const rand = rng(hash("dd" + r.id));
  const count = Math.round(Math.min(26, Math.max(6, (r.w * r.h) / 26)));
  const out: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: r.x + r.w * (0.12 + rand() * 0.76),
      y: r.y + r.h * (0.18 + rand() * 0.7),
      s: 0.8 + rand() * 0.55,
    });
  }
  return out;
}

function Doodad({
  terrain,
  x,
  y,
  s,
  ink,
}: {
  terrain: TerrainKind;
  x: number;
  y: number;
  s: number;
  ink: string;
}) {
  if (terrain === "mountains" || terrain === "hills") {
    const h = (terrain === "mountains" ? 2.1 : 1.1) * s;
    const w = 1.5 * s;
    return (
      <g>
        <path
          d={`M ${x - w} ${y} L ${x} ${y - h} L ${x + w} ${y} Z`}
          fill={terrain === "mountains" ? "#efe9dd" : "none"}
          stroke={ink}
          strokeWidth={0.18}
          strokeLinejoin="round"
        />
        {terrain === "mountains" && (
          <path d={`M ${x - 0.45 * s} ${y - h * 0.45} L ${x} ${y - h} L ${x + 0.45 * s} ${y - h * 0.45}`} fill="#fff" stroke="none" />
        )}
      </g>
    );
  }
  if (terrain === "forest" || terrain === "jungle" || terrain === "swamp") {
    return (
      <g stroke={ink} strokeWidth={0.16} fill={terrain === "swamp" ? "none" : ink} fillOpacity={0.5}>
        <path d={`M ${x} ${y - 1.6 * s} L ${x + 0.75 * s} ${y} L ${x - 0.75 * s} ${y} Z`} />
        <path d={`M ${x} ${y} L ${x} ${y + 0.45 * s}`} />
      </g>
    );
  }
  if (terrain === "desert" || terrain === "wasteland") {
    return (
      <path
        d={`M ${x - 1.2 * s} ${y} q ${0.6 * s} ${-0.7 * s} ${1.2 * s} 0 q ${0.6 * s} ${0.7 * s} ${1.2 * s} 0`}
        fill="none"
        stroke={ink}
        strokeWidth={0.16}
        strokeLinecap="round"
        opacity={0.7}
      />
    );
  }
  if (terrain === "tundra") {
    return (
      <g stroke={ink} strokeWidth={0.14} opacity={0.7}>
        <path d={`M ${x - 0.8 * s} ${y} L ${x + 0.8 * s} ${y}`} />
        <path d={`M ${x} ${y - 0.8 * s} L ${x} ${y + 0.8 * s}`} />
      </g>
    );
  }
  return (
    <path
      d={`M ${x - 0.9 * s} ${y} q ${0.45 * s} ${-0.4 * s} ${0.9 * s} 0`}
      fill="none"
      stroke={ink}
      strokeWidth={0.13}
      opacity={0.55}
    />
  );
}

/** Hand-drawn settlement / dungeon marks. */
function SiteGlyph({ kind, x, y, gold }: { kind: WorldSite["kind"]; x: number; y: number; gold: string }) {
  const ink = "#3c3427";
  switch (kind) {
    case "city":
    case "town":
      return (
        <g stroke={ink} strokeWidth={0.18} fill="#f2e6c6">
          <rect x={x - 1.3} y={y - 1.1} width={2.6} height={1.6} />
          <path d={`M ${x - 1.3} ${y - 1.1} L ${x} ${y - 2.1} L ${x + 1.3} ${y - 1.1}`} fill="#c0562f" />
          {kind === "city" && <rect x={x + 0.4} y={y - 2.4} width={0.6} height={1.3} fill="#c0562f" />}
        </g>
      );
    case "village":
    case "camp":
      return (
        <g stroke={ink} strokeWidth={0.16} fill="#f2e6c6">
          <path d={`M ${x - 1} ${y + 0.4} L ${x} ${y - 1.2} L ${x + 1} ${y + 0.4} Z`} />
        </g>
      );
    case "keep":
      return (
        <g stroke={ink} strokeWidth={0.18} fill="#e8dcc0">
          <rect x={x - 1.2} y={y - 1.4} width={2.4} height={1.9} />
          <rect x={x - 1.5} y={y - 2.1} width={0.7} height={0.9} />
          <rect x={x + 0.8} y={y - 2.1} width={0.7} height={0.9} />
        </g>
      );
    case "ruin":
      return (
        <g stroke={ink} strokeWidth={0.18} fill="none">
          <path d={`M ${x - 1.2} ${y + 0.4} L ${x - 1.2} ${y - 1.2} M ${x} ${y + 0.4} L ${x} ${y - 1.6} M ${x + 1.2} ${y + 0.4} L ${x + 1.2} ${y - 0.9}`} />
          <path d={`M ${x - 1.5} ${y + 0.5} L ${x + 1.5} ${y + 0.5}`} />
        </g>
      );
    case "dungeon":
      return (
        <g stroke={ink} strokeWidth={0.18} fill="#2f2a22">
          <path d={`M ${x - 1.1} ${y + 0.5} L ${x - 1.1} ${y - 0.5} A 1.1 1.1 0 0 1 ${x + 1.1} ${y - 0.5} L ${x + 1.1} ${y + 0.5} Z`} />
        </g>
      );
    case "lair":
      return (
        <g stroke={ink} strokeWidth={0.16} fill="#8d3a2c">
          <path d={`M ${x - 1.3} ${y + 0.3} q ${1.3} ${-1.9} ${2.6} 0 q ${-1.3} ${0.9} ${-2.6} 0 Z`} />
        </g>
      );
    case "port":
      return (
        <g stroke={ink} strokeWidth={0.2} fill="none">
          <path d={`M ${x} ${y - 1.5} L ${x} ${y + 0.8}`} />
          <path d={`M ${x - 0.8} ${y - 1} L ${x + 0.8} ${y - 1}`} />
          <path d={`M ${x - 1.1} ${y + 0.1} q ${1.1} ${1.4} ${2.2} 0`} />
        </g>
      );
    default:
      return (
        <g stroke={gold} strokeWidth={0.2} fill="#f5e7bd">
          <path
            d={`M ${x} ${y - 1.6} L ${x + 0.5} ${y - 0.5} L ${x + 1.6} ${y - 0.4} L ${x + 0.8} ${y + 0.4} L ${x + 1} ${y + 1.5} L ${x} ${y + 0.9} L ${x - 1} ${y + 1.5} L ${x - 0.8} ${y + 0.4} L ${x - 1.6} ${y - 0.4} L ${x - 0.5} ${y - 0.5} Z`}
          />
        </g>
      );
  }
}

export interface WorldMapViewProps {
  world: World;
  selectedSiteId?: string | null;
  onSelectSite?: (site: WorldSite) => void;
  onMapClick?: (x: number, y: number) => void;
  showUndiscovered?: boolean;
  className?: string;
}

/** Illustrated overland map. Coordinates are normalised 0-100. */
export function WorldMapView({
  world,
  selectedSiteId,
  onSelectSite,
  onMapClick,
  showUndiscovered = true,
  className,
}: WorldMapViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const gold = "#b08d3f";

  const land = useMemo(
    () => world.regions.map((r) => ({ region: r, d: landPath(r), dd: doodads(r) })),
    [world.regions],
  );

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onMapClick || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }

  const sites = world.sites.filter((s) => showUndiscovered || s.discovered);
  const siteById = new Map(world.sites.map((s) => [s.id, s]));

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 70"
      onClick={handleClick}
      className={className ?? "h-full w-full rounded-lg border border-border"}
      role="img"
      aria-label={`Map of ${world.name}`}
      style={{ fontFamily: "'Cinzel', 'EB Garamond', serif" }}
    >
      <defs>
        <radialGradient id="wm-ocean" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#8fb6c6" />
          <stop offset="70%" stopColor="#6f9bad" />
          <stop offset="100%" stopColor="#527d92" />
        </radialGradient>
        <pattern id="wm-grid" width="6.25" height="6.25" patternUnits="userSpaceOnUse">
          <path d="M 6.25 0 L 0 0 0 6.25" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.1" />
        </pattern>
        <filter id="wm-coast" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        {/* single outline around the merged continent silhouette */}
        <filter id="wm-outline" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.35" result="fat" />
          <feFlood floodColor="#3f5a63" result="ink" />
          <feComposite in="ink" in2="fat" operator="in" result="edge" />
          <feMerge>
            <feMergeNode in="edge" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="wm-paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
        </filter>
        {world.regions.map((r) => (
          <clipPath key={r.id} id={`wm-clip-${r.id}`}>
            <path d={landPath(r)} />
          </clipPath>
        ))}
      </defs>

      {/* ocean */}
      <rect x="0" y="0" width="100" height="70" fill="url(#wm-ocean)" />
      <rect x="0" y="0" width="100" height="70" fill="url(#wm-grid)" />

      {/* coastal shelf glow behind the continent */}
      <g filter="url(#wm-coast)" opacity="0.5">
        {land.map(({ region, d }) => (
          <path key={`glow-${region.id}`} d={d} fill="#e7f1f4" stroke="#e7f1f4" strokeWidth="2.8" />
        ))}
      </g>

      {/* continent: terrain fills merged under one coastline */}
      <g filter="url(#wm-outline)">
        {land.map(({ region, d, dd }) => {
          const paint = PAINT[region.terrain] ?? PAINT.plains;
          return (
            <g key={region.id}>
              <path d={d} fill={paint.base} />
              <g clipPath={`url(#wm-clip-${region.id})`}>
                <path d={d} fill="none" stroke={paint.shade} strokeWidth="3.2" opacity="0.45" />
                {dd.map((p, i) => (
                  <Doodad key={i} terrain={region.terrain} x={p.x} y={p.y} s={p.s} ink={paint.ink} />
                ))}
              </g>
            </g>
          );
        })}
      </g>

      {/* region names */}
      {world.regions.map((r) => (
        <text
          key={`label-${r.id}`}
          x={r.x + r.w / 2}
          y={r.y + r.h * 0.26}
          textAnchor="middle"
          fontSize="2.5"
          letterSpacing="0.35"
          fill="#4a3d27"
          opacity="0.8"
          stroke="#f4ecd6"
          strokeWidth="0.55"
          paintOrder="stroke"
          style={{ textTransform: "uppercase" }}
        >
          {r.name}
        </text>
      ))}

      {/* routes */}
      {world.routes.map((route) => {
        const a = siteById.get(route.fromSiteId);
        const b = siteById.get(route.toSiteId);
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
        const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
        const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
        const water = route.kind === "river" || route.kind === "sea";
        return (
          <path
            key={route.id}
            d={d}
            fill="none"
            stroke={water ? "#5b8ea3" : "#6b5636"}
            strokeWidth={route.kind === "road" ? 0.35 : 0.26}
            strokeDasharray={route.kind === "trail" ? "0.9 0.9" : route.kind === "sea" ? "1.6 1" : undefined}
            opacity={0.8}
            strokeLinecap="round"
          />
        );
      })}

      {/* sites */}
      {sites.map((s) => {
        const selected = s.id === selectedSiteId;
        return (
          <g
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite?.(s);
            }}
            style={{ cursor: onSelectSite ? "pointer" : "default" }}
            opacity={s.discovered ? 1 : 0.45}
          >
            <title>{`${s.name} — ${SITE_LABEL.get(s.kind) ?? s.kind}`}</title>
            {selected && <circle cx={s.x} cy={s.y} r="3.2" fill="none" stroke={gold} strokeWidth="0.35" />}
            <SiteGlyph kind={s.kind} x={s.x} y={s.y} gold={gold} />
            <text
              x={s.x}
              y={s.y + 3.1}
              textAnchor="middle"
              fontSize="1.75"
              fill="#33291b"
              stroke="#f6efdc"
              strokeWidth="0.45"
              paintOrder="stroke"
            >
              {s.name}
            </text>
          </g>
        );
      })}

      {/* party marker */}
      <g>
        <circle cx={world.party.x} cy={world.party.y} r="1.5" fill="#b8322e" stroke="#f6efdc" strokeWidth="0.35" />
        <circle cx={world.party.x} cy={world.party.y} r="2.6" fill="none" stroke="#b8322e" strokeWidth="0.2" opacity="0.6" />
        <text
          x={world.party.x}
          y={world.party.y - 3}
          textAnchor="middle"
          fontSize="1.8"
          fill="#7d1f1c"
          stroke="#f6efdc"
          strokeWidth="0.5"
          paintOrder="stroke"
        >
          Party
        </text>
      </g>

      {/* compass rose */}
      <g transform="translate(92,9)" opacity="0.85">
        <circle r="4.6" fill="#f4ecd6" stroke={gold} strokeWidth="0.3" opacity="0.9" />
        <path d="M 0 -4 L 1 0 L 0 4 L -1 0 Z" fill="#3c3427" />
        <path d="M -4 0 L 0 -1 L 4 0 L 0 1 Z" fill={gold} />
        <text y="-4.9" textAnchor="middle" fontSize="1.6" fill="#3c3427">N</text>
      </g>

      {/* title cartouche */}
      <g transform="translate(3,3)">
        <rect width="34" height="7" rx="0.6" fill="#f4ecd6" stroke={gold} strokeWidth="0.35" opacity="0.95" />
        <rect x="0.8" y="0.8" width="32.4" height="5.4" rx="0.4" fill="none" stroke={gold} strokeWidth="0.15" opacity="0.7" />
        <text x="17" y="4.7" textAnchor="middle" fontSize="3.1" fill="#3c3427" letterSpacing="0.4">
          {world.name}
        </text>
      </g>

      {/* paper grain */}
      <rect x="0" y="0" width="100" height="70" filter="url(#wm-paper)" opacity="0.35" pointerEvents="none" />
    </svg>
  );
}
