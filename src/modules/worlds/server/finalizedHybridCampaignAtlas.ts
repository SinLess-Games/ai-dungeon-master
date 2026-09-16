import type { WorldAtlasDocument } from "../domain/atlas";
import {
  coastDistanceMiles,
  enforceCoastalAtlasIntegrity,
  seaRouteStaysInWater,
} from "../domain/coastalAtlasIntegrity";
import { enforceContinentalAtlasScale } from "../domain/continentalAtlasScale";
import {
  auditCampaignWorldRealismWithAI,
  generateHybridCampaignWorldAtlas as generateHybridCampaignWorldAtlasV7,
  storedAIPlan,
  storedAIRealismAudit,
  type CampaignWorldRealismAudit,
} from "./hybridCampaignAtlas";

export const FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION =
  "campaign-atlas-v9-continental-ai-final-map-review";

const FINAL_REVIEW_MARKER = "[FINAL_MAP_REVIEW]";

function isFinalReview(audit: CampaignWorldRealismAudit | null | undefined): boolean {
  return Boolean(audit?.findings.some((finding) => finding.startsWith(FINAL_REVIEW_MARKER)));
}

function markFinalReview(audit: CampaignWorldRealismAudit): CampaignWorldRealismAudit {
  if (isFinalReview(audit)) return audit;
  return {
    ...audit,
    findings: [
      `${FINAL_REVIEW_MARKER} AI reviewed the finished map after continental-scale, engine-realism, and coastal-integrity passes.`,
      ...audit.findings,
    ].slice(0, 12),
  };
}

function finalReviewRequest(
  request: Parameters<typeof generateHybridCampaignWorldAtlasV7>[0]["request"],
  atlas: WorldAtlasDocument,
): Parameters<typeof generateHybridCampaignWorldAtlasV7>[0]["request"] {
  const diagnostics = {
    landmasses: atlas.landmasses.map((landmass) => ({
      name: landmass.name,
      approximateWidthMiles: Math.round(landmass.radiusX * 2),
      approximateHeightMiles: Math.round(landmass.radiusY * 2),
      widthShareOfWorld: Number(((landmass.radiusX * 2) / atlas.widthMiles).toFixed(3)),
      heightShareOfWorld: Number(((landmass.radiusY * 2) / atlas.heightMiles).toFixed(3)),
      biome: landmass.biome,
    })),
    ports: atlas.places
      .filter((place) => place.kind === "port")
      .map((place) => ({
        name: place.name,
        landmassId: place.landmassId,
        coastDistanceMiles: Number(coastDistanceMiles(place, atlas).toFixed(3)),
      })),
    seaRoutes: atlas.paths
      .filter((path) => path.kind === "sea-route")
      .map((path) => ({
        fromPlaceId: path.fromPlaceId,
        toPlaceId: path.toPlaceId,
        distanceMiles: path.distanceMiles,
        waterOnly: seaRouteStaysInWater(path, atlas),
      })),
    majorSettlements: atlas.places
      .filter((place) =>
        ["capital", "city", "town", "port", "fort", "castle"].includes(place.kind),
      )
      .map((place) => ({
        name: place.name,
        kind: place.kind,
        landmassId: place.landmassId,
        x: Math.round(place.x),
        y: Math.round(place.y),
      })),
  };

  return {
    ...request,
    campaign: {
      ...request.campaign,
      description: [
        request.campaign.description ?? "",
        `FINAL MAP GEOMETRY DIAGNOSTICS: ${JSON.stringify(diagnostics)}`,
        "During this final pass, explicitly check that non-maritime worlds read as large continents rather than island clusters, every port is on its coast, every sea route is water-only, major settlements have believable separation, and transport links fit the geography.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  };
}

function attachFinalReviewMetadata(
  atlas: WorldAtlasDocument,
  review: CampaignWorldRealismAudit | null,
): WorldAtlasDocument {
  const metadata = atlas.metadata as typeof atlas.metadata & {
    aiPlanning?: Record<string, unknown>;
  };
  return {
    ...atlas,
    generatorVersion: FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
    metadata: {
      ...metadata,
      aiPlanning: {
        ...(metadata.aiPlanning ?? {}),
        finalMapReview: review,
      },
    },
  } as WorldAtlasDocument;
}

function finalizePhysicalGeography(atlas: WorldAtlasDocument): WorldAtlasDocument {
  return enforceCoastalAtlasIntegrity(enforceContinentalAtlasScale(atlas));
}

/**
 * Final production world pipeline.
 *
 * v7 creates the AI-planned, engine-realistic atlas. We then enlarge normal
 * worlds to true continental scale, enforce hard coastline/ocean invariants,
 * and give AI one final review of the resulting physical map. Explicit
 * archipelago campaigns bypass the continental-scale pass. The AI review
 * receives geometric diagnostics from the finished atlas and is not allowed to
 * supply coordinates; instead it becomes the final bounded realism directive
 * set and the engine materializes it once more. Same-seed regeneration reuses
 * a marked final review, preserving determinism.
 */
export async function generateHybridCampaignWorldAtlas(
  input: Parameters<typeof generateHybridCampaignWorldAtlasV7>[0],
): Promise<WorldAtlasDocument> {
  const firstPass = finalizePhysicalGeography(
    await generateHybridCampaignWorldAtlasV7(input),
  );
  const plan = storedAIPlan(firstPass);
  if (!plan) return attachFinalReviewMetadata(firstPass, null);

  if (isFinalReview(input.existingAudit)) {
    return attachFinalReviewMetadata(firstPass, input.existingAudit ?? null);
  }

  const finalReview = await auditCampaignWorldRealismWithAI({
    env: input.env,
    request: finalReviewRequest(input.request, firstPass),
    plan,
    atlas: firstPass,
  });
  if (!finalReview) return attachFinalReviewMetadata(firstPass, null);

  const markedReview = markFinalReview(finalReview);
  const reviewed = await generateHybridCampaignWorldAtlasV7({
    env: input.env,
    request: input.request,
    existingPlan: plan,
    existingAudit: markedReview,
  });
  return attachFinalReviewMetadata(
    finalizePhysicalGeography(reviewed),
    markedReview,
  );
}

export { storedAIPlan, storedAIRealismAudit } from "./hybridCampaignAtlas";
