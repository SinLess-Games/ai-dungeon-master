import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type {
  AtlasBiome,
  AtlasPlace,
  AtlasPlaceKind,
  WorldAtlasDocument,
} from "../domain/atlas";
import type { CampaignAtlasRequest } from "../domain/campaignAtlas";
import { generateStrictRealisticCampaignWorldAtlas } from "../domain/strictRealisticCampaignAtlas";

export const HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v6-hybrid-ai";

const biomeSchema = z.enum([
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
]);

const aiPlanSchema = z.object({
  geography: z.enum(["supercontinent", "continents", "archipelago"]),
  dominantBiomes: z.array(biomeSchema).min(1).max(5),
  worldSummary: z.string().trim().min(1).max(900),
  terrainThemes: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  continentNames: z.array(z.string().trim().min(1).max(80)).max(4).default([]),
  regionNames: z.array(z.string().trim().min(1).max(80)).max(24).default([]),
  settlementNames: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  landmarkNames: z.array(z.string().trim().min(1).max(80)).max(24).default([]),
});

export type CampaignWorldAIPlan = z.infer<typeof aiPlanSchema>;

const SETTLEMENT_KINDS = new Set<AtlasPlaceKind>([
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
]);

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function modelFor(env: OpenAICompatibleEnv): string | null {
  return env.AI_GAME_MODEL?.trim() || env.AI_DEVBLOG_MODEL?.trim() || null;
}

function providerFor(env: OpenAICompatibleEnv): "workers-ai" | "openai-compatible" | "none" {
  if (env.AI) return "workers-ai";
  if (env.AI_API_KEY) return "openai-compatible";
  return "none";
}

function campaignSettingsText(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, 8_000);
  } catch {
    return "{}";
  }
}

function planningPrompt(request: CampaignAtlasRequest): string {
  return [
    `Campaign name: ${request.campaign.name}`,
    `Campaign description: ${request.campaign.description ?? "(none)"}`,
    `Campaign settings JSON: ${campaignSettingsText(request.campaign.settings)}`,
    `World seed: ${request.seed}`,
    "Return JSON only. Do not include coordinates, distances, routes, populations, or game-state mutations.",
    "Choose geography and themes that fit the campaign. Prefer realistic physical geography unless the campaign explicitly calls for surreal or planar terrain.",
    "Cities and towns must feel sparse at world scale. The procedural engine will own exact placement and validation.",
    "Provide enough names to influence the generated world, but do not force every generated entity to be renamed.",
  ].join("\n");
}

const SYSTEM_PROMPT = `You are the world-planning partner for a D&D 3.5 campaign map engine.
You do not draw the map and you do not control authoritative coordinates. Instead, produce a constrained creative brief that the deterministic atlas engine will materialize and validate.
Respect the campaign's explicit world template, genres, structure, scale, pace, and description. Avoid turning every campaign into islands. Use archipelagos only when the campaign strongly supports them.
Favor believable continents, climate patterns, terrain variety, sparse major settlements, memorable regions, and names that fit one coherent setting.
Return exactly one JSON object with these fields:
{
  "geography": "supercontinent" | "continents" | "archipelago",
  "dominantBiomes": ("temperate" | "forest" | "tundra" | "desert" | "steppe" | "swamp" | "jungle" | "highlands" | "badlands" | "enchanted")[],
  "worldSummary": string,
  "terrainThemes": string[],
  "continentNames": string[],
  "regionNames": string[],
  "settlementNames": string[],
  "landmarkNames": string[]
}`;

export async function planCampaignWorldWithAI(
  env: OpenAICompatibleEnv,
  request: CampaignAtlasRequest,
): Promise<CampaignWorldAIPlan | null> {
  if (!env.AI && !env.AI_API_KEY) return null;

  try {
    const model = modelFor(env);
    const response = await generateOpenAICompatibleText(env, {
      system: SYSTEM_PROMPT,
      prompt: planningPrompt(request),
      temperature: 0.15,
      maxTokens: 1800,
      ...(model ? { model } : {}),
    });
    return aiPlanSchema.parse(JSON.parse(extractJsonObject(response)) as unknown);
  } catch (error) {
    console.warn("AI world planning failed; using deterministic atlas engine only", {
      campaign: request.campaign.name,
      error,
    });
    return null;
  }
}

