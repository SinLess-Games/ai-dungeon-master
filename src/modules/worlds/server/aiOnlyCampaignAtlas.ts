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

export const AI_ONLY_CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v9-ai-only";

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
        points: z.array(pointSchema).min(12).max(48),
        center: pointSchema,
        radiusX: z.number().finite().positive(),
        radiusY: z.number().finite().positive(),
        biome: biomeSchema,
      }),
    )
    .min(1)
    .max(8),
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
    .max(36),
  mountainRanges: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(100),
        points: z.array(pointSchema).min(2).max(20),
      }),
    )
    .max(16),
  rivers: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        name: z.string().trim().min(1).max(100),
        points: z.array(pointSchema).min(3).max(24),
      }),
    )
    .max(24),
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
const placesSchema = z.object({ places: z.array(placeSchema).min(12).max(70) });

const pathSchema = z.object({
  kind: z.enum(PATH_KINDS),
  fromPlaceIndex: z.number().int().nonnegative(),
  toPlaceIndex: z.number().int().nonnegative(),
  distanceMiles: z.number().finite().positive(),
  points: z.array(pointSchema).min(2).max(28),
});
const pathsSchema = z.object({ paths: z.array(pathSchema).max(90) });

const finalCorrectionsSchema = z.object({
  findings: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  landmassCorrections: z
    .array(
      z.object({
        landmassIndex: z.number().int().nonnegative(),
        points: z.array(pointSchema).min(12).max(48),
        center: pointSchema,
        radiusX: z.number().finite().positive(),
        radiusY: z.number().finite().positive(),
      }),
    )
    .max(8)
    .default([]),
  regionCorrections: z
    .array(
      z.object({
        regionIndex: z.number().int().nonnegative(),
        center: pointSchema.optional(),
        biome: biomeSchema.optional(),
      }),
    )
    .max(36)
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
    .max(70)
    .default([]),
  pathCorrections: z
    .array(
      z.object({
        pathIndex: z.number().int().nonnegative(),
        distanceMiles: z.number().finite().positive().optional(),
        points: z.array(pointSchema).min(2).max(28).optional(),
      }),
    )
    .max(90)
    .default([]),
});

type GeometryDraft = z.infer<typeof geometrySchema>;
type PlacesDraft = z.infer<typeof placesSchema>;
type PathsDraft = z.infer<typeof pathsSchema>;
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

function settingsText(request: CampaignAtlasRequest): string {
  try {
    return JSON.stringify(request.campaign.settings ?? {}).slice(0, 10_000);
  } catch {
    return "{}";
  }
}

