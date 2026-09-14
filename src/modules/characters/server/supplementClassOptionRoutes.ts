/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  classLevels,
  classPrerequisites,
  classes,
  classSkills,
  skills,
  sources,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ServiceUnavailableError } from "@/server/middleware/errors";
import { loadCharacterCreationOptions } from "./optionsRoutes";

interface CharacterOptionBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterOptionEnv = { Bindings: CharacterOptionBindings };

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character rules data is unavailable.");
  return binding;
}

function visibleToUser(ownerUserId: AnySQLiteColumn, userId: string) {
  return or(isNull(ownerUserId), eq(ownerUserId, userId));
}

/**
 * Extends the normal level-one creator catalog with read-only prestige-class cards.
 *
 * The original characterOptionRoutes intentionally returns only base classes. We keep
 * that behavior for legal level-one selections, then append 3.5 prestige classes with
 * no allowed level-one alignments or starting-wealth formula. The existing creator UI
 * therefore renders the cards and their requirements, but its validation cannot begin
 * a level-one character with a prestige class.
 */
export const supplementClassOptionRoutes = new Hono<CharacterOptionEnv>().get(
  "/api/dnd35/character-creation-options",
  async (c) => {
    c.header("Cache-Control", "private, max-age=300");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));

    const payload = await loadCharacterCreationOptions(db, session.user.id);

    const prestigeRows = await db
      .select({
        id: classes.id,
        sourceId: classes.sourceId,
        sourcePage: classes.sourcePage,
        sourceName: sources.name,
        sourceAbbreviation: sources.abbreviation,
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
      .innerJoin(sources, eq(classes.sourceId, sources.id))
      .innerJoin(classLevels, and(eq(classLevels.classId, classes.id), eq(classLevels.level, 1)))
      .where(
        and(
          eq(classes.isEnabled, true),
          eq(classes.category, "prestige"),
          eq(sources.edition, "3.5"),
          visibleToUser(classes.ownerUserId, session.user.id),
        ),
      )
      .orderBy(asc(classes.name))
      .all();

    const prestigeIds = prestigeRows.map(({ id }) => id);
    const [prerequisiteRows, classSkillRows] =
      prestigeIds.length === 0
        ? ([[], []] as const)
        : await Promise.all([
            db
              .select({
                classId: classPrerequisites.classId,
                explanation: classPrerequisites.explanation,
              })
              .from(classPrerequisites)
              .where(inArray(classPrerequisites.classId, prestigeIds))
              .all(),
            db
              .select({
                classId: classSkills.classId,
                id: skills.id,
                slug: skills.slug,
                name: skills.name,
              })
              .from(classSkills)
              .innerJoin(skills, eq(classSkills.skillId, skills.id))
              .where(
                and(
                  inArray(classSkills.classId, prestigeIds),
                  eq(skills.isEnabled, true),
                  visibleToUser(skills.ownerUserId, session.user.id),
                ),
              )
              .orderBy(asc(skills.name))
              .all(),
          ]);

    const prerequisitesByClass = new Map(
      prerequisiteRows.map((row) => [row.classId, row.explanation]),
    );
    const skillsByClass = new Map<string, Array<{ id: string; slug: string; name: string }>>();
    for (const row of classSkillRows) {
      const list = skillsByClass.get(row.classId) ?? [];
      list.push({ id: row.id, slug: row.slug, name: row.name });
      skillsByClass.set(row.classId, list);
    }

    const prestigeClasses = prestigeRows.map((characterClass) => {
      const printedRequirements = prerequisitesByClass.get(characterClass.id)?.trim();
      const sourceLabel =
        characterClass.sourceAbbreviation ?? characterClass.sourceName ?? characterClass.sourceId;
      const levelOneExplanation = [
        "Prestige class — not available as a 1st-level class.",
        printedRequirements
          ? `Requirements: ${printedRequirements}`
          : "Requirements must be met through character advancement.",
      ].join(" ");
      const expandedDescription = [
        characterClass.description,
        sourceLabel
          ? `Source: ${sourceLabel}${characterClass.sourcePage ? ` p. ${characterClass.sourcePage}` : ""}.`
          : "",
        levelOneExplanation,
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        ...characterClass,
        description: expandedDescription,
        firstLevelHitPoints: characterClass.levelOneHitDie ?? characterClass.hitDie,
        firstLevelSkillPoints:
          characterClass.levelOneSkillPoints ?? characterClass.skillPointsPerLevel,
        allowedAlignments: [],
        prerequisiteExplanation: levelOneExplanation,
        classSkills: skillsByClass.get(characterClass.id) ?? [],
        startingWealth: null,
      };
    });

    const byId = new Map<
      string,
      (typeof payload.classes)[number] | (typeof prestigeClasses)[number]
    >();
    for (const characterClass of [...payload.classes, ...prestigeClasses]) {
      byId.set(characterClass.id, characterClass);
    }

    return c.json({
      ...payload,
      classes: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
  },
);
