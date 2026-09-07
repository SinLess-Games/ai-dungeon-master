/// <reference types="@cloudflare/workers-types" />

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import type { CampaignRoom } from "../live/CampaignRoom";

interface LiveBindings extends AuthEnv {
  DB?: D1Database;
  CAMPAIGN_ROOM?: DurableObjectNamespace<CampaignRoom>;
}

type LiveEnv = { Bindings: LiveBindings };

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign storage is unavailable.");
  return binding;
}

function requireRoom(
  binding: DurableObjectNamespace<CampaignRoom> | undefined,
): DurableObjectNamespace<CampaignRoom> {
  if (!binding) throw new ServiceUnavailableError("Live campaign coordination is unavailable.");
  return binding;
}

async function requireCampaignAccess(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
}): Promise<void> {
  const campaign = await input.db
    .select({ ownerUserId: campaigns.ownerUserId })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return;

  const membership = await input.db
    .select({ status: campaignMemberships.status })
    .from(campaignMemberships)
    .where(
      and(
        eq(campaignMemberships.campaignId, input.campaignId),
        eq(campaignMemberships.userId, input.userId),
      ),
    )
    .get();
  if (!membership || membership.status !== "active") {
    throw new ForbiddenError("You do not have access to this campaign.");
  }
}

export const gameLiveRoutes = new Hono<LiveEnv>()
  .get("/api/campaigns/:campaignId/live", async (c) => {
    if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
      throw new ValidationError("This endpoint requires a WebSocket upgrade.");
    }

    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const campaignId = c.req.param("campaignId");
    await requireCampaignAccess({ db, campaignId, userId: session.user.id });

    const stub = requireRoom(c.env.CAMPAIGN_ROOM).getByName(campaignId);
    const headers = new Headers(c.req.raw.headers);
    headers.set("x-endless-codex-campaign-id", campaignId);
    headers.set("x-endless-codex-user-id", session.user.id);

    return stub.fetch(new Request(c.req.raw, { headers }));
  })
  .get("/api/campaigns/:campaignId/live/presence", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const campaignId = c.req.param("campaignId");
    await requireCampaignAccess({ db, campaignId, userId: session.user.id });

    const presence = await requireRoom(c.env.CAMPAIGN_ROOM).getByName(campaignId).presence();
    c.header("Cache-Control", "no-store");
    return c.json(presence);
  });
