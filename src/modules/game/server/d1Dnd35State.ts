import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/infrastructure/database/client";
import {
  armors,
  campaigns,
  characterAbilityIncreases,
  characterAbilityScores,
  characterClassLevels,
  characterInventory,
  characterSkills,
  characters,
  classLevels,
  dnd35Characters,
  gameSessions,
  items,
  raceAbilities,
  races,
  shields,
  skills,
  weaponDamage,
  weapons,
} from "@/infrastructure/database/schema";
import { maximumHitPointsFromClassTracks } from "@/modules/characters/domain/hitPoints";
import { racialHitPoints } from "@/modules/characters/domain/monsterRaceCreation";
import {
  abilityModifier,
  aggregateClassProgression,
  calculateArmorClass,
  calculateEncumbranceState,
  combineArmorCheckPenalty,
  combineMaximumDexterityBonus,
  encumberedLandSpeed,
  encumbrancePenaltyProfile,
  effectiveAbilityScore,
  grappleSizeModifier,
  type Dnd35Size,
  type EncumbranceState,
} from "@/rulesets/dnd35";
import type {
  Dnd35AttackActionSnapshot,
  Dnd35AttackKind,
  Dnd35SaveActionSnapshot,
  Dnd35SaveKind,
  Dnd35SkillActionSnapshot,
} from "../domain/dnd35ActionRuntime";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
const ABILITY_KEYS: readonly AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface ActiveGameContext {
  campaignId: string;
  worldId: string;
  sessionId: string;
  rulesetId: string;
  rulesetVersion: string;
}

export interface RuntimeWeaponSnapshot {
  inventoryId: string | null;
  itemId: string | null;
  attackKind: Dnd35AttackKind;
  threatMinimum: number;
  criticalMultiplier: number;
  damageDice: string;
  handedness: "light" | "one_handed" | "two_handed" | "ranged";
}

export interface RuntimeHealthSnapshot {
  characterId: string;
  maximumHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  nonlethalDamage: number;
}

export interface RuntimeEncumbranceSnapshot extends EncumbranceState {
  /** False means one or more carried catalog items have no recorded weight. */
  weightComplete: boolean;
  unknownWeightItems: number;
}

export interface RuntimeCharacterSheetSnapshot {
  characterId: string;
  abilities: Record<AbilityKey, { score: number; modifier: number }>;
  characterLevel: number;
  baseAttackBonus: number;
  armorClass: {
    normal: number;
    touch: number;
    flatFooted: number;
    dexterityModifierApplied: number;
    maximumDexterityBonus: number | null;
  };
  saves: Record<Dnd35SaveKind, number>;
  initiative: number;
  grapple: number;
  health: RuntimeHealthSnapshot;
  encumbrance: RuntimeEncumbranceSnapshot;
}

function saveAbility(save: Dnd35SaveKind): AbilityKey {
  if (save === "fort") return "con";
  if (save === "ref") return "dex";
  return "wis";
}

