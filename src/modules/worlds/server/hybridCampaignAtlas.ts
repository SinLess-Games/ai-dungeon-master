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
import {
  generateStrictRealisticCampaignWorldAtlas,
  type AtlasRealismDirectives,
} from "../domain/strictRealisticCampaignAtlas";

export const HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v7-hybrid-ai-realism";

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

const biomeCorrectionSchema = z.object({
  scope: z.enum(["landmass", "region"]),
  index: z.number().int().min(0).max(255),
  biome: biomeSchema,
  reason: z.string().trim().min(1).max(220),
});

const realismAuditSchema = z.object({
  realismScore: z.number().int().min(0).max(100),
  settlementSpacingMultiplier: z.number().min(1).max(2.5),
  maxCitiesPerLandmass: z.number().int().min(1).max(8),
  maxTownsPerLandmass: z.number().int().min(1).max(16),
  maxPortsPerLandmass: z.number().int().min(0).max(6),
  maxFortificationsPerLandmass: z.number().int().min(0).max(12),
  maxVillagesPerLandmass: z.number().int().min(1).max(24),
  maxHamletsPerLandmass: z.number().int().min(0).max(24),
  routeDensity: z.enum(["sparse", "balanced", "dense"]),
  wildernessSiteTrailThreshold: z.number().min(0.5).max(0.95),
  biomeCorrections: z.array(biomeCorrectionSchema).max(32).default([]),
  findings: z.array(z.string().trim().min(1).max(260)).min(1).max(12),
});

