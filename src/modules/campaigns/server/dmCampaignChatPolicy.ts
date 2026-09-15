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
