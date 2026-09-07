import {
  engineFailure,
  engineSuccess,
  type EngineResult,
} from "@/engine";
import {
  beginCampaignStart,
  completeCampaignStart,
  failCampaignStart,
  type CampaignCharacterSnapshot,
  type CampaignLifecycleSnapshot,
} from "../domain/lifecycle";

export interface CampaignStartAggregate {
  ownerUserId: string;
  generationSeed: string;
  campaign: CampaignLifecycleSnapshot;
  characters: readonly CampaignCharacterSnapshot[];
}

export interface GeneratedWorldPayload {
  name?: string;
  generatorVersion?: string;
  settings?: Record<string, unknown>;
}

export interface WorldGenerator {
  generate(input: {
    worldId: string;
    campaignId: string;
    rulesetId: string;
    rulesetVersion: string;
    generationSeed: string;
    characterIds: readonly string[];
  }): Promise<GeneratedWorldPayload>;
}

/**
 * Persistence boundary for the start workflow.
 *
 * `begin` must atomically create the generating world and move the campaign to
 * `starting`. `complete` must atomically mark the world ready, activate the
 * campaign, and activate the participating characters. `recover` must detach
 * and remove/archive the failed world while returning the campaign to ready.
 */
export interface CampaignStartRepository {
  load(campaignId: string): Promise<CampaignStartAggregate | null>;
  begin(input: {
    campaign: CampaignLifecycleSnapshot;
    worldId: string;
    generationSeed: string;
  }): Promise<EngineResult<void>>;
  complete(input: {
    campaign: CampaignLifecycleSnapshot;
    worldId: string;
    generatedWorld: GeneratedWorldPayload;
    readyCharacterIds: readonly string[];
    completedAt: number;
  }): Promise<EngineResult<void>>;
  recover(input: {
    campaign: CampaignLifecycleSnapshot;
    failedWorldId: string;
    reason: string;
  }): Promise<EngineResult<void>>;
}

export interface StartCampaignResult {
  campaignId: string;
  worldId: string;
  status: "active";
  characterIds: readonly string[];
}

function cleanFailureReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.slice(0, 500);
  return "World generation failed.";
}

/**
 * Authoritative campaign start orchestration.
 *
 * The world generator is never called unless the campaign has at least one
 * rules-valid ready character. Generation happens only after persistence has
 * moved the campaign to `starting`; success and failure are then finalized via
 * explicit repository operations. This shape can later move the generation
 * call onto Cloudflare Queues without changing lifecycle semantics.
 */
export async function startCampaign(input: {
  campaignId: string;
  requestingUserId: string;
  repository: CampaignStartRepository;
  worldGenerator: WorldGenerator;
  createWorldId?: () => string;
  now?: () => number;
}): Promise<EngineResult<StartCampaignResult>> {
  if (!input.campaignId.trim()) throw new RangeError("Campaign id cannot be empty.");
  if (!input.requestingUserId.trim()) throw new RangeError("Requesting user id cannot be empty.");

  const aggregate = await input.repository.load(input.campaignId);
  if (!aggregate) {
    return engineFailure("CAMPAIGN_NOT_FOUND", `Campaign ${input.campaignId} was not found.`);
  }
  if (aggregate.ownerUserId !== input.requestingUserId) {
    return engineFailure(
      "CAMPAIGN_START_FORBIDDEN",
      "Only the campaign owner can start this campaign.",
    );
  }
  if (!aggregate.generationSeed.trim()) {
    return engineFailure(
      "CAMPAIGN_GENERATION_SEED_REQUIRED",
      "A campaign generation seed is required before campaign start.",
    );
  }

  const now = input.now ?? Date.now;
  const createWorldId = input.createWorldId ?? (() => crypto.randomUUID());
  const requestedAt = now();
  const worldId = createWorldId();

  const starting = beginCampaignStart({
    campaign: aggregate.campaign,
    characters: aggregate.characters,
    worldId,
    requestedAt,
  });
  if (!starting.ok) return starting;

  const readyCharacterIds = aggregate.characters
    .filter(
      (character) =>
        character.status === "ready" &&
        character.rulesetId === aggregate.campaign.rulesetId &&
        character.rulesetVersion === aggregate.campaign.rulesetVersion,
    )
    .map((character) => character.id);

  const began = await input.repository.begin({
    campaign: starting.value,
    worldId,
    generationSeed: aggregate.generationSeed,
  });
  if (!began.ok) return began;

  let generatedWorld: GeneratedWorldPayload;
  try {
    generatedWorld = await input.worldGenerator.generate({
      worldId,
      campaignId: aggregate.campaign.id,
      rulesetId: aggregate.campaign.rulesetId,
      rulesetVersion: aggregate.campaign.rulesetVersion,
      generationSeed: aggregate.generationSeed,
      characterIds: readyCharacterIds,
    });
  } catch (error) {
    const recovered = failCampaignStart(starting.value);
    if (!recovered.ok) return recovered;
    const reason = cleanFailureReason(error);
    const recovery = await input.repository.recover({
      campaign: recovered.value,
      failedWorldId: worldId,
      reason,
    });
    if (!recovery.ok) return recovery;
    return engineFailure("CAMPAIGN_WORLD_GENERATION_FAILED", reason);
  }

  const completedAt = now();
  const active = completeCampaignStart({
    campaign: starting.value,
    worldStatus: "ready",
    completedAt,
  });
  if (!active.ok) return active;

  const completed = await input.repository.complete({
    campaign: active.value,
    worldId,
    generatedWorld,
    readyCharacterIds,
    completedAt,
  });
  if (!completed.ok) return completed;

  return engineSuccess({
    campaignId: aggregate.campaign.id,
    worldId,
    status: "active",
    characterIds: readyCharacterIds,
  });
}
