import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import {
  WORLD_ATLAS_VERSION,
  type AtlasBiome,
  type AtlasLegendEntry,
  type AtlasPathKind,
  type AtlasPlaceKind,
  type WorldAtlasDocument,
} from "../domain/atlas";
import type { CampaignAtlasRequest } from "../domain/campaignAtlas";

export const AI_ONLY_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v10-ai-fantasy";

export type RichCampaignAtlasRequest = Omit<CampaignAtlasRequest, "campaign"> & {
  campaign: CampaignAtlasRequest["campaign"] & {
    context?: Record<string, unknown>;
  };
};

const BIOMES = [
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
] as const;
const PLACE_KINDS = [
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
const PATH_KINDS = ["road", "trail", "sea-route"] as const;

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const biomeSchema = z.enum(BIOMES);
const geometrySchema = z.object({
  widthMiles: z.number().finite().min(3000).max(18000),
  heightMiles: z.number().finite().min(2500).max(12000),
  landmasses: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        points: z.array(pointSchema).min(14).max(48),
        center: pointSchema,
        radiusX: z.number().finite().positive(),
        radiusY: z.number().finite().positive(),
        biome: biomeSchema,
      }),
    )
    .min(1)
    .max(6),
  regions: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(100),
        center: pointSchema,
        biome: biomeSchema,
        importance: z.number().min(0.1).max(1),
      }),
    )
    .min(4)
    .max(32),
  mountainRanges: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(100),
        points: z.array(pointSchema).min(2).max(18),
      }),
    )
    .max(14),
  rivers: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(100),
        points: z.array(pointSchema).min(3).max(20),
      }),
    )
    .max(22),
});

const placeSchema = z.object({
  landmassIndex: z.number().int().nonnegative(),
  regionIndex: z.number().int().nonnegative().nullable(),
  name: z.string().trim().min(1).max(100),
  kind: z.enum(PLACE_KINDS),
  x: z.number().finite(),
  y: z.number().finite(),
  importance: z.number().min(0.1).max(1),
  population: z.number().int().nonnegative().optional(),
  description: z.string().trim().min(1).max(1000),
  tags: z.array(z.string().trim().min(1).max(80)).max(16).default([]),
});
const pathSchema = z.object({
  kind: z.enum(PATH_KINDS),
  fromPlaceIndex: z.number().int().nonnegative(),
  toPlaceIndex: z.number().int().nonnegative(),
  distanceMiles: z.number().finite().positive(),
  points: z.array(pointSchema).min(2).max(24),
});
const inhabitedSchema = z.object({
  places: z.array(placeSchema).min(12).max(60),
  paths: z.array(pathSchema).max(80),
});

const finalCorrectionsSchema = z.object({
  findings: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
  landmassCorrections: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        points: z.array(pointSchema).min(14).max(48),
        center: pointSchema,
        radiusX: z.number().finite().positive(),
        radiusY: z.number().finite().positive(),
      }),
    )
    .max(6)
    .default([]),
  regionCorrections: z
    .array(
      z.object({
        regionIndex: z.number().int().nonnegative(),
        center: pointSchema.optional(),
        biome: biomeSchema.optional(),
      }),
    )
    .max(32)
    .default([]),
  placeCorrections: z
    .array(
      z.object({
        placeIndex: z.number().int().nonnegative(),
        x: z.number().finite().optional(),
        y: z.number().finite().optional(),
        regionIndex: z.number().int().nonnegative().nullable().optional(),
      }),
    )
    .max(60)
    .default([]),
  pathCorrections: z
    .array(
      z.object({
        pathIndex: z.number().int().nonnegative(),
        distanceMiles: z.number().finite().positive().optional(),
        points: z.array(pointSchema).min(2).max(24).optional(),
      }),
    )
    .max(80)
    .default([]),
});

type GeometryDraft = z.infer<typeof geometrySchema>;
type InhabitedDraft = z.infer<typeof inhabitedSchema>;
type FinalCorrections = z.infer<typeof finalCorrectionsSchema>;

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

function compactJson(value: unknown, maximum = 18_000): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, maximum);
  } catch {
    return "{}";
  }
}

