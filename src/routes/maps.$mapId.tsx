import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IsoMapView } from "@/components/IsoMapView";
import { getMap, newId, saveMap } from "@/lib/storage";
import {
  MAP_TERRAINS,
  PROP_KINDS,
  TOKEN_SIZES,
  coverBonus,
  fallingDamage,
  gridDistanceFeet,
  hasLineOfSight,
  highGroundBonus,
  makeLevel,
  revealAround,
  tileAt,
  tileIndex,
  type MapProp,
  type MapTerrain,
  type MapToken,
  type PropKind,
  type TacticalMap,
  type TokenSize,
} from "@/lib/tacticalmap";

export const Route = createFileRoute("/maps/$mapId")({
  head: () => ({
    meta: [
      { title: "Tactical map | The Endless Codex" },
      {
        name: "description",
        content:
          "A 2.5D isometric D&D 3.5 battle map with elevation, multiple dungeon levels, walls, traps, fog of war and miniature tokens.",
      },
      { property: "og:title", content: "Tactical map | The Endless Codex" },
      {
        property: "og:description",
        content: "Isometric battle maps with elevation, traps, fog of war and initiative-ready tokens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapEditor,
});

type Tool =
  | "paint"
  | "raise"
  | "lower"
  | "prop"
  | "token"
  | "trap"
  | "move"
  | "measure"
  | "reveal"
  | "erase";

const FACTION_COLORS: Record<MapToken["faction"], string> = {
  party: "#d4af54",
  ally: "#5fbf6a",
  enemy: "#e2534f",
  neutral: "#9aa3b2",
};

function MapEditor() {
  const { mapId } = Route.useParams();
  const [map, setMap] = useState<TacticalMap | undefined>();
  const [tool, setTool] = useState<Tool>("paint");
  const [terrain, setTerrain] = useState<MapTerrain>("stone");
  const [propKind, setPropKind] = useState<PropKind>("wall");
  const [tokenFaction, setTokenFaction] = useState<MapToken["faction"]>("party");
  const [tokenSize, setTokenSize] = useState<TokenSize>("medium");
  const [dmView, setDmView] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [measureFrom, setMeasureFrom] = useState<{ x: number; y: number } | null>(null);
  const [readout, setReadout] = useState<string>("");

  useEffect(() => {
    setMap(getMap(mapId));
  }, [mapId]);

  const level = useMemo(
    () => map?.levels.find((l) => l.id === map.activeLevelId) ?? map?.levels[0],
    [map],
  );

  if (!map || !level) {
    return (
      <AppShell>
        <PageTitle title="Map not found" subtitle="This tactical map is not in your library." />
        <Button asChild>
          <Link to="/worlds">Back to worlds</Link>
        </Button>
      </AppShell>
    );
  }

  function update(mutate: (m: TacticalMap) => void) {
    setMap((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutate(next);
      return saveMap(next);
    });
  }

  const selectedToken = map.tokens.find((t) => t.id === selectedTokenId) ?? null;

  function handleTile(x: number, y: number) {
    const activeLevelId = level!.id;
    switch (tool) {
      case "paint":
        update((m) => {
          const l = m.levels.find((lv) => lv.id === activeLevelId)!;
          l.tiles[tileIndex(l, x, y)]!.t = terrain;
        });
        break;
      case "raise":
      case "lower":
        update((m) => {
          const l = m.levels.find((lv) => lv.id === activeLevelId)!;
          const t = l.tiles[tileIndex(l, x, y)]!;
          t.e = Math.max(0, Math.min(12, t.e + (tool === "raise" ? 1 : -1)));
        });
        break;
      case "prop":
        update((m) => {
          const existing = m.props.find((p) => p.levelId === activeLevelId && p.x === x && p.y === y);
          if (existing) {
            if (existing.kind === "door") existing.open = !existing.open;
            else m.props = m.props.filter((p) => p !== existing);
            return;
          }
          const prop: MapProp = {
            id: newId(),
            levelId: activeLevelId,
            x,
            y,
            kind: propKind,
            height: propKind === "pillar" ? 3 : 2,
          };
          m.props.push(prop);
        });
        break;
      case "token":
        update((m) => {
          m.tokens.push({
            id: newId(),
            levelId: activeLevelId,
            name: tokenFaction === "enemy" ? "Foe" : "Hero",
            x,
            y,
            size: tokenSize,
            altitude: 0,
            color: FACTION_COLORS[tokenFaction],
            faction: tokenFaction,
            conditions: [],
          });
        });
        break;
      case "trap":
        update((m) => {
          m.traps.push({
            id: newId(),
            levelId: activeLevelId,
            x,
            y,
            name: "Hidden trap",
            trigger: "location",
            searchDC: 20,
            disableDC: 20,
            save: "Reflex DC 15 half",
            damage: "2d6",
            found: false,
            sprung: false,
          });
        });
        break;
      case "move":
        if (selectedToken) {
          const from = { x: selectedToken.x, y: selectedToken.y };
          update((m) => {
            const t = m.tokens.find((tk) => tk.id === selectedToken.id);
            if (!t) return;
            t.x = x;
            t.y = y;
            const l = m.levels.find((lv) => lv.id === activeLevelId)!;
            if (m.fogEnabled && t.faction === "party") revealAround(l, m.props, x, y, 12);
          });
          const fromE = tileAt(level!, from.x, from.y)?.e ?? 0;
          const toE = tileAt(level!, x, y)?.e ?? 0;
          const drop = (fromE - toE) * 5;
          setReadout(
            `Moved ${gridDistanceFeet(from, { x, y })} ft.` +
              (drop >= 10 ? ` Drop of ${drop} ft — falling damage ${fallingDamage(drop)}.` : ""),
          );
        }
        break;
      case "measure":
        if (!measureFrom) {
          setMeasureFrom({ x, y });
          setReadout("Measuring from the marked square…");
        } else {
          const feet = gridDistanceFeet(measureFrom, { x, y });
          const los = hasLineOfSight(level!, map!.props, measureFrom, { x, y });
          const aE = tileAt(level!, measureFrom.x, measureFrom.y)?.e ?? 0;
          const bE = tileAt(level!, x, y)?.e ?? 0;
          const cover = coverBonus(!los, !los ? false : Math.abs(aE - bE) >= 1);
          setReadout(
            `${feet} ft · line of sight ${los ? "clear" : "blocked"} · ${cover.label}` +
              (cover.ac ? ` (+${cover.ac} AC, +${cover.reflex} Reflex)` : "") +
              (highGroundBonus(aE, bE) ? " · +1 melee from high ground" : ""),
          );
          setMeasureFrom(null);
        }
        break;
      case "reveal":
        update((m) => {
          const l = m.levels.find((lv) => lv.id === activeLevelId)!;
          revealAround(l, m.props, x, y, 8);
        });
        break;
      case "erase":
        update((m) => {
          m.props = m.props.filter((p) => !(p.levelId === activeLevelId && p.x === x && p.y === y));
          m.tokens = m.tokens.filter((t) => !(t.levelId === activeLevelId && t.x === x && t.y === y));
          m.traps = m.traps.filter((t) => !(t.levelId === activeLevelId && t.x === x && t.y === y));
        });
        break;
    }
  }

  return (
    <AppShell>
      <PageTitle
        title={map.name}
        subtitle="Isometric 5 ft grid. Elevation, walls, traps, fog of war and miniature tokens."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["paint", "Terrain"],
                ["raise", "Raise"],
                ["lower", "Lower"],
                ["prop", "Props"],
                ["token", "Token"],
                ["trap", "Trap"],
                ["move", "Move"],
                ["measure", "Measure"],
                ["reveal", "Reveal"],
                ["erase", "Erase"],
              ] as [Tool, string][]
            ).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={tool === id ? "default" : "outline"}
                onClick={() => {
                  setTool(id);
                  setMeasureFrom(null);
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tool === "paint" ? (
              <select
                aria-label="Terrain type"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value as MapTerrain)}
              >
                {MAP_TERRAINS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : null}
            {tool === "prop" ? (
              <select
                aria-label="Prop type"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={propKind}
                onChange={(e) => setPropKind(e.target.value as PropKind)}
              >
                {PROP_KINDS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : null}
            {tool === "token" ? (
              <>
                <select
                  aria-label="Token side"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={tokenFaction}
                  onChange={(e) => setTokenFaction(e.target.value as MapToken["faction"])}
                >
                  <option value="party">Party</option>
                  <option value="ally">Ally</option>
                  <option value="enemy">Enemy</option>
                  <option value="neutral">Neutral</option>
                </select>
                <select
                  aria-label="Token size"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={tokenSize}
                  onChange={(e) => setTokenSize(e.target.value as TokenSize)}
                >
                  {TOKEN_SIZES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={dmView} onChange={(e) => setDmView(e.target.checked)} />
              DM view (see through fog)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={map.fogEnabled}
                onChange={(e) => update((m) => {
                  m.fogEnabled = e.target.checked;
                })}
              />
              Fog of war
            </label>
          </div>

          <IsoMapView
            map={map}
            level={level}
            dmView={dmView}
            selectedTokenId={selectedTokenId}
            onTileClick={handleTile}
            onTokenClick={(t) => {
              if (tool === "move" && selectedTokenId && selectedTokenId !== t.id) handleTile(t.x, t.y);
              else setSelectedTokenId(t.id === selectedTokenId ? null : t.id);
            }}
          />

          {readout ? <p className="text-sm text-primary">{readout}</p> : null}
        </div>

        <div className="space-y-4">
          <Card className="card-etched bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Levels</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update((m) => {
                    const z = m.levels.length;
                    const l = makeLevel(newId(), `Level ${z + 1}`, z, level!.width, level!.height);
                    m.levels.push(l);
                    m.activeLevelId = l.id;
                  })
                }
              >
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {map.levels
                .slice()
                .sort((a, b) => b.z - a.z)
                .map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={l.id === map.activeLevelId ? "default" : "outline"}
                      className="flex-1 justify-start"
                      onClick={() => update((m) => {
                        m.activeLevelId = l.id;
                      })}
                    >
                      {l.name}
                    </Button>
                    <Badge variant="outline">z {l.z}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="card-etched bg-card/70">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {selectedToken ? selectedToken.name : "Tokens"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedToken ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="token-name">Name</Label>
                    <Input
                      id="token-name"
                      value={selectedToken.name}
                      onChange={(e) =>
                        update((m) => {
                          const t = m.tokens.find((x) => x.id === selectedToken.id);
                          if (t) t.name = e.target.value;
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="token-hp" className="text-xs">HP</Label>
                      <Input
                        id="token-hp"
                        type="number"
                        value={selectedToken.hp ?? 0}
                        onChange={(e) =>
                          update((m) => {
                            const t = m.tokens.find((x) => x.id === selectedToken.id);
                            if (t) t.hp = Number(e.target.value);
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="token-maxhp" className="text-xs">Max HP</Label>
                      <Input
                        id="token-maxhp"
                        type="number"
                        value={selectedToken.maxHp ?? 0}
                        onChange={(e) =>
                          update((m) => {
                            const t = m.tokens.find((x) => x.id === selectedToken.id);
                            if (t) t.maxHp = Number(e.target.value);
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="token-alt" className="text-xs">Altitude (5 ft)</Label>
                      <Input
                        id="token-alt"
                        type="number"
                        value={selectedToken.altitude}
                        onChange={(e) =>
                          update((m) => {
                            const t = m.tokens.find((x) => x.id === selectedToken.id);
                            if (t) t.altitude = Math.max(0, Number(e.target.value));
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Flying at {selectedToken.altitude * 5} ft. A fall from here deals{" "}
                    {fallingDamage(selectedToken.altitude * 5)} damage.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setTool("move")}>
                      Move token
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        update((m) => {
                          m.tokens = m.tokens.filter((x) => x.id !== selectedToken.id);
                        });
                        setSelectedTokenId(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click a token to select it, then use Move to reposition it. Distances use 3.5
                  diagonal counting.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-etched bg-card/70">
            <CardHeader>
              <CardTitle className="font-display text-lg">Traps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {map.traps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No traps placed.</p>
              ) : null}
              {map.traps.map((t) => (
                <div key={t.id} className="space-y-1 rounded-md border border-border p-2 text-sm">
                  <Input
                    aria-label="Trap name"
                    value={t.name}
                    onChange={(e) =>
                      update((m) => {
                        const tr = m.traps.find((x) => x.id === t.id);
                        if (tr) tr.name = e.target.value;
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Search DC {t.searchDC} · Disable DC {t.disableDC} · {t.save} · {t.damage}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={t.found ? "default" : "outline"}
                      onClick={() =>
                        update((m) => {
                          const tr = m.traps.find((x) => x.id === t.id);
                          if (tr) tr.found = !tr.found;
                        })
                      }
                    >
                      {t.found ? "Found" : "Mark found"}
                    </Button>
                    <Button
                      size="sm"
                      variant={t.sprung ? "default" : "outline"}
                      onClick={() =>
                        update((m) => {
                          const tr = m.traps.find((x) => x.id === t.id);
                          if (tr) tr.sprung = !tr.sprung;
                        })
                      }
                    >
                      {t.sprung ? "Sprung" : "Spring"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
