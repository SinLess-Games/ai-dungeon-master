import { newId } from "./storage";
import type { Campaign } from "./campaign";
import type { Character } from "./rules/character";
import { computeCharacter } from "./rules/engine";
import { CLASS_BY_ID } from "./rules/classes";

export type PartyKind = "pc" | "npc";
export type PartyControl = "player" | "dm";
export type PartyStatus = "active" | "benched" | "gone";
/** Which band of the roster a member sits in. */
export type PartyTier = "companion" | "cohort" | "follower";

export interface PartyGear {
  id: string;
  name: string;
  quantity: number;
  slot: string;
  notes: string;
}

export interface PartyMember {
  id: string;
  name: string;
  kind: PartyKind;
  tier: PartyTier;
  /** Set when this seat is one of your saved heroes. */
  characterId?: string;
  controlledBy: PartyControl;
  role: string;
  race: string;
  classLine: string;
  level: number;
  attitude: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  gold: number;
  status: PartyStatus;
  notes: string;
  gear: PartyGear[];
}

export const GEAR_SLOTS = [
  "weapon",
  "armor",
  "shield",
  "ring",
  "amulet",
  "cloak",
  "belt",
  "boots",
  "gloves",
  "head",
  "pack",
] as const;

export const ROLE_PRESETS = [
  "Striker",
  "Defender",
  "Healer",
  "Skill monkey",
  "Arcanist",
  "Scout",
  "Face",
  "Hireling",
  "Animal companion",
  "Cohort",
  "Mount",
] as const;

export const ATTITUDES = ["hostile", "unfriendly", "indifferent", "friendly", "helpful", "devoted"] as const;

export const TIERS: { value: PartyTier; label: string; blurb: string }[] = [
  { value: "companion", label: "Adventuring party", blurb: "Heroes and allies who travel and fight beside you." },
  { value: "cohort", label: "Cohorts", blurb: "Loyal lieutenants gained through Leadership — capable, named, levelled." },
  { value: "follower", label: "Followers", blurb: "Low-level retainers, guards, servants and hangers-on." },
];

export function emptyMember(kind: PartyKind = "npc", tier: PartyTier = "companion"): PartyMember {
  return {
    id: newId(),
    tier,
    name: tier === "cohort" ? "New cohort" : tier === "follower" ? "New follower" : kind === "npc" ? "New companion" : "New hero",
    kind,
    controlledBy: kind === "npc" ? "dm" : "player",
    role: tier === "cohort" ? "Cohort" : tier === "follower" ? "Hireling" : kind === "npc" ? "Hireling" : "Striker",
    race: "",
    classLine: "",
    level: 1,
    attitude: "friendly",
    hp: 8,
    maxHp: 8,
    ac: 10,
    initiative: 0,
    gold: 0,
    status: "active",
    notes: "",
    gear: [],
  };
}

/** Build a roster seat from one of the player's saved heroes. */
export function memberFromCharacter(character: Character): PartyMember {
  const d = computeCharacter(character);
  const classLine = character.classes
    .map((cl) => `${CLASS_BY_ID[cl.classId]?.name ?? cl.classId} ${cl.levels}`)
    .join("/");
  return {
    ...emptyMember("pc", "companion"),
    name: character.name || "Unnamed hero",
    characterId: character.id,
    controlledBy: "player",
    race: d.race.name,
    classLine,
    level: d.ecl,
    hp: character.hp.current || d.hpMax,
    maxHp: character.hp.max || d.hpMax,
    ac: d.ac.total,
    initiative: d.initiative,
    gold: character.gold ?? 0,
    role: "Striker",
  };
}

export function getParty(campaign: Campaign): PartyMember[] {
  return campaign.party ?? [];
}

function withParty(campaign: Campaign, party: PartyMember[]): Campaign {
  return { ...campaign, party };
}

export function addMember(campaign: Campaign, member: PartyMember): Campaign {
  return withParty(campaign, [...getParty(campaign), member]);
}

export function updateMember(
  campaign: Campaign,
  id: string,
  patch: Partial<PartyMember>,
): Campaign {
  return withParty(
    campaign,
    getParty(campaign).map((m) => (m.id === id ? { ...m, ...patch } : m)),
  );
}

export function removeMember(campaign: Campaign, id: string): Campaign {
  return withParty(campaign, getParty(campaign).filter((m) => m.id !== id));
}

export function reorderMember(campaign: Campaign, id: string, delta: number): Campaign {
  const party = [...getParty(campaign)];
  const i = party.findIndex((m) => m.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= party.length) return campaign;
  const [moved] = party.splice(i, 1);
  party.splice(j, 0, moved!);
  return withParty(campaign, party);
}

/* --------------------------------------------------------------- outfitting */

export function emptyGear(): PartyGear {
  return { id: newId(), name: "New item", quantity: 1, slot: "pack", notes: "" };
}

export function addGear(campaign: Campaign, memberId: string, gear?: Partial<PartyGear>): Campaign {
  const item = { ...emptyGear(), ...gear };
  return updateMember(campaign, memberId, {
    gear: [...(getParty(campaign).find((m) => m.id === memberId)?.gear ?? []), item],
  });
}

