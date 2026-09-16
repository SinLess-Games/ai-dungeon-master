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
] as const;
const DENSE_PATH_KINDS = ["road", "trail", "sea-route"] as const;

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

const densePlaceSchema = z.object({
  landmassId: z.string().trim().min(1),
  regionId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(100),
  kind: z.enum(DENSE_PLACE_KINDS),
  x: z.number().finite(),
  y: z.number().finite(),
  importance: z.number().min(0.1).max(1),
  population: z.number().int().nonnegative().optional(),
  description: z.string().trim().min(8).max(500),
  tags: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
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
  points: z.array(z.object({ x: z.number().finite(), y: z.number().finite() })).min(2).max(18),
});

type DensePlaceDraft = z.infer<typeof densePlaceSchema>;
type DenseLinkDraft = z.infer<typeof denseLinkSchema>;

type DenseBatch = {
  places: DensePlaceDraft[];
  links: DenseLinkDraft[];
};

type Anchor = Pick<AtlasPlace, "id" | "name" | "kind" | "x" | "y" | "landmassId" | "regionId">;

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function compactJson(value: unknown, maximum = 18_000): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, maximum);
  } catch {
    return "{}";
  }
}

function modelFor(env: OpenAICompatibleEnv): string | undefined {
  return env.AI_GAME_MODEL?.trim() || env.AI_DEVBLOG_MODEL?.trim() || undefined;
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function campaignContext(request: RichCampaignAtlasRequest): string {
  return [
    "You are expanding an already AI-authored persistent D&D 3.5 FANTASY WORLD.",
    "Every new location must come from the campaign context and existing geography. Do not use procedural naming, random filler, modern Earth institutions, or generic copy-paste settlements.",
    `CAMPAIGN: ${compactJson({
      name: request.campaign.name,
      description: request.campaign.description ?? null,
      settings: request.campaign.settings ?? {},
      context: request.campaign.context ?? {},
      seed: request.seed,
    }, 16_000)}`,
  ].join("\n");
}

function requestedLocationTarget(
  request: RichCampaignAtlasRequest,
  atlas: WorldAtlasDocument,
): number | null {
  const raw = request.campaign.context?.["minimumLocations"];
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const explicit = Math.max(300, Math.min(520, Math.round(raw)));
  const scaleTarget =
    atlas.campaignDecisions.scale === "epic"
      ? 450
      : atlas.campaignDecisions.scale === "paragon"
        ? 380
        : 320;
  return Math.max(explicit, scaleTarget);
}

function regionGroups(regions: readonly AtlasRegion[], batchCount: number): AtlasRegion[][] {
  if (!regions.length) return [];
  return Array.from({ length: batchCount }, (_, batchIndex) => {
    const assigned = regions.filter((_, regionIndex) => regionIndex % batchCount === batchIndex);
    return assigned.length ? assigned : [regions[batchIndex % regions.length]!];
  });
}

function anchorsFor(atlas: WorldAtlasDocument, regions: readonly AtlasRegion[]): Anchor[] {
  const regionIds = new Set(regions.map((region) => region.id));
  const local = atlas.places.filter((place) => place.regionId !== null && regionIds.has(place.regionId));
  if (local.length >= 10) return local.slice(0, 18);

  const center = {
    x: regions.reduce((sum, region) => sum + region.center.x, 0) / Math.max(1, regions.length),
    y: regions.reduce((sum, region) => sum + region.center.y, 0) / Math.max(1, regions.length),
  };
  const additional = atlas.places
    .filter((place) => !local.some((candidate) => candidate.id === place.id))
    .sort((left, right) => distance(left, center) - distance(right, center));
  return [...local, ...additional].slice(0, 18);
}

function batchSchema(quota: number) {
  return z.object({
    places: z.array(densePlaceSchema).length(quota),
    links: z.array(denseLinkSchema).max(Math.max(24, quota * 2)).default([]),
  });
}

function pointInBounds(point: AtlasPoint, atlas: WorldAtlasDocument): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= atlas.widthMiles && point.y <= atlas.heightMiles;
}

function endpointPlace(
  endpoint: z.infer<typeof endpointSchema>,
  value: DenseBatch,
  anchors: readonly Anchor[],
): DensePlaceDraft | Anchor | null {
  return endpoint.source === "new"
    ? value.places[endpoint.index] ?? null
    : anchors[endpoint.index] ?? null;
}

