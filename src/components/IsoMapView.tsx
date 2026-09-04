import { useEffect, useRef } from "react";
import {
  MAP_TERRAINS,
  TOKEN_SIZES,
  tileAt,
  tileIndex,
  type MapLevel,
  type MapProp,
  type MapToken,
  type MapTrap,
  type TacticalMap,
} from "@/lib/tacticalmap";

const TW = 56; // tile width in px
const TH = 28; // tile height in px
const EH = 16; // pixels per 5 ft of elevation

const TERRAIN = new Map(MAP_TERRAINS.map((t) => [t.id, t]));
const SIZE_SQUARES = new Map(TOKEN_SIZES.map((s) => [s.id, s.squares]));

export interface IsoMapViewProps {
  map: TacticalMap;
  level: MapLevel;
  dmView: boolean;
  selectedTokenId?: string | null;
  onTileClick?: (x: number, y: number, e: React.MouseEvent) => void;
  onTokenClick?: (token: MapToken) => void;
  height?: number;
}

function project(x: number, y: number, e: number, ox: number, oy: number) {
  return {
    sx: ox + (x - y) * (TW / 2),
    sy: oy + (x + y) * (TH / 2) - e * EH,
  };
}

/** 2.5D isometric renderer: elevation, props, traps, tokens and fog of war. */
export function IsoMapView({
  map,
  level,
  dmView,
  selectedTokenId,
  onTileClick,
  onTokenClick,
  height = 560,
}: IsoMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originRef = useRef({ ox: 0, oy: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const mapW = (level.width + level.height) * (TW / 2);
    const ox = width / 2 - ((level.width - level.height) * (TW / 2)) / 2 - TW / 2 + (width - mapW) * 0;
    const oy = 60;
    originRef.current = { ox, oy };

    const propsByTile = new Map<string, MapProp[]>();
    for (const p of map.props) {
      if (p.levelId !== level.id) continue;
      const key = `${p.x},${p.y}`;
      propsByTile.set(key, [...(propsByTile.get(key) ?? []), p]);
    }
    const trapsByTile = new Map<string, MapTrap>();
    for (const t of map.traps) if (t.levelId === level.id) trapsByTile.set(`${t.x},${t.y}`, t);
    const tokensByTile = new Map<string, MapToken[]>();
    for (const t of map.tokens) {
      if (t.levelId !== level.id) continue;
      const key = `${t.x},${t.y}`;
      tokensByTile.set(key, [...(tokensByTile.get(key) ?? []), t]);
    }

    function diamond(sx: number, sy: number) {
      ctx!.beginPath();
      ctx!.moveTo(sx + TW / 2, sy);
      ctx!.lineTo(sx + TW, sy + TH / 2);
      ctx!.lineTo(sx + TW / 2, sy + TH);
      ctx!.lineTo(sx, sy + TH / 2);
      ctx!.closePath();
    }

    function block(sx: number, sy: number, h: number, top: string, side: string) {
      const px = h * EH;
      if (px > 0) {
        ctx!.fillStyle = side;
        ctx!.beginPath();
        ctx!.moveTo(sx, sy + TH / 2);
        ctx!.lineTo(sx + TW / 2, sy + TH);
        ctx!.lineTo(sx + TW / 2, sy + TH + px);
        ctx!.lineTo(sx, sy + TH / 2 + px);
        ctx!.closePath();
        ctx!.fill();
        ctx!.fillStyle = shade(side, -0.12);
        ctx!.beginPath();
        ctx!.moveTo(sx + TW / 2, sy + TH);
        ctx!.lineTo(sx + TW, sy + TH / 2);
        ctx!.lineTo(sx + TW, sy + TH / 2 + px);
        ctx!.lineTo(sx + TW / 2, sy + TH + px);
        ctx!.closePath();
        ctx!.fill();
      }
      diamond(sx, sy);
      ctx!.fillStyle = top;
      ctx!.fill();
      ctx!.strokeStyle = "rgba(0,0,0,0.25)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.tiles[tileIndex(level, x, y)]!;
        const revealed = !map.fogEnabled || dmView || level.revealed[tileIndex(level, x, y)];
        const spec = TERRAIN.get(tile.t)!;
        const { sx, sy } = project(x, y, tile.e, ox, oy);
        if (!revealed) {
          block(sx, sy, Math.max(0, tile.e), "#0c1120", "#080c17");
          continue;
        }
        block(sx, sy, Math.max(0, tile.e), spec.top, spec.side);

        const trap = trapsByTile.get(`${x},${y}`);
        if (trap && (dmView || trap.found || trap.sprung)) {
          ctx.fillStyle = trap.sprung ? "rgba(226,83,79,0.7)" : "rgba(226,163,79,0.7)";
          ctx.font = "16px serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠", sx + TW / 2, sy + TH / 2 + 6);
        }

        for (const p of propsByTile.get(`${x},${y}`) ?? []) {
          const base = project(x, y, tile.e, ox, oy);
          if (p.kind === "stairs" || p.kind === "ladder") {
            ctx.fillStyle = "rgba(212,175,84,0.85)";
            ctx.font = "16px serif";
            ctx.textAlign = "center";
            ctx.fillText(p.kind === "stairs" ? "⇕" : "≡", base.sx + TW / 2, base.sy + TH / 2 + 6);
            continue;
          }
          const colorTop =
            p.kind === "door"
              ? p.open
                ? "#7a5a2c"
                : "#a2762f"
              : p.kind === "window"
                ? "#7fa7c4"
                : "#8b8377";
          const colorSide = shade(colorTop, -0.35);
          const h = p.height || 2;
          const topPt = project(x, y, tile.e + h, ox, oy);
          ctx.fillStyle = colorSide;
          ctx.beginPath();
          ctx.moveTo(topPt.sx, topPt.sy + TH / 2);
          ctx.lineTo(topPt.sx + TW / 2, topPt.sy + TH);
          ctx.lineTo(base.sx + TW / 2, base.sy + TH);
          ctx.lineTo(base.sx, base.sy + TH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = shade(colorSide, -0.12);
          ctx.beginPath();
          ctx.moveTo(topPt.sx + TW / 2, topPt.sy + TH);
          ctx.lineTo(topPt.sx + TW, topPt.sy + TH / 2);
          ctx.lineTo(base.sx + TW, base.sy + TH / 2);
          ctx.lineTo(base.sx + TW / 2, base.sy + TH);
          ctx.closePath();
          ctx.fill();
          diamond(topPt.sx, topPt.sy);
          ctx.fillStyle = colorTop;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.stroke();
        }

        for (const token of tokensByTile.get(`${x},${y}`) ?? []) {
          const squares = SIZE_SQUARES.get(token.size) ?? 1;
          const pt = project(x, y, tile.e + token.altitude, ox, oy);
          const r = 10 + (squares - 1) * 5;
          if (token.altitude > 0) {
            ctx.strokeStyle = "rgba(212,175,84,0.5)";
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pt.sx + TW / 2, pt.sy + TH / 2);
            ctx.lineTo(sx + TW / 2, sy + TH / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.beginPath();
          ctx.ellipse(pt.sx + TW / 2, pt.sy + TH / 2, r, r * 0.62, 0, 0, Math.PI * 2);
          ctx.fillStyle = token.color;
          ctx.fill();
          ctx.lineWidth = token.id === selectedTokenId ? 3 : 1.5;
          ctx.strokeStyle =
            token.id === selectedTokenId
              ? "#f6e6b4"
              : token.faction === "enemy"
                ? "#e2534f"
                : token.faction === "party"
                  ? "#d4af54"
                  : "#c8cbd3";
          ctx.stroke();
          ctx.fillStyle = "#0b0f1a";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(token.name.slice(0, 2).toUpperCase(), pt.sx + TW / 2, pt.sy + TH / 2 + 4);
          if (token.maxHp) {
            const pct = Math.max(0, Math.min(1, (token.hp ?? 0) / token.maxHp));
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(pt.sx + TW / 2 - r, pt.sy + TH / 2 - r - 8, r * 2, 4);
            ctx.fillStyle = pct > 0.5 ? "#5fbf6a" : pct > 0.25 ? "#d8b04a" : "#e2534f";
            ctx.fillRect(pt.sx + TW / 2 - r, pt.sy + TH / 2 - r - 8, r * 2 * pct, 4);
          }
        }
      }
    }
  }, [map, level, dmView, selectedTokenId, height]);

  function pick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { ox, oy } = originRef.current;

    // Search from the front (highest x+y) so raised tiles win.
    for (let sum = level.width + level.height - 2; sum >= 0; sum--) {
      for (let x = Math.min(sum, level.width - 1); x >= 0; x--) {
        const y = sum - x;
        if (y < 0 || y >= level.height) continue;
        const tile = tileAt(level, x, y);
        if (!tile) continue;
        const { sx, sy } = project(x, y, tile.e, ox, oy);
        const dx = (px - (sx + TW / 2)) / (TW / 2);
        const dy = (py - (sy + TH / 2)) / (TH / 2);
        if (Math.abs(dx) + Math.abs(dy) <= 1) {
          const token = map.tokens.find(
            (t) => t.levelId === level.id && t.x === x && t.y === y,
          );
          if (token && onTokenClick) onTokenClick(token);
          else onTileClick?.(x, y, e);
          return;
        }
      }
    }
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-[#0b1120]">
      <canvas
        ref={canvasRef}
        onClick={pick}
        style={{ width: "100%", height }}
        className="cursor-crosshair"
      />
    </div>
  );
}

function shade(hex: string, amount: number) {
  const m = /^#?([0-9a-f]{6})/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1]!, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 255) * (1 + amount));
  const g = clamp(((num >> 8) & 255) * (1 + amount));
  const b = clamp((num & 255) * (1 + amount));
  return `rgb(${r},${g},${b})`;
}
