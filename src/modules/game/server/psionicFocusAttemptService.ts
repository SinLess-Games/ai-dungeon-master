/// <reference types="@cloudflare/workers-types" />

import {
  gainPersistentPsionicFocus as resolvePersistentPsionicFocus,
  type CastingServiceDependencies,
} from "./castingService";
import { loadActiveGameContext } from "./d1Dnd35State";
import { D1GameEventStore } from "./d1GameEventStore";
import { prepareEncounterAction } from "./encounterActionState";

/**
 * Preserve D&D 3.5 action semantics for the Concentration check used to gain
 * psionic focus. A failed DC 20 check still consumes the full-round action.
 *
 * Successful attempts are already committed atomically by castingService. On
 * failure there is no focus mutation, but we still append the authoritative
 * attempt event and spend the encounter action in one guarded D1 transaction.
 */
export async function gainPersistentPsionicFocus(
  deps: CastingServiceDependencies,
  input: { campaignId: string; actorId: string },
) {
  const result = await resolvePersistentPsionicFocus(deps, input);
  if (result.success) return result;

  const context = await loadActiveGameContext(deps.db, input.campaignId);
  if (!context) throw new Error("CAMPAIGN_GAME_NOT_ACTIVE");

  const action = await prepareEncounterAction(deps, {
    campaignId: input.campaignId,
    actorId: input.actorId,
    kind: "full_round",
  });
  const eventId = deps.createId?.() ?? crypto.randomUUID();
  const occurredAt = deps.now?.() ?? new Date();
  const event = {
    id: eventId,
    campaignId: context.campaignId,
    sessionId: context.sessionId,
    eventType: "psionic.focus.failed",
    occurredAt,
    actorId: input.actorId,
    targetIds: [input.actorId],
    payload: {
      dc: result.dc,
      roll: result.roll,
      total: result.total,
      success: false,
    },
    deltas: [],
  };

  const store = new D1GameEventStore(deps.binding);
  if (action === null) {
    await store.append(event);
  } else {
    const persisted = await store.commitEncounterAction({ event, action });
    if (!persisted) throw new Error("GAME_STATE_CONFLICT");
  }

  return {
    ...result,
    eventId,
    sessionId: context.sessionId,
  };
}
