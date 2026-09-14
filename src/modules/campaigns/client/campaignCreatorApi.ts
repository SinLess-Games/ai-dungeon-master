import type {
  CampaignPace,
  CampaignScale,
  CampaignStructure,
  CampaignStyleId,
} from "../domain/creatorOptions";

export type CampaignVisibility = "private" | "invite_only" | "unlisted" | "public";
export type CampaignPlayMode = "solo" | "multiplayer";
export type CampaignGameMasterMode = "ai" | "human" | "hybrid";

export interface CreateCampaignInput {
  name: string;
  description?: string;
  playMode: CampaignPlayMode;
  gameMasterMode: CampaignGameMasterMode;
  visibility: CampaignVisibility;
  maxPlayers?: number | null;
  settings: {
    creatorVersion: 1;
    shortDescription: string;
    genres: CampaignStyleId[];
    pace: CampaignPace;
    scale: CampaignScale;
    structure: CampaignStructure;
  };
}

export interface CreatedCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  playMode: CampaignPlayMode;
  gameMasterMode: CampaignGameMasterMode;
  visibility: CampaignVisibility;
  settings: Record<string, unknown>;
}

interface ErrorEnvelope {
  error?: string | { message?: string };
  message?: string;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as ErrorEnvelope;
      if (typeof body.error === "string") message = body.error;
      else if (body.error?.message) message = body.error.message;
      else if (body.message) message = body.message;
    } catch {
      /* Keep the HTTP fallback. */
    }
    throw new Error(message);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function createCampaign(input: CreateCampaignInput): Promise<CreatedCampaign> {
  return requestJson<CreatedCampaign>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      timeMode: "paused",
    }),
  });
}
