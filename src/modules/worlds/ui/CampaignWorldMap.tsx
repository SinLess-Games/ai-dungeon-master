import {
  Compass,
  Layers3,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  getCampaignWorldAtlas,
  getCampaignWorldState,
} from "../client/worldAtlasApi";
import type {
  AtlasBiome,
  AtlasPath,
  AtlasPlace,
  AtlasPlaceKind,
  AtlasPoint,
  WorldAtlasDocument,
} from "../domain/atlas";
import { CampaignWorldControls } from "./CampaignWorldControls";

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PLACE_LABELS: Record<AtlasPlaceKind, string> = {
  capital: "Capital",
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Hamlet",
  port: "Port",
  fort: "Fort",
  castle: "Castle",
  dungeon: "Dungeon",
  ruin: "Ruin",
  temple: "Temple",
  tower: "Tower",
  mine: "Mine",
  cave: "Cave",
  landmark: "Landmark",
  "planar-gate": "Planar Gate",
};

const BIOME_COLORS: Record<AtlasBiome, string> = {
  temperate: "#82966a",
  forest: "#4f765a",
  tundra: "#a8b4ae",
  desert: "#c5a46c",
  steppe: "#a6a16b",
  swamp: "#65775c",
  jungle: "#4d7654",
  highlands: "#8a8069",
  badlands: "#aa7759",
  enchanted: "#70856e",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function svgPoints(points: readonly AtlasPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function niceScale(visibleWidthMiles: number): number {
  const target = visibleWidthMiles * 0.18;
  const values = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];
  return values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );
}

function pathStroke(path: AtlasPath): {
  stroke: string;
  width: number;
  dash?: string;
  opacity: number;
} {
  switch (path.kind) {
    case "road":
      return { stroke: "#6a4a2e", width: 10, dash: "24 13", opacity: 0.62 };
    case "trail":
      return { stroke: "#725c45", width: 6, dash: "10 16", opacity: 0.52 };
    case "sea-route":
      return { stroke: "#335f75", width: 6, dash: "22 22", opacity: 0.58 };
  }
}

function placeGlyph(kind: AtlasPlaceKind): string {
  switch (kind) {
    case "capital":
      return "★";
    case "city":
      return "◆";
    case "town":
      return "●";
    case "village":
      return "○";
    case "hamlet":
      return "·";
    case "port":
      return "⚓";
    case "fort":
      return "♜";
    case "castle":
      return "♛";
    case "dungeon":
      return "⚔";
    case "ruin":
      return "△";
    case "temple":
      return "✦";
    case "tower":
      return "♟";
    case "mine":
      return "◇";
    case "cave":
      return "◒";
    case "landmark":
      return "✧";
    case "planar-gate":
      return "◉";
  }
}

function placeTone(kind: AtlasPlaceKind): string {
  if (["capital", "city", "town", "port"].includes(kind)) return "#432c22";
  if (["dungeon", "ruin", "cave"].includes(kind)) return "#602b28";
  if (kind === "planar-gate") return "#4d3568";
  if (["temple", "landmark"].includes(kind)) return "#72531d";
  return "#46372a";
}

function fullView(atlas: WorldAtlasDocument): ViewBox {
  return { x: 0, y: 0, width: atlas.widthMiles, height: atlas.heightMiles };
}

function mapPointer(
  element: SVGSVGElement,
  view: ViewBox,
  clientX: number,
  clientY: number,
): AtlasPoint {
  const rect = element.getBoundingClientRect();
  return {
    x: view.x + ((clientX - rect.left) / rect.width) * view.width,
    y: view.y + ((clientY - rect.top) / rect.height) * view.height,
  };
}

