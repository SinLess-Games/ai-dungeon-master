import { campaignDurationSchema, readCampaignDuration } from "../domain/duration";

export interface CampaignDurationDraft {
  length: string;
  estimatedSessions: string;
  startLevel: string;
  endLevel: string;
  endingTarget: string;
}

export function durationDraftFromSettings(value: unknown): CampaignDurationDraft {
  const duration = readCampaignDuration(value);
  return {
    length: duration?.length ?? "",
    estimatedSessions: duration?.estimatedSessions?.toString() ?? "",
    startLevel: duration?.startLevel?.toString() ?? "",
    endLevel: duration?.endLevel?.toString() ?? "",
    endingTarget: duration?.endingTarget ?? "",
  };
}

export function parseDurationDraft(draft: CampaignDurationDraft) {
  if (Object.values(draft).every((value) => !value.trim())) {
    return campaignDurationSchema.optional().safeParse(undefined);
  }
  return campaignDurationSchema.optional().safeParse({
    length: draft.length,
    ...(draft.estimatedSessions.trim()
      ? { estimatedSessions: Number(draft.estimatedSessions) }
      : {}),
    ...(draft.startLevel.trim() ? { startLevel: Number(draft.startLevel) } : {}),
    ...(draft.endLevel.trim() ? { endLevel: Number(draft.endLevel) } : {}),
    ...(draft.endingTarget.trim() ? { endingTarget: draft.endingTarget.trim() } : {}),
  });
}