function geographyBrief(plan: CampaignWorldAIPlan): string {
  switch (plan.geography) {
    case "archipelago":
      return "archipelago island chains oceanic seafaring geography";
    case "supercontinent":
      return "single continent supercontinent inland continental geography";
    case "continents":
      return "multiple large continents continental geography";
  }
}

function augmentRequest(
  request: CampaignAtlasRequest,
  plan: CampaignWorldAIPlan,
): CampaignAtlasRequest {
  const aiBrief = [
    "AI world brief:",
    geographyBrief(plan),
    `dominant biomes ${plan.dominantBiomes.join(", ")}`,
    plan.terrainThemes.length ? `terrain themes ${plan.terrainThemes.join(", ")}` : "",
    plan.worldSummary,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    ...request,
    campaign: {
      ...request.campaign,
      description: [request.campaign.description ?? "", aiBrief].filter(Boolean).join("\n"),
    },
  };
}

function uniqueNames(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const name = value.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function renamePlaces(
  places: readonly AtlasPlace[],
  plan: CampaignWorldAIPlan,
): AtlasPlace[] {
  const settlements = uniqueNames(plan.settlementNames);
  const landmarks = uniqueNames(plan.landmarkNames);
  let settlementIndex = 0;
  let landmarkIndex = 0;

  return places.map((place) => {
    if (SETTLEMENT_KINDS.has(place.kind) && settlementIndex < settlements.length) {
      return { ...place, name: settlements[settlementIndex++]! };
    }
    if (!SETTLEMENT_KINDS.has(place.kind) && landmarkIndex < landmarks.length) {
      return { ...place, name: landmarks[landmarkIndex++]! };
    }
    return place;
  });
}

function applyAIPlan(
  atlas: WorldAtlasDocument,
  env: OpenAICompatibleEnv,
  plan: CampaignWorldAIPlan,
): WorldAtlasDocument {
  const continentNames = uniqueNames(plan.continentNames);
  const regionNames = uniqueNames(plan.regionNames);
  const biomes = plan.dominantBiomes as AtlasBiome[];

  const landmasses = atlas.landmasses.map((landmass, index) => ({
    ...landmass,
    ...(continentNames[index] ? { name: continentNames[index]! } : {}),
    biome: biomes[index % biomes.length] ?? landmass.biome,
  }));

  const regions = atlas.regions.map((region, index) => ({
    ...region,
    ...(regionNames[index] ? { name: regionNames[index]! } : {}),
    biome: biomes[(index + 1) % biomes.length] ?? region.biome,
  }));

  const metadata = {
    ...atlas.metadata,
    aiPlanning: {
      provider: providerFor(env),
      model: modelFor(env),
      plan,
    },
  };

  return {
    ...atlas,
    generatorVersion: HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    landmasses,
    regions,
    places: renamePlaces(atlas.places, plan),
    metadata,
  } as WorldAtlasDocument;
}

export function storedAIPlan(atlas: WorldAtlasDocument): CampaignWorldAIPlan | null {
  const metadata = atlas.metadata as unknown as {
    aiPlanning?: { plan?: unknown };
  };
  const parsed = aiPlanSchema.safeParse(metadata.aiPlanning?.plan);
  return parsed.success ? parsed.data : null;
}

export async function generateHybridCampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: CampaignAtlasRequest;
  existingPlan?: CampaignWorldAIPlan | null;
}): Promise<WorldAtlasDocument> {
  const plan = input.existingPlan ?? (await planCampaignWorldWithAI(input.env, input.request));
  if (!plan) return generateStrictRealisticCampaignWorldAtlas(input.request);

  const atlas = generateStrictRealisticCampaignWorldAtlas(augmentRequest(input.request, plan));
  return applyAIPlan(atlas, input.env, plan);
}
