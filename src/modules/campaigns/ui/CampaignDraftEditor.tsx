import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, Save, Swords } from "lucide-react";
import { toast } from "sonner";
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
  updateCampaign,
  type CampaignCreatorSettings,
  type CampaignDetailResponse,
  type CampaignGameMasterMode,
  type CampaignPlayMode,
  type CampaignVisibility,
} from "../client/campaignCreatorApi";
import { CampaignDurationFields } from "./CampaignDurationFields";
import {
  durationDraftFromSettings,
  parseDurationDraft,
} from "./durationDraft";

const fieldClass =
  "w-full rounded-xl border border-border bg-background/60 px-3.5 py-3 text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

const visibilityOptions: CampaignVisibility[] = ["private", "invite_only", "public"];
const gmOptions: CampaignGameMasterMode[] = ["ai", "hybrid", "human"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includesId<T extends readonly { id: string }[]>(options: T, value: unknown): value is T[number]["id"] {
  return typeof value === "string" && options.some((option) => option.id === value);
}

function settingsFromCampaign(detail: CampaignDetailResponse): CampaignCreatorSettings {
  const raw = detail.campaign.settings;
  const world = isRecord(raw["world"]) ? raw["world"] : {};
  const rules = isRecord(raw["rules"]) ? raw["rules"] : {};
  const players = isRecord(raw["players"]) ? raw["players"] : {};
  const dm = isRecord(raw["dm"]) ? raw["dm"] : {};
  const content = isRecord(raw["content"]) ? raw["content"] : {};

  const genres = Array.isArray(raw["genres"])
    ? raw["genres"].filter(
        (value): value is CampaignStyleId =>
          typeof value === "string" && campaignStyleOptions.some((option) => option.id === value),
      ).slice(0, CAMPAIGN_STYLE_LIMIT)
    : [];
  const pace = includesId(campaignPaceOptions, raw["pace"]) ? raw["pace"] : "moderate";
  const scale = includesId(campaignScaleOptions, raw["scale"]) ? raw["scale"] : "heroic";
  const structure = includesId(campaignStructureOptions, raw["structure"])
    ? raw["structure"]
    : "open-world";
  const templateId = includesId(worldTemplateOptions, world["templateId"])
    ? world["templateId"]
    : "balanced-realms";
  const levelingMode = includesId(levelingModeOptions, rules["levelingMode"])
    ? rules["levelingMode"]
    : "experience";
  const characterProgression = includesId(
    characterProgressionOptions,
    rules["characterProgression"],
  )
    ? rules["characterProgression"]
    : "standard";
  const difficulty = includesId(campaignDifficultyOptions, dm["difficulty"])
    ? dm["difficulty"]
    : "balanced";
  const rulesStrictness = includesId(rulesStrictnessOptions, dm["rulesStrictness"])
    ? dm["rulesStrictness"]
    : "strict";
  const creativity = includesId(dmCreativityOptions, dm["creativity"])
    ? dm["creativity"]
    : "adaptive";
  const policy = includesId(contentPolicyOptions, content["policy"])
    ? content["policy"]
    : "official";
  const maxPlayers =
    typeof players["maxPlayers"] === "number" && Number.isInteger(players["maxPlayers"])
      ? Math.max(1, Math.min(12, players["maxPlayers"]))
      : detail.campaign.playMode === "multiplayer"
        ? 4
        : 1;
  const epicLevels = scale === "epic";

  return {
    creatorVersion: 2,
    shortDescription:
      typeof raw["shortDescription"] === "string"
        ? raw["shortDescription"]
        : detail.campaign.description ?? "",
    genres: genres.length > 0 ? genres : ["heroic-fantasy"],
    pace,
    scale,
    structure,
    world: {
      mode: world["mode"] === "seeded" ? "seeded" : "generated",
      templateId,
      multiPlanar: world["multiPlanar"] === true,
      persistentWorld: world["persistentWorld"] !== false,
    },
    rules: {
      levelingMode,
      characterProgression,
      epicLevels,
    },
    players: {
      maxPlayers,
      requireApproval: players["requireApproval"] !== false,
      allowSpectators: players["allowSpectators"] === true,
      allowPvp: players["allowPvp"] === true,
    },
    dm: {
      difficulty,
      rulesStrictness,
      creativity,
      rollNpcDice: dm["rollNpcDice"] !== false,
      showDmRolls: dm["showDmRolls"] !== false,
      persistentNpcs: dm["persistentNpcs"] !== false,
      idlePlus: dm["idlePlus"] === true,
    },
    content: {
      policy,
      allowHomebrew: content["allowHomebrew"] === true,
      allowThirdParty: content["allowThirdParty"] === true,
      houseRules: typeof content["houseRules"] === "string" ? content["houseRules"] : "",
    },
    ruleset: {
      id: "dnd35",
      version: "3.5",
      worldTemplateId: templateId,
      campaignStyleIds: genres.length > 0 ? genres : ["heroic-fantasy"],
      pace,
      multiPlanar: world["multiPlanar"] === true,
      epicLevels,
      levelingMode,
      characterProgression,
    },
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The campaign could not be updated.";
}

export function CampaignDraftEditor({
  detail,
  onBack,
  onSaved,
}: {
  detail: CampaignDetailResponse;
  onBack: () => void;
  onSaved: () => void;
}) {
  const defaults = useMemo(() => settingsFromCampaign(detail), [detail]);
  const [duration, setDuration] = useState(() =>
    durationDraftFromSettings(detail.campaign.settings["duration"]),
  );
  const [name, setName] = useState(detail.campaign.name);
  const [description, setDescription] = useState(detail.campaign.description ?? "");
  const [shortDescription, setShortDescription] = useState(defaults.shortDescription);
  const [genres, setGenres] = useState<CampaignStyleId[]>(defaults.genres);
  const [pace, setPace] = useState<CampaignPace>(defaults.pace);
  const [scale, setScale] = useState<CampaignScale>(defaults.scale);
  const [structure, setStructure] = useState<CampaignStructure>(defaults.structure);
  const [visibility, setVisibility] = useState<CampaignVisibility>(detail.campaign.visibility);
  const [worldMode, setWorldMode] = useState<WorldCreationMode>(defaults.world.mode);
  const [worldTemplateId, setWorldTemplateId] = useState<WorldTemplateId>(defaults.world.templateId);
  const [generationSeed, setGenerationSeed] = useState(detail.campaign.generationSeed ?? "");
  const [multiPlanar, setMultiPlanar] = useState(defaults.world.multiPlanar);
  const [persistentWorld, setPersistentWorld] = useState(defaults.world.persistentWorld);
  const [levelingMode, setLevelingMode] = useState<LevelingMode>(defaults.rules.levelingMode);
  const [characterProgression, setCharacterProgression] = useState<CharacterProgressionPolicy>(
    defaults.rules.characterProgression,
  );
  const [playMode, setPlayMode] = useState<CampaignPlayMode>(detail.campaign.playMode);
  const [maxPlayers, setMaxPlayers] = useState(defaults.players.maxPlayers);
  const [requireApproval, setRequireApproval] = useState(defaults.players.requireApproval);
  const [allowSpectators, setAllowSpectators] = useState(defaults.players.allowSpectators);
  const [allowPvp, setAllowPvp] = useState(defaults.players.allowPvp);
  const [gameMasterMode, setGameMasterMode] = useState<CampaignGameMasterMode>(
    detail.campaign.gameMasterMode,
  );
  const [difficulty, setDifficulty] = useState<CampaignDifficulty>(defaults.dm.difficulty);
  const [rulesStrictness, setRulesStrictness] = useState<RulesStrictness>(defaults.dm.rulesStrictness);
  const [creativity, setCreativity] = useState<DmCreativity>(defaults.dm.creativity);
  const [rollNpcDice, setRollNpcDice] = useState(defaults.dm.rollNpcDice);
  const [showDmRolls, setShowDmRolls] = useState(defaults.dm.showDmRolls);
  const [persistentNpcs, setPersistentNpcs] = useState(defaults.dm.persistentNpcs);
  const [idlePlus, setIdlePlus] = useState(defaults.dm.idlePlus);
  const [contentPolicy, setContentPolicy] = useState<ContentPolicy>(defaults.content.policy);
  const [allowHomebrew, setAllowHomebrew] = useState(defaults.content.allowHomebrew);
  const [allowThirdParty, setAllowThirdParty] = useState(defaults.content.allowThirdParty);
  const [houseRules, setHouseRules] = useState(defaults.content.houseRules);

  const locked = !["draft", "ready"].includes(detail.campaign.status);

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

  const save = useMutation({
    mutationFn: async () => {
      if (locked) throw new Error("Campaign setup is locked after the campaign starts.");
      if (!name.trim()) throw new Error("Give the campaign a name.");
      if (!shortDescription.trim()) throw new Error("Add a short description.");
      if (genres.length < 1) throw new Error("Choose at least one campaign style or genre.");
      if (worldMode === "seeded" && !generationSeed.trim()) {
        throw new Error("Enter a generation seed or use generated world mode.");
      }
      if (playMode === "multiplayer" && maxPlayers < 2) {
        throw new Error("Multiplayer campaigns need at least two player slots.");
      }
      const parsedDuration = parseDurationDraft(duration);
      if (!parsedDuration.success) throw new Error(parsedDuration.error.issues[0]?.message);
      const epicLevels = scale === "epic";
      const settings: CampaignCreatorSettings = {
        creatorVersion: 2,
        ...(parsedDuration.data ? { duration: parsedDuration.data } : {}),
        shortDescription: shortDescription.trim(),
        genres,
        pace,
        scale,
        structure,
        world: { mode: worldMode, templateId: worldTemplateId, multiPlanar, persistentWorld },
        rules: { levelingMode, characterProgression, epicLevels },
        players: { maxPlayers, requireApproval, allowSpectators, allowPvp },
        dm: {
          difficulty,
          rulesStrictness,
          creativity,
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
      return updateCampaign(detail.campaign.id, {
        name: name.trim(),
        description: description.trim() || shortDescription.trim(),
        playMode,
        gameMasterMode,
        visibility,
        maxPlayers,
        ...(worldMode === "seeded" && generationSeed.trim()
          ? { generationSeed: generationSeed.trim() }
          : {}),
        settings,
      });
    },
    onSuccess: () => {
      toast.success("Campaign setup updated.");
      onSaved();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <main className="min-h-[calc(100vh-5rem)] px-4 py-8 lg:px-8" id="main-content">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </button>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">Campaign setup</p>
            <h1 className="mt-2 font-display text-4xl">{detail.campaign.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Resume and revise the campaign configuration without creating a duplicate draft.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1.5 text-sm capitalize">
            {detail.campaign.status}
          </span>
        </div>

        {locked ? (
          <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
            This campaign has already started. Its creator settings are read-only for the MVP.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Concept">
            <Field label="Campaign name"><input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} disabled={locked} /></Field>
            <Field label="Short description"><textarea className={fieldClass} rows={3} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={200} disabled={locked} /></Field>
            <Field label="Detailed description"><textarea className={fieldClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} disabled={locked} /></Field>
            <Field label="Visibility"><select className={fieldClass} value={visibility} onChange={(e) => setVisibility(e.target.value as CampaignVisibility)} disabled={locked}>{visibilityOptions.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</select></Field>
            <Field label={`Game styles & genres (${genres.length}/${CAMPAIGN_STYLE_LIMIT})`}>
              <div className="grid gap-2 sm:grid-cols-2">
                {campaignStyleOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
                    <input type="checkbox" checked={genres.includes(option.id)} onChange={() => toggleGenre(option.id)} disabled={locked} />
                    {option.name}
                  </label>
                ))}
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Pace"><select className={fieldClass} value={pace} onChange={(e) => setPace(e.target.value as CampaignPace)} disabled={locked}>{campaignPaceOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
              <Field label="Scale"><select className={fieldClass} value={scale} onChange={(e) => setScale(e.target.value as CampaignScale)} disabled={locked}>{campaignScaleOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
              <Field label="Structure"><select className={fieldClass} value={structure} onChange={(e) => setStructure(e.target.value as CampaignStructure)} disabled={locked}>{campaignStructureOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            </div>
          </Panel>

          <Panel title="Length & targets">
            <CampaignDurationFields value={duration} onChange={setDuration} disabled={locked} />
          </Panel>

          <Panel title="World">
            <Field label="World mode"><select className={fieldClass} value={worldMode} onChange={(e) => setWorldMode(e.target.value as WorldCreationMode)} disabled={locked}><option value="generated">Generated</option><option value="seeded">Seeded</option></select></Field>
            <Field label="World template"><select className={fieldClass} value={worldTemplateId} onChange={(e) => setWorldTemplateId(e.target.value as WorldTemplateId)} disabled={locked}>{worldTemplateOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            {worldMode === "seeded" ? <Field label="Generation seed"><input className={fieldClass} value={generationSeed} onChange={(e) => setGenerationSeed(e.target.value)} maxLength={256} disabled={locked} /></Field> : null}
            <Toggle label="Multi-planar world" checked={multiPlanar} setChecked={setMultiPlanar} disabled={locked} />
            <Toggle label="Persistent world" checked={persistentWorld} setChecked={setPersistentWorld} disabled={locked} />
          </Panel>

          <Panel title="Rules & progression">
            <Field label="Leveling"><select className={fieldClass} value={levelingMode} onChange={(e) => setLevelingMode(e.target.value as LevelingMode)} disabled={locked}>{levelingModeOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            <Field label="Character progression"><select className={fieldClass} value={characterProgression} onChange={(e) => setCharacterProgression(e.target.value as CharacterProgressionPolicy)} disabled={locked}>{characterProgressionOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
          </Panel>

          <Panel title="Players">
            <Field label="Play mode"><select className={fieldClass} value={playMode} onChange={(e) => { const next = e.target.value as CampaignPlayMode; setPlayMode(next); if (next === "solo") setMaxPlayers(1); else if (maxPlayers < 2) setMaxPlayers(4); }} disabled={locked}><option value="solo">Solo</option><option value="multiplayer">Multiplayer</option></select></Field>
            <Field label="Maximum players"><input className={fieldClass} type="number" min={1} max={12} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} disabled={locked || playMode === "solo"} /></Field>
            <Toggle label="Require approval to join" checked={requireApproval} setChecked={setRequireApproval} disabled={locked} />
            <Toggle label="Allow spectators" checked={allowSpectators} setChecked={setAllowSpectators} disabled={locked} />
            <Toggle label="Allow PvP" checked={allowPvp} setChecked={setAllowPvp} disabled={locked} />
          </Panel>

          <Panel title="Dungeon Master">
            <Field label="DM mode"><select className={fieldClass} value={gameMasterMode} onChange={(e) => setGameMasterMode(e.target.value as CampaignGameMasterMode)} disabled={locked}>{gmOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
            <Field label="Difficulty"><select className={fieldClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value as CampaignDifficulty)} disabled={locked}>{campaignDifficultyOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            <Field label="Rules strictness"><select className={fieldClass} value={rulesStrictness} onChange={(e) => setRulesStrictness(e.target.value as RulesStrictness)} disabled={locked}>{rulesStrictnessOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            <Field label="DM creativity"><select className={fieldClass} value={creativity} onChange={(e) => setCreativity(e.target.value as DmCreativity)} disabled={locked}>{dmCreativityOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            <Toggle label="Roll NPC dice" checked={rollNpcDice} setChecked={setRollNpcDice} disabled={locked} />
            <Toggle label="Show DM rolls" checked={showDmRolls} setChecked={setShowDmRolls} disabled={locked} />
            <Toggle label="Persistent NPCs" checked={persistentNpcs} setChecked={setPersistentNpcs} disabled={locked} />
            <Toggle label="Idle Plus" checked={idlePlus} setChecked={setIdlePlus} disabled={locked} />
          </Panel>

          <Panel title="Content">
            <Field label="Content policy"><select className={fieldClass} value={contentPolicy} onChange={(e) => setContentPolicy(e.target.value as ContentPolicy)} disabled={locked}>{contentPolicyOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></Field>
            <Toggle label="Allow homebrew" checked={allowHomebrew} setChecked={setAllowHomebrew} disabled={locked} />
            <Toggle label="Allow third-party material" checked={allowThirdParty} setChecked={setAllowThirdParty} disabled={locked} />
            <Field label="House rules and table notes"><textarea className={fieldClass} rows={7} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} maxLength={5000} disabled={locked} /></Field>
          </Panel>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            {detail.characters.length} character{detail.characters.length === 1 ? "" : "s"} attached · {detail.characters.filter((character) => character.status === "ready").length} ready
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/characters/new" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-semibold hover:border-gold/50 hover:text-gold">
              <Swords className="h-4 w-4" /> Create character
            </a>
            {!locked ? (
              <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
                {save.isPending ? <Save className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg">
      <h2 className="mb-4 font-display text-2xl">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span>{children}</label>;
}

function Toggle({ label, checked, setChecked, disabled }: { label: string; checked: boolean; setChecked: (value: boolean) => void; disabled: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-3.5 py-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} disabled={disabled} />
    </label>
  );
}
