import { alignmentUserPrompt } from "@/prompts/alignmentUser";
import { alignmentSystemPrompt } from "@/prompts/alignmentSystem";
import { z } from "zod";
import {
  generateOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import type { AlignmentPromptInput } from "@/prompts/alignmentTypes";

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
  input: AlignmentPromptInput,
): Promise<AlignmentEvaluation> {
  const system = alignmentSystemPrompt(input);

  const prompt = alignmentUserPrompt(input);

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
