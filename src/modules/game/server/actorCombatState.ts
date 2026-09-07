import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  gameActors,
  monsterAttacks,
  monsters,
  runtimeDnd35MonsterInstances,
} from "@/infrastructure/database/schema";
import {
  calculateArmorClass,
  type Dnd35HealthPool,
  type Dnd35Size,
} from "@/rulesets/dnd35";
import type { Dnd35AttackKind } from "../domain/dnd35ActionRuntime";
import { monsterArmorClass } from "../domain/actorRuntime";
import {
  loadAttackActionSnapshot,
  loadWeaponSnapshot,
} from "./d1Dnd35State";
import { loadPersistentHealthPool } from "./healthLifecycleService";
import type { ActorHealthKind } from "./d1ActorHealthStore";

export interface ActorDefenseSnapshot {
  actorId: string;
  armorClass: {
    normal: number;
    touch: number;
    flatFooted: number;
  };
  health: Dnd35HealthPool;
  healthKind: ActorHealthKind;
}

export interface CharacterAttackProfile {
  kind: "character";
  actorId: string;
  attackKind: Dnd35AttackKind;
  baseAttackBonus: number;
  attackAbilityModifier: number;
  size: Dnd35Size;
  sourceId: string | null;
  sourceRuntimeId: string | null;
  damageDice: string;
  damageBonus: number;
  criticalThreatMinimum: number;
  criticalMultiplier: number;
  handedness: "light" | "one_handed" | "two_handed" | "ranged";
}

export interface MonsterAttackProfile {
  kind: "monster";
  actorId: string;
  attackKind: Dnd35AttackKind;
  attackBonus: number;
  sourceId: string;
  sourceRuntimeId: string;
  damageDice: string;
  damageBonus: number;
  criticalThreatMinimum: number;
  criticalMultiplier: number;
}

export type ActorAttackProfile = CharacterAttackProfile | MonsterAttackProfile;

async function loadActor(db: Database, campaignId: string, actorId: string) {
  return db
    .select()
    .from(gameActors)
    .where(and(eq(gameActors.id, actorId), eq(gameActors.campaignId, campaignId)))
    .get();
}

export async function loadActorDefenseSnapshot(input: {
  db: Database;
  campaignId: string;
  actorId: string;
}): Promise<ActorDefenseSnapshot | null> {
  const actor = await loadActor(input.db, input.campaignId, input.actorId);
  if (!actor || actor.status !== "active") return null;

  if (actor.kind === "character") {
    if (!actor.characterId) return null;
    const [selfSnapshot, health] = await Promise.all([
      loadAttackActionSnapshot({
        db: input.db,
        campaignId: input.campaignId,
        attackerId: actor.characterId,
        targetId: actor.characterId,
        kind: "melee",
      }),
      loadPersistentHealthPool({
        db: input.db,
        campaignId: input.campaignId,
        characterId: actor.characterId,
      }),
    ]);
    if (!selfSnapshot || !health) return null;
    const armorClass = calculateArmorClass({
      dexterityModifier: selfSnapshot.targetDexterityModifier,
      size: selfSnapshot.targetSize,
      maxDexterityBonus: selfSnapshot.targetMaximumDexterityBonus,
      modifiers: [
        ...(selfSnapshot.targetArmorBonus === 0
          ? []
          : [
              {
                id: "actor:character:armor",
                source: "Equipped armor",
                kind: "armor" as const,
                value: selfSnapshot.targetArmorBonus,
              },
            ]),
        ...(selfSnapshot.targetShieldBonus === 0
          ? []
          : [
              {
                id: "actor:character:shield",
                source: "Equipped shield",
                kind: "shield" as const,
                value: selfSnapshot.targetShieldBonus,
              },
            ]),
        ...(selfSnapshot.targetNaturalArmor === 0
          ? []
          : [
              {
                id: "actor:character:natural",
                source: "Natural armor",
                kind: "natural-armor" as const,
                value: selfSnapshot.targetNaturalArmor,
              },
            ]),
      ],
    });
    return {
      actorId: actor.id,
      armorClass: {
        normal: armorClass.normal,
        touch: armorClass.touch,
        flatFooted: armorClass.flatFooted,
      },
      health,
      healthKind: "character",
    };
  }

  if (actor.kind === "monster") {
    const row = await input.db
      .select({ instance: runtimeDnd35MonsterInstances, definition: monsters })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    if (!row) return null;
    const armorClass = monsterArmorClass({
      dexterity: row.definition.dex,
      size: row.definition.size,
      naturalArmor: row.definition.naturalArmor,
      armorBonus: row.definition.armorBonus,
      shieldBonus: row.definition.shieldBonus,
      deflectionBonus: row.definition.deflectionBonus,
    });
    return {
      actorId: actor.id,
      armorClass: {
        normal: armorClass.normal,
        touch: armorClass.touch,
        flatFooted: armorClass.flatFooted,
      },
      health: {
        maximumHitPoints: row.instance.maximumHitPoints,
        currentHitPoints: row.instance.currentHitPoints,
        temporaryHitPoints: row.instance.temporaryHitPoints,
        nonlethalDamage: row.instance.nonlethalDamage,
        stable: row.instance.stable,
      },
      healthKind: "monster",
    };
  }

  return null;
}

