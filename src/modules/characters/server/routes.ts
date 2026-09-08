/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characterAbilityScores,
  characterClassLevels,
  characters,
  dnd35Characters,
  raceAbilities,
  type CharacterMetadata,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { reconcileCampaignReadiness } from "@/modules/campaigns/domain/lifecycle";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import { abilityModifier } from "@/rulesets/dnd35";
import { validateDnd35CharacterReadiness } from "../domain/readiness";

interface CharacterBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterEnv = { Bindings: CharacterBindings };

const characterMetadataSchema = z.object({
  portraitObjectKey: z.string().trim().min(1).max(500).optional(),
  pronouns: z.string().trim().max(120).optional(),
  playerNotes: z.string().max(20000).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

type CharacterMetadataInput = z.infer<typeof characterMetadataSchema>;

function normalizeMetadata(value: CharacterMetadataInput): CharacterMetadata {
  const metadata: CharacterMetadata = {};
  if (value.portraitObjectKey !== undefined) metadata.portraitObjectKey = value.portraitObjectKey;
  if (value.pronouns !== undefined) metadata.pronouns = value.pronouns;
  if (value.playerNotes !== undefined) metadata.playerNotes = value.playerNotes;
  if (value.extensions !== undefined) metadata.extensions = value.extensions;
  return metadata;
}

const createCharacterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  metadata: characterMetadataSchema.optional(),
});

const updateCharacterSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    metadata: characterMetadataSchema.optional(),
    raceId: z.string().trim().min(1).nullable().optional(),
    alignment: z
      .enum(["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one character field is required.");

const abilityScoresSchema = z.object({
  str: z.number().int().min(0).max(100),
  dex: z.number().int().min(0).max(100),
  con: z.number().int().min(0).max(100),
  int: z.number().int().min(0).max(100),
  wis: z.number().int().min(0).max(100),
  cha: z.number().int().min(0).max(100),
});

const addClassLevelSchema = z.object({
  classLevelId: z.string().trim().min(1),
  hitPointsGained: z.number().int().positive(),
  skillPointsSpent: z.number().int().nonnegative().default(0),
  track: z.union([z.literal(1), z.literal(2)]).default(1),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character storage is unavailable.");
  return binding;
}

async function canUseCampaign(input: {
  db: ReturnType<typeof createDatabase>;
  campaignId: string;
  userId: string;
}) {
  const campaign = await input.db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === input.userId) return campaign;

  const membership = await input.db
    .select({ role: campaignMemberships.role, status: campaignMemberships.status })
    .from(campaignMemberships)
    .where(
      and(
        eq(campaignMemberships.campaignId, input.campaignId),
        eq(campaignMemberships.userId, input.userId),
      ),
    )
    .get();
  if (
    !membership ||
    membership.status !== "active" ||
    !["owner", "gm", "player"].includes(membership.role)
  ) {
    throw new ForbiddenError("You cannot create characters in this campaign.");
  }
  return campaign;
}

async function requireCharacterEditor(input: {
  db: ReturnType<typeof createDatabase>;
  characterId: string;
  userId: string;
}) {
  const row = await input.db
    .select({ character: characters, campaign: campaigns })
    .from(characters)
    .innerJoin(campaigns, eq(characters.campaignId, campaigns.id))
    .where(eq(characters.id, input.characterId))
    .get();
  if (!row) throw new NotFoundError("Character not found.");
  if (row.character.ownerUserId !== input.userId && row.campaign.ownerUserId !== input.userId) {
    throw new ForbiddenError("You cannot edit this character.");
  }
  if (row.campaign.status !== "draft" && row.campaign.status !== "ready") {
    throw new ConflictError("Characters cannot be edited after campaign start begins.");
  }
  if (
    row.character.status === "active" ||
    row.character.status === "retired" ||
    row.character.status === "archived"
  ) {
    throw new ConflictError("This character is no longer editable as a pre-start draft.");
  }
  return row;
}

export const characterRoutes = new Hono<CharacterEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .post(
    "/api/campaigns/:campaignId/characters",
    zValidator("json", createCharacterSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireDatabase(c.env.DB));
      const campaign = await canUseCampaign({
        db,
        campaignId: c.req.param("campaignId"),
        userId: session.user.id,
      });
      if (campaign.status !== "draft" && campaign.status !== "ready") {
        throw new ConflictError("New characters can only be created before campaign start.");
      }
      if (campaign.rulesetId !== "dnd35" || campaign.rulesetVersion !== "3.5") {
        throw new ValidationError("This character creator currently supports D&D 3.5 campaigns only.");
      }

      const id = crypto.randomUUID();
      await db.batch([
        db.insert(characters).values({
          id,
          campaignId: campaign.id,
          ownerUserId: session.user.id,
          rulesetId: campaign.rulesetId,
          rulesetVersion: campaign.rulesetVersion,
          name: input.name,
          status: "draft",
          metadata: input.metadata === undefined ? {} : normalizeMetadata(input.metadata),
        }),
        db.insert(dnd35Characters).values({
          characterId: id,
          alignment: "N",
          progressionMode: "standard",
          encumbranceEnabled: true,
        }),
      ]);

      return c.json(
        await db.select().from(characters).where(eq(characters.id, id)).get(),
        201,
      );
    },
  )
  .get("/api/characters/:characterId", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const row = await requireCharacterEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const [dnd35, abilities, classLevels] = await Promise.all([
      db
        .select()
        .from(dnd35Characters)
        .where(eq(dnd35Characters.characterId, row.character.id))
        .get(),
      db
        .select()
        .from(characterAbilityScores)
        .where(eq(characterAbilityScores.characterId, row.character.id))
        .all(),
      db
        .select()
        .from(characterClassLevels)
        .where(eq(characterClassLevels.characterId, row.character.id))
        .orderBy(characterClassLevels.track, characterClassLevels.characterLevel)
        .all(),
    ]);
    return c.json({
      character: row.character,
      campaign: {
        id: row.campaign.id,
        name: row.campaign.name,
        status: row.campaign.status,
        rulesetId: row.campaign.rulesetId,
        rulesetVersion: row.campaign.rulesetVersion,
      },
      dnd35: dnd35 ?? null,
      abilityScores: abilities,
      classLevels,
    });
  })
  .patch(
    "/api/characters/:characterId",
    zValidator("json", updateCharacterSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireDatabase(c.env.DB));
      const row = await requireCharacterEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });

      const genericUpdate = {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.metadata === undefined ? {} : { metadata: normalizeMetadata(input.metadata) }),
        updatedAt: new Date(),
      };
      const dndUpdate = {
        ...(input.raceId === undefined ? {} : { raceId: input.raceId }),
        ...(input.alignment === undefined ? {} : { alignment: input.alignment }),
        updatedAt: new Date(),
      };

      await db.batch([
        db.update(characters).set(genericUpdate).where(eq(characters.id, row.character.id)),
        db
          .update(dnd35Characters)
          .set(dndUpdate)
          .where(eq(dnd35Characters.characterId, row.character.id)),
      ]);
      return c.json(
        await db.select().from(characters).where(eq(characters.id, row.character.id)).get(),
      );
    },
  )
  .put(
    "/api/characters/:characterId/abilities",
    zValidator("json", abilityScoresSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireDatabase(c.env.DB));
      const row = await requireCharacterEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const now = new Date();
      await db.batch([
        db
          .delete(characterAbilityScores)
          .where(eq(characterAbilityScores.characterId, row.character.id)),
        db.insert(characterAbilityScores).values(
          (Object.entries(input) as Array<[keyof typeof input, number]>).map(
            ([ability, baseScore]) => ({
              characterId: row.character.id,
              ability,
              baseScore,
              createdAt: now,
              updatedAt: now,
            }),
          ),
        ),
      ]);
      return c.json({ characterId: row.character.id, abilityScores: input });
    },
  )
  .post(
    "/api/characters/:characterId/class-levels",
    zValidator("json", addClassLevelSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireDatabase(c.env.DB));
      const row = await requireCharacterEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const latest = await db
        .select({ characterLevel: characterClassLevels.characterLevel })
        .from(characterClassLevels)
        .where(
          and(
            eq(characterClassLevels.characterId, row.character.id),
            eq(characterClassLevels.track, input.track),
          ),
        )
        .orderBy(desc(characterClassLevels.characterLevel))
        .limit(1)
        .get();
      const characterLevel = (latest?.characterLevel ?? 0) + 1;
      const id = crypto.randomUUID();
      await db.insert(characterClassLevels).values({
        id,
        characterId: row.character.id,
        classLevelId: input.classLevelId,
        characterLevel,
        track: input.track,
        hitPointsGained: input.hitPointsGained,
        skillPointsSpent: input.skillPointsSpent,
      });
      return c.json({ id, characterLevel, ...input }, 201);
    },
  )
  .post("/api/characters/:characterId/ready", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));
    const row = await requireCharacterEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const [extension, abilityRows, classRows] = await Promise.all([
      db
        .select()
        .from(dnd35Characters)
        .where(eq(dnd35Characters.characterId, row.character.id))
        .get(),
      db
        .select({
          ability: characterAbilityScores.ability,
          baseScore: characterAbilityScores.baseScore,
        })
        .from(characterAbilityScores)
        .where(eq(characterAbilityScores.characterId, row.character.id))
        .all(),
      db
        .select({ hitPointsGained: characterClassLevels.hitPointsGained })
        .from(characterClassLevels)
        .where(eq(characterClassLevels.characterId, row.character.id))
        .all(),
    ]);

    const abilityScores = Object.fromEntries(
      abilityRows.map((ability) => [ability.ability, ability.baseScore]),
    ) as Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number | null>>;
    const readiness = validateDnd35CharacterReadiness({
      extensionPresent: Boolean(extension),
      raceId: extension?.raceId ?? null,
      abilityScores,
      classLevelCount: classRows.length,
    });
    if (!readiness.ok) {
      throw new ValidationError("Character is not ready to play.", {
        issues: readiness.errors,
      });
    }

    const conScore = abilityScores.con;
    if (conScore === undefined || conScore === null) {
      throw new ValidationError("A Constitution score is required for a playable character.");
    }
    const racialConstitution = extension?.raceId
      ? await db
          .select({ modifier: raceAbilities.modifier })
          .from(raceAbilities)
          .where(
            and(
              eq(raceAbilities.raceId, extension.raceId),
              eq(raceAbilities.ability, "con"),
            ),
          )
          .get()
      : undefined;
    const effectiveConstitution = conScore + (racialConstitution?.modifier ?? 0);
    const conModifier = abilityModifier(effectiveConstitution);
    const maximumHitPoints = classRows.reduce(
      (total, level) => total + Math.max(1, level.hitPointsGained + conModifier),
      0,
    );
    const now = new Date();

    await db.batch([
      db
        .update(characters)
        .set({ status: "ready", readyAt: now, updatedAt: now })
        .where(eq(characters.id, row.character.id)),
      db
        .update(dnd35Characters)
        .set({ currentHitPoints: maximumHitPoints, updatedAt: now })
        .where(eq(dnd35Characters.characterId, row.character.id)),
    ]);

    const campaignCharacters = await db
      .select({
        id: characters.id,
        status: characters.status,
        rulesetId: characters.rulesetId,
        rulesetVersion: characters.rulesetVersion,
      })
      .from(characters)
      .where(eq(characters.campaignId, row.campaign.id))
      .all();
    const reconciled = reconcileCampaignReadiness({
      campaign: {
        id: row.campaign.id,
        status: row.campaign.status,
        rulesetId: row.campaign.rulesetId,
        rulesetVersion: row.campaign.rulesetVersion,
        worldId: row.campaign.worldId,
        startRequestedAt: row.campaign.startRequestedAt?.getTime() ?? null,
        startedAt: row.campaign.startedAt?.getTime() ?? null,
      },
      characters: campaignCharacters,
    });
    if (reconciled.status !== row.campaign.status) {
      await db
        .update(campaigns)
        .set({
          status: reconciled.status,
          readyAt: reconciled.status === "ready" ? now : null,
          updatedAt: now,
        })
        .where(eq(campaigns.id, row.campaign.id))
        .run();
    }

    return c.json({
      characterId: row.character.id,
      status: "ready",
      maximumHitPoints,
      campaignStatus: reconciled.status,
    });
  });
