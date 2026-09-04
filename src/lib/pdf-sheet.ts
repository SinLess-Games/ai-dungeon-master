import type { Character } from "./rules/character";
import type { DerivedStats } from "./rules/engine";
import { formatMod } from "./rules/engine";
import { formatMovement } from "./rules/movement";
import { ABILITIES, ABILITY_NAMES } from "./rules/types";
import { CLASS_BY_ID } from "./rules/classes";
import { FEAT_BY_ID } from "./rules/feats";
import { ARMORS, SHIELDS, WEAPONS } from "./rules/equipment";
import { locationLabel } from "./loot";

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function classLine(c: Character) {
  const track = (list: { classId: string; levels: number }[]) =>
    list.map((cl) => `${CLASS_BY_ID[cl.classId]?.name ?? cl.classId} ${cl.levels}`).join(" / ");
  const a = track(c.classes);
  const b = c.gestalt ? track(c.classesB ?? []) : "";
  return b ? `${a} // ${b} (gestalt)` : a;
}

/** Build a print-ready, classic-layout character sheet as standalone HTML. */
export function buildSheetHtml(c: Character, d: DerivedStats): string {
  const armor = ARMORS.find((a) => a.id === c.armorId);
  const shield = SHIELDS.find((s) => s.id === c.shieldId);
  const weapons = WEAPONS.filter((w) => c.weaponIds.includes(w.id));
  const epic = d.level >= 21 || d.ecl >= 21;

  const abilityCells = ABILITIES.map(
    (a) => `<div class="box"><span class="lbl">${ABILITY_NAMES[a]}</span>
      <strong>${d.abilityScores[a]}</strong><span class="mod">${formatMod(d.abilityMods[a] ?? 0)}</span></div>`,
  ).join("");

  const skillRows = d.skills
    .filter((s) => s.ranks > 0 || s.isClassSkill)
    .map(
      (s) =>
        `<tr><td>${s.isClassSkill ? "•" : ""}</td><td>${esc(s.name)}</td><td>${s.ability.toUpperCase()}</td><td>${formatMod(s.total)}</td><td>${s.ranks}</td></tr>`,
    )
    .join("");

  const featRows = c.featIds
    .map((id) => FEAT_BY_ID[id])
    .filter(Boolean)
    .map((f) => `<li><strong>${esc(f!.name)}</strong> — ${esc(f!.benefit)}</li>`)
    .join("");

  const features = [...c.classes, ...(c.gestalt ? (c.classesB ?? []) : [])]
    .flatMap((cl) =>
      (CLASS_BY_ID[cl.classId]?.features ?? [])
        .filter((f) => f.level <= cl.levels)
        .map((f) => `<li><strong>${esc(f.name)}</strong> (lvl ${f.level}) — ${esc(f.text)}</li>`),
    )
    .join("");

  const lootSections = (["person", "stored", "party"] as const)
    .map((loc) => {
      const items = c.inventory.filter((i) => i.location === loc);
      if (items.length === 0) return "";
      return `<h4>${locationLabel(loc)}</h4><table class="grid"><thead><tr><th>Item</th><th>Qty</th><th>lb</th><th>gp</th><th>Notes</th></tr></thead><tbody>${items
        .map(
          (i) =>
            `<tr><td>${esc(i.name)}</td><td>${i.quantity}</td><td>${(i.weight * i.quantity).toFixed(1)}</td><td>${(i.cost * i.quantity).toFixed(1)}</td><td>${esc(i.container ?? i.note ?? "")}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    })
    .join("");

  const spells = [...c.spellIds, ...c.powerIds];

  const epicPage = epic
    ? `<section class="page">
        <h2>Epic progression</h2>
        <p>Character level ${d.level} · ECL ${d.ecl}${d.racialHd ? ` · racial HD ${d.racialHd}` : ""}${d.levelAdjustment ? ` · LA +${d.levelAdjustment}` : ""}</p>
        <p>Epic attack bonus and epic save bonus apply on top of the values on page 1.</p>
        <table class="grid"><thead><tr><th>Track</th><th>Value</th></tr></thead><tbody>
          <tr><td>Base attack</td><td>${formatMod(d.bab)}</td></tr>
          <tr><td>Fort / Ref / Will</td><td>${formatMod(d.saves.fort)} / ${formatMod(d.saves.ref)} / ${formatMod(d.saves.will)}</td></tr>
          <tr><td>Max ranks (class / cross-class)</td><td>${d.maxRanks.classSkill} / ${d.maxRanks.crossClass}</td></tr>
          <tr><td>Feat slots</td><td>${d.featSlots}</td></tr>
        </tbody></table>
        <h3>Notes</h3><div class="notes">${esc(c.notes || "")}</div>
      </section>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(c.name || "Character")} — The Endless Codex</title>
<style>
  @page { size: letter; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #15181f; margin: 0; }
  h1 { font-size: 22pt; margin: 0 0 2mm; letter-spacing: .5px; }
  h2 { font-size: 13pt; border-bottom: 1.5pt solid #b8892b; padding-bottom: 1mm; margin: 6mm 0 3mm; }
  h3 { font-size: 11pt; margin: 4mm 0 2mm; }
  h4 { font-size: 10pt; margin: 3mm 0 1mm; }
  .sub { color: #4a4f5c; font-size: 10pt; margin: 0 0 4mm; }
  .row { display: flex; gap: 4mm; flex-wrap: wrap; }
  .box { border: 1pt solid #b8892b; border-radius: 2mm; padding: 2mm 3mm; min-width: 26mm; text-align: center; }
  .box .lbl { display: block; font-size: 7pt; text-transform: uppercase; letter-spacing: .8px; color: #6b7280; }
  .box strong { font-size: 15pt; display: block; }
  .box .mod { font-size: 9pt; color: #8a6a1f; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 9pt; }
  table.grid th, table.grid td { border: .5pt solid #9aa0ad; padding: 1mm 2mm; text-align: left; }
  table.grid th { background: #f0ece2; }
  ul { margin: 0; padding-left: 5mm; font-size: 9pt; }
  li { margin-bottom: 1mm; }
  .cols2 { column-count: 2; column-gap: 8mm; }
  .notes { border: .5pt solid #9aa0ad; min-height: 25mm; padding: 2mm; font-size: 9pt; white-space: pre-wrap; }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }
  @media print { .noprint { display: none; } }
  .noprint { margin-bottom: 6mm; font-family: system-ui, sans-serif; }
  .noprint button { font: inherit; padding: 6px 14px; background: #17203a; color: #f4d68a; border: 1px solid #b8892b; border-radius: 6px; cursor: pointer; }
</style></head><body>
<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>

<section class="page">
  <h1>${esc(c.name || "Unnamed Adventurer")}</h1>
  <p class="sub">${esc(d.race.name)} · ${esc(classLine(c))} · ${esc(c.alignment)}${c.deity ? ` · ${esc(c.deity)}` : ""} · ECL ${d.ecl} · XP ${c.xp}</p>

  <div class="row">${abilityCells}</div>

  <h2>Combat</h2>
  <div class="row">
    <div class="box"><span class="lbl">HP</span><strong>${c.hp.current}/${d.hpMax}</strong><span class="mod">temp ${c.hp.temp}</span></div>
    <div class="box"><span class="lbl">AC</span><strong>${d.ac.total}</strong><span class="mod">touch ${d.ac.touch} · ff ${d.ac.flatFooted}</span></div>
    <div class="box"><span class="lbl">Init</span><strong>${formatMod(d.initiative)}</strong></div>
    <div class="box"><span class="lbl">Fort</span><strong>${formatMod(d.saves.fort)}</strong></div>
    <div class="box"><span class="lbl">Ref</span><strong>${formatMod(d.saves.ref)}</strong></div>
    <div class="box"><span class="lbl">Will</span><strong>${formatMod(d.saves.will)}</strong></div>
    <div class="box"><span class="lbl">BAB</span><strong>${d.attacks.map(formatMod).join("/")}</strong></div>
    <div class="box"><span class="lbl">Grapple</span><strong>${formatMod(d.grapple)}</strong></div>
  </div>
  <p class="sub">Speed: ${d.speeds.map((m) => esc(formatMovement(m))).join(" · ")}</p>

  <h3>Weapons</h3>
  <table class="grid"><thead><tr><th>Weapon</th><th>Attack</th><th>Damage</th><th>Critical</th><th>Range</th></tr></thead><tbody>
  ${
    weapons.length
      ? weapons
          .map(
            (w) =>
              `<tr><td>${esc(w.name)}</td><td>${formatMod(w.range ? d.ranged : d.melee)}</td><td>${esc(w.damage)}</td><td>${esc(w.critical)}</td><td>${w.range ? `${w.range} ft.` : "—"}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="5">Unarmed / none recorded</td></tr>`
  }
  </tbody></table>
  <p class="sub">Armor: ${esc(armor?.name ?? "None")} · Shield: ${esc(shield?.name ?? "None")} · Armor check ${formatMod(-Math.abs(d.armorCheckPenalty))} · Spell failure ${d.spellFailure}%</p>

  <h2>Skills</h2>
  <table class="grid"><thead><tr><th>C</th><th>Skill</th><th>Ability</th><th>Total</th><th>Ranks</th></tr></thead><tbody>${skillRows}</tbody></table>
</section>

<section class="page">
  <h2>Feats</h2>
  <ul class="cols2">${featRows || "<li>None</li>"}</ul>
  <h2>Class features</h2>
  <ul class="cols2">${features || "<li>None</li>"}</ul>
  <h2>Equipment &amp; loot</h2>
  <p class="sub">Gold ${c.gold} gp · carrying ${d.load.carried} lb (${d.load.category} load; light ≤ ${d.load.light}, medium ≤ ${d.load.medium}, heavy ≤ ${d.load.heavy})</p>
  ${lootSections || "<p class='sub'>No items recorded.</p>"}
</section>

<section class="page">
  <h2>Spells &amp; powers</h2>
  ${d.casting ? `<p class="sub">${esc(d.casting.label)} · save DC base ${d.casting.dcBase}</p>` : ""}
  <ul class="cols2">${spells.length ? spells.map((s) => `<li>${esc(s.replace(/-/g, " "))}</li>`).join("") : "<li>None recorded</li>"}</ul>
  <h3>Prepared / expended</h3>
  <div class="notes"> </div>
  <h2>Notes</h2>
  <div class="notes">${esc(c.notes || "")}</div>
</section>
${epicPage}
</body></html>`;
}

/** Open the printable sheet in a new tab so the browser can save it as PDF. */
export function exportCharacterPdf(c: Character, d: DerivedStats) {
  const html = buildSheetHtml(c, d);
  const win = window.open("", "_blank");
  if (!win) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}
