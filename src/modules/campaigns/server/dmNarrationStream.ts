import {
  streamOpenAICompatibleText,
  type OpenAICompatibleEnv,
} from "@/infrastructure/ai/openaiCompatible";
import { assertCampaignDmNarration, CAMPAIGN_DM_NARRATION_POLICY } from "./dmCampaignChatPolicy";
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
      system: [
        "Present the approved Dungeon Master narration as live-play prose. Output only narration.",
        "Preserve all facts, names, numbers, dialogue, outcomes, pacing, and the ending of the approved narration. Do not add events, items, characters, checks, rolls, or mechanical effects. You cannot execute tools or change state.",
        CAMPAIGN_DM_NARRATION_POLICY,
      ].join(" "),
      prompt: `Approved narration:\n${approvedNarration}`,
      temperature: 0.2,
      maxTokens: 1600,
      signal: stream.signal,
      ...(env.AI && env.AI_GAME_MODEL ? { model: env.AI_GAME_MODEL } : {}),
    },
    stream.delta,
  );
  return assertCampaignDmNarration(text);
}
