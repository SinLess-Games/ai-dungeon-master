/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "@/infrastructure/database/client";
import {
  classLevels,
  classPrerequisites,
  classes,
  deities,
  deityDomains,
  domains,
  items,
  languages,
  raceAbilities,
  races,
  skills,
  spellSchools,
  spells,
  weapons,
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

function visibleToUser(ownerUserId: typeof races.ownerUserId, userId: string) {
  return or(isNull(ownerUserId), eq(ownerUserId, userId));
}

export const characterOptionRoutes = new Hono<CharacterOptionEnv>()
  .get("/api/dnd35/character-creation-options", async (c) => {
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
        .where(and(eq(races.isEnabled, true), visibleToUser(races.ownerUserId, session.user.id)))
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
        .where(and(eq(races.isEnabled, true), visibleToUser(races.ownerUserId, session.user.id)))
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
            visibleToUser(classes.ownerUserId, session.user.id),
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
          firstLevelSkillPoints: characterClass.levelOneSkillPoints ?? characterClass.skillPointsPerLevel,
          allowedAlignments,
          prerequisiteExplanation: prerequisite?.explanation ?? null,
        };
      }),
      alignments,
    });
  })
  .get("/api/dnd35/character-creation-reference-options", async (c) => {
    c.header("Cache-Control", "private, max-age=300");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));

    const [languageRows, skillRows, weaponRows, schoolRows, spellRows, deityDomainRows] =
      await Promise.all([
        db
          .select({ id: languages.id, slug: languages.slug, name: languages.name })
          .from(languages)
          .where(
            and(
              eq(languages.isEnabled, true),
              eq(languages.isSecret, false),
              visibleToUser(languages.ownerUserId, session.user.id),
            ),
          )
          .orderBy(asc(languages.name))
          .all(),
        db
          .select({ id: skills.id, slug: skills.slug, name: skills.name })
          .from(skills)
          .where(and(eq(skills.isEnabled, true), visibleToUser(skills.ownerUserId, session.user.id)))
          .orderBy(asc(skills.name))
          .all(),
        db
          .select({ id: items.id, slug: items.slug, name: items.name })
          .from(weapons)
          .innerJoin(items, eq(weapons.itemId, items.id))
          .where(and(eq(items.isEnabled, true), visibleToUser(items.ownerUserId, session.user.id)))
          .orderBy(asc(items.name))
          .all(),
        db
          .select({ id: spellSchools.id, slug: spellSchools.slug, name: spellSchools.name })
          .from(spellSchools)
          .where(
            and(
              eq(spellSchools.isEnabled, true),
              visibleToUser(spellSchools.ownerUserId, session.user.id),
            ),
          )
          .orderBy(asc(spellSchools.name))
          .all(),
        db
          .select({ id: spells.id, slug: spells.slug, name: spells.name })
          .from(spells)
          .where(and(eq(spells.isEnabled, true), visibleToUser(spells.ownerUserId, session.user.id)))
          .orderBy(asc(spells.name))
          .all(),
        db
          .select({ deityId: deityDomains.deityId, domainId: deityDomains.domainId })
          .from(deityDomains)
          .innerJoin(deities, eq(deityDomains.deityId, deities.id))
          .innerJoin(domains, eq(deityDomains.domainId, domains.id))
          .where(
            and(
              eq(deities.isEnabled, true),
              eq(domains.isEnabled, true),
              visibleToUser(deities.ownerUserId, session.user.id),
              visibleToUser(domains.ownerUserId, session.user.id),
            ),
          )
          .all(),
      ]);

    const deityDomainIds: Record<string, string[]> = {};
    for (const row of deityDomainRows) {
      (deityDomainIds[row.deityId] ??= []).push(row.domainId);
    }

    return c.json({
      languages: languageRows,
      featChoiceOptions: {
        skill: skillRows,
        weapon: weaponRows,
        school: schoolRows,
        spell: spellRows,
      },
      deityDomainIds,
    });
  });
