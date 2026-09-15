import {
  getActiveOfflineUserId,
  offlineRequestJson,
  readCachedJson,
  removeCachedJson,
  updateCachedJson,
} from "@/infrastructure/offline";
import type { CampaignDuration } from "../domain/duration";
import type {
  CampaignDifficulty,
  CampaignPace,
  CampaignScale,
  CampaignStructure,
  CampaignStyleId,
  CharacterProgressionPolicy,
  ContentPolicy,
  DmCreativity,
  LevelingMode,
  RulesStrictness,
  WorldCreationMode,
  WorldTemplateId,
} from "../domain/creatorOptions";

export type CampaignVisibility = "private" | "invite_only" | "unlisted" | "public";
export type CampaignPlayMode = "solo" | "multiplayer";
export type CampaignGameMasterMode = "ai" | "human" | "hybrid";
export type CampaignAccessRole = "owner" | "gm" | "player" | "observer";

export interface CampaignCreatorSettings {
  creatorVersion: 2;
  duration?: CampaignDuration;
  shortDescription: string;
  genres: CampaignStyleId[];
  pace: CampaignPace;
  scale: CampaignScale;
  structure: CampaignStructure;
  world: {
    mode: WorldCreationMode;
    templateId: WorldTemplateId;
    multiPlanar: boolean;
    persistentWorld: boolean;
  };
  rules: {
    levelingMode: LevelingMode;
    characterProgression: CharacterProgressionPolicy;
    epicLevels: boolean;
  };
  players: {
    maxPlayers: number;
    requireApproval: boolean;
    allowSpectators: boolean;
    allowPvp: boolean;
  };
  dm: {
    difficulty: CampaignDifficulty;
    rulesStrictness: RulesStrictness;
    creativity: DmCreativity;
    rollNpcDice: boolean;
    showDmRolls: boolean;
    persistentNpcs: boolean;
    idlePlus: boolean;
  };
  content: {
    policy: ContentPolicy;
    allowHomebrew: boolean;
    allowThirdParty: boolean;
    houseRules: string;
  };
  ruleset: {
    id: "dnd35";
    version: "3.5";
    worldTemplateId: WorldTemplateId;
    campaignStyleIds: CampaignStyleId[];
    pace: CampaignPace;
    multiPlanar: boolean;
    epicLevels: boolean;
    levelingMode: LevelingMode;
    characterProgression: CharacterProgressionPolicy;
  };
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  playMode: CampaignPlayMode;
  gameMasterMode: CampaignGameMasterMode;
  visibility: CampaignVisibility;
  maxPlayers?: number | null;
  generationSeed?: string;
  settings: CampaignCreatorSettings;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  playMode?: CampaignPlayMode;
  gameMasterMode?: CampaignGameMasterMode;
  visibility?: CampaignVisibility;
  maxPlayers?: number | null;
  generationSeed?: string;
  settings?: CampaignCreatorSettings;
}

export interface CreatedCampaign {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  playMode: CampaignPlayMode;
  gameMasterMode: CampaignGameMasterMode;
  visibility: CampaignVisibility;
  maxPlayers: number | null;
  generationSeed: string;
  settings: Record<string, unknown>;
}

export interface CampaignListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  playMode: CampaignPlayMode;
  gameMasterMode: CampaignGameMasterMode;
  rulesetId: string;
  rulesetVersion: string;
  worldId: string | null;
  updatedAt: string | number | null;
  createdAt: string | number;
}

export interface CampaignDetailResponse {
  campaign: CreatedCampaign & {
    rulesetId: string;
    rulesetVersion: string;
    worldId: string | null;
  };
  role: CampaignAccessRole;
  characters: Array<{
    id: string;
    name: string;
    status: string;
    ownerUserId: string | null;
    rulesetId: string;
    rulesetVersion: string;
    readyAt: string | number | null;
  }>;
  world: Record<string, unknown> | null;
}

function localSlug(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || `campaign-${crypto.randomUUID().slice(0, 8)}`;
}

function asListItem(campaign: CreatedCampaign, now = Date.now()): CampaignListItem {
  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    status: campaign.status,
    playMode: campaign.playMode,
    gameMasterMode: campaign.gameMasterMode,
    rulesetId: "dnd35",
    rulesetVersion: "3.5",
    worldId: null,
    updatedAt: now,
    createdAt: now,
  };
}

async function cacheQueuedCampaign(campaign: CreatedCampaign): Promise<void> {
  const item = asListItem(campaign);
  await updateCachedJson<{ items: CampaignListItem[] }>("/api/campaigns", (current) => ({
    items: [item, ...(current?.items ?? []).filter((existing) => existing.id !== item.id)],
  }));
  await updateCachedJson<CampaignDetailResponse>(
    `/api/campaigns/${encodeURIComponent(campaign.id)}`,
    (current) =>
      current ?? {
        campaign: {
          ...campaign,
          rulesetId: "dnd35",
          rulesetVersion: "3.5",
          worldId: null,
        },
        role: "owner",
        characters: [],
        world: null,
      },
  );
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  return offlineRequestJson<T>(input, init);
}

