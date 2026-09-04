import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorldMapView } from "@/components/WorldMapView";
import { deleteWorld, listWorlds, newId, saveWorld } from "@/lib/storage";
import { WORLD_THEMES, emptyWorld, type World } from "@/lib/world";
import { starterWorld } from "@/lib/world-generator";

export const Route = createFileRoute("/worlds/")({
  head: () => ({
    meta: [
      { title: "World builder | The Endless Codex" },
      {
        name: "description",
        content:
          "Build D&D 3.5 campaign worlds: regions, cities, dungeons, factions, pantheons and an interactive overland map.",
      },
      { property: "og:title", content: "World builder | The Endless Codex" },
      {
        property: "og:description",
        content: "Create worlds with regions, settlements, dungeons, factions and an overland map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorldsPage,
});

function WorldsPage() {
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [seed, setSeed] = useState(true);

  useEffect(() => {
    const sync = () => setWorlds(listWorlds());
    sync();
    window.addEventListener("dnd35:store-changed", sync);
    return () => window.removeEventListener("dnd35:store-changed", sync);
  }, []);

  function create() {
    const id = newId();
    const base = seed ? starterWorld(id, name.trim() || "New world", themes) : emptyWorld(id, name.trim() || "New world");
    base.themes = themes;
    if (tagline.trim()) base.tagline = tagline.trim();
    saveWorld(base);
    navigate({ to: "/worlds/$worldId", params: { worldId: id } });
  }

  return (
    <AppShell>
      <PageTitle
        title="Worlds"
        subtitle="Forge the setting first: regions, roads, cities, dungeons, gods and factions. Campaigns and tactical maps hang off a world."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-foreground">Your worlds</h2>
          {worlds.length === 0 ? (
            <Card className="card-etched bg-card/70">
              <CardContent className="py-10 text-center text-muted-foreground">
                No worlds yet. Create one to the right — the generator lays down regions, a capital
                and a starter dungeon you can rewrite freely.
              </CardContent>
            </Card>
          ) : null}

          {worlds.map((w) => (
            <Card key={w.id} className="card-etched bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-display text-2xl">{w.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{w.tagline ?? "An unwritten world."}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.themes.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild size="sm">
                    <Link to="/worlds/$worldId" params={{ worldId: w.id }}>
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Delete ${w.name} and its maps?`)) {
                        deleteWorld(w.id);
                        setWorlds(listWorlds());
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <WorldMapView world={w} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {w.regions.length} regions · {w.sites.length} sites · {w.factions.length} factions
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-foreground">Create a world</h2>
          <Card className="card-etched h-fit bg-card/70">
          <CardHeader>
            <CardTitle className="font-display text-xl">New world</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wname">Name</Label>
              <Input id="wname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ashen Reach" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wtag">Tagline</Label>
              <Textarea
                id="wtag"
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A drowned empire, and the gods who let it sink."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Themes</Label>
              <div className="flex flex-wrap gap-1.5">
                {WORLD_THEMES.map((t) => {
                  const on = themes.includes(t);
                  return (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={on ? "default" : "outline"}
                      onClick={() =>
                        setThemes(on ? themes.filter((x) => x !== t) : [...themes, t].slice(0, 4))
                      }
                    >
                      {t}
                    </Button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={seed} onChange={(e) => setSeed(e.target.checked)} />
              Seed regions, a capital and a starter dungeon
            </label>
            <Button className="w-full" onClick={create}>
              Create world
            </Button>
          </CardContent>
        </Card>
        </section>
      </div>
    </AppShell>
  );
}
