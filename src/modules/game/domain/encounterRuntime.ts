import {
  advanceTurn,
  createTurnState,
  currentTurnParticipant,
  startTurns,
  type EngineResult,
  type TurnState,
} from "@/engine";
import {
  beginDnd35Round,
  beginDnd35Turn,
  createDnd35ActionEconomy,
  spendDnd35Action,
  type Dnd35ActionEconomy,
  type Dnd35ActionKind,
} from "@/rulesets/dnd35";

export interface EncounterParticipantSeed {
  characterId: string;
  initiativeRoll: number;
  initiativeModifier: number;
  tieBreaker?: number;
  attacksOfOpportunityPerRound?: number;
}

export interface EncounterParticipantState extends Dnd35ActionEconomy {
  characterId: string;
  initiativeRoll: number;
  initiativeModifier: number;
  initiativeTotal: number;
  tieBreaker: number;
  turnOrder: number;
  lastTurnRound: number;
}

export interface EncounterState {
  roundNumber: number;
  activeTurnIndex: number;
  participants: readonly EncounterParticipantState[];
}

export interface EncounterAdvance {
  state: EncounterState;
  previousCharacterId: string;
  currentCharacterId: string;
  roundAdvanced: boolean;
}

function safeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer.`);
}

function validateSeed(seed: EncounterParticipantSeed): void {
  if (!seed.characterId.trim()) throw new RangeError("Encounter participant character id cannot be empty.");
  safeInteger(seed.initiativeRoll, "Initiative roll");
  if (seed.initiativeRoll < 1 || seed.initiativeRoll > 20) {
    throw new RangeError("Initiative roll must be between 1 and 20.");
  }
  safeInteger(seed.initiativeModifier, "Initiative modifier");
  if (seed.tieBreaker !== undefined) safeInteger(seed.tieBreaker, "Initiative tie breaker");
  if (seed.attacksOfOpportunityPerRound !== undefined) {
    safeInteger(seed.attacksOfOpportunityPerRound, "Attacks of opportunity per round");
    if (seed.attacksOfOpportunityPerRound < 0) {
      throw new RangeError("Attacks of opportunity per round cannot be negative.");
    }
  }
}

function turnState(state: EncounterState): TurnState {
  return {
    order: state.participants.map((participant) => ({
      id: participant.characterId,
      initiative: participant.initiativeTotal,
      tieBreaker: participant.tieBreaker,
    })),
    round: state.roundNumber,
    activeIndex: state.activeTurnIndex,
    status: "active",
  };
}

export function createEncounterState(seeds: readonly EncounterParticipantSeed[]): EncounterState {
  if (seeds.length === 0) throw new RangeError("An encounter requires at least one participant.");
  const seen = new Set<string>();
  for (const seed of seeds) {
    validateSeed(seed);
    if (seen.has(seed.characterId)) {
      throw new Error(`Duplicate encounter participant: ${seed.characterId}`);
    }
    seen.add(seed.characterId);
  }

  const ordered = createTurnState(
    seeds.map((seed) => ({
      id: seed.characterId,
      initiative: seed.initiativeRoll + seed.initiativeModifier,
      tieBreaker: seed.tieBreaker ?? seed.initiativeModifier,
    })),
  );
  const started = startTurns(ordered);
  if (!started.ok) throw new Error(started.errors[0]?.message ?? "Unable to start encounter turns.");

  const byCharacter = new Map(seeds.map((seed) => [seed.characterId, seed] as const));
  const participants = started.value.order.map((orderedParticipant, turnOrder) => {
    const seed = byCharacter.get(orderedParticipant.id);
    if (!seed) throw new Error(`Missing encounter seed for ${orderedParticipant.id}.`);
    return {
      characterId: seed.characterId,
      initiativeRoll: seed.initiativeRoll,
      initiativeModifier: seed.initiativeModifier,
      initiativeTotal: seed.initiativeRoll + seed.initiativeModifier,
      tieBreaker: seed.tieBreaker ?? seed.initiativeModifier,
      turnOrder,
      lastTurnRound: 0,
      ...createDnd35ActionEconomy(seed.attacksOfOpportunityPerRound ?? 1),
    };
  });

  return {
    roundNumber: started.value.round,
    activeTurnIndex: started.value.activeIndex,
    participants,
  };
}

export function currentEncounterParticipant(state: EncounterState): EncounterParticipantState | null {
  const current = currentTurnParticipant(turnState(state));
  if (!current) return null;
  return state.participants.find((participant) => participant.characterId === current.id) ?? null;
}

export function advanceEncounterTurn(state: EncounterState): EngineResult<EncounterAdvance> {
  const advanced = advanceTurn(turnState(state));
  if (!advanced.ok) return advanced;

  let participants = state.participants.map((participant) => ({ ...participant }));
  if (advanced.value.roundAdvanced) {
    participants = participants.map((participant) => ({
      ...participant,
      ...beginDnd35Round(participant),
    }));
  }

  participants = participants.map((participant) => {
    if (participant.characterId !== advanced.value.currentParticipantId) return participant;
    const next = beginDnd35Turn(participant);
    return {
      ...participant,
      ...next,
      lastTurnRound: advanced.value.state.round,
    };
  });

  return {
    ok: true,
    value: {
      state: {
        roundNumber: advanced.value.state.round,
        activeTurnIndex: advanced.value.state.activeIndex,
        participants,
      },
      previousCharacterId: advanced.value.previousParticipantId,
      currentCharacterId: advanced.value.currentParticipantId,
      roundAdvanced: advanced.value.roundAdvanced,
    },
  };
}

export function spendCurrentEncounterAction(
  state: EncounterState,
  actorId: string,
  kind: Dnd35ActionKind,
): EngineResult<EncounterState> {
  const current = currentEncounterParticipant(state);
  if (!current || current.characterId !== actorId) {
    return {
      ok: false,
      errors: [
        {
          code: "ENCOUNTER_NOT_ACTORS_TURN",
          message: "The requested actor does not currently have the encounter turn.",
        },
      ],
    };
  }

  const spent = spendDnd35Action(current, kind);
  if (!spent.ok) return spent;

  return {
    ok: true,
    value: {
      ...state,
      participants: state.participants.map((participant) =>
        participant.characterId === actorId ? { ...participant, ...spent.value } : participant,
      ),
    },
  };
}
