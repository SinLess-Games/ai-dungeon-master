import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { ServiceUnavailableError } from "@/server/middleware/errors";
import type { WorldAtlasDocument } from "../domain/atlas";
import type { CampaignAtlasRequest } from "../domain/campaignAtlas";
import {
  AI_ONLY_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  type RichCampaignAtlasRequest,
} from "./aiOnlyCampaignAtlasV2";
import { generateStableDenseAICampaignWorldAtlas } from "./aiDenseCampaignAtlasStable";
import {
  storedAIPlan,
  storedAIRealismAudit,
  type CampaignWorldAIPlan,
  type CampaignWorldRealismAudit,
} from "./hybridCampaignAtlas";

/**
 * Compatibility export retained for callers while the production pipeline is
 * fully AI-authored. No procedural atlas generator, continental reshaper,
 * settlement engine, route engine, or coastal correction engine runs here.
 */
export const FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION =
  AI_ONLY_CAMPAIGN_ATLAS_GENERATOR_VERSION;

export async function generateHybridCampaignWorldAtlas(input: {
  env: OpenAICompatibleEnv;
  request: CampaignAtlasRequest | RichCampaignAtlasRequest;
  existingPlan?: CampaignWorldAIPlan | null;
  existingAudit?: CampaignWorldRealismAudit | null;
}): Promise<WorldAtlasDocument> {
  const request = input.request as RichCampaignAtlasRequest;
  const context = request.campaign.context;
  const productionContext =
    context && typeof context["campaignId"] === "string"
      ? {
          ...context,
          minimumLocations:
            typeof context["minimumLocations"] === "number"
              ? context["minimumLocations"]
              : 320,
        }
      : context;

  try {
    return await generateStableDenseAICampaignWorldAtlas({
      env: input.env,
      request: {
        ...request,
        campaign: {
          ...request.campaign,
          ...(productionContext ? { context: productionContext } : {}),
        },
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("AI world regeneration failed", { reason, error });
    throw new ServiceUnavailableError(
      `AI world regeneration could not complete: ${reason.slice(0, 320)}`,
      { stage: "ai-world-regeneration" },
    );
  }
}

// Kept for API compatibility with same-seed callers. AI-only generation no
// longer depends on these legacy hybrid-plan artifacts; on new AI-only atlases
// they naturally resolve to null.
export { storedAIPlan, storedAIRealismAudit };
