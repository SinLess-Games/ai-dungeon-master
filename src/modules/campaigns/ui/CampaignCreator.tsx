import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gauge,
  Globe2,
  LockKeyhole,
  Map,
  Save,
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
  campaignDifficultyOptions,
  campaignPaceOptions,
  campaignScaleOptions,
  campaignStructureOptions,
  campaignStyleOptions,
  characterProgressionOptions,
  contentPolicyOptions,
  dmCreativityOptions,
  levelingModeOptions,
  rulesStrictnessOptions,
  worldTemplateOptions,
  type CampaignDifficulty,
  type CampaignPace,
  type CampaignScale,
  type CampaignStructure,
  type CampaignStyleId,
  type CharacterProgressionPolicy,
  type ContentPolicy,
  type DmCreativity,
  type LevelingMode,
  type RulesStrictness,
  type WorldCreationMode,
  type WorldTemplateId,
} from "../domain/creatorOptions";
import {
  createCampaign,
  updateCampaign,
  type CampaignCreatorSettings,
  type CampaignGameMasterMode,
  type CampaignPlayMode,
  type CampaignVisibility,
  type CreateCampaignInput,
} from "../client/campaignCreatorApi";

const creatorSteps = [
  { title: "Concept", subtitle: "Genre, scale & basics", icon: Sparkles },
  { title: "World", subtitle: "Generation and continuity", icon: Globe2 },
  { title: "Rules & System", subtitle: "D&D 3.5 campaign rules", icon: BookOpen },
  { title: "Players", subtitle: "Party and permissions", icon: Users },
  { title: "AI & DM Settings", subtitle: "Difficulty and behavior", icon: WandSparkles },
  { title: "Content", subtitle: "Sources and house rules", icon: ScrollText },
  { title: "Review", subtitle: "Confirm and save", icon: Check },
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
  return error instanceof Error ? error.message : "The campaign could not be saved.";
}

