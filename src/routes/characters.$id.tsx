import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Shield, Swords, Backpack, ScrollText, FileDown } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiceTray } from "@/components/DiceTray";
import { getCharacter, saveCharacter } from "@/lib/storage";
import { formatMovement } from "@/lib/rules/movement";
import { computeCharacter, formatMod } from "@/lib/rules/engine";
import { ABILITIES, ABILITY_NAMES } from "@/lib/rules/types";
import { CLASS_BY_ID } from "@/lib/rules/classes";
import { FEAT_BY_ID } from "@/lib/rules/feats";
import { WEAPONS, ARMORS, SHIELDS } from "@/lib/rules/equipment";
import type { Character } from "@/lib/rules/character";

export const Route = createFileRoute("/characters/$id")({
  head: () => ({
    meta: [
      { title: "Character sheet — The Endless Codex" },
      { name: "description", content: "A live D&D 3.5 character sheet: hit points, AC, saves, skills, feats, gear, and dice shortcuts." },
      { property: "og:title", content: "Character sheet — The Endless Codex" },
      { property: "og:description", content: "Track your 3.5 hero with automatically calculated stats and one-click rolls." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sheet,
});

function Sheet() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [char, setChar] = useState<Character | null | undefined>(undefined);

  useEffect(() => setChar(getCharacter(id) ?? null), [id]);

  const derived = useMemo(() => (char ? computeCharacter(char) : null), [char]);

  function update(p: Partial<Character>) {
    setChar((c) => {
      if (!c) return c;
      const next = { ...c, ...p };
      saveCharacter(next);
      return next;
    });
  }

  if (char === undefined) return <AppShell><p className="text-muted-foreground">Loading sheet…</p></AppShell>;

  if (char === null || !derived) {
    return (
      <AppShell>
        <PageTitle title="Character not found" subtitle="This sheet does not exist on this device." />
        <Button onClick={() => navigate({ to: "/characters" })}>Back to characters</Button>
      </AppShell>
    );
  }

  const presets = [
    { label: "Initiative", notation: `1d20${derived.initiative >= 0 ? "+" : ""}${derived.initiative}` },
    { label: "Fortitude", notation: `1d20${derived.saves.fort >= 0 ? "+" : ""}${derived.saves.fort}` },
    { label: "Reflex", notation: `1d20${derived.saves.ref >= 0 ? "+" : ""}${derived.saves.ref}` },
    { label: "Will", notation: `1d20${derived.saves.will >= 0 ? "+" : ""}${derived.saves.will}` },
    { label: "Melee attack", notation: `1d20${derived.melee >= 0 ? "+" : ""}${derived.melee}` },
    { label: "Ranged attack", notation: `1d20${derived.ranged >= 0 ? "+" : ""}${derived.ranged}` },
  ];

  const armor = ARMORS.find((a) => a.id === char.armorId);
  const shield = SHIELDS.find((s) => s.id === char.shieldId);
  const weapons = WEAPONS.filter((w) => char.weaponIds.includes(w.id));

  return (
    <AppShell>
      <PageTitle
        title={char.name || "Unnamed Adventurer"}
        subtitle={`${derived.race.name} · ${char.classes.map((c) => `${CLASS_BY_ID[c.classId]?.name ?? c.classId} ${c.levels}`).join(" / ")}${derived.gestalt ? ` // ${(char.classesB ?? []).map((c) => `${CLASS_BY_ID[c.classId]?.name ?? c.classId} ${c.levels}`).join(" / ")} (gestalt)` : ""} · ${char.alignment}${char.deity ? ` · ${char.deity}` : ""}${derived.ecl !== derived.level ? ` · ECL ${derived.ecl}${derived.racialHd ? ` (${derived.racialHd} racial HD` : " ("}${derived.levelAdjustment ? `${derived.racialHd ? ", " : ""}LA +${derived.levelAdjustment}` : ""})` : ""}`}
        action={
          <Button variant="outline" asChild>
            <Link to="/characters">All characters</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-etched bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-destructive" /> Hit points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={char.hp.current}
                    onChange={(e) => update({ hp: { ...char.hp, current: Number(e.target.value) || 0 } })}
                    className="w-20 font-mono text-lg"
                  />
                  <span className="font-display text-2xl text-muted-foreground">/ {derived.hpMax}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {[-5, -1, 1, 5].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant="outline"
                      onClick={() => update({ hp: { ...char.hp, current: Math.min(derived.hpMax, char.hp.current + n) } })}
                    >
                      {n > 0 ? `+${n}` : n}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-etched bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="size-4 text-primary" /> Armor class</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">{derived.ac.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  touch {derived.ac.touch} · flat-footed {derived.ac.flatFooted}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  10 +{derived.ac.armor} armor +{derived.ac.shield} shield {formatMod(derived.ac.dex)} Dex {formatMod(derived.ac.size)} size
                </p>
              </CardContent>
            </Card>

            <Card className="card-etched bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Swords className="size-4 text-primary" /> Attacks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-mono">BAB {derived.attacks.map(formatMod).join(" / ")}</p>
                <p className="font-mono">Melee {formatMod(derived.melee)}</p>
                <p className="font-mono">Ranged {formatMod(derived.ranged)}</p>
                <p className="font-mono">Grapple {formatMod(derived.grapple)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="card-etched bg-card/70">
            <CardContent className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-6">
              {ABILITIES.map((a) => (
                <div key={a} className="rounded border border-border/60 p-2 text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{ABILITY_NAMES[a].slice(0, 3)}</p>
                  <p className="font-display text-2xl">{derived.abilityScores[a]}</p>
                  <p className="font-mono text-sm text-primary">{formatMod(derived.abilityMods[a])}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Tabs defaultValue="skills">
            <TabsList>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="feats">Feats & features</TabsTrigger>
              <TabsTrigger value="gear">Gear & loot</TabsTrigger>
              <TabsTrigger value="log">DM log</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="mt-4">
              <Card className="card-etched bg-card/70">
                <CardContent className="p-4">
                  <div className="grid gap-1 sm:grid-cols-2">
                    {derived.skills
                      .filter((s) => s.ranks > 0 || s.isClassSkill || !s.trainedOnly)
                      .map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded border border-border/40 px-2 py-1 text-sm">
                          <span className={s.isClassSkill ? "" : "text-muted-foreground"}>
                            {s.name} <span className="text-xs uppercase text-muted-foreground">{s.ability}</span>
                          </span>
                          <span className="font-mono">
                            {formatMod(s.total)}
                            <span className="ml-2 text-xs text-muted-foreground">{s.ranks} rk</span>
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feats" className="mt-4 space-y-4">
              <Card className="card-etched bg-card/70">
                <CardHeader className="pb-2"><CardTitle className="text-base">Feats</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {char.featIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No feats selected.</p>
                  ) : (
                    char.featIds.map((fid) => {
                      const f = FEAT_BY_ID[fid];
                      return f ? (
                        <div key={fid} className="rounded border border-border/50 p-2">
                          <p className="font-medium">{f.name}</p>
                          <p className="text-sm text-muted-foreground">{f.benefit}</p>
                        </div>
                      ) : null;
                    })
                  )}
                </CardContent>
              </Card>
              <Card className="card-etched bg-card/70">
                <CardHeader className="pb-2"><CardTitle className="text-base">Class features</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[...char.classes, ...(derived.gestalt ? char.classesB ?? [] : [])].flatMap((cl) => {
                    const def = CLASS_BY_ID[cl.classId];
                    return (def?.features ?? [])
                      .filter((f) => f.level <= cl.levels)
                      .map((f) => (
                        <div key={`${cl.classId}-${f.name}`} className="rounded border border-border/50 p-2">
                          <p className="font-medium">
                            {f.name} <span className="text-xs text-muted-foreground">lvl {f.level}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{f.text}</p>
                        </div>
                      ));
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gear" className="mt-4 space-y-4">
              <Card className="card-etched bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Backpack className="size-4" /> Worn and wielded</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Armor: {armor?.name ?? "None"}</p>
                  <p>Shield: {shield?.name ?? "None"}</p>
                  {weapons.map((w) => (
                    <p key={w.id} className="font-mono">
                      {w.name} — {w.damage}, crit {w.critical}
                      {w.range ? `, range ${w.range} ft.` : ""}
                    </p>
                  ))}
                  <p>Gold: {char.gold} gp</p>
                  <div className="mt-3 flex items-center justify-between rounded border border-border/60 p-2">
                    <Label htmlFor="enc">Track encumbrance</Label>
                    <Switch
                      id="enc"
                      checked={char.encumbranceEnabled}
                      onCheckedChange={(v) => update({ encumbranceEnabled: v })}
                    />
                  </div>
                  {char.encumbranceEnabled ? (
                    <p className="text-muted-foreground">
                      Carrying {derived.load.carried} lb — {derived.load.category} load (light ≤ {derived.load.light},
                      medium ≤ {derived.load.medium}, heavy ≤ {derived.load.heavy}).
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <LootManager character={char} onChange={(next) => update(next)} />

            </TabsContent>

            <TabsContent value="log" className="mt-4">
              <Card className="card-etched bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><ScrollText className="size-4" /> Dungeon Master grants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {char.grants.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nothing yet. As you play, the DM can award feats, skill points, ability increases, XP,
                      or shift your alignment — each entry appears here with the reason.
                    </p>
                  ) : (
                    char.grants.map((g) => (
                      <div key={g.id} className="rounded border border-border/50 p-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{g.kind}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(g.at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1">{g.detail}</p>
                        <p className="text-muted-foreground">{g.reason}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="card-etched bg-card/70">
            <CardHeader className="pb-2"><CardTitle className="text-base">Saving throws</CardTitle></CardHeader>
            <CardContent className="space-y-1 font-mono text-sm">
              <p>Fortitude {formatMod(derived.saves.fort)}</p>
              <p>Reflex {formatMod(derived.saves.ref)}</p>
              <p>Will {formatMod(derived.saves.will)}</p>
              <p>Initiative {formatMod(derived.initiative)}</p>
              {derived.speeds.map((m) => (
                <p key={m.mode}>{formatMovement(m)}</p>
              ))}
              {derived.casting ? <p>Spell DC base {derived.casting.dcBase}</p> : null}
            </CardContent>
          </Card>
          <DiceTray presets={presets} compact />
        </aside>
      </div>
    </AppShell>
  );
}