function campaignContext(request: CampaignAtlasRequest): string {
  return [
    `Campaign: ${request.campaign.name}`,
    `Description: ${request.campaign.description ?? "(none)"}`,
    `Settings: ${settingsText(request)}`,
    `World seed/reference: ${request.seed}`,
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
    throw new Error("AI-only world generation requires an AI provider.");
  }

  let retryNote = "";
  let lastError = "unknown validation error";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await generateOpenAICompatibleText(input.env, {
      system: input.system,
      prompt: `${input.prompt}${retryNote}`,
      temperature: 0.15,
      maxTokens: input.maxTokens,
      ...(modelFor(input.env) ? { model: modelFor(input.env) } : {}),
    });
    try {
      const parsed = input.schema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (!parsed.success) {
        lastError = parsed.error.issues.slice(0, 8).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
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

function validatePlaces(value: PlacesDraft, geometry: GeometryDraft): string | null {
  const hasMajorSettlement = value.places.some((place) => ["capital", "city", "town"].includes(place.kind));
  if (!hasMajorSettlement) return "the world must contain at least one capital, city, or town";
  for (const [index, place] of value.places.entries()) {
    if (place.landmassIndex >= geometry.landmasses.length) return `place ${index} references a missing landmass`;
    if (place.regionIndex !== null && place.regionIndex >= geometry.regions.length) return `place ${index} references a missing region`;
    if (!pointInBounds(place, geometry)) return `place ${index} is outside the world bounds`;
  }
  return null;
}

function validatePaths(value: PathsDraft, places: PlacesDraft, geometry: GeometryDraft): string | null {
  for (const [index, path] of value.paths.entries()) {
    if (path.fromPlaceIndex >= places.places.length || path.toPlaceIndex >= places.places.length) {
      return `path ${index} references a missing place`;
    }
    if (path.fromPlaceIndex === path.toPlaceIndex) return `path ${index} connects a place to itself`;
    if (path.points.some((point) => !pointInBounds(point, geometry))) return `path ${index} leaves the world bounds`;
    if (path.kind === "sea-route") {
      const from = places.places[path.fromPlaceIndex]!;
      const to = places.places[path.toPlaceIndex]!;
      if (from.kind !== "port" || to.kind !== "port") return `sea route ${index} must connect two AI-generated ports`;
    }
  }
  return null;
}

function geometryPrompt(request: CampaignAtlasRequest): string {
  return `${campaignContext(request)}\n\nCreate the complete physical world geography as JSON matching this shape:\n{
  "widthMiles": number,
  "heightMiles": number,
  "landmasses": [{"name":string,"points":[{"x":number,"y":number}],"center":{"x":number,"y":number},"radiusX":number,"radiusY":number,"biome":${JSON.stringify(BIOMES)}}],
  "regions": [{"landmassIndex":number,"name":string,"center":{"x":number,"y":number},"biome":${JSON.stringify(BIOMES)},"importance":0.1..1}],
  "mountainRanges": [{"landmassIndex":number,"name":string,"points":[{"x":number,"y":number}]}],
  "rivers": [{"landmassIndex":number,"name":string,"points":[{"x":number,"y":number}]}]
}\n
YOU are the map generator. Do not defer any geography to code. Use realistic Earthlike physical geography unless the campaign explicitly requires something fantastical. For ordinary campaigns generate 1 dominant continental landmass occupying roughly 45-70% of the world frame and optionally 1-2 substantial secondary continents. Do NOT make several small round islands. Archipelagos are allowed only when the campaign explicitly calls for islands, pirates, naval play, or seafaring. Continents should have irregular continental-scale coastlines with peninsulas, bays, inland seas, and varied relief. Mountain chains should form plausible long belts, not isolated icons. Rivers should originate in highlands/mountains, merge sensibly, and terminate at coasts or major inland basins. Climate and biome placement should be believable by latitude and relief. Keep all coordinates inside the declared world dimensions. Return JSON only.`;
}

function placesPrompt(request: CampaignAtlasRequest, geometry: GeometryDraft): string {
  return `${campaignContext(request)}\n\nHere is the AI-generated physical geography:\n${JSON.stringify(geometry)}\n\nNow generate the inhabited world and adventure locations. Return JSON only as {"places":[...]}. Each place must contain landmassIndex, regionIndex (or null), name, kind (${JSON.stringify(PLACE_KINDS)}), x, y, importance, optional population, description, and tags. YOU choose every coordinate. Keep cities and towns realistically sparse at continental scale. Capitals and major cities should be separated by hundreds of miles unless the campaign is specifically urban. Put settlements near fresh water, river valleys, coasts, crossroads, or fertile plains where appropriate. Ports MUST sit directly on a coastline and have plausible harbors. Avoid evenly spaced dots and avoid clustering every settlement in one small area. Use 20-55 total places for a normal world, including wilderness/adventure sites. Return JSON only.`;
}

function pathsPrompt(request: CampaignAtlasRequest, geometry: GeometryDraft, places: PlacesDraft): string {
  const compactGeometry = {
    widthMiles: geometry.widthMiles,
    heightMiles: geometry.heightMiles,
    landmasses: geometry.landmasses.map((landmass) => ({ name: landmass.name, points: landmass.points })),
    rivers: geometry.rivers,
  };
  return `${campaignContext(request)}\n\nGeography:\n${JSON.stringify(compactGeometry)}\n\nPlaces (array indexes are endpoint indexes):\n${JSON.stringify(places.places)}\n\nGenerate the transportation network as JSON only: {"paths":[{"kind":"road"|"trail"|"sea-route","fromPlaceIndex":number,"toPlaceIndex":number,"distanceMiles":number,"points":[{"x":number,"y":number}]}]}. YOU choose all route geometry and distances. Roads and trails must remain on land and should follow realistic valleys, passes, rivers, and settlement hierarchy instead of drawing a dense graph. Sea routes must connect ports only and every intermediate point must remain in water; bend routes around peninsulas and continents instead of crossing land. Keep the network sparse and believable. Return JSON only.`;
}

function finalReviewPrompt(
  request: CampaignAtlasRequest,
  geometry: GeometryDraft,
  places: PlacesDraft,
  paths: PathsDraft,
): string {
  return `${campaignContext(request)}\n\nThis is the complete AI-generated draft map. You are the FINAL cartographic authority. Review it for the exact visual/realism failures the user has rejected: island-like continents, inland ports, sea routes crossing land, clustered cities/towns, implausible rivers/mountains, and overly dense transport networks.\n\nGEOMETRY:\n${JSON.stringify(geometry)}\n\nPLACES:\n${JSON.stringify(places.places)}\n\nPATHS:\n${JSON.stringify(paths.paths)}\n\nReturn JSON only with this correction shape:\n{
 "findings": string[],
 "landmassCorrections": [{"landmassIndex":number,"points":[{"x":number,"y":number}],"center":{"x":number,"y":number},"radiusX":number,"radiusY":number}],
 "regionCorrections": [{"regionIndex":number,"center"?:{"x":number,"y":number},"biome"?:${JSON.stringify(BIOMES)}}],
 "placeCorrections": [{"placeIndex":number,"x"?:number,"y"?:number,"regionIndex"?:number|null}],
 "pathCorrections": [{"pathIndex":number,"distanceMiles"?:number,"points"?:[{"x":number,"y":number}]}]
}\nOnly include corrections that improve the finished map. Make normal landmasses read as continents, not islands. Move any inland port onto its actual coast. Replace any sea-route geometry that crosses land with a water-only route. Widen unrealistic settlement spacing. Return JSON only.`;
}

function applyFinalCorrections(
  geometry: GeometryDraft,
  places: PlacesDraft,
  paths: PathsDraft,
  corrections: FinalCorrections,
): { geometry: GeometryDraft; places: PlacesDraft; paths: PathsDraft } {
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
      return correction ? { ...region, ...(correction.center ? { center: correction.center } : {}), ...(correction.biome ? { biome: correction.biome } : {}) } : region;
    }),
  };
  const correctedPlaces: PlacesDraft = {
    places: places.places.map((place, index) => {
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
  };
  const correctedPaths: PathsDraft = {
    paths: paths.paths.map((path, index) => {
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
  return { geometry: correctedGeometry, places: correctedPlaces, paths: correctedPaths };
}

function campaignDecisions(request: CampaignAtlasRequest): WorldAtlasDocument["campaignDecisions"] {
  const settings = typeof request.campaign.settings === "object" && request.campaign.settings && !Array.isArray(request.campaign.settings)
    ? (request.campaign.settings as Record<string, unknown>)
    : {};
  const world = typeof settings["world"] === "object" && settings["world"] && !Array.isArray(settings["world"])
    ? (settings["world"] as Record<string, unknown>)
    : {};
  const ruleset = typeof settings["ruleset"] === "object" && settings["ruleset"] && !Array.isArray(settings["ruleset"])
    ? (settings["ruleset"] as Record<string, unknown>)
    : {};
  const rules = typeof settings["rules"] === "object" && settings["rules"] && !Array.isArray(settings["rules"])
    ? (settings["rules"] as Record<string, unknown>)
    : {};
  const styleIds = Array.isArray(settings["genres"])
    ? settings["genres"].filter((value): value is string => typeof value === "string")
    : Array.isArray(ruleset["campaignStyleIds"])
      ? ruleset["campaignStyleIds"].filter((value): value is string => typeof value === "string")
      : [];
  return {
    templateId: typeof world["templateId"] === "string" ? world["templateId"] : typeof ruleset["worldTemplateId"] === "string" ? ruleset["worldTemplateId"] : null,
    styleIds,
    structure: typeof settings["structure"] === "string" ? settings["structure"] : null,
    scale: typeof settings["scale"] === "string" ? settings["scale"] : null,
    pace: typeof settings["pace"] === "string" ? settings["pace"] : typeof ruleset["pace"] === "string" ? ruleset["pace"] : null,
    multiPlanar: world["multiPlanar"] === true || ruleset["multiPlanar"] === true,
    epic: rules["epicLevels"] === true || ruleset["epicLevels"] === true,
  };
}

function makeLegend(places: PlacesDraft, paths: PathsDraft): AtlasLegendEntry[] {
  const used = new Set<AtlasPlaceKind | AtlasPathKind>();
  for (const place of places.places) used.add(place.kind);
  for (const path of paths.paths) used.add(path.kind);
  return [...used].map((kind) => ({ kind, label: LEGEND_LABELS[kind] }));
}

function materialize(
  request: CampaignAtlasRequest,
  geometry: GeometryDraft,
  places: PlacesDraft,
  paths: PathsDraft,
  findings: readonly string[],
): WorldAtlasDocument {
  const landmasses = geometry.landmasses.map((landmass, index) => ({ ...landmass, id: `ai-landmass-${index + 1}` }));
  const regions = geometry.regions.map((region, index) => ({
    id: `ai-region-${index + 1}`,
    landmassId: landmasses[region.landmassIndex]!.id,
    name: region.name,
    center: region.center,
    biome: region.biome as AtlasBiome,
    importance: region.importance,
  }));
  const materializedPlaces = places.places.map((place, index) => ({
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
  const materializedPaths = paths.paths.map((path, index) => ({
    id: `ai-path-${index + 1}`,
    kind: path.kind,
    fromPlaceId: materializedPlaces[path.fromPlaceIndex]!.id,
    toPlaceId: materializedPlaces[path.toPlaceIndex]!.id,
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
    places: materializedPlaces,
    paths: materializedPaths,
    legend: makeLegend(places, paths),
    campaignDecisions: campaignDecisions(request),
    metadata: {
      generatedAt: request.generatedAt ?? new Date().toISOString(),
      artDirection: "illustrated-fantasy-atlas",
      renderStatus: "pending",
      aiOnlyGeneration: { findings: [...findings] },
    } as WorldAtlasDocument["metadata"],
  };
}

export async function generateAICampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: CampaignAtlasRequest;
}): Promise<WorldAtlasDocument> {
  const geometry = await structured({
    env: input.env,
    label: "physical geography",
    system: "You are the authoritative world cartographer for a D&D 3.5 persistent world. You create the map itself; no procedural geography engine will run after you.",
    prompt: geometryPrompt(input.request),
    schema: geometrySchema,
    maxTokens: 8000,
    validate: validateGeometry,
  });
  const places = await structured({
    env: input.env,
    label: "settlements and sites",
    system: "You are the authoritative human-geography cartographer. You choose every settlement and site and its exact coordinate on the already-created world.",
    prompt: placesPrompt(input.request, geometry),
    schema: placesSchema,
    maxTokens: 9000,
    validate: (value) => validatePlaces(value, geometry),
  });
  const paths = await structured({
    env: input.env,
    label: "transport network",
    system: "You are the authoritative transportation cartographer. You draw every road, trail, and sea route yourself. No route engine will fix your work afterward.",
    prompt: pathsPrompt(input.request, geometry, places),
    schema: pathsSchema,
    maxTokens: 9000,
    validate: (value) => validatePaths(value, places, geometry),
  });
  const corrections = await structured({
    env: input.env,
    label: "final map review",
    system: "You are the final senior cartographer. The map will be saved exactly after your corrections. Fix realism problems directly with explicit replacement coordinates; do not merely describe them.",
    prompt: finalReviewPrompt(input.request, geometry, places, paths),
    schema: finalCorrectionsSchema,
    maxTokens: 7000,
    validate: (value) => {
      if (value.landmassCorrections.some((item) => item.landmassIndex >= geometry.landmasses.length)) return "a landmass correction references a missing landmass";
      if (value.regionCorrections.some((item) => item.regionIndex >= geometry.regions.length)) return "a region correction references a missing region";
      if (value.placeCorrections.some((item) => item.placeIndex >= places.places.length)) return "a place correction references a missing place";
      if (value.pathCorrections.some((item) => item.pathIndex >= paths.paths.length)) return "a path correction references a missing path";
      return null;
    },
  });
  const corrected = applyFinalCorrections(geometry, places, paths, corrections);
  const geometryError = validateGeometry(corrected.geometry);
  const placesError = validatePlaces(corrected.places, corrected.geometry);
  const pathsError = validatePaths(corrected.paths, corrected.places, corrected.geometry);
  if (geometryError || placesError || pathsError) {
    throw new Error(`AI final map corrections produced invalid data: ${geometryError ?? placesError ?? pathsError}`);
  }
  return materialize(input.request, corrected.geometry, corrected.places, corrected.paths, corrections.findings);
}