function validateBatch(
  value: DenseBatch,
  atlas: WorldAtlasDocument,
  allowedRegions: readonly AtlasRegion[],
  anchors: readonly Anchor[],
): string | null {
  const regions = new Map(allowedRegions.map((region) => [region.id, region] as const));
  const existingNames = new Set(atlas.places.map((place) => place.name.trim().toLowerCase()));
  const batchNames = new Set<string>();

  for (const [index, place] of value.places.entries()) {
    const region = regions.get(place.regionId);
    if (!region) return `place ${index} references a region outside this batch`;
    if (place.landmassId !== region.landmassId) return `place ${index} uses the wrong landmass for its region`;
    if (!pointInBounds(place, atlas)) return `place ${index} is outside the world bounds`;
    const key = place.name.trim().toLowerCase();
    if (existingNames.has(key) || batchNames.has(key)) return `place ${index} duplicates the location name ${place.name}`;
    batchNames.add(key);
  }

  for (const [index, link] of value.links.entries()) {
    const from = endpointPlace(link.from, value, anchors);
    const to = endpointPlace(link.to, value, anchors);
    if (!from || !to) return `link ${index} references a missing endpoint`;
    if (from === to) return `link ${index} connects a location to itself`;
    if (link.points.some((point) => !pointInBounds(point, atlas))) return `link ${index} leaves the world bounds`;
    if (link.kind === "sea-route" && (from.kind !== "port" || to.kind !== "port")) {
      return `sea route ${index} must connect two ports`;
    }
  }
  return null;
}

function batchPrompt(input: {
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  anchors: readonly Anchor[];
  quota: number;
  batchIndex: number;
  batchCount: number;
}): string {
  const landmassIds = new Set(input.regions.map((region) => region.landmassId));
  const landmasses = input.atlas.landmasses.filter((landmass) => landmassIds.has(landmass.id));
  const existing = input.atlas.places
    .filter((place) => landmassIds.has(place.landmassId))
    .map((place) => ({ name: place.name, kind: place.kind, x: place.x, y: place.y, regionId: place.regionId }));

  return `${campaignContext(input.request)}\n\nYou are density pass ${input.batchIndex + 1} of ${input.batchCount}. Create EXACTLY ${input.quota} NEW, DISTINCT, NAMED fantasy locations for the assigned regions.\n\nASSIGNED REGIONS (these IDs are authoritative):\n${compactJson(input.regions, 10_000)}\n\nLANDMASSES AND COASTLINES:\n${compactJson(landmasses, 12_000)}\n\nEXISTING LOCATIONS ON THESE LANDMASSES — do not duplicate them or crowd major settlements:\n${compactJson(existing, 10_000)}\n\nANCHORS. Links may reference these by array index:\n${compactJson(input.anchors, 8_000)}\n\nReturn JSON only:\n{
  "places": [{
    "landmassId": "exact supplied landmass id",
    "regionId": "exact assigned region id",
    "name": "unique fantasy proper name",
    "kind": ${JSON.stringify(DENSE_PLACE_KINDS)},
    "x": number,
    "y": number,
    "importance": 0.1..1,
    "population"?: number,
    "description": "brief campaign-specific description",
    "tags": string[]
  }],
  "links": [{
    "kind": ${JSON.stringify(DENSE_PATH_KINDS)},
    "from": {"source":"new"|"anchor","index":number},
    "to": {"source":"new"|"anchor","index":number},
    "distanceMiles": number,
    "points": [{"x":number,"y":number}]
  }]
}\n\nDENSITY RULES: distribute the ${input.quota} locations across the assigned regions instead of making one blob. Roughly 60-70% should be villages, hamlets, ruins, caves, temples, towers, mines, landmarks, dungeons, forts, castles, or other adventure-scale sites represented by the allowed kinds. Roughly 20-30% may be towns/villages/hamlets. Capitals and major cities must remain rare; normally create none because the base world already has its major settlements. Use realistic spacing and terrain logic. Put villages near arable land/water, mines in mineral terrain, forts at borders/passes, temples where culture warrants them, ruins/dungeons in believable historical or magical locations. A fantasy world should contain lost roads, shrines, monster-haunted ruins, wizard towers, sacred groves represented as landmarks, caves, keeps, and dangerous delves where appropriate to THIS campaign. Ports are allowed only when their coordinates genuinely touch the supplied coastline.\n\nLINK RULES: add useful local roads/trails from important new settlements/sites to other new places or supplied anchors. Do not connect every point; wilderness must remain. Roads/trails stay on land. Sea routes only connect actual ports and remain over water. The AI chooses every location, name, coordinate, description, and route; application code only validates references and stores your work.`;
}