export function createCampaign(input: CreateCampaignInput): Promise<CreatedCampaign> {
  const id = crypto.randomUUID();
  const generationSeed = input.generationSeed ?? crypto.randomUUID();
  const optimistic: CreatedCampaign = {
    id,
    ownerUserId: getActiveOfflineUserId() ?? "offline",
    name: input.name,
    slug: localSlug(input.name),
    description: input.description ?? null,
    status: "draft",
    playMode: input.playMode,
    gameMasterMode: input.gameMasterMode,
    visibility: input.visibility,
    maxPlayers: input.maxPlayers ?? null,
    generationSeed,
    settings: { ...input.settings },
  };

  return offlineRequestJson<CreatedCampaign>(
    "/api/campaigns",
    {
      method: "POST",
      body: JSON.stringify({
        id,
        ...input,
        generationSeed,
        timeMode: "paused",
      }),
    },
    {
      queueWhenOffline: true,
      resource: { kind: "campaign", id },
      optimistic,
      onQueued: cacheQueuedCampaign,
    },
  );
}

export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<CreatedCampaign> {
  const detailPath = `/api/campaigns/${encodeURIComponent(campaignId)}`;
  const optimistic = async (): Promise<CreatedCampaign> => {
    const detail = await readCachedJson<CampaignDetailResponse>(detailPath);
    if (!detail) throw new Error("Open this campaign online once before editing it offline.");
    return {
      ...detail.campaign,
      ...input,
      description:
        input.description === undefined ? detail.campaign.description : input.description,
      maxPlayers: input.maxPlayers === undefined ? detail.campaign.maxPlayers : input.maxPlayers,
      settings:
        input.settings === undefined ? detail.campaign.settings : { ...input.settings },
    };
  };

  return offlineRequestJson<CreatedCampaign>(
    detailPath,
    { method: "PATCH", body: JSON.stringify(input) },
    {
      queueWhenOffline: true,
      resource: { kind: "campaign", id: campaignId },
      optimistic,
      onQueued: async (campaign) => {
        await updateCachedJson<CampaignDetailResponse>(detailPath, (current) => ({
          ...(current ?? {
            role: "owner" as const,
            characters: [],
            world: null,
            campaign: {
              ...campaign,
              rulesetId: "dnd35",
              rulesetVersion: "3.5",
              worldId: null,
            },
          }),
          campaign: {
            ...(current?.campaign ?? {
              ...campaign,
              rulesetId: "dnd35",
              rulesetVersion: "3.5",
              worldId: null,
            }),
            ...campaign,
          },
        }));
        await updateCachedJson<{ items: CampaignListItem[] }>("/api/campaigns", (current) => ({
          items: (current?.items ?? []).map((item) =>
            item.id === campaignId
              ? {
                  ...item,
                  name: campaign.name,
                  description: campaign.description,
                  playMode: campaign.playMode,
                  gameMasterMode: campaign.gameMasterMode,
                  updatedAt: Date.now(),
                }
              : item,
          ),
        }));
      },
    },
  );
}

export async function listCampaigns(): Promise<CampaignListItem[]> {
  const response = await offlineRequestJson<{ items: CampaignListItem[] }>("/api/campaigns");
  return response.items;
}

export function getCampaign(campaignId: string): Promise<CampaignDetailResponse> {
  return offlineRequestJson<CampaignDetailResponse>(
    `/api/campaigns/${encodeURIComponent(campaignId)}`,
  );
}

export function startCampaign(campaignId: string): Promise<{
  campaignId: string;
  worldId: string;
  status: string;
}> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/start`, {
    method: "POST",
  }, {
    onlineOnlyMessage: "Reconnect before starting a campaign so world generation remains authoritative.",
  });
}

export function pauseCampaign(
  campaignId: string,
): Promise<{ campaignId: string; status: "paused" }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/play/pause`, {
    method: "POST",
  }, {
    onlineOnlyMessage: "Reconnect before changing live campaign state.",
  });
}

export function resumeCampaign(
  campaignId: string,
): Promise<{ campaignId: string; status: "active" }> {
  return offlineRequestJson(`/api/campaigns/${encodeURIComponent(campaignId)}/play/resume`, {
    method: "POST",
  }, {
    onlineOnlyMessage: "Reconnect before changing live campaign state.",
  });
}

export function deleteCampaign(
  campaignId: string,
  confirmationName: string,
): Promise<{ deleted: true; campaignId: string; name: string }> {
  const optimistic = { deleted: true as const, campaignId, name: confirmationName };
  return offlineRequestJson(
    `/api/campaigns/${encodeURIComponent(campaignId)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ confirmationName }),
    },
    {
      queueWhenOffline: true,
      resource: { kind: "campaign", id: campaignId },
      optimistic,
      onQueued: async () => {
        await updateCachedJson<{ items: CampaignListItem[] }>("/api/campaigns", (current) => ({
          items: (current?.items ?? []).filter((item) => item.id !== campaignId),
        }));
        await removeCachedJson(`/api/campaigns/${encodeURIComponent(campaignId)}`);
      },
    },
  );
}
