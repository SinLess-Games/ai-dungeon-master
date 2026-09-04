import type { Character } from "./rules/character";
import type { Campaign } from "./campaign";
import { computeCharacter, formatMod } from "./rules/engine";
import { CLASS_BY_ID } from "./rules/classes";
import { ALIGNMENTS } from "./rules/types";
import { STYLE_OPTIONS, TYPE_OPTIONS, DM_STYLE_OPTIONS } from "./campaign";
import { getParty, partyContext } from "./party";

function classLine(c: Character) {
  const track = (t: { classId: string; levels: number }[]) =>
    t.map((cl) => `${CLASS_BY_ID[cl.classId]?.name ?? cl.classId} ${cl.levels}`).join("/");
  const a = track(c.classes);
  const b = c.gestalt ? track(c.classesB ?? []) : "";
  return b ? `${a} // ${b} (gestalt)` : a;
}

/** The living game state handed to the DM on every turn. */
export function buildDmContext(character: Character, campaign: Campaign) {
  const d = computeCharacter(character);
  const skills = d.skills
    .filter((s) => s.ranks > 0 || !s.trainedOnly)
    .filter((s) => s.ranks > 0 || s.total !== 0)
    .map((s) => `${s.name} ${formatMod(s.total)}`)
    .join(", ");

  const align = ALIGNMENTS.find((a) => a.key === character.alignment)?.name ?? character.alignment;
  const styles = campaign.styles
    .map((s) => STYLE_OPTIONS.find((o) => o.value === s)?.label ?? s)
    .join(" / ");
  const type = TYPE_OPTIONS.find((s) => s.value === campaign.type)?.label;
  const dmStyle = DM_STYLE_OPTIONS.find((s) => s.value === campaign.dmStyle);

  return `CAMPAIGN
Name: ${campaign.name}
Style: ${styles} · Type: ${type} · Length: ${campaign.length} · Pace: ${campaign.pace}
DM style: ${dmStyle?.label} — ${dmStyle?.blurb}
Epic levels allowed: ${campaign.allowEpic ? "yes" : "no"}
World: ${campaign.worldName || "unnamed"} — ${campaign.worldSummary || "improvise a fitting world"}
House rules: ${campaign.houseRules || "none"}

CURRENT SCENE
Location: ${campaign.scene.location}${campaign.scene.region ? ` (${campaign.scene.region})` : ""}
Time: ${campaign.scene.timeOfDay} · Weather: ${campaign.scene.weather}
Combat: ${campaign.scene.inCombat ? `yes, round ${campaign.scene.round}` : "no"}
Situation: ${campaign.scene.summary}

PARTY ROSTER (run each companion marked as yours; never puppet the player's own characters)
${partyContext(getParty(campaign))}

KNOWN NPCS
${campaign.npcs.map((n) => `- ${n.name} (${n.role}, ${n.attitude}): ${n.notes}`).join("\n") || "- none yet"}

QUESTS
${campaign.quests.map((q) => `- [${q.status}] ${q.title}: ${q.detail}`).join("\n") || "- none yet"}

RECENT LOG
${campaign.journal.slice(0, 8).map((j) => `- ${j.text}`).join("\n") || "- nothing yet"}

PLAYER CHARACTER (authoritative, computed by the app's 3.5 rules engine)
${character.name || "Unnamed"} — ${d.race.name} ${classLine(character)} (ECL ${d.ecl}), ${align}${character.deity ? `, worships ${character.deity}` : ""}
Abilities: ${Object.entries(d.abilityScores).map(([k, v]) => `${k.toUpperCase()} ${v} (${formatMod(d.abilityMods[k as keyof typeof d.abilityMods])})`).join(", ")}
HP ${character.hp.current}/${d.hpMax}${character.hp.temp ? ` (+${character.hp.temp} temp)` : ""}${character.hp.nonlethal ? `, nonlethal ${character.hp.nonlethal}` : ""} · AC ${d.ac.total} (touch ${d.ac.touch}, flat-footed ${d.ac.flatFooted})
BAB ${formatMod(d.bab)} · Attacks ${d.attacks.map(formatMod).join("/")} · Melee ${formatMod(d.melee)} · Ranged ${formatMod(d.ranged)} · Grapple ${formatMod(d.grapple)}
Saves: Fort ${formatMod(d.saves.fort)}, Ref ${formatMod(d.saves.ref)}, Will ${formatMod(d.saves.will)} · Init ${formatMod(d.initiative)}
Speed: ${d.speeds.map((s) => `${s.mode} ${s.feet ?? "?"} ft.${s.note ? ` (${s.note})` : ""}`).join(", ")}
Feats: ${character.featIds.join(", ") || "none"}
Skills: ${skills || "none"}
Spells/powers known: ${[...character.spellIds, ...character.powerIds].join(", ") || "none"}
Conditions: ${character.conditions.join(", ") || "none"}
Carrying: ${character.inventory.filter((i) => i.location === "person").map((i) => `${i.quantity}× ${i.name}`).join(", ") || "nothing"} · Gold ${character.gold} gp
Load: ${d.load.category} (${d.load.carried} lb of ${d.load.heavy} lb max)${character.encumbranceEnabled ? "" : " [encumbrance rules OFF]"}
XP ${character.xp}
DM grants so far: ${character.grants.map((g) => `${g.kind} ${g.detail}`).join("; ") || "none"}

Use these exact numbers. When the player rolls, the app already adds their modifiers — the returned total is final.`;
}
