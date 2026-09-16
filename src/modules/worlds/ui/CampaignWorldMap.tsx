import {
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Footprints,
  Layers3,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { toast } from "sonner";
import { getCampaignWorldAtlas } from "../client/worldAtlasApi";
import {
  clearCampaignTravelEncounter,
  commitCampaignTravel,
  editCampaignWorld,
  getCampaignWorldState,
  planCampaignTravel,
  regenerateCampaignWorld,
  setCampaignPartyPosition,
  setCampaignWorldWeather,
  type CampaignWorldEditOperation,
  type CampaignWorldStateResponse,
} from "../client/worldBuilderApi";
import type {
  AtlasBiome,
  AtlasPath,
  AtlasPathKind,
  AtlasPlace,
  AtlasPlaceKind,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "../domain/atlas";
import type { AtlasTravelWeather } from "../domain/overlandTravel";
import type { AtlasInspectorReport, AtlasTravelPlan } from "../domain/worldBuilder";

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type BuilderMode = "inspect" | "place" | "region" | "path";
type MoveMode = { kind: "place" | "region"; id: string } | null;
type RegenerateMode = "same" | "new";

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

const WEATHER_LABELS: Record<AtlasTravelWeather, string> = {
  clear: "Clear",
  rain: "Rain",
  storm: "Storm",
  snow: "Snow",
  blizzard: "Blizzard",
  "extreme-heat": "Extreme heat",
  "extreme-cold": "Extreme cold",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function svgPoints(points: readonly AtlasPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
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
  const width = clamp(view.width * factor, minWidth, atlas.widthMiles);
  const height = width * (atlas.heightMiles / atlas.widthMiles);
  const xRatio = (anchor.x - view.x) / view.width;
  const yRatio = (anchor.y - view.y) / view.height;
  return {
    x: clamp(anchor.x - width * xRatio, 0, atlas.widthMiles - width),
    y: clamp(anchor.y - height * yRatio, 0, atlas.heightMiles - height),
    width,
    height,
  };
}

function placeGlyph(kind: AtlasPlaceKind): string {
  const values: Record<AtlasPlaceKind, string> = {
    capital: "★",
    city: "◆",
    town: "●",
    village: "○",
    hamlet: "·",
    port: "⚓",
    fort: "♜",
    castle: "♛",
    dungeon: "⚔",
    ruin: "△",
    temple: "✦",
    tower: "♟",
    mine: "◇",
    cave: "◒",
    landmark: "✧",
    "planar-gate": "◉",
  };
  return values[kind];
}

function pathStyle(kind: AtlasPathKind) {
  if (kind === "road") return { stroke: "#65462d", width: 9, dash: "24 12" };
  if (kind === "trail") return { stroke: "#705b43", width: 6, dash: "10 15" };
  return { stroke: "#365f75", width: 6, dash: "20 20" };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The world could not complete that request.";
}

function formatDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const days = Math.floor(rounded / (8 * 60));
  const hours = Math.floor((rounded % (8 * 60)) / 60);
  const mins = rounded % 60;
  const parts = [
    ...(days ? [`${days} travel day${days === 1 ? "" : "s"}`] : []),
    ...(hours ? [`${hours}h`] : []),
    ...(mins ? [`${mins}m`] : []),
  ];
  return parts.length ? parts.join(" ") : "0m";
}

function FieldLabel({ children }: { children: string }) {
  return <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b9a77e]">{children}</label>;
}

const fieldClass =
  "w-full rounded-lg border border-[#6d5638]/70 bg-[#171813] px-3 py-2 text-sm text-[#efe3c3] outline-none focus:border-[#bd9353]";
const buttonClass =
  "rounded-lg border border-[#806542] bg-[#282318] px-3 py-2 text-sm font-semibold text-[#e9dbb7] hover:border-[#bd9353] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "rounded-lg border border-[#b58c4d] bg-[#725323] px-3 py-2 text-sm font-semibold text-[#fff1c9] hover:bg-[#85622a] disabled:cursor-not-allowed disabled:opacity-50";

export function CampaignWorldMap({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const atlasQuery = useQuery({
    queryKey: ["campaigns", "play", campaignId, "atlas"],
    queryFn: () => getCampaignWorldAtlas(campaignId),
    staleTime: 30_000,
  });
  const stateQuery = useQuery({
    queryKey: ["campaigns", "play", campaignId, "world-state"],
    queryFn: () => getCampaignWorldState(campaignId),
    staleTime: 10_000,
  });

  async function refreshWorld() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "atlas"] }),
      queryClient.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "world-state"] }),
      queryClient.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "state"] }),
    ]);
  }

  if (atlasQuery.isLoading || stateQuery.isLoading) {
    return (
      <div className="grid min-h-[640px] flex-1 place-items-center bg-[#111612] p-8 text-[#dfd0a4]">
        <div className="text-center">
          <Compass className="mx-auto h-10 w-10 animate-pulse" />
          <p className="mt-4 font-display text-2xl">Opening the living world…</p>
        </div>
      </div>
    );
  }

  if (atlasQuery.error || stateQuery.error || !atlasQuery.data || !stateQuery.data) {
    return (
      <div className="grid min-h-[640px] flex-1 place-items-center bg-[#111612] p-8">
        <div className="max-w-xl rounded-2xl border border-[#7b5d38]/60 bg-[#201c16] p-8 text-center text-[#e8dcb7]">
          <TriangleAlert className="mx-auto h-9 w-9 text-[#c79d55]" />
          <h2 className="mt-4 font-display text-2xl">The world workspace is unavailable</h2>
          <p className="mt-2 text-sm text-[#b7a987]">
            {errorMessage(atlasQuery.error ?? stateQuery.error)}
          </p>
          <button type="button" className={`${buttonClass} mt-5`} onClick={() => void refreshWorld()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorldWorkspace
      campaignId={campaignId}
      atlas={atlasQuery.data.atlas}
      state={stateQuery.data}
      onRefresh={refreshWorld}
    />
  );
}

function WorldWorkspace({
  campaignId,
  atlas,
  state,
  onRefresh,
}: {
  campaignId: string;
  atlas: WorldAtlasDocument;
  state: CampaignWorldStateResponse;
  onRefresh: () => Promise<void>;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: ViewBox } | null>(null);
  const [view, setView] = useState<ViewBox>(() => fullView(atlas));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(state.exploration.partyPosition.placeId);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("inspect");
  const [builderOpen, setBuilderOpen] = useState(state.canEdit);
  const [moveMode, setMoveMode] = useState<MoveMode>(null);
  const [showFog, setShowFog] = useState(!state.canEdit);
  const [search, setSearch] = useState("");
  const [travelPlan, setTravelPlan] = useState<AtlasTravelPlan | null>(null);
  const [regenerateConfirmation, setRegenerateConfirmation] = useState<RegenerateMode | null>(null);

  useEffect(() => {
    setView((current) =>
      current.width > atlas.widthMiles ? fullView(atlas) : current,
    );
  }, [atlas]);

  const discoveredPlaces = useMemo(
    () => new Set(state.exploration.discoveredPlaceIds),
    [state.exploration.discoveredPlaceIds],
  );
  const discoveredRegions = useMemo(
    () => new Set(state.exploration.discoveredRegionIds),
    [state.exploration.discoveredRegionIds],
  );
  const currentPlace = atlas.places.find(
    (place) => place.id === state.exploration.partyPosition.placeId,
  );
  const selectedPlace = atlas.places.find((place) => place.id === selectedPlaceId) ?? null;
  const selectedRegion = atlas.regions.find((region) => region.id === selectedRegionId) ?? null;
  const selectedPath = atlas.paths.find((path) => path.id === selectedPathId) ?? null;

  const adjacentUndiscovered = useMemo(() => {
    const values = new Set<string>();
    const currentId = state.exploration.partyPosition.placeId;
    for (const path of atlas.paths) {
      if (path.kind === "sea-route") continue;
      if (path.fromPlaceId === currentId && !discoveredPlaces.has(path.toPlaceId)) values.add(path.toPlaceId);
      if (path.toPlaceId === currentId && !discoveredPlaces.has(path.fromPlaceId)) values.add(path.fromPlaceId);
    }
    return values;
  }, [atlas.paths, discoveredPlaces, state.exploration.partyPosition.placeId]);

  const playerVisiblePlaces = useMemo(
    () =>
      atlas.places.filter(
        (place) => state.canEdit || discoveredPlaces.has(place.id) || adjacentUndiscovered.has(place.id),
      ),
    [adjacentUndiscovered, atlas.places, discoveredPlaces, state.canEdit],
  );

  const filteredPlaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return playerVisiblePlaces;
    return playerVisiblePlaces.filter((place) => {
      if (!state.canEdit && !discoveredPlaces.has(place.id)) return false;
      return `${place.name} ${PLACE_LABELS[place.kind]}`.toLowerCase().includes(term);
    });
  }, [discoveredPlaces, playerVisiblePlaces, search, state.canEdit]);

  const editMutation = useMutation({
    mutationFn: (operation: CampaignWorldEditOperation) =>
      editCampaignWorld(campaignId, state.revision, operation),
    onSuccess: async () => {
      toast.success("World atlas updated.");
      await onRefresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const moveMutation = useMutation({
    mutationFn: ({ mode, point }: { mode: Exclude<MoveMode, null>; point: AtlasPoint }) => {
      if (mode.kind === "place") {
        return editCampaignWorld(campaignId, state.revision, {
          type: "place.update",
          id: mode.id,
          patch: { x: point.x, y: point.y },
        });
      }
      return editCampaignWorld(campaignId, state.revision, {
        type: "region.update",
        id: mode.id,
        patch: { center: point },
      });
    },
    onSuccess: async () => {
      setMoveMode(null);
      toast.success("Map position updated.");
      await onRefresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const regenerateMutation = useMutation({
    mutationFn: (seedMode: RegenerateMode) =>
      regenerateCampaignWorld(campaignId, state.revision, seedMode),
    onSuccess: async (value, seedMode) => {
      setRegenerateConfirmation(null);
      setSelectedPlaceId(null);
      setSelectedRegionId(null);
      setSelectedPathId(null);
      setTravelPlan(null);
      if (value.atlas) setView(fullView(value.atlas));
      toast.success(seedMode === "same" ? "World reset from the same seed." : "New world generated.");
      await onRefresh();
    },
    onError: (error) => {
      setRegenerateConfirmation(null);
      toast.error(errorMessage(error));
    },
  });

  function wheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
    if (!svg.current) return;
    const anchor = mapPointer(svg.current, view, event.clientX, event.clientY);
    setView((current) => zoomView(atlas, current, anchor, event.deltaY < 0 ? 0.82 : 1.2));
  }

  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (moveMode) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, view };
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const value = drag.current;
    if (!value || !svg.current) return;
    const rect = svg.current.getBoundingClientRect();
    const dx = ((event.clientX - value.x) / rect.width) * value.view.width;
    const dy = ((event.clientY - value.y) / rect.height) * value.view.height;
    setView({
      ...value.view,
      x: clamp(value.view.x - dx, 0, atlas.widthMiles - value.view.width),
      y: clamp(value.view.y - dy, 0, atlas.heightMiles - value.view.height),
    });
  }

  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (moveMode && svg.current) {
      const point = mapPointer(svg.current, view, event.clientX, event.clientY);
      moveMutation.mutate({ mode: moveMode, point });
      return;
    }
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function zoom(factor: number) {
    const anchor = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    setView((current) => zoomView(atlas, current, anchor, factor));
  }

  const revealRadius = Math.max(180, atlas.widthMiles * 0.025);
  const maskId = `fog-mask-${campaignId}`;

  return (
    <div className="flex min-h-[680px] flex-1 overflow-hidden bg-[#10140f] text-[#e8dcb7]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6d5638]/50 bg-[#181913] px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#bd9353]">
              <Sparkles className="h-3.5 w-3.5" /> Living campaign world
            </div>
            <h2 className="font-display text-2xl text-[#f1e6c6]">{atlas.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#9e8f70]" />
              <input className={`${fieldClass} w-52 pl-8`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find discovered place…" />
            </div>
            <button type="button" className={buttonClass} onClick={() => setShowFog((value) => !value)}>
              {showFog ? <Eye className="mr-1 inline h-4 w-4" /> : <EyeOff className="mr-1 inline h-4 w-4" />}
              Fog
            </button>
            {state.canEdit ? (
              <button type="button" className={buttonClass} onClick={() => setBuilderOpen((value) => !value)}>
                <Settings2 className="mr-1 inline h-4 w-4" /> Builder
              </button>
            ) : null}
          </div>
        </div>

        {state.exploration.pendingEncounter ? (
          <div className="flex items-center justify-between gap-3 border-b border-[#8d543c] bg-[#3b201a] px-4 py-3 text-sm text-[#ffd9b8]">
            <span>
              <TriangleAlert className="mr-2 inline h-4 w-4" /> Travel encounter triggered at the party's current location. Resolve it before further travel.
            </span>
            {state.canEdit ? (
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  void clearCampaignTravelEncounter(campaignId, state.revision)
                    .then(onRefresh)
                    .catch((error) => toast.error(errorMessage(error)))
                }
              >
                Clear encounter
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="relative min-h-[560px] flex-1 overflow-hidden bg-[#6c9297]">
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
            className={`h-full min-h-[560px] w-full touch-none select-none ${moveMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
            aria-label={`${atlas.title} world map`}
          >
            <defs>
              <linearGradient id={`ocean-${campaignId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#95b9ba" />
                <stop offset="1" stopColor="#547f89" />
              </linearGradient>
              <mask id={maskId}>
                <rect width={atlas.widthMiles} height={atlas.heightMiles} fill="white" />
                {state.exploration.discoveredPlaceIds.map((placeId) => {
                  const place = atlas.places.find((candidate) => candidate.id === placeId);
                  return place ? <circle key={place.id} cx={place.x} cy={place.y} r={revealRadius} fill="black" /> : null;
                })}
              </mask>
            </defs>

            <rect width={atlas.widthMiles} height={atlas.heightMiles} fill={`url(#ocean-${campaignId})`} />
            {atlas.landmasses.map((landmass) => (
              <polygon
                key={landmass.id}
                points={svgPoints(landmass.points)}
                fill={BIOME_COLORS[landmass.biome]}
                stroke="#564a38"
                strokeWidth={10}
                strokeLinejoin="round"
              />
            ))}

            {atlas.regions.map((region) => (
              <g
                key={region.id}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  if (!state.canEdit) return;
                  event.stopPropagation();
                  setSelectedRegionId(region.id);
                  setSelectedPlaceId(null);
                  setSelectedPathId(null);
                  setBuilderMode("region");
                }}
              >
                <ellipse
                  cx={region.center.x}
                  cy={region.center.y}
                  rx={Math.max(160, atlas.widthMiles * 0.018)}
                  ry={Math.max(120, atlas.heightMiles * 0.02)}
                  fill={BIOME_COLORS[region.biome]}
                  opacity={state.canEdit && selectedRegionId === region.id ? 0.6 : 0.25}
                  stroke={state.canEdit && selectedRegionId === region.id ? "#f0ce78" : "none"}
                  strokeWidth={8}
                />
                {(state.canEdit || discoveredRegions.has(region.id)) && view.width < atlas.widthMiles * 0.72 ? (
                  <text x={region.center.x} y={region.center.y} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize={34} fill="#5e3127" stroke="#dfd0a5" strokeWidth={6} paintOrder="stroke">
                    {region.name}
                  </text>
                ) : null}
              </g>
            ))}

            {atlas.paths.map((path) => {
              const style = pathStyle(path.kind);
              const visible = state.canEdit || discoveredPlaces.has(path.fromPlaceId) || discoveredPlaces.has(path.toPlaceId);
              if (!visible) return null;
              return (
                <polyline
                  key={path.id}
                  points={svgPoints(path.points)}
                  fill="none"
                  stroke={selectedPathId === path.id ? "#f0ce78" : style.stroke}
                  strokeWidth={selectedPathId === path.id ? style.width + 5 : style.width}
                  strokeDasharray={style.dash}
                  opacity={0.72}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    if (!state.canEdit) return;
                    event.stopPropagation();
                    setSelectedPathId(path.id);
                    setSelectedPlaceId(null);
                    setSelectedRegionId(null);
                    setBuilderMode("path");
                  }}
                />
              );
            })}

            {atlas.rivers.map((river) => (
              <polyline key={river.id} points={svgPoints(river.points)} fill="none" stroke="#4b8399" strokeWidth={10} opacity=".82" vectorEffect="non-scaling-stroke" />
            ))}

            {atlas.mountainRanges.flatMap((range) =>
              range.points.map((point, index) => (
                <path key={`${range.id}:${index}`} d={`M${point.x - 38} ${point.y + 30} L${point.x} ${point.y - 42} L${point.x + 38} ${point.y + 30} Z`} fill="#807667" stroke="#4b4338" strokeWidth={5} vectorEffect="non-scaling-stroke" />
              )),
            )}

            {filteredPlaces.map((place) => {
              const discovered = state.canEdit || discoveredPlaces.has(place.id);
              const selected = selectedPlaceId === place.id;
              return (
                <g
                  key={place.id}
                  transform={`translate(${place.x} ${place.y})`}
                  className="cursor-pointer"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedPlaceId(place.id);
                    setSelectedRegionId(null);
                    setSelectedPathId(null);
                    if (state.canEdit) setBuilderMode("place");
                  }}
                >
                  {selected ? <circle r={46} fill="none" stroke="#f0ce78" strokeWidth={5} vectorEffect="non-scaling-stroke" /> : null}
                  <circle r={30} fill="#eadcaf" stroke="#4c3727" strokeWidth={4} vectorEffect="non-scaling-stroke" />
                  <text textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontSize={34} fill="#4b2f25">
                    {discovered ? placeGlyph(place.kind) : "?"}
                  </text>
                  <text y={58} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize={23} fill="#35271d" stroke="#eadcaf" strokeWidth={5} paintOrder="stroke">
                    {discovered ? place.name : "Uncharted"}
                  </text>
                </g>
              );
            })}

            {showFog && !state.canEdit ? (
              <rect width={atlas.widthMiles} height={atlas.heightMiles} fill="#11150f" opacity={0.88} mask={`url(#${maskId})`} pointerEvents="none" />
            ) : null}

            {!state.canEdit
              ? [...adjacentUndiscovered].map((placeId) => {
                  const place = atlas.places.find((candidate) => candidate.id === placeId);
                  return place ? (
                    <g key={`unknown:${place.id}`} transform={`translate(${place.x} ${place.y})`} pointerEvents="none">
                      <circle r={24} fill="#2a241b" stroke="#d4b36a" strokeWidth={4} vectorEffect="non-scaling-stroke" />
                      <text textAnchor="middle" dominantBaseline="middle" fontSize={26} fill="#f0d28b">?</text>
                    </g>
                  ) : null;
                })
              : null}

            <g transform={`translate(${state.exploration.partyPosition.x} ${state.exploration.partyPosition.y})`} pointerEvents="none">
              <circle r={42} fill="#3d291c" stroke="#ffd879" strokeWidth={7} vectorEffect="non-scaling-stroke" />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={31} fill="#ffe5a1">◆</text>
            </g>
          </svg>

          <div className="absolute left-4 top-4 rounded-xl border border-[#71573b]/70 bg-[#eadcaf]/90 p-3 text-[#3a2a20] shadow-xl">
            <div className="relative grid h-20 w-20 place-items-center">
              <div className="absolute inset-2 rounded-full border-2 border-[#5e452f]" />
              <span className="absolute top-0 font-display text-sm font-bold">N</span>
              <Compass className="h-8 w-8 text-[#6c4a2e]" />
            </div>
          </div>

          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button type="button" className={buttonClass} onClick={() => zoom(0.8)} aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <button type="button" className={buttonClass} onClick={() => zoom(1.25)} aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <button type="button" className={buttonClass} onClick={() => setView(fullView(atlas))} aria-label="Reset map"><RefreshCw className="h-4 w-4" /></button>
          </div>

          {moveMode ? (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-[#c69b52] bg-[#2c2418]/95 px-4 py-2 text-sm text-[#f8e5b5] shadow-xl">
              <Crosshair className="mr-2 inline h-4 w-4" /> Click the map to move the selected {moveMode.kind}. <button type="button" className="ml-3 underline" onClick={() => setMoveMode(null)}>Cancel</button>
            </div>
          ) : null}
        </div>

        <TravelPanel
          campaignId={campaignId}
          atlas={atlas}
          state={state}
          currentPlace={currentPlace ?? null}
          discoveredPlaces={discoveredPlaces}
          adjacentUndiscovered={adjacentUndiscovered}
          plan={travelPlan}
          onPlan={setTravelPlan}
          onRefresh={onRefresh}
        />
      </div>

      {state.canEdit && builderOpen ? (
        <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-[#6d5638]/50 bg-[#151710] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bd9353]">GM World Builder</div>
              <div className="mt-1 text-xs text-[#93886d]">Revision {state.revision}</div>
            </div>
            <Layers3 className="h-5 w-5 text-[#bd9353]" />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-[#5f4d34] bg-[#1f1e17] p-1">
            {(["inspect", "place", "region", "path"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setBuilderMode(mode)} className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize ${builderMode === mode ? "bg-[#725323] text-[#fff1c9]" : "text-[#b7aa88] hover:bg-[#2b281e]"}`}>
                {mode}
              </button>
            ))}
          </div>

          {builderMode === "inspect" ? (
            <InspectorPanel
              report={state.inspector}
              weather={state.exploration.weather}
              regenerateMode={regenerateConfirmation}
              regenerateBusy={regenerateMutation.isPending}
              onWeather={(weather) =>
                void setCampaignWorldWeather(campaignId, state.revision, weather)
                  .then(onRefresh)
                  .catch((error) => toast.error(errorMessage(error)))
              }
              onCancelRegenerate={() => setRegenerateConfirmation(null)}
              onRegenerate={(seedMode) => {
                if (regenerateConfirmation === seedMode) {
                  regenerateMutation.mutate(seedMode);
                  return;
                }
                setRegenerateConfirmation(seedMode);
              }}
            />
          ) : null}

          {builderMode === "place" ? (
            <PlaceBuilder
              atlas={atlas}
              selected={selectedPlace}
              mapCenter={{ x: view.x + view.width / 2, y: view.y + view.height / 2 }}
              busy={editMutation.isPending || moveMutation.isPending}
              onCreate={(operation) => editMutation.mutate(operation)}
              onUpdate={(operation) => editMutation.mutate(operation)}
              onMove={(id) => setMoveMode({ kind: "place", id })}
              onMoveParty={(id) =>
                void setCampaignPartyPosition(campaignId, state.revision, id)
                  .then(onRefresh)
                  .catch((error) => toast.error(errorMessage(error)))
              }
              onDelete={(id) => {
                if (window.confirm("Delete this place and every path attached to it?")) editMutation.mutate({ type: "place.delete", id });
              }}
            />
          ) : null}

          {builderMode === "region" ? (
            <RegionBuilder
              atlas={atlas}
              selected={selectedRegion}
              mapCenter={{ x: view.x + view.width / 2, y: view.y + view.height / 2 }}
              busy={editMutation.isPending || moveMutation.isPending}
              onCreate={(operation) => editMutation.mutate(operation)}
              onUpdate={(operation) => editMutation.mutate(operation)}
              onMove={(id) => setMoveMode({ kind: "region", id })}
              onDelete={(id) => {
                if (window.confirm("Delete this region? Places will remain but become unassigned.")) editMutation.mutate({ type: "region.delete", id });
              }}
            />
          ) : null}

          {builderMode === "path" ? (
            <PathBuilder
              atlas={atlas}
              selected={selectedPath}
              busy={editMutation.isPending}
              onCreate={(operation) => editMutation.mutate(operation)}
              onUpdate={(operation) => editMutation.mutate(operation)}
              onDelete={(id) => {
                if (window.confirm("Delete this travel path?")) editMutation.mutate({ type: "path.delete", id });
              }}
            />
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function TravelPanel({
  campaignId,
  atlas,
  state,
  currentPlace,
  discoveredPlaces,
  adjacentUndiscovered,
  plan,
  onPlan,
  onRefresh,
}: {
  campaignId: string;
  atlas: WorldAtlasDocument;
  state: CampaignWorldStateResponse;
  currentPlace: AtlasPlace | null;
  discoveredPlaces: ReadonlySet<string>;
  adjacentUndiscovered: ReadonlySet<string>;
  plan: AtlasTravelPlan | null;
  onPlan: (plan: AtlasTravelPlan | null) => void;
  onRefresh: () => Promise<void>;
}) {
  const [destination, setDestination] = useState("");
  const planMutation = useMutation({
    mutationFn: (placeId: string) => planCampaignTravel(campaignId, placeId),
    onSuccess: (value) => onPlan(value.plan),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const travelMutation = useMutation({
    mutationFn: (placeId: string) => commitCampaignTravel(campaignId, state.revision, placeId),
    onSuccess: async (value) => {
      onPlan(null);
      setDestination("");
      toast.success(
        value.exploration.pendingEncounter
          ? "Travel complete — an encounter was triggered."
          : "Travel complete.",
      );
      await onRefresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const destinations = atlas.places.filter(
    (place) =>
      place.id !== state.exploration.partyPosition.placeId &&
      (state.canEdit || discoveredPlaces.has(place.id) || adjacentUndiscovered.has(place.id)),
  );

  return (
    <div className="border-t border-[#6d5638]/50 bg-[#181913] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[190px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9f906d]">Party position</div>
          <div className="mt-1 text-sm font-semibold text-[#eadcaf]">{currentPlace?.name ?? "Unknown"}</div>
        </div>
        <div className="min-w-[140px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9f906d]">Weather</div>
          <div className="mt-1 text-sm text-[#d8c79e]">{WEATHER_LABELS[state.exploration.weather]}</div>
        </div>
        <div className="min-w-[170px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9f906d]">Campaign travel time</div>
          <div className="mt-1 text-sm text-[#d8c79e]">{formatDuration(state.exploration.campaignMinutes)}</div>
        </div>

        {state.canTravel ? (
          <>
            <select
              className={`${fieldClass} min-w-[220px] flex-1`}
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                onPlan(null);
              }}
              disabled={Boolean(state.exploration.pendingEncounter)}
            >
              <option value="">Choose route destination…</option>
              {destinations.map((place) => (
                <option key={place.id} value={place.id}>
                  {state.canEdit || discoveredPlaces.has(place.id) ? place.name : "Uncharted destination"}
                </option>
              ))}
            </select>
            <button type="button" className={buttonClass} disabled={!destination || planMutation.isPending || Boolean(state.exploration.pendingEncounter)} onClick={() => destination && planMutation.mutate(destination)}>
              <Route className="mr-1 inline h-4 w-4" /> Plan
            </button>
          </>
        ) : null}
      </div>

      {plan ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#6f5838] bg-[#232117] p-3 text-sm">
          <Footprints className="h-5 w-5 text-[#d3a65b]" />
          <span><strong>{Math.round(plan.distanceMiles).toLocaleString()} mi</strong></span>
          <span>{formatDuration(plan.durationMinutes)}</span>
          <span>party speed {plan.speedFeet} ft.</span>
          <span>encounter risk {Math.round(plan.encounterChance * 100)}%</span>
          <span className="text-[#a99a7d]">{plan.segments.map((segment) => segment.terrain).join(" → ")}</span>
          <button type="button" className={`${primaryButtonClass} ml-auto`} disabled={travelMutation.isPending || Boolean(state.exploration.pendingEncounter)} onClick={() => travelMutation.mutate(plan.toPlaceId)}>
            Travel
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InspectorPanel({
  report,
  weather,
  regenerateMode,
  regenerateBusy,
  onWeather,
  onRegenerate,
  onCancelRegenerate,
}: {
  report: AtlasInspectorReport | null;
  weather: AtlasTravelWeather;
  regenerateMode: RegenerateMode | null;
  regenerateBusy: boolean;
  onWeather: (weather: AtlasTravelWeather) => void;
  onRegenerate: (seedMode: RegenerateMode) => void;
  onCancelRegenerate: () => void;
}) {
  const confirmingSame = regenerateMode === "same";
  const confirmingNew = regenerateMode === "new";
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Places" value={report?.placeCount ?? 0} />
        <Stat label="Regions" value={report?.regionCount ?? 0} />
        <Stat label="Paths" value={report?.pathCount ?? 0} />
        <Stat label="Landmasses" value={report?.landmassCount ?? 0} />
      </div>
      <div>
        <FieldLabel>World weather</FieldLabel>
        <select className={`${fieldClass} mt-1`} value={weather} onChange={(event) => onWeather(event.target.value as AtlasTravelWeather)}>
          {Object.entries(WEATHER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="rounded-xl border border-[#5c4b33] bg-[#1f2018] p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#bda775]">Inspector</div>
        {report?.issues.length ? (
          <div className="mt-2 space-y-2">
            {report.issues.slice(0, 12).map((issue, index) => (
              <div key={`${issue.code}:${issue.entityId ?? index}`} className="text-xs leading-5 text-[#e1bf9c]">{issue.message}</div>
            ))}
          </div>
        ) : <div className="mt-2 text-sm text-[#a99b7d]">No structural atlas issues detected.</div>}
      </div>
      {regenerateMode ? (
        <div className="rounded-xl border border-[#8a6237] bg-[#2b2115] p-3 text-xs leading-5 text-[#e7cca0]">
          {confirmingSame
            ? "Resetting from the same seed replaces all GM map edits and discovery, but keeps the campaign seed. Click Confirm reset to continue."
            : "Regenerating creates a new world seed and replaces all GM map edits and discovery. Click Confirm regenerate to continue."}
        </div>
      ) : null}
      <div className="space-y-2">
        <button
          type="button"
          className={`${buttonClass} w-full`}
          disabled={regenerateBusy}
          onClick={() => onRegenerate("same")}
        >
          <RefreshCw className={`mr-2 inline h-4 w-4 ${regenerateBusy && confirmingSame ? "animate-spin" : ""}`} />
          {regenerateBusy && confirmingSame
            ? "Resetting…"
            : confirmingSame
              ? "Confirm reset"
              : "Reset from same seed"}
        </button>
        <button
          type="button"
          className={`${primaryButtonClass} w-full`}
          disabled={regenerateBusy}
          onClick={() => onRegenerate("new")}
        >
          <WandSparkles className={`mr-2 inline h-4 w-4 ${regenerateBusy && confirmingNew ? "animate-pulse" : ""}`} />
          {regenerateBusy && confirmingNew
            ? "Regenerating…"
            : confirmingNew
              ? "Confirm regenerate"
              : "Regenerate new world"}
        </button>
        {regenerateMode && !regenerateBusy ? (
          <button type="button" className={`${buttonClass} w-full`} onClick={onCancelRegenerate}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#5f4d34] bg-[#201f18] p-3"><div className="text-[10px] uppercase tracking-[0.15em] text-[#95886d]">{label}</div><div className="mt-1 font-display text-xl text-[#eadcaf]">{value}</div></div>;
}

function PlaceBuilder({
  atlas,
  selected,
  mapCenter,
  busy,
  onCreate,
  onUpdate,
  onMove,
  onMoveParty,
  onDelete,
}: {
  atlas: WorldAtlasDocument;
  selected: AtlasPlace | null;
  mapCenter: AtlasPoint;
  busy: boolean;
  onCreate: (operation: CampaignWorldEditOperation) => void;
  onUpdate: (operation: CampaignWorldEditOperation) => void;
  onMove: (id: string) => void;
  onMoveParty: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(selected?.name ?? "");
  const [kind, setKind] = useState<AtlasPlaceKind>(selected?.kind ?? "town");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [importance, setImportance] = useState(String(selected?.importance ?? 0.5));

  useEffect(() => {
    setName(selected?.name ?? "");
    setKind(selected?.kind ?? "town");
    setDescription(selected?.description ?? "");
    setImportance(String(selected?.importance ?? 0.5));
  }, [selected]);

  if (!selected) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm leading-6 text-[#a99b7d]">Select a place on the map, or create one at the center of the current view.</p>
        <button type="button" className={`${primaryButtonClass} w-full`} disabled={busy} onClick={() => onCreate({ type: "place.create", value: { name: "New Place", kind: "town", x: mapCenter.x, y: mapCenter.y, importance: 0.5, description: "A GM-created location.", tags: ["gm-created"] } })}>
          <Plus className="mr-2 inline h-4 w-4" /> Create place at map center
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div><FieldLabel>Name</FieldLabel><input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div><FieldLabel>Kind</FieldLabel><select className={`${fieldClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as AtlasPlaceKind)}>{Object.entries(PLACE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div><FieldLabel>Description</FieldLabel><textarea className={`${fieldClass} mt-1 min-h-24`} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      <div><FieldLabel>Importance</FieldLabel><input className={`${fieldClass} mt-1`} type="number" min="0.1" max="1" step="0.05" value={importance} onChange={(event) => setImportance(event.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#9d9072]"><span>x {Math.round(selected.x)}</span><span>y {Math.round(selected.y)}</span></div>
      <button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !name.trim()} onClick={() => onUpdate({ type: "place.update", id: selected.id, patch: { name: name.trim(), kind, description: description.trim(), importance: clamp(Number(importance) || 0.5, 0.1, 1) } })}>Save place</button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={buttonClass} disabled={busy} onClick={() => onMove(selected.id)}><Crosshair className="mr-1 inline h-4 w-4" /> Move</button>
        <button type="button" className={buttonClass} disabled={busy} onClick={() => onMoveParty(selected.id)}><MapPin className="mr-1 inline h-4 w-4" /> Party here</button>
      </div>
      <button type="button" className="w-full rounded-lg border border-[#7c4238] px-3 py-2 text-sm font-semibold text-[#e7aa9d] hover:bg-[#4a241f]" disabled={busy} onClick={() => onDelete(selected.id)}><Trash2 className="mr-2 inline h-4 w-4" /> Delete place</button>
      <div className="text-xs text-[#8e8269]">Landmass: {atlas.landmasses.find((value) => value.id === selected.landmassId)?.name ?? selected.landmassId}</div>
    </div>
  );
}

function RegionBuilder({ atlas, selected, mapCenter, busy, onCreate, onUpdate, onMove, onDelete }: { atlas: WorldAtlasDocument; selected: AtlasRegion | null; mapCenter: AtlasPoint; busy: boolean; onCreate: (operation: CampaignWorldEditOperation) => void; onUpdate: (operation: CampaignWorldEditOperation) => void; onMove: (id: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(selected?.name ?? "");
  const [biome, setBiome] = useState<AtlasBiome>(selected?.biome ?? "temperate");
  const [importance, setImportance] = useState(String(selected?.importance ?? 0.6));
  useEffect(() => { setName(selected?.name ?? ""); setBiome(selected?.biome ?? "temperate"); setImportance(String(selected?.importance ?? 0.6)); }, [selected]);
  if (!selected) return <div className="mt-4 space-y-3"><p className="text-sm leading-6 text-[#a99b7d]">Select a region or create one at the center of the current view.</p><button type="button" className={`${primaryButtonClass} w-full`} disabled={busy} onClick={() => onCreate({ type: "region.create", value: { name: "New Region", center: mapCenter, biome: "temperate", importance: 0.6 } })}><Plus className="mr-2 inline h-4 w-4" /> Create region</button></div>;
  return <div className="mt-4 space-y-3"><div><FieldLabel>Name</FieldLabel><input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} /></div><div><FieldLabel>Biome</FieldLabel><select className={`${fieldClass} mt-1`} value={biome} onChange={(event) => setBiome(event.target.value as AtlasBiome)}>{Object.keys(BIOME_COLORS).map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div><FieldLabel>Importance</FieldLabel><input className={`${fieldClass} mt-1`} type="number" min="0.1" max="1" step="0.05" value={importance} onChange={(event) => setImportance(event.target.value)} /></div><button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !name.trim()} onClick={() => onUpdate({ type: "region.update", id: selected.id, patch: { name: name.trim(), biome, importance: clamp(Number(importance) || 0.6, 0.1, 1) } })}>Save region</button><button type="button" className={`${buttonClass} w-full`} disabled={busy} onClick={() => onMove(selected.id)}><Crosshair className="mr-2 inline h-4 w-4" /> Move region center</button><button type="button" className="w-full rounded-lg border border-[#7c4238] px-3 py-2 text-sm font-semibold text-[#e7aa9d] hover:bg-[#4a241f]" disabled={busy} onClick={() => onDelete(selected.id)}><Trash2 className="mr-2 inline h-4 w-4" /> Delete region</button><div className="text-xs text-[#8e8269]">Landmass: {atlas.landmasses.find((value) => value.id === selected.landmassId)?.name ?? selected.landmassId}</div></div>;
}

function PathBuilder({ atlas, selected, busy, onCreate, onUpdate, onDelete }: { atlas: WorldAtlasDocument; selected: AtlasPath | null; busy: boolean; onCreate: (operation: CampaignWorldEditOperation) => void; onUpdate: (operation: CampaignWorldEditOperation) => void; onDelete: (id: string) => void }) {
  const [fromPlaceId, setFromPlaceId] = useState(selected?.fromPlaceId ?? atlas.places[0]?.id ?? "");
  const [toPlaceId, setToPlaceId] = useState(selected?.toPlaceId ?? atlas.places[1]?.id ?? "");
  const [kind, setKind] = useState<AtlasPathKind>(selected?.kind ?? "road");
  useEffect(() => { setFromPlaceId(selected?.fromPlaceId ?? atlas.places[0]?.id ?? ""); setToPlaceId(selected?.toPlaceId ?? atlas.places[1]?.id ?? ""); setKind(selected?.kind ?? "road"); }, [atlas.places, selected]);
  const valid = Boolean(fromPlaceId && toPlaceId && fromPlaceId !== toPlaceId);
  return <div className="mt-4 space-y-3"><p className="text-sm leading-6 text-[#a99b7d]">{selected ? `Editing ${selected.id}` : "Create a road, trail, or sea route between two places."}</p><div><FieldLabel>From</FieldLabel><select className={`${fieldClass} mt-1`} value={fromPlaceId} onChange={(event) => setFromPlaceId(event.target.value)}>{atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></div><div><FieldLabel>To</FieldLabel><select className={`${fieldClass} mt-1`} value={toPlaceId} onChange={(event) => setToPlaceId(event.target.value)}>{atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></div><div><FieldLabel>Kind</FieldLabel><select className={`${fieldClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as AtlasPathKind)}><option value="road">Road</option><option value="trail">Trail</option><option value="sea-route">Sea route</option></select></div>{selected ? <><button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !valid} onClick={() => onUpdate({ type: "path.update", id: selected.id, patch: { fromPlaceId, toPlaceId, kind } })}>Save path</button><button type="button" className="w-full rounded-lg border border-[#7c4238] px-3 py-2 text-sm font-semibold text-[#e7aa9d] hover:bg-[#4a241f]" disabled={busy} onClick={() => onDelete(selected.id)}><Trash2 className="mr-2 inline h-4 w-4" /> Delete path</button></> : <button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !valid} onClick={() => onCreate({ type: "path.create", value: { fromPlaceId, toPlaceId, kind } })}><Plus className="mr-2 inline h-4 w-4" /> Create path</button>}</div>;
}
