import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldMapView } from "@/components/WorldMapView";
import { PaintMapButton, useMapArt } from "@/components/MapArtControls";
import { getWorld, listMaps, newId, saveMap, saveWorld } from "@/lib/storage";
import {
  SITE_KINDS,
  TERRAIN_KINDS,
  regionAt,
  travelDays,
  worldDistance,
  type SiteKind,
  type TerrainKind,
  type World,
  type WorldSite,
} from "@/lib/world";
import { emptyMap, type MapKind } from "@/lib/tacticalmap";

export const Route = createFileRoute("/worlds/$worldId")({
  head: () => ({
    meta: [
      { title: "World map | The Endless Codex" },
      {
        name: "description",
        content:
          "Edit regions, settlements, dungeons, roads, factions and history, and move your party across the overland map.",
      },
      { property: "og:title", content: "World map | The Endless Codex" },
      {
        property: "og:description",
        content: "Overland map editing, travel time, sites and factions for your D&D 3.5 world.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorldDetail,
});

type Tool = "select" | "site" | "region" | "party";

function WorldDetail() {
  const { worldId } = Route.useParams();
  const navigate = useNavigate();
  const [world, setWorld] = useState<World | undefined>();
  const [tool, setTool] = useState<Tool>("select");
  const [siteKind, setSiteKind] = useState<SiteKind>("town");
  const [terrain, setTerrain] = useState<TerrainKind>("plains");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  useEffect(() => {
    setWorld(getWorld(worldId));
  }, [worldId]);

  const maps = useMemo(() => listMaps(worldId), [worldId, world?.updatedAt]);

  if (!world) {
    return (
      <AppShell>
        <PageTitle title="World not found" subtitle="This world is not in your library." />
        <Button asChild>
          <Link to="/worlds">Back to worlds</Link>
        </Button>
      </AppShell>
    );
  }

  function update(mutate: (w: World) => void) {
    setWorld((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutate(next);
      return saveWorld(next);
    });
  }

  function handleMapClick(x: number, y: number) {
    if (tool === "site") {
      const id = newId();
      update((w) => {
        w.sites.push({
          id,
          name: `New ${siteKind}`,
          kind: siteKind,
          x,
          y,
          discovered: true,
          ...(regionAt(w, x, y)?.id ? { regionId: regionAt(w, x, y)!.id } : {}),
        });
      });
      setSelectedSiteId(id);
      setTool("select");
    } else if (tool === "region") {
      update((w) => {
        w.regions.push({
          id: newId(),
          name: "New region",
          terrain,
          x: Math.max(0, x - 12),
          y: Math.max(0, y - 10),
          w: 24,
          h: 20,
        });
      });
      setTool("select");
    } else if (tool === "party") {
      update((w) => {
        w.party = { x, y };
      });
      setTool("select");
    }
  }

  const selectedSite = world.sites.find((s) => s.id === selectedSiteId) ?? null;
  const partyRegion = regionAt(world, world.party.x, world.party.y);
  const distance = selectedSite
    ? worldDistance(world.party, selectedSite, world.scaleMilesPerUnit)
    : 0;
  const days = selectedSite
    ? travelDays(distance, 24, partyRegion?.terrain ?? "plains")
    : 0;

  function createMapForSite(site: WorldSite | null) {
    const id = newId();
    const kind: MapKind =
      site?.kind === "dungeon" || site?.kind === "ruin"
        ? "dungeon"
        : site?.kind === "city"
          ? "city"
          : site?.kind === "town" || site?.kind === "village"
            ? "town"
            : site?.kind === "keep"
              ? "keep"
              : "wilderness";
    const map = emptyMap(id, site ? `${site.name} — tactical map` : "Untitled map", newId(), kind);
    map.worldId = world!.id;
    if (site) map.siteId = site.id;
    saveMap(map);
    if (site) update((w) => {
      const s = w.sites.find((x) => x.id === site.id);
      if (s) s.mapId = id;
    });
    navigate({ to: "/maps/$mapId", params: { mapId: id } });
  }

  return (
    <AppShell>
      <PageTitle title={world.name} subtitle={world.tagline ?? "Overland map, sites and lore."} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={tool === "select" ? "default" : "outline"} onClick={() => setTool("select")}>
              Select
            </Button>
            <Button size="sm" variant={tool === "site" ? "default" : "outline"} onClick={() => setTool("site")}>
              Place site
            </Button>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={siteKind}
              onChange={(e) => setSiteKind(e.target.value as SiteKind)}
            >
              {SITE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.glyph} {k.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant={tool === "region" ? "default" : "outline"} onClick={() => setTool("region")}>
              Add region
            </Button>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={terrain}
              onChange={(e) => setTerrain(e.target.value as TerrainKind)}
            >
              {TERRAIN_KINDS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant={tool === "party" ? "default" : "outline"} onClick={() => setTool("party")}>
              Move party
            </Button>
          </div>

          <div className="aspect-[10/7] w-full">
            <WorldMapView
              world={world}
              artUrl={worldArt}
              selectedSiteId={selectedSiteId}
              onSelectSite={(s) => setSelectedSiteId(s.id)}
              onMapClick={handleMapClick}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PaintMapButton world={world} />
          </div>


          <p className="text-xs text-muted-foreground">
            Scale: {world.scaleMilesPerUnit} miles per map unit. Party is in{" "}
            {partyRegion?.name ?? "uncharted land"}.
          </p>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="site">
            <TabsList className="w-full">
              <TabsTrigger value="site" className="flex-1">
                Site
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex-1">
                Regions
              </TabsTrigger>
              <TabsTrigger value="lore" className="flex-1">
                Lore
              </TabsTrigger>
              <TabsTrigger value="maps" className="flex-1">
                Maps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site">
              <Card className="card-etched bg-card/70">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    {selectedSite ? selectedSite.name : "No site selected"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedSite ? (
                    <>
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input
                          value={selectedSite.name}
                          onChange={(e) =>
                            update((w) => {
                              const s = w.sites.find((x) => x.id === selectedSite.id);
                              if (s) s.name = e.target.value;
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Kind</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          value={selectedSite.kind}
                          onChange={(e) =>
                            update((w) => {
                              const s = w.sites.find((x) => x.id === selectedSite.id);
                              if (s) s.kind = e.target.value as SiteKind;
                            })
                          }
                        >
                          {SITE_KINDS.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={selectedSite.description ?? ""}
                          onChange={(e) =>
                            update((w) => {
                              const s = w.sites.find((x) => x.id === selectedSite.id);
                              if (s) s.description = e.target.value;
                            })
                          }
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(distance)} miles from the party · about {days.toFixed(1)} days
                        overland.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            update((w) => {
                              w.party = { x: selectedSite.x, y: selectedSite.y, siteId: selectedSite.id };
                              const s = w.sites.find((x) => x.id === selectedSite.id);
                              if (s) s.discovered = true;
                            })
                          }
                        >
                          Travel here
                        </Button>
                        {selectedSite.mapId ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/maps/$mapId" params={{ mapId: selectedSite.mapId }}>
                              Open tactical map
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => createMapForSite(selectedSite)}>
                            Build tactical map
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            update((w) => {
                              w.sites = w.sites.filter((x) => x.id !== selectedSite.id);
                              w.routes = w.routes.filter(
                                (r) => r.fromSiteId !== selectedSite.id && r.toSiteId !== selectedSite.id,
                              );
                            });
                            setSelectedSiteId(null);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click a site on the map, or use “Place site” to add one.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regions">
              <Card className="card-etched bg-card/70">
                <CardContent className="space-y-3 pt-6">
                  {world.regions.map((r) => (
                    <div key={r.id} className="space-y-2 rounded-md border border-border p-3">
                      <Input
                        value={r.name}
                        onChange={(e) =>
                          update((w) => {
                            const reg = w.regions.find((x) => x.id === r.id);
                            if (reg) reg.name = e.target.value;
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <select
                          className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                          value={r.terrain}
                          onChange={(e) =>
                            update((w) => {
                              const reg = w.regions.find((x) => x.id === r.id);
                              if (reg) reg.terrain = e.target.value as TerrainKind;
                            })
                          }
                        >
                          {TERRAIN_KINDS.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update((w) => {
                            w.regions = w.regions.filter((x) => x.id !== r.id);
                          })}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(["x", "y", "w", "h"] as const).map((k) => (
                          <div key={k}>
                            <Label className="text-xs uppercase">{k}</Label>
                            <Input
                              type="number"
                              value={r[k]}
                              onChange={(e) =>
                                update((w) => {
                                  const reg = w.regions.find((x) => x.id === r.id);
                                  if (reg) reg[k] = Number(e.target.value);
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {world.regions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No regions yet.</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lore">
              <Card className="card-etched bg-card/70">
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={4}
                      value={world.description ?? ""}
                      onChange={(e) => update((w) => {
                        w.description = e.target.value;
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Factions</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          update((w) => {
                            w.factions.push({ id: newId(), name: "New faction", standing: 0 });
                          })
                        }
                      >
                        Add
                      </Button>
                    </div>
                    {world.factions.map((f) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <Input
                          value={f.name}
                          onChange={(e) =>
                            update((w) => {
                              const fa = w.factions.find((x) => x.id === f.id);
                              if (fa) fa.name = e.target.value;
                            })
                          }
                        />
                        <Badge variant="outline">{f.standing >= 0 ? `+${f.standing}` : f.standing}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update((w) => {
                            w.factions = w.factions.filter((x) => x.id !== f.id);
                          })}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Pantheon</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          update((w) => {
                            w.pantheon.push({ id: newId(), name: "New deity", domain: "" });
                          })
                        }
                      >
                        Add
                      </Button>
                    </div>
                    {world.pantheon.map((g) => (
                      <div key={g.id} className="flex gap-2">
                        <Input
                          value={g.name}
                          onChange={(e) =>
                            update((w) => {
                              const d = w.pantheon.find((x) => x.id === g.id);
                              if (d) d.name = e.target.value;
                            })
                          }
                        />
                        <Input
                          placeholder="Domains"
                          value={g.domain}
                          onChange={(e) =>
                            update((w) => {
                              const d = w.pantheon.find((x) => x.id === g.id);
                              if (d) d.domain = e.target.value;
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>History</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update((w) => {
                          w.history.push({ id: newId(), name: "New era", summary: "" });
                        })}
                      >
                        Add
                      </Button>
                    </div>
                    {world.history.map((h) => (
                      <div key={h.id} className="space-y-1 rounded-md border border-border p-2">
                        <Input
                          value={h.name}
                          onChange={(e) =>
                            update((w) => {
                              const era = w.history.find((x) => x.id === h.id);
                              if (era) era.name = e.target.value;
                            })
                          }
                        />
                        <Textarea
                          rows={2}
                          value={h.summary}
                          onChange={(e) =>
                            update((w) => {
                              const era = w.history.find((x) => x.id === h.id);
                              if (era) era.summary = e.target.value;
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maps">
              <Card className="card-etched bg-card/70">
                <CardContent className="space-y-3 pt-6">
                  <Button size="sm" onClick={() => createMapForSite(null)}>
                    New tactical map
                  </Button>
                  {maps.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                      <div>
                        <p className="text-sm text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.kind} · {m.levels.length} level(s) · {m.tokens.length} tokens
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/maps/$mapId" params={{ mapId: m.id }}>
                          Open
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {maps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tactical maps for this world yet.</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
