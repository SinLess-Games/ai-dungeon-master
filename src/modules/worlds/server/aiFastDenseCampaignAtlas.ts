import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type {
  AtlasPlace,
  AtlasPlaceKind,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "../domain/atlas";
import {
  generateAICampaignWorldAtlasV2,
  type RichCampaignAtlasRequest,
} from "./aiOnlyCampaignAtlasV2";

const DENSE_PLACE_KINDS = [
  "town",
  "village",
  "hamlet",
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
] as const;

const placeSchema = z.object({
  landmassId: z.string().trim().min(1),
  regionId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(100),
  kind: z.enum(DENSE_PLACE_KINDS),
  x: z.number().finite(),
  y: z.number().finite(),
  importance: z.number().min(0.1).max(1),
  population: z.number().int().nonnegative().optional(),
  description: z.string().trim().min(4).max(180),
  tags: z.array(z.string().trim().min(1).max(50)).max(5).default([]),
});

const shardSchema = z.object({
  places: z.array(placeSchema).min(8).max(24),
});

type PlaceDraft = z.infer<typeof placeSchema>;

const TARGET_LOCATIONS = 320;
const MINIMUM_ACCEPTABLE_LOCATIONS = 300;
const SHARD_TARGET = 22;
const MAX_CONCURRENT_SHARDS = 8;
const MAX_ROUNDS = 4;
const FINAL_BACKFILL_ATTEMPTS = 3;
const FINAL_BACKFILL_CONCURRENCY = 4;

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function compactJson(value: unknown, maximum = 12_000): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, maximum);
  } catch {
    return "{}";
  }
}

function modelFor(env: OpenAICompatibleEnv): string | undefined {
  return env.AI_GAME_MODEL?.trim() || env.AI_DEVBLOG_MODEL?.trim() || undefined;
}

function pointInBounds(point: AtlasPoint, atlas: WorldAtlasDocument): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= atlas.widthMiles && point.y <= atlas.heightMiles;
}

function pointInPolygon(point: AtlasPoint, polygon: readonly AtlasPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const crosses =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function requestedTarget(request: RichCampaignAtlasRequest): number | null {
  const value = request.campaign.context?.["minimumLocations"];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(TARGET_LOCATIONS, Math.min(360, Math.round(value)));
}

function campaignContext(request: RichCampaignAtlasRequest): string {
  return compactJson(
    {
      name: request.campaign.name,
      description: request.campaign.description ?? null,
      settings: request.campaign.settings ?? {},
      context: request.campaign.context ?? {},
      seed: request.seed,
    },
    10_000,
  );
}

function regionsForShard(
  regions: readonly AtlasRegion[],
  shardIndex: number,
  shardCount: number,
): AtlasRegion[] {
  if (!regions.length) return [];
  const selected = regions.filter((_, index) => index % shardCount === shardIndex);
  return selected.length ? selected : [regions[shardIndex % regions.length]!];
}

function promptForShard(input: {
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  desired: number;
  shardIndex: number;
  shardCount: number;
  usedNames: readonly string[];
}): string {
  const landmassIds = new Set(input.regions.map((region) => region.landmassId));
  const landmasses = input.atlas.landmasses.filter((landmass) => landmassIds.has(landmass.id));
  return `You are expanding a persistent D&D 3.5 FANTASY WORLD.\n\nCAMPAIGN DATA:\n${campaignContext(input.request)}\n\nThis is fast regional density shard ${input.shardIndex + 1} of ${input.shardCount}. Create ${Math.max(10, input.desired - 3)}-${input.desired} distinct locations. Do NOT create capitals, major cities, or ports; those already exist. Favor villages, hamlets, ruins, caves, temples, towers, mines, landmarks, dungeons, forts and castles. Towns should be uncommon.\n\nASSIGNED REGIONS:\n${compactJson(input.regions, 7_000)}\n\nAUTHORITATIVE LANDMASSES/COASTLINES:\n${compactJson(landmasses, 8_000)}\n\nNAMES ALREADY USED — do not repeat:\n${compactJson(input.usedNames.slice(-180), 6_000)}\n\nReturn JSON only:\n{"places":[{"landmassId":string,"regionId":string,"name":string,"kind":${JSON.stringify(DENSE_PLACE_KINDS)},"x":number,"y":number,"importance":number,"population"?:number,"description":string,"tags":string[]}]}\n\nEvery coordinate must be inside the supplied landmass for its region. Treat each supplied region.center as a safe interior reference point. Unless a location specifically belongs near a boundary, keep its coordinates comfortably near that region center and well inside the coastline instead of guessing close to a polygon edge. Spread locations naturally through habitable corridors and wilderness rather than grids or tight clusters. Use campaign-specific fantasy naming and one short description sentence (under 14 words). Keep tags to 0-3 short values. The application will merge these with the existing major settlements and road network; do not generate routes in this pass.`;
}

async function generateShard(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  desired: number;
  shardIndex: number;
  shardCount: number;
  usedNames: readonly string[];
}): Promise<PlaceDraft[]> {
  let retry = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const model = modelFor(input.env);
      const response = await generateOpenAICompatibleText(input.env, {
        system:
          "You are a concise D&D 3.5 fantasy regional cartographer. Return only valid structured JSON.",
        prompt: `${promptForShard(input)}${retry}`,
        temperature: 0.2,
        maxTokens: 3600,
        ...(model ? { model } : {}),
      });
      const parsed = shardSchema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (parsed.success) return parsed.data.places;
      retry = `\n\nYour previous JSON was invalid. Return one shorter complete JSON object with 10-${input.desired} places.`;
    } catch {
      retry = `\n\nYour previous response could not be parsed. Return one shorter complete JSON object with 10-${input.desired} places.`;
    }
  }
  return [];
}

