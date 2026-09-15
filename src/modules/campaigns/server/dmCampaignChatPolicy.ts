const FORBIDDEN_CHARACTER_DOSSIER_LABEL =
  /^\s*(?:[-*+]\s*)?(?:\*\*|__)?(?:race|classes?|key attributes?|current state|starting equipment|current research)(?:\*\*|__)?\s*:/gim;

const SETUP_LANGUAGE = [
  /\bplease provide\s*:/i,
  /\bdefine the specifics? of (?:your|the) current state\b/i,
  /\bbefore .{0,100}\b(?:chapter|adventure|campaign|legend|story).{0,100}\b(?:begin|begins|unfold|continue|commence)/i,
  /\bonce (?:these|those|that) (?:are|is) (?:established|defined|provided)\b/i,
  /\bwhat (?:specific )?(?:equipment|gear) do you (?:carry|have)\b/i,
  /\bwhat (?:specific )?(?:research|mystery|topic) are you (?:currently )?(?:researching|studying|investigating)\b/i,
] as const;

/**
 * Hard campaign-chat behavior contract for the AI Dungeon Master.
 *
 * The model has authoritative character sheets as private DM reference context;
 * those sheets must never be echoed back into live campaign chat as a dossier,
 * chargen recap, or pre-game questionnaire. Campaign chat is for play already in
 * progress. OOC routes intentionally do not use this policy because a player may
 * explicitly ask the DM to discuss their sheet there.
 */
export const CAMPAIGN_DM_NARRATION_POLICY = [
  "Campaign chat is live play, not character creation, onboarding, or a character-sheet review.",
  "Never restate or summarize character-sheet data as labeled fields, a dossier, a build recap, or a stat block. Do not output headings or bullets such as Race:, Classes:, Key Attributes:, Current State:, Starting Equipment:, or Current Research:.",
  "Never ask the player to define starting equipment, current research, build choices, backstory, or other setup details that should come from authoritative character/campaign state.",
  "Never pause the fiction with a pre-game questionnaire, a 'please provide' checklist, or language implying the adventure cannot begin until setup details are supplied.",
  "Use character-sheet data silently as DM knowledge. Reveal a sheet fact in campaign narration only when it naturally matters to the fiction, and phrase it as narration rather than metadata.",
  "If a genuinely blocking detail is absent, ask at most one short natural clarification in the scene; do not present a form, checklist, or numbered setup questions.",
  "Markdown is allowed for readable narration, dialogue, emphasis, and scene structure, but never use Markdown to format a character dossier or setup questionnaire.",
].join(" ");

export function campaignDmNarrationViolation(text: string): string | null {
  const value = text.trim();
  if (!value) return "empty campaign narration";

  FORBIDDEN_CHARACTER_DOSSIER_LABEL.lastIndex = 0;
  if (FORBIDDEN_CHARACTER_DOSSIER_LABEL.test(value)) {
    return "character-sheet or setup metadata was formatted for campaign chat";
  }

  const setupHits = SETUP_LANGUAGE.reduce(
    (count, pattern) => count + (pattern.test(value) ? 1 : 0),
    0,
  );
  const numberedQuestions = (value.match(/^\s*\d+[.)]\s+.+\?/gm) ?? []).length;
  const bulletQuestions = (value.match(/^\s*[-*+]\s+.+\?/gm) ?? []).length;

  if (setupHits >= 2 || (setupHits >= 1 && numberedQuestions + bulletQuestions >= 2)) {
    return "pre-game setup questionnaire was generated for campaign chat";
  }

  return null;
}

export function assertCampaignDmNarration(text: string): string {
  const violation = campaignDmNarrationViolation(text);
  if (violation) {
    throw new Error(`AI_DM_CAMPAIGN_NARRATION_POLICY: ${violation}`);
  }
  return text;
}
