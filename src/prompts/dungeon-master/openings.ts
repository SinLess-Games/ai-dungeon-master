import type { Campaign, CampaignStyle, CampaignType } from "@/lib/campaign";

/**
 * Randomised campaign openings. The DM always narrates the first scene, but the
 * *kind* of first scene varies: some campaigns open mid-crisis, others on a
 * quiet arrival with something wrong underneath. The pick is deterministic per
 * campaign so reopening the table never restarts the story differently.
 */

type Mood = "any" | "dark" | "whimsical" | "dungeon" | "wilderness" | "urban" | "grand";

interface Opening {
  id: string;
  /** Moods this opening fits. "any" openings are the fallback pool. */
  moods: Mood[];
  /** Moods this opening must never be used for. */
  avoid?: Mood[];
  /** The directive sent to the DM. `place` is the campaign's starting location. */
  text: (place: string) => string;
}

const OPENINGS: Opening[] = [
  {
    id: "cold-open-crisis",
    moods: ["any", "dark", "urban", "grand"],
    text: (p) =>
      `Begin the campaign with a cold open: I am already in the middle of trouble in ${p} — no travel, no preamble, no explanation of how I got here. Something is going wrong right now, in this first sentence. Ground me in the place through what I can see, hear, and smell while it happens, then hand me the very next decision.`,
  },
  {
    id: "quiet-wrongness",
    moods: ["any", "dark", "urban", "wilderness"],
    text: (p) =>
      `Begin the campaign quietly. I arrive in ${p} on an ordinary day and nothing is obviously wrong — except for one small detail that does not fit, and that nobody local seems willing to mention. Let me notice it without telling me what it means, then leave me free to poke at it or ignore it.`,
  },
  {
    id: "stranger-knows-me",
    moods: ["any", "urban", "dark"],
    text: (p) =>
      `Begin the campaign with a stranger in ${p} who already knows my name and has clearly been waiting for me. Do not explain how. Give them a want, a nervous habit, and something in their hands. End with what they ask of me — an ask I am free to refuse.`,
  },
  {
    id: "aftermath",
    moods: ["any", "dark", "wilderness", "urban"],
    text: (p) =>
      `Begin the campaign in the aftermath of something I did not witness. I come upon the scene in or near ${p}: the damage is fresh, the people are still reacting, and the questions are obvious. Let me choose whether to help, investigate, or walk away.`,
  },
  {
    id: "job-offer",
    moods: ["any", "urban", "dungeon"],
    text: (p) =>
      `Begin the campaign with work being offered in ${p}: a room, a table, a person with coin and a problem. Make the offer concrete — the pay, the risk, the part they are not saying — and make it genuinely refusable. Let me haggle, pry, or leave.`,
  },
  {
    id: "wake-unknown",
    moods: ["any", "dark", "dungeon"],
    text: (p) =>
      `Begin the campaign with me waking somewhere I do not recognise, close to ${p}, missing a piece of the last day. Tell me exactly what my senses report and what is and is not still on my person. Do not explain the gap — let me start closing it.`,
  },
  {
    id: "crowd-parts",
    moods: ["any", "urban", "grand"],
    text: (p) =>
      `Begin the campaign in a crowd in ${p} that is parting around one thing: a body, a herald, a beast, a spectacle. Give me the noise and press of the people first, then the thing itself, then the moment where somebody looks to me.`,
  },
  {
    id: "journey-interrupted",
    moods: ["any", "wilderness", "dark"],
    text: (p) =>
      `Begin the campaign on the road, close enough to ${p} to see it, with the journey interrupted — a blocked way, a wrecked cart, a sound that stops the birds. Set the weather and the light hard, then let the interruption make its first move.`,
  },
  {
    id: "threshold",
    moods: ["dungeon", "wilderness", "dark"],
    text: (p) =>
      `Begin the campaign at a threshold: I am standing at the entrance below or beyond ${p}, torch lit, decision already made. Describe the mouth of the place, the air coming out of it, and the last piece of daylight, then give me the first choice inside.`,
  },
  {
    id: "last-warning",
    moods: ["dark", "dungeon", "grand"],
    text: (p) =>
      `Begin the campaign with a warning I am about to ignore. Someone in ${p} tells me plainly not to do the thing I came here to do, and gives one specific, believable reason. Make them right in a way I cannot yet verify, then leave the door open anyway.`,
  },
  {
    id: "small-kindness",
    moods: ["whimsical", "urban", "wilderness"],
    text: (p) =>
      `Begin the campaign with a small, strange kindness in ${p}: someone or something helps me for no visible reason, and the help is odd enough to be worth asking about. Keep the tone warm and slightly off-kilter, and end with the thread I can pull.`,
  },
  {
    id: "bargain-offered",
    moods: ["whimsical", "dark", "grand"],
    text: (p) =>
      `Begin the campaign with a bargain offered in ${p} by something that should not be talking to me. State its terms clearly and its price vaguely. Do not let me accept or refuse in the narration — end on the offer hanging in the air.`,
  },
  {
    id: "omen",
    moods: ["grand", "dark", "wilderness"],
    text: (p) =>
      `Begin the campaign with an omen witnessed from ${p}: something in the sky, the ground, or the water that everyone sees and nobody can explain. Show me how the locals react — prayer, panic, profit — and end with the first consequence reaching me personally.`,
  },
  {
    id: "chase-already-running",
    moods: ["any", "urban", "whimsical"],
    text: (p) =>
      `Begin the campaign with me already running through ${p}, and someone running after me. Do not explain why yet. Give me three turns of terrain to work with in the first paragraph, then make me choose a direction.`,
  },
];

