/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import { classLevels, classes, raceAbilities, races } from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ServiceUnavailableError } from "@/server/middleware/errors";

interface CharacterOptionBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterOptionEnv = { Bindings: CharacterOptionBindings };

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
    const canSeeOwnedContent = (ownerColumn: typeof races.ownerUserId) =>
      or(isNull(ownerColumn), eq(ownerColumn, session.user.id));

    const [raceRows, racialAbilityRows, classRows] = await Promise.all([
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
        .where(and(eq(races.isEnabled, true), canSeeOwnedContent(races.ownerUserId)))
        .orderBy(asc(races.name))
        .all(),
      db
        .select({ raceId: raceAbilities.raceId, ability: raceAbilities.ability, modifier: raceAbilities.modifier })
        .from(raceAbilities)
        .innerJoin(races, eq(raceAbilities.raceId, races.id))
        .where(and(eq(races.isEnabled, true), canSeeOwnedContent(races.ownerUserId)))
        .all(),
      db
        .select({
          id: classes.id,
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
            canSeeOwnedContent(classes.ownerUserId),
          ),
        )
        .orderBy(asc(classes.name))
        .all(),
    ]);

    const modifiersByRace = new Map<string, Record<string, number>>();
    for (const row of racialAbilityRows) {
      const modifiers = modifiersByRace.get(row.raceId) ?? {};
      modifiers[row.ability] = row.modifier;
      modifiersByRace.set(row.raceId, modifiers);
    }

    return c.json({
      races: raceRows.map((race) => ({ ...race, abilityModifiers: modifiersByRace.get(race.id) ?? {} })),
      classes: classRows.map((characterClass) => ({
        ...characterClass,
        firstLevelHitPoints: characterClass.levelOneHitDie ?? characterClass.hitDie,
        firstLevelSkillPoints: characterClass.levelOneSkillPoints ?? characterClass.skillPointsPerLevel,
      })),
      alignments: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"] as const,
    });
  },
);
