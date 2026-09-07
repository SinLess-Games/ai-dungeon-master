/// <reference types="@cloudflare/workers-types" />

import { and, asc, eq } from "drizzle-orm";
import { rollDice } from "@/engine";
import type { Database } from "@/infrastructure/database/client";
import {
  gameActors,
  monsterAttacks,
  monsters,
  runtimeDnd35MonsterInstances,
} from "@/infrastructure/database/schema";
import { consciousnessState, type Dnd35HealthPool } from "@/rulesets/dnd35";
import { deriveMonsterMaximumHitPoints, monsterArmorClass } from "../domain/actorRuntime";
import { loadActiveGameContext } from "./d1Dnd35State";

export interface ActorServiceDependencies {
  db: Database;
  binding: D1Database;
  createId?: () => string;
  now?: () => Date;
  rollMonsterHitPoints?: (count: number, sides: number) => number;
}

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function runtime(deps: ActorServiceDependencies) {
  return {
    id: deps.createId ?? (() => crypto.randomUUID()),
    now: deps.now ?? (() => new Date()),
    hitPoints:
      deps.rollMonsterHitPoints ??
      ((count: number, sides: number) => rollDice(`${count}d${sides}`).total),
  };
}

async function requireDnd35Context(deps: ActorServiceDependencies, campaignId: string) {
  const context = await loadActiveGameContext(deps.db, campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");
  if (context.rulesetId !== "dnd35" || context.rulesetVersion !== "3.5") {
    throw new Error("CAMPAIGN_RULESET_UNSUPPORTED");
  }
  return context;
}

function eventStatement(
  db: D1Database,
  input: {
    id: string;
    campaignId: string;
    sessionId: string;
    eventType: string;
    occurredAt: Date;
    actorId?: string | null;
    sourceId?: string | null;
    targetIds?: readonly string[];
    payload?: Record<string, unknown>;
  },
) {
  const timestamp = unix(input.occurredAt);
  return db
    .prepare(
      `INSERT INTO game_events (
        id, campaign_id, session_id, sequence, event_type, occurred_at,
        actor_id, source_id, target_ids, payload, deltas, created_at
      ) VALUES (
        ?, ?, ?,
        (SELECT COALESCE(MAX(sequence), 0) + 1 FROM game_events WHERE campaign_id = ?),
        ?, ?, ?, ?, ?, ?, '[]', ?
      )`,
    )
    .bind(
      input.id,
      input.campaignId,
      input.sessionId,
      input.campaignId,
      input.eventType,
      timestamp,
      input.actorId ?? null,
      input.sourceId ?? null,
      JSON.stringify(input.targetIds ?? []),
      JSON.stringify(input.payload ?? {}),
      timestamp,
    );
}

function monsterHealth(instance: typeof runtimeDnd35MonsterInstances.$inferSelect): Dnd35HealthPool {
  return {
    maximumHitPoints: instance.maximumHitPoints,
    currentHitPoints: instance.currentHitPoints,
    temporaryHitPoints: instance.temporaryHitPoints,
    nonlethalDamage: instance.nonlethalDamage,
    stable: instance.stable,
  };
}

export async function createMonsterActor(
  deps: ActorServiceDependencies,
  input: {
    campaignId: string;
    monsterId: string;
    name?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const context = await requireDnd35Context(deps, input.campaignId);
  const definition = await deps.db.select().from(monsters).where(eq(monsters.id, input.monsterId)).get();
  if (!definition) throw new Error("MONSTER_DEFINITION_NOT_FOUND");

  const rt = runtime(deps);
  const actorId = rt.id();
  const eventId = rt.id();
  const occurredAt = rt.now();
  const timestamp = unix(occurredAt);
  const maximumHitPoints = deriveMonsterMaximumHitPoints(
    {
      hitDiceNumerator: definition.hitDiceNumerator,
      hitDiceDenominator: definition.hitDiceDenominator,
      hitDie: definition.hitDie,
      hitPointBonus: definition.hitPointBonus,
    },
    rt.hitPoints,
  );
  const name = input.name?.trim() || definition.name;
  const actorMetadata = input.metadata ?? {};

  const actorInsert = deps.binding
    .prepare(
      `INSERT INTO game_actors (
        id, campaign_id, world_id, kind, character_id, controller_user_id,
        name, status, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, 'monster', NULL, NULL, ?, 'active', ?, ?, ?)`,
    )
    .bind(
      actorId,
      context.campaignId,
      context.worldId,
      name,
      JSON.stringify(actorMetadata),
      timestamp,
      timestamp,
    );
  const instanceInsert = deps.binding
    .prepare(
      `INSERT INTO runtime_dnd35_monster_instances (
        actor_id, monster_id, maximum_hit_points, current_hit_points,
        temporary_hit_points, nonlethal_damage, stable, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, 0, 1, '{}', ?, ?)`,
    )
    .bind(actorId, definition.id, maximumHitPoints, maximumHitPoints, timestamp, timestamp);
  const event = eventStatement(deps.binding, {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "actor.monster_created",
    occurredAt,
    actorId,
    sourceId: definition.id,
    targetIds: [actorId],
    payload: {
      actorId,
      monsterId: definition.id,
      name,
      maximumHitPoints,
    },
  });

  await deps.binding.batch([actorInsert, instanceInsert, event]);
  return {
    actorId,
    eventId,
    sessionId: context.sessionId,
    monsterId: definition.id,
    name,
    maximumHitPoints,
  };
}

export async function getGameActor(
  deps: ActorServiceDependencies,
  input: { campaignId: string; actorId: string },
) {
  await requireDnd35Context(deps, input.campaignId);
  const actor = await deps.db
    .select()
    .from(gameActors)
    .where(and(eq(gameActors.id, input.actorId), eq(gameActors.campaignId, input.campaignId)))
    .get();
  if (!actor) return null;

  if (actor.kind !== "monster") {
    return { actor, monster: null };
  }

  const row = await deps.db
    .select({ instance: runtimeDnd35MonsterInstances, definition: monsters })
    .from(runtimeDnd35MonsterInstances)
    .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
    .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
    .get();
  if (!row) throw new Error("MONSTER_RUNTIME_STATE_MISSING");
  const attacks = await deps.db
    .select()
    .from(monsterAttacks)
    .where(eq(monsterAttacks.monsterId, row.definition.id))
    .orderBy(asc(monsterAttacks.routineKey), asc(monsterAttacks.sequence))
    .all();
  const health = monsterHealth(row.instance);
  return {
    actor,
    monster: {
      definitionId: row.definition.id,
      challengeRating: {
        numerator: row.definition.challengeRatingNumerator,
        denominator: row.definition.challengeRatingDenominator,
      },
      hitDice: {
        numerator: row.definition.hitDiceNumerator,
        denominator: row.definition.hitDiceDenominator,
        die: row.definition.hitDie,
        bonus: row.definition.hitPointBonus,
      },
      size: row.definition.size,
      abilities: {
        str: row.definition.str,
        dex: row.definition.dex,
        con: row.definition.con,
        int: row.definition.int,
        wis: row.definition.wis,
        cha: row.definition.cha,
      },
      armorClass: monsterArmorClass({
        dexterity: row.definition.dex,
        size: row.definition.size,
        naturalArmor: row.definition.naturalArmor,
        armorBonus: row.definition.armorBonus,
        shieldBonus: row.definition.shieldBonus,
        deflectionBonus: row.definition.deflectionBonus,
      }),
      saves: {
        fort: row.definition.fort,
        ref: row.definition.ref,
        will: row.definition.will,
      },
      baseAttackBonus: row.definition.baseAttackBonus,
      grappleModifier: row.definition.grappleModifier,
      spaceFeet: row.definition.spaceFeet,
      reachFeet: row.definition.reachFeet,
      health: { ...health, state: consciousnessState(health) },
      attacks,
    },
  };
}

export async function listGameActors(
  deps: ActorServiceDependencies,
  input: { campaignId: string; includeInactive?: boolean },
) {
  await requireDnd35Context(deps, input.campaignId);
  const clauses = [eq(gameActors.campaignId, input.campaignId)];
  if (!input.includeInactive) clauses.push(eq(gameActors.status, "active"));
  return deps.db.select().from(gameActors).where(and(...clauses)).orderBy(asc(gameActors.createdAt)).all();
}
