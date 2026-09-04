import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dices, Users, Swords, Globe2, Sparkles, ScrollText } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listCharacters } from "@/lib/storage";
import { computeCharacter } from "@/lib/rules/engine";
import { CLASS_BY_ID } from "@/lib/rules/classes";
import { RACE_BY_ID } from "@/lib/rules/races";
import type { Character } from "@/lib/rules/character";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Endless Codex — D&D 3.5 with an AI Dungeon Master" },
      {
        name: "description",
        content:
          "The Endless Codex is an AI Dungeon Master for D&D 3.5. Build rules-accurate characters, roll dice, explore tactical maps, and save campaigns.",
      },
      { property: "og:title", content: "The Endless Codex — D&D 3.5 with an AI Dungeon Master" },
      {
        property: "og:description",
        content:
          "Build a rules-accurate 3.5 character and play with The Endless Codex AI Dungeon Master. Free for solo play.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Users, title: "Full 3.5 character builder", text: "Every core class and race, computed derived stats, and plain-language explanations at every step." },
  { icon: Dices, title: "Dice that scale", text: "d4 through d100, sheet shortcuts, and honest 100d6 or 500d6 rolls with per-die results." },
  { icon: Sparkles, title: "AI Dungeon Master", text: "A referee that narrates, plays NPCs, sets DCs, grants rewards, and tracks your alignment." },
  { icon: Swords, title: "Tactical maps with height", text: "Isometric grids, multi-level dungeons, traps, and miniature-style tokens." },
  { icon: Globe2, title: "Worlds that persist", text: "Regions, settlements, factions, and a world map that remembers what you changed." },
  { icon: ScrollText, title: "Rules wiki built in", text: "Search the SRD without leaving the table, with your house rules shown inline." },
];

function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  useEffect(() => setCharacters(listCharacters()), []);

  return (
    <AppShell>
      <section className="mb-14 text-center">
        <img
          src={logoAsset.url}
          alt="The Endless Codex — an open tome beneath an infinite starfield"
          className="mx-auto w-full max-w-xl rounded-lg border border-border/60 shadow-2xl"
        />
        <p className="mt-8 text-xs uppercase tracking-[0.4em] text-primary">Third Edition · Revised</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
          The dungeon master never cancels
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Roll a rules-accurate 3.5 character, then sit down at a table that is always open. Free
          for solo play with The Endless Codex.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/characters/new">Create a character</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dice">Open the dice tray</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/upgrade">Get the Multiplayer Pass</Link>
          </Button>
        </div>
      </section>

      {characters.length > 0 ? (
        <section className="mb-14">
          <PageTitle title="Your characters" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.slice(0, 6).map((c) => {
              const d = computeCharacter(c);
              return (
                <Link key={c.id} to="/characters/$id" params={{ id: c.id }}>
                  <Card className="card-etched h-full bg-card/70 transition-colors hover:border-primary/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-lg">{c.name || "Unnamed"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {RACE_BY_ID[c.raceId]?.name} ·{" "}
                        {c.classes.map((cl) => `${CLASS_BY_ID[cl.classId]?.name} ${cl.levels}`).join(" / ")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">HP {d.hpMax}</Badge>
                        <Badge variant="secondary">AC {d.ac.total}</Badge>
                        <Badge variant="secondary">{c.alignment}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <PageTitle title="What's at the table" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="card-etched bg-card/60">
              <CardHeader className="pb-2">
                <Icon className="size-6 text-primary" />
                <CardTitle className="pt-2 font-display text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
