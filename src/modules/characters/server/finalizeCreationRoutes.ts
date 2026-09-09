/// <reference types="@cloudflare/workers-types" />

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaigns,
  characterAbilityScores,
  characterClassLevels,
  characterCreationProgress,
  characters,
  dnd35Characters,
  raceAbilities,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { reconcileCampaignReadiness } from "@/modules/campaigns/domain/lifecycle";
import { abilityModifier } from "@/rulesets/dnd35";
import { ValidationError } from "@/server/middleware/errors";
import { validateDnd35CharacterReadiness } from "../domain/readiness";
import { requireCharacterCreatorEditor, requireCharacterDatabase } from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

type ProgressFlag =
  | "skillsFinalized"
  | "featsFinalized"
  | "languagesFinalized"
  | "wealthFinalized"
  | "equipmentFinalized"
  | "spellsFinalized"
  | "powersFinalized"
  | "divineFinalized"
  | "companionsFinalized"
  | "classChoicesFinalized";

const REQUIRED_CREATION_STEPS: ReadonlyArray<{ field: ProgressFlag; label: string }> = [
  { field: "skillsFinalized", label: "skills" },
  { field: "featsFinalized", label: "feats" },
  { field: "languagesFinalized", label: "languages" },
  { field: "wealthFinalized", label: "starting wealth" },
  { field: "equipmentFinalized", label: "starting equipment" },
  { field: "spellsFinalized", label: "spells" },
  { field: "powersFinalized", label: "powers" },
  { field: "divineFinalized", label: "deity and domains" },
  { field: "companionsFinalized", label: "familiar or animal companion" },
  { field: "classChoicesFinalized", label: "class-specific choices" },
];

export function missingCreationSteps(
  progress: Partial<Record<ProgressFlag, boolean>> | null | undefined,
): string[] {
  return REQUIRED_CREATION_STEPS
    .filter(({ field }) => progress?.[field] !== true)
    .map(({ label }) => label);
}

export function maximumHitPointsFromClassTracks(
  classRows: Array<{ characterLevel: number; hitPointsGained: number }>,
  constitutionModifier: number,
): number {
  const bestByLevel = new Map<number, number>();
  for (const row of classRows) {
    bestByLevel.set(row.characterLevel, Math.max(bestByLevel.get(row.characterLevel) ?? 0, row.hitPointsGained));
  }
  return [...bestByLevel.values()].reduce(
    (total, hitPointsGained) => total + Math.max(1, hitPointsGained + constitutionModifier),
    0,
  );
}

export const characterFinalizeCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/readiness", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });
    const [progress, extension, classRows] = await Promise.all([
      db.select().from(characterCreationProgress).where(eq(characterCreationProgress.characterId, row.character.id)).get(),
      db.select({ progressionMode: dnd35Characters.progressionMode }).from(dnd35Characters).where(eq(dnd35Characters.characterId, row.character.id)).get(),
      db.select({ track: characterClassLevels.track, characterLevel: characterClassLevels.characterLevel }).from(characterClassLevels).where(eq(characterClassLevels.characterId, row.character.id)).all(),
    ]);
    const missing = missingCreationSteps(progress ?? undefined);
    if (extension?.progressionMode === "gestalt") {
      const firstLevelTracks = new Set(classRows.filter(({ characterLevel }) => characterLevel === 1).map(({ track }) => track));
      if (!firstLevelTracks.has(1) || !firstLevelTracks.has(2)) missing.unshift("both gestalt classes");
    }
    return c.json({ characterId: row.character.id, complete: missing.length === 0, missing, progress: progress ?? null });
  })
  .post("/api/characters/:characterId/ready", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({ db, characterId: c.req.param("characterId"), userId: session.user.id });

    const [progress, extension, abilityRows, classRows] = await Promise.all([
      db.select().from(characterCreationProgress).where(eq(characterCreationProgress.characterId, row.character.id)).get(),
      db.select().from(dnd35Characters).where(eq(dnd35Characters.characterId, row.character.id)).get(),
      db
        .select({ ability: characterAbilityScores.ability, baseScore: characterAbilityScores.baseScore })
        .from(characterAbilityScores)
        .where(eq(characterAbilityScores.characterId, row.character.id))
        .all(),
      db
        .select({
          track: characterClassLevels.track,
          characterLevel: characterClassLevels.characterLevel,
          hitPointsGained: characterClassLevels.hitPointsGained,
        })
        .from(characterClassLevels)
        .where(eq(characterClassLevels.characterId, row.character.id))
        .all(),
    ]);

    const missing = missingCreationSteps(progress ?? undefined);
    if (extension?.progressionMode === "gestalt") {
      const firstLevelTracks = new Set(classRows.filter(({ characterLevel }) => characterLevel === 1).map(({ track }) => track));
      if (!firstLevelTracks.has(1) || !firstLevelTracks.has(2)) missing.unshift("both gestalt classes");
    }
    if (missing.length > 0) {
      throw new ValidationError("Finish every character-creation step before marking the character ready.", { missingSteps: missing });
    }

    const abilityScores = Object.fromEntries(abilityRows.map((ability) => [ability.ability, ability.baseScore])) as Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number | null>>;
    const readiness = validateDnd35CharacterReadiness({
      extensionPresent: Boolean(extension),
      raceId: extension?.raceId ?? null,
      abilityScores,
      classLevelCount: classRows.length,
    });
    if (!readiness.ok) throw new ValidationError("Character is not ready to play.", { issues: readiness.errors });

    const conScore = abilityScores.con;
    if (conScore == null) throw new ValidationError("A Constitution score is required for a playable character.");
    const racialConstitution = extension?.raceId
      ? await db
          .select({ modifier: raceAbilities.modifier })
          .from(raceAbilities)
          .where(and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, "con")))
          .get()
      : undefined;
    const effectiveConstitution = conScore + (racialConstitution?.modifier ?? 0);
    const conModifier = abilityModifier(effectiveConstitution);
    const maximumHitPoints = maximumHitPointsFromClassTracks(classRows, conModifier);
    const now = new Date();

    await db.batch([
      db.update(characters).set({ status: "ready", readyAt: now, updatedAt: now }).where(eq(characters.id, row.character.id)),
      db.update(dnd35Characters).set({ currentHitPoints: maximumHitPoints, updatedAt: now }).where(eq(dnd35Characters.characterId, row.character.id)),
    ]);

    const campaignCharacters = await db
      .select({ id: characters.id, status: characters.status, rulesetId: characters.rulesetId, rulesetVersion: characters.rulesetVersion })
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
        .set({ status: reconciled.status, readyAt: reconciled.status === "ready" ? now : null, updatedAt: now })
        .where(eq(campaigns.id, row.campaign.id))
        .run();
    }

    return c.json({
      characterId: row.character.id,
      status: "ready",
      maximumHitPoints,
      campaignStatus: reconciled.status,
      creationComplete: true,
    });
  });
