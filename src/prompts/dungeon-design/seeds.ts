/**
 * Randomised dungeon seeds. One directive per dungeon so every delve has a
 * different premise, shape and pressure. Picks are deterministic per id.
 */

type Flavour = "any" | "dark" | "grand" | "wilderness" | "urban" | "planar" | "whimsical";

interface DungeonSeed {
  id: string;
  label: string;
  flavours: Flavour[];
  text: (name: string, level: number) => string;
}

export const DUNGEON_SEEDS: DungeonSeed[] = [
  {
    id: "tomb-still-working",
    label: "The tomb still doing its job",
    flavours: ["any", "dark", "grand"],
    text: (n, l) =>
      `Design ${n} as a burial complex whose wards, guardians and tests are all still functioning exactly as built. Nothing here is malfunctioning — it is refusing. Target average party level ${l}. Include the builders' logic for each test and the one flaw they never fixed.`,
  },
  {
    id: "squatters",
    label: "Squatters in someone else's ruin",
    flavours: ["any", "wilderness", "urban"],
    text: (n, l) =>
      `Design ${n} as an old structure crudely occupied by a living warband who understand maybe half of it. Show their camp logic, their sentries, their latrines, and the sealed part of the place they are afraid to open. Target average party level ${l}.`,
  },
  {
    id: "flooded-levels",
    label: "Flooded from below",
    flavours: ["any", "dark", "wilderness"],
    text: (n, l) =>
      `Design ${n} as a multi-level dungeon whose lowest levels are underwater and rising. Movement, light and spellcasting all get harder as the party descends. Put the prize below the waterline. Target average party level ${l}.`,
  },
  {
    id: "working-mine",
    label: "A mine that hit something",
    flavours: ["any", "wilderness", "dark"],
    text: (n, l) =>
      `Design ${n} as a mine, mostly ordinary and industrial, where the deepest gallery broke into something that was not part of the geology. Keep the upper levels mundane and tense; make the break itself unmistakable. Target average party level ${l}.`,
  },
  {
    id: "prison-inverted",
    label: "A prison from the inside",
    flavours: ["any", "dark", "grand"],
    text: (n, l) =>
      `Design ${n} as a prison built to keep one thing in, not people out — so its defences face inward and the party is walking the wrong way through them. Target average party level ${l}. Make clear what happens if the party opens the last door.`,
  },
  {
    id: "living-temple",
    label: "A temple with a congregation",
    flavours: ["any", "urban", "dark"],
    text: (n, l) =>
      `Design ${n} as an active place of worship the party has no right to be in. Most inhabitants are not monsters and can be talked to, avoided, or fooled. Violence should be an option that costs the party something. Target average party level ${l}.`,
  },
  {
    id: "laboratory",
    label: "The experiment continues",
    flavours: ["any", "grand", "dark"],
    text: (n, l) =>
      `Design ${n} as a laboratory whose owner is long gone but whose work is still running unattended. Include specimens at different stages, notes that let clever players shut it down, and one result that got out. Target average party level ${l}.`,
  },
  {
    id: "vertical-shaft",
    label: "Straight down",
    flavours: ["any", "grand"],
    text: (n, l) =>
      `Design ${n} as a mostly vertical descent — a shaft, well, or cleft with chambers cut off it at intervals. Climbing gear, falling damage and rope are the real terrain. Target average party level ${l}.`,
  },
  {
    id: "under-the-city",
    label: "Under the city",
    flavours: ["urban", "any"],
    text: (n, l) =>
      `Design ${n} as an under-city network — sewers, cellars, older streets buried by newer ones — with multiple surface entrances controlled by different factions. Getting in is a negotiation; getting out is a chase. Target average party level ${l}.`,
  },
  {
    id: "planar-bleed",
    label: "Somewhere it leaks",
    flavours: ["planar", "any", "dark"],
    text: (n, l) =>
      `Design ${n} around a breach to another plane that has been reshaping the dungeon for years. Distance, gravity, light and time should misbehave more the closer the party gets. Target average party level ${l}.`,
  },
  {
    id: "clockwork-fortress",
    label: "It rearranges itself",
    flavours: ["any", "grand", "whimsical"],
    text: (n, l) =>
      `Design ${n} as a structure that physically reconfigures on a schedule the party can learn. Give me the cycle, the rooms it affects, the control the party can seize, and what it costs to hold it. Target average party level ${l}.`,
  },
  {
    id: "lair-with-territory",
    label: "A predator's territory",
    flavours: ["wilderness", "any", "dark"],
    text: (n, l) =>
      `Design ${n} as the lair of one dominant creature, with everything else in the place organised around avoiding it. Kill zones, its regular patrol, its hoard, and the scavengers living in the gaps. Target average party level ${l}.`,
  },
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function flavourTags(themes: string[]): Flavour[] {
  const tags = new Set<Flavour>(["any"]);
  for (const t of themes) {
    const s = t.toLowerCase();
    if (s.includes("grim") || s.includes("gothic") || s.includes("horror")) tags.add("dark");
    if (s.includes("mythic") || s.includes("epic") || s.includes("high fantasy")) tags.add("grand");
    if (s.includes("planar")) tags.add("planar");
    if (s.includes("fairytale")) tags.add("whimsical");
    if (s.includes("frontier") || s.includes("nautical")) tags.add("wilderness");
  }
  return [...tags];
}

/** Deterministically choose a dungeon premise. */
export function pickDungeonSeed(
  dungeonId: string,
  name: string,
  partyLevel = 1,
  themes: string[] = [],
): string {
  const tags = flavourTags(themes);
  const pool = DUNGEON_SEEDS.filter((s) => s.flavours.some((f) => tags.includes(f)));
  const list = pool.length ? pool : DUNGEON_SEEDS;
  return list[hash(dungeonId) % list.length]!.text(name || "this dungeon", Math.max(1, partyLevel));
}
