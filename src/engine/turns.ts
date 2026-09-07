import { engineFailure, engineSuccess, type EngineResult } from "./result";

export interface TurnParticipant {
  id: string;
  initiative: number;
  tieBreaker?: number;
}

export type TurnStatus = "ready" | "active" | "complete";

export interface TurnState {
  order: readonly TurnParticipant[];
  round: number;
  activeIndex: number;
  status: TurnStatus;
}

export interface TurnAdvance {
  state: TurnState;
  previousParticipantId: string;
  currentParticipantId: string;
  roundAdvanced: boolean;
}

function validateParticipant(participant: TurnParticipant): void {
  if (!participant.id.trim()) throw new RangeError("Turn participant id cannot be empty.");
  if (!Number.isFinite(participant.initiative)) throw new RangeError("Turn initiative must be finite.");
  if (participant.tieBreaker !== undefined && !Number.isFinite(participant.tieBreaker)) {
    throw new RangeError("Turn tieBreaker must be finite.");
  }
}

export function createTurnState(
  participants: readonly TurnParticipant[],
  options: { descending?: boolean } = {},
): TurnState {
  const ids = new Set<string>();
  participants.forEach((participant) => {
    validateParticipant(participant);
    if (ids.has(participant.id)) throw new Error(`Duplicate turn participant id: ${participant.id}`);
    ids.add(participant.id);
  });

  const descending = options.descending !== false;
  const indexed = participants.map((participant, index) => ({ participant, index }));
  indexed.sort((left, right) => {
    const initiativeDifference = left.participant.initiative - right.participant.initiative;
    if (initiativeDifference !== 0) return descending ? -initiativeDifference : initiativeDifference;
    const leftTie = left.participant.tieBreaker ?? 0;
    const rightTie = right.participant.tieBreaker ?? 0;
    if (leftTie !== rightTie) return descending ? rightTie - leftTie : leftTie - rightTie;
    return left.index - right.index;
  });

  return {
    order: indexed.map(({ participant }) => ({ ...participant })),
    round: participants.length > 0 ? 1 : 0,
    activeIndex: 0,
    status: "ready",
  };
}

export function currentTurnParticipant(state: TurnState): TurnParticipant | null {
  if (state.status !== "active") return null;
  return state.order[state.activeIndex] ?? null;
}

export function startTurns(state: TurnState): EngineResult<TurnState> {
  if (state.status !== "ready") return engineFailure("TURN_STATE_INVALID", "Turn cycle is not ready to start.");
  if (state.order.length === 0) return engineFailure("TURN_ORDER_EMPTY", "Cannot start turns without participants.");
  return engineSuccess({ ...state, status: "active", round: Math.max(1, state.round), activeIndex: 0 });
}

export function advanceTurn(state: TurnState): EngineResult<TurnAdvance> {
  if (state.status !== "active") return engineFailure("TURN_STATE_INVALID", "Turn cycle is not active.");
  const previous = state.order[state.activeIndex];
  if (!previous) return engineFailure("TURN_ORDER_INVALID", "Active turn index is outside the participant order.");

  const nextIndex = state.activeIndex + 1;
  const roundAdvanced = nextIndex >= state.order.length;
  const activeIndex = roundAdvanced ? 0 : nextIndex;
  const current = state.order[activeIndex];
  if (!current) return engineFailure("TURN_ORDER_INVALID", "Unable to resolve the next participant.");

  const nextState: TurnState = {
    ...state,
    activeIndex,
    round: state.round + (roundAdvanced ? 1 : 0),
  };

  return engineSuccess({
    state: nextState,
    previousParticipantId: previous.id,
    currentParticipantId: current.id,
    roundAdvanced,
  });
}

export function completeTurns(state: TurnState): TurnState {
  return { ...state, status: "complete" };
}
