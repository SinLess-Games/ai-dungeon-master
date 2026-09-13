/// <reference types="@cloudflare/workers-types" />

import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { createDatabase } from "@/infrastructure/database/client";
import {
  characterCreationProgress,
  characterInventory,
  characterWealth,
  classStartingWealth,
  items,
} from "@/infrastructure/database/schema";
import { createAuth, type AuthEnv } from "@/modules/auth/server/auth";
import { requireUser } from "@/modules/auth/server/requireAuth";
import { ValidationError } from "@/server/middleware/errors";
import { rollStartingWealth } from "../domain/creationRules";
import {
  ensureCreationProgress,
  markCreationStep,
  requireCharacterCreatorEditor,
  requireCharacterDatabase,
  requireFirstCharacterClasses,
} from "./creationAccess";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}

type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

type WealthFormula = typeof classStartingWealth.$inferSelect;

const equipmentSelectionSchema = z.object({
  selections: z
    .array(
      z.object({
        itemId: z.string().trim().min(1),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .max(200),
});

function richerFormula(formulas: WealthFormula[]): WealthFormula | undefined {
  return [...formulas].sort((a, b) => {
    const expectedA = a.diceCount * (a.dieSides + 1) * a.multiplierGp;
    const expectedB = b.diceCount * (b.dieSides + 1) * b.multiplierGp;
    return expectedB - expectedA;
  })[0];
}

async function startingWealthContext(
  db: ReturnType<typeof createDatabase>,
  characterId: string,
) {
  const firstClasses = await requireFirstCharacterClasses(db, characterId);
  const classIds = firstClasses.map(({ classId }) => classId);
  const formulas = classIds.length
    ? await db
        .select()
        .from(classStartingWealth)
        .where(inArray(classStartingWealth.classId, classIds))
        .all()
    : [];
  const formulaByClass = new Map(formulas.map((formula) => [formula.classId, formula]));
  const missing = firstClasses.filter(({ classId }) => !formulaByClass.has(classId));
  if (missing.length > 0) {
    throw new ValidationError(
      `Starting-wealth formula is unavailable for ${missing.map(({ className }) => className).join(" / ")}.`,
    );
  }
  const selected = richerFormula(formulas);
  if (!selected) throw new ValidationError("Starting-wealth formula is unavailable for this character.");
  const selectedClass = firstClasses.find(({ classId }) => classId === selected.classId)!;
  return {
    firstClasses,
    selected,
    selectedClass,
    classFormulas: firstClasses.map((characterClass) => ({
      track: characterClass.track,
      classId: characterClass.classId,
      classSlug: characterClass.classSlug,
      className: characterClass.className,
      formula: formulaByClass.get(characterClass.classId)!,
    })),
  };
}

export const characterEquipmentCreationRoutes = new Hono<CharacterCreationEnv>()
  .use("/api/characters/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/api/characters/:characterId/creation/equipment", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const context = await startingWealthContext(db, row.character.id);
    const [wealth, inventory, availableItems] = await Promise.all([
      db
        .select()
        .from(characterWealth)
        .where(eq(characterWealth.characterId, row.character.id))
        .get(),
      db
        .select({
          inventoryId: characterInventory.id,
          itemId: characterInventory.itemId,
          quantity: characterInventory.quantity,
          name: items.name,
          priceCopper: items.priceCopper,
        })
        .from(characterInventory)
        .innerJoin(items, eq(characterInventory.itemId, items.id))
        .where(eq(characterInventory.characterId, row.character.id))
        .all(),
      db
        .select({
          id: items.id,
          slug: items.slug,
          name: items.name,
          category: items.category,
          priceCopper: items.priceCopper,
          weightPounds: items.weightPounds,
        })
        .from(items)
        .where(
          and(
            eq(items.isEnabled, true),
            or(isNull(items.ownerUserId), eq(items.ownerUserId, session.user.id)),
          ),
        )
        .orderBy(asc(items.category), asc(items.name))
        .all(),
    ]);
    const purchaseBudget = wealth?.startingWealthCopper ?? null;
    return c.json({
      class: {
        id: context.selectedClass.classId,
        slug: context.selectedClass.classSlug,
        name: context.selectedClass.className,
      },
      classes: context.firstClasses.map(({ track, classId, classSlug, className }) => ({
        track,
        id: classId,
        slug: classSlug,
        name: className,
      })),
      classFormulas: context.classFormulas,
      wealthRule:
        context.firstClasses.length > 1
          ? "Gestalt starting wealth uses the class formula with the higher expected value; gestalt does not double starting funds."
          : "Starting wealth uses the selected class formula.",
      formula: context.selected,
      wealth: wealth ?? null,
      inventory,
      options:
        purchaseBudget === null
          ? []
          : availableItems.filter(
              (item): item is typeof item & { priceCopper: number } =>
                item.priceCopper !== null && item.priceCopper <= purchaseBudget,
            ),
    });
  })
  .post("/api/characters/:characterId/starting-wealth/roll", async (c) => {
    const session = await requireUser(createAuth(c.env), c.req.raw.headers);
    const db = createDatabase(requireCharacterDatabase(c.env.DB));
    const row = await requireCharacterCreatorEditor({
      db,
      characterId: c.req.param("characterId"),
      userId: session.user.id,
    });
    const context = await startingWealthContext(db, row.character.id);
    const existing = await db
      .select()
      .from(characterWealth)
      .where(eq(characterWealth.characterId, row.character.id))
      .get();
    if (existing?.startingWealthCopper !== null && existing?.startingWealthCopper !== undefined) {
      await markCreationStep(db, row.character.id, "wealthFinalized");
      return c.json({ characterId: row.character.id, wealth: existing, alreadyRolled: true });
    }

    const result = rollStartingWealth(context.selected);
    await db
      .insert(characterWealth)
      .values({
        characterId: row.character.id,
        startingWealthCopper: result.copperPieces,
        currentCopper: result.copperPieces,
        equipmentSpentCopper: 0,
        rollResults: result.rolls,
      })
      .onConflictDoUpdate({
        target: characterWealth.characterId,
        set: {
          startingWealthCopper: result.copperPieces,
          currentCopper: result.copperPieces,
          equipmentSpentCopper: 0,
          rollResults: result.rolls,
          updatedAt: new Date(),
        },
      })
      .run();
    await ensureCreationProgress(db, row.character.id);
    await db
      .update(characterCreationProgress)
      .set({ wealthFinalized: true, equipmentFinalized: false, updatedAt: new Date() })
      .where(eq(characterCreationProgress.characterId, row.character.id))
      .run();

    return c.json(
      {
        characterId: row.character.id,
        classId: context.selectedClass.classId,
        className: context.selectedClass.className,
        wealthRule: context.firstClasses.length > 1 ? "higher-expected-formula" : "class-formula",
        rollResults: result.rolls,
        startingGoldPieces: result.goldPieces,
        startingWealthCopper: result.copperPieces,
      },
      201,
    );
  })
  .put(
    "/api/characters/:characterId/equipment",
    zValidator("json", equipmentSelectionSchema),
    async (c) => {
      const session = await requireUser(createAuth(c.env), c.req.raw.headers);
      const input = c.req.valid("json");
      const db = createDatabase(requireCharacterDatabase(c.env.DB));
      const row = await requireCharacterCreatorEditor({
        db,
        characterId: c.req.param("characterId"),
        userId: session.user.id,
      });
      await requireFirstCharacterClasses(db, row.character.id);
      const wealth = await db
        .select()
        .from(characterWealth)
        .where(eq(characterWealth.characterId, row.character.id))
        .get();
      if (wealth?.startingWealthCopper === null || wealth?.startingWealthCopper === undefined) {
        throw new ValidationError("Roll starting wealth before purchasing equipment.");
      }

      const unique = new Map<string, number>();
      for (const selection of input.selections) {
        if (unique.has(selection.itemId)) {
          throw new ValidationError(`Duplicate equipment item: ${selection.itemId}.`);
        }
        unique.set(selection.itemId, selection.quantity);
      }
      const availableItems = input.selections.length
        ? await db
            .select({
              id: items.id,
              name: items.name,
              priceCopper: items.priceCopper,
              isEnabled: items.isEnabled,
              ownerUserId: items.ownerUserId,
            })
            .from(items)
            .where(or(isNull(items.ownerUserId), eq(items.ownerUserId, session.user.id)))
            .all()
        : [];
      const byId = new Map(availableItems.map((item) => [item.id, item]));
      let spentCopper = 0;
      const inventoryValues = input.selections.map((selection) => {
        const item = byId.get(selection.itemId);
        if (!item || !item.isEnabled) {
          throw new ValidationError(`Equipment item is not available: ${selection.itemId}.`);
        }
        if (item.priceCopper === null) {
          throw new ValidationError(`${item.name} does not have a purchase price.`);
        }
        spentCopper += item.priceCopper * selection.quantity;
        return {
          id: crypto.randomUUID(),
          characterId: row.character.id,
          itemId: selection.itemId,
          quantity: selection.quantity,
          location: "carried" as const,
        };
      });
      if (spentCopper > wealth.startingWealthCopper) {
        throw new ValidationError("Starting equipment exceeds available starting wealth.", {
          startingWealthCopper: wealth.startingWealthCopper,
          spentCopper,
          shortfallCopper: spentCopper - wealth.startingWealthCopper,
        });
      }

      if (inventoryValues.length > 0) {
        await db.batch([
          db.delete(characterInventory).where(eq(characterInventory.characterId, row.character.id)),
          db.insert(characterInventory).values(inventoryValues),
          db
            .update(characterWealth)
            .set({
              currentCopper: wealth.startingWealthCopper - spentCopper,
              equipmentSpentCopper: spentCopper,
              updatedAt: new Date(),
            })
            .where(eq(characterWealth.characterId, row.character.id)),
        ]);
      } else {
        await db.batch([
          db.delete(characterInventory).where(eq(characterInventory.characterId, row.character.id)),
          db
            .update(characterWealth)
            .set({
              currentCopper: wealth.startingWealthCopper,
              equipmentSpentCopper: 0,
              updatedAt: new Date(),
            })
            .where(eq(characterWealth.characterId, row.character.id)),
        ]);
      }
      await markCreationStep(db, row.character.id, "equipmentFinalized");

      return c.json({
        characterId: row.character.id,
        spentCopper,
        remainingCopper: wealth.startingWealthCopper - spentCopper,
        selections: input.selections,
      });
    },
  );
