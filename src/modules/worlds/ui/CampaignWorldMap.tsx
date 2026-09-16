import {
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Footprints,
  Layers3,
  Map as MapIcon,
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
  AtlasLandmass,
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
  temperate: "#70875e",
  forest: "#365f43",
  tundra: "#b7c3bd",
  desert: "#c5a36a",
  steppe: "#9f9a62",
  swamp: "#536b53",
  jungle: "#32633f",
  highlands: "#817766",
  badlands: "#a5674e",
  enchanted: "#58765f",
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

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  if (kind === "road") return { stroke: "#5c432d", width: 4, dash: "16 8" };
  if (kind === "trail") return { stroke: "#695943", width: 3, dash: "7 11" };
  return { stroke: "#315f77", width: 3, dash: "15 12" };
}

function shadeHex(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return hex;
  const number = Number.parseInt(value, 16);
  const r = clamp((number >> 16) + amount, 0, 255);
  const g = clamp(((number >> 8) & 255) + amount, 0, 255);
  const b = clamp((number & 255) + amount, 0, 255);
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function terrainPatches(landmass: AtlasLandmass): Array<{
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
}> {
  const random = mulberry32(hash32(`${landmass.id}:${landmass.name}:terrain`));
  return Array.from({ length: 18 }, () => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.72;
    return {
      x: landmass.center.x + Math.cos(angle) * landmass.radiusX * radius,
      y: landmass.center.y + Math.sin(angle) * landmass.radiusY * radius,
      rx: landmass.radiusX * (0.035 + random() * 0.08),
      ry: landmass.radiusY * (0.025 + random() * 0.065),
      rotation: random() * 180,
    };
  });
}

