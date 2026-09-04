import { newId } from "./storage";
import type { Campaign } from "./campaign";
import type { Character } from "./rules/character";
import { computeCharacter } from "./rules/engine";
import { CLASS_BY_ID } from "./rules/classes";

export type PartyKind = "pc" | "npc";
export type PartyControl = "player" | "dm";
export type PartyStatus = "active" | "benched" | "gone";

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

export function emptyMember(kind: PartyKind = "npc"): PartyMember {
  return {
    id: newId(),
    name: kind === "npc" ? "New companion" : "New hero",
    kind,
    controlledBy: kind === "npc" ? "dm" : "player",
    role: kind === "npc" ? "Hireling" : "Striker",
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
    ...emptyMember("pc"),
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
export function partyContext(party: PartyMember[]) {
  const active = party.filter((m) => m.status === "active");
  if (!active.length) return "- no companions yet; the player runs a single hero";
  return active
    .map((m) => {
      const gear = m.gear.length
        ? m.gear.map((g) => `${g.name}${g.quantity > 1 ? ` x${g.quantity}` : ""}`).join(", ")
        : "nothing notable";
      return `- ${m.name} (${m.kind === "pc" ? "player character" : "NPC companion"}, ${m.role}, level ${m.level}${
        m.race ? `, ${m.race}` : ""
      }${m.classLine ? ` ${m.classLine}` : ""}) — run by ${
        m.controlledBy === "dm" ? "YOU, the DM" : "the player"
      }; HP ${m.hp}/${m.maxHp}, AC ${m.ac}, init ${m.initiative >= 0 ? "+" : ""}${m.initiative}, attitude ${m.attitude}. Carrying: ${gear}.${
        m.notes ? ` Notes: ${m.notes}` : ""
      }`;
    })
    .join("\n");
}
