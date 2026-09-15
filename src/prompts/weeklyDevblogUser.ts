export function weeklyDevblogUserPrompt(sourceMaterial: unknown): string {
  return `Use the following source material to write this week's Endless Codex development journal.\n\n${JSON.stringify(sourceMaterial, null, 2)}`;
}
