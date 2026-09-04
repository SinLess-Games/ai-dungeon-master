import { useMemo } from "react";
import type { WorldSite } from "@/lib/world";

/* deterministic helpers (same style as the atlas) */
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

const DISTRICTS = [
  "Market ward",
  "Temple ward",
  "Dockside",
  "Craftsmen's row",
  "Old quarter",
  "Garrison",
  "Highgate",
  "Tanners' end",
  "Scholars' close",
  "Poor ward",
];

const LANDMARKS: Record<string, string[]> = {
  city: ["Great market", "High temple", "Lord's keep", "Guildhall", "Grand inn", "Watch barracks"],
  town: ["Market square", "Temple", "Moot hall", "Smithy", "The inn", "Watch post"],
  village: ["Common green", "Shrine", "Mill", "Smithy", "Tavern", "Elder's house"],
  keep: ["Gatehouse", "Great hall", "Barracks", "Armoury", "Chapel", "Cistern"],
  port: ["Harbour master", "Long quay", "Warehouses", "Sailors' rest", "Fish market", "Lighthouse"],
  ruin: ["Broken gate", "Collapsed hall", "Sunken stair", "Toppled statue", "Overgrown court", "Crypt mouth"],
  dungeon: ["Entry cavern", "Guard post", "Flooded gallery", "Old workshop", "Shrine chamber", "Deep stair"],
  camp: ["Chief's tent", "Fire circle", "Horse line", "Supply tent", "Lookout", "Latrine ditch"],
  lair: ["Approach ledge", "Bone yard", "Nesting hollow", "Hoard chamber", "Escape tunnel", "Feeding pit"],
  wonder: ["Approach road", "Outer ring", "Inner sanctum", "Watching stones", "Spring", "Old altar"],
};

interface Block {
  pts: Pt[];
  cx: number;
  cy: number;
}

