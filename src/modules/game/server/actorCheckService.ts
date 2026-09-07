import { and, eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  gameActors,
  monsters,
  runtimeDnd35MonsterInstances,
} from "@/infrastructure/database/schema";
import { resolveSavingThrow } from "@/rulesets/dnd35";
import type { Dnd35SaveKind } from "../domain/dnd35ActionRuntime";
import { loadActiveGameContext, loadSaveActionSnapshot } from "./d1Dnd35State";
import { D1GameEventStore } from "./d1GameEventStore";

export interface ActorCheckDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
}

async function requireContext(deps: ActorCheckDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

async function actorSaveBonus(
  deps: ActorCheckDependencies,
  input: { campaignId: string; actorId: string; save: Dnd35SaveKind },
): Promise<number | null> {
  const actor = await deps.db
    .select({ kind: gameActors.kind, characterId: gameActors.characterId })
    .from(gameActors)
    .where(
      and(
        eq(gameActors.id, input.actorId),
        eq(gameActors.campaignId, input.campaignId),
        eq(gameActors.status, "active"),
      ),
    )
    .get();
  if (!actor) return null;

  if (actor.kind === "character" && actor.characterId) {
    const snapshot = await loadSaveActionSnapshot({
      db: deps.db,
      campaignId: input.campaignId,
      characterId: actor.characterId,
      save: input.save,
    });
    return snapshot
      ? snapshot.baseSaveBonus + snapshot.abilityModifier + (snapshot.miscModifier ?? 0)
      : null;
  }

  if (actor.kind === "monster") {
    const row = await deps.db
      .select({ fort: monsters.fort, ref: monsters.ref, will: monsters.will })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    return row?.[input.save] ?? null;
  }

  return null;
}

/** Resolve and persist a saving throw for any D&D combat-capable runtime actor. */
export async function performActorSavingThrow(
  deps: ActorCheckDependencies,
  input: {
    campaignId: string;
    actorId: string;
    save: Dnd35SaveKind;
    dc: number;
    sourceId?: string;
    roll?: number;
  },
) {
  if (!Number.isFinite(input.dc)) throw new RangeError("Saving throw DC must be finite.");
  const context = await requireContext(deps, input.campaignId);
  const bonus = await actorSaveBonus(deps, input);
  if (bonus === null) throw new Error("GAME_ACTOR_NOT_FOUND");
  const result = resolveSavingThrow({
    saveBonus: bonus,
    dc: input.dc,
    ...(input.roll === undefined ? {} : { roll: input.roll }),
  });
  const eventId = deps.createId?.() ?? crypto.randomUUID();
  await new D1GameEventStore(deps.binding).append({
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "check.save",
    occurredAt: deps.now?.() ?? new Date(),
    actorId: input.actorId,
    sourceId: input.sourceId ?? null,
    payload: {
      save: input.save,
      dc: input.dc,
      bonus,
      naturalRoll: result.naturalRoll,
      total: result.total,
      margin: result.margin,
      passed: result.passed,
      automaticSuccess: result.automaticSuccess,
      automaticFailure: result.automaticFailure,
    },
  });
  return {
    actorId: input.actorId,
    save: input.save,
    bonus,
    result,
    eventId,
    sessionId: context.sessionId,
  };
}