export async function loadActorAttackProfile(input: {
  db: Database;
  campaignId: string;
  actorId: string;
  kind: Dnd35AttackKind;
  weaponInventoryId?: string;
  monsterAttackId?: string;
}): Promise<ActorAttackProfile | null> {
  const actor = await loadActor(input.db, input.campaignId, input.actorId);
  if (!actor || actor.status !== "active") return null;

  if (actor.kind === "character") {
    if (!actor.characterId || input.monsterAttackId !== undefined) return null;
    const selfSnapshot = await loadAttackActionSnapshot({
      db: input.db,
      campaignId: input.campaignId,
      attackerId: actor.characterId,
      targetId: actor.characterId,
      kind: input.kind,
    });
    if (!selfSnapshot) return null;
    const weapon = await loadWeaponSnapshot({
      db: input.db,
      characterId: actor.characterId,
      ...(input.weaponInventoryId === undefined ? {} : { inventoryId: input.weaponInventoryId }),
      attackerSize: selfSnapshot.attackerSize,
      kind: input.kind,
    });
    if (!weapon) return null;
    return {
      kind: "character",
      actorId: actor.id,
      attackKind: input.kind,
      baseAttackBonus: selfSnapshot.baseAttackBonus,
      attackAbilityModifier: selfSnapshot.attackAbilityModifier,
      size: selfSnapshot.attackerSize,
      sourceId: weapon.itemId,
      sourceRuntimeId: weapon.inventoryId,
      damageDice: weapon.damageDice,
      damageBonus: 0,
      criticalThreatMinimum: weapon.threatMinimum,
      criticalMultiplier: weapon.criticalMultiplier,
      handedness: weapon.handedness,
    };
  }

  if (actor.kind === "monster") {
    if (input.weaponInventoryId !== undefined) return null;
    const instance = await input.db
      .select({ monsterId: runtimeDnd35MonsterInstances.monsterId })
      .from(runtimeDnd35MonsterInstances)
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    if (!instance) return null;

    const clauses = [eq(monsterAttacks.monsterId, instance.monsterId)];
    if (input.monsterAttackId !== undefined) clauses.push(eq(monsterAttacks.id, input.monsterAttackId));
    const candidates = await input.db
      .select()
      .from(monsterAttacks)
      .where(and(...clauses))
      .orderBy(asc(monsterAttacks.routineKey), asc(monsterAttacks.sequence))
      .all();
    const attack = candidates.find((candidate) => {
      if (!candidate.canUseAsStandard) return false;
      if (input.kind === "melee") {
        return candidate.attackMode === "melee" || candidate.attackMode === "melee_touch";
      }
      return candidate.attackMode === "ranged" || candidate.attackMode === "ranged_touch";
    });
    if (!attack) return null;
    return {
      kind: "monster",
      actorId: actor.id,
      attackKind: input.kind,
      attackBonus: attack.attackBonus,
      sourceId: attack.id,
      sourceRuntimeId: attack.id,
      damageDice: attack.damageDice,
      damageBonus: attack.damageBonus,
      criticalThreatMinimum: attack.criticalThreatMinimum,
      criticalMultiplier: attack.criticalMultiplier,
    };
  }

  return null;
}