function zoomView(
  atlas: WorldAtlasDocument,
  view: ViewBox,
  anchor: AtlasPoint,
  factor: number,
): ViewBox {
  const minWidth = atlas.widthMiles / 14;
  const nextWidth = clamp(view.width * factor, minWidth, atlas.widthMiles);
  const aspect = atlas.heightMiles / atlas.widthMiles;
  const nextHeight = nextWidth * aspect;
  const xRatio = (anchor.x - view.x) / view.width;
  const yRatio = (anchor.y - view.y) / view.height;
  const x = clamp(anchor.x - nextWidth * xRatio, 0, atlas.widthMiles - nextWidth);
  const y = clamp(anchor.y - nextHeight * yRatio, 0, atlas.heightMiles - nextHeight);
  return { x, y, width: nextWidth, height: nextHeight };
}

function visibleImportance(atlas: WorldAtlasDocument, view: ViewBox): number {
  const zoom = atlas.widthMiles / view.width;
  if (zoom >= 8) return 0.24;
  if (zoom >= 5) return 0.34;
  if (zoom >= 3) return 0.48;
  if (zoom >= 1.8) return 0.63;
  return 0.76;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The atlas could not be loaded.";
}

export function CampaignWorldMap({ campaignId }: { campaignId: string }) {
  const query = useQuery({
    queryKey: ["campaigns", "play", campaignId, "atlas"],
    queryFn: () => getCampaignWorldAtlas(campaignId),
    staleTime: 60_000,
    refetchInterval: (result) =>
      result.state.data?.asset.status === "pending" ? 8_000 : false,
  });

  if (query.isLoading) {
    return (
      <div className="grid flex-1 place-items-center bg-[#111612] p-8">
        <div className="text-center text-[#dfd0a4]">
          <Compass className="mx-auto h-10 w-10 animate-pulse" />
          <p className="mt-4 font-display text-2xl">Opening the campaign atlas…</p>
          <p className="mt-2 text-sm text-[#ae9f7b]">Unrolling the world map.</p>
        </div>
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="grid flex-1 place-items-center bg-[#111612] p-8">
        <div className="max-w-xl rounded-2xl border border-[#7b5d38]/60 bg-[#201c16] p-8 text-center text-[#e8dcb7] shadow-2xl">
          <MapPin className="mx-auto h-9 w-9 text-[#bd9353]" />
          <h2 className="mt-4 font-display text-2xl">The atlas is unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-[#b7a987]">{errorMessage(query.error)}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-5 rounded-lg border border-[#9c7945] px-4 py-2 text-sm font-semibold text-[#e8dcb7] hover:bg-[#9c7945]/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <InteractiveAtlas campaignId={campaignId} response={query.data} />;
}

function InteractiveAtlas({
  campaignId,
  response,
}: {
  campaignId: string;
  response: Awaited<ReturnType<typeof getCampaignWorldAtlas>>;
}) {
  const atlas = response.atlas;
  const stateQuery = useQuery({
    queryKey: ["campaigns", "play", campaignId, "world-state"],
    queryFn: () => getCampaignWorldState(campaignId),
    staleTime: 15_000,
  });
  const worldState = stateQuery.data ?? null;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: ViewBox } | null>(null);
  const [view, setView] = useState<ViewBox>(() => fullView(atlas));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showRoads, setShowRoads] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [gmFogPreview, setGmFogPreview] = useState(false);
  const [search, setSearch] = useState("");
  const [previewPathIds, setPreviewPathIds] = useState<readonly string[]>([]);
  const onTravelPreview = useCallback((pathIds: readonly string[]) => {
    setPreviewPathIds([...pathIds]);
  }, []);

  const canEdit = worldState?.canEdit ?? false;
  const fogEnabled = Boolean(worldState) && (!canEdit || gmFogPreview);
  const discoveredPlaceIds = useMemo(
    () => new Set(worldState?.discovery.placeIds ?? []),
    [worldState?.discovery.placeIds],
  );
  const discoveredPathIds = useMemo(
    () => new Set(worldState?.discovery.pathIds ?? []),
    [worldState?.discovery.pathIds],
  );
  const discoveredRegionIds = useMemo(
    () => new Set(worldState?.discovery.regionIds ?? []),
    [worldState?.discovery.regionIds],
  );

  const selectedPlace = useMemo(() => {
    const place = atlas.places.find((entry) => entry.id === selectedPlaceId) ?? null;
    if (!place) return null;
    if (fogEnabled && !discoveredPlaceIds.has(place.id)) return null;
    return place;
  }, [atlas.places, discoveredPlaceIds, fogEnabled, selectedPlaceId]);

  const threshold = visibleImportance(atlas, view);
  const visiblePlaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    return atlas.places.filter((place) => {
      if (fogEnabled && !discoveredPlaceIds.has(place.id)) return false;
      if (term.length >= 2) {
        return (
          place.name.toLowerCase().includes(term) ||
          PLACE_LABELS[place.kind].toLowerCase().includes(term)
        );
      }
      return place.importance >= threshold || discoveredPlaceIds.has(place.id);
    });
  }, [atlas.places, discoveredPlaceIds, fogEnabled, search, threshold]);

  const visiblePaths = useMemo(
    () => atlas.paths.filter((path) => !fogEnabled || discoveredPathIds.has(path.id)),
    [atlas.paths, discoveredPathIds, fogEnabled],
  );
  const visibleRegions = useMemo(
    () => atlas.regions.filter((region) => !fogEnabled || discoveredRegionIds.has(region.id)),
    [atlas.regions, discoveredRegionIds, fogEnabled],
  );
  const previewPaths = useMemo(
    () => atlas.paths.filter((path) => previewPathIds.includes(path.id)),
    [atlas.paths, previewPathIds],
  );

  function wheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
    if (!svg.current) return;
    const anchor = mapPointer(svg.current, view, event.clientX, event.clientY);
    setView((current) => zoomView(atlas, current, anchor, event.deltaY < 0 ? 0.82 : 1.2));
  }

  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, view };
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const state = drag.current;
    if (!state || !svg.current) return;
    const rect = svg.current.getBoundingClientRect();
    const dx = ((event.clientX - state.x) / rect.width) * state.view.width;
    const dy = ((event.clientY - state.y) / rect.height) * state.view.height;
    setView({
      ...state.view,
      x: clamp(state.view.x - dx, 0, atlas.widthMiles - state.view.width),
      y: clamp(state.view.y - dy, 0, atlas.heightMiles - state.view.height),
    });
  }

  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function zoomButton(factor: number) {
    const anchor = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    setView((current) => zoomView(atlas, current, anchor, factor));
  }

  function focusPlace(place: AtlasPlace) {
    setSelectedPlaceId(place.id);
    const width = Math.max(atlas.widthMiles / 6.5, 650);
    const height = width * (atlas.heightMiles / atlas.widthMiles);
    setView({
      x: clamp(place.x - width / 2, 0, atlas.widthMiles - width),
      y: clamp(place.y - height / 2, 0, atlas.heightMiles - height),
      width,
      height,
    });
  }

  const scaleMiles = niceScale(view.width);
  const scalePercent = clamp((scaleMiles / view.width) * 100, 8, 40);
  const zoom = atlas.widthMiles / view.width;
  const mapCenter = { x: view.x + view.width / 2, y: view.y + view.height / 2 };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#111612] text-[#e8dcb7]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6d5638]/50 bg-[#181913]/95 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#bd9353]">
            <Sparkles className="h-3.5 w-3.5" /> Campaign Atlas
          </div>
          <h2 className="mt-0.5 font-display text-2xl text-[#f1e6c6]">{atlas.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#9e8f70]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={fogEnabled ? "Search discovered places…" : "Find a place…"}
              className="w-56 rounded-lg border border-[#6d5638]/70 bg-[#211f18] py-2 pl-8 pr-3 text-sm text-[#efe3c3] outline-none placeholder:text-[#82765f] focus:border-[#bd9353]"
            />
          </div>
          {worldState ? (
            <span className="rounded-full border border-[#7a613f]/70 bg-[#2a2419] px-2.5 py-1 text-[11px] font-semibold text-[#cbb688]">
              {worldState.state.weather.replaceAll("-", " ")} · {worldState.discovery.placeIds.length} places known
            </span>
          ) : null}
          <span className="rounded-full border border-[#7a613f]/70 px-2.5 py-1 text-[11px] text-[#a99a7d]">
            {Math.round(zoom * 100)}% atlas zoom
          </span>
        </div>
      </div>

      {stateQuery.error ? (
        <div className="border-b border-[#8a663d]/50 bg-[#3b2b1b] px-4 py-2 text-xs text-[#e7cca0]">
          Map viewing still works, but world-builder/travel state is unavailable: {errorMessage(stateQuery.error)}
        </div>
      ) : null}

      <div className="relative min-h-[620px] flex-1 overflow-hidden bg-[#6c9297]">
        <svg
          ref={svg}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          preserveAspectRatio="xMidYMid meet"
          onWheel={wheel}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onDoubleClick={() => setView(fullView(atlas))}
          className="h-full min-h-[620px] w-full touch-none cursor-grab select-none active:cursor-grabbing"
          aria-label={`${atlas.title} interactive world map`}
        >
          <defs>
            <linearGradient id={`ocean-${campaignId}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#95b9ba" />
              <stop offset="0.52" stopColor="#739fa5" />
              <stop offset="1" stopColor="#547f89" />
            </linearGradient>
            <filter id={`paper-${campaignId}`}>
              <feTurbulence baseFrequency=".015" numOctaves="3" seed="11" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 .12" />
              </feComponentTransfer>
            </filter>
            <filter id={`coast-${campaignId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="12" dy="18" stdDeviation="18" floodColor="#263c39" floodOpacity=".42" />
            </filter>
          </defs>

          <rect width={atlas.widthMiles} height={atlas.heightMiles} fill={`url(#ocean-${campaignId})`} />
          <rect width={atlas.widthMiles} height={atlas.heightMiles} filter={`url(#paper-${campaignId})`} opacity=".7" />

          {atlas.landmasses.map((landmass) => (
            <g key={landmass.id} filter={`url(#coast-${campaignId})`}>
              <polygon
                points={svgPoints(landmass.points)}
                fill={BIOME_COLORS[landmass.biome]}
                stroke="#564a38"
                strokeWidth={12}
                strokeLinejoin="round"
              />
              <polygon
                points={svgPoints(landmass.points)}
                fill="none"
                stroke="#d0c395"
                strokeWidth={5}
                opacity=".36"
              />
            </g>
          ))}

          {visibleRegions.map((region) => (
            <ellipse
              key={region.id}
              cx={region.center.x}
              cy={region.center.y}
              rx={Math.max(160, atlas.widthMiles * 0.018)}
              ry={Math.max(120, atlas.heightMiles * 0.02)}
              fill={BIOME_COLORS[region.biome]}
              opacity=".26"
            />
          ))}

          {showRoads
            ? visiblePaths.map((path) => {
                const style = pathStroke(path);
                return (
                  <polyline
                    key={path.id}
                    points={svgPoints(path.points)}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={style.width}
                    strokeDasharray={style.dash}
                    opacity={style.opacity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })
            : null}

          {previewPaths.map((path) => (
            <polyline
              key={`preview:${path.id}`}
              points={svgPoints(path.points)}
              fill="none"
              stroke="#f2cf75"
              strokeWidth={12}
              opacity=".95"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {atlas.rivers.map((river) => (
            <polyline
              key={river.id}
              points={svgPoints(river.points)}
              fill="none"
              stroke="#4b8399"
              strokeWidth={12}
              opacity=".86"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {atlas.mountainRanges.flatMap((range) =>
            range.points.map((point, index) => (
              <g key={`${range.id}:${index}`} transform={`translate(${point.x} ${point.y})`}>
                <path
                  d="M-45 38 L0 -52 L45 38 Z"
                  fill="#817768"
                  stroke="#4a4339"
                  strokeWidth="6"
                  vectorEffect="non-scaling-stroke"
                />
                <path d="M-15 -21 L0 -52 L17 -20 L5 -28 L0 -15 L-6 -27 Z" fill="#eee8da" />
              </g>
            )),
          )}

          {showLabels && zoom >= 1.45
            ? visibleRegions
                .filter((region) => region.importance >= (zoom > 3 ? 0.55 : 0.76))
                .map((region) => (
                  <text
                    key={`label:${region.id}`}
                    x={region.center.x}
                    y={region.center.y}
                    textAnchor="middle"
                    fontFamily="Georgia, serif"
                    fontStyle="italic"
                    fontWeight="700"
                    fontSize={Math.max(34, 64 / Math.sqrt(zoom))}
                    fill="#6a2824"
                    stroke="#dfd0a5"
                    strokeWidth="7"
                    paintOrder="stroke"
                    letterSpacing=".08em"
                    opacity=".82"
                  >
                    {region.name}
                  </text>
                ))
            : null}

          {showPlaces
            ? visiblePlaces.map((place) => {
                const selected = selectedPlaceId === place.id;
                const size =
                  clamp(30 + place.importance * 42, 34, 76) /
                  Math.sqrt(Math.max(1, zoom * 0.45));
                return (
                  <g
                    key={place.id}
                    transform={`translate(${place.x} ${place.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${place.name}, ${PLACE_LABELS[place.kind]}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedPlaceId(place.id);
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      focusPlace(place);
                    }}
                    className="cursor-pointer"
                  >
                    {selected ? (
                      <circle
                        r={size * 0.72}
                        fill="none"
                        stroke="#f0ce78"
                        strokeWidth="5"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="Georgia, serif"
                      fontSize={size}
                      fill={placeTone(place.kind)}
                      stroke="#eadcaf"
                      strokeWidth="6"
                      paintOrder="stroke"
                    >
                      {placeGlyph(place.kind)}
                    </text>
                    {showLabels && (place.importance >= threshold + 0.08 || selected) ? (
                      <text
                        y={size * 0.92}
                        textAnchor="middle"
                        fontFamily="Georgia, serif"
                        fontWeight="700"
                        fontSize={clamp(size * 0.48, 18, 34)}
                        fill="#36281e"
                        stroke="#eadcaf"
                        strokeWidth="6"
                        paintOrder="stroke"
                      >
                        {place.name}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          {worldState ? (
            <g
              transform={`translate(${worldState.state.currentX} ${worldState.state.currentY})`}
              aria-label="Current party position"
            >
              <circle
                r={42 / Math.sqrt(Math.max(1, zoom * 0.4))}
                fill="#f0cf72"
                stroke="#2d2018"
                strokeWidth="6"
                vectorEffect="non-scaling-stroke"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={32 / Math.sqrt(Math.max(1, zoom * 0.4))}
                fill="#2d2018"
              >
                ◆
              </text>
            </g>
          ) : null}
        </svg>

        <CampaignWorldControls
          campaignId={campaignId}
          atlas={atlas}
          revision={response.revision}
          selectedPlace={selectedPlace}
          mapCenter={mapCenter}
          worldState={worldState}
          onSelectPlace={setSelectedPlaceId}
          onTravelPreview={onTravelPreview}
        />

        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-[#71573b]/70 bg-[#eadcaf]/90 p-3 text-[#3a2a20] shadow-2xl backdrop-blur-sm">
          <div className="relative grid h-24 w-24 place-items-center">
            <div className="absolute inset-3 rounded-full border-2 border-[#5e452f]" />
            <div className="absolute h-[88px] w-[2px] bg-[#563c2b]" />
            <div className="absolute h-[2px] w-[88px] bg-[#563c2b]" />
            <div className="absolute h-16 w-16 rotate-45 border border-[#9b7443]" />
            <span className="absolute top-0 font-display text-sm font-bold">N</span>
            <span className="absolute bottom-0 font-display text-xs font-bold">S</span>
            <span className="absolute left-0 font-display text-xs font-bold">W</span>
            <span className="absolute right-0 font-display text-xs font-bold">E</span>
            <Compass className="h-8 w-8 text-[#6c4a2e]" />
          </div>
        </div>

        <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => zoomButton(0.78)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#7a613f]/70 bg-[#211f18]/95 text-[#e8dcb7] shadow-lg hover:border-[#bd9353] hover:text-[#eecb76]"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomButton(1.28)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#7a613f]/70 bg-[#211f18]/95 text-[#e8dcb7] shadow-lg hover:border-[#bd9353] hover:text-[#eecb76]"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView(fullView(atlas))}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#7a613f]/70 bg-[#211f18]/95 text-[#e8dcb7] shadow-lg hover:border-[#bd9353] hover:text-[#eecb76]"
            aria-label="Reset map view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 rounded-xl border border-[#71573b]/70 bg-[#eadcaf]/92 px-4 py-3 text-[#3a2a20] shadow-xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]">Scale</div>
          <div className="mt-2 flex items-end gap-2">
            <div style={{ width: `${scalePercent}vw`, maxWidth: 190 }}>
              <div className="h-[3px] bg-[#3d2b20]" />
              <div className="flex justify-between">
                <div className="h-2 w-[2px] bg-[#3d2b20]" />
                <div className="h-2 w-[2px] bg-[#3d2b20]" />
              </div>
            </div>
            <span className="text-xs font-semibold">{scaleMiles.toLocaleString()} mi</span>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-20 flex max-h-[55%] flex-col gap-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowLegend((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#7a613f]/70 bg-[#211f18]/95 px-3 py-2 text-xs font-semibold text-[#e8dcb7] shadow-lg hover:border-[#bd9353]"
            >
              <Layers3 className="h-4 w-4" /> {showLegend ? "Hide legend" : "Legend"}
            </button>
          </div>
          {showLegend ? (
            <div className="w-64 overflow-y-auto rounded-xl border border-[#71573b]/70 bg-[#eadcaf]/94 p-4 text-[#3a2a20] shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold">Legend</h3>
                <span className="text-[10px] uppercase tracking-wider opacity-60">
                  {atlas.legend.length} marks
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                {atlas.legend.map((entry) => (
                  <div key={entry.kind} className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="w-5 shrink-0 text-center font-serif text-sm">
                      {["road", "trail", "sea-route"].includes(entry.kind)
                        ? "━"
                        : placeGlyph(entry.kind as AtlasPlaceKind)}
                    </span>
                    <span className="truncate">{entry.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-[#765d3d]/30 pt-3 text-[11px]">
                <label className="flex items-center justify-between gap-2 py-1">
                  <span>Roads & routes</span>
                  <input
                    type="checkbox"
                    checked={showRoads}
                    onChange={(event) => setShowRoads(event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-2 py-1">
                  <span>Places</span>
                  <input
                    type="checkbox"
                    checked={showPlaces}
                    onChange={(event) => setShowPlaces(event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-2 py-1">
                  <span>Labels</span>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(event) => setShowLabels(event.target.checked)}
                  />
                </label>
                {canEdit && worldState ? (
                  <label className="flex items-center justify-between gap-2 py-1">
                    <span>Preview player fog</span>
                    <input
                      type="checkbox"
                      checked={gmFogPreview}
                      onChange={(event) => setGmFogPreview(event.target.checked)}
                    />
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {selectedPlace ? (
          <div className="absolute left-4 top-32 w-72 rounded-xl border border-[#775d3c]/80 bg-[#201d17]/95 p-4 text-[#e9ddb9] shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bc9455]">
                  {PLACE_LABELS[selectedPlace.kind]}
                </p>
                <h3 className="mt-1 font-display text-xl">{selectedPlace.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlaceId(null)}
                className="text-[#998a6c] hover:text-[#eadcaf]"
                aria-label="Close place details"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#c0b18d]">{selectedPlace.description}</p>
            {selectedPlace.population ? (
              <p className="mt-3 text-xs text-[#d5c49a]">
                Population · {selectedPlace.population.toLocaleString()}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPlace.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#71583a] px-2 py-0.5 text-[10px] text-[#cdb98b]"
                >
                  {tag.replaceAll("-", " ")}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => focusPlace(selectedPlace)}
              className="mt-4 w-full rounded-lg border border-[#9a7543] bg-[#9a7543]/10 px-3 py-2 text-xs font-semibold text-[#e7cd8d] hover:bg-[#9a7543]/20"
            >
              Center & zoom
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
