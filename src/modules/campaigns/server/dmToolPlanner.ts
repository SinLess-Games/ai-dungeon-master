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

const dmCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("encounter.start"),
    participantIds: z.array(id).min(1).max(40),
  }),
  z.object({
    type: z.literal("encounter.end_turn"),
  }),
  z.object({
    type: z.literal("encounter.finish"),
    status: z.enum(["completed", "abandoned"]).optional(),
  }),
  z.object({
    type: z.literal("combat.attack"),
    targetId: id,
    kind: z.enum(["melee", "ranged"]),
    weaponInventoryId: id.optional(),
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

export const dmTurnDecisionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("narration"),
    text: z.string().trim().min(1).max(4000),
  }),
  z.object({
    kind: z.literal("check"),
    preface: z.string().trim().min(1).max(1500),
    check: z.discriminatedUnion("type", [skillCheckSchema, saveCheckSchema]),
  }),
  z.object({
    kind: z.literal("command"),
    command: dmCommandSchema,
  }),
]);

export type DmTurnDecision = z.infer<typeof dmTurnDecisionSchema>;
export type DmPlannerCommand = z.infer<typeof dmCommandSchema>;

export interface DmPlannerSkillOption {
  id: string;
  name: string;
  ability: string | null;
  specialization: string;
  ranks: number;
  trainedOnly: boolean;
}

export interface DmPlannerActor {
  id: string;
  characterId: string | null;
  name: string;
  kind: string;
  status: string;
}