function sanitizePlaces(input: {
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  drafts: readonly PlaceDraft[];
  usedNames: Set<string>;
  nextNumber: number;
}): AtlasPlace[] {
  const regionById = new Map(input.regions.map((region) => [region.id, region] as const));
  const landmassById = new Map(input.atlas.landmasses.map((landmass) => [landmass.id, landmass] as const));
  const accepted: AtlasPlace[] = [];

  for (const draft of input.drafts) {
    const region = regionById.get(draft.regionId);
    const landmass = landmassById.get(draft.landmassId);
    if (!region || !landmass || region.landmassId !== landmass.id) continue;
    if (!pointInBounds(draft, input.atlas) || !pointInPolygon(draft, landmass.points)) continue;
    const nameKey = draft.name.trim().toLowerCase();
    if (input.usedNames.has(nameKey)) continue;
    input.usedNames.add(nameKey);
    accepted.push({
      id: `ai-dense-place-${input.nextNumber + accepted.length}`,
      landmassId: draft.landmassId,
      regionId: draft.regionId,
      name: draft.name,
      kind: draft.kind as AtlasPlaceKind,
      x: draft.x,
      y: draft.y,
      importance: draft.importance,
      ...(draft.population === undefined ? {} : { population: draft.population }),
      description: draft.description,
      tags: draft.tags,
    });
  }
  return accepted;
}

function withPlaces(
  atlas: WorldAtlasDocument,
  additions: readonly AtlasPlace[],
  target: number,
  rounds: number,
): WorldAtlasDocument {
  const previousMetadata = atlas.metadata as typeof atlas.metadata & {
    aiOnlyGeneration?: Record<string, unknown>;
  };
  return {
    ...atlas,
    places: [...atlas.places, ...additions],
    metadata: {
      ...atlas.metadata,
      aiOnlyGeneration: {
        ...(previousMetadata.aiOnlyGeneration ?? {}),
        fastDenseLocationPass: true,
        denseTarget: target,
        denseRounds: rounds,
        finalLocationCount: atlas.places.length + additions.length,
      },
    } as WorldAtlasDocument["metadata"],
  };
}

