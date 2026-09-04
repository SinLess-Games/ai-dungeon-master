import type { Character } from "./rules/character";
import type { Campaign as CampaignRecord } from "./campaign";

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
}
