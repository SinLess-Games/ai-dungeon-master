import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Swords, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listCampaigns, saveCampaign, deleteCampaign, listCharacters } from "@/lib/storage";
import {
  emptyCampaign,
  STYLE_OPTIONS,
  TYPE_OPTIONS,
  LENGTH_OPTIONS,
  PACE_OPTIONS,
  DM_STYLE_OPTIONS,
  type Campaign,
  type CampaignStyle,
} from "@/lib/campaign";
import type { Character } from "@/lib/rules/character";

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns — Play D&D 3.5 with an AI Dungeon Master" },
      {
        name: "description",
        content:
          "Start a solo D&D 3.5 campaign: pick a style, campaign type, pace and DM temperament, then sit down at the table with an AI Dungeon Master.",
      },
      { property: "og:title", content: "Campaigns — Play with an AI Dungeon Master" },
      {
        property: "og:description",
        content: "Create a campaign, choose its style and pace, and play D&D 3.5 solo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [draft, setDraft] = useState<Campaign | null>(null);

  useEffect(() => {
    setCampaigns(listCampaigns());
    setCharacters(listCharacters());
  }, []);

  function startDraft() {
    const first = characters[0];
    if (!first) return;
    setDraft({ ...emptyCampaign(first.id), name: `${first.name || "Hero"}'s campaign` });
  }

  function create() {
    if (!draft) return;
    const saved = saveCampaign(draft);
    navigate({ to: "/campaigns/$id", params: { id: saved.id } });
  }

  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <AppShell>
      <PageTitle
        title="Campaigns"
        subtitle="Every campaign keeps its own scene, NPCs, quests and log. The AI DM reads all of it before every reply."
        action={
          characters.length && !draft ? (
            <Button onClick={startDraft}>
              <Plus className="mr-2 size-4" /> New campaign
            </Button>
          ) : null
        }
      />

      {!characters.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">You need a character before you can sit down.</p>
            <Button asChild className="mt-4">
              <Link to="/characters/new">Create a character</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {draft ? (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Set up the campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Campaign name</Label>
                <Input
                  className="mt-2"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div>
                <Label>Character</Label>
                <Select value={draft.characterId} onValueChange={(v) => set("characterId", v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StylePicker
                values={draft.styles}
                onChange={(v) => set("styles", v)}
              />
              <PickField
                label="Campaign type"
                value={draft.type}
                onChange={(v) => set("type", v as Campaign["type"])}
                options={TYPE_OPTIONS}
              />
              <PickField
                label="Length"
                value={draft.length}
                onChange={(v) => set("length", v as Campaign["length"])}
                options={LENGTH_OPTIONS}
              />
              <PickField
                label="Pace"
                value={draft.pace}
                onChange={(v) => set("pace", v as Campaign["pace"])}
                options={PACE_OPTIONS}
              />
              <PickField
                label="DM temperament"
                value={draft.dmStyle}
                onChange={(v) => set("dmStyle", v as Campaign["dmStyle"])}
                options={DM_STYLE_OPTIONS}
              />
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  checked={draft.allowEpic}
                  onCheckedChange={(v) => set("allowEpic", v)}
                  id="epic"
                />
                <Label htmlFor="epic">Allow epic play (21+)</Label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>World name</Label>
                <Input
                  className="mt-2"
                  placeholder="Leave blank and the DM will invent one"
                  value={draft.worldName}
                  onChange={(e) => set("worldName", e.target.value)}
                />
              </div>
              <div>
                <Label>Starting town / opening situation</Label>
                <Input
                  className="mt-2"
                  value={draft.scene.location}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, scene: { ...d.scene, location: e.target.value } } : d))
                  }
                />
              </div>
            </div>

            <div>
              <Label>World notes</Label>
              <Textarea
                className="mt-2"
                rows={3}
                placeholder="Tone, geography, factions, anything you want true about this world."
                value={draft.worldSummary}
                onChange={(e) => set("worldSummary", e.target.value)}
              />
            </div>

            <div>
              <Label>House rules</Label>
              <Textarea
                className="mt-2"
                rows={2}
                placeholder="e.g. massive damage threshold is 50, criticals auto-confirm"
                value={draft.houseRules}
                onChange={(e) => set("houseRules", e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={create}>
                <Swords className="mr-2 size-4" /> Begin
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => {
          const char = characters.find((x) => x.id === c.characterId);
          return (
            <Card key={c.id} className="transition-colors hover:border-primary/50">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-xl">
                    <Link to="/campaigns/$id" params={{ id: c.id }}>
                      {c.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {char?.name || "missing character"} · {c.scene.location}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Delete campaign"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  onClick={() => {
                    deleteCampaign(c.id);
                    setCampaigns(listCampaigns());
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
              {c.styles.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
                <Badge variant="secondary">{c.type}</Badge>
                <Badge variant="outline">{c.pace}</Badge>
                {c.scene.inCombat ? <Badge>in combat</Badge> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function PickField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string; blurb?: string }[];
}) {
  const active = options.find((o) => o.value === value);
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active?.blurb ? (
        <p className="mt-1 text-xs text-muted-foreground">{active.blurb}</p>
      ) : null}
    </div>
  );
}

function StylePicker({
  values,
  onChange,
}: {
  values: CampaignStyle[];
  onChange: (v: CampaignStyle[]) => void;
}) {
  function toggle(value: CampaignStyle) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (values.length < 3) {
      onChange([...values, value]);
    }
  }

  return (
    <div>
      <Label>Campaign style</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick up to 3 styles that shape the DM's tone and world.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STYLE_OPTIONS.map((o) => {
          const active = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={!active && values.length >= 3}
              onClick={() => toggle(o.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-card-foreground hover:bg-accent disabled:opacity-40",
              )}
              title={o.blurb}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
