import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronRight,
  Crown,
  Gauge,
  Globe2,
  LockKeyhole,
  Map,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Users,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import {
  CAMPAIGN_STYLE_LIMIT,
  campaignPaceOptions,
  campaignScaleOptions,
  campaignStructureOptions,
  campaignStyleOptions,
  type CampaignPace,
  type CampaignScale,
  type CampaignStructure,
  type CampaignStyleId,
} from "../domain/creatorOptions";
import {
  createCampaign,
  type CampaignGameMasterMode,
  type CampaignPlayMode,
  type CampaignVisibility,
} from "../client/campaignCreatorApi";

const creatorSteps = [
  { title: "Concept", subtitle: "Genre, scale & basics", icon: Sparkles },
  { title: "World", subtitle: "Create or use a seed", icon: Globe2 },
  { title: "Rules & System", subtitle: "D&D 3.5 and options", icon: BookOpen },
  { title: "Players", subtitle: "Party and permissions", icon: Users },
  { title: "AI & DM Settings", subtitle: "Personality and tools", icon: WandSparkles },
  { title: "Content", subtitle: "Sources and house rules", icon: ScrollText },
  { title: "Review", subtitle: "Confirm and create", icon: Check },
] as const;

const visibilityOptions: Array<{
  id: CampaignVisibility;
  name: string;
  description: string;
}> = [
  { id: "private", name: "Private", description: "Only you and invited players." },
  { id: "invite_only", name: "Invite only", description: "Players must receive an invitation." },
  { id: "public", name: "Public", description: "Visible to the Endless Codex community." },
];

const inputClass =
  "w-full rounded-xl border border-border bg-background/60 px-3.5 py-3 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-gold focus:ring-1 focus:ring-gold";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The campaign could not be created.";
}

