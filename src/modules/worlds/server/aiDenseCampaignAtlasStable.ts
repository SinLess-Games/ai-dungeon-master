import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type {
  AtlasPath,
  AtlasPathKind,
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
const DENSE_PATH_KINDS = ["road", "trail"] as const;

const LEGEND_LABELS: Record<AtlasPlaceKind | AtlasPathKind, string> = {
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
  road: "Road",
  trail: "Trail",
  "sea-route": "Sea Route",
};

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const densePlaceSchema = z.object({
  landmassId: z.string().trim().min(1),
  regionId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(100),
  kind: z.enum(DENSE_PLACE_KINDS),
  x: z.number().finite(),
  y: z.number().finite(),
  importance: z.number().min(0.1).max(1),
  population: z.number().int().nonnegative().optional(),
  description: z.string().trim().min(4).max(240),
  tags: z.array(z.string().trim().min(1).max(50)).max(6).default([]),
});
const endpointSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("new"), index: z.number().int().nonnegative() }),
  z.object({ source: z.literal("anchor"), index: z.number().int().nonnegative() }),
]);
const denseLinkSchema = z.object({
  kind: z.enum(DENSE_PATH_KINDS),
  from: endpointSchema,
  to: endpointSchema,
  distanceMiles: z.number().finite().positive(),
  points: z.array(pointSchema).min(2).max(12),
});
const shardSchema = z.object({
  places: z.array(densePlaceSchema).min(8).max(20),
  links: z.array(denseLinkSchema).max(10).default([]),
});

type DensePlaceDraft = z.infer<typeof densePlaceSchema>;
type DenseLinkDraft = z.infer<typeof denseLinkSchema>;
type DenseShard = z.infer<typeof shardSchema>;
type Anchor = Pick<AtlasPlace, "id" | "name" | "kind" | "x" | "y" | "landmassId" | "regionId">;

const SHARD_SIZE = 18;
const MAX_PARALLEL_SHARDS = 8;
const MAX_REFILL_ROUNDS = 4;

function compactJson(value: unknown, maximum = 14_000): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, maximum);
  } catch {
    return "{}";
  }
}

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function modelFor(env: OpenAICompatibleEnv): string | undefined {
  return env.AI_GAME_MODEL?.trim() || env.AI_DEVBLOG_MODEL?.trim() || undefined;
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function campaignContext(request: RichCampaignAtlasRequest): string {
  return [
    "You are expanding an AI-authored persistent D&D 3.5 FANTASY WORLD.",
    "Create campaign-specific medieval/fantasy locations. Do not create modern institutions, generic filler, or procedural-sounding names.",
    `CAMPAIGN: ${compactJson({
      name: request.campaign.name,
      description: request.campaign.description ?? null,
      settings: request.campaign.settings ?? {},
      context: request.campaign.context ?? {},
      seed: request.seed,
    }, 12_000)}`,
  ].join("\n");
}

function requestedTarget(request: RichCampaignAtlasRequest, atlas: WorldAtlasDocument): number | null {
  const requested = request.campaign.context?.["minimumLocations"];
  if (typeof requested !== "number" || !Number.isFinite(requested)) return null;
  const explicit = Math.max(300, Math.min(520, Math.round(requested)));
  const scaleTarget =
    atlas.campaignDecisions.scale === "epic"
      ? 450
      : atlas.campaignDecisions.scale === "paragon"
        ? 380
        : 320;
  return Math.max(explicit, scaleTarget);
}

function chooseRegions(atlas: WorldAtlasDocument, shardIndex: number, shardCount: number): AtlasRegion[] {
  const selected = atlas.regions.filter((_, index) => index % shardCount === shardIndex);
  if (selected.length) return selected;
  return atlas.regions.length ? [atlas.regions[shardIndex % atlas.regions.length]!] : [];
}

function anchorsFor(atlas: WorldAtlasDocument, regions: readonly AtlasRegion[]): Anchor[] {
  const regionIds = new Set(regions.map((region) => region.id));
  const local = atlas.places.filter((place) => place.regionId && regionIds.has(place.regionId));
  if (local.length >= 12) return local.slice(0, 14);
  const center = {
    x: regions.reduce((sum, region) => sum + region.center.x, 0) / Math.max(1, regions.length),
    y: regions.reduce((sum, region) => sum + region.center.y, 0) / Math.max(1, regions.length),
  };
  const nearby = atlas.places
    .filter((place) => !local.some((candidate) => candidate.id === place.id))
    .sort((left, right) => distance(left, center) - distance(right, center));
  return [...local, ...nearby].slice(0, 14);
}

function shardPrompt(input: {
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  anchors: readonly Anchor[];
  desired: number;
  shardIndex: number;
  shardCount: number;
}): string {
  const landmassIds = new Set(input.regions.map((region) => region.landmassId));
  const landmasses = input.atlas.landmasses.filter((landmass) => landmassIds.has(landmass.id));
  const existingNames = input.atlas.places
    .filter((place) => landmassIds.has(place.landmassId))
    .map((place) => place.name)
    .slice(0, 160);

  return `${campaignContext(input.request)}\n\nYou are regional density shard ${input.shardIndex + 1} of ${input.shardCount}. Create between ${Math.max(8, input.desired - 3)} and ${input.desired} DISTINCT locations. Favor villages, hamlets, ruins, caves, temples, towers, mines, landmarks, dungeons, forts and castles. Towns are uncommon. Do not create capitals, major cities, or ports in this density pass; the base world already owns those.\n\nASSIGNED REGIONS:\n${compactJson(input.regions, 8_000)}\n\nLANDMASSES:\n${compactJson(landmasses, 9_000)}\n\nEXISTING NAMES TO AVOID:\n${compactJson(existingNames, 6_000)}\n\nANCHORS FOR OPTIONAL LOCAL LINKS (reference by index):\n${compactJson(input.anchors, 6_000)}\n\nReturn JSON only:\n{
 "places":[{"landmassId":string,"regionId":string,"name":string,"kind":${JSON.stringify(DENSE_PLACE_KINDS)},"x":number,"y":number,"importance":number,"population"?:number,"description":string,"tags":string[]}],
 "links":[{"kind":${JSON.stringify(DENSE_PATH_KINDS)},"from":{"source":"new"|"anchor","index":number},"to":{"source":"new"|"anchor","index":number},"distanceMiles":number,"points":[{"x":number,"y":number}]}]
}\n\nKeep each description to one short sentence under 18 words and tags to 0-4 short values. Every location coordinate must lie inside its supplied landmass and fit its region. Spread them naturally rather than forming a grid or cluster. Roads/trails are optional; return no more than 8 useful local links and do not connect every location. Return JSON only.`;
}

async function generateShard(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  anchors: readonly Anchor[];
  desired: number;
  shardIndex: number;
  shardCount: number;
}): Promise<DenseShard> {
  let retry = "";
  let lastError = "invalid AI response";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const model = modelFor(input.env);
      const response = await generateOpenAICompatibleText(input.env, {
        system:
          "You are a D&D 3.5 fantasy regional cartographer. Produce concise structured JSON for believable fantasy locations.",
        prompt: `${shardPrompt(input)}${retry}`,
        temperature: 0.2,
        maxTokens: 5200,
        ...(model ? { model } : {}),
      });
      const parsed = shardSchema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    retry = `\n\nThe previous shard was invalid: ${lastError}. Return a shorter complete JSON response within the requested limits.`;
  }
  throw new Error(lastError);
}

