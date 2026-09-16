import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Compass, Hammer, MapPinned, Route, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  commitCampaignTravel,
  editCampaignWorldAtlas,
  planCampaignTravel,
  revealCampaignWorldEntity,
  setCampaignWorldWeather,
  type CampaignTravelPlanResponse,
  type CampaignWorldStateResponse,
  type WorldBuilderCommand,
} from "../client/worldAtlasApi";
import type {
  AtlasBiome,
  AtlasPathKind,
  AtlasPlace,
  AtlasPlaceKind,
  AtlasPoint,
  WorldAtlasDocument,
} from "../domain/atlas";
import type { TravelWeather } from "../domain/travel";

interface Props {
  campaignId: string;
  atlas: WorldAtlasDocument;
  revision: number;
  selectedPlace: AtlasPlace | null;
  mapCenter: AtlasPoint;
  worldState: CampaignWorldStateResponse | null;
  onSelectPlace: (placeId: string | null) => void;
  onTravelPreview: (pathIds: readonly string[]) => void;
}

type Panel = "travel" | "builder" | "inspector";

const PLACE_KINDS: readonly AtlasPlaceKind[] = [
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
  "dungeon",
  "ruin",
  "temple",
  "tower",
  "mine",
  "cave",
  "landmark",
  "planar-gate",
];
const BIOMES: readonly AtlasBiome[] = [
  "temperate",
  "forest",
  "tundra",
  "desert",
  "steppe",
  "swamp",
  "jungle",
  "highlands",
  "badlands",
  "enchanted",
];
const PATH_KINDS: readonly AtlasPathKind[] = ["road", "trail", "sea-route"];
const WEATHER: readonly TravelWeather[] = [
  "clear",
  "rain",
  "snow",
  "heavy-snow",
  "sleet",
  "hail",
  "fog",
  "storm",
  "blizzard",
  "duststorm",
];

