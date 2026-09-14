import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import { campaigns, gameSessions } from "@/infrastructure/database/schema";
import type { ActiveGameContext } from "./d1Dnd35State";

/**
 * Hydration context for campaign-play reads.
 *
 * Pausing a campaign freezes authoritative actions but intentionally leaves the
 * active session intact so the table can still hydrate its world, actors,
 * encounter, and history. Command/casting services continue to use
 * `loadActiveGameContext`, which only accepts an active campaign.
 */
export async function loadPlayableGameContext(
  db: Database,
  campaignId: string,
): Promise<ActiveGameContext | null> {
  const campaign = await db
    .select({
      id: campaigns.id,
      status: campaigns.status,
      worldId: campaigns.worldId,
      rulesetId: campaigns.rulesetId,
      rulesetVersion: campaigns.rulesetVersion,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        inArray(campaigns.status, ["active", "paused"]),
      ),
    )
    .get();
  if (!campaign?.worldId) return null;

  const session = await db
    .select({ id: gameSessions.id, worldId: gameSessions.worldId })
    .from(gameSessions)
    .where(and(eq(gameSessions.campaignId, campaignId), eq(gameSessions.status, "active")))
    .orderBy(desc(gameSessions.ordinal))
    .limit(1)
    .get();
  if (!session || session.worldId !== campaign.worldId) return null;

  return {
    campaignId: campaign.id,
    worldId: campaign.worldId,
    sessionId: session.id,
    rulesetId: campaign.rulesetId,
    rulesetVersion: campaign.rulesetVersion,
  };
}
