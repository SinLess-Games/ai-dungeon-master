/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characters,
  characterInventory,
  characterSkills,
  items,
  skills,
  weapons,
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
type CampaignRole = "owner" | "gm" | "player" | "observer";

interface CastingTrackRow {
  id: string;
  classId: string;
  spellListClassId: string | null;
  trackKey: string;
  tradition: "arcane" | "divine" | "psionic" | "other";
  mode: "prepared" | "spontaneous" | "psionic" | "other";
}

interface PreparedSpellRow {
  preparationId: string;
  spellId: string;
  name: string;
  slotLevel: number;
  preparedCount: number;
  expendedCount: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

interface KnownSpellRow {
  spellId: string;
  name: string;
  spellLevel: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
}

interface KnownPowerRow {
  powerId: string;
  name: string;
  powerLevel: number;
  powerPoints: number;
  actionType: string | null;
  rangeText: string;
  targetText: string | null;
  augmentationText: string | null;
}

function requireBinding(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Campaign play storage is unavailable.");
  return binding;
}

function requireDatabase(binding: D1Database | undefined): Database {
  return createDatabase(requireBinding(binding));
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

async function requireCampaignManager(
  db: Database,
  campaignId: string,
  userId: string,
): Promise<{ id: string; status: string; role: CampaignRole }> {
  const campaign = await db
    .select({ id: campaigns.id, ownerUserId: campaigns.ownerUserId, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .get();
  if (!campaign) throw new NotFoundError("Campaign not found.");
  if (campaign.ownerUserId === userId) {
    return { id: campaign.id, status: campaign.status, role: "owner" };
  }

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
  if (!membership || membership.status !== "active" || membership.role !== "gm") {
    throw new ForbiddenError("Only the campaign owner or an active Game Master can pause or resume play.");
  }
  return { id: campaign.id, status: campaign.status, role: membership.role };
}

async function requireCampaignCharacter(
  db: Database,
  campaignId: string,
  characterId: string,
) {
  const character = await db
    .select({ id: characters.id, name: characters.name })
    .from(characters)
    .where(and(eq(characters.id, characterId), eq(characters.campaignId, campaignId)))
    .get();
  if (!character) throw new NotFoundError("Character not found in this campaign.");
  return character;
}

async function castingCatalog(binding: D1Database, characterId: string) {
  const tracks = await binding
    .prepare(
      `SELECT track.id,
              definition.class_id AS classId,
              definition.spell_list_class_id AS spellListClassId,
              definition.track_key AS trackKey,
              definition.tradition,
              definition.casting_mode AS mode
       FROM dnd35_character_casting_tracks track
       JOIN dnd35_class_spellcasting definition
         ON definition.id = track.class_spellcasting_id
       WHERE track.character_id = ?
       ORDER BY definition.tradition, definition.track_key, track.id`,
    )
    .bind(characterId)
    .all<CastingTrackRow>();

  return Promise.all(
    tracks.results.map(async (track) => {
      const listClassId = track.spellListClassId ?? track.classId;
      const [prepared, spontaneous, powers] = await Promise.all([
        track.mode === "prepared"
          ? binding
              .prepare(
                `SELECT preparation.id AS preparationId,
                        preparation.spell_id AS spellId,
                        spell.name,
                        preparation.slot_level AS slotLevel,
                        preparation.prepared_count AS preparedCount,
                        preparation.expended_count AS expendedCount,
                        spell.action_type AS actionType,
                        spell.range_text AS rangeText,
                        spell.target_text AS targetText
                 FROM dnd35_character_spell_preparations preparation
                 JOIN dnd35_spells spell ON spell.id = preparation.spell_id
                 WHERE preparation.casting_track_id = ? AND spell.is_enabled = 1
                 ORDER BY preparation.slot_level, spell.name, preparation.id`,
              )
              .bind(track.id)
              .all<PreparedSpellRow>()
              .then((result) => result.results)
          : Promise.resolve([] as PreparedSpellRow[]),
        track.mode === "spontaneous"
          ? binding
              .prepare(
                `SELECT known.spell_id AS spellId,
                        spell.name,
                        level.spell_level AS spellLevel,
                        spell.action_type AS actionType,
                        spell.range_text AS rangeText,
                        spell.target_text AS targetText
                 FROM dnd35_character_spells known
                 JOIN dnd35_spells spell ON spell.id = known.spell_id
                 JOIN dnd35_spell_class_levels level
                   ON level.spell_id = spell.id AND level.class_id = ?
                 WHERE known.casting_track_id = ? AND spell.is_enabled = 1
                 ORDER BY level.spell_level, spell.name`,
              )
              .bind(listClassId, track.id)
              .all<KnownSpellRow>()
              .then((result) => result.results)
          : Promise.resolve([] as KnownSpellRow[]),
        track.mode === "psionic"
          ? binding
              .prepare(
                `SELECT known.power_id AS powerId,
                        power.name,
                        level.power_level AS powerLevel,
                        power.power_points AS powerPoints,
                        power.action_type AS actionType,
                        power.range_text AS rangeText,
                        power.target_text AS targetText,
                        power.augmentation_text AS augmentationText
                 FROM dnd35_character_powers known
                 JOIN dnd35_powers power ON power.id = known.power_id
                 JOIN dnd35_power_class_levels level
                   ON level.power_id = power.id AND level.class_id = ?
                 WHERE known.casting_track_id = ? AND power.is_enabled = 1
                 ORDER BY level.power_level, power.name`,
              )
              .bind(track.classId, track.id)
              .all<KnownPowerRow>()
              .then((result) => result.results)
          : Promise.resolve([] as KnownPowerRow[]),
      ]);

      return {
        id: track.id,
        mode: track.mode,
        tradition: track.tradition,
        trackKey: track.trackKey,
        prepared: prepared.map((spell) => ({
          ...spell,
          remaining: Math.max(0, spell.preparedCount - spell.expendedCount),
        })),
        spontaneous,
        powers,
      };
    }),
  );
}

export const campaignPlayCharacterRoutes = new Hono<Env>()
  .get("/api/campaigns/:campaignId/play/characters/:characterId/checks", async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    await requireCampaignAccess(db, campaignId, session.user.id);
    const character = await requireCampaignCharacter(db, campaignId, characterId);

    const [trained, untrained, carriedWeapons] = await Promise.all([
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
      db
        .select({
          inventoryId: characterInventory.id,
          itemId: items.id,
          name: items.name,
          attackKind: weapons.attackKind,
          handedness: weapons.handedness,
          quantity: characterInventory.quantity,
        })
        .from(characterInventory)
        .innerJoin(items, eq(characterInventory.itemId, items.id))
        .innerJoin(weapons, eq(items.id, weapons.itemId))
        .where(
          and(
            eq(characterInventory.characterId, characterId),
            eq(characterInventory.location, "carried"),
          ),
        )
        .orderBy(asc(items.name))
        .all(),
    ]);

    const options = new Map<
      string,
      {
        id: string;
        slug: string;
        name: string;
        ability: string | null;
        specialization: string;
        ranks: number;
        trainedOnly: boolean;
      }
    >();

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
      weapons: carriedWeapons,
    });
  })
  .get("/api/campaigns/:campaignId/play/characters/:characterId/casting", async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const binding = requireBinding(c.env.DB);
    const db = createDatabase(binding);
    const campaignId = c.req.param("campaignId");
    const characterId = c.req.param("characterId");
    await requireCampaignAccess(db, campaignId, session.user.id);
    const character = await requireCampaignCharacter(db, campaignId, characterId);
    return c.json({
      character: { id: character.id, name: character.name },
      tracks: await castingCatalog(binding, characterId),
    });
  })
  .post("/api/campaigns/:campaignId/play/pause", async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaign = await requireCampaignManager(db, c.req.param("campaignId"), session.user.id);
    if (campaign.status !== "active") {
      throw new ConflictError("Only an active campaign can be paused.");
    }
    const now = new Date();
    await db
      .update(campaigns)
      .set({ status: "paused", lastPlayedAt: now, updatedAt: now })
      .where(and(eq(campaigns.id, campaign.id), eq(campaigns.status, "active")))
      .run();
    const updated = await db
      .select({ id: campaigns.id, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaign.id))
      .get();
    if (updated?.status !== "paused") {
      throw new ConflictError("Campaign state changed before it could be paused.");
    }
    return c.json({ campaignId: campaign.id, status: "paused" as const });
  })
  .post("/api/campaigns/:campaignId/play/resume", async (c) => {
    c.header("Cache-Control", "no-store");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = requireDatabase(c.env.DB);
    const campaign = await requireCampaignManager(db, c.req.param("campaignId"), session.user.id);
    if (campaign.status !== "paused") {
      throw new ConflictError("Only a paused campaign can be resumed.");
    }
    const now = new Date();
    await db
      .update(campaigns)
      .set({ status: "active", updatedAt: now })
      .where(and(eq(campaigns.id, campaign.id), eq(campaigns.status, "paused")))
      .run();
    const updated = await db
      .select({ id: campaigns.id, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaign.id))
      .get();
    if (updated?.status !== "active") {
      throw new ConflictError("Campaign state changed before it could be resumed.");
    }
    return c.json({ campaignId: campaign.id, status: "active" as const });
  });