function label(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function hours(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const remaining = minutes % 1440;
  const value = `${Math.floor(remaining / 60)}h ${remaining % 60}m`;
  return days > 0 ? `${days}d ${value}` : value;
}

export function CampaignWorldControls({
  campaignId,
  atlas,
  revision,
  selectedPlace,
  mapCenter,
  worldState,
  onSelectPlace,
  onTravelPreview,
}: Props) {
  const client = useQueryClient();
  const [panel, setPanel] = useState<Panel>("travel");
  const [plan, setPlan] = useState<CampaignTravelPlanResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newPlaceName, setNewPlaceName] = useState("New Place");
  const [newPlaceKind, setNewPlaceKind] = useState<AtlasPlaceKind>("town");
  const [regionId, setRegionId] = useState(atlas.regions[0]?.id ?? "");
  const [regionName, setRegionName] = useState("");
  const [regionBiome, setRegionBiome] = useState<AtlasBiome>("temperate");
  const [pathId, setPathId] = useState(atlas.paths[0]?.id ?? "");
  const [pathKind, setPathKind] = useState<AtlasPathKind>("road");
  const [pathFrom, setPathFrom] = useState(atlas.places[0]?.id ?? "");
  const [pathTo, setPathTo] = useState(atlas.places[1]?.id ?? atlas.places[0]?.id ?? "");

  const selectedRegion = useMemo(
    () => atlas.regions.find((region) => region.id === regionId) ?? null,
    [atlas.regions, regionId],
  );
  const selectedPath = useMemo(
    () => atlas.paths.find((path) => path.id === pathId) ?? null,
    [atlas.paths, pathId],
  );

  useEffect(() => {
    if (!selectedRegion) return;
    setRegionName(selectedRegion.name);
    setRegionBiome(selectedRegion.biome);
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedPath) return;
    setPathKind(selectedPath.kind);
  }, [selectedPath]);

  useEffect(() => {
    setPlan(null);
    onTravelPreview([]);
  }, [selectedPlace?.id, onTravelPreview]);

  async function refreshAll() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "atlas"] }),
      client.invalidateQueries({ queryKey: ["campaigns", "play", campaignId, "world-state"] }),
    ]);
  }

  const edit = useMutation({
    mutationFn: (command: WorldBuilderCommand) => editCampaignWorldAtlas(campaignId, command),
    onSuccess: async (result) => {
      setMessage(`Atlas revision ${result.revision} saved.`);
      setPlan(null);
      onTravelPreview([]);
      await refreshAll();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "World edit failed."),
  });

  const travelPlan = useMutation({
    mutationFn: (placeId: string) => planCampaignTravel(campaignId, placeId),
    onSuccess: (result) => {
      setPlan(result);
      onTravelPreview(result.route.pathIds);
      setMessage(null);
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Route planning failed."),
  });

  const travel = useMutation({
    mutationFn: (placeId: string) => commitCampaignTravel(campaignId, placeId),
    onSuccess: async (result) => {
      setMessage(
        result.encounter.triggered
          ? `Travel completed to ${result.destination.name}. A travel encounter is pending for the DM.`
          : `Party arrived at ${result.destination.name}.`,
      );
      setPlan(null);
      onTravelPreview([]);
      onSelectPlace(result.destination.id);
      await refreshAll();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Travel failed."),
  });

  const weather = useMutation({
    mutationFn: (value: TravelWeather) => setCampaignWorldWeather(campaignId, value),
    onSuccess: async () => refreshAll(),
    onError: (error) => setMessage(error instanceof Error ? error.message : "Weather update failed."),
  });

  const reveal = useMutation({
    mutationFn: (placeId: string) =>
      revealCampaignWorldEntity(campaignId, { entityKind: "place", entityId: placeId }),
    onSuccess: async () => refreshAll(),
    onError: (error) => setMessage(error instanceof Error ? error.message : "Reveal failed."),
  });

  const canEdit = worldState?.canEdit ?? false;
  const currentPlace = atlas.places.find((place) => place.id === worldState?.state.currentPlaceId) ?? null;

  return (
    <div className="absolute right-16 top-4 z-20 w-[min(390px,calc(100%-5rem))] overflow-hidden rounded-xl border border-[#71583a]/80 bg-[#191813]/95 text-[#e8dcb7] shadow-2xl backdrop-blur-md">
      <div className="flex border-b border-[#71583a]/50">
        <PanelButton active={panel === "travel"} onClick={() => setPanel("travel")} icon={<Route className="h-3.5 w-3.5" />}>
          Travel
        </PanelButton>
        {canEdit ? (
          <PanelButton active={panel === "builder"} onClick={() => setPanel("builder")} icon={<Hammer className="h-3.5 w-3.5" />}>
            Builder
          </PanelButton>
        ) : null}
        <PanelButton active={panel === "inspector"} onClick={() => setPanel("inspector")} icon={<MapPinned className="h-3.5 w-3.5" />}>
          Inspect
        </PanelButton>
      </div>

      <div className="max-h-[72vh] overflow-y-auto p-4">
        {message ? (
          <div className="mb-3 rounded-lg border border-[#8d7148]/50 bg-[#2b2519] px-3 py-2 text-xs leading-5 text-[#dcca9d]">
            {message}
          </div>
        ) : null}

        {panel === "travel" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Party position" value={currentPlace?.name ?? "Unknown"} />
              <Metric label="Weather" value={label(worldState?.state.weather ?? "clear")} />
              <Metric label="World travel time" value={hours(worldState?.state.elapsedMinutes ?? 0)} />
              <Metric label="Discovered places" value={String(worldState?.discovery.placeIds.length ?? 0)} />
            </div>

            {selectedPlace ? (
              <div className="rounded-lg border border-[#6f5739]/60 bg-[#211f18] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bc9455]">Destination</p>
                <p className="mt-1 font-display text-lg">{selectedPlace.name}</p>
                {selectedPlace.id === worldState?.state.currentPlaceId ? (
                  <p className="mt-2 text-xs text-[#a89a7c]">The party is already here.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => travelPlan.mutate(selectedPlace.id)}
                    disabled={travelPlan.isPending}
                    className="mt-3 w-full rounded-lg border border-[#9a7543] bg-[#9a7543]/10 px-3 py-2 text-xs font-semibold text-[#e7cd8d] hover:bg-[#9a7543]/20 disabled:opacity-50"
                  >
                    {travelPlan.isPending ? "Planning…" : "Plan overland route"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs leading-5 text-[#a99b7d]">Select a visible or frontier map location to plan travel.</p>
            )}

            {plan ? (
              <div className="rounded-lg border border-[#8b7048]/70 bg-[#241f17] p-3 text-xs">
                <div className="flex items-center gap-2 text-[#e4cf98]">
                  <Compass className="h-4 w-4" />
                  <strong>Route ready</strong>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Metric label="Distance" value={`${plan.route.distanceMiles.toFixed(1)} mi`} />
                  <Metric label="Party speed" value={`${plan.timing.partySpeedFeet} ft`} />
                  <Metric label="Travel" value={hours(plan.timing.travelMinutes)} />
                  <Metric label="Clock elapsed" value={hours(plan.timing.elapsedClockMinutes)} />
                  <Metric label="Terrain ×" value={plan.timing.terrainMultiplier.toFixed(2)} />
                  <Metric label="Weather ×" value={plan.timing.weatherMultiplier.toFixed(2)} />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#aa9c7e]">
                  {plan.encounter.checks} wilderness encounter check{plan.encounter.checks === 1 ? "" : "s"} at {plan.encounter.threshold}% each. Encounter chance is an Endless Codex campaign policy; movement timing and terrain multipliers use D&D 3.5 rules.
                </p>
                <button
                  type="button"
                  onClick={() => selectedPlace && travel.mutate(selectedPlace.id)}
                  disabled={!selectedPlace || travel.isPending}
                  className="mt-3 w-full rounded-lg bg-[#8e6c38] px-3 py-2 text-xs font-bold text-[#fff1c6] hover:bg-[#9d7943] disabled:opacity-50"
                >
                  {travel.isPending ? "Travelling…" : "Commit party travel"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {panel === "builder" && canEdit ? (
          <div className="space-y-5">
            <BuilderSection title="Selected place">
              {selectedPlace ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input id="world-place-name" defaultValue={selectedPlace.name} className="world-input col-span-2" />
                    <select id="world-place-kind" defaultValue={selectedPlace.kind} className="world-input">
                      {PLACE_KINDS.map((kind) => <option key={kind} value={kind}>{label(kind)}</option>)}
                    </select>
                    <input id="world-place-population" type="number" min="0" defaultValue={selectedPlace.population ?? ""} placeholder="Population" className="world-input" />
                    <textarea id="world-place-description" defaultValue={selectedPlace.description} className="world-input col-span-2 min-h-20" />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <SmallButton onClick={() => {
                      const name = (document.getElementById("world-place-name") as HTMLInputElement | null)?.value.trim();
                      const kind = (document.getElementById("world-place-kind") as HTMLSelectElement | null)?.value as AtlasPlaceKind | undefined;
                      const description = (document.getElementById("world-place-description") as HTMLTextAreaElement | null)?.value.trim();
                      const populationRaw = (document.getElementById("world-place-population") as HTMLInputElement | null)?.value;
                      if (!name || !kind) return;
                      edit.mutate({
                        type: "place.update",
                        expectedRevision: revision,
                        placeId: selectedPlace.id,
                        name,
                        kind,
                        ...(description === undefined ? {} : { description }),
                        population: populationRaw ? Number(populationRaw) : null,
                      });
                    }}>Save place</SmallButton>
                    <SmallButton onClick={() => edit.mutate({ type: "place.move", expectedRevision: revision, placeId: selectedPlace.id, x: mapCenter.x, y: mapCenter.y })}>
                      Move to map center
                    </SmallButton>
                    <SmallButton onClick={() => reveal.mutate(selectedPlace.id)}>Reveal to me</SmallButton>
                    <SmallButton danger onClick={() => edit.mutate({ type: "place.delete", expectedRevision: revision, placeId: selectedPlace.id })}>
                      Delete place
                    </SmallButton>
                  </div>
                </>
              ) : <p className="text-xs text-[#9e9176]">Select a place on the map to edit it.</p>}
            </BuilderSection>

            <BuilderSection title="Create place at map center">
              <div className="grid grid-cols-2 gap-2">
                <input value={newPlaceName} onChange={(event) => setNewPlaceName(event.target.value)} className="world-input" />
                <select value={newPlaceKind} onChange={(event) => setNewPlaceKind(event.target.value as AtlasPlaceKind)} className="world-input">
                  {PLACE_KINDS.map((kind) => <option key={kind} value={kind}>{label(kind)}</option>)}
                </select>
              </div>
              <SmallButton className="mt-2 w-full" onClick={() => edit.mutate({
                type: "place.create",
                expectedRevision: revision,
                name: newPlaceName.trim() || "New Place",
                kind: newPlaceKind,
                x: mapCenter.x,
                y: mapCenter.y,
                description: "A location added by the campaign GM.",
                tags: ["gm-created"],
              })}>Create place</SmallButton>
            </BuilderSection>

            <BuilderSection title="Region editor">
              <select value={regionId} onChange={(event) => setRegionId(event.target.value)} className="world-input w-full">
                {atlas.regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
              </select>
              {selectedRegion ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input value={regionName} onChange={(event) => setRegionName(event.target.value)} className="world-input col-span-2" />
                  <select value={regionBiome} onChange={(event) => setRegionBiome(event.target.value as AtlasBiome)} className="world-input col-span-2">
                    {BIOMES.map((biome) => <option key={biome} value={biome}>{label(biome)}</option>)}
                  </select>
                  <SmallButton onClick={() => edit.mutate({ type: "region.update", expectedRevision: revision, regionId: selectedRegion.id, name: regionName.trim() || selectedRegion.name, biome: regionBiome })}>Save region</SmallButton>
                  <SmallButton onClick={() => edit.mutate({ type: "region.move", expectedRevision: revision, regionId: selectedRegion.id, x: mapCenter.x, y: mapCenter.y })}>Move to center</SmallButton>
                  <SmallButton danger className="col-span-2" onClick={() => edit.mutate({ type: "region.delete", expectedRevision: revision, regionId: selectedRegion.id })}>Delete region</SmallButton>
                </div>
              ) : null}
              <SmallButton className="mt-2 w-full" onClick={() => edit.mutate({ type: "region.create", expectedRevision: revision, name: "New Region", biome: "temperate", x: mapCenter.x, y: mapCenter.y, importance: 0.7 })}>Create region at center</SmallButton>
            </BuilderSection>

            <BuilderSection title="Path editor">
              <select value={pathId} onChange={(event) => setPathId(event.target.value)} className="world-input w-full">
                {atlas.paths.map((path) => <option key={path.id} value={path.id}>{path.id} · {label(path.kind)}</option>)}
              </select>
              {selectedPath ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select value={pathKind} onChange={(event) => setPathKind(event.target.value as AtlasPathKind)} className="world-input">
                    {PATH_KINDS.map((kind) => <option key={kind} value={kind}>{label(kind)}</option>)}
                  </select>
                  <SmallButton onClick={() => edit.mutate({ type: "path.update", expectedRevision: revision, pathId: selectedPath.id, kind: pathKind })}>Save path</SmallButton>
                  <SmallButton danger className="col-span-2" onClick={() => edit.mutate({ type: "path.delete", expectedRevision: revision, pathId: selectedPath.id })}>Delete path</SmallButton>
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select value={pathFrom} onChange={(event) => setPathFrom(event.target.value)} className="world-input">
                  {atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </select>
                <select value={pathTo} onChange={(event) => setPathTo(event.target.value)} className="world-input">
                  {atlas.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </select>
              </div>
              <SmallButton className="mt-2 w-full" onClick={() => edit.mutate({ type: "path.create", expectedRevision: revision, kind: pathKind, fromPlaceId: pathFrom, toPlaceId: pathTo })}>Create path</SmallButton>
            </BuilderSection>

            <BuilderSection title="World controls">
              <label className="text-[10px] uppercase tracking-wider text-[#ad9d7e]">Current weather</label>
              <select value={worldState?.state.weather ?? "clear"} onChange={(event) => weather.mutate(event.target.value as TravelWeather)} className="world-input mt-1 w-full">
                {WEATHER.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </select>
              <SmallButton danger className="mt-2 w-full" onClick={() => {
                if (window.confirm("Regenerate the full atlas? Manual atlas edits will be replaced.")) {
                  edit.mutate({ type: "atlas.regenerate", expectedRevision: revision });
                }
              }}>Regenerate full atlas</SmallButton>
            </BuilderSection>
          </div>
        ) : null}

        {panel === "inspector" ? (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-[#e5cd91]"><Sparkles className="h-4 w-4" /><strong>World inspector</strong></div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Atlas revision" value={String(revision)} />
              <Metric label="State revision" value={String(worldState?.state.revision ?? "—")} />
              <Metric label="Landmasses" value={String(atlas.landmasses.length)} />
              <Metric label="Regions" value={String(atlas.regions.length)} />
              <Metric label="Places" value={String(atlas.places.length)} />
              <Metric label="Paths" value={String(atlas.paths.length)} />
              <Metric label="Map center X" value={mapCenter.x.toFixed(1)} />
              <Metric label="Map center Y" value={mapCenter.y.toFixed(1)} />
              <Metric label="Discovered regions" value={String(worldState?.discovery.regionIds.length ?? 0)} />
              <Metric label="Discovered paths" value={String(worldState?.discovery.pathIds.length ?? 0)} />
            </div>
            {selectedPlace ? (
              <div className="rounded-lg border border-[#6f5739]/60 bg-[#211f18] p-3 font-mono text-[11px] leading-5 text-[#b9aa8a]">
                <div>id: {selectedPlace.id}</div>
                <div>kind: {selectedPlace.kind}</div>
                <div>region: {selectedPlace.regionId ?? "none"}</div>
                <div>x: {selectedPlace.x.toFixed(2)}</div>
                <div>y: {selectedPlace.y.toFixed(2)}</div>
                <div>importance: {selectedPlace.importance.toFixed(2)}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PanelButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold ${active ? "bg-[#8c6a38]/25 text-[#f0d79c]" : "text-[#a99a7c] hover:text-[#dfcfaa]"}`}>
      {icon}{children}
    </button>
  );
}

function Metric({ label: metricLabel, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#5e4a32]/50 bg-[#211f18] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-[0.14em] text-[#8f8168]">{metricLabel}</div>
      <div className="mt-0.5 truncate font-semibold text-[#d9c99e]">{value}</div>
    </div>
  );
}

function BuilderSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#5f4a31]/55 bg-[#211f18]/70 p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#bc9455]">{title}</h4>
      {children}
    </section>
  );
}

function SmallButton({ children, onClick, danger = false, className = "" }: { children: React.ReactNode; onClick: () => void; danger?: boolean; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${className} rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${danger ? "border-[#7f463e] bg-[#612f2a]/20 text-[#e5afa7] hover:bg-[#612f2a]/35" : "border-[#80623d] bg-[#8a6938]/10 text-[#dfc488] hover:bg-[#8a6938]/20"}`}>
      {children}
    </button>
  );
}
