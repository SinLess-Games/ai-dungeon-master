import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Bot,
  Heart,
  Map,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Swords,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client/authClient";
import { getCampaign, pauseCampaign, resumeCampaign } from "../client/campaignCreatorApi";
import {
  endCampaignTurn,
  getCampaignGameState,
  getPendingCampaignDmAction,
  listCampaignPlayMessages,
  resolveCampaignDmAction,
  sendCampaignPlayMessage,
  type CampaignEncounter,
  type CampaignEncounterParticipant,
  type CampaignGameActor,
  type CampaignGameEvent,
  type CampaignPlayMessage,
  type CampaignPlayMessageChannel,
} from "../client/campaignPlayApi";
import { CampaignCastingPanel } from "./CampaignCastingPanel";
import { CampaignDmCheckRequest } from "./CampaignDmCheckRequest";
import { CampaignResolutionPanel } from "./CampaignResolutionPanel";

type PlayChannel = "campaign" | "ooc" | "character";

type TimelineEntry =
  | { kind: "message"; id: string; at: number; message: CampaignPlayMessage }
  | { kind: "event"; id: string; at: number; event: CampaignGameEvent };

function epochMilliseconds(value: number) {
  return value < 10_000_000_000 ? value * 1000 : value;
}

function eventTime(value: number) {
  const date = new Date(epochMilliseconds(value));
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
  const temp =
    actor.health.temporaryHitPoints > 0 ? ` +${actor.health.temporaryHitPoints} temp` : "";
  return `${actor.health.currentHitPoints}/${actor.health.maximumHitPoints} HP${temp}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The table could not complete that request.";
}

function apiChannel(channel: PlayChannel): CampaignPlayMessageChannel {
  return channel === "ooc" ? "ooc_dm" : "campaign";
}

export function CampaignPlayScreen({
  campaignId,
  onBack,
}: {
  campaignId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const currentUserId = session.data?.user.id ?? null;
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
    refetchInterval: 4_000,
    retry: 1,
  });

  const messageChannel = apiChannel(channel);
  const messages = useQuery({
    queryKey: ["campaigns", "play", campaignId, "messages", messageChannel],
    queryFn: () => listCampaignPlayMessages(campaignId, messageChannel),
    enabled: playable && channel !== "character",
    refetchInterval: 4_000,
  });

  const pendingDmAction = useQuery({
    queryKey: ["campaigns", "play", campaignId, "dm-action"],
    queryFn: () => getPendingCampaignDmAction(campaignId),
    enabled: playable,
    refetchInterval: 4_000,
    retry: 1,
  });

  const controlledCharacterIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentUserId) return ids;
    for (const character of detail.data?.characters ?? []) {
      if (character.ownerUserId === currentUserId) ids.add(character.id);
    }
    for (const actor of game.data?.actors ?? []) {
      if (actor.controllerUserId === currentUserId && actor.characterId) ids.add(actor.characterId);
    }
    return ids;
  }, [currentUserId, detail.data?.characters, game.data?.actors]);

  const selectedCharacter = useMemo(() => {
    const characters = detail.data?.characters ?? [];
    if (characters.length === 0) return null;
    return (
      characters.find((entry) => entry.id === selectedCharacterId) ??
      characters.find((entry) => controlledCharacterIds.has(entry.id)) ??
      characters[0] ??
      null
    );
  }, [controlledCharacterIds, detail.data?.characters, selectedCharacterId]);

  const speakingCharacter = useMemo(() => {
    const characters = detail.data?.characters ?? [];
    if (selectedCharacter && controlledCharacterIds.has(selectedCharacter.id)) {
      return selectedCharacter;
    }
    return characters.find((entry) => controlledCharacterIds.has(entry.id)) ?? null;
  }, [controlledCharacterIds, detail.data?.characters, selectedCharacter]);

  const selectedActor = useMemo(() => {
    if (!selectedCharacter) return null;
    return game.data?.actors.find((actor) => actor.characterId === selectedCharacter.id) ?? null;
  }, [game.data?.actors, selectedCharacter]);

  const currentTurnActor = useMemo(() => {
    const actorId = game.data?.encounter?.currentActorId;
    if (!actorId) return null;
    return game.data?.actors.find((actor) => actor.id === actorId) ?? null;
  }, [game.data?.actors, game.data?.encounter?.currentActorId]);

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

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = (messages.data ?? []).map((message) => ({
      kind: "message",
      id: `message:${message.id}`,
      at: epochMilliseconds(message.createdAt),
      message,
    }));
    if (channel === "campaign") {
      entries.push(
        ...(game.data?.events ?? []).map((event) => ({
          kind: "event" as const,
          id: `event:${event.id}`,
          at: epochMilliseconds(event.occurredAt),
          event,
        })),
      );
    }
    return entries.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  }, [channel, game.data?.events, messages.data]);

  const send = useMutation({
    mutationFn: () =>
      sendCampaignPlayMessage(campaignId, {
        channel: apiChannel(channel),
        content: composer.trim(),
        ...(channel === "campaign" && speakingCharacter
          ? { characterId: speakingCharacter.id }
          : {}),
      }),
    onSuccess: async (result) => {
      setComposer("");
      if (result.pendingAction) {
        queryClient.setQueryData(
          ["campaigns", "play", campaignId, "dm-action"],
          result.pendingAction,
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["campaigns", "play", campaignId, "messages", apiChannel(channel)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["campaigns", "play", campaignId, "dm-action"],
        }),
      ]);
      if (result.aiError) toast.warning(result.aiError);
      else if (result.awaitingHumanDm) {
        toast.info("Message sent. Waiting for the Game Master.");
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const resolveDmAction = useMutation({
    mutationFn: (roll: number) => {
      const action = pendingDmAction.data;
      if (!action) throw new Error("There is no pending Dungeon Master roll to resolve.");
      return resolveCampaignDmAction(campaignId, action.id, roll);
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(
        ["campaigns", "play", campaignId, "dm-action"],
        result.pendingAction,
      );

      if (result.aiError) {
        toast.warning(result.aiError);
      } else if (result.pendingAction) {
        toast.info("Roll resolved. The Dungeon Master requests another roll.");
      } else {
        toast.success("Roll resolved by the rules engine.");
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["campaigns", "play", campaignId, "messages", "campaign"],
        }),
        game.refetch(),
      ]);
    },
    onError: async (error) => {
      toast.error(errorMessage(error));
      await pendingDmAction.refetch();
    },
  });

  const endTurn = useMutation({
    mutationFn: () => {
      if (!game.data?.encounter || !currentTurnActor) {
        throw new Error("There is no current encounter turn to end.");
      }
      return endCampaignTurn(campaignId, game.data.encounter.id, currentTurnActor.id);
    },
    onSuccess: async () => {
      toast.success("Turn ended.");
      await game.refetch();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const lifecycle = useMutation({
    mutationFn: async () => {
      const status = detail.data?.campaign.status;
      if (status === "active") return pauseCampaign(campaignId);
      if (status === "paused") return resumeCampaign(campaignId);
      throw new Error("This campaign cannot be paused or resumed from its current state.");
    },
    onSuccess: async (result) => {
      toast.success(result.status === "paused" ? "Campaign paused." : "Campaign resumed.");
      await Promise.all([
        detail.refetch(),
        game.refetch(),
        pendingDmAction.refetch(),
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
      ]);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const campaignStatus = detail.data?.campaign.status;
  const hasGameMasterControl = detail.data?.role === "owner" || detail.data?.role === "gm";
  const canEndTurn = Boolean(
    campaignStatus === "active" &&
      currentTurnActor &&
      (hasGameMasterControl ||
        (currentUserId && currentTurnActor.controllerUserId === currentUserId)),
  );
  const canControlSelectedActor = Boolean(
    campaignStatus === "active" &&
      selectedActor &&
      (hasGameMasterControl || (currentUserId && selectedActor.controllerUserId === currentUserId)),
  );
  const canManageLifecycle = Boolean(
    hasGameMasterControl && (campaignStatus === "active" || campaignStatus === "paused"),
  );
  const campaignComposerBlocked = channel === "campaign" && Boolean(pendingDmAction.data);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !composer.trim() ||
      send.isPending ||
      channel === "character" ||
      campaignComposerBlocked
    ) {
      return;
    }
    send.mutate();
  }

  async function refreshTable() {
    await Promise.all([
      detail.refetch(),
      game.refetch(),
      pendingDmAction.refetch(),
      channel === "character" ? Promise.resolve() : messages.refetch(),
    ]);
  }

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
                <h1 className="truncate font-display text-xl font-semibold md:text-2xl">
                  {campaign.name}
                </h1>
                <span className="hidden rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold sm:inline-flex">
                  {campaign.status}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {campaign.rulesetId.toUpperCase()} {campaign.rulesetVersion} ·{" "}
                {campaign.playMode === "solo" ? "Solo" : "Multiplayer"} ·{" "}
                {campaign.gameMasterMode === "ai" ? "AI Dungeon Master" : campaign.gameMasterMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {canManageLifecycle ? (
              <button
                type="button"
                disabled={lifecycle.isPending}
                onClick={() => lifecycle.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-semibold transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
              >
                {campaign.status === "paused" ? (
                  <PlayCircle className="h-3.5 w-3.5" />
                ) : (
                  <PauseCircle className="h-3.5 w-3.5" />
                )}
                {lifecycle.isPending
                  ? "Updating…"
                  : campaign.status === "paused"
                    ? "Resume"
                    : "Pause"}
              </button>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5">
              <Radio
                className={`h-3.5 w-3.5 ${
                  campaign.status === "paused"
                    ? "text-amber-500"
                    : game.isError
                      ? "text-amber-500"
                      : "text-emerald-500"
                }`}
              />
              {campaign.status === "paused"
                ? "Paused · history live"
                : game.isError
                  ? "Chat live · game state unavailable"
                  : game.isFetching
                    ? "Syncing"
                    : "Live table"}
            </span>
            <button
              type="button"
              onClick={() => void refreshTable()}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:text-gold"
              aria-label="Refresh campaign table"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  game.isFetching || messages.isFetching || pendingDmAction.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>
        </header>

        {campaign.status === "paused" ? (
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
            Campaign play is paused. Chat, OOC DM, character state, and history remain available;
            rules-engine actions are read-only until play resumes.
          </div>
        ) : null}

        <div className="grid min-h-[720px] lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="border-b border-border bg-background/35 p-3 lg:border-b-0 lg:border-r">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Channels
            </p>
            <nav className="space-y-1">
              <ChannelButton
                active={channel === "campaign"}
                icon={<MessageSquare className="h-4 w-4" />}
                label="Campaign"
                detail="In-character table"
                onClick={() => {
                  setChannel("campaign");
                  setComposer("");
                }}
              />
              <ChannelButton
                active={channel === "ooc"}
                icon={<Bot className="h-4 w-4" />}
                label="OOC · DM"
                detail="Private DM chat"
                onClick={() => {
                  setChannel("ooc");
                  setComposer("");
                }}
              />
              <ChannelButton
                active={channel === "character"}
                icon={<UserRound className="h-4 w-4" />}
                label="Character"
                detail="Sheet & live state"
                onClick={() => {
                  setChannel("character");
                  setComposer("");
                }}
              />
            </nav>

            <div className="mt-5 border-t border-border pt-4">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Party
              </p>
              <div className="space-y-1">
                {detail.data.characters.length ? (
                  detail.data.characters.map((character) => {
                    const actor =
                      game.data?.actors.find((entry) => entry.characterId === character.id) ?? null;
                    const selected = selectedCharacter?.id === character.id;
                    const controlled = controlledCharacterIds.has(character.id);
                    return (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => setSelectedCharacterId(character.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          selected
                            ? "border-gold/40 bg-gold/10"
                            : "border-transparent hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{character.name}</span>
                          {controlled ? (
                            <span className="shrink-0 rounded-full border border-gold/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold">
                              You
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {actorHealthLabel(actor)}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    No player characters are attached.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col bg-background/15">
            {channel === "campaign" ? (
              <ConversationChannel
                title="The Table"
                eyebrow="Campaign channel"
                description="In-character actions, dialogue, DM narration, and authoritative game events share one timeline."
                timeline={timeline}
                actors={game.data?.actors ?? []}
                encounter={game.data?.encounter ?? null}
                loading={messages.isLoading}
                error={messages.error ? errorMessage(messages.error) : null}
              />
            ) : null}

            {channel === "ooc" ? (
              <ConversationChannel
                title="OOC with the Dungeon Master"
                eyebrow="Private channel"
                description="Rules questions and table talk here are private to you and the Dungeon Master."
                timeline={timeline}
                actors={[]}
                encounter={null}
                loading={messages.isLoading}
                error={messages.error ? errorMessage(messages.error) : null}
              />
            ) : null}

            {channel === "character" ? (
              <CharacterChannel
                campaignId={campaignId}
                name={selectedCharacter?.name ?? "No character selected"}
                status={selectedCharacter?.status ?? "unavailable"}
                actor={selectedActor}
                actors={game.data?.actors ?? []}
                conditions={conditions}
                initiative={initiative}
                canControl={canControlSelectedActor}
                onResolved={async () => {
                  await game.refetch();
                }}
              />
            ) : null}

            {channel === "campaign" && pendingDmAction.data ? (
              <CampaignDmCheckRequest
                action={pendingDmAction.data}
                disabled={resolveDmAction.isPending || campaign.status !== "active"}
                onResolve={(roll) => resolveDmAction.mutate(roll)}
              />
            ) : null}

            {channel !== "character" ? (
              <Composer
                value={composer}
                onChange={setComposer}
                onSubmit={submit}
                pending={send.isPending}
                disabled={campaignComposerBlocked}
                placeholder={
                  channel === "campaign"
                    ? campaignComposerBlocked
                      ? "Resolve the Dungeon Master's requested roll first…"
                      : "Speak in character or describe what you do…"
                    : "Ask the Dungeon Master privately…"
                }
                note={
                  channel === "campaign"
                    ? campaignComposerBlocked
                      ? "The Dungeon Master is waiting on an authoritative d20 result before the scene continues."
                      : speakingCharacter
                        ? `Speaking as ${speakingCharacter.name}. Mechanical outcomes remain authoritative through the rules engine.`
                        : "No controlled character selected; this message will be sent as you rather than as another player's character."
                    : "Only you and the Dungeon Master can hydrate this conversation."
                }
              />
            ) : null}
          </section>

          <aside className="hidden border-l border-border bg-background/35 p-4 lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              At a glance
            </p>
            <div className="mt-3 space-y-3">
              <SideCard icon={<Map className="h-4 w-4" />} title="World">
                <p>
                  {game.data?.worldId ? "Persistent world connected" : "World state unavailable"}
                </p>
              </SideCard>
              <SideCard icon={<Users className="h-4 w-4" />} title="Party">
                <p>
                  {detail.data.characters.length} character
                  {detail.data.characters.length === 1 ? "" : "s"}
                </p>
              </SideCard>
              <SideCard icon={<Swords className="h-4 w-4" />} title="Encounter">
                {game.data?.encounter ? (
                  <div className="space-y-2">
                    <p>
                      Round {game.data.encounter.roundNumber} ·{" "}
                      {game.data.encounter.participants.length} participants
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current turn: {currentTurnActor?.name ?? "Unknown actor"}
                    </p>
                    {canEndTurn ? (
                      <button
                        type="button"
                        disabled={endTurn.isPending}
                        onClick={() => endTurn.mutate()}
                        className="w-full rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/15 disabled:opacity-50"
                      >
                        {endTurn.isPending ? "Ending turn…" : "End turn"}
                      </button>
                    ) : null}
                  </div>
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
                <Sparkles className="h-4 w-4" /> Campaign play MVP
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Persistent campaign/OOC chat, structured AI DM check requests, authoritative
                player rolls, combat, saves, spells, powers, encounter turns, and runtime character
                state now share the campaign table.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ConversationChannel({
  title,
  eyebrow,
  description,
  timeline,
  actors,
  encounter,
  loading,
  error,
}: {
  title: string;
  eyebrow: string;
  description: string;
  timeline: TimelineEntry[];
  actors: CampaignGameActor[];
  encounter: CampaignEncounter | null;
  loading: boolean;
  error: string | null;
}) {
  const names = useMemo(
    () => new globalThis.Map<string, string>(actors.map((actor) => [actor.id, actor.name] as const)),
    [actors],
  );
  return (
    <>
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              {eyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {encounter ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              Encounter · Round {encounter.roundNumber}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading conversation…</p>
        ) : timeline.length ? (
          timeline.map((entry) =>
            entry.kind === "message" ? (
              <MessageCard key={entry.id} message={entry.message} />
            ) : (
              <EventCard
                key={entry.id}
                event={entry.event}
                actorName={entry.event.actorId ? names.get(entry.event.actorId) : undefined}
              />
            ),
          )
        ) : (
          <EmptyFeed
            icon={<MessageSquare className="h-7 w-7" />}
            title="The conversation starts here"
            body="Send a message below. Campaign messages persist with the world, and private OOC messages stay scoped to your DM conversation."
          />
        )}
      </div>
    </>
  );
}

function MessageCard({ message }: { message: CampaignPlayMessage }) {
  const dm = message.authorKind === "dm";
  const system = message.authorKind === "system";
  return (
    <article
      className={`rounded-xl border p-4 ${
        dm
          ? "border-gold/30 bg-gold/5"
          : system
            ? "border-border bg-muted/20"
            : "border-border bg-card/75"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            dm ? "text-gold" : "text-foreground"
          }`}
        >
          {dm ? <Bot className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
          {message.authorName}
          {dm ? (
            <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              DM
            </span>
          ) : null}
        </span>
        <span className="text-[11px] text-muted-foreground">{eventTime(message.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {message.content}
      </p>
    </article>
  );
}

function EventCard({
  event,
  actorName,
}: {
  event: CampaignGameEvent;
  actorName?: string | undefined;
}) {
  return (
    <article className="rounded-xl border border-dashed border-border bg-background/30 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> {actorName ?? "Rules engine"}
        </span>
        <span className="text-[11px] text-muted-foreground">{eventTime(event.occurredAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground/80">{eventTitle(event)}</p>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        #{event.sequence} · {event.type}
      </p>
    </article>
  );
}

function CharacterChannel({
  campaignId,
  name,
  status,
  actor,
  actors,
  conditions,
  initiative,
  canControl,
  onResolved,
}: {
  campaignId: string;
  name: string;
  status: string;
  actor: CampaignGameActor | null;
  actors: CampaignGameActor[];
  conditions: Array<{ id: string; conditionId: string; remainingRounds: number | null }>;
  initiative: CampaignEncounterParticipant | null;
  canControl: boolean;
  onResolved: () => Promise<unknown> | unknown;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Character channel
          </p>
          <h2 className="mt-1 font-display text-3xl">{name}</h2>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {status} · {actor?.status ?? "not in live scene"}
          </p>
        </div>
        {initiative ? (
          <span className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold">
            Initiative {initiative.initiativeTotal}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Heart className="h-5 w-5" />} label="Health">
          {actor?.health ? (
            <>
              <strong className="text-2xl">
                {actor.health.currentHitPoints}/{actor.health.maximumHitPoints}
              </strong>
              <span className="mt-1 block text-xs text-muted-foreground">
                {actor.health.temporaryHitPoints} temp · {actor.health.nonlethalDamage} nonlethal ·{" "}
                {actor.health.state}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No live health data</span>
          )}
        </StatCard>
        <StatCard icon={<Shield className="h-5 w-5" />} label="Conditions">
          {conditions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((condition) => (
                <span
                  key={condition.id}
                  className="rounded-full border border-border px-2 py-1 text-xs"
                >
                  {condition.conditionId}
                  {condition.remainingRounds === null ? "" : ` · ${condition.remainingRounds}r`}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No active conditions</span>
          )}
        </StatCard>
        <StatCard icon={<Swords className="h-5 w-5" />} label="Turn state">
          {initiative ? (
            <div className="space-y-1 text-sm">
              <p>
                Initiative: <strong>{initiative.initiativeTotal}</strong>
              </p>
              <p className="text-muted-foreground">
                Standard {initiative.actionEconomy.standardAvailable ? "✓" : "—"} · Move{" "}
                {initiative.actionEconomy.moveAvailable ? "✓" : "—"} · Swift{" "}
                {initiative.actionEconomy.swiftAvailable ? "✓" : "—"}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Not currently in initiative</span>
          )}
        </StatCard>
      </div>

      <CampaignResolutionPanel
        campaignId={campaignId}
        actor={actor}
        enabled={canControl}
        onResolved={onResolved}
      />

      <CampaignCastingPanel
        campaignId={campaignId}
        actor={actor}
        actors={actors}
        enabled={canControl}
        onResolved={onResolved}
      />

      <div className="mt-5 rounded-xl border border-border bg-card/60 p-5">
        <h3 className="font-display text-xl">Live character snapshot</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This channel reflects authoritative runtime state. Checks, attacks, spell slots, power
          points, and resolved casting above write through the rules engine; inventory management
          and the full sheet can expand this same surface later without duplicating campaign state.
        </p>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  disabled = false,
  placeholder,
  note,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  disabled?: boolean;
  placeholder: string;
  note: string;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-border bg-background/55 p-4">
      <div className="rounded-xl border border-border bg-card p-2 focus-within:border-gold/40">
        <textarea
          aria-label="Campaign play message"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={4000}
          rows={3}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-2 pt-2">
          <span className="text-[11px] text-muted-foreground">{note}</span>
          <button
            type="submit"
            disabled={!value.trim() || pending || disabled}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />{" "}
            {disabled ? "Resolve roll first" : pending ? "DM is responding…" : "Send"}
          </button>
        </div>
      </div>
    </form>
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
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
        active
          ? "border-gold/30 bg-gold/10 text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground"
      }`}
    >
      <span className={active ? "text-gold" : ""}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-[11px] opacity-75">{detail}</span>
      </span>
    </button>
  );
}

function SideCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <div className="mt-2 text-sm text-foreground/90">{children}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/75 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
        {icon} {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyFeed({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/20 bg-gold/5 text-gold">
          {icon}
        </div>
        <h3 className="mt-4 font-display text-xl">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function PlayState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
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
