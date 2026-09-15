/// <reference types="@cloudflare/workers-types" />

export interface NarratedNpcReference {
  id?: string | undefined;
  name: string;
  role?: string | undefined;
  description?: string | undefined;
  location?: string | undefined;
  attitude?: string | undefined;
  notes?: string | undefined;
}

export interface CampaignNpcMemory {
  id: string;
  name: string;
  status: string;
  role: string | null;
  description: string | null;
  location: string | null;
  attitude: string | null;
  notes: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

interface ActorRow {
  id: string;
  name: string;
  status: string;
  metadata: string | Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

interface NpcExtension {
  role?: string | undefined;
  description?: string | undefined;
  location?: string | undefined;
  attitude?: string | undefined;
  notes?: string | undefined;
  firstSeenAt?: number | undefined;
  lastSeenAt?: number | undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseMetadata(value: ActorRow["metadata"]): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return objectValue(value);
  try {
    return objectValue(JSON.parse(value) as unknown);
  } catch {
    return {};
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function npcExtension(metadata: Record<string, unknown>): NpcExtension {
  const extensions = objectValue(metadata["extensions"]);
  return objectValue(extensions["npc"]) as NpcExtension;
}

function publicNpc(row: ActorRow): CampaignNpcMemory {
  const metadata = parseMetadata(row.metadata);
  const extension = npcExtension(metadata);
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    role: optionalText(extension.role),
    description: optionalText(extension.description),
    location: optionalText(extension.location),
    attitude: optionalText(extension.attitude),
    notes: optionalText(extension.notes) ?? optionalText(metadata["notes"]),
    firstSeenAt: optionalNumber(extension.firstSeenAt) ?? row.createdAt,
    lastSeenAt: optionalNumber(extension.lastSeenAt) ?? row.updatedAt,
  };
}

function mergeNpcMetadata(
  existing: Record<string, unknown>,
  npc: NarratedNpcReference,
  now: number,
): Record<string, unknown> {
  const extensions = objectValue(existing["extensions"]);
  const prior = npcExtension(existing);
  const firstSeenAt = optionalNumber(prior.firstSeenAt) ?? now;
  const nextNpc: NpcExtension = {
    ...(optionalText(prior.role) ? { role: optionalText(prior.role)! } : {}),
    ...(optionalText(prior.description) ? { description: optionalText(prior.description)! } : {}),
    ...(optionalText(prior.location) ? { location: optionalText(prior.location)! } : {}),
    ...(optionalText(prior.attitude) ? { attitude: optionalText(prior.attitude)! } : {}),
    ...(optionalText(prior.notes) ? { notes: optionalText(prior.notes)! } : {}),
    firstSeenAt,
    lastSeenAt: now,
  };

  if (npc.role?.trim()) nextNpc.role = npc.role.trim();
  if (npc.description?.trim()) nextNpc.description = npc.description.trim();
  if (npc.location?.trim()) nextNpc.location = npc.location.trim();
  if (npc.attitude?.trim()) nextNpc.attitude = npc.attitude.trim();
  if (npc.notes?.trim()) nextNpc.notes = npc.notes.trim();

  return {
    ...existing,
    ...(npc.notes?.trim() ? { notes: npc.notes.trim() } : {}),
    extensions: {
      ...extensions,
      npc: nextNpc,
    },
  };
}

async function campaignWorldId(binding: D1Database, campaignId: string): Promise<string | null> {
  const row = await binding
    .prepare("SELECT world_id AS worldId FROM campaigns WHERE id = ? LIMIT 1")
    .bind(campaignId)
    .first<{ worldId: string | null }>();
  return row?.worldId ?? null;
}

async function findNpc(
  binding: D1Database,
  campaignId: string,
  npc: NarratedNpcReference,
): Promise<ActorRow | null> {
  if (npc.id) {
    const byId = await binding
      .prepare(
        `SELECT id, name, status, metadata,
                created_at AS createdAt, updated_at AS updatedAt
         FROM game_actors
         WHERE id = ? AND campaign_id = ? AND kind = 'npc'
         LIMIT 1`,
      )
      .bind(npc.id, campaignId)
      .first<ActorRow>();
    if (byId) return byId;
  }

  return binding
    .prepare(
      `SELECT id, name, status, metadata,
              created_at AS createdAt, updated_at AS updatedAt
       FROM game_actors
       WHERE campaign_id = ? AND kind = 'npc' AND lower(name) = lower(?)
       ORDER BY updated_at DESC, rowid DESC
       LIMIT 1`,
    )
    .bind(campaignId, npc.name.trim())
    .first<ActorRow>();
}

export async function recordNarratedCampaignNpc(
  binding: D1Database,
  campaignId: string,
  npc: NarratedNpcReference,
): Promise<CampaignNpcMemory> {
  const name = npc.name.trim();
  if (!name) throw new Error("AI_DM_NPC_NAME_REQUIRED");
  const worldId = await campaignWorldId(binding, campaignId);
  if (!worldId) throw new Error("AI_DM_NPC_WORLD_UNAVAILABLE");

  const now = Math.floor(Date.now() / 1000);
  const existing = await findNpc(binding, campaignId, { ...npc, name });
  if (existing) {
    const metadata = mergeNpcMetadata(parseMetadata(existing.metadata), { ...npc, name }, now);
    await binding
      .prepare(
        `UPDATE game_actors
         SET name = ?, metadata = ?, updated_at = unixepoch()
         WHERE id = ? AND campaign_id = ? AND kind = 'npc'`,
      )
      .bind(name, JSON.stringify(metadata), existing.id, campaignId)
      .run();
    return publicNpc({ ...existing, name, metadata, updatedAt: now });
  }

  const id = crypto.randomUUID();
  const metadata = mergeNpcMetadata({}, { ...npc, name }, now);
  await binding
    .prepare(
      `INSERT INTO game_actors
         (id, campaign_id, world_id, kind, character_id, controller_user_id, name, status, metadata)
       VALUES (?, ?, ?, 'npc', NULL, NULL, ?, 'active', ?)`,
    )
    .bind(id, campaignId, worldId, name, JSON.stringify(metadata))
    .run();
  return publicNpc({ id, name, status: "active", metadata, createdAt: now, updatedAt: now });
}

export async function recordNarratedCampaignNpcs(
  binding: D1Database,
  campaignId: string,
  npcs: readonly NarratedNpcReference[],
): Promise<CampaignNpcMemory[]> {
  const unique = new Map<string, NarratedNpcReference>();
  for (const npc of npcs) {
    const name = npc.name.trim();
    if (!name) continue;
    unique.set((npc.id || name).toLocaleLowerCase(), { ...npc, name });
  }
  const recorded: CampaignNpcMemory[] = [];
  for (const npc of unique.values()) {
    recorded.push(await recordNarratedCampaignNpc(binding, campaignId, npc));
  }
  return recorded;
}

export async function loadCampaignNpcRegistry(
  binding: D1Database,
  campaignId: string,
  limit = 100,
): Promise<CampaignNpcMemory[]> {
  const result = await binding
    .prepare(
      `SELECT id, name, status, metadata,
              created_at AS createdAt, updated_at AS updatedAt
       FROM game_actors
       WHERE campaign_id = ? AND kind = 'npc'
       ORDER BY updated_at DESC, created_at DESC, id
       LIMIT ?`,
    )
    .bind(campaignId, Math.max(1, Math.min(250, limit)))
    .all<ActorRow>();
  return result.results.map(publicNpc);
}

export function serializeCampaignNpcRegistry(npcs: readonly CampaignNpcMemory[]): string {
  return JSON.stringify(
    npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      status: npc.status,
      role: npc.role,
      description: npc.description,
      location: npc.location,
      attitude: npc.attitude,
      notes: npc.notes,
      firstSeenAt: npc.firstSeenAt,
      lastSeenAt: npc.lastSeenAt,
    })),
  );
}
