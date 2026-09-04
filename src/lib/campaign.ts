import { newId } from "./storage";

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
  worldName: string;
  worldSummary: string;
  houseRules: string;
  scene: SceneState;
  npcs: CampaignNpc[];
  quests: QuestEntry[];
  journal: { id: string; at: string; text: string }[];
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

export const STYLE_OPTIONS: { value: CampaignStyle; label: string; blurb: string }[] = [
  { value: "heroic", label: "Heroic", blurb: "Bold deeds, clear villains, earned victories." },
  { value: "gritty", label: "Gritty", blurb: "Scarce resources, real consequences, dirty fights." },
  { value: "high-fantasy", label: "High fantasy", blurb: "Wonders, archmages, and world-shaking stakes." },
  { value: "horror", label: "Horror", blurb: "Dread, corruption, and things best left buried." },
  { value: "intrigue", label: "Intrigue", blurb: "Courts, spies, and knives behind smiles." },
  { value: "comedic", label: "Comedic", blurb: "Light-hearted chaos with real rules underneath." },
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
    quests: [],
    journal: [],
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}
