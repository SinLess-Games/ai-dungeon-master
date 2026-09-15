export function dmNarrationRetryPrompt(violation: string): string {
  return [
    `Your previous campaign-chat draft was rejected because ${violation}.`,
    "Write a new live-play response from scratch. Do not repeat character-sheet metadata or ask setup/onboarding questions.",
  ].join(" ");
}
