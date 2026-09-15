import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type { DmToolAlignmentContext } from "./dmToolContext";

const alignmentEvaluationSchema = z.discriminatedUnion("record", [
  z.object({ record: z.literal(false) }),
  z.object({
    record: z.literal(true),
    lawChaosDelta: z.number().int().min(-20).max(20),
    goodEvilDelta: z.number().int().min(-20).max(20),
    reason: z.string().trim().min(1).max(600),
  }),
]);

export type AlignmentEvaluation = z.infer<typeof alignmentEvaluationSchema>;

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
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

export function parseAlignmentEvaluation(value: string): AlignmentEvaluation {
  return alignmentEvaluationSchema.parse(JSON.parse(extractJsonObject(value)) as unknown);
}

/**
 * Alignment is DM adjudication rather than a deterministic core 3.5 formula.
 * The model may assess a meaningful act, but it can only propose small bounded
 * axis deltas. The deterministic alignment tracker decides whether a public
 * alignment threshold is actually crossed.
 */
export async function evaluateAlignmentAction(
  env: OpenAICompatibleEnv,
  input: {
    signal?: AbortSignal;
    rulesetId: string;
    rulesetVersion: string;
    characterName: string;
    current: DmToolAlignmentContext;
    playerAction: string;
    authoritativeResults: unknown[];
    recentEvents: unknown[];
  },
): Promise<AlignmentEvaluation> {
  const system = [
    `You adjudicate ongoing alignment drift for an ${input.rulesetId} ${input.rulesetVersion} character.`,
    "Return exactly one JSON object and no markdown.",
    'Most ordinary actions are not alignment events. Return {"record":false} unless the player\'s completed choice meaningfully demonstrates lawful/chaotic or good/evil conduct.',
    "Judge the player's actual choice and authoritative outcome, not hypothetical consequences.",
    "Positive lawChaosDelta means lawful; negative means chaotic. Positive goodEvilDelta means good; negative means evil.",
    "Use small magnitudes for ordinary but meaningful conduct (1-5), medium for strong conduct (6-10), and 11-20 only for extraordinary defining acts.",
    "Do not change alignment directly. Do not compensate one axis merely to preserve the current alignment.",
    "When recording, explain the concrete action in the reason without moralizing beyond the established facts.",
    'Forms: {"record":false} OR {"record":true,"lawChaosDelta":0,"goodEvilDelta":-4,"reason":"..."}.',
  ].join(" ");

  const prompt = [
    `Character: ${input.characterName}`,
    `Current alignment state: ${JSON.stringify(input.current)}`,
    `Player action: ${input.playerAction}`,
    `Authoritative results from this turn: ${JSON.stringify(input.authoritativeResults).slice(0, 8000)}`,
    `Recent authoritative events: ${JSON.stringify(input.recentEvents).slice(0, 6000)}`,
    "Assess only this completed player turn.",
  ].join("\n\n");

  const response = await generateOpenAICompatibleText(env, {
    ...(input.signal ? { signal: input.signal } : {}),
    system,
    prompt,
    temperature: 0,
    maxTokens: 350,
    ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
  });
  const evaluation = parseAlignmentEvaluation(response);
  if (evaluation.record && evaluation.lawChaosDelta === 0 && evaluation.goodEvilDelta === 0) {
    return { record: false };
  }
  return evaluation;
}
