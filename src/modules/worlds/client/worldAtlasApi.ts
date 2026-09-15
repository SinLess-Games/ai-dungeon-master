import { offlineRequestJson } from "@/infrastructure/offline";
import type { WorldAtlasDocument } from "../domain/atlas";

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

export interface AtlasSearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export function getCampaignWorldAtlas(campaignId: string): Promise<CampaignWorldAtlasResponse> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/atlas`);
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
