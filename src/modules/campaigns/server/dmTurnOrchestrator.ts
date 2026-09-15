/// <reference types="@cloudflare/workers-types" />

import type { OpenAICompatibleEnv } from "@/infrastructure/ai/openaiCompatible";
import { createDatabase } from "@/infrastructure/database/client";
import {
  executeGameCommand,
  type GameCommandResult,
} from "@/modules/game/server/gameCommandService";
import { evaluateAlignmentAction } from "./alignmentEvaluator";
import { loadCampaignPlaySchemaReadiness } from "./campaignPlaySchemaReadiness";
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
  const conversation = await loadDmConversationText({
    binding: input.binding,
    campaignId: input.campaign.id,
    userId: input.userId,
  });
  const seedResults = [...(input.seedAuthoritativeResults ?? [])];
  const commandResults: GameCommandResult[] = [];

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
      commandResults.push(result);
      input.onCommittedResult?.(result);
      const refreshed = await loadDmPlannerContext({
        binding: input.binding,
        campaignId: input.campaign.id,
        characterId: input.characterId,
        userId: input.userId,
      });
      if (!refreshed) throw new Error("AI_DM_CHARACTER_CONTEXT_LOST");
      context = refreshed;
      recentEvents = await loadRecentDmEvents(input.binding, input.campaign.id);
      return result;
    },
  });

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
