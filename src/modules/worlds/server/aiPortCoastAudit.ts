import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type { AtlasPoint, WorldAtlasDocument } from "../domain/atlas";
import type { RichCampaignAtlasRequest } from "./aiOnlyCampaignAtlasV2";

const correctionSchema = z.object({
  corrections: z
    .array(
      z.object({
        placeId: z.string().trim().min(1),
        x: z.number().finite(),
        y: z.number().finite(),
      }),
    )
    .max(32),
});

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function compactJson(value: unknown, maximum = 24_000): string {
  try {
    return JSON.stringify(value ?? {}).slice(0, maximum);
  } catch {
    return "{}";
  }
}

function modelFor(env: OpenAICompatibleEnv): string | undefined {
  return env.AI_GAME_MODEL?.trim() || env.AI_DEVBLOG_MODEL?.trim() || undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function distancePointToSegment(point: AtlasPoint, start: AtlasPoint, end: AtlasPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  const x = start.x + t * dx;
  const y = start.y + t * dy;
  return Math.hypot(point.x - x, point.y - y);
}

function coastlineDistance(point: AtlasPoint, coastline: readonly AtlasPoint[]): number {
  if (coastline.length < 2) return Number.POSITIVE_INFINITY;
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < coastline.length; index += 1) {
    const start = coastline[index]!;
    const end = coastline[(index + 1) % coastline.length]!;
    minimum = Math.min(minimum, distancePointToSegment(point, start, end));
  }
  return minimum;
}

function coastToleranceMiles(atlas: WorldAtlasDocument): number {
  return clamp(Math.min(atlas.widthMiles, atlas.heightMiles) / 650, 5, 22);
}

function inlandPorts(atlas: WorldAtlasDocument) {
  const landmassById = new Map(atlas.landmasses.map((landmass) => [landmass.id, landmass] as const));
  const tolerance = coastToleranceMiles(atlas);
  return atlas.places
    .filter((place) => place.kind === "port")
    .map((place) => {
      const landmass = landmassById.get(place.landmassId);
      const distance = landmass
        ? coastlineDistance({ x: place.x, y: place.y }, landmass.points)
        : Number.POSITIVE_INFINITY;
      return { place, landmass, distance };
    })
    .filter((entry) => !entry.landmass || entry.distance > tolerance);
}

function campaignContext(request: RichCampaignAtlasRequest): string {
  return compactJson({
    name: request.campaign.name,
    description: request.campaign.description ?? null,
    settings: request.campaign.settings ?? {},
    context: request.campaign.context ?? {},
    seed: request.seed,
  });
}

/**
 * Final AI coastal-port audit.
 *
 * Geography remains AI-authored: this pass asks the model to correct inland
 * ports using the exact AI-authored coastline. Application code only verifies
 * that the corrected port coordinates are actually coastal before persistence.
 */
export async function ensureAIPortsAreCoastal(input: {
  env: OpenAICompatibleEnv;
  request: RichCampaignAtlasRequest;
  atlas: WorldAtlasDocument;
}): Promise<WorldAtlasDocument> {
  let atlas = input.atlas;
  const tolerance = coastToleranceMiles(atlas);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const invalid = inlandPorts(atlas);
    if (!invalid.length) return atlas;

    const relevantLandmasses = [...new Set(invalid.map((entry) => entry.place.landmassId))]
      .map((id) => atlas.landmasses.find((landmass) => landmass.id === id))
      .filter((landmass): landmass is WorldAtlasDocument["landmasses"][number] => Boolean(landmass));

    const prompt = `You are the FINAL D&D 3.5 fantasy coastal cartographer. Some AI-authored ports are inland and MUST be moved directly onto the coastline of their EXISTING landmass. Do not change names, kinds, landmass assignments, or any non-port location.\n\nCAMPAIGN:\n${campaignContext(input.request)}\n\nCOAST TOLERANCE: ${Math.round(tolerance)} miles. Every corrected port must lie on or immediately beside one of the supplied coastline segments.\n\nINVALID PORTS:\n${compactJson(invalid.map((entry) => ({ placeId: entry.place.id, name: entry.place.name, landmassId: entry.place.landmassId, x: entry.place.x, y: entry.place.y, currentDistanceFromCoastMiles: Math.round(entry.distance) })))}\n\nAUTHORITATIVE AI-AUTHORED COASTLINES:\n${compactJson(relevantLandmasses.map((landmass) => ({ id: landmass.id, name: landmass.name, points: landmass.points })), 30_000)}\n\nReturn JSON only as {"corrections":[{"placeId":string,"x":number,"y":number}]}. Return one correction for EVERY invalid port. Choose coordinates on the correct landmass coastline itself, preferably at a bay, river mouth, estuary, natural harbor, or sheltered coastal position. Never put a port inland.`;

    const model = modelFor(input.env);
    const response = await generateOpenAICompatibleText(input.env, {
      system:
        "You are a precise fantasy coastal cartographer. Correct inland ports onto their exact supplied coastline and return JSON only.",
      prompt,
      temperature: 0.08,
      maxTokens: 1800,
      ...(model ? { model } : {}),
    });

    let parsed: z.infer<typeof correctionSchema> | null = null;
    try {
      const result = correctionSchema.safeParse(JSON.parse(extractJsonObject(response)) as unknown);
      if (result.success) parsed = result.data;
    } catch {
      parsed = null;
    }
    if (!parsed) continue;

    const correctionById = new Map(parsed.corrections.map((correction) => [correction.placeId, correction] as const));
    const landmassById = new Map(atlas.landmasses.map((landmass) => [landmass.id, landmass] as const));
    atlas = {
      ...atlas,
      places: atlas.places.map((place) => {
        if (place.kind !== "port") return place;
        const correction = correctionById.get(place.id);
        if (!correction) return place;
        const landmass = landmassById.get(place.landmassId);
        if (!landmass) return place;
        const nextPoint = { x: correction.x, y: correction.y };
        if (coastlineDistance(nextPoint, landmass.points) > tolerance) return place;
        return { ...place, x: correction.x, y: correction.y };
      }),
      metadata: {
        ...atlas.metadata,
        aiOnlyGeneration: {
          ...((atlas.metadata as { aiOnlyGeneration?: Record<string, unknown> }).aiOnlyGeneration ?? {}),
          coastalPortAudit: true,
          coastalPortToleranceMiles: Math.round(tolerance),
        },
      } as WorldAtlasDocument["metadata"],
    };
  }

  const remaining = inlandPorts(atlas);
  if (remaining.length) {
    throw new Error(
      `AI coastal-port audit could not place ${remaining.length} port${remaining.length === 1 ? "" : "s"} on the coastline: ${remaining
        .slice(0, 4)
        .map((entry) => entry.place.name)
        .join(", ")}`,
    );
  }

  return atlas;
}
