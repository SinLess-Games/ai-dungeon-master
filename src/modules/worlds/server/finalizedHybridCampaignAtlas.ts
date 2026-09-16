import type { WorldAtlasDocument } from "../domain/atlas";
import { enforceCoastalAtlasIntegrity } from "../domain/coastalAtlasIntegrity";
import {
  auditCampaignWorldRealismWithAI,
  generateHybridCampaignWorldAtlas as generateHybridCampaignWorldAtlasV7,
  storedAIPlan,
  storedAIRealismAudit,
  type CampaignWorldRealismAudit,
} from "./hybridCampaignAtlas";

export const FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION =
  "campaign-atlas-v8-ai-final-map-review";

const FINAL_REVIEW_MARKER = "[FINAL_MAP_REVIEW]";

function isFinalReview(audit: CampaignWorldRealismAudit | null | undefined): boolean {
  return Boolean(audit?.findings.some((finding) => finding.startsWith(FINAL_REVIEW_MARKER)));
}

function markFinalReview(audit: CampaignWorldRealismAudit): CampaignWorldRealismAudit {
  if (isFinalReview(audit)) return audit;
  return {
    ...audit,
    findings: [
      `${FINAL_REVIEW_MARKER} AI reviewed the finished map after engine realism and coastal-integrity passes.`,
      ...audit.findings,
    ].slice(0, 12),
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

/**
 * Final production world pipeline.
 *
 * v7 creates the AI-planned, engine-realistic atlas. We then enforce hard
 * coastline/ocean invariants and give AI one final review of the resulting map.
 * The AI review is not allowed to supply coordinates; instead it becomes the
 * final bounded realism directive set and the engine materializes it once more.
 * Same-seed regeneration reuses a marked final review, preserving determinism.
 */
export async function generateHybridCampaignWorldAtlas(
  input: Parameters<typeof generateHybridCampaignWorldAtlasV7>[0],
): Promise<WorldAtlasDocument> {
  const firstPass = enforceCoastalAtlasIntegrity(
    await generateHybridCampaignWorldAtlasV7(input),
  );
  const plan = storedAIPlan(firstPass);
  if (!plan) return attachFinalReviewMetadata(firstPass, null);

  if (isFinalReview(input.existingAudit)) {
    return attachFinalReviewMetadata(firstPass, input.existingAudit ?? null);
  }

  const finalReview = await auditCampaignWorldRealismWithAI({
    env: input.env,
    request: input.request,
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
    enforceCoastalAtlasIntegrity(reviewed),
    markedReview,
  );
}

export { storedAIPlan, storedAIRealismAudit } from "./hybridCampaignAtlas";
