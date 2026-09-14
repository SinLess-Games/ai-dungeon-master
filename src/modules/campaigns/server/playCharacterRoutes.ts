/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characters,
  characterSkills,
  skills,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/server/middleware/errors";

type Env = { Bindings: AuthEnv & { DB?: D1Database } };

type Database = ReturnType<typeof createDatabase>;

function requireDatabase(binding: D1Database | undefined): Database {
  if (!binding) throw new ServiceUnavailableError("Campaign play storage is unavailable.");
  return createDatabase(binding);
}

async function requireCampaignAccess(
  db: Database,
  campaignId: string,
  userId: string,
): Promise<void> {
  const campaign = await db
    .select({ ownerUserId: campaigns.ownerUserId, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");

  if (campaign.ownerUserId !== userId) {
    const membership = await db
      .select({ status: campaignMemberships.status })
      .from(campaignMemberships)
      .where(
        and(
          eq(campaignMemberships.campaignId, campaignId),
          eq(campaignMemberships.userId, userId),
        ),
      )
      .get();
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this campaign.");
    }
  }

  if (campaign.status !== "active" && campaign.status !== "paused") {
    throw new ConflictError("The campaign must be active or paused before using campaign play.");
  }
}

export const campaignPlayCharacterRoutes = new Hono<Env>().get(
  "/api/campaigns/:campaignId/play/characters/:characterId/checks",
  async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    await requireCampaignAccess(db, campaignId, session.user.id);

    const character = await db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.campaignId, campaignId)))
      .get();
    if (!character) throw new NotFoundError("Character not found in this campaign.");

    const [trained, untrained] = await Promise.all([
      db
        .select({
          id: skills.id,
          slug: skills.slug,
          name: skills.name,
          ability: skills.ability,
          specialization: characterSkills.specialization,
          ranks: characterSkills.ranks,
          trainedOnly: skills.trainedOnly,
        })
        .from(characterSkills)
        .innerJoin(skills, eq(characterSkills.skillId, skills.id))
        .where(
          and(
            eq(characterSkills.characterId, characterId),
            eq(skills.isEnabled, true),
            or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(skills.name), asc(characterSkills.specialization))
        .all(),
      db
        .select({
          id: skills.id,
          slug: skills.slug,
          name: skills.name,
          ability: skills.ability,
          trainedOnly: skills.trainedOnly,
        })
        .from(skills)
        .where(
          and(
            eq(skills.isEnabled, true),
            eq(skills.trainedOnly, false),
            eq(skills.requiresSpecialization, false),
            or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(skills.name))
        .all(),
    ]);

    const options = new Map<string, {
      id: string;
      slug: string;
      name: string;
      ability: string | null;
      specialization: string;
      ranks: number;
      trainedOnly: boolean;
    }>();

    for (const skill of untrained) {
      if (skill.slug === "speak-language") continue;
      options.set(`${skill.id}\u0000`, {
        ...skill,
        specialization: "",
        ranks: 0,
      });
    }
    for (const skill of trained) {
      if (skill.slug === "speak-language") continue;
      const specialization = skill.specialization ?? "";
      options.set(`${skill.id}\u0000${specialization.toLocaleLowerCase()}`, {
        ...skill,
        specialization,
      });
    }

    return c.json({
      character: { id: character.id, name: character.name },
      skills: [...options.values()].sort((a, b) =>
        `${a.name}\u0000${a.specialization}`.localeCompare(`${b.name}\u0000${b.specialization}`),
      ),
      saves: ["fort", "ref", "will"] as const,
    });
  },
);
