import type { Dnd35ActionKind } from "@/rulesets/dnd35";
import {
  spendCurrentEncounterAction,
  type EncounterParticipantState,
  type EncounterState,
} from "../domain/encounterRuntime";
import {
  type EncounterActionEconomyState,
  type EncounterActionMutation,
} from "./d1GameEventStore";
import {
  getActiveEncounter,
  type EncounterServiceDependencies,
} from "./encounterService";

function economyState(participant: EncounterParticipantState): EncounterActionEconomyState {
  return {
    standardAvailable: participant.standardAvailable,
    moveAvailable: participant.moveAvailable,
    swiftAvailable: participant.swiftAvailable,
    swiftDebtNextTurn: participant.swiftDebtNextTurn,
    attacksOfOpportunityPerRound: participant.attacksOfOpportunityPerRound,
    attacksOfOpportunityRemaining: participant.attacksOfOpportunityRemaining,
    lastTurnRound: participant.lastTurnRound,
  };
}

/**
 * Prepare an optimistic action-economy mutation for an actor in the active
 * encounter. Outside an encounter there is nothing to spend, so callers can
 * continue resolving non-encounter actions normally.
 */
export async function prepareEncounterAction(
  deps: EncounterServiceDependencies,
  input: {
    campaignId: string;
    actorId: string;
    kind: Dnd35ActionKind;
    requiredParticipantIds?: readonly string[];
  },
): Promise<EncounterActionMutation | null> {
  const encounter = await getActiveEncounter(deps, input.campaignId);
  if (!encounter) return null;

  if (input.requiredParticipantIds !== undefined) {
    const participantIds = new Set(
      encounter.participants.map((participant) => participant.characterId),
    );
    if (input.requiredParticipantIds.some((id) => !participantIds.has(id))) {
      throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
    }
  }

  const before: EncounterState = {
    roundNumber: encounter.roundNumber,
    activeTurnIndex: encounter.activeTurnIndex,
    participants: encounter.participants,
  };
  const spent = spendCurrentEncounterAction(before, input.actorId, input.kind);
  if (!spent.ok) {
    const error = spent.errors[0];
    throw new Error(error?.code ?? "ENCOUNTER_ACTION_UNAVAILABLE");
  }

  const expectedParticipant = before.participants.find(
    (participant) => participant.characterId === input.actorId,
  );
  const nextParticipant = spent.value.participants.find(
    (participant) => participant.characterId === input.actorId,
  );
  if (!expectedParticipant || !nextParticipant) {
    throw new Error("ENCOUNTER_PARTICIPANT_INVALID");
  }

  return {
    encounterId: encounter.id,
    characterId: input.actorId,
    roundNumber: encounter.roundNumber,
    activeTurnIndex: encounter.activeTurnIndex,
    turnOrder: expectedParticipant.turnOrder,
    expected: economyState(expectedParticipant),
    next: economyState(nextParticipant),
  };
}