async function runFinalBackfill(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
  base: WorldAtlasDocument;
  additions: AtlasPlace[];
  usedNames: Set<string>;
  startingRound: number;
}): Promise<number> {
  let rounds = input.startingRound;

  for (
    let attempt = 0;
    attempt < FINAL_BACKFILL_ATTEMPTS &&
    input.base.places.length + input.additions.length < MINIMUM_ACCEPTABLE_LOCATIONS;
    attempt += 1
  ) {
    const missing = MINIMUM_ACCEPTABLE_LOCATIONS - (input.base.places.length + input.additions.length);
    const jobCount = Math.min(
      FINAL_BACKFILL_CONCURRENCY,
      Math.max(2, Math.ceil((missing * 1.8) / 14)),
    );
    const desired = Math.min(24, Math.max(14, Math.ceil(missing / jobCount) + 8));
    const nameSnapshot = [...input.usedNames];
    const jobs = Array.from({ length: jobCount }, (_, shardIndex) => {
      const regionIndex =
        (rounds * FINAL_BACKFILL_CONCURRENCY + attempt * jobCount + shardIndex) %
        input.base.regions.length;
      const region = input.base.regions[regionIndex]!;
      const regions = [region];
      return {
        regions,
        promise: generateShard({
          env: input.env,
          request: input.request,
          atlas: input.base,
          regions,
          desired,
          shardIndex,
          shardCount: jobCount,
          usedNames: nameSnapshot,
        }),
      };
    });

    const results = await Promise.allSettled(jobs.map((job) => job.promise));
    for (const [index, result] of results.entries()) {
      if (result.status !== "fulfilled") continue;
      const accepted = sanitizePlaces({
        atlas: input.base,
        regions: jobs[index]!.regions,
        drafts: result.value,
        usedNames: input.usedNames,
        nextNumber: input.base.places.length + input.additions.length + 1,
      });
      input.additions.push(...accepted);
      if (input.base.places.length + input.additions.length >= MINIMUM_ACCEPTABLE_LOCATIONS) break;
    }
    rounds += 1;
  }

  return rounds;
}

/**
 * Fast production density pass.
 *
 * The authoritative base atlas (including major transport routes) is generated
 * first. Lightweight, location-only AI shards then run in parallel. This keeps
 * 300+ campaign locations without making every shard emit a second transport
 * graph or allowing one malformed shard to abort the whole regeneration.
 */
export async function generateFastDenseAICampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
}): Promise<WorldAtlasDocument> {
  const base = await generateAICampaignWorldAtlasV2(input);
  const target = requestedTarget(input.request);
  if (target === null || base.places.length >= target) return base;
  if (!base.regions.length) return base;

  const additions: AtlasPlace[] = [];
  const usedNames = new Set(base.places.map((place) => place.name.trim().toLowerCase()));
  let rounds = 0;

  while (base.places.length + additions.length < target && rounds < MAX_ROUNDS) {
    rounds += 1;
    const missing = target - (base.places.length + additions.length);
    const shardCount = Math.min(
      MAX_CONCURRENT_SHARDS,
      Math.max(1, Math.ceil((missing * 1.2) / SHARD_TARGET)),
    );
    const desired = Math.min(24, Math.max(12, Math.ceil(missing / shardCount) + 3));
    const nameSnapshot = [...usedNames];
    const jobs = Array.from({ length: shardCount }, (_, shardIndex) => {
      const regions = regionsForShard(base.regions, shardIndex, shardCount);
      return {
        regions,
        promise: generateShard({
          env: input.env,
          request: input.request,
          atlas: base,
          regions,
          desired,
          shardIndex,
          shardCount,
          usedNames: nameSnapshot,
        }),
      };
    });

    const results = await Promise.allSettled(jobs.map((job) => job.promise));
    for (const [index, result] of results.entries()) {
      if (result.status !== "fulfilled") continue;
      const accepted = sanitizePlaces({
        atlas: base,
        regions: jobs[index]!.regions,
        drafts: result.value,
        usedNames,
        nextNumber: base.places.length + additions.length + 1,
      });
      additions.push(...accepted);
      if (base.places.length + additions.length >= target) break;
    }
  }

  if (base.places.length + additions.length < MINIMUM_ACCEPTABLE_LOCATIONS) {
    rounds = await runFinalBackfill({
      env: input.env,
      request: input.request,
      base,
      additions,
      usedNames,
      startingRound: rounds,
    });
  }

  const total = base.places.length + additions.length;
  if (total < MINIMUM_ACCEPTABLE_LOCATIONS) {
    throw new Error(
      `AI location expansion reached ${total}/${MINIMUM_ACCEPTABLE_LOCATIONS} required locations after targeted backfill. Try regeneration again.`,
    );
  }

  return withPlaces(base, additions.slice(0, Math.max(0, target - base.places.length)), target, rounds);
}
