/**
 * Uniqueness levers for NPCs. The DM or builder pulls one of each so no two
 * people at the table converge on the same performance. Picks are
 * deterministic per NPC id, so an NPC stays the same person every scene.
 */

export const NPC_DRIVES = [
  "wants to be owed a favour by someone important",
  "is trying to buy back something their family lost",
  "needs to leave town before a name catches up with them",
  "is protecting a person they should have given up years ago",
  "wants proof that they were right all along",
  "is quietly saving for passage somewhere far away",
  "wants to be forgiven by someone who is already dead",
  "is competing with a rival nobody else takes seriously",
  "wants to be left alone and keeps getting pulled back in",
  "is paying off a debt in instalments they cannot afford",
  "wants an apprentice, badly, and will not say so",
  "is testing whether the gods are still listening",
];

export const NPC_FEARS = [
  "being found out as less skilled than their reputation",
  "the dark, specifically, and openly",
  "going back to where they came from",
  "their own temper",
  "debt collectors with legal standing",
  "being touched without warning",
  "outliving everyone again",
  "a particular family name",
  "water deeper than their waist",
  "being made to choose publicly",
  "losing their position to someone younger",
  "whatever it is they keep locked up",
];

export const NPC_SPEECH = [
  "answers questions with questions",
  "clips every sentence to four words or fewer",
  "over-explains, then apologises for over-explaining",
  "talks in trade terms even about feelings",
  "uses the player's name in every second sentence",
  "never uses contractions; sounds translated",
  "swears constantly and casually, never at people",
  "quotes scripture slightly wrong",
  "trails off and lets others finish",
  "repeats the last thing you said before replying",
  "speaks softly so people have to lean in",
  "laughs at the wrong moments",
];

export const NPC_BUSINESS = [
  "cleaning something that is already clean",
  "counting coin they keep losing track of",
  "eating, and not stopping to talk",
  "mending a strap with bad hands",
  "watching the door over your shoulder",
  "feeding an animal that clearly hates them",
  "writing, and covering the page",
  "sharpening a tool they never use",
  "packing, mid-argument with themselves",
  "holding a child who will not settle",
  "nursing an injury they are pretending is old",
  "waiting for someone who is late",
];

export const NPC_SECRETS = [
  "took money to look the other way once, and it cost lives",
  "is related to someone the party has already fought",
  "has been reporting on the neighbourhood for years",
  "is not who the town thinks they are, and the real one is buried nearby",
  "knows where a body is because they moved it",
  "carries an item they cannot get rid of",
  "is dying and has told nobody",
  "forged the documents everyone here relies on",
  "worships something the town would burn them for",
  "let someone take the blame for their mistake",
  "has a second family two days' ride away",
  "made a bargain and the payment is coming due",
];

function hash(input: string, salt: string): number {
  let h = 2166136261;
  const s = `${salt}:${input}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(list: string[], id: string, salt: string): string {
  return list[hash(id, salt) % list.length]!;
}

export interface NpcSparks {
  drive: string;
  fear: string;
  speech: string;
  business: string;
  secret: string;
}

/** Deterministic set of levers for one NPC — same id always gives the same person. */
export function npcSparks(npcId: string): NpcSparks {
  return {
    drive: pick(NPC_DRIVES, npcId, "drive"),
    fear: pick(NPC_FEARS, npcId, "fear"),
    speech: pick(NPC_SPEECH, npcId, "speech"),
    business: pick(NPC_BUSINESS, npcId, "busy"),
    secret: pick(NPC_SECRETS, npcId, "secret"),
  };
}

/** A directive the DM can drop into context when introducing an NPC. */
export function npcSeedDirective(npcId: string, name?: string): string {
  const s = npcSparks(npcId);
  const who = name?.trim() || "this NPC";
  return [
    `Play ${who} as a specific person, not a role.`,
    `They ${s.drive}. They are afraid of ${s.fear}.`,
    `In conversation they ${s.speech}.`,
    `When the scene opens they are ${s.business}.`,
    `Privately: they ${s.secret} — never state this outright; let it show only under pressure or over several meetings.`,
  ].join(" ");
}
