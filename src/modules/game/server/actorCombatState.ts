import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  armors,
  characterClassLevels,
  characterInventory,
  classLevels,
  dnd35Characters,
  gameActors,
  monsterAttacks,
  monsters,
  races,
  runtimeDnd35MonsterInstances,
  shields,
} from "@/infrastructure/database/schema";
import {
  abilityModifier,
  aggregateClassProgression,
  calculateArmorClass,
  calculateAttackBonus,
  strengthDamageModifier,
  type Dnd35HealthPool,
  type Dnd35Size,
} from "@/rulesets/dnd35";
import { monsterArmorClass } from "../domain/actorRuntime";
import {
  loadEffectiveAbility,
  loadWeaponSnapshot,
  type RuntimeWeaponSnapshot,
} from "./d1Dnd35State";
import { loadPersistentHealthPool } from "./healthLifecycleService";

export type RuntimeActorKind = "character" | "monster" | "npc";
export type RuntimeAttackKind = "melee" | "ranged";
export type RuntimeArmorClassMode = "normal" | "touch";

export interface RuntimeActorIdentity {
  id: string;
  kind: RuntimeActorKind;
  characterId: string | null;
  campaignId: string;
  worldId: string;
}

export interface RuntimeActorDefenseSnapshot {
  actor: RuntimeActorIdentity;
  armorClass: {
    normal: number;
    touch: number;
    flatFooted: number;
  };
}

export interface RuntimeAttackSourceSnapshot {
  attacker: RuntimeActorIdentity;
  sourceId: string | null;
  kind: RuntimeAttackKind;
  armorClassMode: RuntimeArmorClassMode;
  attackBonus: number;
  threatMinimum: number;
  criticalMultiplier: number;
  damageDice: string;
  damageBonus: number;
  label: string;
}

export interface RuntimeActorHealthSnapshot {
  actor: RuntimeActorIdentity;
  pool: Dnd35HealthPool;
}

export async function loadRuntimeActorIdentity(input: {
  db: Database;
  campaignId: string;
  worldId: string;
  actorId: string;
}): Promise<RuntimeActorIdentity | null> {
  const row = await input.db
    .select({
      id: gameActors.id,
      kind: gameActors.kind,
      characterId: gameActors.characterId,
      campaignId: gameActors.campaignId,
      worldId: gameActors.worldId,
    })
    .from(gameActors)
    .where(
      and(
        eq(gameActors.id, input.actorId),
        eq(gameActors.campaignId, input.campaignId),
        eq(gameActors.worldId, input.worldId),
        eq(gameActors.status, "active"),
      ),
    )
    .get();
  return row ?? null;
}

async function characterSize(db: Database, characterId: string): Promise<Dnd35Size | null> {
  const extension = await db
    .select({ raceId: dnd35Characters.raceId, sizeOverride: dnd35Characters.sizeOverride })
    .from(dnd35Characters)
    .where(eq(dnd35Characters.characterId, characterId))
    .get();
  if (!extension) return null;
  if (extension.sizeOverride) return extension.sizeOverride as Dnd35Size;
  if (!extension.raceId) return "medium";
  const race = await db
    .select({ size: races.size })
    .from(races)
    .where(eq(races.id, extension.raceId))
    .get();
  return race ? (race.size as Dnd35Size) : null;
}

async function characterBaseAttackBonus(db: Database, characterId: string): Promise<number> {
  const rows = await db
    .select({
      classId: classLevels.classId,
      level: classLevels.level,
      baseAttackBonus: classLevels.baseAttackBonus,
      fort: classLevels.fort,
      ref: classLevels.ref,
      will: classLevels.will,
      hitDie: classLevels.hitDie,
      skillPoints: classLevels.skillPoints,
      basePowerPoints: classLevels.basePowerPoints,
      powersKnown: classLevels.powersKnown,
      maxPowerLevel: classLevels.maxPowerLevel,
    })
    .from(characterClassLevels)
    .innerJoin(classLevels, eq(characterClassLevels.classLevelId, classLevels.id))
    .where(eq(characterClassLevels.characterId, characterId))
    .all();
  return aggregateClassProgression(rows).baseAttackBonus;
}

