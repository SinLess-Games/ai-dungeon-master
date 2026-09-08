/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  classLevels,
  classPrerequisites,
  classes,
  raceAbilities,
  races,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ServiceUnavailableError } from "@/server/middleware/errors";

interface CharacterOptionBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterOptionEnv = { Bindings: CharacterOptionBindings };

const alignments = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"] as const;

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character rules data is unavailable.");
  return binding;
}

export const characterOptionRoutes = new Hono<CharacterOptionEnv>().get(
  "/api/dnd35/character-creation-options",
  async (c) => {
    c.header("Cache-Control", "private, max-age=300");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));

    const [raceRows, racialAbilityRows, classRows, prerequisiteRows] = await Promise.all([
      db
        .select({
          id: races.id,
          name: races.name,
          description: races.description,
          rulesText: races.rulesText,
          size: races.size,
          baseSpeedFeet: races.baseSpeedFeet,
          levelAdjustment: races.levelAdjustment,
          racialHitDice: races.racialHitDice,
          naturalArmor: races.naturalArmor,
          isHomebrew: races.isHomebrew,
        })
        .from(races)
        .where(
          and(
            eq(races.isEnabled, true),
            or(isNull(races.ownerUserId), eq(races.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(races.name))
        .all(),
      db
        .select({
          raceId: raceAbilities.raceId,
          ability: raceAbilities.ability,
          modifier: raceAbilities.modifier,
        })
        .from(raceAbilities)
        .innerJoin(races, eq(raceAbilities.raceId, races.id))
        .where(
          and(
            eq(races.isEnabled, true),
            or(isNull(races.ownerUserId), eq(races.ownerUserId, session.user.id)),
          ),
        )
        .all(),
      db
        .select({
          id: classes.id,
          slug: classes.slug,
          name: classes.name,
          description: classes.description,
          rulesText: classes.rulesText,
          category: classes.category,
          hitDie: classes.hitDie,
          skillPointsPerLevel: classes.skillPointsPerLevel,
          babProgression: classes.babProgression,
          fortProgression: classes.fortProgression,
          refProgression: classes.refProgression,
          willProgression: classes.willProgression,
          isHomebrew: classes.isHomebrew,
          classLevelId: classLevels.id,
          levelOneHitDie: classLevels.hitDie,
          levelOneSkillPoints: classLevels.skillPoints,
        })
        .from(classes)
        .innerJoin(classLevels, and(eq(classLevels.classId, classes.id), eq(classLevels.level, 1)))
        .where(
          and(
            eq(classes.isEnabled, true),
            eq(classes.category, "base"),
            or(isNull(classes.ownerUserId), eq(classes.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(classes.name))
        .all(),
      db
        .select({
          classId: classPrerequisites.classId,
          expression: classPrerequisites.expression,
          explanation: classPrerequisites.explanation,
        })
        .from(classPrerequisites)
        .all(),
    ]);

    const modifiersByRace = new Map<string, Record<string, number>>();
    for (const row of racialAbilityRows) {
      const modifiers = modifiersByRace.get(row.raceId) ?? {};
      modifiers[row.ability] = row.modifier;
      modifiersByRace.set(row.raceId, modifiers);
    }

    const prerequisitesByClass = new Map(prerequisiteRows.map((row) => [row.classId, row]));

    return c.json({
      races: raceRows.map((race) => ({
        ...race,
        abilityModifiers: modifiersByRace.get(race.id) ?? {},
      })),
      classes: classRows.map((characterClass) => {
        const prerequisite = prerequisitesByClass.get(characterClass.id);
        const condition = prerequisite?.expression.condition;
        const allowedAlignments = condition?.kind === "alignment" ? condition.allowed : alignments;
        return {
          ...characterClass,
          firstLevelHitPoints: characterClass.levelOneHitDie ?? characterClass.hitDie,
          firstLevelSkillPoints:
            characterClass.levelOneSkillPoints ?? characterClass.skillPointsPerLevel,
          allowedAlignments,
          prerequisiteExplanation: prerequisite?.explanation ?? null,
        };
      }),
      alignments,
    });
  },
);
