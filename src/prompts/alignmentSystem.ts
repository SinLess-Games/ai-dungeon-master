import type { AlignmentPromptInput } from "./alignmentTypes";

export function alignmentSystemPrompt(input: AlignmentPromptInput): string {
  return [
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
}
