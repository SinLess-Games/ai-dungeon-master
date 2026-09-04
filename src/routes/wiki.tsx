import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SKILLS } from "@/lib/rules/skills";
import { FEATS } from "@/lib/rules/feats";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { WEAPONS, ARMORS, SHIELDS, GEAR } from "@/lib/rules/equipment";
import { ABILITY_NAMES } from "@/lib/rules/types";

export const Route = createFileRoute("/wiki")({
  head: () => ({
    meta: [
      { title: "Rules wiki — The Endless Codex" },
      {
        name: "description",
        content:
          "Search D&D 3.5 races, classes, skills, feats, weapons, armor, and gear without leaving the table.",
      },
      { property: "og:title", content: "Rules wiki — The Endless Codex" },
      { property: "og:description", content: "An in-app searchable reference for the 3.5 rules you use at the table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wiki,
});

interface Entry {
  id: string;
  name: string;
  kind: string;
  text: string;
  tags: string[];
}

function buildIndex(): Entry[] {
  const out: Entry[] = [];
  for (const r of RACES) {
    out.push({
      id: `race-${r.id}`,
      name: r.name,
      kind: "Race",
      text: `${r.blurb} ${r.traits.join(" ")}`,
      tags: [`${r.size}`, `${r.speed} ft.`, `Favored class: ${r.favoredClass}`],
    });
  }
  for (const c of CLASSES) {
    out.push({
      id: `class-${c.id}`,
      name: c.name,
      kind: "Class",
      text: `${c.blurb} ${c.playsLike}`,
      tags: [
        `d${c.hitDie} hit die`,
        `${c.skillPoints}+Int skill points`,
        c.casting ? c.casting.label : "No spellcasting",
        ...(c.alignmentRequirement ? [c.alignmentRequirement] : []),
      ],
    });
  }
  for (const s of SKILLS) {
    out.push({
      id: `skill-${s.id}`,
      name: s.name,
      kind: "Skill",
      text: s.explain,
      tags: [
        ABILITY_NAMES[s.ability],
        ...(s.trainedOnly ? ["Trained only"] : []),
        ...(s.armorCheckPenalty ? ["Armor check penalty"] : []),
      ],
    });
  }
  for (const f of FEATS) {
    out.push({
      id: `feat-${f.id}`,
      name: f.name,
      kind: "Feat",
      text: f.benefit,
      tags: [f.type, ...(f.prereq ? [`Requires ${f.prereq}`] : [])],
    });
  }
  for (const w of WEAPONS) {
    out.push({
      id: `weapon-${w.id}`,
      name: w.name,
      kind: "Weapon",
      text: `${w.category} ${w.kind} weapon dealing ${w.damage} ${w.damageType.toLowerCase()} damage.`,
      tags: [`Crit ${w.critical}`, `${w.weight} lb`, `${w.cost} gp`, ...(w.range ? [`${w.range} ft. range`] : [])],
    });
  }
  for (const a of [...ARMORS, ...SHIELDS]) {
    if (a.acBonus === 0 && a.weight === 0) continue;
    out.push({
      id: `armor-${a.id}`,
      name: a.name,
      kind: a.type === "shield" ? "Shield" : "Armor",
      text: `Grants +${a.acBonus} to Armor Class.`,
      tags: [
        `Max Dex ${a.maxDex ?? "—"}`,
        `Check penalty ${a.checkPenalty}`,
        `${a.spellFailure}% arcane failure`,
        `${a.weight} lb`,
      ],
    });
  }
  for (const g of GEAR) {
    out.push({
      id: `gear-${g.id}`,
      name: g.name,
      kind: "Gear",
      text: g.note ?? "Adventuring equipment.",
      tags: [`${g.weight} lb`, `${g.cost} gp`],
    });
  }
  return out;
}

const KINDS = ["All", "Race", "Class", "Skill", "Feat", "Weapon", "Armor", "Shield", "Gear"];

function Wiki() {
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("All");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return index.filter(
      (e) =>
        (kind === "All" || e.kind === kind) &&
        (!needle ||
          e.name.toLowerCase().includes(needle) ||
          e.text.toLowerCase().includes(needle) ||
          e.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [index, q, kind]);

  return (
    <AppShell>
      <PageTitle
        title="Rules wiki"
        subtitle="Everything the character builder knows, searchable. Drawn from the open d20 System Reference Document."
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rules, e.g. tumble, power attack, chain shirt"
            className="pl-9"
            aria-label="Search the rules"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                kind === k ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{results.length} entries</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((e) => (
          <Card key={e.id} className="card-etched bg-card/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg">{e.name}</h2>
                <Badge variant="secondary">{e.kind}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{e.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
