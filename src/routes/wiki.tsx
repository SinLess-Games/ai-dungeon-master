import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronRight, BookOpen, Shapes, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SKILLS } from "@/lib/rules/skills";
import { FEATS } from "@/lib/rules/feats";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { CLASS_DETAILS } from "@/lib/wiki/class-details";
import { babForClass, saveForClass } from "@/lib/rules/engine";
import { WEAPONS, ARMORS, SHIELDS, GEAR } from "@/lib/rules/equipment";
import { ABILITY_NAMES } from "@/lib/rules/types";
import type { WikiArticle } from "@/lib/wiki/dm-guide";
import { PLAYER_ARTICLES } from "@/lib/wiki/player-guide";

const ALL_ARTICLES: WikiArticle[] = [...PLAYER_ARTICLES];

export const Route = createFileRoute("/wiki")({
  head: () => ({
    meta: [
      { title: "Codex wiki — D&D 3.5 player rules reference" },
      {
        name: "description",
        content:
          "A full in-app player wiki: how the game works, character creation, combat and magic, plus searchable D&D 3.5 races, classes, skills, feats and gear.",
      },
      { property: "og:title", content: "Codex wiki — D&D 3.5 player rules reference" },
      {
        property: "og:description",
        content: "Browse player rules and every rules entry the character builder knows, without leaving the table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wiki,
});

/* ---------------------------------------------------------------- data --- */

interface RulesEntry {
  id: string;
  name: string;
  kind: string;
  text: string;
  tags: string[];
}

function buildRulesIndex(): RulesEntry[] {
  const out: RulesEntry[] = [];
  for (const r of RACES) {
    out.push({
      id: `race-${r.id}`,
      name: r.name,
      kind: "Races",
      text: `${r.blurb} ${r.traits.join(" ")}`,
      tags: [`${r.size}`, `${r.speed} ft.`, `Favored class: ${r.favoredClass}`],
    });
  }
  for (const c of CLASSES) {
    out.push({
      id: `class-${c.id}`,
      name: c.name,
      kind: "Classes",
      text: [
        c.blurb,
        c.playsLike,
        CLASS_DETAILS[c.id]?.role ?? "",
        ...(CLASS_DETAILS[c.id]?.sections.map((s) => `${s.heading} ${s.body}`) ?? []),
        ...c.features.map((f) => `${f.name} ${f.text}`),
      ].join(" "),
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
      kind: "Skills",
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
      kind: "Feats",
      text: f.benefit,
      tags: [f.type, ...(f.prereq ? [`Requires ${f.prereq}`] : [])],
    });
  }
  for (const w of WEAPONS) {
    out.push({
      id: `weapon-${w.id}`,
      name: w.name,
      kind: "Weapons",
      text: `${w.category} ${w.kind} weapon dealing ${w.damage} ${w.damageType.toLowerCase()} damage.`,
      tags: [`Crit ${w.critical}`, `${w.weight} lb`, `${w.cost} gp`, ...(w.range ? [`${w.range} ft. range`] : [])],
    });
  }
  for (const a of [...ARMORS, ...SHIELDS]) {
    if (a.acBonus === 0 && a.weight === 0) continue;
    out.push({
      id: `armor-${a.id}`,
      name: a.name,
      kind: a.type === "shield" ? "Shields" : "Armor",
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

const RULES_KINDS = ["Races", "Classes", "Skills", "Feats", "Weapons", "Armor", "Shields", "Gear"];

/* ------------------------------------------------------------ component --- */

type Selection =
  | { type: "article"; id: string }
  | { type: "entry"; id: string }
  | { type: "category"; name: string }
  | { type: "home" };

function Wiki() {
  const rules = useMemo(buildRulesIndex, []);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Selection>({ type: "home" });
  const paneRef = useRef<HTMLDivElement>(null);

  const group = (list: WikiArticle[]) => {
    const map = new Map<string, WikiArticle[]>();
    for (const a of list) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return [...map.entries()];
  };
  const playerCategories = useMemo(() => group(PLAYER_ARTICLES), []);

  const needle = q.trim().toLowerCase();
  const searching = needle.length > 0;

  const articleHits = useMemo(() => {
    if (!searching) return [];
    return ALL_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.summary.toLowerCase().includes(needle) ||
        a.tags.some((t) => t.includes(needle)) ||
        a.sections.some((s) => s.heading.toLowerCase().includes(needle) || s.body.toLowerCase().includes(needle)),
    );
  }, [needle, searching]);

  const entryHits = useMemo(() => {
    if (!searching) return [];
    return rules.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        e.text.toLowerCase().includes(needle) ||
        e.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }, [rules, needle, searching]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sel]);

  const article = sel.type === "article" ? ALL_ARTICLES.find((a) => a.id === sel.id) : undefined;
  const entry = sel.type === "entry" ? rules.find((e) => e.id === sel.id) : undefined;

  function open(next: Selection) {
    setQ("");
    setSel(next);
  }

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* ------------------------------------------------- sidebar --- */}
        <aside className="lg:sticky lg:top-44 lg:max-h-[calc(100vh-12rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <button
            onClick={() => open({ type: "home" })}
            className="mb-4 flex w-full items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-left font-display text-sm tracking-wide text-primary"
          >
            <BookOpen className="size-4" /> Codex wiki
          </button>

          <SidebarGroup label="Player rules" icon={<BookOpen className="size-4" />}>
            {playerCategories.map(([cat, arts]) => (
              <div key={cat} className="mb-3">
                <p className="mb-1 rounded bg-primary/10 px-2 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-primary">
                  {cat}
                </p>
                {arts.map((a) => (
                  <SidebarLink
                    key={a.id}
                    active={sel.type === "article" && sel.id === a.id}
                    onClick={() => open({ type: "article", id: a.id })}
                  >
                    {a.title}
                  </SidebarLink>
                ))}
              </div>
            ))}
          </SidebarGroup>

          <SidebarGroup label="Rules reference" icon={<Shapes className="size-4" />}>
            {RULES_KINDS.map((k) => (
              <SidebarLink
                key={k}
                active={sel.type === "category" && sel.name === k}
                onClick={() => open({ type: "category", name: k })}
              >
                {k}
                <span className="ml-auto text-xs text-muted-foreground">
                  {rules.filter((e) => e.kind === k).length}
                </span>
              </SidebarLink>
            ))}
          </SidebarGroup>
        </aside>

        {/* ---------------------------------------------------- main --- */}
        <div ref={paneRef} className="min-w-0">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the whole codex — encounter level, treasure, tumble, power attack…"
              className="pl-9 pr-9"
              aria-label="Search the wiki"
            />
            {q ? (
              <button
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {searching ? (
            <SearchResults
              needle={q}
              articles={articleHits}
              entries={entryHits}
              onOpenArticle={(id) => open({ type: "article", id })}
              onOpenEntry={(id) => open({ type: "entry", id })}
            />
          ) : article ? (
            <ArticleView article={article} />
          ) : entry ? (
            entry.kind === "Classes" ? (
              <ClassView classId={entry.id.replace(/^class-/, "")} onBack={() => open({ type: "category", name: "Classes" })} />
            ) : (
              <EntryView entry={entry} onBack={() => open({ type: "category", name: entry.kind })} />
            )
          ) : sel.type === "category" ? (
            <CategoryView
              kind={sel.name}
              entries={rules.filter((e) => e.kind === sel.name)}
              onOpen={(id) => open({ type: "entry", id })}
            />
          ) : (
            <HomeView
              playerCategories={playerCategories}
              rulesCount={rules.length}
              onOpenArticle={(id) => open({ type: "article", id })}
              onOpenCategory={(name) => open({ type: "category", name })}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* --------------------------------------------------------------- parts --- */

function SidebarGroup({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 py-2 font-display text-sm font-bold tracking-wide text-primary shadow-sm">
        {icon}
        {label}
      </h2>
      {children}
    </div>
  );
}

function SidebarLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Breadcrumb({ trail }: { trail: string[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {trail.map((t, i) => (
        <span key={t + i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" />}
          <span className={i === trail.length - 1 ? "text-primary" : undefined}>{t}</span>
        </span>
      ))}
    </nav>
  );
}

function ArticleView({ article }: { article: WikiArticle }) {
  return (
    <article className="max-w-3xl">
      <Breadcrumb trail={["Codex wiki", article.category]} />
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">{article.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{article.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {article.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs font-normal">
            {t}
          </Badge>
        ))}
      </div>
      <div className="rune-rule my-6" />

      {article.sections.length > 2 ? (
        <div className="mb-8 rounded-lg border border-border/60 bg-card/50 p-4">
          <p className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">On this page</p>
          <ul className="space-y-1 text-sm">
            {article.sections.map((s) => (
              <li key={s.heading}>
                <a
                  href={`#${slug(s.heading)}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {article.sections.map((s) => (
        <section key={s.heading} id={slug(s.heading)} className="mb-8 scroll-mt-44">
          <h2 className="mb-3 font-display text-xl text-primary">{s.heading}</h2>
          <Markdown text={s.body} className="text-[0.95rem] leading-relaxed text-foreground/90" />
        </section>
      ))}

      <p className="mt-10 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        Original summaries of d20/3.5 procedures and open SRD material, written for this table.
      </p>
    </article>
  );
}

const BAB_LABEL = { full: "Good (+1/level)", threeQuarter: "Average (+3/4 level)", half: "Poor (+1/2 level)" } as const;

function ClassView({ classId, onBack }: { classId: string; onBack: () => void }) {
  const cls = CLASSES.find((c) => c.id === classId);
  if (!cls) return null;
  const detail = CLASS_DETAILS[cls.id];
  const skillNames = cls.classSkills
    .map((id) => SKILLS.find((s) => s.id === id)?.name ?? id)
    .sort((a, b) => a.localeCompare(b));
  const levels = Array.from({ length: 20 }, (_, i) => i + 1);
  const featuresByLevel = new Map<number, string[]>();
  for (const f of cls.features) {
    if (!featuresByLevel.has(f.level)) featuresByLevel.set(f.level, []);
    featuresByLevel.get(f.level)!.push(f.name);
  }

  return (
    <article className="max-w-3xl">
      <Breadcrumb trail={["Codex wiki", "Rules reference", "Classes"]} />
      <h1 className="font-display text-3xl text-foreground">{cls.name}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{detail?.role ?? cls.blurb}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs font-normal">{`d${cls.hitDie} hit die`}</Badge>
        <Badge variant="outline" className="text-xs font-normal">{`${cls.skillPoints} + Int skill points`}</Badge>
        <Badge variant="outline" className="text-xs font-normal">{cls.casting ? cls.casting.label : "No spellcasting"}</Badge>
        {cls.alignmentRequirement ? (
          <Badge variant="outline" className="text-xs font-normal">{cls.alignmentRequirement}</Badge>
        ) : null}
      </div>

      <div className="rune-rule my-6" />

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl text-primary">Game rule information</h2>
        <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-card/50 p-4 text-sm sm:grid-cols-[10rem_1fr]">
          <Fact label="Key abilities" value={detail?.keyAbilities ?? "—"} />
          <Fact label="Alignment" value={cls.alignmentRequirement ?? "Any"} />
          <Fact label="Hit die" value={`d${cls.hitDie}`} />
          <Fact label="Skill points" value={`(${cls.skillPoints} + Int modifier) per level, x4 at 1st level`} />
          <Fact label="Base attack" value={BAB_LABEL[cls.bab]} />
          <Fact
            label="Saving throws"
            value={`Fort ${cls.saves.fort}, Ref ${cls.saves.ref}, Will ${cls.saves.will}`}
          />
          <Fact label="Proficiencies" value={detail?.proficiencies ?? "See class features."} />
          <Fact label="Starting gold" value={detail?.startingGold ?? "As your DM rules."} />
          {detail?.casting ? <Fact label="Spellcasting" value={detail.casting} /> : null}
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl text-primary">Class skills</h2>
        <p className="text-sm text-foreground/90">{skillNames.join(", ")}.</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl text-primary">Advancement</h2>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">Level</th>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">BAB</th>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">Fort</th>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">Ref</th>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">Will</th>
                <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wide">Special</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lv) => {
                const bab = babForClass(cls.bab, lv);
                const extra = [bab - 5, bab - 10, bab - 15].filter((b) => b >= 1);
                return (
                  <tr key={lv} className="border-t border-border/50">
                    <td className="px-3 py-1.5">{lv}</td>
                    <td className="px-3 py-1.5">+{[bab, ...extra].join("/+")}</td>
                    <td className="px-3 py-1.5">+{saveForClass(cls.saves.fort, lv)}</td>
                    <td className="px-3 py-1.5">+{saveForClass(cls.saves.ref, lv)}</td>
                    <td className="px-3 py-1.5">+{saveForClass(cls.saves.will, lv)}</td>
                    <td className="px-3 py-1.5 text-foreground/90">
                      {featuresByLevel.get(lv)?.join(", ") ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl text-primary">Class features</h2>
        <ul className="space-y-2 text-sm">
          {cls.features.map((f) => (
            <li key={`${f.level}-${f.name}`}>
              <span className="font-semibold text-foreground">
                {f.name} <span className="text-muted-foreground">({f.level}
                {f.level === 1 ? "st" : f.level === 2 ? "nd" : f.level === 3 ? "rd" : "th"} level)
                </span>
              </span>
              <span className="text-foreground/90"> — {f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {detail?.sections.map((s) => (
        <section key={s.heading} className="mb-8">
          <h2 className="mb-3 font-display text-xl text-primary">{s.heading}</h2>
          <Markdown text={s.body} className="text-[0.95rem] leading-relaxed text-foreground/90" />
        </section>
      ))}

      <section className="mb-2">
        <h2 className="mb-3 font-display text-xl text-primary">At the table</h2>
        <p className="text-sm text-foreground/90">{cls.playsLike}</p>
      </section>

      <button onClick={onBack} className="mt-8 text-sm text-primary underline-offset-2 hover:underline">
        ← Back to all classes
      </button>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-display text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground/90">{value}</dd>
    </>
  );
}

function EntryView({ entry, onBack }: { entry: RulesEntry; onBack: () => void }) {
  return (
    <article className="max-w-3xl">
      <Breadcrumb trail={["Codex wiki", "Rules reference", entry.kind]} />
      <h1 className="font-display text-3xl text-foreground">{entry.name}</h1>
      <div className="mt-3 flex flex-wrap gap-1">
        {entry.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs font-normal">
            {t}
          </Badge>
        ))}
      </div>
      <div className="rune-rule my-6" />
      <p className="text-[0.95rem] leading-relaxed text-foreground/90">{entry.text}</p>
      <button onClick={onBack} className="mt-8 text-sm text-primary underline-offset-2 hover:underline">
        ← Back to all {entry.kind.toLowerCase()}
      </button>
    </article>
  );
}

function CategoryView({
  kind,
  entries,
  onOpen,
}: {
  kind: string;
  entries: RulesEntry[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <Breadcrumb trail={["Codex wiki", "Rules reference", kind]} />
      <h1 className="font-display text-3xl text-foreground">{kind}</h1>
      <p className="mt-2 text-muted-foreground">{entries.length} entries</p>
      <div className="rune-rule my-6" />
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="rounded-lg border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
          >
            <span className="font-display text-base text-foreground">{e.name}</span>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchResults({
  needle,
  articles,
  entries,
  onOpenArticle,
  onOpenEntry,
}: {
  needle: string;
  articles: WikiArticle[];
  entries: RulesEntry[];
  onOpenArticle: (id: string) => void;
  onOpenEntry: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {articles.length + entries.length} results for “{needle}”
      </p>

      {articles.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg text-primary">Guides</h2>
          <div className="space-y-2">
            {articles.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpenArticle(a.id)}
                className="block w-full rounded-lg border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base">{a.title}</span>
                  <Badge variant="secondary">{a.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-primary">Rules reference</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {entries.slice(0, 120).map((e) => (
              <button
                key={e.id}
                onClick={() => onOpenEntry(e.id)}
                className="rounded-lg border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base">{e.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {e.kind}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.text}</p>
              </button>
            ))}
          </div>
          {entries.length > 120 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing the first 120 of {entries.length} — keep typing to narrow it down.
            </p>
          )}
        </section>
      )}

      {articles.length + entries.length === 0 && (
        <p className="text-muted-foreground">Nothing found. Try a shorter word.</p>
      )}
    </div>
  );
}

function CategoryCards({
  categories,
  onOpenArticle,
}: {
  categories: [string, WikiArticle[]][];
  onOpenArticle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map(([cat, arts]) => (
        <div key={cat} className="rounded-lg border border-border/60 bg-card/50 p-4">
          <p className="font-display text-sm uppercase tracking-[0.18em] text-muted-foreground">{cat}</p>
          <ul className="mt-2 space-y-1">
            {arts.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onOpenArticle(a.id)}
                  className="text-left text-sm text-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {a.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function HomeView({
  playerCategories,
  rulesCount,
  onOpenArticle,
  onOpenCategory,
}: {
  playerCategories: [string, WikiArticle[]][];
  rulesCount: number;
  onOpenArticle: (id: string) => void;
  onOpenCategory: (name: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">The Codex wiki</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {ALL_ARTICLES.length} guide articles and {rulesCount} rules entries — everything the character builder and
        the AI DM know, in one place.
      </p>
      <div className="rune-rule my-6" />

      <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-primary">
        <BookOpen className="size-5" /> Player rules
      </h2>
      <CategoryCards categories={playerCategories} onOpenArticle={onOpenArticle} />




      <h2 className="mb-3 mt-10 flex items-center gap-2 font-display text-xl text-primary">
        <Shapes className="size-5" /> Rules reference
      </h2>
      <div className="flex flex-wrap gap-2">
        {RULES_KINDS.map((k) => (
          <button
            key={k}
            onClick={() => onOpenCategory(k)}
            className="rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
