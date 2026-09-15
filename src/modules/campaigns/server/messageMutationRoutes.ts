/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { z } from "zod";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import {
  deleteCampaignMessage,
  editCampaignMessage,
  type CampaignMessageRole,
} from "./messageMutationService";

interface Bindings extends AuthEnv {
  DB?: D1Database;
}

type Env = { Bindings: Bindings };

const editMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign play storage is unavailable.");
  return binding;
}

async function requireCampaignRole(
  db: D1Database,
  campaignId: string,
  userId: string,
): Promise<CampaignMessageRole> {
  const campaign = await db
    .prepare(
      `SELECT owner_user_id AS ownerUserId, status
       FROM campaigns
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(campaignId)
    .first<{ ownerUserId: string; status: string }>();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.status !== "active" && campaign.status !== "paused") {
    throw new ConflictError("Campaign messages can only be changed while the campaign is active or paused.");
  }

  if (campaign.ownerUserId === userId) return "owner";

  const membership = await db
    .prepare(
      `SELECT role, status
       FROM campaign_memberships
       WHERE campaign_id = ? AND user_id = ?
       LIMIT 1`,
    )
    .bind(campaignId, userId)
    .first<{ role: CampaignMessageRole; status: string }>();
  if (!membership || membership.status !== "active") {
    throw new ForbiddenError("You do not have access to this campaign.");
  }
  return membership.role;
}

export const campaignMessageMutationRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/play/messages/:messageId*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .patch("/api/campaigns/:campaignId/play/messages/:messageId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const messageId = c.req.param("messageId");
    const role = await requireCampaignRole(db, campaignId, session.user.id);

    const body = await c.req.json().catch(() => null);
    const parsed = editMessageSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Campaign message content is invalid.");

    const message = await editCampaignMessage(db, {
      campaignId,
      messageId,
      userId: session.user.id,
      role,
      content: parsed.data.content,
    });

    return c.json({ message });
  })
  .delete("/api/campaigns/:campaignId/play/messages/:messageId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const messageId = c.req.param("messageId");
    const role = await requireCampaignRole(db, campaignId, session.user.id);

    const deleted = await deleteCampaignMessage(db, {
      campaignId,
      messageId,
      userId: session.user.id,
      role,
    });

    return c.json({ ok: true as const, id: deleted.id });
  });