export function CampaignCreator() {
  const session = authClient.useSession();
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<CampaignStyleId[]>([]);
  const [pace, setPace] = useState<CampaignPace>("moderate");
  const [scale, setScale] = useState<CampaignScale>("heroic");
  const [structure, setStructure] = useState<CampaignStructure>("open-world");
  const [visibility, setVisibility] = useState<CampaignVisibility>("private");

  const [worldMode, setWorldMode] = useState<WorldCreationMode>("generated");
  const [worldTemplateId, setWorldTemplateId] = useState<WorldTemplateId>("balanced-realms");
  const [generationSeed, setGenerationSeed] = useState("");
  const [multiPlanar, setMultiPlanar] = useState(false);
  const [persistentWorld, setPersistentWorld] = useState(true);

  const [levelingMode, setLevelingMode] = useState<LevelingMode>("experience");
  const [characterProgression, setCharacterProgression] =
    useState<CharacterProgressionPolicy>("standard");

  const [playMode, setPlayMode] = useState<CampaignPlayMode>("solo");
  const [maxPlayers, setMaxPlayers] = useState(1);
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowSpectators, setAllowSpectators] = useState(false);
  const [allowPvp, setAllowPvp] = useState(false);

  const [gameMasterMode, setGameMasterMode] = useState<CampaignGameMasterMode>("ai");
  const [difficulty, setDifficulty] = useState<CampaignDifficulty>("balanced");
  const [rulesStrictness, setRulesStrictness] = useState<RulesStrictness>("strict");
  const [dmCreativity, setDmCreativity] = useState<DmCreativity>("adaptive");
  const [rollNpcDice, setRollNpcDice] = useState(true);
  const [showDmRolls, setShowDmRolls] = useState(true);
  const [persistentNpcs, setPersistentNpcs] = useState(true);
  const [idlePlus, setIdlePlus] = useState(false);

  const [contentPolicy, setContentPolicy] = useState<ContentPolicy>("official");
  const [allowHomebrew, setAllowHomebrew] = useState(false);
  const [allowThirdParty, setAllowThirdParty] = useState(false);
  const [houseRules, setHouseRules] = useState("");

  const selectedGenreNames = useMemo(
    () => campaignStyleOptions.filter((option) => genres.includes(option.id)).map((option) => option.name),
    [genres],
  );
  const selectedScale = campaignScaleOptions.find((option) => option.id === scale)!;
  const selectedPace = campaignPaceOptions.find((option) => option.id === pace)!;
  const selectedStructure = campaignStructureOptions.find((option) => option.id === structure)!;
  const selectedWorldTemplate = worldTemplateOptions.find((option) => option.id === worldTemplateId)!;

  function buildSettings(): CampaignCreatorSettings {
    const epicLevels = scale === "epic";
    return {
      creatorVersion: 2,
      shortDescription: shortDescription.trim(),
      genres,
      pace,
      scale,
      structure,
      world: {
        mode: worldMode,
        templateId: worldTemplateId,
        multiPlanar,
        persistentWorld,
      },
      rules: {
        levelingMode,
        characterProgression,
        epicLevels,
      },
      players: {
        maxPlayers,
        requireApproval,
        allowSpectators,
        allowPvp,
      },
      dm: {
        difficulty,
        rulesStrictness,
        creativity: dmCreativity,
        rollNpcDice,
        showDmRolls,
        persistentNpcs,
        idlePlus,
      },
      content: {
        policy: contentPolicy,
        allowHomebrew,
        allowThirdParty,
        houseRules: houseRules.trim(),
      },
      ruleset: {
        id: "dnd35",
        version: "3.5",
        worldTemplateId,
        campaignStyleIds: genres,
        pace,
        multiPlanar,
        epicLevels,
        levelingMode,
        characterProgression,
      },
    };
  }

  function buildPayload(): CreateCampaignInput {
    const seed = generationSeed.trim();
    return {
      name: name.trim(),
      description: description.trim() || shortDescription.trim(),
      playMode,
      gameMasterMode,
      visibility,
      maxPlayers,
      ...(worldMode === "seeded" && seed ? { generationSeed: seed } : {}),
      settings: buildSettings(),
    };
  }

  function validateStep(targetStep: number): string | null {
    if (targetStep === 0) {
      if (!name.trim()) return "Give the campaign a name first.";
      if (!shortDescription.trim()) return "Add a short campaign description.";
      if (genres.length === 0) return "Choose at least one campaign style or genre.";
      if (genres.length > CAMPAIGN_STYLE_LIMIT) return `Choose no more than ${CAMPAIGN_STYLE_LIMIT} styles.`;
    }
    if (targetStep === 1 && worldMode === "seeded" && !generationSeed.trim()) {
      return "Enter a generation seed or switch back to a generated world.";
    }
    if (targetStep === 3) {
      if (maxPlayers < 1 || maxPlayers > 12) return "Maximum players must be from 1 to 12.";
      if (playMode === "multiplayer" && maxPlayers < 2) return "Multiplayer campaigns need room for at least 2 players.";
    }
    if (targetStep === 5 && houseRules.length > 5000) {
      return "House rules must be 5000 characters or fewer.";
    }
    return null;
  }

  function validateAll(): string | null {
    for (let index = 0; index < creatorSteps.length - 1; index += 1) {
      const issue = validateStep(index);
      if (issue) return issue;
    }
    return null;
  }

  const save = useMutation({
    mutationFn: async ({ finish }: { finish: boolean }) => {
      const issue = validateAll();
      if (issue) throw new Error(issue);
      const payload = buildPayload();
      if (draftId) return updateCampaign(draftId, payload);
      return createCampaign(payload);
    },
    onSuccess: (campaign, variables) => {
      setDraftId(campaign.id);
      if (variables.finish) {
        setFinished(true);
        toast.success("Campaign creator settings saved.");
      } else {
        toast.success(draftId ? "Campaign draft updated." : "Campaign draft saved.");
      }
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

  function changePlayMode(mode: CampaignPlayMode) {
    setPlayMode(mode);
    if (mode === "solo") setMaxPlayers(1);
    else if (maxPlayers < 2) setMaxPlayers(4);
  }

  function goNext() {
    const issue = validateStep(step);
    if (issue) {
      toast.error(issue);
      return;
    }
    const next = Math.min(step + 1, creatorSteps.length - 1);
    setStep(next);
    setFurthestStep((current) => Math.max(current, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(index: number) {
    if (index > furthestStep) return;
    setStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (finished) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center px-6 py-16">
        <section className="card-etched w-full rounded-2xl border border-gold/30 bg-card p-10 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
            <Check className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Campaign draft ready</p>
          <h1 className="mt-3 font-display text-4xl">{name}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The campaign concept, world generation profile, rules, table permissions, AI DM behavior, and content policy are saved. Add at least one ready character before starting the campaign.
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
              onClick={() => {
                setFinished(false);
                setStep(6);
              }}
              className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:border-gold/50 hover:text-gold"
            >
              Edit campaign
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
            Shape the world, rules, table, and AI Dungeon Master before the first scene begins.
          </p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
          <aside className="self-start rounded-2xl border border-border/80 bg-card/80 p-3 shadow-xl backdrop-blur xl:sticky xl:top-24">
            <h2 className="px-3 py-3 font-display text-lg">Create Campaign</h2>
            <ol className="space-y-1">
              {creatorSteps.map((creatorStep, index) => {
                const Icon = creatorStep.icon;
                const active = index === step;
                const available = index <= furthestStep;
                return (
                  <li key={creatorStep.title}>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => goToStep(index)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-gold/50 bg-gold/10 text-foreground shadow-[0_0_18px_rgba(204,153,51,0.08)]"
                          : available
                            ? "border-transparent text-foreground hover:border-border hover:bg-muted/40"
                            : "border-transparent text-muted-foreground opacity-45"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          active ? "bg-gold text-black" : index < step ? "bg-gold/15 text-gold" : "bg-muted"
                        }`}
                      >
                        {index < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span>
                        <strong className="block text-sm">
                          {index + 1}. {creatorStep.title}
                        </strong>
                        <small className="mt-0.5 block text-xs text-muted-foreground">{creatorStep.subtitle}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {draftId ? (
              <p className="mt-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-muted-foreground">
                Draft saved. Future saves update the same campaign.
              </p>
            ) : null}
          </aside>

          <section className="space-y-5">
            {step === 0 ? (
              <ConceptStep
                name={name}
                setName={setName}
                shortDescription={shortDescription}
                setShortDescription={setShortDescription}
                description={description}
                setDescription={setDescription}
                genres={genres}
                toggleGenre={toggleGenre}
                pace={pace}
                setPace={setPace}
                scale={scale}
                setScale={setScale}
                structure={structure}
                setStructure={setStructure}
                visibility={visibility}
                setVisibility={setVisibility}
              />
            ) : null}

            {step === 1 ? (
              <WorldStep
                mode={worldMode}
                setMode={setWorldMode}
                templateId={worldTemplateId}
                setTemplateId={setWorldTemplateId}
                generationSeed={generationSeed}
                setGenerationSeed={setGenerationSeed}
                multiPlanar={multiPlanar}
                setMultiPlanar={setMultiPlanar}
                persistentWorld={persistentWorld}
                setPersistentWorld={setPersistentWorld}
              />
            ) : null}

            {step === 2 ? (
              <RulesStep
                levelingMode={levelingMode}
                setLevelingMode={setLevelingMode}
                characterProgression={characterProgression}
                setCharacterProgression={setCharacterProgression}
                scale={scale}
              />
            ) : null}

            {step === 3 ? (
              <PlayersStep
                playMode={playMode}
                setPlayMode={changePlayMode}
                maxPlayers={maxPlayers}
                setMaxPlayers={setMaxPlayers}
                requireApproval={requireApproval}
                setRequireApproval={setRequireApproval}
                allowSpectators={allowSpectators}
                setAllowSpectators={setAllowSpectators}
                allowPvp={allowPvp}
                setAllowPvp={setAllowPvp}
              />
            ) : null}

            {step === 4 ? (
              <DmStep
                gameMasterMode={gameMasterMode}
                setGameMasterMode={setGameMasterMode}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                rulesStrictness={rulesStrictness}
                setRulesStrictness={setRulesStrictness}
                creativity={dmCreativity}
                setCreativity={setDmCreativity}
                rollNpcDice={rollNpcDice}
                setRollNpcDice={setRollNpcDice}
                showDmRolls={showDmRolls}
                setShowDmRolls={setShowDmRolls}
                persistentNpcs={persistentNpcs}
                setPersistentNpcs={setPersistentNpcs}
                idlePlus={idlePlus}
                setIdlePlus={setIdlePlus}
              />
            ) : null}

            {step === 5 ? (
              <ContentStep
                policy={contentPolicy}
                setPolicy={setContentPolicy}
                allowHomebrew={allowHomebrew}
                setAllowHomebrew={setAllowHomebrew}
                allowThirdParty={allowThirdParty}
                setAllowThirdParty={setAllowThirdParty}
                houseRules={houseRules}
                setHouseRules={setHouseRules}
              />
            ) : null}

            {step === 6 ? (
              <ReviewStep
                name={name}
                shortDescription={shortDescription}
                genres={selectedGenreNames}
                scale={selectedScale.name}
                pace={selectedPace.name}
                structure={selectedStructure.name}
                worldTemplate={selectedWorldTemplate.name}
                worldMode={worldMode}
                multiPlanar={multiPlanar}
                levelingMode={levelingMode}
                characterProgression={characterProgression}
                playMode={playMode}
                maxPlayers={maxPlayers}
                gameMasterMode={gameMasterMode}
                difficulty={difficulty}
                contentPolicy={contentPolicy}
              />
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-4">
              <div className="flex gap-2">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-semibold transition hover:border-gold/50 hover:text-gold"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate({ finish: false })}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-semibold transition hover:border-gold/50 hover:text-gold disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {save.isPending ? "Saving…" : draftId ? "Update draft" : "Save draft"}
                </button>
              </div>

              {step < creatorSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => save.mutate({ finish: true })}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {save.isPending ? "Saving…" : "Save campaign"}
                </button>
              )}
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
                <PreviewRow label="World" value={selectedWorldTemplate.name} />
                <PreviewRow label="Players" value={playMode === "solo" ? "Solo" : `Up to ${maxPlayers}`} />
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
                <PreviewRow label="Difficulty" value={difficulty} />
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

function ConceptStep({
  name,
  setName,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
  genres,
  toggleGenre,
  pace,
  setPace,
  scale,
  setScale,
  structure,
  setStructure,
  visibility,
  setVisibility,
}: {
  name: string;
  setName: (value: string) => void;
  shortDescription: string;
  setShortDescription: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  genres: CampaignStyleId[];
  toggleGenre: (id: CampaignStyleId) => void;
  pace: CampaignPace;
  setPace: (value: CampaignPace) => void;
  scale: CampaignScale;
  setScale: (value: CampaignScale) => void;
  structure: CampaignStructure;
  setStructure: (value: CampaignStructure) => void;
  visibility: CampaignVisibility;
  setVisibility: (value: CampaignVisibility) => void;
}) {
  return (
    <>
      <CreatorPanel
        icon={<Sparkles />}
        number="1"
        title="Campaign Concept"
        description="Define the core identity of the campaign before the Codex builds the world around it."
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
            placeholder="What are the stakes? What draws the party together? What should the Dungeon Master know?"
            className={`${inputClass} resize-y`}
          />
        </Field>
      </CreatorPanel>

      <CreatorPanel
        icon={<Map />}
        number="2"
        title="Game Styles & Genres"
        description={`Choose up to ${CAMPAIGN_STYLE_LIMIT}. The AI DM receives the complete blend rather than forcing the campaign into one category.`}
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
                      selected ? "border-gold bg-gold text-black" : "border-muted-foreground/40"
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
          description="Choose the intended power band. Epic campaigns enable level 21+ play."
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
        description="Choose the default shape of play."
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
    </>
  );
}

function WorldStep({
  mode,
  setMode,
  templateId,
  setTemplateId,
  generationSeed,
  setGenerationSeed,
  multiPlanar,
  setMultiPlanar,
  persistentWorld,
  setPersistentWorld,
}: {
  mode: WorldCreationMode;
  setMode: (value: WorldCreationMode) => void;
  templateId: WorldTemplateId;
  setTemplateId: (value: WorldTemplateId) => void;
  generationSeed: string;
  setGenerationSeed: (value: string) => void;
  multiPlanar: boolean;
  setMultiPlanar: (value: boolean) => void;
  persistentWorld: boolean;
  setPersistentWorld: (value: boolean) => void;
}) {
  return (
    <>
      <CreatorPanel
        icon={<Globe2 />}
        number="1"
        title="World Origin"
        description="The world is generated when the campaign starts, after at least one rules-valid character is ready."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ChoiceButton active={mode === "generated"} onClick={() => setMode("generated")}>
            <Sparkles className="h-5 w-5 shrink-0" />
            <span>
              <strong className="block">Generate New World</strong>
              <small className="mt-1 block text-muted-foreground">Let the Codex create a fresh deterministic seed.</small>
            </span>
          </ChoiceButton>
          <ChoiceButton active={mode === "seeded"} onClick={() => setMode("seeded")}>
            <Map className="h-5 w-5 shrink-0" />
            <span>
              <strong className="block">Use a Generation Seed</strong>
              <small className="mt-1 block text-muted-foreground">Reuse a seed to reproduce the same starting world profile.</small>
            </span>
          </ChoiceButton>
        </div>
        {mode === "seeded" ? (
          <Field label="Generation seed" required hint="1–256 characters">
            <input
              value={generationSeed}
              onChange={(event) => setGenerationSeed(event.target.value)}
              maxLength={256}
              placeholder="aeragorn-wild-marches-001"
              className={inputClass}
            />
          </Field>
        ) : null}
      </CreatorPanel>

      <CreatorPanel
        icon={<Map />}
        number="2"
        title="World Template"
        description="Choose the broad geography and settlement pattern that world generation should emphasize."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {worldTemplateOptions.map((option) => (
            <ChoiceButton
              key={option.id}
              active={templateId === option.id}
              onClick={() => setTemplateId(option.id)}
              vertical
            >
              <Globe2 className="h-5 w-5" />
              <span>
                <strong className="block">{option.name}</strong>
                <small className="mt-1 block text-muted-foreground">{option.description}</small>
              </span>
            </ChoiceButton>
          ))}
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<Sparkles />}
        number="3"
        title="World Continuity"
        description="These settings become authoritative generation hints for the persistent campaign world."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard
            checked={persistentWorld}
            onChange={setPersistentWorld}
            title="Persistent world"
            description="Locations, NPCs, consequences, and world state persist between sessions."
          />
          <ToggleCard
            checked={multiPlanar}
            onChange={setMultiPlanar}
            title="Multi-planar world"
            description="Permit campaign generation and later adventures to span multiple planes."
          />
        </div>
      </CreatorPanel>
    </>
  );
}

function RulesStep({
  levelingMode,
  setLevelingMode,
  characterProgression,
  setCharacterProgression,
  scale,
}: {
  levelingMode: LevelingMode;
  setLevelingMode: (value: LevelingMode) => void;
  characterProgression: CharacterProgressionPolicy;
  setCharacterProgression: (value: CharacterProgressionPolicy) => void;
  scale: CampaignScale;
}) {
  return (
    <>
      <CreatorPanel
        icon={<BookOpen />}
        number="1"
        title="Rules System"
        description="The first playable ruleset for The Endless Codex is Dungeons & Dragons 3.5."
      >
        <div className="rounded-xl border border-gold/35 bg-gold/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <strong className="font-display text-xl">D&D 3.5</strong>
              <p className="mt-1 text-sm text-muted-foreground">Rules-accurate character creation and deterministic engine support.</p>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">Selected</span>
          </div>
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<Gauge />}
        number="2"
        title="Advancement"
        description="Choose how characters earn levels during the campaign."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {levelingModeOptions.map((option) => (
            <ChoiceButton
              key={option.id}
              active={levelingMode === option.id}
              onClick={() => setLevelingMode(option.id)}
            >
              <Crown className="h-5 w-5 shrink-0" />
              <span>
                <strong className="block">{option.name}</strong>
                <small className="mt-1 block text-muted-foreground">{option.description}</small>
              </span>
            </ChoiceButton>
          ))}
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<Swords />}
        number="3"
        title="Character Progression"
        description="Set whether characters use standard progression, gestalt progression, or player choice."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {characterProgressionOptions.map((option) => (
            <ChoiceButton
              key={option.id}
              active={characterProgression === option.id}
              onClick={() => setCharacterProgression(option.id)}
              vertical
            >
              <Shield className="h-5 w-5" />
              <span>
                <strong className="block">{option.name}</strong>
                <small className="mt-1 block text-muted-foreground">{option.description}</small>
              </span>
            </ChoiceButton>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
          <strong>Epic levels:</strong>{" "}
          <span className={scale === "epic" ? "text-gold" : "text-muted-foreground"}>
            {scale === "epic" ? "Enabled by the Epic campaign scale (21+)." : "Disabled for the selected campaign scale."}
          </span>
        </div>
      </CreatorPanel>
    </>
  );
}

function PlayersStep({
  playMode,
  setPlayMode,
  maxPlayers,
  setMaxPlayers,
  requireApproval,
  setRequireApproval,
  allowSpectators,
  setAllowSpectators,
  allowPvp,
  setAllowPvp,
}: {
  playMode: CampaignPlayMode;
  setPlayMode: (value: CampaignPlayMode) => void;
  maxPlayers: number;
  setMaxPlayers: (value: number) => void;
  requireApproval: boolean;
  setRequireApproval: (value: boolean) => void;
  allowSpectators: boolean;
  setAllowSpectators: (value: boolean) => void;
  allowPvp: boolean;
  setAllowPvp: (value: boolean) => void;
}) {
  return (
    <>
      <CreatorPanel
        icon={<Users />}
        number="1"
        title="Table Size"
        description="A solo campaign still uses the same persistent campaign and character systems as multiplayer."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ChoiceButton active={playMode === "solo"} onClick={() => setPlayMode("solo")}>
            <Users className="h-5 w-5 shrink-0" />
            <span>
              <strong className="block">Solo</strong>
              <small className="mt-1 block text-muted-foreground">One player with the AI Dungeon Master.</small>
            </span>
          </ChoiceButton>
          <ChoiceButton active={playMode === "multiplayer"} onClick={() => setPlayMode("multiplayer")}>
            <Users className="h-5 w-5 shrink-0" />
            <span>
              <strong className="block">Multiplayer</strong>
              <small className="mt-1 block text-muted-foreground">A persistent party with campaign memberships.</small>
            </span>
          </ChoiceButton>
        </div>
        <Field label="Maximum players" hint={playMode === "solo" ? "Locked to 1 for solo" : "2–12 players"}>
          <input
            type="number"
            min={playMode === "solo" ? 1 : 2}
            max={12}
            disabled={playMode === "solo"}
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(Number(event.target.value))}
            className={inputClass}
          />
        </Field>
      </CreatorPanel>

      <CreatorPanel
        icon={<Shield />}
        number="2"
        title="Player Permissions"
        description="These defaults control how people join and interact with the campaign."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard checked={requireApproval} onChange={setRequireApproval} title="Require approval" description="The campaign owner must approve new players before they join." />
          <ToggleCard checked={allowSpectators} onChange={setAllowSpectators} title="Allow spectators" description="Permit non-player members to observe campaign sessions." />
          <ToggleCard checked={allowPvp} onChange={setAllowPvp} title="Allow player-vs-player actions" description="Permit deliberate hostile actions between player characters." />
        </div>
      </CreatorPanel>
    </>
  );
}

function DmStep({
  gameMasterMode,
  setGameMasterMode,
  difficulty,
  setDifficulty,
  rulesStrictness,
  setRulesStrictness,
  creativity,
  setCreativity,
  rollNpcDice,
  setRollNpcDice,
  showDmRolls,
  setShowDmRolls,
  persistentNpcs,
  setPersistentNpcs,
  idlePlus,
  setIdlePlus,
}: {
  gameMasterMode: CampaignGameMasterMode;
  setGameMasterMode: (value: CampaignGameMasterMode) => void;
  difficulty: CampaignDifficulty;
  setDifficulty: (value: CampaignDifficulty) => void;
  rulesStrictness: RulesStrictness;
  setRulesStrictness: (value: RulesStrictness) => void;
  creativity: DmCreativity;
  setCreativity: (value: DmCreativity) => void;
  rollNpcDice: boolean;
  setRollNpcDice: (value: boolean) => void;
  showDmRolls: boolean;
  setShowDmRolls: (value: boolean) => void;
  persistentNpcs: boolean;
  setPersistentNpcs: (value: boolean) => void;
  idlePlus: boolean;
  setIdlePlus: (value: boolean) => void;
}) {
  return (
    <>
      <CreatorPanel
        icon={<Bot />}
        number="1"
        title="Dungeon Master Mode"
        description="Choose whether the Codex runs the table, assists a human DM, or stays out of the DM seat."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {(["ai", "hybrid", "human"] as CampaignGameMasterMode[]).map((mode) => (
            <ChoiceButton
              key={mode}
              active={gameMasterMode === mode}
              onClick={() => setGameMasterMode(mode)}
              vertical
            >
              <WandSparkles className="h-5 w-5" />
              <span>
                <strong className="block capitalize">{mode}</strong>
                <small className="mt-1 block text-muted-foreground">
                  {mode === "ai"
                    ? "The Endless Codex acts as Dungeon Master."
                    : mode === "hybrid"
                      ? "A human DM receives AI assistance and tools."
                      : "A human Dungeon Master controls narration and rulings."}
                </small>
              </span>
            </ChoiceButton>
          ))}
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<Swords />}
        number="2"
        title="Difficulty"
        description="Difficulty guides encounter pressure and consequence, not hidden rule cheating."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {campaignDifficultyOptions.map((option) => (
            <ChoiceButton
              key={option.id}
              active={difficulty === option.id}
              onClick={() => setDifficulty(option.id)}
              vertical
            >
              <Shield className="h-5 w-5" />
              <span>
                <strong className="block">{option.name}</strong>
                <small className="mt-1 block text-muted-foreground">{option.description}</small>
              </span>
            </ChoiceButton>
          ))}
        </div>
      </CreatorPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <CreatorPanel
          icon={<BookOpen />}
          number="3"
          title="Rules Adjudication"
          description="Control how strictly the DM should interpret edge cases."
        >
          <div className="space-y-2">
            {rulesStrictnessOptions.map((option) => (
              <ChoiceButton key={option.id} active={rulesStrictness === option.id} onClick={() => setRulesStrictness(option.id)}>
                <BookOpen className="h-4 w-4 shrink-0" />
                <span><strong className="block">{option.name}</strong><small className="text-muted-foreground">{option.description}</small></span>
              </ChoiceButton>
            ))}
          </div>
        </CreatorPanel>
        <CreatorPanel
          icon={<Sparkles />}
          number="4"
          title="DM Creativity"
          description="Set how aggressively the AI should invent new details around established campaign facts."
        >
          <div className="space-y-2">
            {dmCreativityOptions.map((option) => (
              <ChoiceButton key={option.id} active={creativity === option.id} onClick={() => setCreativity(option.id)}>
                <Sparkles className="h-4 w-4 shrink-0" />
                <span><strong className="block">{option.name}</strong><small className="text-muted-foreground">{option.description}</small></span>
              </ChoiceButton>
            ))}
          </div>
        </CreatorPanel>
      </div>

      <CreatorPanel
        icon={<WandSparkles />}
        number="5"
        title="Automation & Persistence"
        description="Choose what the DM manages automatically. Deterministic game state remains authoritative regardless."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard checked={rollNpcDice} onChange={setRollNpcDice} title="DM rolls NPC dice" description="Let the campaign engine resolve NPC and monster rolls automatically." />
          <ToggleCard checked={showDmRolls} onChange={setShowDmRolls} title="Show DM roll results" description="Expose resolved DM dice totals to players when appropriate." />
          <ToggleCard checked={persistentNpcs} onChange={setPersistentNpcs} title="Persistent NPCs" description="Reuse established NPC identities and state instead of reinventing them." />
          <ToggleCard checked={idlePlus} onChange={setIdlePlus} title="Idle Plus" description="Allow opt-in world time progression while players are away." />
        </div>
      </CreatorPanel>
    </>
  );
}

function ContentStep({
  policy,
  setPolicy,
  allowHomebrew,
  setAllowHomebrew,
  allowThirdParty,
  setAllowThirdParty,
  houseRules,
  setHouseRules,
}: {
  policy: ContentPolicy;
  setPolicy: (value: ContentPolicy) => void;
  allowHomebrew: boolean;
  setAllowHomebrew: (value: boolean) => void;
  allowThirdParty: boolean;
  setAllowThirdParty: (value: boolean) => void;
  houseRules: string;
  setHouseRules: (value: string) => void;
}) {
  return (
    <>
      <CreatorPanel
        icon={<BookOpen />}
        number="1"
        title="Content Library"
        description="Choose the campaign's default source policy. Availability still depends on content installed in the Codex."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {contentPolicyOptions.map((option) => (
            <ChoiceButton key={option.id} active={policy === option.id} onClick={() => setPolicy(option.id)} vertical>
              <ScrollText className="h-5 w-5" />
              <span><strong className="block">{option.name}</strong><small className="mt-1 block text-muted-foreground">{option.description}</small></span>
            </ChoiceButton>
          ))}
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<Sparkles />}
        number="2"
        title="Custom Content"
        description="Decide whether campaign owners may include content outside the official library."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard checked={allowHomebrew} onChange={setAllowHomebrew} title="Allow homebrew" description="Permit campaign-specific custom rules and content records." />
          <ToggleCard checked={allowThirdParty} onChange={setAllowThirdParty} title="Allow third-party content" description="Permit enabled non-official source material for this campaign." />
        </div>
      </CreatorPanel>

      <CreatorPanel
        icon={<ScrollText />}
        number="3"
        title="House Rules"
        description="Record campaign-level exceptions or table conventions for the DM and players."
      >
        <Field label="House rules and table notes" hint={`${houseRules.length}/5000`}>
          <textarea
            value={houseRules}
            onChange={(event) => setHouseRules(event.target.value)}
            maxLength={5000}
            rows={10}
            placeholder="Example: Use maximum hit points at first level. Critical fumbles are disabled."
            className={`${inputClass} resize-y`}
          />
        </Field>
      </CreatorPanel>
    </>
  );
}

function ReviewStep({
  name,
  shortDescription,
  genres,
  scale,
  pace,
  structure,
  worldTemplate,
  worldMode,
  multiPlanar,
  levelingMode,
  characterProgression,
  playMode,
  maxPlayers,
  gameMasterMode,
  difficulty,
  contentPolicy,
}: {
  name: string;
  shortDescription: string;
  genres: string[];
  scale: string;
  pace: string;
  structure: string;
  worldTemplate: string;
  worldMode: WorldCreationMode;
  multiPlanar: boolean;
  levelingMode: LevelingMode;
  characterProgression: CharacterProgressionPolicy;
  playMode: CampaignPlayMode;
  maxPlayers: number;
  gameMasterMode: CampaignGameMasterMode;
  difficulty: CampaignDifficulty;
  contentPolicy: ContentPolicy;
}) {
  return (
    <CreatorPanel
      icon={<Check />}
      number="1"
      title="Review Campaign"
      description="Confirm the campaign profile. Saving creates or updates a persistent campaign draft; the world is not generated until the campaign starts."
    >
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-display text-3xl">{name || "Untitled Campaign"}</h2>
        <p className="mt-2 text-muted-foreground">{shortDescription || "No description yet."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {genres.map((genre) => <span key={genre} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">{genre}</span>)}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewCard title="Campaign" rows={[["Scale", scale], ["Pace", pace], ["Structure", structure]]} />
        <ReviewCard title="World" rows={[["Template", worldTemplate], ["Generation", worldMode === "seeded" ? "Seeded" : "Generated"], ["Planar", multiPlanar ? "Multi-planar" : "Primary plane"]]} />
        <ReviewCard title="Rules" rows={[["System", "D&D 3.5"], ["Advancement", levelingMode], ["Progression", characterProgression]]} />
        <ReviewCard title="Table" rows={[["Players", playMode === "solo" ? "Solo" : `Up to ${maxPlayers}`], ["DM", gameMasterMode], ["Difficulty", difficulty], ["Content", contentPolicy]]} />
      </div>
      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
        Starting the campaign remains a separate action. At least one completed, rules-valid D&D 3.5 character must be ready before world generation begins.
      </div>
    </CreatorPanel>
  );
}

function ReviewCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-xl border border-border bg-background/40 p-4">
      <h3 className="font-display text-lg text-gold">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, value]) => <PreviewRow key={label} label={label} value={value} />)}
      </dl>
    </section>
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
      className={`flex h-full w-full gap-2 rounded-xl border p-3 text-left transition ${
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

function ToggleCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-left transition ${
        checked ? "border-gold bg-gold/10" : "border-border bg-background/40 hover:border-gold/40"
      }`}
    >
      <span>
        <strong className={checked ? "text-gold" : "text-foreground"}>{title}</strong>
        <small className="mt-1 block leading-5 text-muted-foreground">{description}</small>
      </span>
      <span className={`mt-0.5 grid h-6 w-10 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-gold" : "bg-muted"}`}>
        <span className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
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
