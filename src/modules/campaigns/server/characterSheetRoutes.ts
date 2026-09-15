/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characterClassLevels,
  characterFeats,
  characterInventory,
  characterSkills,
  characters,
  classes,
  classLevels,
  dnd35Characters,
  feats,
  gameActors,
  items,
  magicItems,
  races,
  skills,
  type CharacterMetadata,
} from "@/infrastructure/database/schema";
import { equipmentSlots } from "@/infrastructure/database/schema/dnd35/primitives";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  loadCharacterSheetSnapshot,
  type AbilityKey,
} from "@/modules/game/server/d1Dnd35State";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";

type Env = { Bindings: AuthEnv & { DB?: D1Database } };
type Database = ReturnType<typeof createDatabase>;
type CampaignRole = "owner" | "gm" | "player" | "observer";

const sheetPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    pronouns: z.string().trim().max(120).nullable().optional(),
    playerNotes: z.string().max(20_000).nullable().optional(),
    encumbranceEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one sheet field is required.");

const inventoryPatchSchema = z
  .object({
    location: z.enum(["carried", "stored", "party"]).optional(),
    equippedSlot: z.enum(equipmentSlots).nullable().optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one inventory field is required.");

function requireBinding(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign character storage is unavailable.");
  return binding;
}

async function requireCampaignAccess(
  db: Database,
  campaignId: string,
  userId: string,
): Promise<{ role: CampaignRole; status: string }> {
  const campaign = await db
    .select({ ownerUserId: campaigns.ownerUserId, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.status !== "active" && campaign.status !== "paused") {
    throw new ConflictError("The campaign must be active or paused before using the live sheet.");
  }
  if (campaign.ownerUserId === userId) return { role: "owner", status: campaign.status };

  const membership = await db
    .select({ role: campaignMemberships.role, status: campaignMemberships.status })
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
  return { role: membership.role, status: campaign.status };
}

async function loadCharacterAccess(
  db: Database,
  campaignId: string,
  characterId: string,
  userId: string,
) {
  const access = await requireCampaignAccess(db, campaignId, userId);
  const character = await db
    .select()
    .from(characters)
    .where(and(eq(characters.id, characterId), eq(characters.campaignId, campaignId)))
    .get();
  if (!character) throw new NotFoundError("Character not found in this campaign.");

  const actor = await db
    .select({ id: gameActors.id, controllerUserId: gameActors.controllerUserId })
    .from(gameActors)
    .where(
      and(eq(gameActors.campaignId, campaignId), eq(gameActors.characterId, characterId)),
    )
    .get();

  const canEdit =
    access.role === "owner" ||
    access.role === "gm" ||
    character.ownerUserId === userId ||
    actor?.controllerUserId === userId;

  return {
    ...access,
    character,
    actorId: actor?.id ?? null,
    canEdit,
    canManageInventory: access.role === "owner" || access.role === "gm",
  };
}

function publicClassLevels(
  rows: Array<{
    classId: string;
    className: string;
    classLevel: number;
    characterLevel: number;
    track: number;
  }>,
) {
  const grouped = new Map<
    string,
    { classId: string; name: string; level: number; track: number; lastCharacterLevel: number }
  >();
  for (const row of rows) {
    const key = `${row.track}:${row.classId}`;
    const existing = grouped.get(key);
    if (!existing || row.classLevel > existing.level) {
      grouped.set(key, {
        classId: row.classId,
        name: row.className,
        level: row.classLevel,
        track: row.track,
        lastCharacterLevel: row.characterLevel,
      });
    }
  }
  return [...grouped.values()].sort(
    (a, b) => a.track - b.track || a.lastCharacterLevel - b.lastCharacterLevel || a.name.localeCompare(b.name),
  );
}

export const campaignCharacterSheetRoutes = new Hono<Env>()
  .use("/api/campaigns/:campaignId/play/characters/:characterId/sheet*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .use("/api/campaigns/:campaignId/play/characters/:characterId/inventory*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/campaigns/:campaignId/play/characters/:characterId/sheet", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireBinding(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    const access = await loadCharacterAccess(db, campaignId, characterId, session.user.id);

    const [extension, snapshot, race, classRows, inventoryRows, skillRows, featRows] =
      await Promise.all([
        db
          .select()
          .from(dnd35Characters)
          .where(eq(dnd35Characters.characterId, characterId))
          .get(),
        loadCharacterSheetSnapshot({ db, campaignId, characterId }),
        db
          .select({
            id: races.id,
            name: races.name,
            size: races.size,
            baseSpeedFeet: races.baseSpeedFeet,
          })
          .from(dnd35Characters)
          .innerJoin(races, eq(dnd35Characters.raceId, races.id))
          .where(eq(dnd35Characters.characterId, characterId))
          .get(),
        db
          .select({
            classId: classLevels.classId,
            className: classes.name,
            classLevel: classLevels.level,
            characterLevel: characterClassLevels.characterLevel,
            track: characterClassLevels.track,
          })
          .from(characterClassLevels)
          .innerJoin(classLevels, eq(characterClassLevels.classLevelId, classLevels.id))
          .innerJoin(classes, eq(classLevels.classId, classes.id))
          .where(eq(characterClassLevels.characterId, characterId))
          .orderBy(asc(characterClassLevels.track), asc(characterClassLevels.characterLevel))
          .all(),
        db
          .select({
            id: characterInventory.id,
            itemId: characterInventory.itemId,
            instanceId: characterInventory.instanceId,
            name: items.name,
            category: items.category,
            quantity: characterInventory.quantity,
            weightPounds: items.weightPounds,
            priceCopper: items.priceCopper,
            equipped: characterInventory.equipped,
            equippedSlot: characterInventory.equippedSlot,
            suggestedSlot: magicItems.slot,
            location: characterInventory.location,
            notes: characterInventory.notes,
          })
          .from(characterInventory)
          .innerJoin(items, eq(characterInventory.itemId, items.id))
          .leftJoin(magicItems, eq(items.id, magicItems.itemId))
          .where(eq(characterInventory.characterId, characterId))
          .orderBy(asc(characterInventory.location), asc(items.name), asc(characterInventory.id))
          .all(),
        db
          .select({
            id: skills.id,
            name: skills.name,
            ability: skills.ability,
            specialization: characterSkills.specialization,
            ranks: characterSkills.ranks,
            trainedOnly: skills.trainedOnly,
            armorCheckMultiplier: skills.armorCheckMultiplier,
          })
          .from(characterSkills)
          .innerJoin(skills, eq(characterSkills.skillId, skills.id))
          .where(eq(characterSkills.characterId, characterId))
          .orderBy(asc(skills.name), asc(characterSkills.specialization))
          .all(),
        db
          .select({
            id: characterFeats.id,
            featId: characterFeats.featId,
            name: feats.name,
            occurrence: characterFeats.occurrence,
            gainedAtLevel: characterFeats.gainedAtLevel,
            grantKind: characterFeats.grantKind,
            choices: characterFeats.choices,
          })
          .from(characterFeats)
          .innerJoin(feats, eq(characterFeats.featId, feats.id))
          .where(eq(characterFeats.characterId, characterId))
          .orderBy(asc(feats.name), asc(characterFeats.occurrence))
          .all(),
      ]);

    if (!extension || !snapshot) {
      throw new ConflictError("The live D&D 3.5 character sheet is not ready for this character.");
    }

    const metadata = access.character.metadata ?? {};
    const abilityModifierFor = (ability: string | null): number => {
      if (!ability || !(ability in snapshot.abilities)) return 0;
      return snapshot.abilities[ability as AbilityKey].modifier;
    };

    return c.json({
      campaignStatus: access.status,
      character: {
        id: access.character.id,
        actorId: access.actorId,
        name: access.character.name,
        status: access.character.status,
        pronouns: metadata.pronouns ?? null,
        playerNotes: metadata.playerNotes ?? "",
        alignment: extension.alignment,
        experiencePoints: extension.experiencePoints,
        progressionMode: extension.progressionMode,
        race: race ?? null,
        classes: publicClassLevels(classRows),
      },
      permissions: {
        canEdit: access.canEdit,
        canArrangeInventory: access.canEdit,
        canManageInventory: access.canManageInventory,
      },
      abilities: snapshot.abilities,
      combat: {
        characterLevel: snapshot.characterLevel,
        baseAttackBonus: snapshot.baseAttackBonus,
        armorClass: snapshot.armorClass,
        saves: snapshot.saves,
        initiative: snapshot.initiative,
        grapple: snapshot.grapple,
        health: snapshot.health,
      },
      encumbrance: snapshot.encumbrance,
      inventory: inventoryRows.map((entry) => ({
        ...entry,
        totalWeightPounds:
          entry.weightPounds === null ? null : entry.weightPounds * entry.quantity,
        suggestedSlot:
          entry.suggestedSlot ??
          (entry.category === "armor"
            ? "body"
            : entry.category === "shield"
              ? "shield"
              : entry.category === "weapon"
                ? "main_hand"
                : null),
      })),
      skills: skillRows.map((skill) => ({
        ...skill,
        total:
          skill.ability === null
            ? skill.ranks
            : skill.ranks +
              abilityModifierFor(skill.ability) +
              snapshot.encumbrance.armorCheckPenalty * skill.armorCheckMultiplier,
      })),
      feats: featRows,
      equipmentSlots,
    });
  })
  .patch("/api/campaigns/:campaignId/play/characters/:characterId/sheet", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireBinding(c.env.DB));
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    const access = await loadCharacterAccess(db, campaignId, characterId, session.user.id);
    if (!access.canEdit) throw new ForbiddenError("You cannot edit this live character sheet.");

    const parsed = sheetPatchSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new ValidationError("The character sheet update is invalid.");
    const input = parsed.data;
    const now = new Date();

    if (input.name !== undefined || input.pronouns !== undefined || input.playerNotes !== undefined) {
      const currentMetadata: CharacterMetadata = access.character.metadata ?? {};
      const metadata: CharacterMetadata = { ...currentMetadata };
      if (input.pronouns !== undefined) {
        if (input.pronouns === null || input.pronouns === "") delete metadata.pronouns;
        else metadata.pronouns = input.pronouns;
      }
      if (input.playerNotes !== undefined) {
        if (input.playerNotes === null || input.playerNotes === "") delete metadata.playerNotes;
        else metadata.playerNotes = input.playerNotes;
      }
      await db
        .update(characters)
        .set({
          ...(input.name === undefined ? {} : { name: input.name }),
          metadata,
          updatedAt: now,
        })
        .where(eq(characters.id, characterId))
        .run();
    }

    if (input.encumbranceEnabled !== undefined) {
      await db
        .update(dnd35Characters)
        .set({ encumbranceEnabled: input.encumbranceEnabled, updatedAt: now })
        .where(eq(dnd35Characters.characterId, characterId))
        .run();
    }

    return c.json({ ok: true });
  })
  .patch(
    "/api/campaigns/:campaignId/play/characters/:characterId/inventory/:inventoryId",
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const db = createDatabase(requireBinding(c.env.DB));
      const campaignId = c.req.param("campaignId");
      const characterId = c.req.param("characterId");
      const access = await loadCharacterAccess(db, campaignId, characterId, session.user.id);
      if (!access.canEdit) throw new ForbiddenError("You cannot arrange this character's inventory.");

      const parsed = inventoryPatchSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) throw new ValidationError("The inventory update is invalid.");
      const input = parsed.data;
      const inventoryId = c.req.param("inventoryId");
      const existing = await db
        .select()
        .from(characterInventory)
        .where(
          and(
            eq(characterInventory.id, inventoryId),
            eq(characterInventory.characterId, characterId),
          ),
        )
        .get();
      if (!existing) throw new NotFoundError("Inventory item not found for this character.");

      const location = input.location ?? existing.location;
      let equippedSlot =
        input.equippedSlot === undefined ? existing.equippedSlot : input.equippedSlot;
      if (location !== "carried") equippedSlot = null;
      const equipped = equippedSlot !== null;

      if (equippedSlot && equippedSlot !== "slotless" && equippedSlot !== "other") {
        const conflict = await db
          .select({ id: characterInventory.id })
          .from(characterInventory)
          .where(
            and(
              eq(characterInventory.characterId, characterId),
              eq(characterInventory.equipped, true),
              eq(characterInventory.equippedSlot, equippedSlot),
              ne(characterInventory.id, inventoryId),
            ),
          )
          .get();
        if (conflict) {
          throw new ConflictError(`Another item already occupies the ${equippedSlot} slot.`);
        }
      }

      await db
        .update(characterInventory)
        .set({
          location,
          equipped,
          equippedSlot,
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(characterInventory.id, inventoryId),
            eq(characterInventory.characterId, characterId),
          ),
        )
        .run();

      const updated = await db
        .select()
        .from(characterInventory)
        .where(eq(characterInventory.id, inventoryId))
        .get();
      return c.json({ item: updated });
    },
  )
  .get(
    "/api/campaigns/:campaignId/play/characters/:characterId/inventory/catalog",
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const binding = requireBinding(c.env.DB);
      const db = createDatabase(binding);
      const campaignId = c.req.param("campaignId");
      const characterId = c.req.param("characterId");
      const access = await loadCharacterAccess(db, campaignId, characterId, session.user.id);
      if (!access.canManageInventory) {
        throw new ForbiddenError("Only the campaign owner or Game Master can grant catalog items.");
      }

      const query = (c.req.query("q") ?? "").trim().slice(0, 120);
      if (query.length < 2) return c.json({ items: [] });
      const pattern = `%${query.toLocaleLowerCase()}%`;
      const result = await binding
        .prepare(
          `SELECT item.id,
                  item.name,
                  item.category,
                  item.weight_pounds AS weightPounds,
                  item.price_copper AS priceCopper,
                  magic.slot AS suggestedSlot
           FROM dnd35_items item
           LEFT JOIN dnd35_magic_items magic ON magic.item_id = item.id
           WHERE item.is_enabled = 1
             AND (item.owner_user_id IS NULL OR item.owner_user_id = ?)
             AND (lower(item.name) LIKE ? OR lower(item.slug) LIKE ?)
           ORDER BY CASE WHEN lower(item.name) = lower(?) THEN 0 ELSE 1 END,
                    item.name,
                    item.id
           LIMIT 30`,
        )
        .bind(session.user.id, pattern, pattern, query)
        .all<{
          id: string;
          name: string;
          category: string;
          weightPounds: number | null;
          priceCopper: number | null;
          suggestedSlot: (typeof equipmentSlots)[number] | null;
        }>();
      return c.json({ items: result.results });
    },
  );
