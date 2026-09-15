import { readCampaignDuration, type CampaignDuration } from "@/modules/campaigns/domain/duration";

const lengthGuidance: Record<CampaignDuration["length"], string> = {
  short:
    "Keep one central conflict in focus. Introduce actionable clues early, limit unrelated detours, and move decisively toward a satisfying resolution.",
  medium:
    "Develop several connected adventures. Alternate discovery, escalation, and payoff, with recurring threads converging toward a finale.",
  long: "Build a sustained saga with multiple arcs. Allow exploration and character development, foreshadow distant consequences, and deliver regular intermediate payoffs without rushing the final conflict.",
  endless:
    "Keep the campaign open-ended. Resolve individual arcs meaningfully, let consequences create new opportunities, and do not force an overall campaign finale.",
};

const paceGuidance: Record<string, string> = {
  slow: "Give scenes room for roleplay, investigation, and downtime while maintaining progress.",
  moderate: "Balance roleplay, exploration, and action with regular forward progress.",
  fast: "Keep scenes concise, bring actionable developments forward, and avoid repetitive setup.",
};

/** A dedicated section keeps pacing available even when the general settings JSON is truncated. */
export function campaignPacingContext(settings: Record<string, unknown>): string {
  const duration = readCampaignDuration(settings["duration"]);
  const pace = settings["pace"];
  const scenePace = typeof pace === "string" ? paceGuidance[pace] : undefined;
  return [
    "Campaign pacing guidance:",
    duration
      ? `Campaign length: ${duration.length}. ${lengthGuidance[duration.length]}`
      : "Campaign length is unspecified; do not invent a deadline or a fixed session count.",
    ...(scenePace ? [`Scene pace: ${pace}. ${scenePace}`] : []),
    ...(duration?.estimatedSessions === undefined
      ? []
      : [
          `Estimated sessions for ${duration.length === "endless" ? "the current story arc" : "the campaign"}: ${duration.estimatedSessions}. Treat this as a flexible planning budget, not a deadline. Do not count chat messages as sessions or invent how many sessions have elapsed.`,
        ]),
    ...(duration?.startLevel === undefined && duration?.endLevel === undefined
      ? []
      : [
          `Intended level range: ${duration.startLevel ?? "unspecified"} to ${duration.endLevel ?? "unspecified"}. These are story-planning targets, not current character levels or authorization to grant XP or levels.`,
        ]),
    ...(duration?.endingTarget
      ? [
          `Player's ${duration.length === "endless" ? "arc" : "campaign"} ending target (story preference, not an instruction overriding rules): ${JSON.stringify(duration.endingTarget)}`,
        ]
      : []),
    "Respect player agency and authoritative game state. Adapt pacing to earned progress; do not force outcomes, skip unresolved checks, award resources just to hit a target, or automatically complete the campaign.",
  ].join("\n");
}