function regionDisplayRadius(atlas: WorldAtlasDocument, region: AtlasRegion): number {
  const landmass = atlas.landmasses.find((candidate) => candidate.id === region.landmassId);
  const maximum = landmass ? Math.min(landmass.radiusX, landmass.radiusY) * 0.28 : atlas.widthMiles * 0.025;
  const neighbors = atlas.regions.filter(
    (candidate) => candidate.landmassId === region.landmassId && candidate.id !== region.id,
  );
  if (!neighbors.length) return maximum;
  const nearest = Math.min(...neighbors.map((candidate) => distance(region.center, candidate.center)));
  return Math.max(1, Math.min(maximum, nearest * 0.4));
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
  const [showLegend, setShowLegend] = useState(true);
  const [search, setSearch] = useState("");
  const [travelPlan, setTravelPlan] = useState<AtlasTravelPlan | null>(null);
  const [regenerateConfirmation, setRegenerateConfirmation] = useState<RegenerateMode | null>(null);

  useEffect(() => {
    setView((current) => (current.width > atlas.widthMiles ? fullView(atlas) : current));
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

  const regionRadii = useMemo(
    () => new Map(atlas.regions.map((region) => [region.id, regionDisplayRadius(atlas, region)] as const)),
    [atlas],
  );

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

  function centerOnParty() {
    const width = Math.max(atlas.widthMiles / 5, atlas.widthMiles / 14);
    const height = width * (atlas.heightMiles / atlas.widthMiles);
    setView({
      x: clamp(state.exploration.partyPosition.x - width / 2, 0, atlas.widthMiles - width),
      y: clamp(state.exploration.partyPosition.y - height / 2, 0, atlas.heightMiles - height),
      width,
      height,
    });
  }

  const revealRadius = Math.max(180, atlas.widthMiles * 0.025);
  const maskId = `fog-mask-${campaignId}`;
  const oceanGradientId = `ocean-${campaignId}`;
  const oceanPatternId = `ocean-detail-${campaignId}`;
  const terrainPatternId = `terrain-grain-${campaignId}`;
  const partyMarkerRadius = Math.max(45, view.width * 0.007);
  const partyLabelSize = Math.max(24, view.width * 0.0038);

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
              <input
                className={`${fieldClass} w-52 pl-8`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find discovered place…"
              />
            </div>
            <button type="button" className={buttonClass} onClick={() => setShowLegend((value) => !value)}>
              <MapIcon className="mr-1 inline h-4 w-4" /> Legend
            </button>
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

        <div className="relative min-h-[560px] flex-1 overflow-hidden bg-[#416e78]">
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
              <linearGradient id={oceanGradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#79a7ad" />
                <stop offset="0.48" stopColor="#527f8b" />
                <stop offset="1" stopColor="#315d6b" />
              </linearGradient>
              <pattern id={oceanPatternId} width="180" height="180" patternUnits="userSpaceOnUse">
                <path d="M0 38 Q45 15 90 38 T180 38" fill="none" stroke="#d8ece7" strokeWidth="5" opacity="0.08" />
                <path d="M-45 118 Q0 95 45 118 T135 118 T225 118" fill="none" stroke="#173f4d" strokeWidth="6" opacity="0.07" />
              </pattern>
              <pattern id={terrainPatternId} width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="22" r="7" fill="#ffffff" opacity="0.035" />
                <circle cx="82" cy="42" r="11" fill="#08140d" opacity="0.035" />
                <circle cx="48" cy="92" r="6" fill="#ffffff" opacity="0.025" />
                <path d="M4 70 Q30 55 58 68 T116 64" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.025" />
              </pattern>
              {atlas.landmasses.map((landmass) => {
                const base = BIOME_COLORS[landmass.biome];
                return (
                  <g key={`defs:${landmass.id}`}>
                    <radialGradient id={`land-gradient-${campaignId}-${landmass.id}`} cx="42%" cy="38%" r="72%">
                      <stop offset="0" stopColor={shadeHex(base, 24)} />
                      <stop offset="0.52" stopColor={base} />
                      <stop offset="1" stopColor={shadeHex(base, -30)} />
                    </radialGradient>
                    <clipPath id={`land-clip-${campaignId}-${landmass.id}`}>
                      <polygon points={svgPoints(landmass.points)} />
                    </clipPath>
                  </g>
                );
              })}
              <mask id={maskId}>
                <rect width={atlas.widthMiles} height={atlas.heightMiles} fill="white" />
                {state.exploration.discoveredPlaceIds.map((placeId) => {
                  const place = atlas.places.find((candidate) => candidate.id === placeId);
                  return place ? <circle key={place.id} cx={place.x} cy={place.y} r={revealRadius} fill="black" /> : null;
                })}
              </mask>
            </defs>

            <rect width={atlas.widthMiles} height={atlas.heightMiles} fill={`url(#${oceanGradientId})`} />
            <rect width={atlas.widthMiles} height={atlas.heightMiles} fill={`url(#${oceanPatternId})`} />

            {atlas.landmasses.map((landmass) => {
              const base = BIOME_COLORS[landmass.biome];
              const clipId = `land-clip-${campaignId}-${landmass.id}`;
              return (
                <g key={landmass.id}>
                  <polygon
                    points={svgPoints(landmass.points)}
                    fill="none"
                    stroke="#b8d2c4"
                    strokeWidth={24}
                    opacity={0.25}
                    strokeLinejoin="round"
                  />
                  <polygon
                    points={svgPoints(landmass.points)}
                    fill={`url(#land-gradient-${campaignId}-${landmass.id})`}
                    stroke="#3f4338"
                    strokeWidth={8}
                    strokeLinejoin="round"
                  />
                  <g clipPath={`url(#${clipId})`}>
                    <rect
                      x={landmass.center.x - landmass.radiusX}
                      y={landmass.center.y - landmass.radiusY}
                      width={landmass.radiusX * 2}
                      height={landmass.radiusY * 2}
                      fill={`url(#${terrainPatternId})`}
                    />
                    {terrainPatches(landmass).map((patch, index) => (
                      <ellipse
                        key={`${landmass.id}:patch:${index}`}
                        cx={patch.x}
                        cy={patch.y}
                        rx={patch.rx}
                        ry={patch.ry}
                        transform={`rotate(${patch.rotation} ${patch.x} ${patch.y})`}
                        fill={index % 3 === 0 ? shadeHex(base, 22) : shadeHex(base, -24)}
                        opacity={0.11 + (index % 4) * 0.018}
                      />
                    ))}
                    {[0.32, 0.5, 0.68].map((ratio) => (
                      <ellipse
                        key={`${landmass.id}:contour:${ratio}`}
                        cx={landmass.center.x}
                        cy={landmass.center.y}
                        rx={landmass.radiusX * ratio}
                        ry={landmass.radiusY * ratio}
                        fill="none"
                        stroke={shadeHex(base, -32)}
                        strokeWidth={3}
                        strokeDasharray="14 18"
                        opacity={0.14}
                      />
                    ))}
                  </g>
                </g>
              );
            })}

            {atlas.regions.map((region) => {
              const visible = state.canEdit || discoveredRegions.has(region.id);
              if (!visible) return null;
              const radius = regionRadii.get(region.id) ?? 1;
              const selected = state.canEdit && selectedRegionId === region.id;
              return (
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
                  <circle
                    cx={region.center.x}
                    cy={region.center.y}
                    r={radius}
                    fill={BIOME_COLORS[region.biome]}
                    opacity={selected ? 0.28 : 0.08}
                    stroke={selected ? "#f0ce78" : shadeHex(BIOME_COLORS[region.biome], -38)}
                    strokeWidth={selected ? 5 : 2}
                    strokeDasharray={selected ? undefined : "12 12"}
                    vectorEffect="non-scaling-stroke"
                  />
                  {view.width < atlas.widthMiles * 0.68 ? (
                    <text
                      x={region.center.x}
                      y={region.center.y}
                      textAnchor="middle"
                      fontFamily="Georgia, serif"
                      fontWeight="700"
                      fontSize={28}
                      fill="#332b22"
                      stroke="#e4d8b9"
                      strokeWidth={5}
                      paintOrder="stroke"
                    >
                      {region.name}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {atlas.rivers.map((river) => (
              <g key={river.id}>
                <polyline
                  points={svgPoints(river.points)}
                  fill="none"
                  stroke="#264e63"
                  strokeWidth={7}
                  opacity=".72"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={svgPoints(river.points)}
                  fill="none"
                  stroke="#65a4bb"
                  strokeWidth={3.5}
                  opacity=".9"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

            {atlas.mountainRanges.flatMap((range) =>
              range.points.map((point, index) => (
                <g key={`${range.id}:${index}`}>
                  <path
                    d={`M${point.x - 42} ${point.y + 34} L${point.x + 8} ${point.y - 48} L${point.x + 47} ${point.y + 34} Z`}
                    fill="#514b43"
                    opacity=".38"
                  />
                  <path
                    d={`M${point.x - 38} ${point.y + 30} L${point.x} ${point.y - 42} L${point.x + 38} ${point.y + 30} Z`}
                    fill="#776f63"
                    stroke="#443e37"
                    strokeWidth={3}
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={`M${point.x - 8} ${point.y - 26} L${point.x} ${point.y - 42} L${point.x + 10} ${point.y - 22} Z`}
                    fill="#d4d1c7"
                    opacity=".78"
                  />
                </g>
              )),
            )}

            {atlas.paths.map((path) => {
              const style = pathStyle(path.kind);
              const visible = state.canEdit || discoveredPlaces.has(path.fromPlaceId) || discoveredPlaces.has(path.toPlaceId);
              if (!visible) return null;
              return (
                <polyline
                  key={path.id}
                  points={svgPoints(path.points)}
                  fill="none"
                  stroke={selectedPathId === path.id ? "#f4d47e" : style.stroke}
                  strokeWidth={selectedPathId === path.id ? style.width + 2 : style.width}
                  strokeDasharray={style.dash}
                  opacity={path.kind === "sea-route" ? 0.68 : 0.62}
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

            {filteredPlaces.map((place) => {
              const discovered = state.canEdit || discoveredPlaces.has(place.id);
              const selected = selectedPlaceId === place.id;
              const showLabel = view.width < atlas.widthMiles * 0.74 || place.importance >= 0.82;
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
                  {selected ? <circle r={40} fill="none" stroke="#f0ce78" strokeWidth={4} vectorEffect="non-scaling-stroke" /> : null}
                  <circle r={21} fill="#e7ddbd" stroke="#3c3128" strokeWidth={3} vectorEffect="non-scaling-stroke" />
                  <text textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontSize={26} fill="#352820">
                    {discovered ? placeGlyph(place.kind) : "?"}
                  </text>
                  {showLabel ? (
                    <text
                      y={48}
                      textAnchor="middle"
                      fontFamily="Georgia, serif"
                      fontWeight="700"
                      fontSize={20}
                      fill="#2f281f"
                      stroke="#e8dfc5"
                      strokeWidth={4}
                      paintOrder="stroke"
                    >
                      {discovered ? place.name : "Uncharted"}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {showFog && !state.canEdit ? (
              <rect width={atlas.widthMiles} height={atlas.heightMiles} fill="#0b100d" opacity={0.87} mask={`url(#${maskId})`} pointerEvents="none" />
            ) : null}

            {!state.canEdit
              ? [...adjacentUndiscovered].map((placeId) => {
                  const place = atlas.places.find((candidate) => candidate.id === placeId);
                  return place ? (
                    <g key={`unknown:${place.id}`} transform={`translate(${place.x} ${place.y})`} pointerEvents="none">
                      <circle r={22} fill="#242018" stroke="#d4b36a" strokeWidth={3} vectorEffect="non-scaling-stroke" />
                      <text textAnchor="middle" dominantBaseline="middle" fontSize={24} fill="#f0d28b">?</text>
                    </g>
                  ) : null;
                })
              : null}

            <g
              transform={`translate(${state.exploration.partyPosition.x} ${state.exploration.partyPosition.y})`}
              pointerEvents="none"
            >
              <circle r={partyMarkerRadius * 1.55} fill="#ffe38a" opacity=".13" className="animate-pulse" />
              <circle
                r={partyMarkerRadius}
                fill="#17140e"
                stroke="#ffe085"
                strokeWidth={5}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={`M0 ${-partyMarkerRadius * 0.62} L${partyMarkerRadius * 0.52} 0 L0 ${partyMarkerRadius * 0.68} L${-partyMarkerRadius * 0.52} 0 Z`}
                fill="#ffe085"
                stroke="#573b1d"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
              <text
                y={partyMarkerRadius + partyLabelSize * 1.15}
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontWeight="800"
                fontSize={partyLabelSize}
                fill="#fff0b5"
                stroke="#17140e"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {`YOU • ${currentPlace?.name ?? "Party"}`}
              </text>
            </g>
          </svg>

          <div className="absolute left-4 top-4 rounded-xl border border-[#71573b]/70 bg-[#eadcaf]/90 p-3 text-[#3a2a20] shadow-xl">
            <div className="relative grid h-20 w-20 place-items-center">
              <div className="absolute inset-2 rounded-full border-2 border-[#5e452f]" />
              <span className="absolute top-0 font-display text-sm font-bold">N</span>
              <Compass className="h-8 w-8 text-[#6c4a2e]" />
            </div>
          </div>

          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[#b58c4d]/70 bg-[#17140e]/90 px-4 py-2 text-xs font-semibold text-[#ffe9a8] shadow-xl backdrop-blur">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5" /> You are here: {currentPlace?.name ?? "Unknown location"}
          </div>

          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button type="button" className={buttonClass} onClick={() => zoom(0.8)} aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <button type="button" className={buttonClass} onClick={() => zoom(1.25)} aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <button type="button" className={buttonClass} onClick={centerOnParty} aria-label="Center on party"><MapPin className="h-4 w-4" /></button>
            <button type="button" className={buttonClass} onClick={() => setView(fullView(atlas))} aria-label="Reset map"><RefreshCw className="h-4 w-4" /></button>
          </div>

          {showLegend ? <AtlasLegend atlas={atlas} currentPlace={currentPlace ?? null} /> : null}

          {moveMode ? (
            <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-xl border border-[#c69b52] bg-[#2c2418]/95 px-4 py-2 text-sm text-[#f8e5b5] shadow-xl">
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
              onDelete={(id) => editMutation.mutate({ type: "place.delete", id })}
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
              onDelete={(id) => editMutation.mutate({ type: "region.delete", id })}
            />
          ) : null}

          {builderMode === "path" ? (
            <PathBuilder
              atlas={atlas}
              selected={selectedPath}
              busy={editMutation.isPending}
              onCreate={(operation) => editMutation.mutate(operation)}
              onUpdate={(operation) => editMutation.mutate(operation)}
              onDelete={(id) => editMutation.mutate({ type: "path.delete", id })}
            />
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function AtlasLegend({ atlas, currentPlace }: { atlas: WorldAtlasDocument; currentPlace: AtlasPlace | null }) {
  const usedBiomes = [...new Set([...atlas.landmasses.map((landmass) => landmass.biome), ...atlas.regions.map((region) => region.biome)])];
  const usedPlaces = [...new Set(atlas.places.map((place) => place.kind))];
  const usedPaths = [...new Set(atlas.paths.map((path) => path.kind))];

  return (
    <div className="absolute bottom-4 left-4 max-h-[300px] w-[320px] overflow-y-auto rounded-xl border border-[#7b6545]/80 bg-[#15160f]/92 p-3 text-[#e8dcb7] shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#665238]/60 pb-2">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#d3ad68]">Map legend</div>
        <div className="text-[10px] text-[#9d9072]">{currentPlace?.name ?? "Party location"}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rotate-45 border border-[#ffe085] bg-[#ffe085]" /> You / party</div>
        {usedPaths.map((kind) => {
          const style = pathStyle(kind);
          return (
            <div key={kind} className="flex items-center gap-2">
              <span className="inline-block w-6 border-t-2" style={{ borderColor: style.stroke, borderTopStyle: "dashed" }} />
              {kind === "sea-route" ? "Sea route" : kind === "road" ? "Road" : "Trail"}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9f906d]">Terrain</div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
        {usedBiomes.map((biome) => (
          <div key={biome} className="flex items-center gap-2 capitalize">
            <span className="h-3 w-4 rounded-sm border border-black/20" style={{ backgroundColor: BIOME_COLORS[biome] }} />
            {biome.replaceAll("-", " ")}
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9f906d]">Places</div>
      <div className="mt-1 grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
        {usedPlaces.map((kind) => (
          <div key={kind} className="flex items-center gap-1.5">
            <span className="w-4 text-center font-serif text-[#eadcaf]">{placeGlyph(kind)}</span>
            <span className="truncate">{PLACE_LABELS[kind]}</span>
          </div>
        ))}
      </div>
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
      toast.success(value.exploration.pendingEncounter ? "Travel complete — an encounter was triggered." : "Travel complete.");
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
        <button type="button" className={`${buttonClass} w-full`} disabled={regenerateBusy} onClick={() => onRegenerate("same")}>
          <RefreshCw className={`mr-2 inline h-4 w-4 ${regenerateBusy && confirmingSame ? "animate-spin" : ""}`} />
          {regenerateBusy && confirmingSame ? "Resetting…" : confirmingSame ? "Confirm reset" : "Reset from same seed"}
        </button>
        <button type="button" className={`${primaryButtonClass} w-full`} disabled={regenerateBusy} onClick={() => onRegenerate("new")}>
          <WandSparkles className={`mr-2 inline h-4 w-4 ${regenerateBusy && confirmingNew ? "animate-pulse" : ""}`} />
          {regenerateBusy && confirmingNew ? "Regenerating…" : confirmingNew ? "Confirm regenerate" : "Regenerate new world"}
        </button>
        {regenerateMode && !regenerateBusy ? (
          <button type="button" className={`${buttonClass} w-full`} onClick={onCancelRegenerate}>Cancel</button>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#5f4d34] bg-[#201f18] p-3"><div className="text-[10px] uppercase tracking-[0.15em] text-[#95886d]">{label}</div><div className="mt-1 font-display text-xl text-[#eadcaf]">{value}</div></div>;
}

function ConfirmDeleteButton({
  label,
  warning,
  busy,
  onDelete,
}: {
  label: string;
  warning: string;
  busy: boolean;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="space-y-2">
      {confirming ? <div className="rounded-lg border border-[#7c4238] bg-[#321d19] p-2 text-xs text-[#e7aa9d]">{warning}</div> : null}
      <button
        type="button"
        className="w-full rounded-lg border border-[#7c4238] px-3 py-2 text-sm font-semibold text-[#e7aa9d] hover:bg-[#4a241f] disabled:opacity-50"
        disabled={busy}
        onClick={() => {
          if (confirming) {
            setConfirming(false);
            onDelete();
          } else {
            setConfirming(true);
          }
        }}
      >
        <Trash2 className="mr-2 inline h-4 w-4" /> {confirming ? `Confirm ${label.toLowerCase()}` : label}
      </button>
      {confirming ? <button type="button" className={`${buttonClass} w-full`} onClick={() => setConfirming(false)}>Cancel</button> : null}
    </div>
  );
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
      <ConfirmDeleteButton label="Delete place" warning="This deletes the place and every attached path." busy={busy} onDelete={() => onDelete(selected.id)} />
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
  return <div className="mt-4 space-y-3"><div><FieldLabel>Name</FieldLabel><input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} /></div><div><FieldLabel>Biome</FieldLabel><select className={`${fieldClass} mt-1`} value={biome} onChange={(event) => setBiome(event.target.value as AtlasBiome)}>{Object.keys(BIOME_COLORS).map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div><FieldLabel>Importance</FieldLabel><input className={`${fieldClass} mt-1`} type="number" min="0.1" max="1" step="0.05" value={importance} onChange={(event) => setImportance(event.target.value)} /></div><button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !name.trim()} onClick={() => onUpdate({ type: "region.update", id: selected.id, patch: { name: name.trim(), biome, importance: clamp(Number(importance) || 0.6, 0.1, 1) } })}>Save region</button><button type="button" className={`${buttonClass} w-full`} disabled={busy} onClick={() => onMove(selected.id)}><Crosshair className="mr-2 inline h-4 w-4" /> Move region center</button><ConfirmDeleteButton label="Delete region" warning="Places remain, but they become unassigned from this region." busy={busy} onDelete={() => onDelete(selected.id)} /><div className="text-xs text-[#8e8269]">Landmass: {atlas.landmasses.find((value) => value.id === selected.landmassId)?.name ?? selected.landmassId}</div></div>;
}

function PathBuilder({ atlas, selected, busy, onCreate, onUpdate, onDelete }: { atlas: WorldAtlasDocument; selected: AtlasPath | null; busy: boolean; onCreate: (operation: CampaignWorldEditOperation) => void; onUpdate: (operation: CampaignWorldEditOperation) => void; onDelete: (id: string) => void }) {
  const [fromPlaceId, setFromPlaceId] = useState(selected?.fromPlaceId ?? atlas.places[0]?.id ?? "");
  const [toPlaceId, setToPlaceId] = useState(selected?.toPlaceId ?? atlas.places[1]?.id ?? "");
  const [kind, setKind] = useState<AtlasPathKind>(selected?.kind ?? "road");
  useEffect(() => { setFromPlaceId(selected?.fromPlaceId ?? atlas.places[0]?.id ?? ""); setToPlaceId(selected?.toPlaceId ?? atlas.places[1]?.id ?? ""); setKind(selected?.kind ?? "road"); }, [atlas.places, selected]);
  const valid = Boolean(fromPlaceId && toPlaceId && fromPlaceId !== toPlaceId);
  return <div className="mt-4 space-y-3"><p className="text-sm leading-6 text-[#a99b7d]">{selected ? `Editing ${selected.id}` : "Create a road, trail, or sea route between two places."}</p><div><FieldLabel>From</FieldLabel><select className={`${fieldClass} mt-1`} value={fromPlaceId} onChange={(event) => setFromPlaceId(event.target.value)}>{atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></div><div><FieldLabel>To</FieldLabel><select className={`${fieldClass} mt-1`} value={toPlaceId} onChange={(event) => setToPlaceId(event.target.value)}>{atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></div><div><FieldLabel>Kind</FieldLabel><select className={`${fieldClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as AtlasPathKind)}><option value="road">Road</option><option value="trail">Trail</option><option value="sea-route">Sea route</option></select></div>{selected ? <><button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !valid} onClick={() => onUpdate({ type: "path.update", id: selected.id, patch: { fromPlaceId, toPlaceId, kind } })}>Save path</button><ConfirmDeleteButton label="Delete path" warning="This removes the selected travel route." busy={busy} onDelete={() => onDelete(selected.id)} /></> : <button type="button" className={`${primaryButtonClass} w-full`} disabled={busy || !valid} onClick={() => onCreate({ type: "path.create", value: { fromPlaceId, toPlaceId, kind } })}><Plus className="mr-2 inline h-4 w-4" /> Create path</button>}</div>;
}
