/// <reference types="@cloudflare/workers-types" />

import { DM_REPEATED_CHECK_CORRECTION } from "@/prompts/dmRepeatedCheckCorrection";
import { withSystemReferences } from "@/prompts/dmTurnContext";
import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { createDatabase } from "@/infrastructure/database/client";
import {
  executeGameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import { evaluateAlignmentAction } from "./alignmentEvaluator";
import { loadResolvedDmActionHistory, serializeDmActionProgress } from "./dmActionHistory";
import { loadCampaignPlaySchemaReadiness } from "./campaignPlaySchemaReadiness";
import { isRepeatedAuthoritativeCheck } from "./dmCheckDedup";
import { recordNarratedCampaignNpcs } from "./dmNpcRegistry";
import { loadDmSystemReferences, serializeDmSystemReferences } from "./dmSystemReferencePlanner";
import { executeDmPlannerCommand } from "./dmToolExecution";
import { runDmToolLoop } from "./dmToolLoop";
import { planDmTurn, type DmTurnDecision } from "./dmToolPlanner";
import { loadDmConversationText, loadDmPlannerContext, loadRecentDmEvents } from "./dmTurnRuntime";

export interface DmCampaignDescriptor {
  id: string;
  name: string;
  description: string | null;
  rulesetId: string;
  rulesetVersion: string;
  settings: Record<string, unknown>;
}

export interface PendingInitiativeRequest {
  participantIds: readonly string[];
  reason: string;
}

export interface StructuredDmTurnResult {
  decision: Extract<DmTurnDecision, { kind: "narration" | "check" }>;
  commandResults: GameCommandResult[];
  alignmentResult: GameCommandResult | null;
  pendingInitiative: PendingInitiativeRequest | null;
}

function plannerConversation(input: {
  playerMessageId: string;
  playerAction: string;
  actionProgress: string;
  historicalConversation: string;
  systemReferenceText: string;
}): string {
  return withSystemReferences(
    [
      "AUTHORITATIVE CURRENT PLAYER TURN — this is the action you must resolve now:",
      `Player message id: ${input.playerMessageId}`,
      input.playerAction,
      "Do not substitute, revive, or continue an older player action merely because it appears later in historical context. Older messages are context only. If this current action changes intent or position, advance the scene from this action.",
      "Resolved DM-requested checks ledger:",
      input.actionProgress,
      "Any ledger entry marked current is already resolved for this exact player turn and must not be requested again. Historical entries belong to older player turns; they inform continuity but do not make the old action current. A new check of the same skill is allowed only when this current action independently warrants it.",
      "Historical campaign conversation and persistent DM memory:",
      input.historicalConversation || "(No previous campaign or private OOC messages.)",
    ].join("\n\n"),
    input.systemReferenceText,
  );
}

/**
 * Runs the model as a planner over the deterministic command boundary.
 * Immediate commands may chain, but the loop stops as soon as narration or a
 * player-supplied d20 check is required. Eight commands is enough for a normal
 * player action followed by one or more DM-run creature turns while remaining
 * strictly bounded against runaway model output.
 *
 * `onCommittedResult` fires immediately after each successful authoritative
 * command. Routes use it to publish/enqueue already-committed events even if a
 * later model call in the same turn fails.
 */
export async function runStructuredDmTurn(input: {
  env: OpenAICompatibleEnv;
  binding: D1Database;
  campaign: DmCampaignDescriptor;
  userId: string;
  characterId: string;
  playerMessageId: string;
  playerAction: string;
  signal?: AbortSignal;
  seedAuthoritativeResults?: readonly unknown[];
  onCommittedResult?: (result: GameCommandResult) => void;
}): Promise<StructuredDmTurnResult | null> {
  input.signal?.throwIfAborted();
  const readiness = await loadCampaignPlaySchemaReadiness(input.binding);
  if (!readiness.structuredDm) {
    console.warn("Structured AI DM is unavailable until campaign-play migrations are applied", {
      campaignId: input.campaign.id,
      missingTables: readiness.missingTables,
    });
    return null;
  }

  let context = await loadDmPlannerContext({
    binding: input.binding,
    campaignId: input.campaign.id,
    characterId: input.characterId,
    userId: input.userId,
  });
  if (!context) return null;

  let recentEvents = await loadRecentDmEvents(input.binding, input.campaign.id);
  let rawConversation = await loadDmConversationText({
    binding: input.binding,
    campaignId: input.campaign.id,
    userId: input.userId,
  });
  const resolvedActions = await loadResolvedDmActionHistory(
    input.binding,
    input.campaign.id,
    input.userId,
  );
  const actionProgress = serializeDmActionProgress(resolvedActions, input.playerMessageId);

  let systemReferenceText = "";
  try {
    const references = await loadDmSystemReferences({
      ...(input.signal ? { signal: input.signal } : {}),
      env: input.env,
      binding: input.binding,
      userId: input.userId,
      rulesetId: input.campaign.rulesetId,
      rulesetVersion: input.campaign.rulesetVersion,
      campaignName: input.campaign.name,
      campaignDescription: input.campaign.description,
      playerText: input.playerAction,
      conversation: rawConversation,
    });
    systemReferenceText = serializeDmSystemReferences(references);
  } catch (error) {
    console.error("AI DM system reference hydration failed", {
      campaignId: input.campaign.id,
      rulesetId: input.campaign.rulesetId,
      error,
    });
  }

  let conversation = plannerConversation({
    playerMessageId: input.playerMessageId,
    playerAction: input.playerAction,
    actionProgress,
    historicalConversation: rawConversation,
    systemReferenceText,
  });
  const seedResults = [...(input.seedAuthoritativeResults ?? [])];
  const commandResults: GameCommandResult[] = [];
  let pendingInitiative: PendingInitiativeRequest | null = null;

  const refreshRuntimeContext = async () => {
    const refreshed = await loadDmPlannerContext({
      binding: input.binding,
      campaignId: input.campaign.id,
      characterId: input.characterId,
      userId: input.userId,
    });
    if (!refreshed) throw new Error("AI_DM_CHARACTER_CONTEXT_LOST");
    context = refreshed;
    const [nextEvents, nextConversation] = await Promise.all([
      loadRecentDmEvents(input.binding, input.campaign.id),
      loadDmConversationText({
        binding: input.binding,
        campaignId: input.campaign.id,
        userId: input.userId,
      }),
    ]);
    recentEvents = nextEvents;
    rawConversation = nextConversation;
    conversation = plannerConversation({
      playerMessageId: input.playerMessageId,
      playerAction: input.playerAction,
      actionProgress,
      historicalConversation: rawConversation,
      systemReferenceText,
    });
  };

  const recordCommandResult = async (result: GameCommandResult) => {
    commandResults.push(result);
    input.onCommittedResult?.(result);
    await refreshRuntimeContext();
    return result;
  };

  const loop = await runDmToolLoop({
    maxCommands: 8,
    plan: async (executions) => {
      input.signal?.throwIfAborted();
      const authoritativeToolResults = [
        ...seedResults,
        ...executions.map((entry) => entry.result),
      ];
      const plannerInput = {
        ...(input.signal ? { signal: input.signal } : {}),
        campaignName: input.campaign.name,
        campaignDescription: input.campaign.description,
        rulesetId: input.campaign.rulesetId,
        rulesetVersion: input.campaign.rulesetVersion,
        settings: input.campaign.settings,
        recentEvents,
        conversation,
        context: context!,
        authoritativeToolResults,
      };
      const decision = await planDmTurn(input.env, plannerInput);

      if (
        decision.kind === "command" &&
        decision.command.type === "encounter.start" &&
        decision.command.participantIds.includes(context!.character.character.actorId)
      ) {
        pendingInitiative = {
          participantIds: [...decision.command.participantIds],
          reason: "Combat is beginning. Roll initiative to determine turn order.",
        };
        return {
          kind: "narration" as const,
          text: "The situation tips into combat. Roll initiative before the first turn begins.",
          npcs: [],
          itemAwards: [],
        };
      }

      if (!isRepeatedAuthoritativeCheck(decision, authoritativeToolResults)) return decision;

      const corrected = await planDmTurn(input.env, {
        ...plannerInput,
        conversation: [conversation, DM_REPEATED_CHECK_CORRECTION].join("\n\n"),
      });
      if (!isRepeatedAuthoritativeCheck(corrected, authoritativeToolResults)) return corrected;

      return {
        kind: "narration" as const,
        text: "The previous authoritative roll stands; no second roll is required. Continue the scene from that result.",
        npcs: [],
        itemAwards: [],
      };
    },
    execute: async (command) => {
      input.signal?.throwIfAborted();
      const result = await executeDmPlannerCommand({
        binding: input.binding,
        campaignId: input.campaign.id,
        context: context!,
        command,
      });
      return recordCommandResult(result);
    },
  });

  input.signal?.throwIfAborted();
  if (loop.decision.kind === "narration" && !pendingInitiative) {
    for (const award of loop.decision.itemAwards ?? []) {
      input.signal?.throwIfAborted();
      const result = await executeDmPlannerCommand({
        binding: input.binding,
        campaignId: input.campaign.id,
        context,
        command: {
          type: "inventory.grant",
          itemRef: award.itemRef,
          quantity: award.quantity,
          reason: award.reason,
          ...(award.location === undefined ? {} : { location: award.location }),
        },
      });
      await recordCommandResult(result);
    }

    if (loop.decision.npcs?.length) {
      try {
        await recordNarratedCampaignNpcs(input.binding, input.campaign.id, loop.decision.npcs);
      } catch (error) {
        console.error("AI DM NPC memory update failed", {
          campaignId: input.campaign.id,
          characterId: input.characterId,
          error,
        });
      }
    }
  }

  let alignmentResult: GameCommandResult | null = null;
  if (loop.decision.kind === "narration" && !pendingInitiative) {
    try {
      const current = context.character.alignment;
      input.signal?.throwIfAborted();
      const evaluation = await evaluateAlignmentAction(input.env, {
        ...(input.signal ? { signal: input.signal } : {}),
        rulesetId: input.campaign.rulesetId,
        rulesetVersion: input.campaign.rulesetVersion,
        characterName: context.character.character.name,
        current,
        playerAction: input.playerAction,
        authoritativeResults: [...seedResults, ...commandResults.map((result) => result.value)],
        recentEvents,
      });
      input.signal?.throwIfAborted();
      if (evaluation.record) {
        alignmentResult = await executeGameCommand(
          { db: createDatabase(input.binding), binding: input.binding },
          input.campaign.id,
          {
            type: "alignment.record",
            actorId: context.character.character.actorId,
            lawChaosDelta: evaluation.lawChaosDelta,
            goodEvilDelta: evaluation.goodEvilDelta,
            reason: evaluation.reason,
          },
        );
        input.onCommittedResult?.(alignmentResult);
      }
    } catch (error) {
      console.error("AI DM alignment evaluation failed", {
        campaignId: input.campaign.id,
        characterId: input.characterId,
        error,
      });
    }
  }

  input.signal?.throwIfAborted();
  return {
    decision: loop.decision,
    commandResults,
    alignmentResult,
    pendingInitiative,
  };
}