async function generateBatch(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
  regions: readonly AtlasRegion[];
  anchors: readonly Anchor[];
  quota: number;
  batchIndex: number;
  batchCount: number;
}): Promise<DenseBatch> {
  const schema = batchSchema(input.quota);
  let retryNote = "";
  let lastError = "unknown validation error";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const model = modelFor(input.env);
    const response = await generateOpenAICompatibleText(input.env, {
      system:
        "You are an authoritative D&D 3.5 fantasy regional cartographer. Create dense, believable, campaign-specific locations and local travel links. Return structured JSON only.",
      prompt: `${batchPrompt(input)}${retryNote}`,
      temperature: 0.22,
      maxTokens: 8200,
      ...(model ? { model } : {}),
    });

    try {
      const parsed = schema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (!parsed.success) {
        lastError = parsed.error.issues
          .slice(0, 10)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
      } else {
        const customError = validateBatch(parsed.data, input.atlas, input.regions, input.anchors);
        if (!customError) return parsed.data;
        lastError = customError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    retryNote = `\n\nYour previous batch was invalid: ${lastError}. Return the full corrected JSON with exactly ${input.quota} places.`;
  }

  throw new Error(`AI dense-location batch ${input.batchIndex + 1} failed validation: ${lastError}`);
}

function materializeDenseBatches(
  atlas: WorldAtlasDocument,
  batches: readonly { value: DenseBatch; anchors: readonly Anchor[] }[],
): WorldAtlasDocument {
  const newPlaces: AtlasPlace[] = [];
  const newPaths: AtlasPath[] = [];
  const localIds: string[][] = [];

  for (const { value } of batches) {
    const ids = value.places.map((_, index) => `ai-dense-place-${atlas.places.length + newPlaces.length + index + 1}`);
    localIds.push(ids);
    for (const [index, place] of value.places.entries()) {
      newPlaces.push({
        id: ids[index]!,
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
    }
  }

  batches.forEach(({ value, anchors }, batchIndex) => {
    const ids = localIds[batchIndex]!;
    const resolve = (endpoint: z.infer<typeof endpointSchema>): string | null =>
      endpoint.source === "new" ? ids[endpoint.index] ?? null : anchors[endpoint.index]?.id ?? null;

    for (const link of value.links) {
      const fromPlaceId = resolve(link.from);
      const toPlaceId = resolve(link.to);
      if (!fromPlaceId || !toPlaceId || fromPlaceId === toPlaceId) continue;
      newPaths.push({
        id: `ai-dense-path-${atlas.paths.length + newPaths.length + 1}`,
        kind: link.kind,
        fromPlaceId,
        toPlaceId,
        distanceMiles: link.distanceMiles,
        points: link.points,
      });
    }
  });

  const places = [...atlas.places, ...newPlaces];
  const paths = [...atlas.paths, ...newPaths];
  const legendKinds = new Set(atlas.legend.map((entry) => entry.kind));
  const legend = [...atlas.legend];
  for (const place of newPlaces) {
    if (!legendKinds.has(place.kind)) {
      legendKinds.add(place.kind);
      legend.push({ kind: place.kind, label: LEGEND_LABELS[place.kind] });
    }
  }
  for (const path of newPaths) {
    if (!legendKinds.has(path.kind)) {
      legendKinds.add(path.kind);
      legend.push({ kind: path.kind, label: LEGEND_LABELS[path.kind] });
    }
  }

  const previousMetadata = atlas.metadata as typeof atlas.metadata & {
    aiOnlyGeneration?: Record<string, unknown>;
  };

  return {
    ...atlas,
    places,
    paths,
    legend,
    metadata: {
      ...atlas.metadata,
      aiOnlyGeneration: {
        ...(previousMetadata.aiOnlyGeneration ?? {}),
        denseLocationPass: true,
        denseLocationBatches: batches.length,
        finalLocationCount: places.length,
        finalPathCount: paths.length,
      },
    } as WorldAtlasDocument["metadata"],
  };
}

/**
 * Production density layer for the AI-only atlas.
 *
 * The base AI creates geography and the major world structure. When production
 * campaign context requests a 300+ world, regional AI calls run concurrently so
 * location density increases without one enormous slow/fragile completion.
 * No procedural content generator or fallback creates locations here.
 */
export async function generateDenseAICampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
}): Promise<WorldAtlasDocument> {
  const base = await generateAICampaignWorldAtlasV2(input);
  const target = requestedLocationTarget(input.request, base);
  if (target === null || base.places.length >= target) return base;
  if (!base.regions.length) throw new Error("AI dense-location generation requires atlas regions.");

  const missing = target - base.places.length;
  const batchCount = Math.max(1, Math.min(8, Math.ceil(missing / 50)));
  const groups = regionGroups(base.regions, batchCount);
  const baseQuota = Math.floor(missing / batchCount);
  const remainder = missing % batchCount;

  const jobs = groups.map((regions, batchIndex) => {
    const anchors = anchorsFor(base, regions);
    const quota = baseQuota + (batchIndex < remainder ? 1 : 0);
    return {
      anchors,
      promise: generateBatch({
        env: input.env,
        request: input.request,
        atlas: base,
        regions,
        anchors,
        quota,
        batchIndex,
        batchCount,
      }),
    };
  });

  const values = await Promise.all(jobs.map((job) => job.promise));
  const dense = materializeDenseBatches(
    base,
    values.map((value, index) => ({ value, anchors: jobs[index]!.anchors })),
  );
  if (dense.places.length < target) {
    throw new Error(`AI dense-location generation produced ${dense.places.length} locations; ${target} are required.`);
  }
  return dense;
}
