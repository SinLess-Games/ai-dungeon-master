import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCampaign, listCharacters, saveCampaign } from "@/lib/storage";
import {
  ATTITUDES,
  GEAR_SLOTS,
  ROLE_PRESETS,
  addGear,
  addMember,
  emptyMember,
  getParty,
  memberFromCharacter,
  partySummary,
  removeGear,
  removeMember,
  reorderMember,
  TIERS,
  updateGear,
  updateMember,
  type PartyMember,
  type PartyTier,
} from "@/lib/party";
import type { Campaign } from "@/lib/campaign";

export const Route = createFileRoute("/party/$campaignId")({
  head: () => ({
    meta: [
      { title: "Party & companions — The Endless Codex" },
      {
        name: "description",
        content:
          "Build your adventuring party: add heroes and NPC companions, outfit them with gear, and choose who the AI Dungeon Master runs.",
      },
      { property: "og:title", content: "Party & companions — The Endless Codex" },
      {
        property: "og:description",
        content: "Roster, outfitting, and DM-vs-player control for your D&D 3.5 party.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartyPage,
});

function PartyPage() {
  const { campaignId } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | undefined>(() => getCampaign(campaignId));
  const [openId, setOpenId] = useState<string | null>(null);
  const heroes = useMemo(() => listCharacters(), []);

  function commit(next: Campaign) {
    setCampaign(saveCampaign(next));
  }

  if (!campaign) {
    return (
      <AppShell>
        <p className="text-muted-foreground">That campaign could not be found.</p>
        <Button asChild className="mt-4">
          <Link to="/campaigns">Back to campaigns</Link>
        </Button>
      </AppShell>
    );
  }

  const party = getParty(campaign);
  const stats = partySummary(party);
  const linkedIds = new Set(party.map((m) => m.characterId).filter(Boolean));

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Party &amp; companions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.name} · {stats.active} active · you run {stats.playerRun} · the DM runs{" "}
            {stats.dmRun} · average level {stats.averageLevel || "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild>
            <Link to="/campaigns/$id" params={{ id: campaign.id }}>
              Back to the table
            </Link>
          </Button>
          {TIERS.map((t) => (
            <Button
              key={t.value}
              variant={t.value === "companion" ? "default" : "secondary"}
              onClick={() => {
                const m = emptyMember("npc", t.value);
                commit(addMember(campaign, m));
                setOpenId(m.id);
              }}
            >
              <UserPlus className="size-4" /> Add{" "}
              {t.value === "companion" ? "companion" : t.value}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {party.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 size-8 opacity-60" />
                No one else is travelling with you yet. Add a companion, cohort or follower, or
                bring in one of your saved heroes from the panel on the right.
              </CardContent>
            </Card>
          ) : null}

          {TIERS.map((tier) => {
            const rows = party.filter((m) => (m.tier ?? "companion") === tier.value);
            if (!rows.length) return null;
            return (
              <section key={tier.value} className="space-y-3">
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-primary">
                    {tier.label}
                    <span className="ml-2 text-xs font-normal normal-case text-muted-foreground">
                      {rows.length}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">{tier.blurb}</p>
                </div>
                {rows.map((m, i) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    open={openId === m.id}
                    first={i === 0}
                    last={i === rows.length - 1}
                    onToggle={() => setOpenId(openId === m.id ? null : m.id)}
                    onPatch={(patch) => commit(updateMember(campaign, m.id, patch))}
                    onMove={(d) => commit(reorderMember(campaign, m.id, d))}
                    onRemove={() => commit(removeMember(campaign, m.id))}
                    onAddGear={() => commit(addGear(campaign, m.id))}
                    onGearPatch={(gid, patch) => commit(updateGear(campaign, m.id, gid, patch))}
                    onGearRemove={(gid) => commit(removeGear(campaign, m.id, gid))}
                  />
                ))}
              </section>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Bring in a hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {heroes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no saved heroes yet.{" "}
                  <Link to="/characters/new" className="text-primary underline">
                    Create one
                  </Link>
                  .
                </p>
              ) : (
                heroes.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{h.name || "Unnamed hero"}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={linkedIds.has(h.id)}
                      onClick={() => {
                        const m = memberFromCharacter(h);
                        commit(addMember(campaign, m));
                        setOpenId(m.id);
                      }}
                    >
                      {linkedIds.has(h.id) ? "In party" : <Plus className="size-3.5" />}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Who runs whom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Anyone set to <strong className="text-foreground">You</strong> waits for your orders
                in play. Anyone set to <strong className="text-foreground">DM</strong> is played by
                the Dungeon Master — it acts, talks and fights on its own.
              </p>
              <p>
                Gear you list here is what a companion actually carries, so the DM uses it in
                scenes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function MemberCard({
  member,
  open,
  first,
  last,
  onToggle,
  onPatch,
  onMove,
  onRemove,
  onAddGear,
  onGearPatch,
  onGearRemove,
}: {
  member: PartyMember;
  open: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<PartyMember>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onAddGear: () => void;
  onGearPatch: (gearId: string, patch: Partial<PartyMember["gear"][number]>) => void;
  onGearRemove: (gearId: string) => void;
}) {
  return (
    <Card className={member.status !== "active" ? "opacity-70" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onToggle} className="text-left">
            <CardTitle className="font-display text-lg">{member.name || "Unnamed"}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {member.kind === "pc" ? "Player character" : "NPC companion"} · {member.role} · level{" "}
              {member.level} · HP {member.hp}/{member.maxHp} · AC {member.ac}
            </p>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={member.controlledBy === "dm" ? "default" : "secondary"}>
              {member.controlledBy === "dm" ? "DM runs" : "You run"}
            </Badge>
            {member.status !== "active" ? (
              <Badge variant="outline">{member.status}</Badge>
            ) : null}
            <Button size="icon" variant="ghost" disabled={first} onClick={() => onMove(-1)}>
              <ArrowUp className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" disabled={last} onClick={() => onMove(1)}>
              <ArrowDown className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onToggle}>
              {open ? "Close" : "Edit"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {open ? (
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <Input value={member.name} onChange={(e) => onPatch({ name: e.target.value })} />
            </Field>
            <Field label="Run by">
              <Select
                value={member.controlledBy}
                onValueChange={(v) => onPatch({ controlledBy: v as PartyMember["controlledBy"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">You</SelectItem>
                  <SelectItem value="dm">The Dungeon Master</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={member.tier ?? "companion"}
                onValueChange={(v) => onPatch({ tier: v as PartyTier })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={member.status}
                onValueChange={(v) => onPatch({ status: v as PartyMember["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">With the party</SelectItem>
                  <SelectItem value="benched">Left behind</SelectItem>
                  <SelectItem value="gone">Dead or departed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Role">
              <Select value={member.role} onValueChange={(v) => onPatch({ role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_PRESETS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Race">
              <Input value={member.race} onChange={(e) => onPatch({ race: e.target.value })} />
            </Field>
            <Field label="Classes">
              <Input
                value={member.classLine}
                placeholder="Fighter 3 / Rogue 1"
                onChange={(e) => onPatch({ classLine: e.target.value })}
              />
            </Field>
            <Field label="Attitude">
              <Select value={member.attitude} onValueChange={(v) => onPatch({ attitude: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTITUDES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <NumberField label="Level" value={member.level} onChange={(n) => onPatch({ level: n })} />
            <NumberField label="Gold" value={member.gold} onChange={(n) => onPatch({ gold: n })} />
            <NumberField label="Hit points" value={member.hp} onChange={(n) => onPatch({ hp: n })} />
            <NumberField label="Max hit points" value={member.maxHp} onChange={(n) => onPatch({ maxHp: n })} />
            <NumberField label="Armor class" value={member.ac} onChange={(n) => onPatch({ ac: n })} />
            <NumberField
              label="Initiative"
              value={member.initiative}
              onChange={(n) => onPatch({ initiative: n })}
            />
          </div>

          <Field label="Notes for the DM">
            <Textarea
              rows={2}
              value={member.notes}
              placeholder="Loyal but greedy; owes a debt in Karrun."
              onChange={(e) => onPatch({ notes: e.target.value })}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-primary">
                <Shield className="size-4" /> Outfitting
              </h3>
              <Button size="sm" variant="secondary" onClick={onAddGear}>
                <Plus className="size-3.5" /> Add gear
              </Button>
            </div>
            {member.gear.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carrying nothing yet.</p>
            ) : (
              <div className="space-y-2">
                {member.gear.map((g) => (
                  <div
                    key={g.id}
                    className="grid gap-2 rounded-lg border border-border/70 p-2 sm:grid-cols-[1fr_5rem_9rem_1fr_auto]"
                  >
                    <Input
                      value={g.name}
                      placeholder="Item"
                      onChange={(e) => onGearPatch(g.id, { name: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={g.quantity}
                      onChange={(e) =>
                        onGearPatch(g.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                    />
                    <Select value={g.slot} onValueChange={(v) => onGearPatch(g.id, { slot: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GEAR_SLOTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={g.notes}
                      placeholder="Notes"
                      onChange={(e) => onGearPatch(g.id, { notes: e.target.value })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => onGearRemove(g.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onRemove}>
              <Trash2 className="size-4 text-destructive" /> Remove from party
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </Field>
  );
}
