import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { Dices, Send, Swords, Heart, Coins, Scroll, Sparkles, User, Users, Map as MapIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCampaign, getCharacter, getWorld, saveCampaign, saveCharacter, pushRoll } from "@/lib/storage";
import { ensureCampaignWorld } from "@/lib/campaign-world";
import { WorldMapView } from "@/components/WorldMapView";
import { LocalMapView } from "@/components/LocalMapView";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { regionAt } from "@/lib/world";
import { buildDmContext } from "@/lib/dm-context";
import { applyDmTool } from "@/lib/dm-tools";
import { pickOpening } from "@/prompts/dungeon-master/openings";
import { computeCharacter, formatMod } from "@/lib/rules/engine";
import { parseNotation, roll as rollDice } from "@/lib/dice";
import { ABILITY_NAMES, type AbilityKey } from "@/lib/rules/types";
import type { Campaign } from "@/lib/campaign";
import type { Character } from "@/lib/rules/character";

export const Route = createFileRoute("/campaigns/$id")({
  head: () => ({
    meta: [
      { title: "At the table — The Endless Codex" },
      {
        name: "description",
        content:
          "Play your D&D 3.5 campaign with The Endless Codex, an AI Dungeon Master that tracks HP, XP, loot, NPCs, quests and alignment as you play.",
      },
      { property: "og:title", content: "At the table — The Endless Codex" },
      {
        property: "og:description",
        content: "Narrated solo D&D 3.5 play with live rules-accurate character tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TablePage,
});

function TablePage() {
  const { id } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getCampaign(id);
    // Every campaign owns an overland map. Draw one the first time it is opened
    // so the DM has real geography and the player can always see where they are.
    const g = found ? saveCampaign(ensureCampaignWorld(found).campaign) : undefined;
    setCampaign(g ?? null);
    setCharacter(g ? getCharacter(g.characterId) ?? null : null);
    setLoaded(true);
  }, [id]);

  if (!loaded) return <AppShell>{null}</AppShell>;

  if (!campaign || !character) {
    return (
      <AppShell>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This campaign could not be found on this device.</p>
            <Button asChild className="mt-4">
              <Link to="/campaigns">Back to campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <Table
      key={campaign.id}
      initialCampaign={campaign}
      initialCharacter={character}
      onState={(g, c) => {
        setCampaign(g);
        setCharacter(c);
      }}
    />
  );
}

function Table({
  initialCampaign,
  initialCharacter,
  onState,
}: {
  initialCampaign: Campaign;
  initialCharacter: Character;
  onState: (g: Campaign, c: Character) => void;
}) {
  const campaignRef = useRef<Campaign>(initialCampaign);
  const characterRef = useRef<Character>(initialCharacter);
  const [, force] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const commit = useCallback(
    (g: Campaign, c: Character) => {
      campaignRef.current = saveCampaign(g);
      characterRef.current = saveCharacter(c);
      onState(campaignRef.current, characterRef.current);
      force((n) => n + 1);
    },
    [onState],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            context: buildDmContext(characterRef.current, campaignRef.current),
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, addToolResult } = useChat({
    id: initialCampaign.id,
    messages: initialCampaign.messages as unknown as UIMessage[],
    transport,
    // Once every tool call has a result, hand the turn back to the DM so it
    // narrates the outcome.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (e) => setError(e.message),
    onToolCall: async ({ toolCall }) => {
      const applied = applyDmTool(
        toolCall.toolName,
        toolCall.input as Record<string, unknown>,
        characterRef.current,
        campaignRef.current,
      );
      if (!applied) return; // requestRoll: the player rolls it
      commit(applied.campaign, applied.character);
      addToolResult({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: applied.output,
      });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  // Persist the transcript with the save.
  useEffect(() => {
    if (!messages.length) return;
    const g = { ...campaignRef.current, messages: messages as unknown as Campaign["messages"] };
    campaignRef.current = saveCampaign(g);
  }, [messages]);

  // Keep the transcript pinned to the newest text without ever moving the
  // page itself: scroll only the chat's own ScrollArea viewport so the
  // composer and card frame stay exactly where they are while the DM streams.
  useEffect(() => {
    const viewport = bottomRef.current?.closest<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!viewport) return;
    if (busy) {
      viewport.scrollTop = viewport.scrollHeight;
    } else {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages, busy]);

  // The DM always opens the campaign: fire the opening narration once when a
  // fresh table has no transcript yet.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || messages.length > 0 || busy) return;
    autoStarted.current = true;
    void sendMessage({
      text: pickOpening(campaignRef.current),
      metadata: { hidden: true },
    } as any);
  }, [messages.length, busy, sendMessage]);

  useEffect(() => {
    if (!busy) composerRef.current?.focus();
  }, [busy]);

  const derived = computeCharacter(characterRef.current);
  const campaign = campaignRef.current;
  const character = characterRef.current;

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setError(null);
    setInput("");
    void sendMessage({ text: t });
  }

  function playerRoll(toolCallId: string, toolName: string, input: any) {
    const parsed = parseNotation(String(input.notation ?? "d20")) ?? {
      count: 1,
      sides: 20,
      modifier: 0,
    };
    // The app owns the modifiers: if the DM named a skill or ability we use the
    // sheet's number and ignore any modifier baked into the notation.
    const skill = input.skillId
      ? derived.skills.find((s) => s.id === input.skillId || s.name === input.skillId)
      : undefined;
    const mod = skill
      ? skill.total
      : input.ability && input.ability !== "none"
        ? derived.abilityMods[input.ability as AbilityKey] ?? 0
        : parsed.modifier;

    const r = rollDice(parsed.count, parsed.sides, mod, String(input.reason ?? "DM request"));
    pushRoll({
      id: r.id,
      notation: r.notation,
      label: String(input.reason ?? ""),
      total: r.total,
      at: r.at,
      characterName: character.name,
    });
    const breakdown = `${r.rolls.slice(0, 12).join(" + ")}${mod ? ` ${formatMod(mod)}` : ""}`;
    addToolResult({
      tool: toolName,
      toolCallId,
      output: `Player rolled ${r.notation} for ${input.reason}: ${breakdown} = ${r.total}${
        input.dc ? ` (DC ${input.dc})` : ""
      }`,
    });
  }

  const started = messages.length > 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{campaign.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.scene.location}
            {campaign.scene.region ? ` · ${campaign.scene.region}` : ""} · {campaign.scene.timeOfDay} ·{" "}
            {campaign.scene.weather}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WorldMapButton campaign={campaign} />
          {campaign.scene.inCombat ? (
            <Badge className="gap-1">
              <Swords className="size-3" /> Combat · round {campaign.scene.round}
            </Badge>
          ) : null}
          {campaign.styles.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
          <Badge variant="secondary">{campaign.type}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="flex h-[70vh] flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-5 py-4">
            {!started ? (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto size-8 animate-pulse text-primary" />
                <p className="mt-4 text-muted-foreground">
                  The DM is setting the opening scene…
                </p>
              </div>
            ) : null}

            <div className="space-y-5">
              {messages.map((m, mi) => (
                (m.role === "user" &&
                  (mi === 0 || (m as any).metadata?.hidden)) ? null : (
                <div key={m.id} className="space-y-2">
                  {m.parts.map((part: any, i: number) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={i}
                          className={
                            m.role === "user"
                              ? "ml-auto max-w-[85%] rounded-lg bg-accent/60 px-4 py-2 text-sm"
                            : "max-w-[95%] text-[0.95rem] leading-relaxed"
                          }
                        >
                          {m.role === "user" ? (
                            <span className="flex items-start gap-2">
                              <User className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                              <span>{part.text}</span>
                            </span>
                          ) : (
                            <Markdown text={part.text} />
                          )}
                        </div>
                      );
                    }
                    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                      const toolName = part.type.slice(5);
                      if (toolName === "requestRoll" && part.state === "input-available") {
                        return (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3"
                          >
                            <Dices className="size-4 text-primary" />
                            <span className="text-sm">
                              {part.input.reason} — roll{" "}
                              <strong>{part.input.notation}</strong>
                              {part.input.dc ? ` (DC ${part.input.dc})` : ""}
                            </span>
                            <Button
                              size="sm"
                              className="ml-auto"
                              onClick={() => playerRoll(part.toolCallId, toolName, part.input)}
                            >
                              Roll
                            </Button>
                          </div>
                        );
                      }
                      if (part.state === "output-available") {
                        return (
                          <p
                            key={i}
                            className="rounded border-l-2 border-primary/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
                          >
                            {toolName === "dmRoll"
                              ? `DM rolled ${part.output?.notation} for ${part.output?.reason}: ${part.output?.total}`
                              : String(part.output)}
                          </p>
                        );
                      }
                      return null;
                    }
                    return null;
                  })}
                </div>
                )
              ))}
              {busy ? (
                <p className="animate-pulse text-sm text-muted-foreground">The DM is thinking…</p>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/70 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                aria-label="Tell the Dungeon Master what you do"
                ref={composerRef}
                rows={2}
                autoFocus
                value={input}
                placeholder="What do you do?"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <Button onClick={() => send(input)} disabled={busy || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between font-display text-lg">
                <Link to="/characters/$id" params={{ id: character.id }}>
                  {character.name || "Unnamed"}
                </Link>
                <span className="text-xs font-normal text-muted-foreground">
                  ECL {derived.ecl}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-destructive" />
                <span className="font-medium">
                  {character.hp.current}/{derived.hpMax} HP
                </span>
                {character.hp.temp ? (
                  <Badge variant="secondary">+{character.hp.temp} temp</Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                <span>AC {derived.ac.total}</span>
                <span>Init {formatMod(derived.initiative)}</span>
                <span>Fort {formatMod(derived.saves.fort)}</span>
                <span>Ref {formatMod(derived.saves.ref)}</span>
                <span>Will {formatMod(derived.saves.will)}</span>
                <span>BAB {formatMod(derived.bab)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="size-4" /> {character.gold} gp · XP {character.xp}
              </div>
              {character.conditions.length ? (
                <div className="flex flex-wrap gap-1">
                  {character.conditions.map((c) => (
                    <Badge key={c} variant="destructive">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                {(Object.keys(ABILITY_NAMES) as AbilityKey[]).map((a) => (
                  <span key={a}>
                    {a.toUpperCase()} {derived.abilityScores[a]} (
                    {formatMod(derived.abilityMods[a])})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Users className="size-4" /> Party
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(campaign.party ?? []).filter((m) => m.status === "active").length ? (
                (campaign.party ?? [])
                  .filter((m) => m.status === "active")
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {m.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {m.role} · {m.hp}/{m.maxHp} HP
                        </span>
                      </span>
                      <Badge variant={m.controlledBy === "dm" ? "default" : "secondary"}>
                        {m.controlledBy === "dm" ? "DM" : "You"}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground">Travelling alone.</p>
              )}
              <Button variant="secondary" size="sm" className="w-full" asChild>
                <Link to="/party/$campaignId" params={{ campaignId: campaign.id }}>
                  Manage party &amp; companions
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Quests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {campaign.quests.length ? (
                campaign.quests.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium">
                      {q.title}{" "}
                      <Badge variant={q.status === "active" ? "secondary" : "outline"}>
                        {q.status}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">{q.detail}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nothing yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">NPCs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {campaign.npcs.length ? (
                campaign.npcs.map((n) => (
                  <div key={n.id}>
                    <p className="font-medium">
                      {n.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        {n.role} · {n.attitude}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{n.notes}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nobody met yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Scroll className="size-4" /> Campaign log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {campaign.journal.length ? (
                campaign.journal.slice(0, 12).map((j) => <p key={j.id}>· {j.text}</p>)
              ) : (
                <p>The story has not started.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


/**
 * The overland map, openable at any moment during play. The marker is whatever
 * the DM last set with moveParty.
 */
function WorldMapButton({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const world = useMemo(
    () => (open || campaign.worldId ? getWorld(campaign.worldId ?? "") : undefined),
    [open, campaign.worldId, tick],
  );
  const here = world?.sites.find((s) => s.id === world.party.siteId);
  const region = world ? regionAt(world, world.party.x, world.party.y) : undefined;
  const openSite = world?.sites.find((s) => s.id === siteId);
  const worldArt = useMapArt(world?.artPath);
  const siteArt = useMapArt(openSite?.artPath);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSiteId(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MapIcon className="mr-2 size-4" /> World map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] w-[98vw] max-w-[1600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {openSite ? openSite.name : "The world"}
          </DialogTitle>
        </DialogHeader>
        {world ? (
          openSite ? (
            <div className="space-y-4">
              <LocalMapView
                site={openSite}
                artUrl={siteArt}
                className="h-[72vh] w-full rounded-lg border"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {openSite.description || "A local plan of the place, drawn as the party knows it."}
                </p>
                <div className="flex items-center gap-2">
                  <PaintMapButton
                    world={world}
                    site={openSite}
                    onPainted={() => setTick((t) => t + 1)}
                  />
                  <Button variant="outline" size="sm" onClick={() => setSiteId(null)}>
                    Back to the world
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <WorldMapView
                world={world}
                artUrl={worldArt}
                showUndiscovered={false}
                onSelectSite={(s) => setSiteId(s.id)}
                className="h-[74vh] w-full"
              />
              <p className="text-sm text-muted-foreground">
                You are at <strong className="text-foreground">{here?.name ?? "open country"}</strong>
                {region ? ` in ${region.name} (${region.terrain})` : ""}. Drag to move the map, scroll to zoom,
                and click any place to open its local map.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PaintMapButton world={world} onPainted={() => setTick((t) => t + 1)} />
                <Button asChild variant="outline" size="sm">
                  <Link to="/worlds/$worldId" params={{ worldId: world.id }}>
                    Open the full atlas
                  </Link>
                </Button>
              </div>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            The DM is still drawing this world. Check back after the opening scene.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

