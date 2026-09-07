import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  characterConditions,
  characters,
  conditions,
  gameActors,
  gameEvents,
  runtimeDnd35ActorConditions,
} from "@/infrastructure/database/schema";
import { consciousnessState } from "@/rulesets/dnd35";
import { loadActorDefenseSnapshot } from "./actorCombatState";
import { getGameActor } from "./actorService";
import { getCharacterCastingState } from "./castingService";
import { loadActiveGameContext } from "./d1Dnd35State";
import { getActiveEncounter } from "./encounterService";

export interface GameReadModelDependencies {
  db: Database;
  binding: D1Database;
}

async function requireContext(deps: GameReadModelDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  return context;
}

async function latestEventSequence(db: Database, campaignId: string): Promise<number> {
  const row = await db
    .select({ sequence: gameEvents.sequence })
    .from(gameEvents)
    .where(eq(gameEvents.campaignId, campaignId))
    .orderBy(desc(gameEvents.sequence))
    .limit(1)
    .get();
  return row?.sequence ?? 0;
}

export interface GameActorSummaryReadModel {
  id: string;
  kind: "character" | "monster" | "npc";
  name: string;
  status: "active" | "defeated" | "removed" | "archived";
  controllerUserId: string | null;
  characterId: string | null;
  health: {
    maximumHitPoints: number;
    currentHitPoints: number;
    temporaryHitPoints: number;
    nonlethalDamage: number;
    stable: boolean;
    state: ReturnType<typeof consciousnessState>;
  } | null;
  armorClass: {
    normal: number;
    touch: number;
    flatFooted: number;
  } | null;
}

async function actorSummaries(
  deps: GameReadModelDependencies,
  campaignId: string,
  actorIds: readonly string[],
): Promise<readonly GameActorSummaryReadModel[]> {
  if (actorIds.length === 0) return [];
  const rows = await deps.db
    .select({
      id: gameActors.id,
      kind: gameActors.kind,
      name: gameActors.name,
      status: gameActors.status,
      controllerUserId: gameActors.controllerUserId,
      characterId: gameActors.characterId,
    })
    .from(gameActors)
    .where(and(eq(gameActors.campaignId, campaignId), inArray(gameActors.id, [...actorIds])))
    .all();
  const byId = new Map(rows.map((row) => [row.id, row]));

  return Promise.all(
    actorIds.map(async (actorId) => {
      const actor = byId.get(actorId);
      if (!actor) throw new Error("GAME_ACTOR_NOT_FOUND");
      const defense = await loadActorDefenseSnapshot({ db: deps.db, campaignId, actorId });
      return {
        ...actor,
        health: defense
          ? { ...defense.health, state: consciousnessState(defense.health) }
          : null,
        armorClass: defense ? defense.armorClass : null,
      };
    }),
  );
}

export async function getGameStateReadModel(
  deps: GameReadModelDependencies,
  campaignId: string,
) {
  const context = await requireContext(deps, campaignId);
  const [sequence, encounter] = await Promise.all([
    latestEventSequence(deps.db, campaignId),
    getActiveEncounter({ db: deps.db, binding: deps.binding }, campaignId),
  ]);

  if (!encounter) {
    return {
      version: 1 as const,
      context,
      latestEventSequence: sequence,
      encounter: null,
    };
  }

  const actorIds = encounter.participants.map((participant) => participant.characterId);
  const summaries = await actorSummaries(deps, campaignId, actorIds);
  const actorById = new Map(summaries.map((actor) => [actor.id, actor]));

  return {
    version: 1 as const,
    context,
    latestEventSequence: sequence,
    encounter: {
      id: encounter.id,
      status: encounter.status,
      roundNumber: encounter.roundNumber,
      activeTurnIndex: encounter.activeTurnIndex,
      currentActorId: encounter.currentCharacterId,
      participants: encounter.participants.map((participant) => ({
        actorId: participant.characterId,
        initiativeRoll: participant.initiativeRoll,
        initiativeModifier: participant.initiativeModifier,
        initiativeTotal: participant.initiativeTotal,
        turnOrder: participant.turnOrder,
        standardAvailable: participant.standardAvailable,
        moveAvailable: participant.moveAvailable,
        swiftAvailable: participant.swiftAvailable,
        attacksOfOpportunityRemaining: participant.attacksOfOpportunityRemaining,
        actor: actorById.get(participant.characterId) ?? null,
      })),
    },
  };
}

