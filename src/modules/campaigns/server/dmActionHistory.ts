/// <reference types="@cloudflare/workers-types" />

interface ResolvedActionRow {
  requestedByMessageId: string;
  kind: string;
  arguments: string;
  result: string | null;
  resolvedAt: number | null;
}

export interface DmResolvedActionHistoryEntry {
  requestedByMessageId: string;
  kind: string;
  arguments: unknown;
  result: unknown;
  resolvedAt: number | null;
}

function parseJson(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

/**
 * Loads a compact mechanical ledger for recent player turns. The planner uses
 * this to distinguish completed checks from unresolved work instead of
 * inferring progression solely from conversational prose.
 */
export async function loadResolvedDmActionHistory(
  binding: D1Database,
  campaignId: string,
  userId: string,
  limit = 16,
): Promise<DmResolvedActionHistoryEntry[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = await binding
    .prepare(
      `SELECT requested_by_message_id AS requestedByMessageId,
              kind,
              arguments,
              result,
              resolved_at AS resolvedAt
       FROM campaign_dm_actions
       WHERE campaign_id = ?
         AND requested_user_id = ?
         AND status = 'resolved'
       ORDER BY resolved_at DESC, created_at DESC, rowid DESC
       LIMIT ?`,
    )
    .bind(campaignId, userId, safeLimit)
    .all<ResolvedActionRow>();

  return rows.results.map((row) => ({
    requestedByMessageId: row.requestedByMessageId,
    kind: row.kind,
    arguments: parseJson(row.arguments),
    result: parseJson(row.result),
    resolvedAt: row.resolvedAt,
  }));
}

export function serializeDmActionProgress(
  entries: readonly DmResolvedActionHistoryEntry[],
  currentPlayerMessageId: string,
): string {
  if (entries.length === 0) return "(No resolved DM-requested checks yet.)";
  return JSON.stringify(
    entries.map((entry) => ({
      turn: entry.requestedByMessageId === currentPlayerMessageId ? "current" : "historical",
      playerMessageId: entry.requestedByMessageId,
      kind: entry.kind,
      arguments: entry.arguments,
      result: entry.result,
      resolvedAt: entry.resolvedAt,
    })),
  ).slice(0, 12_000);
}
