import { eq } from "drizzle-orm";
import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import type { Database } from "@/infrastructure/database/client";
import {
  campaigns,
  worldMaps,
  type WorldMapData,
} from "@/infrastructure/database/schema";
import { generateFastDenseAICampaignWorldAtlas } from "@/modules/worlds/server/aiFastDenseCampaignAtlas";
import { ensureAIPortsAreCoastal } from "@/modules/worlds/server/aiPortCoastAudit";
import { enforceCityOnlyRoads } from "@/modules/worlds/server/aiRoadHierarchyAudit";
import type { RichCampaignAtlasRequest } from "@/modules/worlds/server/aiOnlyCampaignAtlasV2";
import type { WorldGenerator } from "./startCampaign";

function missingWorldMapTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("no such table") && message.includes("world_maps");
}

/**
 * AI-authoritative full-world generator used by campaign start.
 *
 * The AI creates all physical geography, settlements, routes, names, and exact
 * map coordinates. Application code validates the returned structured map,
 * including a final AI-authored coastal-port correction pass and transportation
 * hierarchy validation, assigns internal IDs, persists it, and later queues the
 * AI satellite render.
 */
export class BootstrapWorldGenerator implements WorldGenerator {
  constructor(
    private readonly db: Database,
    private readonly aiEnv: OpenAICompatibleEnv,
  ) {}

  async generate(input: Parameters<WorldGenerator["generate"]>[0]) {
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .get();

    if (!campaign) throw new Error("Campaign disappeared during world generation.");

    const request: RichCampaignAtlasRequest = {
      campaign: {
        name: campaign.name,
        description: campaign.description,
        settings: campaign.settings,
        context: {
          campaignId: campaign.id,
          notes: campaign.notes,
          status: campaign.status,
          playMode: campaign.playMode,
          gameMasterMode: campaign.gameMasterMode,
          timeMode: campaign.timeMode,
          visibility: campaign.visibility,
          maxPlayers: campaign.maxPlayers,
          rulesetId: campaign.rulesetId,
          rulesetVersion: campaign.rulesetVersion,
          generationSeed: campaign.generationSeed,
          worldTime: campaign.worldTime,
          startingCharacterCount: input.characterIds.length,
          creatorSettings: campaign.settings,
          minimumLocations: 320,
        },
      },
      seed: input.generationSeed,
      generatedAt: new Date().toISOString(),
    };

    const generatedAtlas = await generateFastDenseAICampaignWorldAtlas({
      env: this.aiEnv,
      request,
    });
    const coastalAtlas = await ensureAIPortsAreCoastal({
      env: this.aiEnv,
      request,
      atlas: generatedAtlas,
    });
    const atlas = enforceCityOnlyRoads(coastalAtlas);
    const mapId = `world-atlas-${input.worldId}`;
    let atlasPersisted = false;

    try {
      await this.db.insert(worldMaps).values({
        id: mapId,
        worldId: input.worldId,
        ownerUserId: campaign.ownerUserId,
        name: `${campaign.name} — World Atlas`,
        kind: "world",
        data: atlas as unknown as WorldMapData,
      });
      atlasPersisted = true;
    } catch (error) {
      if (!missingWorldMapTable(error)) throw error;
      console.warn("World atlas storage is not migrated; campaign start will use world metadata only.", {
        campaignId: input.campaignId,
        worldId: input.worldId,
      });
    }

    return {
      name: `${campaign.name} World`,
      generatorVersion: atlas.generatorVersion,
      settings: {
        generation: {
          ...(atlas.campaignDecisions.templateId
            ? { templateId: atlas.campaignDecisions.templateId }
            : {}),
          ...(atlas.campaignDecisions.styleIds.length
            ? { styleIds: atlas.campaignDecisions.styleIds }
            : {}),
          ...(atlas.campaignDecisions.pace ? { pace: atlas.campaignDecisions.pace } : {}),
          multiPlanar: atlas.campaignDecisions.multiPlanar,
          epic: atlas.campaignDecisions.epic,
        },
        extensions: {
          campaignId: input.campaignId,
          rulesetId: input.rulesetId,
          rulesetVersion: input.rulesetVersion,
          characterIds: [...input.characterIds],
          generationSeed: input.generationSeed,
          atlas: {
            mapId,
            atlasVersion: atlas.atlasVersion,
            widthMiles: atlas.widthMiles,
            heightMiles: atlas.heightMiles,
            persisted: atlasPersisted,
          },
        },
      },
    };
  }
}