/** Deterministic settlement or site plan drawn from the site id. */
export function LocalMapView({
  site,
  className,
  artUrl,
}: {
  site: WorldSite;
  className?: string;
  /** AI-painted picture of this place; shown instead of the drawn plan. */
  artUrl?: string;
}) {
  const plan = useMemo(() => {
    const rand = rng(hash(site.id + site.name + site.kind));
    const walled = site.kind === "city" || site.kind === "town" || site.kind === "keep";
    const dense = site.kind === "city" ? 12 : site.kind === "town" ? 9 : 6;

    // rough settlement outline
    const outline: Pt[] = [];
    const rings = 18;
    for (let i = 0; i < rings; i++) {
      const a = (i / rings) * Math.PI * 2;
      const r = 26 + rand() * 9;
      outline.push([50 + Math.cos(a) * r * 1.25, 45 + Math.sin(a) * r]);
    }

    // radial streets from the centre out to the wall
    const streets: string[] = [];
    const gates = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < gates; i++) {
      const a = (i / gates) * Math.PI * 2 + rand() * 0.5;
      let d = `M 50 45`;
      for (let t = 1; t <= 5; t++) {
        const rr = (t / 5) * (30 + rand() * 6);
        const wob = (rand() - 0.5) * 0.35;
        d += ` L ${(50 + Math.cos(a + wob) * rr * 1.25).toFixed(1)} ${(45 + Math.sin(a + wob) * rr).toFixed(1)}`;
      }
      streets.push(d);
    }
    // ring streets
    for (let k = 1; k <= 2; k++) {
      const rr = 10 * k + rand() * 4;
      const pts: Pt[] = [];
      for (let i = 0; i <= 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const j = 1 + (rand() - 0.5) * 0.18;
        pts.push([50 + Math.cos(a) * rr * 1.25 * j, 45 + Math.sin(a) * rr * j]);
      }
      streets.push("M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L "));
    }

    // building blocks scattered between the streets
    const blocks: Block[] = [];
    for (let i = 0; i < dense * 6; i++) {
      const a = rand() * Math.PI * 2;
      const rr = 4 + Math.sqrt(rand()) * (28 + rand() * 3);
      const cx = 50 + Math.cos(a) * rr * 1.25;
      const cy = 45 + Math.sin(a) * rr;
      const w = 1.6 + rand() * 2.2;
      const h = 1.4 + rand() * 1.8;
      const rot = rand() * Math.PI;
      const cs = Math.cos(rot);
      const sn = Math.sin(rot);
      const corners: Pt[] = [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
      ].map(([x, y]) => [cx + x! * cs - y! * sn, cy + x! * sn + y! * cs] as Pt);
      blocks.push({ pts: corners, cx, cy });
    }

    // a river through some settlements
    const hasRiver = rand() > 0.45;
    let river = "";
    if (hasRiver) {
      const pts: Pt[] = [];
      const yBase = 30 + rand() * 30;
      for (let i = 0; i <= 10; i++) {
        pts.push([i * 10, yBase + Math.sin(i * 0.8 + rand()) * 6 + (rand() - 0.5) * 3]);
      }
      river = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
    }

    const names = LANDMARKS[site.kind] ?? LANDMARKS['town']!;
    const marks = names.slice(0, site.kind === "village" || site.kind === "camp" ? 4 : 6).map((label, i) => {
      const a = (i / 6) * Math.PI * 2 + rand();
      const rr = 6 + rand() * 18;
      return { label, x: 50 + Math.cos(a) * rr * 1.25, y: 45 + Math.sin(a) * rr };
    });

    const wards = DISTRICTS.slice()
      .sort(() => rand() - 0.5)
      .slice(0, site.kind === "city" ? 4 : site.kind === "town" ? 3 : 2)
      .map((label, i) => {
        const a = (i / 4) * Math.PI * 2 + rand() * 0.6;
        const rr = 16 + rand() * 8;
        return { label, x: 50 + Math.cos(a) * rr * 1.25, y: 45 + Math.sin(a) * rr };
      });

    return { outline, streets, blocks, river, marks, wards, walled };
  }, [site.id, site.name, site.kind]);

  const outlineD =
    "M " + plan.outline.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";

  return (
    <svg
      viewBox="0 0 100 90"
      className={className ?? "h-full w-full rounded-lg border border-border"}
      role="img"
      aria-label={`Plan of ${site.name}`}
      style={{ fontFamily: "'Cinzel', 'EB Garamond', serif" }}
    >
      <defs>
        <filter id="lm-paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="4" seed="5" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.14" />
          </feComponentTransfer>
        </filter>
        <clipPath id="lm-clip">
          <path d={outlineD} />
        </clipPath>
      </defs>

      <rect width="100" height="90" fill="#efe4c6" />
      <path d={outlineD} fill="#e4d7b3" stroke="#8b7a4e" strokeWidth="0.4" />

      {plan.river && <path d={plan.river} fill="none" stroke="#6f9aad" strokeWidth="2.2" opacity="0.75" />}

      <g clipPath="url(#lm-clip)">
        {plan.streets.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#cdbb90" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {plan.blocks.map((b, i) => (
          <path
            key={i}
            d={"M " + b.pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z"}
            fill="#c9b48b"
            stroke="#5f5138"
            strokeWidth="0.16"
          />
        ))}
      </g>

      {plan.walled && (
        <path d={outlineD} fill="none" stroke="#5f5138" strokeWidth="0.9" strokeLinejoin="round" opacity="0.9" />
      )}

      {plan.wards.map((w) => (
        <text
          key={w.label}
          x={w.x}
          y={w.y}
          textAnchor="middle"
          fontSize="2.3"
          fill="#6b5a34"
          opacity="0.8"
          stroke="#f3ead0"
          strokeWidth="0.5"
          paintOrder="stroke"
          style={{ textTransform: "uppercase" }}
        >
          {w.label}
        </text>
      ))}

      {plan.marks.map((m) => (
        <g key={m.label}>
          <circle cx={m.x} cy={m.y} r="1.1" fill="#a4442b" stroke="#f7f0dc" strokeWidth="0.3" />
          <text
            x={m.x}
            y={m.y - 1.9}
            textAnchor="middle"
            fontSize="1.9"
            fill="#3c3427"
            stroke="#f7f0dc"
            strokeWidth="0.5"
            paintOrder="stroke"
          >
            {m.label}
          </text>
        </g>
      ))}

      <rect x="0.6" y="0.6" width="98.8" height="88.8" fill="none" stroke="#8b7a4e" strokeWidth="0.5" />
      <rect width="100" height="90" filter="url(#lm-paper)" opacity="0.35" pointerEvents="none" />
    </svg>
  );
}
