import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  engineFailure,
  engineSuccess,
  type EngineResult,
} from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import {
  campaigns,
  characters,
  gameEvents,
  gameSessions,
  worlds,
  type WorldSettings,
} from "@/infrastructure/database/schema";
import type {
  CampaignStartAggregate,
  CampaignStartRepository,
} from "./startCampaign";

function timestamp(value: Date | null): number | null {
  return value ? value.getTime() : null;
}

function persistenceFailure(operation: string, error: unknown): EngineResult<never> {
  return engineFailure(
    "CAMPAIGN_START_PERSISTENCE_FAILED",
    error instanceof Error ? error.message : `Campaign ${operation} persistence failed.`,
    { details: { operation } },
  );
}

/** D1/Drizzle implementation of the campaign-start persistence boundary. */
export class D1CampaignStartRepository implements CampaignStartRepository {
  constructor(private readonly db: Database) {}

  async load(campaignId: string): Promise<CampaignStartAggregate | null> {
    const campaign = await this.db
      .select({
        id: campaigns.id,
        ownerUserId: campaigns.ownerUserId,
        status: campaigns.status,
        rulesetId: campaigns.rulesetId,
        rulesetVersion: campaigns.rulesetVersion,
        worldId: campaigns.worldId,
        generationSeed: campaigns.generationSeed,
        startRequestedAt: campaigns.startRequestedAt,
        startedAt: campaigns.startedAt,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .get();

    if (!campaign) return null;

    const campaignCharacters = await this.db
      .select({
        id: characters.id,
        status: characters.status,
        rulesetId: characters.rulesetId,
        rulesetVersion: characters.rulesetVersion,
      })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .all();

    return {
      ownerUserId: campaign.ownerUserId,
      generationSeed: campaign.generationSeed ?? campaign.id,
      campaign: {
        id: campaign.id,
        status: campaign.status,
        rulesetId: campaign.rulesetId,
        rulesetVersion: campaign.rulesetVersion,
        worldId: campaign.worldId,
        startRequestedAt: timestamp(campaign.startRequestedAt),
        startedAt: timestamp(campaign.startedAt),
      },
      characters: campaignCharacters,
    };
  }

  async begin(input: Parameters<CampaignStartRepository["begin"]>[0]): Promise<EngineResult<void>> {
    try {
      const results = await this.db.batch([
        this.db.insert(worlds).values({
          id: input.worldId,
          status: "generating",
          generationSeed: input.generationSeed,
          settings: {},
        }),
        this.db
          .update(campaigns)
          .set({
            status: "starting",
            worldId: input.worldId,
            startRequestedAt:
              input.campaign.startRequestedAt === null
                ? null
                : new Date(input.campaign.startRequestedAt),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(campaigns.id, input.campaign.id),
              inArray(campaigns.status, ["draft", "ready"]),
              isNull(campaigns.worldId),
            ),
          )
          .returning({ id: campaigns.id }),
      ]);

      const updatedCampaigns = results[1];
      if (updatedCampaigns.length === 0) {
        await this.db.delete(worlds).where(eq(worlds.id, input.worldId)).run();
        return engineFailure(
          "CAMPAIGN_START_CONFLICT",
          "The campaign changed while start was being requested. Reload it before trying again.",
        );
      }
      return engineSuccess(undefined);
    } catch (error) {
      return persistenceFailure("begin", error);
    }
  }

  async complete(
    input: Parameters<CampaignStartRepository["complete"]>[0],
  ): Promise<EngineResult<void>> {
    try {
      const settings = (input.generatedWorld.settings ?? {}) as WorldSettings;
      const completedAt = new Date(input.completedAt);
      const results = await this.db.batch([
        this.db
          .update(worlds)
          .set({
            status: "ready",
            generatedAt: completedAt,
            settings,
            ...(input.generatedWorld.name === undefined
              ? {}
              : { name: input.generatedWorld.name }),
            ...(input.generatedWorld.generatorVersion === undefined
              ? {}
              : { generatorVersion: input.generatedWorld.generatorVersion }),
            failedAt: null,
            failureReason: null,
            updatedAt: completedAt,
          })
          .where(and(eq(worlds.id, input.worldId), eq(worlds.status, "generating")))
          .returning({ id: worlds.id }),
        this.db
          .update(campaigns)
          .set({
            status: "active",
            startedAt: completedAt,
            updatedAt: completedAt,
          })
          .where(
            and(
              eq(campaigns.id, input.campaign.id),
              eq(campaigns.status, "starting"),
              eq(campaigns.worldId, input.worldId),
            ),
          )
          .returning({ id: campaigns.id }),
        this.db
          .update(characters)
          .set({ status: "active", updatedAt: completedAt })
          .where(
            and(
              eq(characters.campaignId, input.campaign.id),
              inArray(characters.id, [...input.readyCharacterIds]),
              eq(characters.status, "ready"),
            ),
          )
          .returning({ id: characters.id }),
        this.db
          .insert(gameSessions)
          .values({
            id: input.sessionId,
            campaignId: input.campaign.id,
            worldId: input.worldId,
            ordinal: 1,
            status: "active",
            startedAt: completedAt,
            updatedAt: completedAt,
          })
          .returning({ id: gameSessions.id }),
        this.db
          .insert(gameEvents)
          .values({
            id: crypto.randomUUID(),
            campaignId: input.campaign.id,
            sessionId: input.sessionId,
            sequence: 1,
            eventType: "campaign.started",
            occurredAt: completedAt,
            actorId: null,
            sourceId: null,
            targetIds: [...input.readyCharacterIds],
            payload: {
              worldId: input.worldId,
              characterIds: [...input.readyCharacterIds],
              ...(input.generatedWorld.generatorVersion === undefined
                ? {}
                : { generatorVersion: input.generatedWorld.generatorVersion }),
            },
            deltas: [],
          })
          .returning({ id: gameEvents.id }),
      ]);

      if (results[0].length === 0 || results[1].length === 0) {
        return engineFailure(
          "CAMPAIGN_START_CONFLICT",
          "Campaign or world state changed before start could be finalized.",
        );
      }
      if (results[2].length !== input.readyCharacterIds.length) {
        return engineFailure(
          "CAMPAIGN_CHARACTER_ACTIVATION_CONFLICT",
          "One or more ready characters changed before campaign activation completed.",
        );
      }
      if (results[3].length !== 1 || results[4].length !== 1) {
        return engineFailure(
          "CAMPAIGN_SESSION_INITIALIZATION_FAILED",
          "The campaign activated without a complete initial session history.",
        );
      }
      return engineSuccess(undefined);
    } catch (error) {
      return persistenceFailure("complete", error);
    }
  }

  async recover(
    input: Parameters<CampaignStartRepository["recover"]>[0],
  ): Promise<EngineResult<void>> {
    try {
      await this.db.batch([
        this.db
          .update(campaigns)
          .set({
            status: "ready",
            worldId: null,
            startRequestedAt: null,
            startedAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(campaigns.id, input.campaign.id),
              eq(campaigns.status, "starting"),
              eq(campaigns.worldId, input.failedWorldId),
            ),
          ),
        this.db
          .update(worlds)
          .set({
            status: "failed",
            failedAt: new Date(),
            failureReason: input.reason.slice(0, 500),
            updatedAt: new Date(),
          })
          .where(eq(worlds.id, input.failedWorldId)),
      ]);
      return engineSuccess(undefined);
    } catch (error) {
      return persistenceFailure("recovery", error);
    }
  }
}
