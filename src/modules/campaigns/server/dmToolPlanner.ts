import { dmTurnSystemPrompt } from "@/prompts/dmTurnSystem";
import { dmTurnUserPrompt } from "@/prompts/dmTurnUser";
import { legacyDmTurnSystemPrompt } from "@/prompts/legacyDmTurnSystem";
import { legacyDmTurnUserPrompt } from "@/prompts/legacyDmTurnUser";
import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type {
  DmToolActiveCondition,
  DmToolCharacterContext,
  DmToolEncounterContext,
} from "./dmToolContext";

const id = z.string().trim().min(1).max(200);
const reason = z.string().trim().min(1).max(600);
const positiveAmount = z.number().int().min(1).max(1_000_000);

const skillCheckSchema = z.object({
  type: z.literal("check.skill"),
  skillId: id,
  specialization: z.string().trim().max(200).optional(),
  dc: z.number().int().min(0).max(200),
  reason,
});

const saveCheckSchema = z.object({
  type: z.literal("check.save"),
  save: z.enum(["fort", "ref", "will"]),
  dc: z.number().int().min(0).max(200),
  reason,
});

const narratedNpcSchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  location: z.string().trim().min(1).max(500).optional(),
  attitude: z.string().trim().min(1).max(300).optional(),
  notes: z.string().trim().min(1).max(1000).optional(),
});

const narratedItemAwardSchema = z.object({
  itemRef: z.string().trim().min(1).max(200),
  quantity: positiveAmount,
  location: z.enum(["carried", "stored", "party"]).optional(),
  reason,
});

const narrationDecisionSchema = z.object({
  kind: z.literal("narration"),
  text: z.string().trim().min(1).max(4000),
  /** Named NPCs that were created, reused, or materially present in this narration. */
  npcs: z.array(narratedNpcSchema).max(20).optional(),
  /** Safety-net awards for items the narration explicitly places in the acting character's possession. */
  itemAwards: z.array(narratedItemAwardSchema).max(20).optional(),
});
const legacyNarrationDecisionSchema = z.object({
  kind: z.literal("narration"),
  text: z.string().trim().min(1).max(4000),
});
const checkDecisionSchema = z.object({
  kind: z.literal("check"),
  preface: z.string().trim().min(1).max(1500),
  check: z.discriminatedUnion("type", [skillCheckSchema, saveCheckSchema]),
});

const dmCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("encounter.start"), participantIds: z.array(id).min(1).max(40) }),
  z.object({ type: z.literal("encounter.end_turn") }),
  z.object({
    type: z.literal("encounter.finish"),
    status: z.enum(["completed", "abandoned"]).optional(),
  }),
  z.object({
    type: z.literal("combat.attack"),
    /** Omit for the acting player character; specify an exposed non-character actor for DM-run attacks. */
    attackerId: id.optional(),
    targetId: id,
    kind: z.enum(["melee", "ranged"]),
    weaponInventoryId: id.optional(),
    monsterAttackId: id.optional(),
  }),
  z.object({
    type: z.literal("spell.cast.prepared"),
    castingTrackId: id,
    spellId: id,
    preparationId: id,
    targetIds: z.array(id).max(20).optional(),
  }),
  z.object({
    type: z.literal("spell.cast.spontaneous"),
    castingTrackId: id,
    spellId: id,
    slotLevel: z.number().int().min(0).max(20).optional(),
    targetIds: z.array(id).max(20).optional(),
  }),
  z.object({
    type: z.literal("power.manifest"),
    castingTrackId: id,
    powerId: id,
    targetIds: z.array(id).max(20).optional(),
    augmentations: z
      .array(
        z.object({
          index: z.number().int().min(0).max(100),
          applications: z.number().int().min(1).max(100).optional(),
        }),
      )
      .max(20)
      .optional(),
  }),
  z.object({
    type: z.literal("health.damage"),
    targetId: id,
    amount: z.number().int().min(0).max(1_000_000),
    reason,
  }),
  z.object({
    type: z.literal("health.heal"),
    targetId: id,
    amount: z.number().int().min(0).max(1_000_000),
    reason,
  }),
  z.object({
    type: z.literal("condition.apply"),
    targetId: id,
    conditionRef: z.string().trim().min(1).max(200),
    durationKind: z.enum(["rounds", "permanent", "special"]),
    remainingRounds: z.number().int().min(1).max(10_000).optional(),
    reason,
  }),
  z.object({
    type: z.literal("condition.remove"),
    runtimeConditionId: id,
    reason,
  }),
  z.object({
    type: z.literal("inventory.grant"),
    itemRef: z.string().trim().min(1).max(200),
    quantity: positiveAmount,
    location: z.enum(["carried", "stored", "party"]).optional(),
    reason,
  }),
  z.object({
    type: z.literal("inventory.remove"),
    inventoryId: id,
    quantity: positiveAmount,
    reason,
  }),
  z.object({
    type: z.literal("progression.xp.grant"),
    amount: positiveAmount,
    reason,
  }),
]);

