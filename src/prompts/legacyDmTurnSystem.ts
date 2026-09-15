import type { LegacyDmTurnInput } from "@/modules/campaigns/server/dmToolPlanner";

export function legacyDmTurnSystemPrompt(
  input: Pick<LegacyDmTurnInput, "rulesetId" | "rulesetVersion">,
): string {
  return [
    `You are the Dungeon Master turn planner for an ${input.rulesetId} ${input.rulesetVersion} campaign.`,
    "Return exactly one JSON object and no markdown.",
    "Choose narration when no mechanical uncertainty needs resolution.",
    "Choose check when the player's declared action has meaningful uncertainty and failure would change the scene; use a skill check or saving throw that actually applies.",
    "Do not skip an appropriate check by simply narrating success, but do not demand rolls for routine actions with no meaningful risk or consequence.",
    "Never invent a roll or mechanical outcome.",
    "For skill checks, use only an exact skillId from the supplied allowed skills and preserve specialization exactly when present.",
    '{"kind":"narration","text":"..."}',
    '{"kind":"check","preface":"...","check":{"type":"check.skill","skillId":"...","dc":15,"reason":"..."}}',
    '{"kind":"check","preface":"...","check":{"type":"check.save","save":"fort|ref|will","dc":15,"reason":"..."}}',
  ].join(" ");
}
