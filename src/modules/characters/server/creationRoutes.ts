/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDatabase } from "@/infrastructure/database/client";
import {
  campaignMemberships,
  campaigns,
  characterAbilityScores,
  characterClassLevels,
  characterSkills,
  characters,
  classLevels,
  classSkills,
  classes,
  dnd35Characters,
  raceAbilities,
  races,
  skills,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/server/middleware/errors";
import { abilityModifier } from "@/rulesets/dnd35";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

const skillSelectionSchema = z.object({
  skillId: z.string().trim().min(1),
  specialization: z.string().trim().max(120).optional(),
  ranks: z.number().positive().multipleOf(0.5),
});

const skillAllocationSchema = z.object({
  selections: z.array(skillSelectionSchema).max(100),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character storage is unavailable.");
  return binding;
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

  if (row.campaign.status !== "draft" && row.campaign.status !== "ready") {
    throw new ConflictError("Characters cannot be edited after campaign start begins.");
  }
  if (["active", "retired", "archived"].includes(row.character.status)) {
    throw new ConflictError("This character is no longer editable as a pre-start draft.");
  }
  return row;
}

function normalizeSpecialization(value: string | undefined): string {
  return value?.trim() ?? "";
}

export const characterCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .put(
    "/api/characters/:characterId/skills",
    zValidator("json", skillAllocationSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireDatabase(c.env.DB));
      const row = await requireCharacterEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });

      const [extension, intelligenceRow, firstClass] = await Promise.all([
        db
          .select({ raceId: dnd35Characters.raceId })
          .from(dnd35Characters)
          .where(eq(dnd35Characters.characterId, row.character.id))
          .get(),
        db
          .select({ baseScore: characterAbilityScores.baseScore })
          .from(characterAbilityScores)
          .where(
            and(
              eq(characterAbilityScores.characterId, row.character.id),
              eq(characterAbilityScores.ability, "int"),
            ),
          )
          .get(),
        db
          .select({
            characterClassLevelId: characterClassLevels.id,
            characterLevel: characterClassLevels.characterLevel,
            classId: classes.id,
            skillPointsPerLevel: classes.skillPointsPerLevel,
          })
          .from(characterClassLevels)
          .innerJoin(classLevels, eq(characterClassLevels.classLevelId, classLevels.id))
          .innerJoin(classes, eq(classLevels.classId, classes.id))
          .where(
            and(
              eq(characterClassLevels.characterId, row.character.id),
              eq(characterClassLevels.track, 1),
              eq(characterClassLevels.characterLevel, 1),
            ),
          )
          .get(),
      ]);

      if (!extension?.raceId || intelligenceRow?.baseScore === undefined || !firstClass) {
        throw new ValidationError("Choose race, ability scores, and first class before allocating skills.");
      }

      const [race, racialIntelligence, classSkillRows, availableSkills] = await Promise.all([
        db
          .select({ bonusSkillPointsPerLevel: races.bonusSkillPointsPerLevel })
          .from(races)
          .where(eq(races.id, extension.raceId))
          .get(),
        db
          .select({ modifier: raceAbilities.modifier })
          .from(raceAbilities)
          .where(
            and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, "int")),
          )
          .get(),
        db
          .select({ skillId: classSkills.skillId })
          .from(classSkills)
          .where(eq(classSkills.classId, firstClass.classId))
          .all(),
        db
          .select({
            id: skills.id,
            name: skills.name,
            requiresSpecialization: skills.requiresSpecialization,
          })
          .from(skills)
          .where(
            and(
              eq(skills.isEnabled, true),
              or(isNull(skills.ownerUserId), eq(skills.ownerUserId, session.user.id)),
            ),
          )
          .orderBy(asc(skills.name))
          .all(),
      ]);

      if (!race) throw new ValidationError("Selected race is not available.");

      const effectiveIntelligence =
        intelligenceRow.baseScore + (racialIntelligence?.modifier ?? 0);
      const intelligenceModifier = abilityModifier(effectiveIntelligence);
      const classPointsPerLevel = Math.max(1, firstClass.skillPointsPerLevel + intelligenceModifier);
      const racialPointsPerLevel = Math.max(0, race.bonusSkillPointsPerLevel);
      const budget = (classPointsPerLevel + racialPointsPerLevel) * 4;
      const classSkillIds = new Set(classSkillRows.map((skill) => skill.skillId));
      const skillsById = new Map(availableSkills.map((skill) => [skill.id, skill]));
      const seen = new Set<string>();
      let spent = 0;

      const values = input.selections.map((selection) => {
        const skill = skillsById.get(selection.skillId);
        if (!skill) throw new ValidationError(`Skill is not available: ${selection.skillId}.`);

        const specialization = normalizeSpecialization(selection.specialization);
        if (skill.requiresSpecialization && !specialization) {
          throw new ValidationError(`${skill.name} requires a specialization.`);
        }
        if (!skill.requiresSpecialization && specialization) {
          throw new ValidationError(`${skill.name} does not accept a specialization.`);
        }
        if (skill.id === "ec-srd35-skill-speak-language-v1" && selection.ranks !== 1) {
          throw new ValidationError("Each Speak Language selection must purchase exactly one language.");
        }

        const uniqueKey = `${selection.skillId}\u0000${specialization.toLocaleLowerCase()}`;
        if (seen.has(uniqueKey)) throw new ValidationError(`Duplicate skill selection: ${skill.name}.`);
        seen.add(uniqueKey);

        const isClassSkill = classSkillIds.has(selection.skillId);
        const maximumRanks = isClassSkill ? firstClass.characterLevel + 3 : (firstClass.characterLevel + 3) / 2;
        if (selection.ranks > maximumRanks) {
          throw new ValidationError(
            `${skill.name} exceeds the level-${firstClass.characterLevel} ${isClassSkill ? "class" : "cross-class"} rank cap of ${maximumRanks}.`,
          );
        }
        if (isClassSkill && !Number.isInteger(selection.ranks)) {
          throw new ValidationError(`${skill.name} class-skill ranks must be whole numbers.`);
        }

        spent += isClassSkill ? selection.ranks : selection.ranks * 2;
        return {
          characterId: row.character.id,
          skillId: selection.skillId,
          specialization,
          ranks: selection.ranks,
        };
      });

      if (!Number.isInteger(spent) || spent !== budget) {
        throw new ValidationError(`Spend exactly ${budget} first-level skill points.`, {
          budget,
          spent,
          remaining: budget - spent,
        });
      }
      if (values.length === 0) {
        throw new ValidationError("At least one trained skill is required at first level.");
      }

      await db.batch([
        db.delete(characterSkills).where(eq(characterSkills.characterId, row.character.id)),
        db.insert(characterSkills).values(values),
        db
          .update(characterClassLevels)
          .set({ skillPointsSpent: budget, updatedAt: new Date() })
          .where(eq(characterClassLevels.id, firstClass.characterClassLevelId)),
      ]);

      return c.json({
        characterId: row.character.id,
        effectiveIntelligence,
        intelligenceModifier,
        budget,
        spent,
        selections: values.map(({ skillId, specialization, ranks }) => ({
          skillId,
          specialization,
          ranks,
          isClassSkill: classSkillIds.has(skillId),
        })),
      });
    },
  );
