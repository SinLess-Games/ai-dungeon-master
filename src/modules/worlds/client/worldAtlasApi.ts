import { offlineRequestJson } from "@/infrastructure/offline";
import type { AtlasBiome, AtlasPathKind, AtlasPlaceKind, WorldAtlasDocument } from "../domain/atlas";
import type { Dnd35TravelTiming, TravelRoutePlan, TravelWeather } from "../domain/travel";

export interface CampaignWorldAtlasAsset {
  status: "pending" | "ready";
  renderUrl: string | null;
  renderedAt: string | null;
  vectorizedAt: string | null;
}

export interface CampaignWorldAtlasResponse {
  campaignId: string;
  worldId: string;
  mapId: string;
  revision: number;
  atlas: WorldAtlasDocument;
  asset: CampaignWorldAtlasAsset;
}

export interface CampaignWorldStateResponse {
  campaignId: string;
  worldId: string;
  mapId: string;
  atlasRevision: number;
  role: "owner" | "gm" | "player" | "observer";
  canEdit: boolean;
  state: {
    campaignId: string;
    worldId: string;
    currentPlaceId: string | null;
    currentX: number;
    currentY: number;
    elapsedMinutes: number;
    weather: TravelWeather;
    weatherDay: number;
    revision: number;
  };
  discovery: {
    regionIds: string[];
    placeIds: string[];
    pathIds: string[];
  };
}

export interface CampaignTravelPlanResponse {
  route: TravelRoutePlan;
  timing: Dnd35TravelTiming;
  encounter: { checks: number; threshold: number };
  weather: TravelWeather;
  stateRevision: number;
}

export interface CampaignTravelResult extends CampaignTravelPlanResponse {
  travelId: string;
  destination: WorldAtlasDocument["places"][number];
  encounter: {
    checks: number;
    threshold: number;
    rolls: number[];
    triggered: boolean;
    status: "completed" | "encounter-pending";
  };
}

export type WorldBuilderCommand =
  | {
      type: "place.create";
      expectedRevision: number;
      name: string;
      kind: AtlasPlaceKind;
      x: number;
      y: number;
      description?: string;
      tags?: string[];
      population?: number;
    }
  | {
      type: "place.update";
      expectedRevision: number;
      placeId: string;
      name?: string;
      kind?: AtlasPlaceKind;
      description?: string;
      tags?: string[];
      population?: number | null;
    }
  | { type: "place.move"; expectedRevision: number; placeId: string; x: number; y: number }
  | { type: "place.delete"; expectedRevision: number; placeId: string }
  | {
      type: "region.create";
      expectedRevision: number;
      name: string;
      biome: AtlasBiome;
      x: number;
      y: number;
      importance?: number;
    }
  | {
      type: "region.update";
      expectedRevision: number;
      regionId: string;
      name?: string;
      biome?: AtlasBiome;
      importance?: number;
    }
  | { type: "region.move"; expectedRevision: number; regionId: string; x: number; y: number }
  | { type: "region.delete"; expectedRevision: number; regionId: string }
  | {
      type: "path.create";
      expectedRevision: number;
      kind: AtlasPathKind;
      fromPlaceId: string;
      toPlaceId: string;
    }
  | { type: "path.update"; expectedRevision: number; pathId: string; kind?: AtlasPathKind }
  | { type: "path.delete"; expectedRevision: number; pathId: string }
  | { type: "atlas.regenerate"; expectedRevision: number };

export interface AtlasSearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export function getCampaignWorldAtlas(campaignId: string): Promise<CampaignWorldAtlasResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/atlas`);
}

export function getCampaignWorldState(campaignId: string): Promise<CampaignWorldStateResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world-state`);
}

export function editCampaignWorldAtlas(
  campaignId: string,
  command: WorldBuilderCommand,
): Promise<{ atlas: WorldAtlasDocument; revision: number }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world-builder`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

export function setCampaignWorldWeather(
  campaignId: string,
  weather: TravelWeather,
): Promise<{ weather: TravelWeather }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world-state/weather`, {
    method: "POST",
    body: JSON.stringify({ weather }),
  });
}

export function revealCampaignWorldEntity(
  campaignId: string,
  input: { entityKind: "region" | "place" | "path"; entityId: string; userId?: string },
): Promise<{ revealed: boolean }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world-state/reveal`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function planCampaignTravel(
  campaignId: string,
  destinationPlaceId: string,
): Promise<CampaignTravelPlanResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/travel/plan`, {
    method: "POST",
    body: JSON.stringify({ destinationPlaceId }),
  });
}

export function commitCampaignTravel(
  campaignId: string,
  destinationPlaceId: string,
): Promise<CampaignTravelResult> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/travel`, {
    method: "POST",
    body: JSON.stringify({ destinationPlaceId }),
  });
}

export function rebuildCampaignWorldAtlasAssets(
  campaignId: string,
): Promise<{ queued: boolean; worldId: string; mapId: string; revision: number }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/atlas/assets`, {
    method: "POST",
  });
}

export function searchCampaignWorldAtlas(
  campaignId: string,
  query: string,
): Promise<{ items: AtlasSearchResult[] }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/atlas/search`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}
