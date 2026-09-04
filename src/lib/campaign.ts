import { newId } from "./storage";
import type { PartyMember } from "./party";

export type CampaignStyle =
  | "heroic"
  | "high-magic"
  | "grim-dark"
  | "steampunk-magitech"
  | "low-fantasy"
  | "sword-and-sorcery"
  | "mythic-epic"
  | "gothic-horror"
  | "cosmic-horror"
  | "political-intrigue"
  | "dungeon-delving"
  | "wilderness-exploration"
  | "nautical-pirate"
  | "planar-adventure"
  | "post-apocalyptic"
  | "fairytale-whimsy"
  | "noir-mystery"
  | "wuxia-martial"
  | "science-fantasy"
  | "sandbox";

export type CampaignType =
  | "dungeon-crawl"
  | "westward-march"
  | "death-trap"
  | "epic"
  | "heroes"
  | "demon-lord"
  | "apocalypse"
  | "sandbox";

export type CampaignLength = "one-shot" | "short" | "standard" | "epic";
export type CampaignPace = "slow" | "measured" | "brisk" | "breakneck";
export type DmStyle = "fair" | "cinematic" | "rules-lawyer" | "brutal";

export interface SceneState {
  location: string;
  region: string;
  timeOfDay: string;
  weather: string;
  inCombat: boolean;
  round: number;
  summary: string;
}

export interface CampaignNpc {
  id: string;
  name: string;
  role: string;
  attitude: string;
  notes: string;
}

export interface QuestEntry {
  id: string;
  title: string;
  detail: string;
  status: "active" | "done" | "failed";
}

export interface PendingRoll {
  id: string;
  toolCallId: string;
  reason: string;
  notation: string;
  dc?: number;
  skillId?: string;
  modifier: number;
}

/** A stored chat message in AI SDK UIMessage shape (kept loose for persistence). */
export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[];
}

