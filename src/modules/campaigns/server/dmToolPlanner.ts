import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";

const skillCheckSchema = z.object({
  type: z.literal("check.skill"),
  skillId: z.string().trim().min(1).max(200),
  specialization: z.string().trim().max(200).optional(),
  dc: z.number().int().min(0).max(200),
  reason: z.string().trim().min(1).max(500),
});

const saveCheckSchema = z.object({
  type: z.literal("check.save"),
  save: z.enum(["fort", "ref", "will"]),
  dc: z.number().int().min(0).max(200),
  reason: z.string().trim().min(1).max(500),
});

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
]);

export type DmTurnDecision = z.infer<typeof dmTurnDecisionSchema>;

export interface DmPlannerSkillOption {
  id: string;
  name: string;
  ability: string | null;
  specialization: string;
  ranks: number;
  trainedOnly: boolean;
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

export async function planDmTurn(
  env: OpenAICompatibleEnv,
  input: {
    campaignName: string;
    campaignDescription: string | null;
    rulesetId: string;
    rulesetVersion: string;
    settings: Record<string, unknown>;
    actors: unknown[];
    recentEvents: unknown[];
    conversation: string;
    character: { id: string; name: string; actorId: string };
    skills: DmPlannerSkillOption[];
  },
): Promise<DmTurnDecision> {
  const allowedSkills = input.skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    ability: skill.ability,
    specialization: skill.specialization,
    ranks: skill.ranks,
    trainedOnly: skill.trainedOnly,
  }));

  const system = [
    `You are the Dungeon Master turn planner for an ${input.rulesetId} ${input.rulesetVersion} campaign.`,
    "Your output is consumed by a deterministic rules engine. Return exactly one JSON object and no markdown.",
    "Choose narration when no mechanical uncertainty needs resolution.",
    "Choose check only when the player's declared action requires a D&D skill check or saving throw before the outcome can be narrated.",
    "Never invent a roll, never change HP/items/XP/conditions directly, and never claim a check succeeded or failed before it is resolved.",
    "For skill checks, use only an exact skillId from the supplied allowed skills. Preserve its specialization exactly when present.",
    "Use a reasonable integer DC for the established situation. Do not request unnecessary checks for routine actions.",
    "JSON forms:",
    '{"kind":"narration","text":"..."}',
    '{"kind":"check","preface":"...","check":{"type":"check.skill","skillId":"...","specialization":"...","dc":15,"reason":"..."}}',
    '{"kind":"check","preface":"...","check":{"type":"check.save","save":"fort|ref|will","dc":15,"reason":"..."}}',
  ].join(" ");

  const prompt = [
    `Campaign: ${input.campaignName}`,
    `Description: ${input.campaignDescription || "No campaign description provided."}`,
    `Campaign settings: ${JSON.stringify(input.settings).slice(0, 5000)}`,
    `Current actors: ${JSON.stringify(input.actors).slice(0, 5000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 7000)}`,
    `Acting character: ${JSON.stringify(input.character)}`,
    `Allowed skills for this character: ${JSON.stringify(allowedSkills).slice(0, 9000)}`,
    "Recent conversation:",
    input.conversation || "(No previous messages.)",
    "Plan the response to the most recent player message.",
  ].join("\n\n");

  const response = await generateOpenAICompatibleText(env, {
    system,
    prompt,
    temperature: 0.15,
    maxTokens: 700,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });

  const decision = parseDmTurnDecision(response);
  if (decision.kind !== "check" || decision.check.type !== "check.skill") return decision;

  const requestedSpecialization = decision.check.specialization ?? "";
  const allowed = input.skills.find(
    (skill) =>
      skill.id === decision.check.skillId && skill.specialization === requestedSpecialization,
  );
  if (!allowed) {
    throw new Error("AI_DM_REQUESTED_UNAVAILABLE_SKILL");
  }

  return decision;
}