function sanitizeShard(input: {
  atlas: WorldAtlasDocument;
  shard: DenseShard;
  regions: readonly AtlasRegion[];
  anchors: readonly Anchor[];
  usedNames: Set<string>;
  nextPlaceNumber: number;
  nextPathNumber: number;
}): { places: AtlasPlace[]; paths: AtlasPath[] } {
  const regionById = new Map(input.regions.map((region) => [region.id, region] as const));
  const landmassById = new Map(input.atlas.landmasses.map((landmass) => [landmass.id, landmass] as const));
  const acceptedPlaces: AtlasPlace[] = [];
  const originalIndexToId = new Map<number, string>();

  input.shard.places.forEach((place, originalIndex) => {
    const region = regionById.get(place.regionId);
    const landmass = landmassById.get(place.landmassId);
    const nameKey = place.name.trim().toLowerCase();
    if (!region || !landmass || region.landmassId !== landmass.id) return;
    if (!pointInBounds(place, input.atlas) || !pointInPolygon(place, landmass.points)) return;
    if (input.usedNames.has(nameKey)) return;
    input.usedNames.add(nameKey);
    const id = `ai-dense-place-${input.nextPlaceNumber + acceptedPlaces.length}`;
    originalIndexToId.set(originalIndex, id);
    acceptedPlaces.push({
      id,
      landmassId: place.landmassId,
      regionId: place.regionId,
      name: place.name,
      kind: place.kind,
      x: place.x,
      y: place.y,
      importance: place.importance,
      ...(place.population === undefined ? {} : { population: place.population }),
      description: place.description,
      tags: place.tags,
    });
  });

  const acceptedById = new Map(acceptedPlaces.map((place) => [place.id, place] as const));
  const anchorById = new Map(input.anchors.map((anchor) => [anchor.id, anchor] as const));
  const resolveEndpoint = (endpoint: z.infer<typeof endpointSchema>): string | null =>
    endpoint.source === "new"
      ? originalIndexToId.get(endpoint.index) ?? null
      : input.anchors[endpoint.index]?.id ?? null;

  const acceptedPaths: AtlasPath[] = [];
  for (const link of input.shard.links) {
    const fromPlaceId = resolveEndpoint(link.from);
    const toPlaceId = resolveEndpoint(link.to);
    if (!fromPlaceId || !toPlaceId || fromPlaceId === toPlaceId) continue;
    if (link.points.some((point) => !pointInBounds(point, input.atlas))) continue;
    const from = acceptedById.get(fromPlaceId) ?? anchorById.get(fromPlaceId);
    const to = acceptedById.get(toPlaceId) ?? anchorById.get(toPlaceId);
    if (!from || !to) continue;
    acceptedPaths.push({
      id: `ai-dense-path-${input.nextPathNumber + acceptedPaths.length}`,
      kind: link.kind,
      fromPlaceId,
      toPlaceId,
      distanceMiles: link.distanceMiles,
      points: link.points,
    });
  }

  return { places: acceptedPlaces, paths: acceptedPaths };
}