export interface Campaign {
  id: string;
  name: string;
  characterId: string;
  /** Up to 3 campaign style tags. */
  styles: CampaignStyle[];
  type: CampaignType;
  length: CampaignLength;
  pace: CampaignPace;
  dmStyle: DmStyle;
  allowEpic: boolean;
  /** Overland map drawn for this campaign (see lib/campaign-world). */
  worldId?: string;
  worldName: string;
  worldSummary: string;
  houseRules: string;
  scene: SceneState;
  npcs: CampaignNpc[];
  /** Roster of heroes and NPC companions travelling with the player. */
  party: PartyMember[];
  quests: QuestEntry[];
  journal: { id: string; at: string; text: string }[];
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

export const STYLE_OPTIONS: { value: CampaignStyle; label: string; blurb: string }[] = [
  { value: "heroic", label: "Heroic", blurb: "Bold deeds, clear villains, earned victories." },
  { value: "high-magic", label: "High magic", blurb: "Magic is common, wonders shape everyday life." },
  { value: "grim-dark", label: "Grim-dark", blurb: "Cruel worlds, scarce hope, survival costs dignity." },
  { value: "steampunk-magitech", label: "Steampunk / magi-tech", blurb: "Gears, steam, and enchanted industry reshape civilization." },
  { value: "low-fantasy", label: "Low fantasy", blurb: "Rare magic, grounded threats, steel and wits matter most." },
  { value: "sword-and-sorcery", label: "Sword & sorcery", blurb: "Pulp adventure, decadent cities, and eldritch relics." },
  { value: "mythic-epic", label: "Mythic epic", blurb: "Demigods, cosmic journeys, and destiny across ages." },
  { value: "gothic-horror", label: "Gothic horror", blurb: "Ruined castles, cursed bloodlines, and creeping dread." },
  { value: "cosmic-horror", label: "Cosmic horror", blurb: "Ancient truths that break minds and unravel reality." },
  { value: "political-intrigue", label: "Political intrigue", blurb: "Courts, spies, and knives behind smiles." },
  { value: "dungeon-delving", label: "Dungeon delving", blurb: "Torchlit ruins, traps, and treasure beneath the world." },
  { value: "wilderness-exploration", label: "Wilderness exploration", blurb: "Untamed frontiers, survival, and lost places." },
  { value: "nautical-pirate", label: "Nautical / pirate", blurb: "High seas, privateers, buried secrets, and krakens." },
  { value: "planar-adventure", label: "Planar adventure", blurb: "Travel the Outer Planes and bargain with outsiders." },
  { value: "post-apocalyptic", label: "Post-apocalyptic", blurb: "Civilizations fell; scavengers pick through the wreckage." },
  { value: "fairytale-whimsy", label: "Fairytale whimsy", blurb: "Talking beasts, fae bargains, and moral tests in twilight woods." },
  { value: "noir-mystery", label: "Noir mystery", blurb: "Rain-slick streets, hard choices, and conspiracies within conspiracies." },
  { value: "wuxia-martial", label: "Wuxia martial", blurb: "Impossible leaps, rival schools, and honor-bound duels." },
  { value: "science-fantasy", label: "Science fantasy", blurb: "Lost technology, alien ruins, and magic mistaken for science." },
  { value: "sandbox", label: "Sandbox", blurb: "No rails. Go where you want, live with the consequences." },
];

export const TYPE_OPTIONS: { value: CampaignType; label: string; blurb: string }[] = [
  { value: "dungeon-crawl", label: "Dungeon crawl", blurb: "Room by room, torch by torch." },
  { value: "westward-march", label: "Westward march", blurb: "Frontier exploration and hex-by-hex discovery." },
  { value: "death-trap", label: "Death trap", blurb: "Lethal puzzles. Bring spare characters." },
  { value: "epic", label: "Epic", blurb: "Levels 21+ and problems the gods notice." },
  { value: "heroes", label: "Heroes", blurb: "Rise from nobodies to legends of the realm." },
  { value: "demon-lord", label: "Defeat the demon lord", blurb: "One great enemy, one long war." },
  { value: "apocalypse", label: "Apocalypse", blurb: "The world is ending. Slow it down or ride it out." },
  { value: "sandbox", label: "Sandbox", blurb: "No rails. Go where you want, live with it." },
];

export const LENGTH_OPTIONS: { value: CampaignLength; label: string }[] = [
  { value: "one-shot", label: "One-shot" },
  { value: "short", label: "Short arc (3–5 sessions)" },
  { value: "standard", label: "Standard campaign" },
  { value: "epic", label: "Open-ended epic" },
];

export const PACE_OPTIONS: { value: CampaignPace; label: string }[] = [
  { value: "slow", label: "Slow burn" },
  { value: "measured", label: "Measured" },
  { value: "brisk", label: "Brisk" },
  { value: "breakneck", label: "Breakneck" },
];

export const DM_STYLE_OPTIONS: { value: DmStyle; label: string; blurb: string }[] = [
  { value: "fair", label: "Fair referee", blurb: "Plays it straight, tells you the DCs." },
  { value: "cinematic", label: "Cinematic", blurb: "Rule of cool, big set pieces." },
  { value: "rules-lawyer", label: "Rules lawyer", blurb: "Every modifier cited, by the book." },
  { value: "brutal", label: "Brutal", blurb: "No punches pulled. Death is on the table." },
];

export function emptyCampaign(characterId: string): Campaign {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: "New campaign",
    characterId,
    styles: ["heroic"],
    type: "heroes",
    length: "standard",
    pace: "measured",
    dmStyle: "fair",
    allowEpic: false,
    worldName: "",
    worldSummary: "",
    houseRules: "",
    scene: {
      location: "A town at the edge of the map",
      region: "",
      timeOfDay: "morning",
      weather: "clear",
      inCombat: false,
      round: 0,
      summary: "The adventure has not started yet.",
    },
    npcs: [],
    party: [],
    quests: [],
    journal: [],
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}