const commandDecisionSchema = z.object({
  kind: z.literal("command"),
  command: dmCommandSchema,
});

export const dmTurnDecisionSchema = z.discriminatedUnion("kind", [
  narrationDecisionSchema,
  checkDecisionSchema,
  commandDecisionSchema,
]);
const legacyDmTurnDecisionSchema = z.discriminatedUnion("kind", [
  legacyNarrationDecisionSchema,
  checkDecisionSchema,
]);

export type DmTurnDecision = z.infer<typeof dmTurnDecisionSchema>;
export type DmPlannerCommand = z.infer<typeof dmCommandSchema>;
export type LegacyDmTurnDecision = z.infer<typeof legacyDmTurnDecisionSchema>;

export interface DmPlannerSkillOption {
  id: string;
  name: string;
  ability: string | null;
  specialization: string;
  ranks: number;
  trainedOnly: boolean;
}

export interface DmPlannerMonsterAttackOption {
  id: string;
  name: string;
  attackMode: "melee" | "ranged" | "melee_touch" | "ranged_touch";
  canUseAsStandard: boolean;
  attackCount: number;
  routineKey: string;
  sequence: number;
}

export interface DmPlannerActor {
  id: string;
  characterId: string | null;
  name: string;
  kind: string;
  status: string;
  attacks?: DmPlannerMonsterAttackOption[];
}

export interface DmPlannerContext {
  actors: DmPlannerActor[];
  encounter: DmToolEncounterContext | null;
  activeConditions: DmToolActiveCondition[];
  character: DmToolCharacterContext;
}

interface CommonDmTurnInput {
  signal?: AbortSignal;
  campaignName: string;
  campaignDescription: string | null;
  rulesetId: string;
  rulesetVersion: string;
  settings: Record<string, unknown>;
  recentEvents: unknown[];
  conversation: string;
}

export interface StructuredDmTurnInput extends CommonDmTurnInput {
  context: DmPlannerContext;
  authoritativeToolResults?: unknown[];
}

/** Compatibility shape used by the original check-only route. */
export interface LegacyDmTurnInput extends CommonDmTurnInput {
  actors: unknown[];
  character: { id: string; name: string; actorId: string };
  skills: DmPlannerSkillOption[];
}