function mergeDense(
  atlas: WorldAtlasDocument,
  additions: readonly { places: AtlasPlace[]; paths: AtlasPath[] }[],
): WorldAtlasDocument {
  const places = [...atlas.places];
  const paths = [...atlas.paths];
  const legend = [...atlas.legend];
  const legendKinds = new Set(legend.map((entry) => entry.kind));
  for (const addition of additions) {
    places.push(...addition.places);
    paths.push(...addition.paths);
  }
  for (const place of places) {
    if (!legendKinds.has(place.kind)) {
      legendKinds.add(place.kind);
      legend.push({ kind: place.kind, label: LEGEND_LABELS[place.kind] });
    }
  }
  for (const path of paths) {
    if (!legendKinds.has(path.kind)) {
      legendKinds.add(path.kind);
      legend.push({ kind: path.kind, label: LEGEND_LABELS[path.kind] });
    }
  }
  const metadata = atlas.metadata as typeof atlas.metadata & { aiOnlyGeneration?: Record<string, unknown> };
  return {
    ...atlas,
    places,
    paths,
    legend,
    metadata: {
      ...atlas.metadata,
      aiOnlyGeneration: {
        ...(metadata.aiOnlyGeneration ?? {}),
        denseLocationPass: true,
        finalLocationCount: places.length,
        finalPathCount: paths.length,
      },
    } as WorldAtlasDocument["metadata"],
  };
}

/**
 * Fault-tolerant 300+ AI density expansion.
 *
 * Small regional completions are generated in parallel. A malformed shard does
 * not abort the world; successful shards are kept and missing density is
 * refilled in later rounds. Application code only validates/merges AI-authored
 * locations and links.
 */
export async function generateStableDenseAICampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
}): Promise<WorldAtlasDocument> {
  let atlas = await generateAICampaignWorldAtlasV2(input);
  const target = requestedTarget(input.request, atlas);
  if (target === null || atlas.places.length >= target) return atlas;
  if (!atlas.regions.length) throw new Error("AI world generation returned no regions for dense expansion.");

  const usedNames = new Set(atlas.places.map((place) => place.name.trim().toLowerCase()));
  let noProgressRounds = 0;

  for (let round = 0; round < MAX_REFILL_ROUNDS && atlas.places.length < target; round += 1) {
    const missing = target - atlas.places.length;
    const shardCount = Math.min(MAX_PARALLEL_SHARDS, Math.max(1, Math.ceil(missing / SHARD_SIZE)));
    const regionsByShard = Array.from({ length: shardCount }, (_, shardIndex) =>
      chooseRegions(atlas, shardIndex + round, shardCount),
    );
    const jobs = regionsByShard.map((regions, shardIndex) => {
      const anchors = anchorsFor(atlas, regions);
      const desired = Math.min(SHARD_SIZE, Math.max(8, missing - shardIndex * SHARD_SIZE));
      return {
        regions,
        anchors,
        promise: generateShard({
          env: input.env,
          request: input.request,
          atlas,
          regions,
          anchors,
          desired,
          shardIndex,
          shardCount,
        }),
      };
    });

    const settled = await Promise.allSettled(jobs.map((job) => job.promise));
    const additions: Array<{ places: AtlasPlace[]; paths: AtlasPath[] }> = [];
    let acceptedThisRound = 0;

    settled.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        console.warn("AI dense-location shard failed; a later refill round will replace it.", {
          round,
          shard: index,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        return;
      }
      const job = jobs[index]!;
      const accepted = sanitizeShard({
        atlas,
        shard: result.value,
        regions: job.regions,
        anchors: job.anchors,
        usedNames,
        nextPlaceNumber: atlas.places.length + acceptedThisRound + 1,
        nextPathNumber: atlas.paths.length + additions.reduce((sum, item) => sum + item.paths.length, 0) + 1,
      });
      const remaining = target - (atlas.places.length + acceptedThisRound);
      if (accepted.places.length > remaining) accepted.places.splice(remaining);
      const keptIds = new Set(accepted.places.map((place) => place.id));
      accepted.paths = accepted.paths.filter(
        (path) =>
          (!path.fromPlaceId.startsWith("ai-dense-place-") || keptIds.has(path.fromPlaceId)) &&
          (!path.toPlaceId.startsWith("ai-dense-place-") || keptIds.has(path.toPlaceId)),
      );
      acceptedThisRound += accepted.places.length;
      additions.push(accepted);
    });

    if (acceptedThisRound === 0) {
      noProgressRounds += 1;
      if (noProgressRounds >= 2) break;
    } else {
      noProgressRounds = 0;
      atlas = mergeDense(atlas, additions);
    }
  }

  if (atlas.places.length < target) {
    throw new Error(
      `AI dense-location expansion stopped at ${atlas.places.length}/${target} locations after multiple refill rounds.`,
    );
  }
  return atlas;
}