export interface DmPlannerContext {
  actors: DmPlannerActor[];
  encounter: DmToolEncounterContext | null;
  activeConditions: DmToolActiveCondition[];
  character: DmToolCharacterContext;
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

/**
 * Rejects planner output that references state the acting character cannot use.
 * Rules validation still happens again in executeGameCommand; this layer prevents
 * invented ids from ever reaching the authoritative command boundary.
 */
export function validateDmTurnDecision(
  decision: DmTurnDecision,
  context: DmPlannerContext,
): DmTurnDecision {
  if (decision.kind === "narration") return decision;
  if (decision.kind === "check") {
    if (decision.check.type !== "check.skill") return decision;
    const requestedSpecialization = decision.check.specialization ?? "";
    const allowed = context.character.skills.find(
      (skill) =>
        skill.id === decision.check.skillId && skill.specialization === requestedSpecialization,
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
      if (!context.encounter || context.encounter.currentActorId !== context.character.character.actorId) {
        throw new Error("AI_DM_END_TURN_NOT_AVAILABLE");
      }
      break;
    case "encounter.finish":
      if (!context.encounter) throw new Error("AI_DM_ENCOUNTER_NOT_ACTIVE");
      break;
    case "combat.attack": {
      if (!allowedActors.has(command.targetId) || command.targetId === context.character.character.actorId) {
        throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      }
      if (command.weaponInventoryId) {
        const weapon = context.character.weapons.find(
          (option) => option.inventoryId === command.weaponInventoryId,
        );
        if (!weapon || (weapon.attackKind !== "both" && weapon.attackKind !== command.kind)) {
          throw new Error("AI_DM_REQUESTED_UNAVAILABLE_WEAPON");
        }
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
    case "condition.apply":
      if (!allowedActors.has(command.targetId)) throw new Error("AI_DM_REQUESTED_UNKNOWN_TARGET");
      break;
    case "condition.remove":
      if (!context.activeConditions.some((condition) => condition.runtimeConditionId === command.runtimeConditionId)) {
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

export async function planDmTurn(
  env: OpenAICompatibleEnv,
  input: {
    campaignName: string;
    campaignDescription: string | null;
    rulesetId: string;
    rulesetVersion: string;
    settings: Record<string, unknown>;
    recentEvents: unknown[];
    conversation: string;
    context: DmPlannerContext;
    authoritativeToolResults?: unknown[];
  },
): Promise<DmTurnDecision> {
  const context = input.context;
  const system = [
    `You are the Dungeon Master turn planner for an ${input.rulesetId} ${input.rulesetVersion} campaign.`,
    "Your output is consumed by a deterministic rules engine. Return exactly one JSON object and no markdown.",
    "Choose narration only when no authoritative mechanic needs to run next.",
    "Choose check when the acting player must supply a d20 skill check or saving throw before play can continue.",
    "Choose command for an authoritative action the engine can resolve immediately.",
    "Never invent a roll, HP result, item id, inventory id, spell id, power id, condition instance id, actor id, encounter id, or mechanical outcome.",
    "Use only ids present in the supplied tool context. Item and condition grants are the exception: itemRef/conditionRef may be an exact common catalog name or slug and will be resolved server-side.",
    "Use combat.attack for weapon attacks rather than health.damage. Use spell/power commands for casting rather than manually applying their damage or conditions.",
    "Use health.damage/heal only for already-determined direct effects such as environmental damage, a trap whose outcome no longer needs a roll, or explicit narrative healing.",
    "Use inventory.grant and progression.xp.grant only when the fiction has actually awarded treasure or XP. Do not award XP merely for attempting an action.",
    "Use condition.apply/remove only when the condition is an authoritative consequence, not as flavor text.",
    "Do not request unnecessary checks for routine actions.",
    "For skill checks, use the exact skillId and specialization from allowed skills.",
    "When authoritative tool results are supplied, continue from those exact results; do not contradict them or repeat a command that already succeeded.",
    "JSON forms include:",
    '{"kind":"narration","text":"..."}',
    '{"kind":"check","preface":"...","check":{"type":"check.skill","skillId":"...","dc":15,"reason":"..."}}',
    '{"kind":"check","preface":"...","check":{"type":"check.save","save":"fort|ref|will","dc":15,"reason":"..."}}',
    '{"kind":"command","command":{"type":"combat.attack","targetId":"...","kind":"melee","weaponInventoryId":"..."}}',
    '{"kind":"command","command":{"type":"spell.cast.prepared","castingTrackId":"...","spellId":"...","preparationId":"...","targetIds":["..."]}}',
    '{"kind":"command","command":{"type":"power.manifest","castingTrackId":"...","powerId":"...","targetIds":["..."]}}',
    '{"kind":"command","command":{"type":"encounter.start","participantIds":["..."]}}',
    '{"kind":"command","command":{"type":"health.damage","targetId":"...","amount":4,"reason":"..."}}',
    '{"kind":"command","command":{"type":"condition.apply","targetId":"...","conditionRef":"prone","durationKind":"special","reason":"..."}}',
    '{"kind":"command","command":{"type":"inventory.grant","itemRef":"longsword","quantity":1,"reason":"..."}}',
    '{"kind":"command","command":{"type":"progression.xp.grant","amount":300,"reason":"..."}}',
  ].join(" ");

  const toolContext = {
    actors: context.actors,
    encounter: context.encounter,
    actingCharacter: context.character.character,
    allowedSkills: context.character.skills,
    carriedWeapons: context.character.weapons,
    castingTracks: context.character.castingTracks,
    inventory: context.character.inventory,
    alignment: context.character.alignment,
    activeConditions: context.activeConditions,
  };

  const prompt = [
    `Campaign: ${input.campaignName}`,
    `Description: ${input.campaignDescription || "No campaign description provided."}`,
    `Campaign settings: ${JSON.stringify(input.settings).slice(0, 5000)}`,
    `Tool context: ${JSON.stringify(toolContext).slice(0, 18000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 7000)}`,
    `Authoritative results from this turn: ${JSON.stringify(input.authoritativeToolResults ?? []).slice(0, 9000)}`,
    "Recent conversation:",
    input.conversation || "(No previous messages.)",
    "Choose the single next step for the most recent player turn.",
  ].join("\n\n");

  const response = await generateOpenAICompatibleText(env, {
    system,
    prompt,
    temperature: 0.1,
    maxTokens: 1100,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });

  return validateDmTurnDecision(parseDmTurnDecision(response), context);
}
