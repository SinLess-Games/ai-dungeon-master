import { dmNarrationUserPrompt } from "@/prompts/dmNarrationUser";
import { DM_NARRATION_SYSTEM_PROMPT } from "@/prompts/dmNarrationSystem";
import {
  streamOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import { assertCampaignDmNarration } from "./dmCampaignChatPolicy";
import type { DmResponseStream } from "./dmResponseStream";

/** Tools and their metadata are validated before this presentation-only model call. */
export async function streamDmNarration(
  env: OpenAICompatibleEnv,
  approvedNarration: string,
  stream: DmResponseStream,
): Promise<string> {
  const text = await streamOpenAICompatibleText(
    env,
    {
      system: DM_NARRATION_SYSTEM_PROMPT,
      prompt: dmNarrationUserPrompt(approvedNarration),
      temperature: 0.2,
      maxTokens: 1600,
      signal: stream.signal,
      ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
    },
    stream.delta,
  );
  return assertCampaignDmNarration(text);
}
