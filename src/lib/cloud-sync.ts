/**
 * Offline-first cloud sync.
 *
 * The UI keeps talking to the synchronous local store. This layer mirrors those
 * collections into Lovable Cloud for the signed-in user: it pulls on sign-in,
 * merges by `updatedAt` (last write wins), and pushes changed rows afterwards.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  STORE_KEYS,
  clearDeletions,
  listDeletions,
  readCollection,
  writeCollection,
} from "@/lib/storage";
import { AUTH_EVENT, getSession } from "@/lib/auth";

interface SyncRow {
  id: string;
  name: string;
  updatedAt: string;
  worldId?: string;
  [k: string]: unknown;
}

type TableName = "characters" | "campaigns" | "worlds" | "game_maps";

const SPECS: { key: string; table: TableName; hasWorld: boolean }[] = [
  { key: STORE_KEYS.characters, table: "characters", hasWorld: false },
  { key: STORE_KEYS.worlds, table: "worlds", hasWorld: false },
  { key: STORE_KEYS.campaigns, table: "campaigns", hasWorld: true },
  { key: STORE_KEYS.maps, table: "game_maps", hasWorld: true },
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SYNC_EVENT = "codex:sync-changed";

let status: "idle" | "syncing" | "error" | "offline" = "offline";
let lastSyncedAt: string | null = null;

export function syncStatus() {
  return { status, lastSyncedAt };
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

async function syncSpec(userId: string, spec: (typeof SPECS)[number]) {
  // Anything the player deleted stays gone, even if the cloud copy lingers.
  const gone = new Set(
    listDeletions()
      .filter((t) => t.table === spec.table)
      .map((t) => t.id),
  );
  const local = readCollection<SyncRow>(spec.key).filter(
    (r) => r && UUID.test(r.id) && !gone.has(r.id),
  );
  const { data: remote, error } = await supabase
    .from(spec.table)
    .select("id, data, updated_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const byId = new Map<string, SyncRow>();
  for (const row of local) byId.set(row.id, row);

  const pushes: SyncRow[] = [];
  for (const row of remote ?? []) {
    if (gone.has(row.id as string)) continue;
    const remoteRow = (row as unknown as { data: SyncRow }).data;
    if (!remoteRow || typeof remoteRow !== "object") continue;
    const localRow = byId.get(row.id as string);
    if (!localRow || (remoteRow.updatedAt ?? "") > (localRow.updatedAt ?? "")) {
      byId.set(row.id as string, remoteRow);
    } else if ((localRow.updatedAt ?? "") > (remoteRow.updatedAt ?? "")) {
      pushes.push(localRow);
    }
  }
  const remoteIds = new Set((remote ?? []).map((r) => r.id as string));
  for (const row of local) if (!remoteIds.has(row.id)) pushes.push(row);

  const merged = [...byId.values()].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
  writeCollection(spec.key, merged);

  if (pushes.length) {
    const payload = pushes.map((row) => ({
      id: row.id,
      user_id: userId,
      name: row.name ?? "Untitled",
      data: row as unknown,
      ...(spec.hasWorld && row.worldId && UUID.test(row.worldId) ? { world_id: row.worldId } : {}),
      updated_at: row.updatedAt ?? new Date().toISOString(),
    }));
    const table = supabase.from(spec.table) as unknown as {
      upsert: (rows: unknown[]) => Promise<{ error: { message: string } | null }>;
    };
    const { error: upErr } = await table.upsert(payload);
    if (upErr) throw new Error(upErr.message);
  }
}

/** Push local deletes to the backend before pulling, so rows stay deleted. */
async function flushDeletions(userId: string) {
  const pending = listDeletions();
  if (!pending.length) return;
  const done: typeof pending = [];
  for (const t of pending) {
    if (!UUID.test(t.id)) {
      done.push(t);
      continue;
    }
    try {
      const { error } = await supabase.from(t.table).delete().eq("id", t.id).eq("user_id", userId);
      // A failed delete keeps its tombstone so we try again next sync.
      if (!error) done.push(t);
    } catch {
      /* keep it pending */
    }
  }
  clearDeletions(done);
}

let running: Promise<void> | null = null;

export function syncNow(): Promise<void> {
  const user = getSession();
  if (!user) {
    status = "offline";
    emit();
    return Promise.resolve();
  }
  if (running) return running;
  status = "syncing";
  emit();
  running = (async () => {
    try {
      await flushDeletions(user.id);
      for (const spec of SPECS) await syncSpec(user.id, spec);
      status = "idle";
      lastSyncedAt = new Date().toISOString();
    } catch {
      status = "error";
    } finally {
      running = null;
      emit();
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;

/** Mount once (root component). Watches auth + local writes and syncs. */
export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  const schedule = () => {
    if (!getSession()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), 1500);
  };

  window.addEventListener("dnd35:store-changed", schedule);
  window.addEventListener(AUTH_EVENT, () => void syncNow());
  window.addEventListener("online", () => void syncNow());
  void syncNow();
}
