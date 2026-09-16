import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
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

  return generateStableDenseAICampaignWorldAtlas({
    env: input.env,
    request: {
      ...request,
      campaign: {
        ...request.campaign,
        ...(productionContext ? { context: productionContext } : {}),
      },
    },
  });
}

// Kept for API compatibility with same-seed callers. AI-only generation no
// longer depends on these legacy hybrid-plan artifacts; on new AI-only atlases
// they naturally resolve to null.
export { storedAIPlan, storedAIRealismAudit };