async function characterDefense(db: Database, characterId: string) {
  const [dexterity, size, extension, equipped] = await Promise.all([
    loadEffectiveAbility(db, characterId, "dex"),
    characterSize(db, characterId),
    db
      .select({ raceId: dnd35Characters.raceId })
      .from(dnd35Characters)
      .where(eq(dnd35Characters.characterId, characterId))
      .get(),
    db
      .select({ itemId: characterInventory.itemId })
      .from(characterInventory)
      .where(
        and(
          eq(characterInventory.characterId, characterId),
          eq(characterInventory.equipped, true),
        ),
      )
      .all(),
  ]);
  if (dexterity === null || size === null || !extension) return null;

  const itemIds = equipped.map((entry) => entry.itemId);
  const [armorRows, shieldRows, race] = await Promise.all([
    itemIds.length === 0
      ? Promise.resolve([])
      : db.select().from(armors).where(inArray(armors.itemId, itemIds)).all(),
    itemIds.length === 0
      ? Promise.resolve([])
      : db.select().from(shields).where(inArray(shields.itemId, itemIds)).all(),
    extension.raceId
      ? db
          .select({ naturalArmor: races.naturalArmor })
          .from(races)
          .where(eq(races.id, extension.raceId))
          .get()
      : Promise.resolve(undefined),
  ]);
  const dexCaps = [...armorRows, ...shieldRows]
    .map((entry) => entry.maxDexBonus)
    .filter((value): value is number => value !== null);
  const armorBonus = armorRows.reduce((best, entry) => Math.max(best, entry.acBonus), 0);
  const shieldBonus = shieldRows.reduce((best, entry) => Math.max(best, entry.acBonus), 0);
  const naturalArmor = race?.naturalArmor ?? 0;

  return calculateArmorClass({
    dexterityModifier: abilityModifier(dexterity),
    size,
    maxDexterityBonus: dexCaps.length === 0 ? null : Math.min(...dexCaps),
    modifiers: [
      ...(armorBonus === 0
        ? []
        : [{ id: "runtime:armor", source: "Equipped armor", kind: "armor", value: armorBonus }]),
      ...(shieldBonus === 0
        ? []
        : [{ id: "runtime:shield", source: "Equipped shield", kind: "shield", value: shieldBonus }]),
      ...(naturalArmor === 0
        ? []
        : [{ id: "runtime:natural", source: "Natural armor", kind: "natural-armor", value: naturalArmor }]),
    ],
  });
}

export async function loadActorDefenseSnapshot(input: {
  db: Database;
  campaignId: string;
  worldId: string;
  actorId: string;
}): Promise<RuntimeActorDefenseSnapshot | null> {
  const actor = await loadRuntimeActorIdentity(input);
  if (!actor) return null;

  if (actor.kind === "character") {
    if (!actor.characterId) return null;
    const ac = await characterDefense(input.db, actor.characterId);
    if (!ac) return null;
    return {
      actor,
      armorClass: { normal: ac.normal, touch: ac.touch, flatFooted: ac.flatFooted },
    };
  }

  if (actor.kind === "monster") {
    const row = await input.db
      .select({ definition: monsters })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsters, eq(runtimeDnd35MonsterInstances.monsterId, monsters.id))
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    if (!row) return null;
    const ac = monsterArmorClass({
      dexterity: row.definition.dex,
      size: row.definition.size,
      naturalArmor: row.definition.naturalArmor,
      armorBonus: row.definition.armorBonus,
      shieldBonus: row.definition.shieldBonus,
      deflectionBonus: row.definition.deflectionBonus,
    });
    return {
      actor,
      armorClass: { normal: ac.normal, touch: ac.touch, flatFooted: ac.flatFooted },
    };
  }

  return null;
}

function characterStrengthDamage(input: {
  strengthModifier: number;
  weapon: RuntimeWeaponSnapshot;
  kind: RuntimeAttackKind;
}): number {
  return strengthDamageModifier({
    strengthModifier: input.strengthModifier,
    handUse: input.weapon.handedness === "two_handed" ? "two_handed" : "primary",
    attackMode:
      input.kind === "melee"
        ? "melee"
        : input.weapon.handedness === "ranged"
          ? "projectile"
          : "thrown",
  });
}