export async function loadActiveGameContext(
  db: Database,
  campaignId: string,
): Promise<ActiveGameContext | null> {
  const campaign = await db
    .select({
      id: campaigns.id,
      status: campaigns.status,
      worldId: campaigns.worldId,
      rulesetId: campaigns.rulesetId,
      rulesetVersion: campaigns.rulesetVersion,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .get();
  if (!campaign || campaign.status !== "active" || !campaign.worldId) return null;

  const session = await db
    .select({ id: gameSessions.id, worldId: gameSessions.worldId })
    .from(gameSessions)
    .where(and(eq(gameSessions.campaignId, campaignId), eq(gameSessions.status, "active")))
    .orderBy(desc(gameSessions.ordinal))
    .limit(1)
    .get();
  if (!session || session.worldId !== campaign.worldId) return null;

  return {
    campaignId: campaign.id,
    worldId: campaign.worldId,
    sessionId: session.id,
    rulesetId: campaign.rulesetId,
    rulesetVersion: campaign.rulesetVersion,
  };
}

async function requireActiveCharacter(db: Database, campaignId: string, characterId: string) {
  const character = await db
    .select({
      id: characters.id,
      campaignId: characters.campaignId,
      status: characters.status,
      rulesetId: characters.rulesetId,
      rulesetVersion: characters.rulesetVersion,
    })
    .from(characters)
    .where(and(eq(characters.id, characterId), eq(characters.campaignId, campaignId)))
    .get();
  if (!character || character.status !== "active") return null;
  return character;
}

async function loadDndCharacter(db: Database, characterId: string) {
  return db
    .select()
    .from(dnd35Characters)
    .where(eq(dnd35Characters.characterId, characterId))
    .get();
}

export async function loadEffectiveAbility(
  db: Database,
  characterId: string,
  ability: AbilityKey,
): Promise<number | null> {
  const extension = await loadDndCharacter(db, characterId);
  if (!extension) return null;

  const [score, racial, increases] = await Promise.all([
    db
      .select()
      .from(characterAbilityScores)
      .where(
        and(
          eq(characterAbilityScores.characterId, characterId),
          eq(characterAbilityScores.ability, ability),
        ),
      )
      .get(),
    extension.raceId
      ? db
          .select({ modifier: raceAbilities.modifier })
          .from(raceAbilities)
          .where(and(eq(raceAbilities.raceId, extension.raceId), eq(raceAbilities.ability, ability)))
          .get()
      : Promise.resolve(undefined),
    db
      .select({ amount: characterAbilityIncreases.amount })
      .from(characterAbilityIncreases)
      .where(
        and(
          eq(characterAbilityIncreases.characterId, characterId),
          eq(characterAbilityIncreases.ability, ability),
        ),
      )
      .all(),
  ]);
  if (!score) return null;

  return effectiveAbilityScore({
    baseScore: score.baseScore,
    inherentBonus: score.inherentBonus,
    racialAdjustment: racial?.modifier ?? 0,
    levelAdjustment: increases.reduce((sum, increase) => sum + increase.amount, 0),
    temporaryAdjustment: score.temporaryAdjustment,
    abilityDamage: score.abilityDamage,
    abilityDrain: score.abilityDrain,
  });
}

async function loadProgression(db: Database, characterId: string) {
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
  return aggregateClassProgression(rows);
}

async function loadRaceCombatData(db: Database, characterId: string) {
  const extension = await loadDndCharacter(db, characterId);
  if (!extension) return null;
  if (!extension.raceId) {
    return {
      size: (extension.sizeOverride ?? "medium") as Dnd35Size,
      naturalArmor: 0,
      baseSpeedFeet: 30,
    };
  }
  const race = await db
    .select({
      size: races.size,
      naturalArmor: races.naturalArmor,
      baseSpeedFeet: races.baseSpeedFeet,
    })
    .from(races)
    .where(eq(races.id, extension.raceId))
    .get();
  if (!race) return null;
  return {
    size: (extension.sizeOverride ?? race.size) as Dnd35Size,
    naturalArmor: race.naturalArmor,
    baseSpeedFeet: race.baseSpeedFeet,
  };
}

async function loadDefensiveEquipment(db: Database, characterId: string) {
  const equipped = await db
    .select({ itemId: characterInventory.itemId })
    .from(characterInventory)
    .where(
      and(
        eq(characterInventory.characterId, characterId),
        eq(characterInventory.equipped, true),
      ),
    )
    .all();
  const itemIds = equipped.map((entry) => entry.itemId);
  if (itemIds.length === 0) {
    return {
      armorBonus: 0,
      shieldBonus: 0,
      maximumDexterityBonus: null as number | null,
      armorCheckPenalty: 0,
      speedAt30Feet: null as number | null,
      speedAt20Feet: null as number | null,
      movementRestricted: false,
      runMultiplier: 4,
    };
  }

  const [armorRows, shieldRows] = await Promise.all([
    db.select().from(armors).where(inArray(armors.itemId, itemIds)).all(),
    db.select().from(shields).where(inArray(shields.itemId, itemIds)).all(),
  ]);
  const dexCaps = [...armorRows, ...shieldRows]
    .map((entry) => entry.maxDexBonus)
    .filter((value): value is number => value !== null);
  const speedAt30 = [...armorRows, ...shieldRows]
    .map((entry) => entry.speedAt30Feet)
    .filter((value): value is number => value !== null);
  const speedAt20 = [...armorRows, ...shieldRows]
    .map((entry) => entry.speedAt20Feet)
    .filter((value): value is number => value !== null);
  const movementRestricted =
    armorRows.some((entry) => entry.category === "medium" || entry.category === "heavy") ||
    shieldRows.some((entry) => entry.speedAt30Feet !== null || entry.speedAt20Feet !== null);

  return {
    armorBonus: armorRows.reduce((best, entry) => Math.max(best, entry.acBonus), 0),
    shieldBonus: shieldRows.reduce((best, entry) => Math.max(best, entry.acBonus), 0),
    maximumDexterityBonus: dexCaps.length === 0 ? null : Math.min(...dexCaps),
    armorCheckPenalty:
      armorRows.reduce((sum, entry) => sum + entry.armorCheckPenalty, 0) +
      shieldRows.reduce((sum, entry) => sum + entry.armorCheckPenalty, 0),
    speedAt30Feet: speedAt30.length === 0 ? null : Math.min(...speedAt30),
    speedAt20Feet: speedAt20.length === 0 ? null : Math.min(...speedAt20),
    movementRestricted,
    runMultiplier: armorRows.some((entry) => entry.category === "heavy") ? 3 : 4,
  };
}

function equipmentAdjustedLandSpeed(
  baseSpeedFeet: number,
  defense: Awaited<ReturnType<typeof loadDefensiveEquipment>>,
): number {
  if (baseSpeedFeet === 30 && defense.speedAt30Feet !== null) {
    return Math.min(baseSpeedFeet, defense.speedAt30Feet);
  }
  if (baseSpeedFeet === 20 && defense.speedAt20Feet !== null) {
    return Math.min(baseSpeedFeet, defense.speedAt20Feet);
  }
  if (defense.movementRestricted) {
    return encumberedLandSpeed(baseSpeedFeet, encumbrancePenaltyProfile("medium"));
  }
  return baseSpeedFeet;
}

export async function loadEncumbranceSnapshot(input: {
  db: Database;
  campaignId: string;
  characterId: string;
}): Promise<RuntimeEncumbranceSnapshot | null> {
  if (!(await requireActiveCharacter(input.db, input.campaignId, input.characterId))) return null;
  const [extension, strength, raceData, defense, inventoryRows] = await Promise.all([
    loadDndCharacter(input.db, input.characterId),
    loadEffectiveAbility(input.db, input.characterId, "str"),
    loadRaceCombatData(input.db, input.characterId),
    loadDefensiveEquipment(input.db, input.characterId),
    input.db
      .select({ quantity: characterInventory.quantity, weightPounds: items.weightPounds })
      .from(characterInventory)
      .innerJoin(items, eq(characterInventory.itemId, items.id))
      .where(
        and(
          eq(characterInventory.characterId, input.characterId),
          eq(characterInventory.location, "carried"),
        ),
      )
      .all(),
  ]);
  if (!extension || strength === null || !raceData) return null;

  let carriedWeight = 0;
  let unknownWeightItems = 0;
  for (const row of inventoryRows) {
    if (row.weightPounds === null) {
      unknownWeightItems += row.quantity;
      continue;
    }
    carriedWeight += row.weightPounds * row.quantity;
  }

  const encumbrance = calculateEncumbranceState({
    strength,
    size: raceData.size,
    carriedWeight,
    baseLandSpeedFeet: raceData.baseSpeedFeet,
    enabled: extension.encumbranceEnabled,
  });
  const equipmentLandSpeed = equipmentAdjustedLandSpeed(raceData.baseSpeedFeet, defense);

  return {
    ...encumbrance,
    landSpeedFeet: Math.min(encumbrance.landSpeedFeet, equipmentLandSpeed),
    runMultiplier: Math.min(encumbrance.runMultiplier, defense.runMultiplier),
    weightComplete: unknownWeightItems === 0,
    unknownWeightItems,
  };
}

export async function loadCharacterSheetSnapshot(input: {
  db: Database;
  campaignId: string;
  characterId: string;
}): Promise<RuntimeCharacterSheetSnapshot | null> {
  if (!(await requireActiveCharacter(input.db, input.campaignId, input.characterId))) return null;

  const abilityValues = await Promise.all(
    ABILITY_KEYS.map((ability) => loadEffectiveAbility(input.db, input.characterId, ability)),
  );
  if (abilityValues.some((value) => value === null)) return null;
  const abilities = {} as RuntimeCharacterSheetSnapshot["abilities"];
  ABILITY_KEYS.forEach((ability, index) => {
    const score = abilityValues[index];
    if (score === null || score === undefined) return;
    abilities[ability] = { score, modifier: abilityModifier(score) };
  });

  const [progression, raceData, defense, health, encumbrance] = await Promise.all([
    loadProgression(input.db, input.characterId),
    loadRaceCombatData(input.db, input.characterId),
    loadDefensiveEquipment(input.db, input.characterId),
    loadHealthSnapshot(input),
    loadEncumbranceSnapshot(input),
  ]);
  if (!raceData || !health || !encumbrance) return null;

  const maximumDexterityBonus = combineMaximumDexterityBonus(
    defense.maximumDexterityBonus,
    encumbrance.maxDexterityBonus,
  );
  const armorClass = calculateArmorClass({
    dexterityModifier: abilities.dex.modifier,
    size: raceData.size,
    maxDexterityBonus: maximumDexterityBonus,
    modifiers: [
      ...(defense.armorBonus > 0
        ? [{ id: "equipment:armor", source: "equipment", kind: "armor", value: defense.armorBonus }]
        : []),
      ...(defense.shieldBonus > 0
        ? [{ id: "equipment:shield", source: "equipment", kind: "shield", value: defense.shieldBonus }]
        : []),
      ...(raceData.naturalArmor > 0
        ? [
            {
              id: "race:natural-armor",
              source: "race",
              kind: "natural-armor",
              value: raceData.naturalArmor,
            },
          ]
        : []),
    ],
  });

  return {
    characterId: input.characterId,
    abilities,
    characterLevel: progression.characterLevel,
    baseAttackBonus: progression.baseAttackBonus,
    armorClass: {
      normal: armorClass.normal,
      touch: armorClass.touch,
      flatFooted: armorClass.flatFooted,
      dexterityModifierApplied: armorClass.dexterityModifierApplied,
      maximumDexterityBonus,
    },
    saves: {
      fort: progression.fort + abilities.con.modifier,
      ref: progression.ref + abilities.dex.modifier,
      will: progression.will + abilities.wis.modifier,
    },
    initiative: abilities.dex.modifier,
    grapple:
      progression.baseAttackBonus + abilities.str.modifier + grappleSizeModifier(raceData.size),
    health,
    encumbrance: {
      ...encumbrance,
      armorCheckPenalty: combineArmorCheckPenalty(
        defense.armorCheckPenalty,
        encumbrance.armorCheckPenalty,
      ),
    },
  };
}

export async function loadSkillActionSnapshot(input: {
  db: Database;
  campaignId: string;
  characterId: string;
  skillId: string;
  specialization?: string;
}): Promise<Dnd35SkillActionSnapshot | null> {
  if (!(await requireActiveCharacter(input.db, input.campaignId, input.characterId))) return null;

  const definition = await input.db
    .select()
    .from(skills)
    .where(eq(skills.id, input.skillId))
    .get();
  if (!definition || !definition.ability) return null;

  const specialization = input.specialization ?? "";
  const [rankRow, abilityScore, defense, encumbrance] = await Promise.all([
    input.db
      .select({ ranks: characterSkills.ranks })
      .from(characterSkills)
      .where(
        and(
          eq(characterSkills.characterId, input.characterId),
          eq(characterSkills.skillId, input.skillId),
          eq(characterSkills.specialization, specialization),
        ),
      )
      .get(),
    loadEffectiveAbility(input.db, input.characterId, definition.ability as AbilityKey),
    loadDefensiveEquipment(input.db, input.characterId),
    loadEncumbranceSnapshot({
      db: input.db,
      campaignId: input.campaignId,
      characterId: input.characterId,
    }),
  ]);
  if (abilityScore === null) return null;

  const baseArmorCheckPenalty = combineArmorCheckPenalty(
    defense.armorCheckPenalty,
    encumbrance?.armorCheckPenalty ?? 0,
  );
  return {
    actorId: input.characterId,
    skillId: input.skillId,
    ranks: rankRow?.ranks ?? 0,
    abilityModifier: abilityModifier(abilityScore),
    armorCheckPenalty: baseArmorCheckPenalty * definition.armorCheckMultiplier,
    trainedOnly: definition.trainedOnly,
  };
}

export async function loadSaveActionSnapshot(input: {
  db: Database;
  campaignId: string;
  characterId: string;
  save: Dnd35SaveKind;
}): Promise<Dnd35SaveActionSnapshot | null> {
  if (!(await requireActiveCharacter(input.db, input.campaignId, input.characterId))) return null;
  const [progression, score] = await Promise.all([
    loadProgression(input.db, input.characterId),
    loadEffectiveAbility(input.db, input.characterId, saveAbility(input.save)),
  ]);
  if (score === null) return null;
  return {
    actorId: input.characterId,
    baseSaveBonus: progression[input.save],
    abilityModifier: abilityModifier(score),
  };
}

export async function loadWeaponSnapshot(input: {
  db: Database;
  characterId: string;
  inventoryId?: string;
  attackerSize: Dnd35Size;
  kind: Dnd35AttackKind;
}): Promise<RuntimeWeaponSnapshot | null> {
  if (!input.inventoryId) {
    if (input.kind !== "melee") return null;
    return {
      inventoryId: null,
      itemId: null,
      attackKind: "melee",
      threatMinimum: 20,
      criticalMultiplier: 2,
      damageDice: "1d3",
      handedness: "one_handed",
    };
  }

  const inventory = await input.db
    .select({ itemId: characterInventory.itemId, location: characterInventory.location })
    .from(characterInventory)
    .where(
      and(
        eq(characterInventory.id, input.inventoryId),
        eq(characterInventory.characterId, input.characterId),
      ),
    )
    .get();
  if (!inventory || inventory.location !== "carried") return null;

  const weapon = await input.db
    .select()
    .from(weapons)
    .where(eq(weapons.itemId, inventory.itemId))
    .get();
  if (!weapon) return null;
  if (weapon.attackKind !== "both" && weapon.attackKind !== input.kind) return null;

  const damage = await input.db
    .select({ dice: weaponDamage.dice })
    .from(weaponDamage)
    .where(
      and(
        eq(weaponDamage.weaponId, weapon.itemId),
        eq(weaponDamage.size, input.attackerSize),
        eq(weaponDamage.weaponEnd, 1),
      ),
    )
    .get();
  if (!damage) return null;

  return {
    inventoryId: input.inventoryId,
    itemId: weapon.itemId,
    attackKind: input.kind,
    threatMinimum: weapon.criticalThreatMinimum,
    criticalMultiplier: weapon.criticalMultiplier,
    damageDice: damage.dice,
    handedness: weapon.handedness,
  };
}

export async function loadAttackActionSnapshot(input: {
  db: Database;
  campaignId: string;
  attackerId: string;
  targetId: string;
  kind: Dnd35AttackKind;
}): Promise<Dnd35AttackActionSnapshot | null> {
  const [attacker, target] = await Promise.all([
    requireActiveCharacter(input.db, input.campaignId, input.attackerId),
    requireActiveCharacter(input.db, input.campaignId, input.targetId),
  ]);
  if (!attacker || !target) return null;

  const [
    attackerRace,
    targetRace,
    progression,
    attackAbility,
    targetDexterity,
    targetDefense,
    targetEncumbrance,
  ] = await Promise.all([
    loadRaceCombatData(input.db, input.attackerId),
    loadRaceCombatData(input.db, input.targetId),
    loadProgression(input.db, input.attackerId),
    loadEffectiveAbility(input.db, input.attackerId, input.kind === "melee" ? "str" : "dex"),
    loadEffectiveAbility(input.db, input.targetId, "dex"),
    loadDefensiveEquipment(input.db, input.targetId),
    loadEncumbranceSnapshot({
      db: input.db,
      campaignId: input.campaignId,
      characterId: input.targetId,
    }),
  ]);
  if (!attackerRace || !targetRace || attackAbility === null || targetDexterity === null) return null;

  return {
    attackerId: input.attackerId,
    targetId: input.targetId,
    baseAttackBonus: progression.baseAttackBonus,
    attackAbilityModifier: abilityModifier(attackAbility),
    attackerSize: attackerRace.size,
    targetDexterityModifier: abilityModifier(targetDexterity),
    targetSize: targetRace.size,
    targetNaturalArmor: targetRace.naturalArmor,
    targetArmorBonus: targetDefense.armorBonus,
    targetShieldBonus: targetDefense.shieldBonus,
    targetMaximumDexterityBonus: combineMaximumDexterityBonus(
      targetDefense.maximumDexterityBonus,
      targetEncumbrance?.maxDexterityBonus ?? null,
    ),
  };
}

export async function loadHealthSnapshot(input: {
  db: Database;
  campaignId: string;
  characterId: string;
}): Promise<RuntimeHealthSnapshot | null> {
  if (!(await requireActiveCharacter(input.db, input.campaignId, input.characterId))) return null;
  const [extension, constitution, hpRows] = await Promise.all([
    loadDndCharacter(input.db, input.characterId),
    loadEffectiveAbility(input.db, input.characterId, "con"),
    input.db
      .select({
        characterLevel: characterClassLevels.characterLevel,
        hitPointsGained: characterClassLevels.hitPointsGained,
      })
      .from(characterClassLevels)
      .where(eq(characterClassLevels.characterId, input.characterId))
      .orderBy(characterClassLevels.characterLevel)
      .all(),
  ]);
  if (!extension || constitution === null) return null;

  const selectedRace = extension.raceId
    ? await input.db
        .select({ racialHitDice: races.racialHitDice, racialHitDie: races.racialHitDie })
        .from(races)
        .where(eq(races.id, extension.raceId))
        .get()
    : undefined;
  const constitutionModifier = abilityModifier(constitution);
  const maximum =
    racialHitPoints(
      selectedRace?.racialHitDice ?? 0,
      selectedRace?.racialHitDie ?? null,
      constitutionModifier,
    ) + maximumHitPointsFromClassTracks(hpRows, constitutionModifier);
  if (maximum < 1) return null;

  return {
    characterId: input.characterId,
    maximumHitPoints: maximum,
    currentHitPoints: extension.currentHitPoints,
    temporaryHitPoints: extension.temporaryHitPoints,
    nonlethalDamage: extension.nonlethalDamage,
  };
}
