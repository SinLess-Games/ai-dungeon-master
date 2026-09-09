/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterDomains,
  deityDomains,
  deities,
  dnd35Characters,
  domains,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ValidationError } from "@/server/middleware/errors";
import {
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClass,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

type Alignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";

const divineSelectionSchema = z.object({
  deityId: z.string().trim().min(1).nullable(),
  domainIds: z.array(z.string().trim().min(1)).length(2),
});

function alignmentAxes(alignment: Alignment): [number, number] {
  const lawChaos = alignment[0] === "L" ? -1 : alignment[0] === "C" ? 1 : 0;
  const goodEvil = alignment[1] === "G" ? -1 : alignment[1] === "E" ? 1 : 0;
  return [lawChaos, goodEvil];
}

function isWithinOneAlignmentStep(characterAlignment: Alignment, deityAlignment: Alignment): boolean {
  if (characterAlignment === "N") return deityAlignment === "N";
  const [characterLaw, characterGood] = alignmentAxes(characterAlignment);
  const [deityLaw, deityGood] = alignmentAxes(deityAlignment);
  return Math.abs(characterLaw - deityLaw) + Math.abs(characterGood - deityGood) <= 1;
}

function permitsAlignmentDomain(alignment: Alignment, domainSlug: string): boolean {
  if (domainSlug === "law") return alignment.startsWith("L");
  if (domainSlug === "chaos") return alignment.startsWith("C");
  if (domainSlug === "good") return alignment.endsWith("G");
  if (domainSlug === "evil") return alignment.endsWith("E");
  return true;
}

export const characterDivineCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/divine", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const firstClass = await requireFirstCharacterClass(db, row.character.id);
    const extension = await db
      .select({ deityId: dnd35Characters.deityId, alignment: dnd35Characters.alignment })
      .from(dnd35Characters)
      .where(eq(dnd35Characters.characterId, row.character.id))
      .get();
    if (!extension) throw new ValidationError("D&D 3.5 character data is unavailable.");

    const selectedDomains = await db
      .select({ id: domains.id, slug: domains.slug, name: domains.name })
      .from(characterDomains)
      .innerJoin(domains, eq(characterDomains.domainId, domains.id))
      .where(eq(characterDomains.characterId, row.character.id))
      .orderBy(asc(domains.name))
      .all();

    if (firstClass.classSlug !== "cleric") {
      return c.json({
        required: false,
        reason: `${firstClass.className} has no 1st-level deity/domain selection.`,
        alignment: extension.alignment,
        deityId: extension.deityId,
        domains: selectedDomains,
        deityOptions: [],
        domainOptions: [],
      });
    }

    const [deityOptions, domainOptions] = await Promise.all([
      db
        .select({
          id: deities.id,
          slug: deities.slug,
          name: deities.name,
          alignment: deities.alignment,
          portfolio: deities.portfolio,
          symbol: deities.symbol,
        })
        .from(deities)
        .where(
          and(
            eq(deities.isEnabled, true),
            or(isNull(deities.ownerUserId), eq(deities.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(deities.name))
        .all(),
      db
        .select({ id: domains.id, slug: domains.slug, name: domains.name, grantedPowerText: domains.grantedPowerText })
        .from(domains)
        .where(
          and(
            eq(domains.isEnabled, true),
            or(isNull(domains.ownerUserId), eq(domains.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(domains.name))
        .all(),
    ]);

    return c.json({
      required: true,
      alignment: extension.alignment,
      deityId: extension.deityId,
      domains: selectedDomains,
      deityOptions: deityOptions.filter(
        (deity) => deity.alignment !== null && isWithinOneAlignmentStep(extension.alignment, deity.alignment),
      ),
      domainOptions: domainOptions.filter((domain) => permitsAlignmentDomain(extension.alignment, domain.slug)),
      deityOptional: true,
      domainsRequired: 2,
    });
  })
  .put(
    "/api/characters/:characterId/divine",
    zValidator("json", divineSelectionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      const firstClass = await requireFirstCharacterClass(db, row.character.id);
      const extension = await db
        .select({ alignment: dnd35Characters.alignment })
        .from(dnd35Characters)
        .where(eq(dnd35Characters.characterId, row.character.id))
        .get();
      if (!extension) throw new ValidationError("D&D 3.5 character data is unavailable.");

      if (firstClass.classSlug !== "cleric") {
        if (input.deityId !== null || input.domainIds.length !== 2) {
          throw new ValidationError(`${firstClass.className} does not make a cleric domain selection at 1st level.`);
        }
        throw new ValidationError("Use the class-choice endpoint for non-cleric religious choices.");
      }

      const uniqueDomains = [...new Set(input.domainIds)];
      if (uniqueDomains.length !== 2) throw new ValidationError("Choose two different cleric domains.");

      const selectedDomainRows = await db
        .select({ id: domains.id, slug: domains.slug, name: domains.name })
        .from(domains)
        .where(
          and(
            inArray(domains.id, uniqueDomains),
            eq(domains.isEnabled, true),
            or(isNull(domains.ownerUserId), eq(domains.ownerUserId, session.user.id)),
          ),
        )
        .all();
      if (selectedDomainRows.length !== 2) throw new ValidationError("One or more selected domains are unavailable.");
      for (const domain of selectedDomainRows) {
        if (!permitsAlignmentDomain(extension.alignment, domain.slug)) {
          throw new ValidationError(`${domain.name} domain conflicts with the cleric's alignment.`);
        }
      }

      if (input.deityId !== null) {
        const deity = await db
          .select({ id: deities.id, name: deities.name, alignment: deities.alignment })
          .from(deities)
          .where(
            and(
              eq(deities.id, input.deityId),
              eq(deities.isEnabled, true),
              or(isNull(deities.ownerUserId), eq(deities.ownerUserId, session.user.id)),
            ),
          )
          .get();
        if (!deity || deity.alignment === null) throw new ValidationError("Selected deity is unavailable.");
        if (!isWithinOneAlignmentStep(extension.alignment, deity.alignment)) {
          throw new ValidationError(`${deity.name} is not within one alignment step of this cleric.`);
        }
        const allowedDomains = new Set(
          (
            await db
              .select({ domainId: deityDomains.domainId })
              .from(deityDomains)
              .where(eq(deityDomains.deityId, deity.id))
              .all()
          ).map(({ domainId }) => domainId),
        );
        if (uniqueDomains.some((domainId) => !allowedDomains.has(domainId))) {
          throw new ValidationError("A cleric who follows a deity must choose both domains from that deity's domains.");
        }
      }

      const domainValues = uniqueDomains.map((domainId) => ({ characterId: row.character.id, domainId }));
      await db.batch([
        db.delete(characterDomains).where(eq(characterDomains.characterId, row.character.id)),
        db.insert(characterDomains).values(domainValues),
        db
          .update(dnd35Characters)
          .set({ deityId: input.deityId, updatedAt: new Date() })
          .where(eq(dnd35Characters.characterId, row.character.id)),
      ]);
      await markCreationStep(db, row.character.id, "divineFinalized");

      return c.json({ characterId: row.character.id, deityId: input.deityId, domainIds: uniqueDomains });
    },
  );