/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";

type Env = { Bindings: AuthEnv & { DB?: D1Database } };

const deleteCampaignSchema = z.object({
  confirmationName: z.string().max(120),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign storage is unavailable.");
  return binding;
}

export const campaignDeleteRoutes = new Hono<Env>().delete(
  "/api/campaigns/:campaignId",
  zValidator("json", deleteCampaignSchema),
  async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const { confirmationName } = c.req.valid("json");

    const campaign = await db
      .prepare(
        `SELECT id, owner_user_id AS ownerUserId, name, world_id AS worldId
         FROM campaigns
         WHERE id = ?
         LIMIT 1`,
      )
      .bind(campaignId)
      .first<{ id: string; ownerUserId: string; name: string; worldId: string | null }>();

    if (!campaign) throw new NotFoundError("Campaign not found.");
    if (campaign.ownerUserId !== session.user.id) {
      throw new ForbiddenError("Only the campaign owner can delete this campaign.");
    }
    if (confirmationName !== campaign.name) {
      throw new ValidationError("Enter the campaign name exactly to confirm deletion.");
    }

    // Delete the campaign first so the campaigns.world_id restrict reference no longer
    // blocks removal of the generated world. Campaign-scoped children cascade from the
    // campaign record according to the schema foreign keys.
    await db.prepare("DELETE FROM campaigns WHERE id = ?").bind(campaign.id).run();
    if (campaign.worldId) {
      await db.prepare("DELETE FROM worlds WHERE id = ?").bind(campaign.worldId).run();
    }

    return c.json({ deleted: true, campaignId: campaign.id, name: campaign.name });
  },
);