export async function loadActorAttackSource(input: {
  db: Database;
  campaignId: string;
  worldId: string;
  attackerId: string;
  kind: RuntimeAttackKind;
  weaponInventoryId?: string;
  monsterAttackId?: string;
}): Promise<RuntimeAttackSourceSnapshot | null> {
  const attacker = await loadRuntimeActorIdentity({
    db: input.db,
    campaignId: input.campaignId,
    worldId: input.worldId,
    actorId: input.attackerId,
  });
  if (!attacker) return null;

  if (attacker.kind === "character") {
    if (!attacker.characterId || input.monsterAttackId !== undefined) return null;
    const [size, abilityScore, strengthScore, bab] = await Promise.all([
      characterSize(input.db, attacker.characterId),
      loadEffectiveAbility(input.db, attacker.characterId, input.kind === "melee" ? "str" : "dex"),
      loadEffectiveAbility(input.db, attacker.characterId, "str"),
      characterBaseAttackBonus(input.db, attacker.characterId),
    ]);
    if (size === null || abilityScore === null || strengthScore === null) return null;
    const weapon = await loadWeaponSnapshot({
      db: input.db,
      characterId: attacker.characterId,
      attackerSize: size,
      kind: input.kind,
      ...(input.weaponInventoryId === undefined ? {} : { inventoryId: input.weaponInventoryId }),
    });
    if (!weapon) return null;
    const attackBonus = calculateAttackBonus({
      baseAttackBonus: bab,
      abilityModifier: abilityModifier(abilityScore),
      size,
    }).total;
    return {
      attacker,
      sourceId: weapon.itemId,
      kind: input.kind,
      armorClassMode: "normal",
      attackBonus,
      threatMinimum: weapon.threatMinimum,
      criticalMultiplier: weapon.criticalMultiplier,
      damageDice: weapon.damageDice,
      damageBonus: characterStrengthDamage({
        strengthModifier: abilityModifier(strengthScore),
        weapon,
        kind: input.kind,
      }),
      label: weapon.itemId ?? "unarmed strike",
    };
  }

  if (attacker.kind === "monster") {
    if (!input.monsterAttackId || input.weaponInventoryId !== undefined) return null;
    const row = await input.db
      .select({ attack: monsterAttacks })
      .from(runtimeDnd35MonsterInstances)
      .innerJoin(monsterAttacks, eq(runtimeDnd35MonsterInstances.monsterId, monsterAttacks.monsterId))
      .where(
        and(
          eq(runtimeDnd35MonsterInstances.actorId, attacker.id),
          eq(monsterAttacks.id, input.monsterAttackId),
        ),
      )
      .get();
    if (!row) return null;
    const kind: RuntimeAttackKind = row.attack.attackMode.startsWith("ranged") ? "ranged" : "melee";
    if (kind !== input.kind) return null;
    return {
      attacker,
      sourceId: row.attack.id,
      kind,
      armorClassMode: row.attack.attackMode.endsWith("touch") ? "touch" : "normal",
      // Monster stat blocks persist the final printed attack bonus. Do not add
      // BAB/ability/size a second time.
      attackBonus: row.attack.attackBonus,
      threatMinimum: row.attack.criticalThreatMinimum,
      criticalMultiplier: row.attack.criticalMultiplier,
      damageDice: row.attack.damageDice,
      damageBonus: row.attack.damageBonus,
      label: row.attack.name,
    };
  }

  return null;
}

export async function loadActorHealthSnapshot(input: {
  db: Database;
  campaignId: string;
  worldId: string;
  actorId: string;
}): Promise<RuntimeActorHealthSnapshot | null> {
  const actor = await loadRuntimeActorIdentity(input);
  if (!actor) return null;

  if (actor.kind === "character") {
    if (!actor.characterId) return null;
    const pool = await loadPersistentHealthPool({
      db: input.db,
      campaignId: input.campaignId,
      characterId: actor.characterId,
    });
    return pool ? { actor, pool } : null;
  }

  if (actor.kind === "monster") {
    const row = await input.db
      .select()
      .from(runtimeDnd35MonsterInstances)
      .where(eq(runtimeDnd35MonsterInstances.actorId, actor.id))
      .get();
    if (!row) return null;
    return {
      actor,
      pool: {
        maximumHitPoints: row.maximumHitPoints,
        currentHitPoints: row.currentHitPoints,
        temporaryHitPoints: row.temporaryHitPoints,
        nonlethalDamage: row.nonlethalDamage,
        stable: row.stable,
      },
    };
  }

  return null;
}
