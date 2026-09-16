import { eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  campaigns,
  worldMaps,
  type WorldMapData,
} from "@/infrastructure/database/schema";
import { generateWorldAtlas, WORLD_ATLAS_GENERATOR_VERSION } from "@/modules/worlds/domain/atlas";
import type { WorldGenerator } from "./startCampaign";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    : [];
}

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
        ownerUserId: campaigns.ownerUserId,
        settings: campaigns.settings,
      })
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .get();

    if (!campaign) throw new Error("Campaign disappeared during world generation.");

    const settings = asRecord(campaign.settings);
    const rulesetSettings = asRecord(settings["ruleset"]);
    const worldSettings = asRecord(settings["world"]);
    const rulesSettings = asRecord(settings["rules"]);
    const styleIds =
      stringArray(settings["genres"]).length > 0
        ? stringArray(settings["genres"])
        : stringArray(rulesetSettings["campaignStyleIds"]);
    const templateId =
      optionalString(worldSettings["templateId"]) ??
      optionalString(rulesetSettings["worldTemplateId"]);
    const pace = optionalString(settings["pace"]) ?? optionalString(rulesetSettings["pace"]);
    const multiPlanar =
      typeof worldSettings["multiPlanar"] === "boolean"
        ? worldSettings["multiPlanar"]
        : rulesetSettings["multiPlanar"] === true;
    const epic =
      typeof rulesSettings["epicLevels"] === "boolean"
        ? rulesSettings["epicLevels"]
        : rulesetSettings["epicLevels"] === true;
    const structure = optionalString(settings["structure"]);
    const scale = optionalString(settings["scale"]);

    const atlas = generateWorldAtlas({
      seed: input.generationSeed,
      title: `${campaign.name} World`,
      templateId,
      styleIds,
      structure,
      scale,
      pace,
      multiPlanar,
      epic,
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
      generatorVersion: WORLD_ATLAS_GENERATOR_VERSION,
      settings: {
        generation: {
          ...(templateId ? { templateId } : {}),
          ...(styleIds.length ? { styleIds } : {}),
          ...(pace ? { pace } : {}),
          multiPlanar,
          epic,
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