export type CampaignWorldAIPlan = z.infer<typeof aiPlanSchema>;
export type CampaignWorldRealismAudit = z.infer<typeof realismAuditSchema>;

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
const MAJOR_SETTLEMENT_KINDS = new Set<AtlasPlaceKind>([
  "capital",
  "city",
  "town",
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

const PLANNING_SYSTEM_PROMPT = `You are the world-planning partner for a D&D 3.5 campaign map engine.
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
      system: PLANNING_SYSTEM_PROMPT,
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

function applyBiomeCorrections(
  atlas: WorldAtlasDocument,
  audit: CampaignWorldRealismAudit | null,
): Pick<WorldAtlasDocument, "landmasses" | "regions"> {
  if (!audit) return { landmasses: atlas.landmasses, regions: atlas.regions };

  const landmassCorrections = new Map(
    audit.biomeCorrections
      .filter((value) => value.scope === "landmass")
      .map((value) => [value.index, value.biome] as const),
  );
  const regionCorrections = new Map(
    audit.biomeCorrections
      .filter((value) => value.scope === "region")
      .map((value) => [value.index, value.biome] as const),
  );

  return {
    landmasses: atlas.landmasses.map((landmass, index) => ({
      ...landmass,
      biome: landmassCorrections.get(index) ?? landmass.biome,
    })),
    regions: atlas.regions.map((region, index) => ({
      ...region,
      biome: regionCorrections.get(index) ?? region.biome,
    })),
  };
}

function applyAIPlan(
  atlas: WorldAtlasDocument,
  env: OpenAICompatibleEnv,
  plan: CampaignWorldAIPlan,
  audit: CampaignWorldRealismAudit | null,
): WorldAtlasDocument {
  const continentNames = uniqueNames(plan.continentNames);
  const regionNames = uniqueNames(plan.regionNames);
  const biomes = plan.dominantBiomes as AtlasBiome[];

  const themedLandmasses = atlas.landmasses.map((landmass, index) => ({
    ...landmass,
    ...(continentNames[index] ? { name: continentNames[index]! } : {}),
    biome: biomes[index % biomes.length] ?? landmass.biome,
  }));
  const themedRegions = atlas.regions.map((region, index) => ({
    ...region,
    ...(regionNames[index] ? { name: regionNames[index]! } : {}),
  }));
  const corrected = applyBiomeCorrections(
    { ...atlas, landmasses: themedLandmasses, regions: themedRegions },
    audit,
  );

  const metadata = {
    ...atlas.metadata,
    aiPlanning: {
      provider: providerFor(env),
      model: modelFor(env),
      plan,
      realismAudit: audit,
    },
  };

  return {
    ...atlas,
    generatorVersion: HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    landmasses: corrected.landmasses,
    regions: corrected.regions,
    places: renamePlaces(atlas.places, plan),
    metadata,
  } as WorldAtlasDocument;
}

function countPlaceKinds(places: readonly AtlasPlace[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const place of places) counts[place.kind] = (counts[place.kind] ?? 0) + 1;
  return counts;
}

function averageNearestMajorDistance(places: readonly AtlasPlace[]): number | null {
  const major = places.filter((place) => MAJOR_SETTLEMENT_KINDS.has(place.kind));
  if (major.length < 2) return null;
  const values = major.map((place) => {
    let nearest = Number.POSITIVE_INFINITY;
    for (const other of major) {
      if (other.id === place.id) continue;
      nearest = Math.min(nearest, Math.hypot(place.x - other.x, place.y - other.y));
    }
    return nearest;
  });
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function latitudeBand(y: number, height: number): string {
  const ratio = y / Math.max(1, height);
  if (ratio < 0.18) return "far-north";
  if (ratio < 0.38) return "northern-midlatitudes";
  if (ratio < 0.62) return "equatorial-midband";
  if (ratio < 0.82) return "southern-midlatitudes";
  return "far-south";
}

function auditWorldSummary(atlas: WorldAtlasDocument): string {
  const landmasses = atlas.landmasses.map((landmass, index) => {
    const places = atlas.places.filter((place) => place.landmassId === landmass.id);
    const regions = atlas.regions.filter((region) => region.landmassId === landmass.id);
    return {
      index,
      biome: landmass.biome,
      approximateWidthMiles: Math.round(landmass.radiusX * 2),
      approximateHeightMiles: Math.round(landmass.radiusY * 2),
      regionCount: regions.length,
      settlementAndSiteCounts: countPlaceKinds(places),
      riverCount: atlas.rivers.filter((river) => river.landmassId === landmass.id).length,
      mountainRangeCount: atlas.mountainRanges.filter((range) => range.landmassId === landmass.id).length,
      averageNearestMajorSettlementMiles: averageNearestMajorDistance(places),
    };
  });
  const regions = atlas.regions.map((region, index) => ({
    index,
    landmassIndex: atlas.landmasses.findIndex((landmass) => landmass.id === region.landmassId),
    biome: region.biome,
    latitudeBand: latitudeBand(region.center.y, atlas.heightMiles),
  }));
  const paths = {
    road: atlas.paths.filter((path) => path.kind === "road").length,
    trail: atlas.paths.filter((path) => path.kind === "trail").length,
    seaRoute: atlas.paths.filter((path) => path.kind === "sea-route").length,
  };

  return JSON.stringify({
    world: {
      widthMiles: atlas.widthMiles,
      heightMiles: atlas.heightMiles,
      landmassCount: atlas.landmasses.length,
      placeCount: atlas.places.length,
      regionCount: atlas.regions.length,
      riverCount: atlas.rivers.length,
      mountainRangeCount: atlas.mountainRanges.length,
      paths,
    },
    landmasses,
    regions,
  });
}

const REALISM_SYSTEM_PROMPT = `You are a realism auditor for a procedural D&D 3.5 world-map engine.
The engine owns all authoritative coordinates and topology. You may not return coordinates, move entities directly, invent paths, or mutate game state.
Your job is to review the generated world's aggregate structure and make it geographically and culturally believable at world scale while respecting explicit fantasy/magical campaign premises.
Evaluate:
- major cities should be rare and widely separated; towns should form a hierarchy rather than dot the map uniformly;
- ports should be limited by maritime importance, not appear everywhere;
- roads should be sparse long-distance trunks with trails serving smaller settlements and sites;
- climates should transition plausibly with latitude, terrain intent, and neighboring biome families;
- wilderness should remain genuinely empty between population centers;
- mountain ranges and rivers should support settlement patterns rather than every settlement being equally attractive;
- the result should feel like a lived-in world, not a graph or board game.
Return JSON only with exactly these fields:
{
  "realismScore": integer 0-100,
  "settlementSpacingMultiplier": number 1.0-2.5,
  "maxCitiesPerLandmass": integer 1-8,
  "maxTownsPerLandmass": integer 1-16,
  "maxPortsPerLandmass": integer 0-6,
  "maxFortificationsPerLandmass": integer 0-12,
  "maxVillagesPerLandmass": integer 1-24,
  "maxHamletsPerLandmass": integer 0-24,
  "routeDensity": "sparse" | "balanced" | "dense",
  "wildernessSiteTrailThreshold": number 0.5-0.95,
  "biomeCorrections": [{"scope":"landmass"|"region","index":integer,"biome":"temperate"|"forest"|"tundra"|"desert"|"steppe"|"swamp"|"jungle"|"highlands"|"badlands"|"enchanted","reason":string}],
  "findings": string[]
}`;

export async function auditCampaignWorldRealismWithAI(input: {
  env: OpenAICompatibleEnv;
  request: CampaignAtlasRequest;
  plan: CampaignWorldAIPlan;
  atlas: WorldAtlasDocument;
}): Promise<CampaignWorldRealismAudit | null> {
  if (!input.env.AI && !input.env.AI_API_KEY) return null;
  try {
    const model = modelFor(input.env);
    const response = await generateOpenAICompatibleText(input.env, {
      system: REALISM_SYSTEM_PROMPT,
      prompt: [
        `Campaign: ${input.request.campaign.name}`,
        `Campaign description: ${input.request.campaign.description ?? "(none)"}`,
        `AI world plan: ${JSON.stringify(input.plan)}`,
        `Generated world structural report: ${auditWorldSummary(input.atlas)}`,
        "Audit this specific generated result. Be conservative: preserve intentional fantasy, but tighten anything that makes the world look artificially dense, random, or geographically incoherent.",
      ].join("\n"),
      temperature: 0,
      maxTokens: 1800,
      ...(model ? { model } : {}),
    });
    return realismAuditSchema.parse(JSON.parse(extractJsonObject(response)) as unknown);
  } catch (error) {
    console.warn("AI world realism audit failed; keeping deterministic realism defaults", {
      campaign: input.request.campaign.name,
      error,
    });
    return null;
  }
}

function directivesFromAudit(audit: CampaignWorldRealismAudit): AtlasRealismDirectives {
  return {
    settlementSpacingMultiplier: audit.settlementSpacingMultiplier,
    maxCitiesPerLandmass: audit.maxCitiesPerLandmass,
    maxTownsPerLandmass: audit.maxTownsPerLandmass,
    maxPortsPerLandmass: audit.maxPortsPerLandmass,
    maxFortificationsPerLandmass: audit.maxFortificationsPerLandmass,
    maxVillagesPerLandmass: audit.maxVillagesPerLandmass,
    maxHamletsPerLandmass: audit.maxHamletsPerLandmass,
    routeDensity: audit.routeDensity,
    wildernessSiteTrailThreshold: audit.wildernessSiteTrailThreshold,
  };
}

export function storedAIPlan(atlas: WorldAtlasDocument): CampaignWorldAIPlan | null {
  const metadata = atlas.metadata as unknown as {
    aiPlanning?: { plan?: unknown };
  };
  const parsed = aiPlanSchema.safeParse(metadata.aiPlanning?.plan);
  return parsed.success ? parsed.data : null;
}

export function storedAIRealismAudit(atlas: WorldAtlasDocument): CampaignWorldRealismAudit | null {
  const metadata = atlas.metadata as unknown as {
    aiPlanning?: { realismAudit?: unknown };
  };
  const parsed = realismAuditSchema.safeParse(metadata.aiPlanning?.realismAudit);
  return parsed.success ? parsed.data : null;
}

export async function generateHybridCampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: CampaignAtlasRequest;
  existingPlan?: CampaignWorldAIPlan | null;
  existingAudit?: CampaignWorldRealismAudit | null;
}): Promise<WorldAtlasDocument> {
  const plan = input.existingPlan ?? (await planCampaignWorldWithAI(input.env, input.request));
  if (!plan) return generateStrictRealisticCampaignWorldAtlas(input.request);

  const augmentedRequest = augmentRequest(input.request, plan);
  const draft = generateStrictRealisticCampaignWorldAtlas(augmentedRequest);
  const themedDraft = applyAIPlan(draft, input.env, plan, null);
  const audit =
    input.existingAudit ??
    (await auditCampaignWorldRealismWithAI({
      env: input.env,
      request: input.request,
      plan,
      atlas: themedDraft,
    }));

  const finalAtlas = audit
    ? generateStrictRealisticCampaignWorldAtlas(augmentedRequest, directivesFromAudit(audit))
    : draft;
  return applyAIPlan(finalAtlas, input.env, plan, audit);
}
