/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  classLevels,
  classPrerequisites,
  classes,
  classSkills,
  classStartingWealth,
  deities,
  deityDomains,
  domains,
  items,
  languages,
  raceAbilities,
  races,
  skills,
  sources,
  spellSchools,
  spells,
  weapons,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import {
  pointBuyBudgets,
  rollAbilitySet,
} from "@/modules/characters/domain/abilityGeneration";
import { ServiceUnavailableError } from "@/server/middleware/errors";

interface CharacterOptionBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterOptionEnv = { Bindings: CharacterOptionBindings };

const alignments = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"] as const;
const abilityRollSchema = z.object({
  method: z.enum(["roll-4d6-drop-lowest", "roll-4d6-reroll-1-2"]),
});

function requireDatabase(binding: D1Database | undefined): D1Database {
  if (!binding) throw new ServiceUnavailableError("Character rules data is unavailable.");
  return binding;
}

function visibleToUser(ownerUserId: AnySQLiteColumn, userId: string) {
  return or(isNull(ownerUserId), eq(ownerUserId, userId));
}

export const characterOptionRoutes = new Hono<CharacterOptionEnv>()
  .get("/api/dnd35/character-creation-options", async (c) => {
    c.header("Cache-Control", "private, max-age=300");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));

    const [
      raceRows,
      racialAbilityRows,
      classRows,
      prerequisiteRows,
      classSkillRows,
      wealthRows,
    ] = await Promise.all([
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
          racialHitDie: races.racialHitDie,
          naturalArmor: races.naturalArmor,
          isHomebrew: races.isHomebrew,
        })
        .from(races)
        .where(
          and(
            eq(races.isEnabled, true),
            visibleToUser(races.ownerUserId, session.user.id),
          ),
        )
        .orderBy(asc(races.levelAdjustment), asc(races.name))
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
            visibleToUser(races.ownerUserId, session.user.id),
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
        .innerJoin(sources, eq(classes.sourceId, sources.id))
        .innerJoin(classLevels, and(eq(classLevels.classId, classes.id), eq(classLevels.level, 1)))
        .where(
          and(
            eq(classes.isEnabled, true),
            eq(classes.category, "base"),
            eq(sources.edition, "3.5"),
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
      db
        .select({ classId: classSkills.classId, id: skills.id, slug: skills.slug, name: skills.name })
        .from(classSkills)
        .innerJoin(skills, eq(classSkills.skillId, skills.id))
        .where(and(eq(skills.isEnabled, true), visibleToUser(skills.ownerUserId, session.user.id)))
        .orderBy(asc(skills.name))
        .all(),
      db
        .select({
          classId: classStartingWealth.classId,
          diceCount: classStartingWealth.diceCount,
          dieSides: classStartingWealth.dieSides,
          multiplierGp: classStartingWealth.multiplierGp,
        })
        .from(classStartingWealth)
        .all(),
    ]);

    const modifiersByRace = new Map<string, Record<string, number>>();
    for (const row of racialAbilityRows) {
      const modifiers = modifiersByRace.get(row.raceId) ?? {};
      modifiers[row.ability] = row.modifier;
      modifiersByRace.set(row.raceId, modifiers);
    }

    const skillsByClass = new Map<string, Array<{ id: string; slug: string; name: string }>>();
    for (const row of classSkillRows) {
      const list = skillsByClass.get(row.classId) ?? [];
      list.push({ id: row.id, slug: row.slug, name: row.name });
      skillsByClass.set(row.classId, list);
    }
    const wealthByClass = new Map(wealthRows.map((row) => [row.classId, row]));
    const prerequisitesByClass = new Map(prerequisiteRows.map((row) => [row.classId, row]));
    const maximumLevelAdjustment = Math.max(
      0,
      ...raceRows.map((race) => race.levelAdjustment ?? 0),
    );

    return c.json({
      races: raceRows.map((race) => ({
        ...race,
        abilityModifiers: modifiersByRace.get(race.id) ?? {},
      })),
      classes: classRows.map((characterClass) => {
        const prerequisite = prerequisitesByClass.get(characterClass.id);
        const condition = prerequisite?.expression.condition;
        const allowedAlignments = condition?.kind === "alignment" ? condition.allowed : alignments;
        const wealth = wealthByClass.get(characterClass.id) ?? null;
        return {
          ...characterClass,
          firstLevelHitPoints: characterClass.levelOneHitDie ?? characterClass.hitDie,
          firstLevelSkillPoints: characterClass.levelOneSkillPoints ?? characterClass.skillPointsPerLevel,
          allowedAlignments,
          prerequisiteExplanation: prerequisite?.explanation ?? null,
          classSkills: skillsByClass.get(characterClass.id) ?? [],
          startingWealth: wealth,
        };
      }),
      alignments,
      abilityGeneration: {
        standardArray: [15, 14, 13, 12, 10, 8],
        pointBuyBudgets,
        rollMethods: ["roll-4d6-drop-lowest", "roll-4d6-reroll-1-2"],
      },
      maximumLevelAdjustment,
      progressionModes: ["standard", "gestalt"],
    });
  })
  .post(
    "/api/dnd35/ability-generation/roll",
    zValidator("json", abilityRollSchema),
    async (c) => {
      c.header("Cache-Control", "no-store");
      await requireUser(createAuth(c.env), c.req.raw.headers);
      const { method } = c.req.valid("json");
      return c.json({ method, ...rollAbilitySet(method) });
    },
  )
  .get("/api/dnd35/character-creation-reference-options", async (c) => {
    c.header("Cache-Control", "private, max-age=300");
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireDatabase(c.env.DB));

    const [languageRows, skillRows, weaponRows, schoolRows, spellRows, deityDomainRows] =
      await Promise.all([
        db
          .select({
            id: languages.id,
            slug: languages.slug,
            name: languages.name,
            description: languages.description,
            script: languages.script,
            typicalSpeakers: languages.typicalSpeakers,
            isSecret: languages.isSecret,
          })
          .from(languages)
          .where(
            and(
              eq(languages.isEnabled, true),
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