export function updateGear(
  campaign: Campaign,
  memberId: string,
  gearId: string,
  patch: Partial<PartyGear>,
): Campaign {
  const member = getParty(campaign).find((m) => m.id === memberId);
  if (!member) return campaign;
  return updateMember(campaign, memberId, {
    gear: member.gear.map((g) => (g.id === gearId ? { ...g, ...patch } : g)),
  });
}

export function removeGear(campaign: Campaign, memberId: string, gearId: string): Campaign {
  const member = getParty(campaign).find((m) => m.id === memberId);
  if (!member) return campaign;
  return updateMember(campaign, memberId, {
    gear: member.gear.filter((g) => g.id !== gearId),
  });
}

/* ------------------------------------------------------------------ summary */

export function partySummary(party: PartyMember[]) {
  const active = party.filter((m) => m.status === "active");
  return {
    total: party.length,
    active: active.length,
    dmRun: active.filter((m) => m.controlledBy === "dm").length,
    playerRun: active.filter((m) => m.controlledBy === "player").length,
    gold: active.reduce((s, m) => s + (m.gold || 0), 0),
    averageLevel: active.length
      ? Math.round((active.reduce((s, m) => s + m.level, 0) / active.length) * 10) / 10
      : 0,
  };
}

/** Roster block handed to the AI DM so it knows who it plays and who you play. */
function line(m: PartyMember) {
  const gear = m.gear.length
    ? m.gear.map((g) => `${g.name}${g.quantity > 1 ? ` x${g.quantity}` : ""}`).join(", ")
    : "nothing notable";
  return `- ${m.name} (${m.kind === "pc" ? "player character" : "NPC"}, ${m.tier}, ${m.role}, level ${m.level}${
    m.race ? `, ${m.race}` : ""
  }${m.classLine ? ` ${m.classLine}` : ""}) — run by ${
    m.controlledBy === "dm" ? "YOU, the DM" : "the player"
  }; HP ${m.hp}/${m.maxHp}, AC ${m.ac}, init ${m.initiative >= 0 ? "+" : ""}${m.initiative}, attitude ${m.attitude}. Carrying: ${gear}.${
    m.notes ? ` Notes: ${m.notes}` : ""
  }`;
}

export function partyContext(party: PartyMember[]) {
  const active = party.filter((m) => m.status === "active");
  if (!active.length) return "- no companions yet; the player runs a single hero";
  const group = (t: PartyTier, label: string) => {
    const rows = active.filter((m) => (m.tier ?? "companion") === t);
    return rows.length ? `${label}:\n${rows.map(line).join("\n")}` : "";
  };
  return [
    group("companion", "Adventuring party"),
    group("cohort", "Cohorts"),
    group("follower", "Followers"),
  ]
    .filter(Boolean)
    .join("\n");
}


/** DM-side roster edit: match by name, otherwise create the member. */
export function upsertMemberByName(
  campaign: Campaign,
  input: {
    name: string;
    tier?: PartyTier;
    kind?: PartyKind;
    controlledBy?: PartyControl;
    role?: string;
    race?: string;
    classLine?: string;
    level?: number;
    attitude?: string;
    hp?: number;
    maxHp?: number;
    ac?: number;
    initiative?: number;
    gold?: number;
    status?: PartyStatus;
    notes?: string;
    gear?: { name: string; quantity?: number; slot?: string; notes?: string }[];
  },
): { campaign: Campaign; created: boolean } {
  const name = input.name.trim();
  const existing = getParty(campaign).find((m) => m.name.toLowerCase() === name.toLowerCase());
  const gear = input.gear?.map((g) => ({
    ...emptyGear(),
    name: g.name,
    quantity: Math.max(1, g.quantity ?? 1),
    slot: g.slot ?? "pack",
    notes: g.notes ?? "",
  }));
  const patch: Partial<PartyMember> = {
    name,
    ...(input.tier ? { tier: input.tier } : {}),
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.controlledBy ? { controlledBy: input.controlledBy } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.race ? { race: input.race } : {}),
    ...(input.classLine ? { classLine: input.classLine } : {}),
    ...(typeof input.level === "number" ? { level: input.level } : {}),
    ...(input.attitude ? { attitude: input.attitude } : {}),
    ...(typeof input.hp === "number" ? { hp: input.hp } : {}),
    ...(typeof input.maxHp === "number" ? { maxHp: input.maxHp } : {}),
    ...(typeof input.ac === "number" ? { ac: input.ac } : {}),
    ...(typeof input.initiative === "number" ? { initiative: input.initiative } : {}),
    ...(typeof input.gold === "number" ? { gold: input.gold } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
  if (existing) {
    const merged = gear?.length ? { ...patch, gear: [...existing.gear, ...gear] } : patch;
    return { campaign: updateMember(campaign, existing.id, merged), created: false };
  }
  const base = emptyMember(input.kind ?? "npc", input.tier ?? "companion");
  const member: PartyMember = { ...base, ...patch, gear: gear ?? [] };
  if (typeof input.maxHp !== "number" && typeof input.hp === "number") member.maxHp = input.hp;
  return { campaign: addMember(campaign, member), created: true };
}

export function removeMemberByName(campaign: Campaign, name: string): Campaign {
  const m = getParty(campaign).find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
  return m ? removeMember(campaign, m.id) : campaign;
}
