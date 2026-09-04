import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listCharacters, deleteCharacter, duplicateCharacter } from "@/lib/storage";
import { computeCharacter, formatMod } from "@/lib/rules/engine";
import { CLASS_BY_ID } from "@/lib/rules/classes";
import { RACE_BY_ID } from "@/lib/rules/races";
import type { Character } from "@/lib/rules/character";

export const Route = createFileRoute("/characters/")({
  head: () => ({
    meta: [
      { title: "Your characters — The Endless Codex" },
      { name: "description", content: "Every 3.5 character you have built: hit points, armor class, saves, and levels at a glance." },
      { property: "og:title", content: "Your characters — The Endless Codex" },
      { property: "og:description", content: "Manage your rules-accurate D&D 3.5 characters and jump back into play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CharacterList,
});

function CharacterList() {
  const [chars, setChars] = useState<Character[]>([]);
  const navigate = useNavigate();
  const refresh = () => setChars(listCharacters());
  useEffect(refresh, []);

  return (
    <AppShell>
      <PageTitle
        title="Characters"
        subtitle="Every hero you have rolled up. Stats are recalculated live from the 3.5 rules."
        action={
          <Button onClick={() => navigate({ to: "/characters/new" })}>
            <Plus className="mr-1.5 size-4" /> New character
          </Button>
        }
      />

      <PageTitle as="h2" title="Character roster" />

      {chars.length === 0 ? (
        <Card className="card-etched bg-card/60 p-10 text-center">
          <p className="text-muted-foreground">No characters yet. The first step of any campaign is a name.</p>
          <div className="mt-5">
            <Button asChild>
              <Link to="/characters/new">Create your first character</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chars.map((c) => {
            const d = computeCharacter(c);
            return (
              <Card key={c.id} className="card-etched bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-xl">
                    <Link to="/characters/$id" params={{ id: c.id }} className="hover:text-primary">
                      {c.name || "Unnamed"}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {RACE_BY_ID[c.raceId]?.name} ·{" "}
                    {c.classes.map((cl) => `${CLASS_BY_ID[cl.classId]?.name ?? cl.classId} ${cl.levels}`).join(" / ")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">HP {d.hpMax}</Badge>
                    <Badge variant="secondary">AC {d.ac.total}</Badge>
                    <Badge variant="secondary">Init {formatMod(d.initiative)}</Badge>
                    <Badge variant="secondary">
                      F {formatMod(d.saves.fort)} R {formatMod(d.saves.ref)} W {formatMod(d.saves.will)}
                    </Badge>
                    <Badge>{c.alignment}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/characters/$id" params={{ id: c.id }}>Open sheet</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Duplicate"
                      onClick={() => {
                        duplicateCharacter(c.id);
                        refresh();
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm(`Delete ${c.name || "this character"}?`)) {
                          deleteCharacter(c.id);
                          refresh();
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
