import { useRef } from "react";
import {
  SITE_KINDS,
  TERRAIN_KINDS,
  type World,
  type WorldSite,
} from "@/lib/world";

const GLYPH = new Map(SITE_KINDS.map((s) => [s.id, s.glyph]));
const COLOR = new Map(TERRAIN_KINDS.map((t) => [t.id, t.color]));

export interface WorldMapViewProps {
  world: World;
  selectedSiteId?: string | null;
  onSelectSite?: (site: WorldSite) => void;
  onMapClick?: (x: number, y: number) => void;
  showUndiscovered?: boolean;
  className?: string;
}

/** Stylised overland map. Coordinates are normalised 0-100. */
export function WorldMapView({
  world,
  selectedSiteId,
  onSelectSite,
  onMapClick,
  showUndiscovered = true,
  className,
}: WorldMapViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);

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
      className={className ?? "h-full w-full rounded-lg border border-border bg-[#16233a]"}
      role="img"
      aria-label={`Map of ${world.name}`}
    >
      <defs>
        <pattern id="wm-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(212,175,84,0.08)" strokeWidth="0.15" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="100" height="70" fill="#16233a" />

      {world.regions.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={COLOR.get(r.terrain) ?? "#555"}
            opacity={0.82}
            rx={1.5}
          />
          <text
            x={r.x + r.w / 2}
            y={r.y + 1.8}
            textAnchor="middle"
            fontSize="1.9"
            fill="rgba(255,255,255,0.75)"
          >
            {r.name}
          </text>
        </g>
      ))}

      <rect x="0" y="0" width="100" height="70" fill="url(#wm-grid)" />

      {world.routes.map((route) => {
        const a = siteById.get(route.fromSiteId);
        const b = siteById.get(route.toSiteId);
        if (!a || !b) return null;
        return (
          <line
            key={route.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={route.kind === "river" || route.kind === "sea" ? "#6f9aa8" : "#d4af54"}
            strokeWidth={route.kind === "road" ? 0.45 : 0.3}
            strokeDasharray={route.kind === "trail" ? "1 1" : undefined}
            opacity={0.7}
          />
        );
      })}

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
          >
            <circle
              cx={s.x}
              cy={s.y}
              r={selected ? 2.4 : 1.9}
              fill="rgba(10,14,24,0.85)"
              stroke={s.discovered ? "#d4af54" : "#7d8595"}
              strokeWidth={selected ? 0.5 : 0.28}
            />
            <text x={s.x} y={s.y + 0.9} textAnchor="middle" fontSize="2.2">
              {GLYPH.get(s.kind) ?? "•"}
            </text>
            <text
              x={s.x}
              y={s.y + 4.2}
              textAnchor="middle"
              fontSize="1.7"
              fill={s.discovered ? "#e8dfc8" : "#8b93a3"}
            >
              {s.name}
            </text>
          </g>
        );
      })}

      <g>
        <circle
          cx={world.party.x}
          cy={world.party.y}
          r="1.3"
          fill="#e2534f"
          stroke="#fff"
          strokeWidth="0.3"
        />
        <text x={world.party.x} y={world.party.y - 2} textAnchor="middle" fontSize="1.6" fill="#fff">
          Party
        </text>
      </g>
    </svg>
  );
}