function extractJsonObject(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export function parseDmTurnDecision(value: string): DmTurnDecision {
  const parsed = JSON.parse(extractJsonObject(value)) as unknown;
  return dmTurnDecisionSchema.parse(parsed);
}

function parseLegacyDmTurnDecision(value: string): LegacyDmTurnDecision {
  const parsed = JSON.parse(extractJsonObject(value)) as unknown;
  return legacyDmTurnDecisionSchema.parse(parsed);
}

function actorIds(context: DmPlannerContext): Set<string> {
  return new Set(context.actors.map((actor) => actor.id));
}

function requireTargets(context: DmPlannerContext, ids: readonly string[] | undefined): void {
  if (!ids) return;
  const allowed = actorIds(context);
  if (ids.some((targetId) => !allowed.has(targetId))) {
    throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
  }
}

function monsterAttackKind(
  attackMode: DmPlannerMonsterAttackOption["attackMode"],
): "melee" | "ranged" {
  return attackMode === "ranged" || attackMode === "ranged_touch" ? "ranged" : "melee";
}

export function validateDmTurnDecision(
  decision: DmTurnDecision,
  context: DmPlannerContext,
): DmTurnDecision {
  if (decision.kind === "narration") return decision;
  if (decision.kind === "check") {
    const check = decision.check;
    if (check.type !== "check.skill") return decision;
    const requestedSpecialization = check.specialization ?? "";
    const allowed = context.character.skills.find(
      (skill) => skill.id === check.skillId && skill.specialization === requestedSpecialization,
    );
    if (!allowed) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SKILL");
    return decision;
  }

  const command = decision.command;
  const allowedActors = actorIds(context);
  switch (command.type) {
    case "encounter.start":
      if (context.encounter) throw new Error("AI_DM_ENCOUNTER_ALREADY_ACTIVE");
      if (command.participantIds.some((actorId) => !allowedActors.has(actorId))) {
        throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      }
      break;
    case "encounter.end_turn":
      if (!context.encounter?.currentActorId) throw new Error("AI_DM_END_TURN_NOT_AVAILABLE");
      break;
    case "encounter.finish":
      if (!context.encounter) throw new Error("AI_DM_ENCOUNTER_NOT_ACTIVE");
      break;
    case "combat.attack": {
      const attackerId = command.attackerId ?? context.character.character.actorId;
      const attacker = context.actors.find((actor) => actor.id === attackerId);
      const target = context.actors.find((actor) => actor.id === command.targetId);
      if (!attacker || attacker.status !== "active" || !target || target.status !== "active") {
        throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      }
      if (attackerId === command.targetId) throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      if (context.encounter && context.encounter.currentActorId !== attackerId) {
        throw new Error("AI_DM_ATTACKER_NOT_CURRENT_TURN");
      }

      if (attacker.kind === "character") {
        if (attackerId !== context.character.character.actorId || command.monsterAttackId) {
          throw new Error("AI_DM_REQUESTED_UNAVAILABLE_ATTACKER");
        }
        if (command.weaponInventoryId) {
          const weapon = context.character.weapons.find(
            (option) => option.inventoryId === command.weaponInventoryId,
          );
          if (!weapon || (weapon.attackKind !== "both" && weapon.attackKind !== command.kind)) {
            throw new Error("AI_DM_REQUESTED_UNAVAILABLE_WEAPON");
          }
        }
      } else if (attacker.kind === "monster") {
        if (command.weaponInventoryId || !command.monsterAttackId) {
          throw new Error("AI_DM_REQUESTED_UNAVAILABLE_MONSTER_ATTACK");
        }
        const attack = attacker.attacks?.find((option) => option.id === command.monsterAttackId);
        if (
          !attack ||
          !attack.canUseAsStandard ||
          monsterAttackKind(attack.attackMode) !== command.kind
        ) {
          throw new Error("AI_DM_REQUESTED_UNAVAILABLE_MONSTER_ATTACK");
        }
      } else {
        throw new Error("AI_DM_REQUESTED_UNAVAILABLE_ATTACKER");
      }
      break;
    }
    case "spell.cast.prepared": {
      requireTargets(context, command.targetIds);
      const track = context.character.castingTracks.find(
        (candidate) => candidate.id === command.castingTrackId && candidate.mode === "prepared",
      );
      const spell = track?.prepared.find(
        (candidate) =>
          candidate.spellId === command.spellId &&
          candidate.preparationId === command.preparationId &&
          candidate.remaining > 0,
      );
      if (!spell) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SPELL");
      break;
    }
    case "spell.cast.spontaneous": {
      requireTargets(context, command.targetIds);
      const track = context.character.castingTracks.find(
        (candidate) => candidate.id === command.castingTrackId && candidate.mode === "spontaneous",
      );
      const spell = track?.spontaneous.find((candidate) => candidate.spellId === command.spellId);
      if (!spell) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SPELL");
      break;
    }
    case "power.manifest": {
      requireTargets(context, command.targetIds);
      const track = context.character.castingTracks.find(
        (candidate) => candidate.id === command.castingTrackId && candidate.mode === "psionic",
      );
      const power = track?.powers.find((candidate) => candidate.powerId === command.powerId);
      if (!power) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_POWER");
      break;
    }
    case "health.damage":
    case "health.heal":
      if (!allowedActors.has(command.targetId)) throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      break;
    case "condition.apply":
      if (!allowedActors.has(command.targetId)) throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      if (
        (command.durationKind === "rounds" && command.remainingRounds === undefined) ||
        (command.durationKind !== "rounds" && command.remainingRounds !== undefined)
      ) {
        throw new Error("AI_DM_CONDITION_DURATION_INVALID");
      }
      break;
    case "condition.remove":
      if (
        !context.activeConditions.some(
          (condition) => condition.runtimeConditionId === command.runtimeConditionId,
        )
      ) {
        throw new Error("AI_DM_REQUESTED_UNKNOWN_CONDITION");
      }
      break;
    case "inventory.remove": {
      const inventory = context.character.inventory.find(
        (entry) => entry.inventoryId === command.inventoryId,
      );
      if (!inventory || inventory.equipped || command.quantity > inventory.quantity) {
        throw new Error("AI_DM_REQUESTED_UNAVAILABLE_INVENTORY");
      }
      break;
    }
    case "inventory.grant":
    case "progression.xp.grant":
      break;
  }
  return decision;
}

function validateLegacySkill(
  decision: LegacyDmTurnDecision,
  skills: readonly DmPlannerSkillOption[],
): LegacyDmTurnDecision {
  if (decision.kind !== "check") return decision;
  const check = decision.check;
  if (check.type !== "check.skill") return decision;
  const requestedSpecialization = check.specialization ?? "";
  const allowed = skills.find(
    (skill) => skill.id === check.skillId && skill.specialization === requestedSpecialization,
  );
  if (!allowed) throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SKILL");
  return decision;
}

export function planDmTurn(
  env: OpenAICompatibleEnv,
  input: LegacyDmTurnInput,
): Promise<LegacyDmTurnDecision>;
export function planDmTurn(
  env: OpenAICompatibleEnv,
  input: StructuredDmTurnInput,
): Promise<DmTurnDecision>;
export async function planDmTurn(
  env: OpenAICompatibleEnv,
  input: LegacyDmTurnInput | StructuredDmTurnInput,
): Promise<DmTurnDecision> {
  if (!("context" in input)) {
    const system = legacyDmTurnSystemPrompt(input);
    const response = await generateOpenAICompatibleText(env, {
      ...(input.signal ? { signal: input.signal } : {}),
      system,
      prompt: legacyDmTurnUserPrompt(input),
      temperature: 0.15,
      maxTokens: 700,
      ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
    });
    return validateLegacySkill(parseLegacyDmTurnDecision(response), input.skills);
  }

  const context = input.context;
  const system = dmTurnSystemPrompt(input);

  const response = await generateOpenAICompatibleText(env, {
    ...(input.signal ? { signal: input.signal } : {}),
    system,
    prompt: dmTurnUserPrompt(input),
    temperature: 0.1,
    maxTokens: 1400,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });
  return validateDmTurnDecision(parseDmTurnDecision(response), context);
}
