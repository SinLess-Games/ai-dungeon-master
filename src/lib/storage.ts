import type { Character } from "./rules/character";
import type { Campaign as CampaignRecord } from "./campaign";
import type { World } from "./world";
import type { TacticalMap } from "./tacticalmap";
import { repairWorld } from "./world-repair";


/**
 * Local persistence layer. This is deliberately a thin, swappable API so it can
 * be pointed at Lovable Cloud (auth + database) without touching the UI.
 */

const KEY_CHARACTERS = "dnd35:characters";
const KEY_ROLLS = "dnd35:rolls";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("dnd35:store-changed", { detail: key }));
  } catch {
    /* quota or private mode */
  }
}

export function listCharacters(): Character[] {
  return read<Character[]>(KEY_CHARACTERS, []).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getCharacter(id: string): Character | undefined {
  return read<Character[]>(KEY_CHARACTERS, []).find((c) => c.id === id);
}

export function saveCharacter(character: Character) {
  const all = read<Character[]>(KEY_CHARACTERS, []);
  const next = { ...character, updatedAt: new Date().toISOString() };
  const i = all.findIndex((c) => c.id === character.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  write(KEY_CHARACTERS, all);
  return next;
}

export function deleteCharacter(id: string) {
  write(
    KEY_CHARACTERS,
    read<Character[]>(KEY_CHARACTERS, []).filter((c) => c.id !== id),
  );
  recordDeletion("characters", id);
}

export function duplicateCharacter(id: string) {
  const c = getCharacter(id);
  if (!c) return;
  const copy: Character = {
    ...structuredClone(c),
    id: newId(),
    name: `${c.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCharacter(copy);
  return copy;
}

export interface StoredRoll {
  id: string;
  notation: string;
  label?: string;
  total: number;
  at: string;
  characterName?: string;
}

export function listRolls(): StoredRoll[] {
  return read<StoredRoll[]>(KEY_ROLLS, []);
}

export function pushRoll(r: StoredRoll) {
  const all = [r, ...read<StoredRoll[]>(KEY_ROLLS, [])].slice(0, 100);
  write(KEY_ROLLS, all);
}

export function clearRolls() {
  write(KEY_ROLLS, []);
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ---------------------------------------------------------------- campaigns */

const KEY_CAMPAIGNS = "dnd35:campaigns";

export function listCampaigns(): CampaignRecord[] {
  return read<CampaignRecord[]>(KEY_CAMPAIGNS, []).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getCampaign(id: string): CampaignRecord | undefined {
  return read<CampaignRecord[]>(KEY_CAMPAIGNS, []).find((c) => c.id === id);
}

export function saveCampaign(campaign: CampaignRecord) {
  const all = read<CampaignRecord[]>(KEY_CAMPAIGNS, []);
  const next = { ...campaign, updatedAt: new Date().toISOString() };
  const i = all.findIndex((c) => c.id === campaign.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  write(KEY_CAMPAIGNS, all);
  return next;
}

export function deleteCampaign(id: string) {
  write(
    KEY_CAMPAIGNS,
    read<CampaignRecord[]>(KEY_CAMPAIGNS, []).filter((c) => c.id !== id),
  );
  recordDeletion("campaigns", id);
}

/* --------------------------------------------------------- worlds and maps */

const KEY_WORLDS = "dnd35:worlds";
const KEY_MAPS = "dnd35:maps";

export function listWorlds(): World[] {
  return read<World[]>(KEY_WORLDS, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getWorld(id: string): World | undefined {
  const found = read<World[]>(KEY_WORLDS, []).find((w) => w.id === id);
  if (!found) return undefined;
  const { world, changed } = repairWorld(found);
  return changed ? saveWorld(world) : found;
}


export function saveWorld(world: World) {
  const all = read<World[]>(KEY_WORLDS, []);
  const next = { ...world, updatedAt: new Date().toISOString() };
  const i = all.findIndex((w) => w.id === world.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  write(KEY_WORLDS, all);
  return next;
}

export function deleteWorld(id: string) {
  write(KEY_WORLDS, read<World[]>(KEY_WORLDS, []).filter((w) => w.id !== id));
  const doomed = read<TacticalMap[]>(KEY_MAPS, []).filter((m) => m.worldId === id);
  write(KEY_MAPS, read<TacticalMap[]>(KEY_MAPS, []).filter((m) => m.worldId !== id));
  recordDeletion("worlds", id);
  for (const m of doomed) recordDeletion("game_maps", m.id);
}

export function listMaps(worldId?: string): TacticalMap[] {
  return read<TacticalMap[]>(KEY_MAPS, [])
    .filter((m) => (worldId ? m.worldId === worldId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getMap(id: string): TacticalMap | undefined {
  return read<TacticalMap[]>(KEY_MAPS, []).find((m) => m.id === id);
}

export function saveMap(map: TacticalMap) {
  const all = read<TacticalMap[]>(KEY_MAPS, []);
  const next = { ...map, updatedAt: new Date().toISOString() };
  const i = all.findIndex((m) => m.id === map.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  write(KEY_MAPS, all);
  return next;
}

export function deleteMap(id: string) {
  write(KEY_MAPS, read<TacticalMap[]>(KEY_MAPS, []).filter((m) => m.id !== id));
  recordDeletion("game_maps", id);
}

/** Keys used by the cloud sync layer. */
export const STORE_KEYS = {
  characters: KEY_CHARACTERS,
  campaigns: KEY_CAMPAIGNS,
  worlds: KEY_WORLDS,
  maps: KEY_MAPS,
  rolls: KEY_ROLLS,
} as const;

export function readCollection<T>(key: string): T[] {
  return read<T[]>(key, []);
}

export function writeCollection<T>(key: string, rows: T[]) {
  write(key, rows);
}


/* -------------------------------------------------------------- tombstones */

const KEY_DELETED = "dnd35:deleted";

export type SyncTable = "characters" | "campaigns" | "worlds" | "game_maps";
export interface Tombstone {
  table: SyncTable;
  id: string;
  at: string;
}

/** Remember a delete so the cloud sync can remove the row remotely. */
export function recordDeletion(table: SyncTable, id: string) {
  const all = read<Tombstone[]>(KEY_DELETED, []);
  if (all.some((t) => t.table === table && t.id === id)) return;
  all.push({ table, id, at: new Date().toISOString() });
  write(KEY_DELETED, all);
}

export function listDeletions(): Tombstone[] {
  return read<Tombstone[]>(KEY_DELETED, []);
}

export function clearDeletions(done: Tombstone[]) {
  const gone = new Set(done.map((t) => `${t.table}:${t.id}`));
  write(
    KEY_DELETED,
    read<Tombstone[]>(KEY_DELETED, []).filter((t) => !gone.has(`${t.table}:${t.id}`)),
  );
}