function campaignContext(request: RichCampaignAtlasRequest): string {
  const completeCampaign = {
    name: request.campaign.name,
    description: request.campaign.description ?? null,
    settings: request.campaign.settings ?? {},
    ...(request.campaign.context ? { context: request.campaign.context } : {}),
    generationReference: request.seed,
  };
  return [
    "SETTING REQUIREMENT: You are building a persistent FANTASY WORLD for a Dungeons & Dragons 3.5 campaign.",
    "The satellite renderer will make the world look photographically real from orbit, but the underlying world must remain unmistakably fantasy and must express the campaign's genres, magic, tone, rules, structure, scale, pace, DM settings, content settings, and world template.",
    "Use mundane Earthlike physical laws as the realism baseline unless the supplied campaign explicitly calls for magical, planar, enchanted, cursed, or otherwise supernatural geography.",
    `COMPLETE CAMPAIGN DATA: ${compactJson(completeCampaign)}`,
  ].join("\n");
}

async function structured<T>(input: {
  env: OpenAICompatibleEnv;
  label: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens: number;
  validate?: (value: T) => string | null;
}): Promise<T> {
  if (!input.env.AI && !input.env.AI_API_KEY) {
    throw new Error("AI-only fantasy world generation requires an AI provider.");
  }
  let retryNote = "";
  let lastError = "unknown validation error";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const model = modelFor(input.env);
    const response = await generateOpenAICompatibleText(input.env, {
      system: input.system,
      prompt: `${input.prompt}${retryNote}`,
      temperature: 0.18,
      maxTokens: input.maxTokens,
      ...(model ? { model } : {}),
    });
    try {
      const parsed = input.schema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (!parsed.success) {
        lastError = parsed.error.issues
          .slice(0, 8)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
      } else {
        const customError = input.validate?.(parsed.data) ?? null;
        if (!customError) return parsed.data;
        lastError = customError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    retryNote = `\n\nYour previous ${input.label} JSON was invalid: ${lastError}. Correct it and return JSON only.`;
  }
  throw new Error(`AI ${input.label} failed validation after retry: ${lastError}`);
}

function pointInBounds(point: { x: number; y: number }, geometry: GeometryDraft): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= geometry.widthMiles && point.y <= geometry.heightMiles;
}

function validateGeometry(geometry: GeometryDraft): string | null {
  for (const [index, landmass] of geometry.landmasses.entries()) {
    if (!pointInBounds(landmass.center, geometry)) return `landmass ${index} center is outside the world bounds`;
    if (landmass.points.some((point) => !pointInBounds(point, geometry))) return `landmass ${index} coastline leaves the world bounds`;
  }
  for (const [index, region] of geometry.regions.entries()) {
    if (region.landmassIndex >= geometry.landmasses.length) return `region ${index} references a missing landmass`;
    if (!pointInBounds(region.center, geometry)) return `region ${index} center is outside the world bounds`;
  }
  for (const [index, range] of geometry.mountainRanges.entries()) {
    if (range.landmassIndex >= geometry.landmasses.length) return `mountain range ${index} references a missing landmass`;
    if (range.points.some((point) => !pointInBounds(point, geometry))) return `mountain range ${index} leaves the world bounds`;
  }
  for (const [index, river] of geometry.rivers.entries()) {
    if (river.landmassIndex >= geometry.landmasses.length) return `river ${index} references a missing landmass`;
    if (river.points.some((point) => !pointInBounds(point, geometry))) return `river ${index} leaves the world bounds`;
  }
  return null;
}

function validateInhabited(value: InhabitedDraft, geometry: GeometryDraft): string | null {
  if (!value.places.some((place) => ["capital", "city", "town"].includes(place.kind))) {
    return "the world must contain at least one capital, city, or town";
  }
  for (const [index, place] of value.places.entries()) {
    if (place.landmassIndex >= geometry.landmasses.length) return `place ${index} references a missing landmass`;
    if (place.regionIndex !== null && place.regionIndex >= geometry.regions.length) return `place ${index} references a missing region`;
    if (!pointInBounds(place, geometry)) return `place ${index} is outside the world bounds`;
  }
  for (const [index, path] of value.paths.entries()) {
    if (path.fromPlaceIndex >= value.places.length || path.toPlaceIndex >= value.places.length) {
      return `path ${index} references a missing place`;
    }
    if (path.fromPlaceIndex === path.toPlaceIndex) return `path ${index} connects a place to itself`;
    if (path.points.some((point) => !pointInBounds(point, geometry))) return `path ${index} leaves the world bounds`;
    if (path.kind === "sea-route") {
      const from = value.places[path.fromPlaceIndex]!;
      const to = value.places[path.toPlaceIndex]!;
      if (from.kind !== "port" || to.kind !== "port") return `sea route ${index} must connect two ports`;
    }
  }
  return null;
}