async function runtimeConditions(
  deps: GameReadModelDependencies,
  actorId: string,
) {
  return deps.db
    .select({
      instanceId: runtimeDnd35ActorConditions.id,
      conditionId: runtimeDnd35ActorConditions.conditionId,
      name: conditions.name,
      durationKind: runtimeDnd35ActorConditions.durationKind,
      remainingRounds: runtimeDnd35ActorConditions.remainingRounds,
      encounterId: runtimeDnd35ActorConditions.encounterId,
      expiresEncounterRound: runtimeDnd35ActorConditions.expiresEncounterRound,
      expiresTurnOrder: runtimeDnd35ActorConditions.expiresTurnOrder,
      expiresAt: runtimeDnd35ActorConditions.expiresAt,
      sourceActorId: runtimeDnd35ActorConditions.sourceActorId,
      sourceDescription: runtimeDnd35ActorConditions.sourceDescription,
      state: runtimeDnd35ActorConditions.state,
    })
    .from(runtimeDnd35ActorConditions)
    .innerJoin(conditions, eq(runtimeDnd35ActorConditions.conditionId, conditions.id))
    .where(eq(runtimeDnd35ActorConditions.actorId, actorId))
    .orderBy(asc(runtimeDnd35ActorConditions.createdAt))
    .all();
}

async function legacyCharacterConditions(
  deps: GameReadModelDependencies,
  characterId: string,
) {
  return deps.db
    .select({
      instanceId: characterConditions.id,
      conditionId: characterConditions.conditionId,
      name: conditions.name,
      durationKind: characterConditions.durationKind,
      remainingRounds: characterConditions.remainingRounds,
      encounterId: characterConditions.encounterId,
      expiresEncounterRound: characterConditions.expiresEncounterRound,
      expiresTurnOrder: characterConditions.expiresTurnOrder,
      expiresAt: characterConditions.expiresAt,
      sourceActorId: characterConditions.sourceCharacterId,
      sourceDescription: characterConditions.sourceDescription,
      state: characterConditions.state,
    })
    .from(characterConditions)
    .innerJoin(conditions, eq(characterConditions.conditionId, conditions.id))
    .where(eq(characterConditions.characterId, characterId))
    .orderBy(asc(characterConditions.createdAt))
    .all();
}

export async function getGameActorReadModel(
  deps: GameReadModelDependencies,
  input: { campaignId: string; actorId: string },
) {
  const context = await requireContext(deps, input.campaignId);
  const actorDetail = await getGameActor(deps, input);
  if (!actorDetail) throw new Error("GAME_ACTOR_NOT_FOUND");
  const actor = actorDetail.actor;
  const [sequence, defense, runtime, character] = await Promise.all([
    latestEventSequence(deps.db, input.campaignId),
    loadActorDefenseSnapshot({ db: deps.db, campaignId: input.campaignId, actorId: input.actorId }),
    runtimeConditions(deps, input.actorId),
    actor.characterId
      ? deps.db
          .select({
            id: characters.id,
            name: characters.name,
            status: characters.status,
            ownerUserId: characters.ownerUserId,
            metadata: characters.metadata,
          })
          .from(characters)
          .where(eq(characters.id, actor.characterId))
          .get()
      : Promise.resolve(null),
  ]);

  const legacy = actor.characterId
    ? await legacyCharacterConditions(deps, actor.characterId)
    : [];
  let casting: Awaited<ReturnType<typeof getCharacterCastingState>> | null = null;
  if (actor.kind === "character" && actor.characterId) {
    casting = await getCharacterCastingState(deps, {
      campaignId: input.campaignId,
      characterId: actor.characterId,
    });
  }

  return {
    version: 1 as const,
    context,
    latestEventSequence: sequence,
    actor,
    character,
    monster: actorDetail.monster,
    health: defense
      ? { ...defense.health, state: consciousnessState(defense.health) }
      : null,
    armorClass: defense?.armorClass ?? null,
    conditions: [
      ...legacy.map((condition) => ({ ...condition, storage: "legacy-character" as const })),
      ...runtime.map((condition) => ({ ...condition, storage: "runtime-actor" as const })),
    ],
    casting,
  };
}
