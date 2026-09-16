import { offlineRequestJson } from "@/infrastructure/offline";
import type { AtlasBiome, AtlasPathKind, AtlasPlaceKind, WorldAtlasDocument } from "../domain/atlas";
import type { AtlasTravelWeather } from "../domain/overlandTravel";
import type {
  AtlasExplorationState,
  AtlasInspectorReport,
  AtlasTravelPlan,
} from "../domain/worldBuilder";

export type CampaignWorldRole = "owner" | "gm" | "player" | "observer";

export interface CampaignWorldStateResponse {
  campaignId: string;
  worldId: string;
  revision: number;
  role: CampaignWorldRole;
  canEdit: boolean;
  canTravel: boolean;
  exploration: AtlasExplorationState;
  inspector: AtlasInspectorReport | null;
}

export type CampaignWorldEditOperation =
  | {
      type: "place.create";
      value: {
        name: string;
        kind: AtlasPlaceKind;
        x: number;
        y: number;
        landmassId?: string;
        regionId?: string | null;
        importance?: number;
        population?: number;
        description?: string;
        tags?: string[];
      };
    }
  | {
      type: "place.update";
      id: string;
      patch: {
        landmassId?: string;
        regionId?: string | null;
        name?: string;
        kind?: AtlasPlaceKind;
        x?: number;
        y?: number;
        importance?: number;
        population?: number;
        description?: string;
        tags?: string[];
      };
    }
  | { type: "place.delete"; id: string }
  | {
      type: "region.create";
      value: {
        name: string;
        center: { x: number; y: number };
        biome: AtlasBiome;
        landmassId?: string;
        importance?: number;
      };
    }
  | {
      type: "region.update";
      id: string;
      patch: {
        landmassId?: string;
        name?: string;
        center?: { x: number; y: number };
        biome?: AtlasBiome;
        importance?: number;
      };
    }
  | { type: "region.delete"; id: string }
  | {
      type: "path.create";
      value: {
        kind: AtlasPathKind;
        fromPlaceId: string;
        toPlaceId: string;
        points?: Array<{ x: number; y: number }>;
      };
    }
  | {
      type: "path.update";
      id: string;
      patch: {
        kind?: AtlasPathKind;
        fromPlaceId?: string;
        toPlaceId?: string;
        points?: Array<{ x: number; y: number }>;
      };
    }
  | { type: "path.delete"; id: string };

export interface CampaignWorldMutationResponse {
  revision: number;
  atlas?: WorldAtlasDocument;
  exploration?: AtlasExplorationState;
  inspector?: AtlasInspectorReport;
}

export function getCampaignWorldState(campaignId: string): Promise<CampaignWorldStateResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/state`);
}

export function editCampaignWorld(
  campaignId: string,
  revision: number,
  operation: CampaignWorldEditOperation,
): Promise<CampaignWorldMutationResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/edit`, {
    method: "POST",
    body: JSON.stringify({ revision, operation }),
  });
}

export function regenerateCampaignWorld(
  campaignId: string,
  revision: number,
  seedMode: "same" | "new" = "new",
): Promise<CampaignWorldMutationResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/regenerate`, {
    method: "POST",
    body: JSON.stringify({ revision, seedMode }),
  });
}

export function setCampaignWorldWeather(
  campaignId: string,
  revision: number,
  weather: AtlasTravelWeather,
): Promise<{ revision: number; exploration: AtlasExplorationState }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/weather`, {
    method: "POST",
    body: JSON.stringify({ revision, weather }),
  });
}

export function setCampaignPartyPosition(
  campaignId: string,
  revision: number,
  placeId: string,
): Promise<{ revision: number; exploration: AtlasExplorationState }> {
  return offlineRequestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/world/party-position`,
    {
      method: "POST",
      body: JSON.stringify({ revision, placeId }),
    },
  );
}

export function planCampaignTravel(
  campaignId: string,
  destinationPlaceId: string,
): Promise<{ revision: number; speedFeet: number; plan: AtlasTravelPlan }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/travel/plan`, {
    method: "POST",
    body: JSON.stringify({ destinationPlaceId }),
  });
}

export function commitCampaignTravel(
  campaignId: string,
  revision: number,
  destinationPlaceId: string,
): Promise<{
  revision: number;
  exploration: AtlasExplorationState;
  plan: AtlasTravelPlan;
  encounterRoll: number;
}> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/world/travel/commit`, {
    method: "POST",
    body: JSON.stringify({ revision, destinationPlaceId }),
  });
}

export function clearCampaignTravelEncounter(
  campaignId: string,
  revision: number,
): Promise<{ revision: number; exploration: AtlasExplorationState }> {
  return offlineRequestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}/world/travel/encounter/clear`,
    {
      method: "POST",
      body: JSON.stringify({ revision }),
    },
  );
}
