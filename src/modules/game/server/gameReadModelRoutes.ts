/// <reference types="@cloudflare/workers-types" />

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import { campaignMemberships, campaigns } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import { getCampaignGameReadModel } from "./gameReadModelService";

interface Bindings extends AuthEnv {
  DB?: D1Database;
}

type Env = { Bindings: Bindings };

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Game storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
}) {
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

export const gameReadModelRoutes = new Hono<Env>()
  .get("/api/campaigns/:campaignId/game/state", async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireDatabase(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    await requireCampaignAccess({ db, campaignId, userId: session.user.id });

    const query = z
      .object({
        afterSequence: z.coerce.number().int().min(0).optional(),
        eventLimit: z.coerce.number().int().min(1).max(500).optional(),
      })
      .safeParse(c.req.query());
    if (!query.success) throw new ValidationError("Invalid game state query parameters.");

    try {
      return c.json(
        await getCampaignGameReadModel(
          { db, binding },
          {
            campaignId,
            ...(query.data.afterSequence === undefined
              ? {}
              : { afterSequence: query.data.afterSequence }),
            ...(query.data.eventLimit === undefined ? {} : { eventLimit: query.data.eventLimit }),
          },
        ),
      );
    } catch (error) {
      if (error instanceof RangeError) throw new ValidationError(error.message);
      if (error instanceof Error && error.message === "CAMPAIGN_GAME_NOT_ACTIVE") {
        throw new ConflictError("This campaign does not currently have an active game session.");
      }
      throw error;
    }
  });