export function CampaignCreator() {
  const session = authClient.useSession();
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<CampaignStyleId[]>([]);
  const [pace, setPace] = useState<CampaignPace>("moderate");
  const [scale, setScale] = useState<CampaignScale>("heroic");
  const [structure, setStructure] = useState<CampaignStructure>("open-world");
  const [visibility, setVisibility] = useState<CampaignVisibility>("private");
  const [playMode, setPlayMode] = useState<CampaignPlayMode>("solo");
  const [gameMasterMode, setGameMasterMode] = useState<CampaignGameMasterMode>("ai");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const selectedGenreNames = useMemo(
    () => campaignStyleOptions.filter((option) => genres.includes(option.id)).map((option) => option.name),
    [genres],
  );
  const selectedScale = campaignScaleOptions.find((option) => option.id === scale)!;
  const selectedPace = campaignPaceOptions.find((option) => option.id === pace)!;
  const selectedStructure = campaignStructureOptions.find((option) => option.id === structure)!;

  const create = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("Give the campaign a name first.");
      if (!shortDescription.trim()) throw new Error("Add a short campaign description.");
      if (genres.length === 0) throw new Error("Choose at least one campaign style or genre.");
      return createCampaign({
        name: name.trim(),
        description: description.trim() || shortDescription.trim(),
        playMode,
        gameMasterMode,
        visibility,
        maxPlayers: playMode === "solo" ? 1 : 6,
        settings: {
          creatorVersion: 1,
          shortDescription: shortDescription.trim(),
          genres,
          pace,
          scale,
          structure,
        },
      });
    },
    onSuccess: (campaign) => {
      setCreatedId(campaign.id);
      toast.success("Campaign draft created.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function toggleGenre(id: CampaignStyleId) {
    setGenres((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= CAMPAIGN_STYLE_LIMIT) {
        toast.error(`Choose up to ${CAMPAIGN_STYLE_LIMIT} campaign styles or genres.`);
        return current;
      }
      return [...current, id];
    });
  }

  if (session.isPending) {
    return <CreatorGate title="Opening campaign creation…" body="Loading your Endless Codex account." />;
  }
  if (!session.data) {
    return (
      <CreatorGate
        title="Sign in to create a campaign"
        body="Campaigns are persistent worlds attached to your Endless Codex account."
        action={
          <button
            type="button"
            onClick={useAuthModal.getState().openLogin}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Sign in
          </button>
        }
      />
    );
  }

  if (createdId) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center px-6 py-16">
        <section className="card-etched w-full rounded-2xl border border-gold/30 bg-card p-10 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
            <Check className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Campaign draft created</p>
          <h1 className="mt-3 font-display text-4xl">{name}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The concept is saved. World generation, rules, players, AI DM settings, content, and final review are the next creator stages.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/characters/new"
              className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
            >
              Create a character
            </Link>
            <button
              type="button"
              onClick={() => setCreatedId(null)}
              className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:border-gold/50 hover:text-gold"
            >
              Create another campaign
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(180,130,35,0.08),transparent_28%)] px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-[1560px]">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">Worlds await</p>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Create a New Campaign</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Shape the tone, scope, and rhythm of the adventure before the AI Dungeon Master ever speaks its first line.
          </p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
          <aside className="rounded-2xl border border-border/80 bg-card/80 p-3 shadow-xl backdrop-blur">
            <h2 className="px-3 py-3 font-display text-lg">Create Campaign</h2>
            <ol className="space-y-1">
              {creatorSteps.map((step, index) => {
                const Icon = step.icon;
                const active = index === 0;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      disabled={!active}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-gold/50 bg-gold/10 text-foreground shadow-[0_0_18px_rgba(204,153,51,0.08)]"
                          : "border-transparent text-muted-foreground opacity-65"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          active ? "bg-gold text-black" : "bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <strong className="block text-sm">
                          {index + 1}. {step.title}
                        </strong>
                        <small className="mt-0.5 block text-xs text-muted-foreground">{step.subtitle}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="space-y-5">
            <CreatorPanel
              icon={<Sparkles />}
              number="1"
              title="Campaign Concept"
              description="Define the core feel of your campaign. These settings are stored with the campaign and can guide the AI DM."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Campaign name" required>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={120}
                    placeholder="Ashes of the North"
                    className={inputClass}
                  />
                </Field>
                <Field label="Campaign visibility">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {visibilityOptions.map((option) => (
                      <ChoiceButton
                        key={option.id}
                        active={visibility === option.id}
                        onClick={() => setVisibility(option.id)}
                      >
                        <LockKeyhole className="h-4 w-4 shrink-0" />
                        <span>
                          <strong className="block">{option.name}</strong>
                          <small className="mt-1 block text-muted-foreground">{option.description}</small>
                        </span>
                      </ChoiceButton>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Short description" required hint={`${shortDescription.length}/200`}>
                <textarea
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="A frozen kingdom fractures while old powers wake beneath the ice."
                  className={`${inputClass} resize-y`}
                />
              </Field>
              <Field label="Detailed description" hint={`${description.length}/4000`}>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={4000}
                  rows={5}
                  placeholder="What are the stakes? What draws the party together? What should the Dungeon Master know about the campaign's premise?"
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </CreatorPanel>

            <CreatorPanel
              icon={<Map />}
              number="2"
              title="Game Styles & Genres"
              description={`Choose up to ${CAMPAIGN_STYLE_LIMIT}. Mixing styles lets the AI DM understand the campaign instead of forcing it into one label.`}
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{campaignStyleOptions.length} available styles</span>
                <span
                  className={`text-sm font-semibold ${
                    genres.length === CAMPAIGN_STYLE_LIMIT ? "text-gold" : "text-muted-foreground"
                  }`}
                >
                  {genres.length}/{CAMPAIGN_STYLE_LIMIT} selected
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {campaignStyleOptions.map((option) => {
                  const selected = genres.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleGenre(option.id)}
                      aria-pressed={selected}
                      className={`min-h-24 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-gold bg-gold/10 shadow-[0_0_16px_rgba(204,153,51,0.08)]"
                          : "border-border bg-background/40 hover:border-gold/40"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <strong className={selected ? "text-gold" : "text-foreground"}>{option.name}</strong>
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                            selected
                              ? "border-gold bg-gold text-black"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                      </span>
                      <small className="mt-2 block leading-5 text-muted-foreground">{option.description}</small>
                    </button>
                  );
                })}
              </div>
            </CreatorPanel>

            <div className="grid gap-5 lg:grid-cols-2">
              <CreatorPanel
                icon={<Crown />}
                number="3"
                title="Campaign Scale"
                description="Set the intended power band. Epic campaigns explicitly support level 21+ play."
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {campaignScaleOptions.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={scale === option.id}
                      onClick={() => setScale(option.id)}
                      vertical
                    >
                      <Shield className="h-5 w-5" />
                      <span>
                        <strong className="block">{option.name}</strong>
                        <small className="block text-gold/90">Levels {option.levelRange}</small>
                        <small className="mt-1 block text-muted-foreground">{option.description}</small>
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </CreatorPanel>

              <CreatorPanel
                icon={<Gauge />}
                number="4"
                title="Campaign Pace"
                description="How quickly should scenes, discoveries, and major events advance?"
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {campaignPaceOptions.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={pace === option.id}
                      onClick={() => setPace(option.id)}
                      vertical
                    >
                      <ChevronRight className="h-5 w-5" />
                      <span>
                        <strong className="block">{option.name}</strong>
                        <small className="mt-1 block text-muted-foreground">{option.description}</small>
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </CreatorPanel>
            </div>

            <CreatorPanel
              icon={<Swords />}
              number="5"
              title="Campaign Structure"
              description="Choose the default shape of play. This can later be refined in world and DM settings."
            >
              <select
                value={structure}
                onChange={(event) => setStructure(event.target.value as CampaignStructure)}
                className={inputClass}
              >
                {campaignStructureOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </CreatorPanel>

            <CreatorPanel
              icon={<Users />}
              number="6"
              title="Table & Dungeon Master"
              description="Choose who plays and who runs the table."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Players">
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton active={playMode === "solo"} onClick={() => setPlayMode("solo")}>
                      <Users className="h-4 w-4 shrink-0" />
                      <span>
                        <strong className="block">Solo</strong>
                        <small className="block text-muted-foreground">One player</small>
                      </span>
                    </ChoiceButton>
                    <ChoiceButton
                      active={playMode === "multiplayer"}
                      onClick={() => setPlayMode("multiplayer")}
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      <span>
                        <strong className="block">Multiplayer</strong>
                        <small className="block text-muted-foreground">Party play</small>
                      </span>
                    </ChoiceButton>
                  </div>
                </Field>
                <Field label="Dungeon Master">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["ai", "hybrid", "human"] as CampaignGameMasterMode[]).map((mode) => (
                      <ChoiceButton
                        key={mode}
                        active={gameMasterMode === mode}
                        onClick={() => setGameMasterMode(mode)}
                      >
                        <WandSparkles className="h-4 w-4 shrink-0" />
                        <span>
                          <strong className="block capitalize">{mode}</strong>
                          <small className="block text-muted-foreground">
                            {mode === "ai" ? "Codex DM" : mode === "hybrid" ? "AI assist" : "Player DM"}
                          </small>
                        </span>
                      </ChoiceButton>
                    ))}
                  </div>
                </Field>
              </div>
            </CreatorPanel>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-4">
              <p className="max-w-2xl text-sm text-muted-foreground">
                This first build saves the complete campaign concept as a real draft. The remaining creator stages will build on it.
              </p>
              <button
                type="button"
                disabled={create.isPending}
                onClick={() => create.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Save campaign draft"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="self-start rounded-2xl border border-gold/30 bg-card/90 p-5 shadow-2xl backdrop-blur xl:sticky xl:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Campaign Preview</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle_at_top,rgba(204,153,51,0.16),transparent_55%)] p-5">
              <div className="grid h-36 place-items-center rounded-lg border border-gold/20 bg-background/70 text-gold">
                <Globe2 className="h-14 w-14 opacity-60" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{name.trim() || "Untitled Campaign"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">D&D 3.5</p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize">
                  {visibility.replace("_", " ")}
                </span>
              </div>
              <p className="mt-4 text-sm italic leading-6 text-muted-foreground">
                {shortDescription.trim() || "Your campaign premise will appear here as you write it."}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedGenreNames.length > 0 ? (
                  selectedGenreNames.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs text-gold"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Choose 1–5 styles</span>
                )}
              </div>
              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <PreviewRow label="Scale" value={`${selectedScale.name} (${selectedScale.levelRange})`} />
                <PreviewRow label="Pace" value={selectedPace.name} />
                <PreviewRow label="Structure" value={selectedStructure.name} />
                <PreviewRow label="Players" value={playMode === "solo" ? "Solo" : "Multiplayer"} />
                <PreviewRow
                  label="DM"
                  value={
                    gameMasterMode === "ai"
                      ? "AI Dungeon Master"
                      : gameMasterMode === "hybrid"
                        ? "Hybrid"
                        : "Human DM"
                  }
                />
              </dl>
            </div>
            <p className="mt-5 text-center font-display text-lg italic text-muted-foreground">
              “A thousand roads, a million stories. Where will yours begin?”
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CreatorPanel({
  icon,
  number,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xl backdrop-blur">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-black">{icon}</span>
        <div>
          <h2 className="font-display text-2xl">
            {number}. {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-2 text-sm font-medium">
        <span>
          {label}
          {required ? <span className="text-gold"> *</span> : null}
        </span>
        {hint ? <small className="text-muted-foreground">{hint}</small> : null}
      </span>
      {children}
    </label>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
  vertical = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  vertical?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-full gap-2 rounded-xl border p-3 text-left transition ${
        vertical ? "flex-col" : "items-start"
      } ${
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-border bg-background/40 text-foreground hover:border-gold/40"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function CreatorGate({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-6 py-16">
      <section className="card-etched w-full rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{body}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  );
}