function geometryPrompt(request: RichCampaignAtlasRequest): string {
  return `${campaignContext(request)}\n\nCreate the complete physical geography as JSON:\n{
  "widthMiles": number,
  "heightMiles": number,
  "landmasses": [{"name":string,"points":[{"x":number,"y":number}],"center":{"x":number,"y":number},"radiusX":number,"radiusY":number,"biome":${JSON.stringify(BIOMES)}}],
  "regions": [{"landmassIndex":number,"name":string,"center":{"x":number,"y":number},"biome":${JSON.stringify(BIOMES)},"importance":0.1..1}],
  "mountainRanges": [{"landmassIndex":number,"name":string,"points":[{"x":number,"y":number}]}],
  "rivers": [{"landmassIndex":number,"name":string,"points":[{"x":number,"y":number}]}]
}\n\nYOU are the fantasy-world cartographer. Do not defer geography to code. For ordinary campaigns prefer one dominant continent and at most one or two substantial secondary continents; do not default to island clusters. Use irregular continental coastlines, peninsulas, bays, inland seas, long mountain belts, river basins, rain shadows, forests, plains, deserts, wetlands, and climate bands that make physical sense. When campaign data calls for enchanted forests, magical wastelands, planar scars, impossible mountains, cursed seas, floating-land lore, or other fantasy geography, integrate it coherently rather than making the world mundane. Keep every coordinate inside the world dimensions. Return JSON only.`;
}

function inhabitedPrompt(request: RichCampaignAtlasRequest, geometry: GeometryDraft): string {
  return `${campaignContext(request)}\n\nAUTHORITATIVE AI GEOGRAPHY:\n${compactJson(geometry, 30_000)}\n\nCreate the complete inhabited fantasy world AND transportation network in one JSON response:\n{
  "places": [{"landmassIndex":number,"regionIndex":number|null,"name":string,"kind":${JSON.stringify(PLACE_KINDS)},"x":number,"y":number,"importance":0.1..1,"population"?:number,"description":string,"tags":string[]}],
  "paths": [{"kind":${JSON.stringify(PATH_KINDS)},"fromPlaceIndex":number,"toPlaceIndex":number,"distanceMiles":number,"points":[{"x":number,"y":number}]}]
}\n\nThis is D&D 3.5 fantasy, not modern Earth. Settlements should reflect the campaign's cultures, magic, dangers, politics, exploration structure, and intended scale. Major cities should usually be hundreds of miles apart on a world-scale map; towns and villages should cluster only where geography/economy supports them. Put settlements near rivers, harbors, passes, fertile plains, mines, sacred sites, old roads, magical resources, or defensive terrain as appropriate. Ports MUST be directly on coastlines. Adventure locations should feel intentionally placed in believable wilderness. Roads and trails stay on land and follow valleys, passes, rivers, borders, and settlement hierarchy. Sea routes connect ports only and every intermediate point must stay over water. Keep the route network sparse enough to preserve wilderness. Choose all coordinates yourself. Return JSON only.`;
}

function finalReviewPrompt(
  request: RichCampaignAtlasRequest,
  geometry: GeometryDraft,
  inhabited: InhabitedDraft,
): string {
  return `${campaignContext(request)}\n\nYou are the FINAL senior fantasy cartographer. The map is saved immediately after your corrections. Inspect the complete AI-authored world for realism AND fantasy coherence. Fix continent scale, inland ports, sea routes crossing land, clustered cities, implausible river drainage, weak mountain placement, bland/non-fantasy worldbuilding, and transport networks that are too dense.\n\nGEOGRAPHY:\n${compactJson(geometry, 28_000)}\n\nINHABITED WORLD:\n${compactJson(inhabited, 28_000)}\n\nReturn JSON only:\n{
 "findings": string[],
 "landmassCorrections": [{"landmassIndex":number,"points":[{"x":number,"y":number}],"center":{"x":number,"y":number},"radiusX":number,"radiusY":number}],
 "regionCorrections": [{"regionIndex":number,"center"?:{"x":number,"y":number},"biome"?:${JSON.stringify(BIOMES)}}],
 "placeCorrections": [{"placeIndex":number,"x"?:number,"y"?:number,"regionIndex"?:number|null}],
 "pathCorrections": [{"pathIndex":number,"distanceMiles"?:number,"points"?:[{"x":number,"y":number}]}]
}\nOnly return corrections that materially improve the final world. Preserve the campaign's fantasy identity. Return JSON only.`;
}