const STYLE_MOODS: Record<CampaignStyle, Mood[]> = {
  heroic: ["grand", "urban", "wilderness"],
  "high-magic": ["grand", "urban", "whimsical"],
  "grim-dark": ["dark"],
  "steampunk-magitech": ["urban", "grand"],
  "high-fantasy": ["grand", "wilderness"],
  steampunk: ["urban", "grand"],
  "magi-tech": ["urban", "grand"],
  "low-fantasy": ["wilderness", "urban", "dark"],
  "sword-and-sorcery": ["dark", "dungeon", "urban"],
  "mythic-epic": ["grand"],
  "gothic-horror": ["dark"],
  "cosmic-horror": ["dark"],
  "political-intrigue": ["urban"],
  "dungeon-delving": ["dungeon"],
  "wilderness-exploration": ["wilderness"],
  "nautical-pirate": ["wilderness", "grand"],
  "planar-adventure": ["grand", "whimsical"],
  "post-apocalyptic": ["dark", "wilderness"],
  "fairytale-whimsy": ["whimsical"],
  "noir-mystery": ["urban", "dark"],
  "wuxia-martial": ["grand", "wilderness"],
  "science-fantasy": ["grand", "whimsical"],
  sandbox: ["any"],
};

const TYPE_MOODS: Record<CampaignType, Mood[]> = {
  "dungeon-crawl": ["dungeon"],
  "westward-march": ["wilderness"],
  "death-trap": ["dungeon", "dark"],
  epic: ["grand"],
  heroes: ["urban", "grand"],
  "demon-lord": ["dark", "grand"],
  apocalypse: ["dark", "grand"],
  sandbox: ["any"],
};

/** Moods that must not be mixed: horror games never get whimsy, and vice versa. */
function forbiddenMoods(moods: Mood[]): Mood[] {
  const out: Mood[] = [];
  if (moods.includes("dark") && !moods.includes("whimsical")) out.push("whimsical");
  if (moods.includes("whimsical") && !moods.includes("dark")) out.push("dark");
  return out;
}

function campaignMoods(campaign: Campaign): Mood[] {
  const moods = new Set<Mood>();
  for (const s of campaign.styles) for (const m of STYLE_MOODS[s] ?? []) moods.add(m);
  for (const m of TYPE_MOODS[campaign.type] ?? []) moods.add(m);
  return [...moods];
}

/** Stable small hash so a campaign always gets the same opening. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** The opening directive for this campaign: varied, but fixed once chosen. */
export function pickOpening(campaign: Campaign): string {
  const moods = campaignMoods(campaign);
  const banned = forbiddenMoods(moods);

  const allowed = OPENINGS.filter((o) => !o.moods.some((m) => banned.includes(m)));
  const matching = allowed.filter((o) => o.moods.some((m) => moods.includes(m)));
  const pool = matching.length > 0 ? matching : allowed.filter((o) => o.moods.includes("any"));
  const finalPool = pool.length > 0 ? pool : OPENINGS;

  const place = campaign.scene.location?.trim() || campaign.worldName?.trim() || "wherever I am";
  const chosen = finalPool[hash(campaign.id) % finalPool.length]!;

  return `${chosen.text(place)}\n\nEstablish the scene the way a good first session does, then stop and let me act. Do not decide anything for my character.`;
}
