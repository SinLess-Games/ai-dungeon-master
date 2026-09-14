import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Bot,
  Heart,
  Map,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Swords,
  UserRound,
  Users,
} from "lucide-react";
import { getCampaign } from "../client/campaignCreatorApi";
import {
  getCampaignGameState,
  type CampaignGameActor,
  type CampaignGameEvent,
} from "../client/campaignPlayApi";

type PlayChannel = "campaign" | "ooc" | "character";

function eventTime(value: number) {
  const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function eventTitle(event: CampaignGameEvent) {
  const message = event.payload["message"];
  if (typeof message === "string" && message.trim()) return message;
  const narration = event.payload["narration"];
  if (typeof narration === "string" && narration.trim()) return narration;
  return event.type.replaceAll("_", " ").replaceAll(".", " · ");
}

function actorHealthLabel(actor: CampaignGameActor | null) {
  if (!actor?.health) return "No live health data";
  const temp = actor.health.temporaryHitPoints > 0 ? ` +${actor.health.temporaryHitPoints} temp` : "";
  return `${actor.health.currentHitPoints}/${actor.health.maximumHitPoints} HP${temp}`;
}

export function CampaignPlayScreen({
  campaignId,
  onBack,
}: {
  campaignId: string;
  onBack: () => void;
}) {
  const [channel, setChannel] = useState<PlayChannel>("campaign");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");

  const detail = useQuery({
    queryKey: ["campaigns", "play", campaignId, "detail"],
    queryFn: () => getCampaign(campaignId),
  });

  const playable = detail.data
    ? ["active", "paused"].includes(detail.data.campaign.status)
    : false;

  const game = useQuery({
    queryKey: ["campaigns", "play", campaignId, "state"],
    queryFn: () => getCampaignGameState(campaignId),
    enabled: playable,
    refetchInterval: 5_000,
  });

  const selectedCharacter = useMemo(() => {
    const characters = detail.data?.characters ?? [];
    if (characters.length === 0) return null;
    return characters.find((entry) => entry.id === selectedCharacterId) ?? characters[0] ?? null;
  }, [detail.data?.characters, selectedCharacterId]);

  const selectedActor = useMemo(() => {
    if (!selectedCharacter) return null;
    return (
      game.data?.actors.find((actor) => actor.characterId === selectedCharacter.id) ?? null
    );
  }, [game.data?.actors, selectedCharacter]);

  const conditions = useMemo(
    () =>
      selectedActor
        ? (game.data?.conditions.filter((condition) => condition.actorId === selectedActor.id) ?? [])
        : [],
    [game.data?.conditions, selectedActor],
  );

  const initiative = useMemo(() => {
    if (!selectedActor || !game.data?.encounter) return null;
    return (
      game.data.encounter.participants.find(
        (participant) => participant.actorId === selectedActor.id,
      ) ?? null
    );
  }, [game.data?.encounter, selectedActor]);

  if (detail.isLoading) {
    return <PlayState title="Opening the table…" body="Loading the campaign and party." />;
  }

  if (detail.error || !detail.data) {
    return (
      <PlayState
        title="Campaign could not be opened"
        body={detail.error?.message ?? "Campaign data was unavailable."}
        action={
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-border px-4 py-2.5 font-semibold"
          >
            Back to campaigns
          </button>
        }
      />
    );
  }

  const campaign = detail.data.campaign;

  if (!playable) {
    return (
      <PlayState
        title="This campaign is not in play yet"
        body="Finish setup and start the campaign before entering the campaign table."
        action={
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-border px-4 py-2.5 font-semibold"
          >
            Back to campaigns
          </button>
        }
      />
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(180,130,35,0.08),transparent_28%)] p-3 lg:p-5">
      <div className="mx-auto max-w-[1800px] overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/60 px-4 py-3 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to campaigns"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-gold/50 hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl font-semibold md:text-2xl">{campaign.name}</h1>
                <span className="hidden rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold sm:inline-flex">
                  {campaign.status}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {campaign.rulesetId.toUpperCase()} {campaign.rulesetVersion} · {campaign.playMode === "solo" ? "Solo" : "Multiplayer"} · {campaign.gameMasterMode === "ai" ? "AI Dungeon Master" : campaign.gameMasterMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5">
              <Radio className={`h-3.5 w-3.5 ${game.isError ? "text-destructive" : "text-emerald-500"}`} />
              {game.isError ? "State unavailable" : game.isFetching ? "Syncing" : "Live state"}
            </span>
            <button
              type="button"
              onClick={() => void game.refetch()}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:text-gold"
              aria-label="Refresh campaign state"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${game.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <div className="grid min-h-[720px] lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="border-b border-border bg-background/35 p-3 lg:border-b-0 lg:border-r">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Channels</p>
            <nav className="space-y-1">
              <ChannelButton
                active={channel === "campaign"}
                icon={<MessageSquare className="h-4 w-4" />}
                label="Campaign"
                detail="In-character table"
                onClick={() => setChannel("campaign")}
              />
              <ChannelButton
                active={channel === "ooc"}
                icon={<Bot className="h-4 w-4" />}
                label="OOC · DM"
                detail="Talk to the DM"
                onClick={() => setChannel("ooc")}
              />
              <ChannelButton
                active={channel === "character"}
                icon={<UserRound className="h-4 w-4" />}
                label="Character"
                detail="Sheet & live state"
                onClick={() => setChannel("character")}
              />
            </nav>

            <div className="mt-5 border-t border-border pt-4">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Party</p>
              <div className="space-y-1">
                {detail.data.characters.length ? (
                  detail.data.characters.map((character) => {
                    const actor = game.data?.actors.find((entry) => entry.characterId === character.id) ?? null;
                    const selected = selectedCharacter?.id === character.id;
                    return (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => {
                          setSelectedCharacterId(character.id);
                          setChannel("character");
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          selected
                            ? "border-gold/40 bg-gold/10"
                            : "border-transparent hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <span className="block truncate text-sm font-semibold">{character.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{actorHealthLabel(actor)}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-3 text-xs text-muted-foreground">No player characters are attached.</p>
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col bg-background/15">
            {channel === "campaign" ? (
              <CampaignChannel
                events={game.data?.events ?? []}
                actors={game.data?.actors ?? []}
                encounter={game.data?.encounter ?? null}
                composer={composer}
                setComposer={setComposer}
              />
            ) : null}
            {channel === "ooc" ? <OocDmChannel composer={composer} setComposer={setComposer} /> : null}
            {channel === "character" ? (
              <CharacterChannel
                name={selectedCharacter?.name ?? "No character selected"}
                status={selectedCharacter?.status ?? "unavailable"}
                actor={selectedActor}
                conditions={conditions}
                initiative={initiative}
              />
            ) : null}
          </section>

          <aside className="hidden border-l border-border bg-background/35 p-4 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">At a glance</p>
            <div className="mt-3 space-y-3">
              <SideCard icon={<Map className="h-4 w-4" />} title="World">
                <p>{game.data?.worldId ? "Persistent world connected" : "World state loading"}</p>
              </SideCard>
              <SideCard icon={<Users className="h-4 w-4" />} title="Party">
                <p>{detail.data.characters.length} character{detail.data.characters.length === 1 ? "" : "s"}</p>
              </SideCard>
              <SideCard icon={<Swords className="h-4 w-4" />} title="Encounter">
                {game.data?.encounter ? (
                  <p>Round {game.data.encounter.roundNumber} · {game.data.encounter.participants.length} participants</p>
                ) : (
                  <p>No active encounter</p>
                )}
              </SideCard>
              <SideCard icon={<Activity className="h-4 w-4" />} title="Event sequence">
                <p>{game.data?.sequence ?? 0}</p>
              </SideCard>
            </div>

            <div className="mt-5 rounded-xl border border-gold/25 bg-gold/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                <Sparkles className="h-4 w-4" /> Play screen foundation
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Campaign state and character health are live. Persistent campaign chat and OOC DM transport are the next backend slice.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CampaignChannel({
  events,
  actors,
  encounter,
  composer,
  setComposer,
}: {
  events: CampaignGameEvent[];
  actors: CampaignGameActor[];
  encounter: { roundNumber: number; currentActorId: string | null } | null;
  composer: string;
  setComposer: (value: string) => void;
}) {
  const names = useMemo(() => new Map(actors.map((actor) => [actor.id, actor.name])), [actors]);
  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Campaign channel</p>
            <h2 className="mt-1 font-display text-2xl">The Table</h2>
          </div>
          {encounter ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              Encounter · Round {encounter.roundNumber}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {events.length ? (
          events.slice(-40).map((event) => (
            <article key={event.id} className="rounded-xl border border-border bg-card/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gold">
                  {event.actorId ? names.get(event.actorId) ?? "Campaign" : "Campaign"}
                </span>
                <span className="text-[11px] text-muted-foreground">{eventTime(event.occurredAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{eventTitle(event)}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">#{event.sequence} · {event.type}</p>
            </article>
          ))
        ) : (
          <EmptyFeed
            icon={<MessageSquare className="h-7 w-7" />}
            title="The table is quiet"
            body="Live campaign events will appear here as the session unfolds."
          />
        )}
      </div>

      <Composer
        value={composer}
        onChange={setComposer}
        placeholder="Speak in character or describe an action…"
        note="Persistent campaign chat transport is not connected yet."
      />
    </>
  );
}

function OocDmChannel({ composer, setComposer }: { composer: string; setComposer: (value: string) => void }) {
  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Private channel</p>
        <h2 className="mt-1 font-display text-2xl">OOC with the Dungeon Master</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ask rules questions, clarify intent, or talk to the DM outside the fiction.</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyFeed
          icon={<Bot className="h-8 w-8" />}
          title="OOC DM channel is laid out"
          body="The next slice will connect this private channel to the AI Dungeon Master and persist its conversation separately from campaign chat."
        />
      </div>
      <Composer
        value={composer}
        onChange={setComposer}
        placeholder="Ask the DM out of character…"
        note="OOC DM transport is not connected yet."
      />
    </>
  );
}

function CharacterChannel({
  name,
  status,
  actor,
  conditions,
  initiative,
}: {
  name: string;
  status: string;
  actor: CampaignGameActor | null;
  conditions: Array<{ id: string; conditionId: string; remainingRounds: number | null }>;
  initiative: { initiativeTotal: number; turnOrder: number } | null;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Character view</p>
            <h2 className="mt-1 font-display text-3xl">{name}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{status}</p>
          </div>
          {actor?.health ? (
            <span className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold capitalize">
              {actor.health.state}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Heart className="h-5 w-5" />} label="Hit Points" value={actor?.health ? `${actor.health.currentHitPoints} / ${actor.health.maximumHitPoints}` : "—"} />
          <StatCard icon={<Shield className="h-5 w-5" />} label="Temporary HP" value={actor?.health ? String(actor.health.temporaryHitPoints) : "—"} />
          <StatCard icon={<Swords className="h-5 w-5" />} label="Initiative" value={initiative ? String(initiative.initiativeTotal) : "—"} />
          <StatCard icon={<Activity className="h-5 w-5" />} label="Conditions" value={String(conditions.length)} />
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card/70 p-5">
          <h3 className="font-display text-xl">Active conditions</h3>
          {conditions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <span key={condition.id} className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm">
                  {condition.conditionId.replaceAll("_", " ")}
                  {condition.remainingRounds === null ? "" : ` · ${condition.remainingRounds} rounds`}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No active conditions.</p>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card/70 p-5">
          <h3 className="font-display text-xl">Live combat state</h3>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <InfoLine label="Actor status" value={actor?.status ?? "Not hydrated"} />
            <InfoLine label="Turn order" value={initiative ? String(initiative.turnOrder + 1) : "Not in encounter"} />
            <InfoLine label="Stable" value={actor?.health ? (actor.health.stable ? "Yes" : "No") : "—"} />
            <InfoLine label="Nonlethal" value={actor?.health ? String(actor.health.nonlethalDamage) : "—"} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  placeholder,
  note,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  note: string;
}) {
  return (
    <div className="border-t border-border bg-card/60 p-4">
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-14 flex-1 resize-none rounded-xl border border-border bg-background/70 px-3 py-2.5 text-sm outline-none focus:border-gold/50"
        />
        <button
          type="button"
          disabled
          title={note}
          className="grid w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function ChannelButton({
  active,
  icon,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        active ? "border-gold/40 bg-gold/10" : "border-transparent hover:border-border hover:bg-muted/30"
      }`}
    >
      <span className={active ? "text-gold" : "text-muted-foreground"}>{icon}</span>
      <span className="min-w-0">
        <strong className="block truncate text-sm">{label}</strong>
        <small className="block truncate text-[11px] text-muted-foreground">{detail}</small>
      </span>
    </button>
  );
}

function SideCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm font-medium">{children}</div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className="mt-3 font-display text-2xl">{value}</p>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <strong className="capitalize">{value}</strong>
    </div>
  );
}

function EmptyFeed({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">{icon}</div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function PlayState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{body}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}