function applyFinalCorrections(
  geometry: GeometryDraft,
  inhabited: InhabitedDraft,
  corrections: FinalCorrections,
): { geometry: GeometryDraft; inhabited: InhabitedDraft } {
  const correctedGeometry: GeometryDraft = {
    ...geometry,
    landmasses: geometry.landmasses.map((landmass, index) => {
      const correction = corrections.landmassCorrections.find((value) => value.landmassIndex === index);
      return correction
        ? { ...landmass, points: correction.points, center: correction.center, radiusX: correction.radiusX, radiusY: correction.radiusY }
        : landmass;
    }),
    regions: geometry.regions.map((region, index) => {
      const correction = corrections.regionCorrections.find((value) => value.regionIndex === index);
      return correction
        ? {
            ...region,
            ...(correction.center ? { center: correction.center } : {}),
            ...(correction.biome ? { biome: correction.biome } : {}),
          }
        : region;
    }),
  };
  const correctedInhabited: InhabitedDraft = {
    places: inhabited.places.map((place, index) => {
      const correction = corrections.placeCorrections.find((value) => value.placeIndex === index);
      return correction
        ? {
            ...place,
            ...(correction.x === undefined ? {} : { x: correction.x }),
            ...(correction.y === undefined ? {} : { y: correction.y }),
            ...(correction.regionIndex === undefined ? {} : { regionIndex: correction.regionIndex }),
          }
        : place;
    }),
    paths: inhabited.paths.map((path, index) => {
      const correction = corrections.pathCorrections.find((value) => value.pathIndex === index);
      return correction
        ? {
            ...path,
            ...(correction.distanceMiles === undefined ? {} : { distanceMiles: correction.distanceMiles }),
            ...(correction.points ? { points: correction.points } : {}),
          }
        : path;
    }),
  };
  return { geometry: correctedGeometry, inhabited: correctedInhabited };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function campaignDecisions(request: RichCampaignAtlasRequest): WorldAtlasDocument["campaignDecisions"] {
  const settings = asRecord(request.campaign.settings);
  const world = asRecord(settings["world"]);
  const ruleset = asRecord(settings["ruleset"]);
  const rules = asRecord(settings["rules"]);
  const styleIds = Array.isArray(settings["genres"])
    ? settings["genres"].filter((value): value is string => typeof value === "string")
    : Array.isArray(ruleset["campaignStyleIds"])
      ? ruleset["campaignStyleIds"].filter((value): value is string => typeof value === "string")
      : [];
  return {
    templateId:
      typeof world["templateId"] === "string"
        ? world["templateId"]
        : typeof ruleset["worldTemplateId"] === "string"
          ? ruleset["worldTemplateId"]
          : null,
    styleIds,
    structure: typeof settings["structure"] === "string" ? settings["structure"] : null,
    scale: typeof settings["scale"] === "string" ? settings["scale"] : null,
    pace:
      typeof settings["pace"] === "string"
        ? settings["pace"]
        : typeof ruleset["pace"] === "string"
          ? ruleset["pace"]
          : null,
    multiPlanar: world["multiPlanar"] === true || ruleset["multiPlanar"] === true,
    epic: rules["epicLevels"] === true || ruleset["epicLevels"] === true,
  };
}

function makeLegend(inhabited: InhabitedDraft): AtlasLegendEntry[] {
  const used = new Set<AtlasPlaceKind | AtlasPathKind>();
  for (const place of inhabited.places) used.add(place.kind);
  for (const path of inhabited.paths) used.add(path.kind);
  return [...used].map((kind) => ({ kind, label: LEGEND_LABELS[kind] }));
}

function materialize(
  request: RichCampaignAtlasRequest,
  geometry: GeometryDraft,
  inhabited: InhabitedDraft,
  findings: readonly string[],
): WorldAtlasDocument {
  const landmasses = geometry.landmasses.map((landmass, index) => ({
    ...landmass,
    id: `ai-landmass-${index + 1}`,
  }));
  const regions = geometry.regions.map((region, index) => ({
    id: `ai-region-${index + 1}`,
    landmassId: landmasses[region.landmassIndex]!.id,
    name: region.name,
    center: region.center,
    biome: region.biome as AtlasBiome,
    importance: region.importance,
  }));
  const places = inhabited.places.map((place, index) => ({
    id: `ai-place-${index + 1}`,
    landmassId: landmasses[place.landmassIndex]!.id,
    regionId: place.regionIndex === null ? null : regions[place.regionIndex]?.id ?? null,
    name: place.name,
    kind: place.kind,
    x: place.x,
    y: place.y,
    importance: place.importance,
    ...(place.population === undefined ? {} : { population: place.population }),
    description: place.description,
    tags: place.tags,
  }));
  const paths = inhabited.paths.map((path, index) => ({
    id: `ai-path-${index + 1}`,
    kind: path.kind,
    fromPlaceId: places[path.fromPlaceIndex]!.id,
    toPlaceId: places[path.toPlaceIndex]!.id,
    distanceMiles: path.distanceMiles,
    points: path.points,
  }));
  return {
    atlasVersion: WORLD_ATLAS_VERSION,
    generatorVersion: AI_ONLY_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    title: `${request.campaign.name} World`,
    seed: request.seed,
    widthMiles: geometry.widthMiles,
    heightMiles: geometry.heightMiles,
    northUp: true,
    landmasses,
    regions,
    mountainRanges: geometry.mountainRanges.map((range, index) => ({
      id: `ai-mountains-${index + 1}`,
      name: range.name,
      landmassId: landmasses[range.landmassIndex]!.id,
      points: range.points,
    })),
    rivers: geometry.rivers.map((river, index) => ({
      id: `ai-river-${index + 1}`,
      name: river.name,
      landmassId: landmasses[river.landmassIndex]!.id,
      points: river.points,
    })),
    places,
    paths,
    legend: makeLegend(inhabited),
    campaignDecisions: campaignDecisions(request),
    metadata: {
      generatedAt: request.generatedAt ?? new Date().toISOString(),
      artDirection: "illustrated-fantasy-atlas",
      renderStatus: "pending",
      aiOnlyGeneration: {
        fantasyWorld: true,
        campaignContextIncluded: true,
        passes: 3,
        findings: [...findings],
      },
    } as WorldAtlasDocument["metadata"],
  };
}

export async function generateAICampaignWorldAtlasV2(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
}): Promise<WorldAtlasDocument> {
  const geometry = await structured({
    env: input.env,
    label: "fantasy physical geography",
    system:
      "You are the authoritative senior cartographer and physical geographer for a persistent D&D 3.5 fantasy world. You create the geography itself; no procedural geography engine will run after you.",
    prompt: geometryPrompt(input.request),
    schema: geometrySchema,
    maxTokens: 6200,
    validate: validateGeometry,
  });
  const inhabited = await structured({
    env: input.env,
    label: "fantasy inhabited world",
    system:
      "You are the authoritative fantasy human-geography and transportation cartographer. Create every settlement, adventure site, road, trail, and sea route in one coherent pass using the supplied campaign and physical geography.",
    prompt: inhabitedPrompt(input.request, geometry),
    schema: inhabitedSchema,
    maxTokens: 7600,
    validate: (value) => validateInhabited(value, geometry),
  });
  const corrections = await structured({
    env: input.env,
    label: "final fantasy map review",
    system:
      "You are the final senior fantasy cartographer. The map is saved after your explicit corrections. Improve realism and fantasy coherence without delegating work to code.",
    prompt: finalReviewPrompt(input.request, geometry, inhabited),
    schema: finalCorrectionsSchema,
    maxTokens: 4200,
    validate: (value) => {
      if (value.landmassCorrections.some((item) => item.landmassIndex >= geometry.landmasses.length)) return "a landmass correction references a missing landmass";
      if (value.regionCorrections.some((item) => item.regionIndex >= geometry.regions.length)) return "a region correction references a missing region";
      if (value.placeCorrections.some((item) => item.placeIndex >= inhabited.places.length)) return "a place correction references a missing place";
      if (value.pathCorrections.some((item) => item.pathIndex >= inhabited.paths.length)) return "a path correction references a missing path";
      return null;
    },
  });
  const corrected = applyFinalCorrections(geometry, inhabited, corrections);
  const geometryError = validateGeometry(corrected.geometry);
  const inhabitedError = validateInhabited(corrected.inhabited, corrected.geometry);
  if (geometryError || inhabitedError) {
    throw new Error(`AI final fantasy-map corrections produced invalid data: ${geometryError ?? inhabitedError}`);
  }
  return materialize(input.request, corrected.geometry, corrected.inhabited, corrections.findings);
}
