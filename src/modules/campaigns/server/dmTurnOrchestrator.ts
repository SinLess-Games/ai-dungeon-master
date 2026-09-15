/// <reference types="@cloudflare/workers-types" />

import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { createDatabase } from "@/infrastructure/database/client";
import {
  executeGameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import { evaluateAlignmentAction } from "./alignmentEvaluator";
import { loadCampaignPlaySchemaReadiness } from "./campaignPlaySchemaReadiness";
import { CAMPAIGN_DM_NARRATION_POLICY } from "./dmCampaignChatPolicy";
import { recordNarratedCampaignNpcs } from "./dmNpcRegistry";
import { executeDmPlannerCommand } from "./dmToolExecution";
import { runDmToolLoop } from "./dmToolLoop";
import { planDmTurn, type DmTurnDecision } from "./dmToolPlanner";
import {
  loadDmConversationText,
  loadDmPlannerContext,
  loadRecentDmEvents,
} from "./dmTurnRuntime";

export interface DmCampaignDescriptor {
  id: string;
  name: string;
  description: string | null;
  rulesetId: string;
  rulesetVersion: string;
  settings: Record<string, unknown>;
}

export interface StructuredDmTurnResult {
  decision: Extract<DmTurnDecision, { kind: "narration" | "check" }>;
  commandResults: GameCommandResult[];
  alignmentResult: GameCommandResult | null;
}

function withCampaignChatPolicy(conversation: string): string {
  return [
    `Campaign chat output policy: ${CAMPAIGN_DM_NARRATION_POLICY}`,
    conversation || "(No previous campaign or private OOC messages.)",
  ].join("\n\n");
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
  playerAction: string;
  seedAuthoritativeResults?: readonly unknown[];
  onCommittedResult?: (result: GameCommandResult) => void;
}): Promise<StructuredDmTurnResult | null> {
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
  let conversation = withCampaignChatPolicy(
    await loadDmConversationText({
      binding: input.binding,
      campaignId: input.campaign.id,
      userId: input.userId,
    }),
  );
  const seedResults = [...(input.seedAuthoritativeResults ?? [])];
  const commandResults: GameCommandResult[] = [];

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
    conversation = withCampaignChatPolicy(nextConversation);
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
      return planDmTurn(input.env, {
        campaignName: input.campaign.name,
        campaignDescription: input.campaign.description,
        rulesetId: input.campaign.rulesetId,
        rulesetVersion: input.campaign.rulesetVersion,
        settings: input.campaign.settings,
        recentEvents,
        conversation,
        context: context!,
        authoritativeToolResults: [
          ...seedResults,
          ...executions.map((entry) => entry.result),
        ],
      });
    },
    execute: async (command) => {
      const result = await executeDmPlannerCommand({
        binding: input.binding,
        campaignId: input.campaign.id,
        context: context!,
        command,
      });
      return recordCommandResult(result);
    },
  });

  if (loop.decision.kind === "narration") {
    // A model should normally award inventory through inventory.grant before it
    // narrates possession. itemAwards is a safety net: it is still translated
    // through the same authoritative command path before the chat reply can be
    // persisted, so prose can never be the only record of a granted item.
    for (const award of loop.decision.itemAwards ?? []) {
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

    // NPC memory is intentionally non-mechanical. Store every named NPC the
    // narration says was created/reused so the DM can recall it long after the
    // chat window rolls out of recent context. Failure here should not erase a
    // mechanically completed turn, but it is logged loudly for diagnosis.
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
  if (loop.decision.kind === "narration") {
    try {
      const current = context.character.alignment;
      const evaluation = await evaluateAlignmentAction(input.env, {
        rulesetId: input.campaign.rulesetId,
        rulesetVersion: input.campaign.rulesetVersion,
        characterName: context.character.character.name,
        current,
        playerAction: input.playerAction,
        authoritativeResults: [
          ...seedResults,
          ...commandResults.map((result) => result.value),
        ],
        recentEvents,
      });
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
      // Alignment tracking is important but should never make a completed turn
      // disappear. Fail closed and leave the character's alignment untouched.
      console.error("AI DM alignment evaluation failed", {
        campaignId: input.campaign.id,
        characterId: input.characterId,
        error,
      });
    }
  }

  return {
    decision: loop.decision,
    commandResults,
    alignmentResult,
  };
}
