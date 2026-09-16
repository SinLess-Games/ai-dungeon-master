import { eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  campaigns,
  worldMaps,
  type WorldMapData,
} from "@/infrastructure/database/schema";
import { generateRealisticCampaignWorldAtlas } from "@/modules/worlds/domain/realisticCampaignAtlas";
import type { WorldGenerator } from "./startCampaign";

function missingWorldMapTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("no such table") && message.includes("world_maps");
}

/**
 * Deterministic full-world generator used by campaign start.
 *
 * Every campaign receives its own original planet-scale atlas. The canonical
 * interactive document is persisted in D1 through `world_maps`; R2 rendering,
 * KV manifests, and Vectorize indexing are performed asynchronously by the
 * atlas background jobs when the map is first opened.
 *
 * Deployments that have not applied the existing world-map/offline migration
 * still retain the previous world-root behavior instead of breaking campaign
 * start. Once `world_maps` exists, atlas creation is authoritative.
 */
export class BootstrapWorldGenerator implements WorldGenerator {
  constructor(private readonly db: Database) {}

  async generate(input: Parameters<WorldGenerator["generate"]>[0]) {
    const campaign = await this.db
      .select({
        name: campaigns.name,
        description: campaigns.description,
        ownerUserId: campaigns.ownerUserId,
        settings: campaigns.settings,
      })
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .get();

    if (!campaign) throw new Error("Campaign disappeared during world generation.");

    const atlas = generateRealisticCampaignWorldAtlas({
      campaign: {
        name: campaign.name,
        description: campaign.description,
        settings: campaign.settings,
      },
      seed: input.generationSeed,
    });
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
