/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characterClassLevels,
  characterCreationProgress,
  characters,
  classLevels,
  classes,
} from "@/infrastructure/database/schema";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";

export type CharacterDatabase = ReturnType<typeof createDatabase>;

export function requireCharacterDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character storage is unavailable.");
  return binding;
}

export async function requireCharacterCreatorEditor(input: {
  db: CharacterDatabase;
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
    const membership = await input.db
      .select({ role: campaignMemberships.role, status: campaignMemberships.status })
      .from(campaignMemberships)
      .where(
        and(
          eq(campaignMemberships.campaignId, row.campaign.id),
          eq(campaignMemberships.userId, input.userId),
        ),
      )
      .get();
    if (!membership || membership.status !== "active" || !["owner", "gm"].includes(membership.role)) {
      throw new ForbiddenError("You cannot edit this character.");
    }
  }

  if (row.character.rulesetId !== "dnd35" || row.character.rulesetVersion !== "3.5") {
    throw new ValidationError("This creator currently supports D&D 3.5 characters only.");
  }
  if (row.campaign.status !== "draft" && row.campaign.status !== "ready") {
    throw new ConflictError("Characters cannot be edited after campaign start begins.");
  }
  if (["active", "retired", "archived"].includes(row.character.status)) {
    throw new ConflictError("This character is no longer editable as a pre-start draft.");
  }
  return row;
}

export async function requireFirstCharacterClasses(db: CharacterDatabase, characterId: string) {
  const rows = await db
    .select({
      characterClassLevelId: characterClassLevels.id,
      track: characterClassLevels.track,
      classLevelId: classLevels.id,
      characterLevel: characterClassLevels.characterLevel,
      classLevel: classLevels.level,
      classId: classes.id,
      classSlug: classes.slug,
      className: classes.name,
      hitDie: classes.hitDie,
      skillPointsPerLevel: classes.skillPointsPerLevel,
      baseAttackBonus: classLevels.baseAttackBonus,
      fort: classLevels.fort,
      ref: classLevels.ref,
      will: classLevels.will,
      basePowerPoints: classLevels.basePowerPoints,
      powersKnown: classLevels.powersKnown,
      maxPowerLevel: classLevels.maxPowerLevel,
    })
    .from(characterClassLevels)
    .innerJoin(classLevels, eq(characterClassLevels.classLevelId, classLevels.id))
    .innerJoin(classes, eq(classLevels.classId, classes.id))
    .where(
      and(
        eq(characterClassLevels.characterId, characterId),
        eq(characterClassLevels.characterLevel, 1),
      ),
    )
    .orderBy(asc(characterClassLevels.track))
    .all();
  if (rows.length === 0) {
    throw new ValidationError("Choose the first class before completing this creator step.");
  }
  return rows;
}

export async function requireFirstCharacterClass(db: CharacterDatabase, characterId: string) {
  const rows = await requireFirstCharacterClasses(db, characterId);
  const primary = rows.find(({ track }) => track === 1);
  if (!primary) throw new ValidationError("Choose the primary first class before completing this creator step.");
  return primary;
}

export async function ensureCreationProgress(db: CharacterDatabase, characterId: string) {
  await db
    .insert(characterCreationProgress)
    .values({ characterId })
    .onConflictDoNothing()
    .run();
}

export async function markCreationStep(
  db: CharacterDatabase,
  characterId: string,
  field:
    | "skillsFinalized"
    | "featsFinalized"
    | "languagesFinalized"
    | "wealthFinalized"
    | "equipmentFinalized"
    | "spellsFinalized"
    | "powersFinalized"
    | "divineFinalized"
    | "companionsFinalized"
    | "classChoicesFinalized",
) {
  await ensureCreationProgress(db, characterId);
  await db
    .update(characterCreationProgress)
    .set({ [field]: true, updatedAt: new Date() })
    .where(eq(characterCreationProgress.characterId, characterId))
    .run();
}
