import {
  engineFailure,
  engineFailures,
  engineSuccess,
  type EngineIssue,
  type EngineResult,
} from "@/engine";

export const campaignLifecycleStatuses = [
  "draft",
  "ready",
  "starting",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type CampaignLifecycleStatus = (typeof campaignLifecycleStatuses)[number];

export const characterLifecycleStatuses = [
  "draft",
  "ready",
  "active",
  "retired",
  "archived",
] as const;

export type CharacterLifecycleStatus = (typeof characterLifecycleStatuses)[number];

export const worldLifecycleStatuses = ["generating", "ready", "failed", "archived"] as const;
export type WorldLifecycleStatus = (typeof worldLifecycleStatuses)[number];

export interface CampaignCharacterSnapshot {
  id: string;
  status: CharacterLifecycleStatus;
  rulesetId: string;
  rulesetVersion: string;
}

export interface CampaignLifecycleSnapshot {
  id: string;
  status: CampaignLifecycleStatus;
  rulesetId: string;
  rulesetVersion: string;
  worldId: string | null;
  startRequestedAt: number | null;
  startedAt: number | null;
}

export interface CampaignReadiness {
  ready: boolean;
  readyCharacterIds: readonly string[];
  issues: readonly EngineIssue[];
}

function assertId(value: string, name: string): void {
  if (!value.trim()) throw new RangeError(`${name} cannot be empty.`);
}

function characterIssues(
  campaign: CampaignLifecycleSnapshot,
  characters: readonly CampaignCharacterSnapshot[],
): EngineIssue[] {
  const issues: EngineIssue[] = [];
  const seen = new Set<string>();

  for (const [index, character] of characters.entries()) {
    if (!character.id.trim()) {
      issues.push({
        code: "CAMPAIGN_CHARACTER_ID_REQUIRED",
        message: "A campaign character has an empty id.",
        path: `characters[${index}].id`,
      });
      continue;
    }
    if (seen.has(character.id)) {
      issues.push({
        code: "CAMPAIGN_CHARACTER_DUPLICATE",
        message: `Character ${character.id} appears more than once in the campaign start input.`,
        path: `characters[${index}].id`,
      });
      continue;
    }
    seen.add(character.id);

    if (
      character.rulesetId !== campaign.rulesetId ||
      character.rulesetVersion !== campaign.rulesetVersion
    ) {
      issues.push({
        code: "CAMPAIGN_CHARACTER_RULESET_MISMATCH",
        message: `Character ${character.id} does not use ${campaign.rulesetId}@${campaign.rulesetVersion}.`,
        path: `characters[${index}]`,
        details: {
          characterId: character.id,
          characterRulesetId: character.rulesetId,
          characterRulesetVersion: character.rulesetVersion,
          campaignRulesetId: campaign.rulesetId,
          campaignRulesetVersion: campaign.rulesetVersion,
        },
      });
    }
  }

  return issues;
}

/**
 * A campaign is ready to start only when at least one completed, rules-valid
 * character exists for the exact ruleset version pinned by the campaign.
 *
 * Draft characters deliberately do not satisfy this requirement. Worlds do
 * not exist yet at this stage; world generation begins only after start is
 * requested.
 */
export function evaluateCampaignReadiness(input: {
  campaign: CampaignLifecycleSnapshot;
  characters: readonly CampaignCharacterSnapshot[];
}): CampaignReadiness {
  assertId(input.campaign.id, "Campaign id");
  assertId(input.campaign.rulesetId, "Campaign ruleset id");
  assertId(input.campaign.rulesetVersion, "Campaign ruleset version");

  const issues = characterIssues(input.campaign, input.characters);
  const matchingReadyCharacters = input.characters.filter(
    (character) =>
      character.status === "ready" &&
      character.rulesetId === input.campaign.rulesetId &&
      character.rulesetVersion === input.campaign.rulesetVersion,
  );

  if (matchingReadyCharacters.length === 0) {
    issues.push({
      code: "CAMPAIGN_READY_CHARACTER_REQUIRED",
      message: "At least one rules-valid ready character is required before the campaign can start.",
      path: "characters",
    });
  }

  if (input.campaign.worldId !== null && ["draft", "ready"].includes(input.campaign.status)) {
    issues.push({
      code: "CAMPAIGN_WORLD_CREATED_TOO_EARLY",
      message: "Draft and ready campaigns cannot have a world. The world is created when campaign start begins.",
      path: "campaign.worldId",
    });
  }

  return {
    ready: issues.length === 0,
    readyCharacterIds: matchingReadyCharacters.map((character) => character.id),
    issues,
  };
}

/**
 * Recalculate only the pre-start draft/ready state. Once start has begun, the
 * explicit start/finalize/failure transitions own the lifecycle.
 */
export function reconcileCampaignReadiness(input: {
  campaign: CampaignLifecycleSnapshot;
  characters: readonly CampaignCharacterSnapshot[];
}): CampaignLifecycleSnapshot {
  if (input.campaign.status !== "draft" && input.campaign.status !== "ready") {
    return { ...input.campaign };
  }

  const readiness = evaluateCampaignReadiness(input);
  return {
    ...input.campaign,
    status: readiness.ready ? "ready" : "draft",
  };
}

/**
 * Begin campaign start after the application has allocated a new world id.
 * The caller should persist the campaign transition and the new generating
 * world in one database transaction.
 */
export function beginCampaignStart(input: {
  campaign: CampaignLifecycleSnapshot;
  characters: readonly CampaignCharacterSnapshot[];
  worldId: string;
  requestedAt: number;
}): EngineResult<CampaignLifecycleSnapshot> {
  assertId(input.worldId, "World id");
  if (!Number.isFinite(input.requestedAt)) throw new RangeError("Campaign start time must be finite.");

  if (input.campaign.status !== "draft" && input.campaign.status !== "ready") {
    return engineFailure(
      "CAMPAIGN_START_INVALID_STATUS",
      `Campaign ${input.campaign.id} cannot start from status ${input.campaign.status}.`,
      { path: "campaign.status" },
    );
  }
  if (input.campaign.worldId !== null) {
    return engineFailure(
      "CAMPAIGN_WORLD_ALREADY_EXISTS",
      "A campaign cannot allocate another world before start.",
      { path: "campaign.worldId" },
    );
  }

  const readiness = evaluateCampaignReadiness({
    campaign: input.campaign,
    characters: input.characters,
  });
  if (!readiness.ready) return engineFailures(readiness.issues);

  return engineSuccess({
    ...input.campaign,
    status: "starting",
    worldId: input.worldId,
    startRequestedAt: input.requestedAt,
  });
}

/**
 * Activate a campaign only after its generated world reports ready. Character
 * activation and initial event/session creation should be committed alongside
 * this transition by the application service.
 */
export function completeCampaignStart(input: {
  campaign: CampaignLifecycleSnapshot;
  worldStatus: WorldLifecycleStatus;
  completedAt: number;
}): EngineResult<CampaignLifecycleSnapshot> {
  if (!Number.isFinite(input.completedAt)) throw new RangeError("Campaign start completion time must be finite.");
  if (input.campaign.status !== "starting") {
    return engineFailure(
      "CAMPAIGN_START_NOT_IN_PROGRESS",
      "Only a campaign whose start is in progress can become active.",
      { path: "campaign.status" },
    );
  }
  if (input.campaign.worldId === null) {
    return engineFailure(
      "CAMPAIGN_START_WORLD_REQUIRED",
      "A starting campaign must have its generated world allocated before activation.",
      { path: "campaign.worldId" },
    );
  }
  if (input.worldStatus !== "ready") {
    return engineFailure(
      "CAMPAIGN_WORLD_NOT_READY",
      `The generated world is ${input.worldStatus}; it must be ready before the campaign can become active.`,
      { path: "world.status" },
    );
  }

  return engineSuccess({
    ...input.campaign,
    status: "active",
    startedAt: input.completedAt,
  });
}

/**
 * Freeze rule mutations while preserving the active session for table history,
 * OOC conversation, and reconnect hydration.
 */
export function pauseCampaignPlay(
  campaign: CampaignLifecycleSnapshot,
): EngineResult<CampaignLifecycleSnapshot> {
  if (campaign.status !== "active") {
    return engineFailure(
      "CAMPAIGN_PAUSE_INVALID_STATUS",
      `Campaign ${campaign.id} cannot pause from status ${campaign.status}.`,
      { path: "campaign.status" },
    );
  }
  if (!campaign.worldId || campaign.startedAt === null) {
    return engineFailure(
      "CAMPAIGN_PAUSE_RUNTIME_REQUIRED",
      "An active campaign must have a generated world and start timestamp before it can be paused.",
      { path: "campaign" },
    );
  }
  return engineSuccess({ ...campaign, status: "paused" });
}

/** Resume authoritative rules-engine actions without creating a new session. */
export function resumeCampaignPlay(
  campaign: CampaignLifecycleSnapshot,
): EngineResult<CampaignLifecycleSnapshot> {
  if (campaign.status !== "paused") {
    return engineFailure(
      "CAMPAIGN_RESUME_INVALID_STATUS",
      `Campaign ${campaign.id} cannot resume from status ${campaign.status}.`,
      { path: "campaign.status" },
    );
  }
  if (!campaign.worldId || campaign.startedAt === null) {
    return engineFailure(
      "CAMPAIGN_RESUME_RUNTIME_REQUIRED",
      "A paused campaign must retain its generated world and start timestamp before it can resume.",
      { path: "campaign" },
    );
  }
  return engineSuccess({ ...campaign, status: "active" });
}

/**
 * Recover from failed world generation. The persistence transaction must also
 * remove or archive the failed world so a later start can allocate a new one.
 */
export function failCampaignStart(
  campaign: CampaignLifecycleSnapshot,
): EngineResult<CampaignLifecycleSnapshot> {
  if (campaign.status !== "starting") {
    return engineFailure(
      "CAMPAIGN_START_NOT_IN_PROGRESS",
      "Only a starting campaign can recover from world-generation failure.",
      { path: "campaign.status" },
    );
  }

  return engineSuccess({
    ...campaign,
    status: "ready",
    worldId: null,
    startRequestedAt: null,
    startedAt: null,
  });
}
