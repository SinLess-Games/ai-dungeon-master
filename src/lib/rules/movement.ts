import type { Race } from "./types";

export interface MovementMode {
  mode: string;
  /** Speed in feet; null when the source only describes it relatively. */
  feet: number | null;
  note?: string;
  detail?: string;
}

const MODES = ["fly", "swim", "climb", "burrow", "glide", "land"] as const;

function titled(mode: string) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

/**
 * Race speeds live inside the racial trait text (e.g. "Swim 50 ft.",
 * "Bat wings: fly 60 ft. (good)"). Parse them out so the sheet can show
 * every form of movement, not just the base land speed.
 */
export function movementModes(race: Race, landSpeed: number): MovementMode[] {
  const out: MovementMode[] = [{ mode: "Land", feet: landSpeed }];
  const seen = new Set(["land"]);

  for (const trait of race.traits ?? []) {
    for (const mode of MODES) {
      if (mode === "land") continue;
      const re = new RegExp(
        `${mode}(?:ing)?(?:\\s+(?:speed|at))?\\s*(?:speed\\s*)?(\\d+)\\s*(?:ft|feet)`,
        "i",
      );
      const rel = new RegExp(`${mode}(?:\\s+at)?\\s+(twice|three times|half)\\s+your base speed`, "i");
      let feet: number | null = null;
      let note: string | undefined;
      const m = trait.match(re);
      const r = trait.match(rel);
      if (m) {
        feet = Number(m[1]);
      } else if (r) {
        const factor = r[1]!.toLowerCase();
        feet = factor === "twice" ? landSpeed * 2 : factor === "three times" ? landSpeed * 3 : Math.floor(landSpeed / 2);
        note = `${factor} base speed`;
      } else {
        continue;
      }
      if (seen.has(mode)) continue;
      seen.add(mode);
      const man = trait.match(/\((perfect|good|average|poor|clumsy)[^)]*\)/i);
      const entry: MovementMode = { mode: titled(mode), feet };
      if (note) entry.note = note;
      if (man) entry.detail = `${man[1]!.toLowerCase()} maneuverability`;
      out.push(entry);
    }
  }
  return out;
}

export function formatMovement(m: MovementMode): string {
  const base = m.feet == null ? m.mode : `${m.mode} ${m.feet} ft.`;
  const extras = [m.note, m.detail].filter(Boolean).join(", ");
  return extras ? `${base} (${extras})` : base;
}
