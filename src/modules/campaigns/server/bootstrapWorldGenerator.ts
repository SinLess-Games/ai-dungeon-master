import { eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import { campaigns } from "@/infrastructure/database/schema";
import type { WorldGenerator } from "./startCampaign";

/**
 * Minimal deterministic world generator used by the campaign-start API.
 *
 * This intentionally creates only the authoritative world root and generation
 * metadata. Region, settlement, NPC, encounter, and map generation can be
 * layered on later without changing the campaign lifecycle contract.
 */
export class BootstrapWorldGenerator implements WorldGenerator {
  constructor(private readonly db: Database) {}

  async generate(input: Parameters<WorldGenerator["generate"]>[0]) {
    const campaign = await this.db
      .select({ name: campaigns.name, settings: campaigns.settings })
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .get();

    if (!campaign) throw new Error("Campaign disappeared during world generation.");

    const rulesetSettings = campaign.settings.ruleset ?? {};

    return {
      name: `${campaign.name} World`,
      generatorVersion: "bootstrap-world-v1",
      settings: {
        generation: {
          ...(typeof rulesetSettings["worldTemplateId"] === "string"
            ? { templateId: rulesetSettings["worldTemplateId"] }
            : {}),
          ...(Array.isArray(rulesetSettings["campaignStyleIds"])
            ? {
                styleIds: rulesetSettings["campaignStyleIds"].filter(
                  (value): value is string => typeof value === "string",
                ),
              }
            : {}),
          ...(typeof rulesetSettings["pace"] === "string"
            ? { pace: rulesetSettings["pace"] }
            : {}),
          ...(typeof rulesetSettings["multiPlanar"] === "boolean"
            ? { multiPlanar: rulesetSettings["multiPlanar"] }
            : {}),
          ...(typeof rulesetSettings["epicLevels"] === "boolean"
            ? { epic: rulesetSettings["epicLevels"] }
            : {}),
        },
        extensions: {
          campaignId: input.campaignId,
          rulesetId: input.rulesetId,
          rulesetVersion: input.rulesetVersion,
          characterIds: [...input.characterIds],
          generationSeed: input.generationSeed,
        },
      },
    };
  }
}
