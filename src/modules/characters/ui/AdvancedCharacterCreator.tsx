import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Backpack,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Dices,
  Feather,
  Heart,
  Languages,
  ListChecks,
  LockKeyhole,
  PawPrint,
  Search,
  Shield,
  Sparkles,
  Swords,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import {
  createSoloCampaign,
  finalizeCharacter,
  getCharacterCreationOptions,
  getClassChoices,
  getCompanions,
  getDivine,
  getFeats,
  getLanguages,
  getPowers,
  getReadiness,
  getSkills,
  getSpells,
  listDraftCampaigns,
  rollAbilityScores,
  rollStartingWealth,
  saveClassChoices,
  saveCompanion,
  saveDivine,
  saveEquipment,
  saveFeats,
  saveLanguages,
  savePowers,
  saveSkills,
  saveSpells,
  type AbilityGenerationMethod,
  type AbilityKey,
  type Alignment,
  type ClassChoiceSection,
  type ClassFeatSelection,
  type ClassOption,
  type CompanionSection,
  type FeatChoiceKind,
  type FeatOption,
  type FeatSelection,
  type PointBuyBudget,
  type PowerSection,
  type ProgressionMode,
  type RaceOption,
  type ReadyResult,
  type RuleChoice,
  type SpellSection,
} from "../client/creatorApi";
import {
  createAdvancedCharacterFoundation,
  getAdvancedEquipment,
} from "../client/advancedCreatorApi";
import "./character-creator.css";
import "./advanced-character-creator.css";

const steps = [
  "Identity",
  "Heritage",
  "Abilities",
  "Class",
  "Class Choices",
  "Skills",
  "Feats",
  "Languages",
  "Wealth",
  "Equipment",
  "Magic",
  "Divine",
  "Companion",
  "Review",
] as const;

const abilityKeys: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const standardArray = [15, 14, 13, 12, 10, 8] as const;
const pointBuyCosts: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 8,
  16: 10,
  17: 13,
  18: 16,
};
const abilityNames: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
const alignmentNames: Record<Alignment, string> = {
  LG: "Lawful Good",
  NG: "Neutral Good",
  CG: "Chaotic Good",
  LN: "Lawful Neutral",
  N: "True Neutral",
  CN: "Chaotic Neutral",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CE: "Chaotic Evil",
};

type RollMethod = "roll-4d6-drop-lowest" | "roll-4d6-reroll-1-2";
type RolledSet = { method: string; scores: number[]; rolls: number[][] };

type TrackClassChoiceState = {
  favoredEnemyTypeId?: string;
  favoredEnemySubtypeId?: string;
  wizardMode?: "generalist" | "specialist";
  schoolId?: string;
  prohibitedSchoolIds?: string[];
  psionDisciplineId?: string;
  dragonShamanTotem?: string;
};

type FeatSlotState = { featId: string; choice: string };

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}
function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The Codex rejected that choice.";
}
function hasStandardArray(abilities: Record<AbilityKey, number>) {
  const assigned = abilityKeys.map((key) => abilities[key]).sort((a, b) => b - a);
  return assigned.every((score, index) => score === standardArray[index]);
}
function pointBuySpent(abilities: Record<AbilityKey, number>) {
  return abilityKeys.reduce((sum, key) => sum + (pointBuyCosts[abilities[key]] ?? 999), 0);
}
function formatCopper(copper: number) {
  const gp = Math.floor(copper / 100);
  const sp = Math.floor((copper % 100) / 10);
  const cp = copper % 10;
  return [gp ? `${gp} gp` : "", sp ? `${sp} sp` : "", cp ? `${cp} cp` : ""]
    .filter(Boolean)
    .join(" ") || "0 gp";
}
function formatWealthFormula(formula: { diceCount: number; dieSides: number; multiplierGp: number } | null | undefined) {
  if (!formula) return "Formula missing";
  return `${formula.diceCount}d${formula.dieSides}${formula.multiplierGp === 1 ? " gp" : ` × ${formula.multiplierGp} gp`}`;
}
function methodLabel(method: AbilityGenerationMethod) {
  if (method === "standard-array") return "Standard array";
  if (method.startsWith("point-buy-")) return `${method.slice("point-buy-".length)} point buy`;
  if (method === "roll-4d6-drop-lowest") return "4d6, drop lowest";
  return "4d6, reroll 1s & 2s";
}

export function AdvancedCharacterCreator() {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [campaignId, setCampaignId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [notes, setNotes] = useState("");
  const [alignment, setAlignment] = useState<Alignment>("N");
  const [raceId, setRaceId] = useState("");
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>("standard");
  const [classId, setClassId] = useState("");
  const [secondaryClassId, setSecondaryClassId] = useState("");
  const [abilityMethod, setAbilityMethod] = useState<AbilityGenerationMethod>("standard-array");
  const [pointBuyBudget, setPointBuyBudget] = useState<PointBuyBudget>(32);
  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });
  const [rolledSet, setRolledSet] = useState<RolledSet | null>(null);
  const [rollAssignments, setRollAssignments] = useState<Record<AbilityKey, number>>({
    str: 0,
    dex: 1,
    con: 2,
    int: 3,
    wis: 4,
    cha: 5,
  });
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState<ReadyResult | null>(null);

  const signedIn = Boolean(session.data);
  const campaigns = useQuery({
    queryKey: ["character-creator", "campaigns"],
    queryFn: listDraftCampaigns,
    enabled: signedIn,
  });
  const options = useQuery({
    queryKey: ["character-creator", "options", "advanced"],
    queryFn: getCharacterCreationOptions,
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });

  const selectedRace = useMemo(
    () => options.data?.races.find((race) => race.id === raceId),
    [options.data, raceId],
  );
  const selectedClass = useMemo(
    () => options.data?.classes.find((characterClass) => characterClass.id === classId),
    [classId, options.data],
  );
  const secondaryClass = useMemo(
    () => options.data?.classes.find((characterClass) => characterClass.id === secondaryClassId),
    [secondaryClassId, options.data],
  );
  const selectedCampaign = campaigns.data?.find((campaign) => campaign.id === campaignId);

  useEffect(() => {
    if (!abilityMethod.startsWith("point-buy-")) return;
    setAbilityMethod(`point-buy-${pointBuyBudget}` as AbilityGenerationMethod);
  }, [pointBuyBudget]);

  const quickCampaign = useMutation({
    mutationFn: createSoloCampaign,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["character-creator", "campaigns"] });
      setCampaignId(created.id);
      setCampaignName("");
      toast.success("Private solo campaign created.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rollAbilities = useMutation({
    mutationFn: (method: RollMethod) => rollAbilityScores(method),
    onSuccess: (result) => {
      setRolledSet(result);
      const assignments = { str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5 } as Record<AbilityKey, number>;
      setRollAssignments(assignments);
      setAbilities(Object.fromEntries(abilityKeys.map((key, index) => [key, result.scores[index] ?? 10])) as Record<AbilityKey, number>);
      toast.success("The Codex rolled six ability scores.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const foundation = useMutation({
    mutationFn: async () => {
      if (!selectedClass) throw new Error("Choose a primary class first.");
      if (!selectedRace) throw new Error("Choose a race first.");
      if (progressionMode === "gestalt" && !secondaryClass) throw new Error("Choose a secondary gestalt class.");
      return createAdvancedCharacterFoundation({
        campaignId,
        name: name.trim(),
        raceId,
        alignment,
        abilities,
        characterClass: selectedClass,
        ...(progressionMode === "gestalt" && secondaryClass ? { secondaryClass } : {}),
        progressionMode,
        abilityGenerationMethod: abilityMethod,
        ...(pronouns.trim() ? { pronouns: pronouns.trim() } : {}),
        ...(notes.trim() ? { playerNotes: notes.trim() } : {}),
      });
    },
    onSuccess: ({ characterId: createdId }) => {
      setCharacterId(createdId);
      setCompleted(new Set([0, 1, 2, 3]));
      setStep(4);
      void queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast.success(progressionMode === "gestalt" ? "Gestalt foundation saved." : "Character foundation saved.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (session.isPending) {
    return <CreatorState title="Opening the Codex…" body="Loading your account and character rules." />;
  }
  if (!session.data) {
    return (
      <CreatorState
        title="Sign in to create an adventurer"
        body="Characters are persistent and belong to your Endless Codex account."
        action={<button className="creator-primary" onClick={useAuthModal.getState().openLogin}>Sign in</button>}
      />
    );
  }
  if (campaigns.isLoading || options.isLoading) {
    return <CreatorState title="Preparing character creation…" body="Loading campaigns, races, classes, and rules." />;
  }
  if (campaigns.error || options.error) {
    return (
      <CreatorState
        title="The character creator could not open"
        body={campaigns.error?.message ?? options.error?.message ?? "Character creation data could not be loaded."}
        action={<button className="creator-primary" onClick={() => { void campaigns.refetch(); void options.refetch(); }}>Try again</button>}
      />
    );
  }

  if (ready) {
    return (
      <main className="creator-page">
        <section className="creator-complete">
          <div className="creator-complete-mark"><Check size={34} /></div>
          <p className="creator-eyebrow">CHARACTER COMPLETE</p>
          <h1>{name}</h1>
          <p>
            Level 1 {selectedRace?.name} {selectedClass?.name}
            {progressionMode === "gestalt" && secondaryClass ? ` // ${secondaryClass.name}` : ""} · {alignmentNames[alignment]}
          </p>
          <div className="creator-complete-stats">
            <span><Heart size={18} /> {ready.maximumHitPoints} HP</span>
            <span><Shield size={18} /> {progressionMode === "gestalt" ? "Gestalt" : "Standard"}</span>
            <span><BookOpen size={18} /> {selectedCampaign?.name ?? "Campaign"}</span>
          </div>
          <div className="creator-complete-actions">
            <Link to="/characters" className="creator-primary">View my characters</Link>
            <Link to="/characters/new" className="creator-secondary">Create another</Link>
          </div>
        </section>
      </main>
    );
  }

  const markAndAdvance = (index: number) => {
    setCompleted((current) => new Set([...current, index]));
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const abilityStepValid = (() => {
    if (abilityMethod === "standard-array") return hasStandardArray(abilities);
    if (abilityMethod.startsWith("point-buy-")) return pointBuySpent(abilities) === pointBuyBudget;
    return Boolean(rolledSet && new Set(Object.values(rollAssignments)).size === 6);
  })();
  const classesValid = Boolean(
    selectedClass &&
      selectedClass.allowedAlignments.includes(alignment) &&
      selectedClass.startingWealth &&
      (progressionMode === "standard" ||
        (secondaryClass &&
          secondaryClass.id !== selectedClass.id &&
          secondaryClass.allowedAlignments.includes(alignment) &&
          secondaryClass.startingWealth)),
  );
  const canBaseContinue =
    (step === 0 && Boolean(campaignId && name.trim())) ||
    (step === 1 && Boolean(raceId)) ||
    (step === 2 && abilityStepValid) ||
    (step === 3 && classesValid);

  return (
    <main className="creator-page" id="main-content">
      <div className="creator-shell">
        <header className="creator-header">
          <div>
            <p className="creator-eyebrow">DUNGEONS & DRAGONS 3.5</p>
            <h1>Forge an adventurer</h1>
            <p>Point buy, rolled abilities, level-adjusted races, gestalt classes, and server-validated rules.</p>
          </div>
          <div className="creator-level-seal"><span>LEVEL</span><strong>1</strong></div>
        </header>

        <nav className="creator-steps" aria-label="Character creation progress">
          {steps.map((label, index) => (
            <button
              key={label}
              className={index === step ? "active" : completed.has(index) ? "complete" : ""}
              disabled={characterId !== null ? index < 4 || index > step : index > step}
              onClick={() => { if (index < step && (characterId === null || index >= 4)) setStep(index); }}
            >
              <span>{completed.has(index) ? <Check size={14} /> : index + 1}</span>{label}
            </button>
          ))}
        </nav>

        <div className="creator-body">
          <section className="creator-stage">
            {step === 0 && (
              <IdentityStep
                campaigns={campaigns.data ?? []}
                campaignId={campaignId}
                setCampaignId={setCampaignId}
                campaignName={campaignName}
                setCampaignName={setCampaignName}
                createCampaign={() => { const trimmed = campaignName.trim(); if (trimmed) quickCampaign.mutate(trimmed); }}
                creatingCampaign={quickCampaign.isPending}
                name={name}
                setName={setName}
                pronouns={pronouns}
                setPronouns={setPronouns}
                notes={notes}
                setNotes={setNotes}
              />
            )}
            {step === 1 && (
              <HeritageStep
                races={options.data?.races ?? []}
                raceId={raceId}
                setRaceId={setRaceId}
                alignment={alignment}
                setAlignment={setAlignment}
                maximumLevelAdjustment={options.data?.maximumLevelAdjustment ?? 8}
              />
            )}
            {step === 2 && (
              <AbilitiesStep
                abilities={abilities}
                setAbilities={setAbilities}
                selectedRace={selectedRace}
                method={abilityMethod}
                setMethod={(method) => {
                  setAbilityMethod(method);
                  setRolledSet(null);
                  if (method === "standard-array") setAbilities({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
                  if (method.startsWith("point-buy-")) {
                    const budget = Number(method.slice("point-buy-".length)) as PointBuyBudget;
                    setPointBuyBudget(budget);
                    setAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
                  }
                }}
                pointBuyBudget={pointBuyBudget}
                setPointBuyBudget={setPointBuyBudget}
                rolledSet={rolledSet}
                rollAssignments={rollAssignments}
                assignRoll={(ability, poolIndex) => {
                  const previous = rollAssignments[ability];
                  const other = abilityKeys.find((key) => key !== ability && rollAssignments[key] === poolIndex);
                  const next = { ...rollAssignments, [ability]: poolIndex };
                  if (other) next[other] = previous;
                  setRollAssignments(next);
                  if (rolledSet) {
                    setAbilities(Object.fromEntries(abilityKeys.map((key) => [key, rolledSet.scores[next[key]] ?? 10])) as Record<AbilityKey, number>);
                  }
                }}
                roll={(method) => rollAbilities.mutate(method)}
                rolling={rollAbilities.isPending}
              />
            )}
            {step === 3 && (
              <ClassStep
                classes={options.data?.classes ?? []}
                classId={classId}
                setClassId={(value) => { setClassId(value); if (value === secondaryClassId) setSecondaryClassId(""); }}
                secondaryClassId={secondaryClassId}
                setSecondaryClassId={setSecondaryClassId}
                progressionMode={progressionMode}
                setProgressionMode={(mode) => { setProgressionMode(mode); if (mode === "standard") setSecondaryClassId(""); }}
                alignment={alignment}
              />
            )}
            {characterId && step === 4 && <ClassChoicesStep characterId={characterId} onComplete={() => markAndAdvance(4)} />}
            {characterId && step === 5 && <SkillsStep characterId={characterId} onComplete={() => markAndAdvance(5)} />}
            {characterId && step === 6 && <FeatsStep characterId={characterId} onComplete={() => markAndAdvance(6)} />}
            {characterId && step === 7 && <LanguagesStep characterId={characterId} onComplete={() => markAndAdvance(7)} />}
            {characterId && step === 8 && <WealthStep characterId={characterId} onComplete={() => markAndAdvance(8)} />}
            {characterId && step === 9 && <EquipmentStep characterId={characterId} onComplete={() => markAndAdvance(9)} />}
            {characterId && step === 10 && <MagicStep characterId={characterId} onComplete={() => markAndAdvance(10)} />}
            {characterId && step === 11 && <DivineStep characterId={characterId} onComplete={() => markAndAdvance(11)} />}
            {characterId && step === 12 && <CompanionStep characterId={characterId} onComplete={() => markAndAdvance(12)} />}
            {characterId && step === 13 && (
              <ReviewStep
                characterId={characterId}
                race={selectedRace}
                characterClass={selectedClass}
                secondaryClass={secondaryClass}
                progressionMode={progressionMode}
                alignment={alignment}
                abilities={abilities}
                name={name}
                campaignName={selectedCampaign?.name ?? "Campaign"}
                abilityMethod={abilityMethod}
                onReady={(result) => { setCompleted((current) => new Set([...current, 13])); setReady(result); }}
              />
            )}
          </section>

          <CreatorSummary
            currentStep={step}
            campaignName={selectedCampaign?.name}
            name={name}
            alignment={alignment}
            race={selectedRace}
            characterClass={selectedClass}
            secondaryClass={secondaryClass}
            progressionMode={progressionMode}
            abilities={abilities}
            abilityMethod={abilityMethod}
            characterId={characterId}
          />
        </div>

        {step < 4 && (
          <footer className="creator-footer">
            <button className="creator-secondary" disabled={step === 0 || foundation.isPending} onClick={() => setStep((value) => value - 1)}>
              <ChevronLeft size={18} /> Back
            </button>
            {step < 3 ? (
              <button className="creator-primary" disabled={!canBaseContinue} onClick={() => { setCompleted((current) => new Set([...current, step])); setStep((value) => value + 1); }}>
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button className="creator-primary" disabled={!canBaseContinue || foundation.isPending} onClick={() => foundation.mutate()}>
                <Sparkles size={18} /> {foundation.isPending ? "Inscribing choices…" : "Begin rules-driven creation"}
              </button>
            )}
          </footer>
        )}
      </div>
    </main>
  );
}

function CreatorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <main className="creator-page creator-state-page"><section className="creator-state"><BookOpen size={42} /><h1>{title}</h1><p>{body}</p>{action}</section></main>;
}
function StepHeading({ icon, eyebrow, title, body }: { icon: ReactNode; eyebrow: string; title: string; body: string }) {
  return <div className="creator-step-heading"><span className="creator-step-icon">{icon}</span><div><p>{eyebrow}</p><h2>{title}</h2><span>{body}</span></div></div>;
}
function AsyncStep({ title, error, loading, children }: { title: string; error?: unknown; loading: boolean; children: ReactNode }) {
  if (loading) return <div className="creator-inline-state"><Dices className="creator-spin" /><strong>Consulting the rules…</strong><span>{title}</span></div>;
  if (error) return <div className="creator-error"><strong>Unable to load this step</strong><span>{errorMessage(error)}</span></div>;
  return <>{children}</>;
}
function StepActions({ onSave, saving, disabled, label = "Save & continue" }: { onSave: () => void; saving: boolean; disabled?: boolean; label?: string }) {
  return <div className="creator-step-actions"><button className="creator-primary" disabled={saving || disabled} onClick={onSave}>{saving ? "Saving…" : label} <ChevronRight size={17} /></button></div>;
}
function NotRequired({ title, body }: { title: string; body: string }) {
  return <div className="creator-info-card"><Check /><div><strong>{title}</strong><span>{body}</span></div></div>;
}

function IdentityStep(props: {
  campaigns: { id: string; name: string }[];
  campaignId: string;
  setCampaignId: (value: string) => void;
  campaignName: string;
  setCampaignName: (value: string) => void;
  createCampaign: () => void;
  creatingCampaign: boolean;
  name: string;
  setName: (value: string) => void;
  pronouns: string;
  setPronouns: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}) {
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Feather />} eyebrow="Step one" title="Name the hero" body="Choose a campaign and define the character's identity." />
      <div className="creator-form-grid">
        <label className="creator-field creator-field-wide"><span>Campaign</span><select value={props.campaignId} onChange={(event) => props.setCampaignId(event.target.value)}><option value="">Select a D&D 3.5 campaign…</option>{props.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
        <div className="creator-quick-campaign creator-field-wide"><div><strong>Need a campaign?</strong><span>Create a private solo AI campaign without leaving the creator.</span></div><div><input value={props.campaignName} maxLength={120} placeholder="New campaign name" onChange={(event) => props.setCampaignName(event.target.value)} /><button type="button" disabled={!props.campaignName.trim() || props.creatingCampaign} onClick={props.createCampaign}>{props.creatingCampaign ? "Creating…" : "Create"}</button></div></div>
        <label className="creator-field"><span>Character name</span><input autoFocus value={props.name} maxLength={120} placeholder="Mira Thornveil" onChange={(event) => props.setName(event.target.value)} /></label>
        <label className="creator-field"><span>Pronouns <small>optional</small></span><input value={props.pronouns} maxLength={120} placeholder="she / her" onChange={(event) => props.setPronouns(event.target.value)} /></label>
        <label className="creator-field creator-field-wide"><span>Player notes <small>optional</small></span><textarea value={props.notes} maxLength={20000} rows={4} placeholder="Details you want the Codex to preserve…" onChange={(event) => props.setNotes(event.target.value)} /></label>
      </div>
    </div>
  );
}

function HeritageStep({ races, raceId, setRaceId, alignment, setAlignment, maximumLevelAdjustment }: {
  races: RaceOption[];
  raceId: string;
  setRaceId: (value: string) => void;
  alignment: Alignment;
  setAlignment: (value: Alignment) => void;
  maximumLevelAdjustment: number;
}) {
  const [filter, setFilter] = useState("");
  const [la, setLa] = useState<number | "all">("all");
  const visible = races.filter((race) => {
    const matchesText = `${race.name} ${race.description} ${race.rulesText}`.toLowerCase().includes(filter.toLowerCase());
    return matchesText && (la === "all" || (race.levelAdjustment ?? 0) === la);
  });
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Shield />} eyebrow="Heritage" title="Choose race and alignment" body={`The catalog accepts playable races through +${maximumLevelAdjustment} level adjustment.`} />
      <div className="creator-toolbar-row">
        <label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search races…" /></label>
        <select className="creator-compact-select" value={String(la)} onChange={(event) => setLa(event.target.value === "all" ? "all" : Number(event.target.value))}>
          <option value="all">All level adjustments</option>
          {Array.from({ length: maximumLevelAdjustment + 1 }, (_, value) => <option key={value} value={value}>LA +{value}</option>)}
        </select>
      </div>
      <div className="creator-card-grid">
        {visible.map((race) => (
          <button key={race.id} className={`creator-choice-card ${race.id === raceId ? "selected" : ""}`} onClick={() => setRaceId(race.id)}>
            <span className="creator-choice-icon"><UserRound /></span>
            <span>
              <h3>{race.name}{race.isHomebrew ? <small>Homebrew</small> : null}</h3>
              <p>{race.description || race.rulesText || "D&D 3.5 race."}</p>
              <span className="creator-tags">
                <span>{race.size}</span><span>{race.baseSpeedFeet} ft.</span><span>LA +{race.levelAdjustment ?? 0}</span>
                {race.racialHitDice > 0 && <span>{race.racialHitDice}d{race.racialHitDie ?? "?"} racial HD</span>}
                {Object.entries(race.abilityModifiers).map(([key, value]) => <span key={key}>{key.toUpperCase()} {signed(value ?? 0)}</span>)}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="creator-alignment-block"><h3>Alignment</h3><div className="creator-alignment-grid">{(Object.keys(alignmentNames) as Alignment[]).map((key) => <button key={key} className={alignment === key ? "selected" : ""} onClick={() => setAlignment(key)}><strong>{key}</strong><span>{alignmentNames[key]}</span></button>)}</div></div>
    </div>
  );
}

function AbilitiesStep(props: {
  abilities: Record<AbilityKey, number>;
  setAbilities: (value: Record<AbilityKey, number>) => void;
  selectedRace: RaceOption | undefined;
  method: AbilityGenerationMethod;
  setMethod: (method: AbilityGenerationMethod) => void;
  pointBuyBudget: PointBuyBudget;
  setPointBuyBudget: (budget: PointBuyBudget) => void;
  rolledSet: RolledSet | null;
  rollAssignments: Record<AbilityKey, number>;
  assignRoll: (ability: AbilityKey, poolIndex: number) => void;
  roll: (method: RollMethod) => void;
  rolling: boolean;
}) {
  const spent = pointBuySpent(props.abilities);
  const swapStandard = (ability: AbilityKey, score: number) => {
    const current = props.abilities[ability];
    const other = abilityKeys.find((key) => key !== ability && props.abilities[key] === score);
    const next = { ...props.abilities, [ability]: score };
    if (other) next[other] = current;
    props.setAbilities(next);
  };
  const chooseMethod = (method: AbilityGenerationMethod) => props.setMethod(method);
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Dices />} eyebrow="Ability scores" title="Choose how ability scores are generated" body="Point-buy totals are validated on the server. Random methods are rolled by the server, then you assign the six results." />
      <div className="creator-method-grid">
        <button className={props.method === "standard-array" ? "selected" : ""} onClick={() => chooseMethod("standard-array")}><strong>Standard array</strong><span>15, 14, 13, 12, 10, 8</span></button>
        {[22, 32, 52, 72].map((budget) => <button key={budget} className={props.method === `point-buy-${budget}` ? "selected" : ""} onClick={() => { props.setPointBuyBudget(budget as PointBuyBudget); chooseMethod(`point-buy-${budget}` as AbilityGenerationMethod); }}><strong>{budget} point buy</strong><span>Buy scores from 8 through 18</span></button>)}
        <button className={props.method === "roll-4d6-drop-lowest" ? "selected" : ""} onClick={() => chooseMethod("roll-4d6-drop-lowest")}><strong>4d6, drop lowest</strong><span>Classic six-score roll</span></button>
        <button className={props.method === "roll-4d6-reroll-1-2" ? "selected" : ""} onClick={() => chooseMethod("roll-4d6-reroll-1-2")}><strong>4d6, reroll 1s & 2s</strong><span>Keep all four rerolled dice</span></button>
      </div>

      {props.method.startsWith("point-buy-") && <div className="creator-budget-bar creator-top-gap"><div><span>{props.pointBuyBudget}-point budget</span><strong>{spent} / {props.pointBuyBudget} spent · {props.pointBuyBudget - spent} remaining</strong></div><progress value={Math.min(spent, props.pointBuyBudget)} max={props.pointBuyBudget} /></div>}
      {(props.method === "roll-4d6-drop-lowest" || props.method === "roll-4d6-reroll-1-2") && (
        <div className="creator-roll-panel creator-top-gap">
          <div><strong>{methodLabel(props.method)}</strong><span>{props.rolledSet ? "Assign each unique rolled result slot to an ability." : "Roll six scores before continuing."}</span></div>
          <button className="creator-primary" disabled={props.rolling} onClick={() => props.roll(props.method as RollMethod)}><Dices size={18} /> {props.rolling ? "Rolling…" : props.rolledSet ? "Reroll all six" : "Roll six scores"}</button>
        </div>
      )}

      <div className="creator-abilities-grid creator-top-gap">
        {abilityKeys.map((ability) => {
          const racial = props.selectedRace?.abilityModifiers[ability] ?? 0;
          const total = props.abilities[ability] + racial;
          return (
            <div className="creator-ability-card" key={ability}>
              <span>{ability.toUpperCase()}</span><h3>{abilityNames[ability]}</h3>
              {props.method === "standard-array" && <select value={props.abilities[ability]} onChange={(event) => swapStandard(ability, Number(event.target.value))}>{standardArray.map((score) => <option key={score} value={score}>{score}</option>)}</select>}
              {props.method.startsWith("point-buy-") && <div className="creator-point-score"><button disabled={props.abilities[ability] <= 8} onClick={() => props.setAbilities({ ...props.abilities, [ability]: props.abilities[ability] - 1 })}>−</button><strong>{props.abilities[ability]}</strong><button disabled={props.abilities[ability] >= 18} onClick={() => props.setAbilities({ ...props.abilities, [ability]: props.abilities[ability] + 1 })}>+</button><small>{pointBuyCosts[props.abilities[ability]] ?? "—"} pts</small></div>}
              {(props.method === "roll-4d6-drop-lowest" || props.method === "roll-4d6-reroll-1-2") && <select disabled={!props.rolledSet} value={props.rollAssignments[ability]} onChange={(event) => props.assignRoll(ability, Number(event.target.value))}>{(props.rolledSet?.scores ?? []).map((score, index) => <option key={index} value={index}>{score} · [{props.rolledSet?.rolls[index]?.join(", ")}]</option>)}</select>}
              <div className="creator-score-math"><span>Base {props.abilities[ability]}</span><span>Race {signed(racial)}</span><strong>{total}</strong></div>
              <p>Modifier <b>{signed(abilityModifier(total))}</b></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassStep({ classes, classId, setClassId, secondaryClassId, setSecondaryClassId, progressionMode, setProgressionMode, alignment }: {
  classes: ClassOption[];
  classId: string;
  setClassId: (value: string) => void;
  secondaryClassId: string;
  setSecondaryClassId: (value: string) => void;
  progressionMode: ProgressionMode;
  setProgressionMode: (value: ProgressionMode) => void;
  alignment: Alignment;
}) {
  const [filter, setFilter] = useState("");
  const visible = classes.filter((characterClass) => `${characterClass.name} ${characterClass.description} ${characterClass.classSkills.map((skill) => skill.name).join(" ")}`.toLowerCase().includes(filter.toLowerCase()));
  const classCard = (characterClass: ClassOption, selected: boolean, select: () => void, disabled = false) => {
    const alignmentAllowed = characterClass.allowedAlignments.includes(alignment);
    return <button key={characterClass.id} disabled={disabled} className={`creator-choice-card creator-class-card ${selected ? "selected" : ""} ${alignmentAllowed ? "" : "invalid"}`} onClick={select}><span className="creator-choice-icon"><Swords /></span><span><h3>{characterClass.name}{characterClass.isHomebrew ? <small>Homebrew</small> : null}</h3><div className="creator-class-stats"><span>d{characterClass.hitDie} HD</span><span>{characterClass.skillPointsPerLevel} + INT skills</span><span>{formatWealthFormula(characterClass.startingWealth)}</span></div><p>{characterClass.description || characterClass.rulesText || "D&D 3.5 base class."}</p><details className="creator-class-skills" onClick={(event) => event.stopPropagation()}><summary>{characterClass.classSkills.length} class skills</summary><span>{characterClass.classSkills.map((skill) => skill.name).join(", ") || "No class-skill data loaded."}</span></details>{!alignmentAllowed && <span className="creator-warning">{characterClass.prerequisiteExplanation ?? `${characterClass.name} does not allow ${alignmentNames[alignment]}.`}</span>}{!characterClass.startingWealth && <span className="creator-warning">Starting wealth formula is missing.</span>}</span></button>;
  };
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Swords />} eyebrow="Calling" title="Choose class progression" body="Standard characters choose one class. Gestalt characters choose two different classes and take the better overlapping chassis benefits." />
      <div className="creator-progression-choice"><button className={progressionMode === "standard" ? "selected" : ""} onClick={() => setProgressionMode("standard")}><strong>Standard</strong><span>One class per character level</span></button><button className={progressionMode === "gestalt" ? "selected" : ""} onClick={() => setProgressionMode("gestalt")}><strong>Gestalt</strong><span>Two classes at each level; best overlapping values</span></button></div>
      <label className="creator-search creator-top-gap"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search classes or class skills…" /></label>
      <h3 className="creator-track-title">{progressionMode === "gestalt" ? "Track 1 · Primary class" : "First class"}</h3>
      <div className="creator-card-grid creator-class-grid">{visible.map((characterClass) => classCard(characterClass, characterClass.id === classId, () => setClassId(characterClass.id)))}</div>
      {progressionMode === "gestalt" && <><h3 className="creator-track-title creator-top-gap">Track 2 · Secondary class</h3><div className="creator-card-grid creator-class-grid">{visible.map((characterClass) => classCard(characterClass, characterClass.id === secondaryClassId, () => setSecondaryClassId(characterClass.id), characterClass.id === classId))}</div></>}
    </div>
  );
}

function normalizedClassChoiceSections(data: Awaited<ReturnType<typeof getClassChoices>> | undefined): ClassChoiceSection[] {
  if (!data) return [];
  return data.sections ?? [{
    track: data.track ?? 1,
    classId: data.classId,
    className: data.className,
    required: data.required,
    choice: data.choice,
    options: data.options,
    schools: data.schools,
    generalistAllowed: data.generalistAllowed,
    subtypeRequiredFor: data.subtypeRequiredFor,
    subtypeOptions: data.subtypeOptions,
    selected: data.selected,
  }];
}

function ClassChoicesStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "class-choices"], queryFn: () => getClassChoices(characterId) });
  const [states, setStates] = useState<Record<number, TrackClassChoiceState>>({});
  const sections = normalizedClassChoiceSections(page.data);
  useEffect(() => {
    if (!page.data) return;
    const next: Record<number, TrackClassChoiceState> = {};
    for (const section of normalizedClassChoiceSections(page.data)) {
      const selected = section.selected[0];
      if (section.choice === "favored-enemy") next[section.track] = { favoredEnemyTypeId: selected?.contentId ?? "", favoredEnemySubtypeId: typeof selected?.parameters?.["subtypeId"] === "string" ? selected.parameters["subtypeId"] as string : "" };
      else if (section.choice === "school-specialization") next[section.track] = selected?.valueText === "generalist" || !selected ? { wizardMode: "generalist", schoolId: "", prohibitedSchoolIds: [] } : { wizardMode: "specialist", schoolId: selected.contentId ?? "", prohibitedSchoolIds: Array.isArray(selected.parameters?.["prohibitedSchoolIds"]) ? selected.parameters!["prohibitedSchoolIds"]!.filter((value): value is string => typeof value === "string") : [] };
      else if (section.choice === "psionic-discipline") next[section.track] = { psionDisciplineId: selected?.contentId ?? "" };
      else if (section.choice === "totem-dragon") next[section.track] = { dragonShamanTotem: selected?.valueText ?? (typeof selected?.parameters?.["totem"] === "string" ? selected.parameters["totem"] as string : "") };
      else next[section.track] = {};
    }
    setStates(next);
  }, [page.data]);
  const update = (track: number, patch: Partial<TrackClassChoiceState>) => setStates((current) => ({ ...current, [track]: { ...(current[track] ?? {}), ...patch } }));
  const valid = sections.every((section) => {
    if (!section.required) return true;
    const state = states[section.track] ?? {};
    if (section.choice === "favored-enemy") {
      const type = section.options?.find((option) => option.id === state.favoredEnemyTypeId);
      return Boolean(state.favoredEnemyTypeId && (!type || !section.subtypeRequiredFor?.includes(type.slug) || state.favoredEnemySubtypeId));
    }
    if (section.choice === "school-specialization") {
      if ((state.wizardMode ?? "generalist") === "generalist") return true;
      const school = section.schools?.find((option) => option.id === state.schoolId);
      const required = school?.slug === "divination" ? 1 : 2;
      return Boolean(state.schoolId && (state.prohibitedSchoolIds?.length ?? 0) === required);
    }
    if (section.choice === "psionic-discipline") return Boolean(state.psionDisciplineId);
    if (section.choice === "totem-dragon") return Boolean(state.dragonShamanTotem);
    return true;
  });
  const save = useMutation({
    mutationFn: () => saveClassChoices(characterId, {
      trackChoices: sections.map((section) => {
        const state = states[section.track] ?? {};
        return {
          track: section.track as 1 | 2,
          ...(section.choice === "favored-enemy" ? { favoredEnemyTypeId: state.favoredEnemyTypeId || null, favoredEnemySubtypeId: state.favoredEnemySubtypeId || null } : {}),
          ...(section.choice === "school-specialization" ? { wizardSpecialization: (state.wizardMode ?? "generalist") === "generalist" ? null : { schoolId: state.schoolId ?? "", prohibitedSchoolIds: state.prohibitedSchoolIds ?? [] } } : {}),
          ...(section.choice === "psionic-discipline" ? { psionDisciplineId: state.psionDisciplineId || null } : {}),
          ...(section.choice === "totem-dragon" ? { dragonShamanTotem: state.dragonShamanTotem || null } : {}),
        };
      }),
    }),
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <AsyncStep title="Loading class choices" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<ListChecks />} eyebrow="Class features" title="Resolve first-level class choices" body="Gestalt tracks are resolved separately so neither class loses its first-level decisions." />
        <div className="creator-track-stack">{sections.map((section) => {
          const state = states[section.track] ?? {};
          const selectedType = section.options?.find((option) => option.id === state.favoredEnemyTypeId);
          const subtypeRequired = Boolean(selectedType && section.subtypeRequiredFor?.includes(selectedType.slug));
          const wizardSchool = section.schools?.find((school) => school.id === state.schoolId);
          const requiredProhibited = wizardSchool?.slug === "divination" ? 1 : 2;
          return <section className="creator-track-section" key={section.track}><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className}</span></div>{section.choice === null && <NotRequired title="No extra class choice" body={`${section.className} has no additional first-level decision in this phase.`} />}{section.choice === "favored-enemy" && <div className="creator-form-grid"><label className="creator-field creator-field-wide"><span>Favored enemy</span><select value={state.favoredEnemyTypeId ?? ""} onChange={(event) => update(section.track, { favoredEnemyTypeId: event.target.value, favoredEnemySubtypeId: "" })}><option value="">Choose creature type…</option>{section.options?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>{subtypeRequired && <label className="creator-field creator-field-wide"><span>{selectedType?.name} subtype</span><select value={state.favoredEnemySubtypeId ?? ""} onChange={(event) => update(section.track, { favoredEnemySubtypeId: event.target.value })}><option value="">Choose subtype…</option>{(section.subtypeOptions?.[selectedType?.slug ?? ""] ?? []).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}</div>}{section.choice === "school-specialization" && <div><div className="creator-segmented"><button className={(state.wizardMode ?? "generalist") === "generalist" ? "selected" : ""} onClick={() => update(section.track, { wizardMode: "generalist", schoolId: "", prohibitedSchoolIds: [] })}>Generalist</button><button className={state.wizardMode === "specialist" ? "selected" : ""} onClick={() => update(section.track, { wizardMode: "specialist" })}>Specialist</button></div>{state.wizardMode === "specialist" && <div className="creator-form-grid creator-top-gap"><label className="creator-field creator-field-wide"><span>Specialist school</span><select value={state.schoolId ?? ""} onChange={(event) => update(section.track, { schoolId: event.target.value, prohibitedSchoolIds: [] })}><option value="">Choose school…</option>{section.schools?.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label><div className="creator-field creator-field-wide"><span>Prohibited schools — choose {requiredProhibited}</span><div className="creator-chip-grid">{section.schools?.filter((school) => school.id !== state.schoolId && !["divination", "universal"].includes(school.slug)).map((school) => <button key={school.id} className={state.prohibitedSchoolIds?.includes(school.id) ? "selected" : ""} onClick={() => { const current = state.prohibitedSchoolIds ?? []; update(section.track, { prohibitedSchoolIds: current.includes(school.id) ? current.filter((id) => id !== school.id) : current.length < requiredProhibited ? [...current, school.id] : current }); }}>{school.name}</button>)}</div></div></div>}</div>}{section.choice === "psionic-discipline" && <div className="creator-card-grid">{section.options?.map((option) => <button key={option.id} className={`creator-choice-card ${state.psionDisciplineId === option.id ? "selected" : ""}`} onClick={() => update(section.track, { psionDisciplineId: option.id })}><span className="creator-choice-icon"><Sparkles /></span><span><h3>{option.name}</h3><p>{option.specialistName ? `Specialist: ${option.specialistName}` : "Psionic discipline"}</p></span></button>)}</div>}{section.choice === "totem-dragon" && <div className="creator-card-grid">{section.options?.map((option) => <button key={option.slug} className={`creator-choice-card ${state.dragonShamanTotem === option.slug ? "selected" : ""}`} onClick={() => update(section.track, { dragonShamanTotem: option.slug })}><span className="creator-choice-icon"><Sparkles /></span><span><h3>{option.name}</h3><p>{option.breathWeapon ?? "Dragon totem"}</p><span className="creator-tags">{option.classSkills?.map((skill) => <span key={skill}>{skill.replaceAll("-", " ")}</span>)}</span></span></button>)}</div>}</section>;
        })}</div>
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!valid} />
      </div>
    </AsyncStep>
  );
}

function SkillsStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "skills"], queryFn: () => getSkills(characterId) });
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [specializations, setSpecializations] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  useEffect(() => { if (!page.data) return; const nextRanks: Record<string, number> = {}; const nextSpecs: Record<string, string> = {}; for (const selection of page.data.selections) { nextRanks[selection.skillId] = selection.ranks; nextSpecs[selection.skillId] = selection.specialization; } setRanks(nextRanks); setSpecializations(nextSpecs); }, [page.data]);
  const spent = useMemo(() => page.data?.options.reduce((sum, option) => sum + (ranks[option.id] ?? 0) * option.pointCostPerRank, 0) ?? 0, [page.data, ranks]);
  const visible = page.data?.options.filter((option) => `${option.name} ${option.ability ?? ""}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const save = useMutation({ mutationFn: () => saveSkills(characterId, (page.data?.options ?? []).flatMap((option) => { const value = ranks[option.id] ?? 0; if (value <= 0) return []; const specialization = specializations[option.id]?.trim(); return [{ skillId: option.id, ranks: value, ...(specialization ? { specialization } : {}) }]; })), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading skill rules" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<ListChecks />} eyebrow="Training" title="Spend skill points" body="Every skill is shown with its class/cross-class status. Gestalt uses the union of both class skill lists." />{page.data?.classes && page.data.classes.length > 1 && <div className="creator-info-card"><Swords /><div><strong>Gestalt class-skill union</strong><span>{page.data.classes.map((entry) => `Track ${entry.track}: ${entry.className}`).join(" · ")}</span></div></div>}<div className="creator-budget-bar"><div><span>Skill-point budget</span><strong>{spent} / {page.data?.budget ?? 0}</strong></div><progress value={spent} max={page.data?.budget ?? 1} /></div><label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter skills…" /></label><div className="creator-table-wrap"><table className="creator-table"><thead><tr><th>Skill</th><th>Ability</th><th>Type</th><th>Max</th><th>Ranks</th></tr></thead><tbody>{visible.map((option) => <tr key={option.id}><td><strong>{option.name}</strong>{option.trainedOnly ? <small>Trained only</small> : null}{option.requiresSpecialization && option.slug !== "speak-language" ? <input className="creator-inline-input" placeholder="Specialization" value={specializations[option.id] ?? ""} onChange={(event) => setSpecializations((current) => ({ ...current, [option.id]: event.target.value }))} /> : null}{option.slug === "speak-language" ? <select className="creator-inline-input" value={specializations[option.id] ?? ""} onChange={(event) => setSpecializations((current) => ({ ...current, [option.id]: event.target.value }))}><option value="">Choose language…</option>{page.data?.speakLanguageOptions?.map((language) => <option key={language.id} value={language.id}>{language.name}</option>)}</select> : null}</td><td>{option.ability?.toUpperCase() ?? "—"}</td><td><span className={option.isClassSkill ? "creator-pill good" : "creator-pill"}>{option.isClassSkill ? "Class" : "Cross-class"}</span><small>{option.pointCostPerRank} pt / rank</small></td><td>{option.maximumRanks}</td><td><input type="number" min={0} max={option.maximumRanks} step={option.isClassSkill ? 1 : 0.5} value={ranks[option.id] ?? 0} onChange={(event) => setRanks((current) => ({ ...current, [option.id]: Number(event.target.value) }))} /></td></tr>)}</tbody></table></div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={spent !== page.data?.budget || spent <= 0} /></div></AsyncStep>;
}

function FeatsStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "feats"], queryFn: () => getFeats(characterId) });
  const [level, setLevel] = useState<FeatSlotState[]>([]);
  const [racial, setRacial] = useState<FeatSlotState[]>([]);
  const [classBonus, setClassBonus] = useState<FeatSlotState[]>([]);
  const [filter, setFilter] = useState("");
  useEffect(() => { if (!page.data) return; const hydrate = (kind: "level" | "race" | "class", count: number) => { const rows = page.data!.selected.filter((entry) => entry.grantKind === kind); return Array.from({ length: count }, (_, index) => ({ featId: rows[index]?.featId ?? "", choice: rows[index]?.choices?.[0]?.contentId ?? rows[index]?.choices?.[0]?.text ?? "" })); }; setLevel(hydrate("level", page.data.required.level)); setRacial(hydrate("race", page.data.required.racialBonus)); setClassBonus(hydrate("class", page.data.required.classBonusFeatures.length)); }, [page.data]);
  const toSelection = (slot: FeatSlotState): FeatSelection => { const feat = page.data?.options.find((option) => option.id === slot.featId); const choices: RuleChoice[] | undefined = feat && feat.choiceKind !== "none" && slot.choice ? [{ key: feat.choiceKind, ...(feat.choiceKind === "other" ? { text: slot.choice } : { contentId: slot.choice }) }] : undefined; return { featId: slot.featId, ...(choices ? { choices } : {}) }; };
  const validSlots = [...level, ...racial, ...classBonus].every((slot) => { if (!slot.featId) return false; const feat = page.data?.options.find((option) => option.id === slot.featId); return !feat || feat.choiceKind === "none" || Boolean(slot.choice); });
  const save = useMutation({ mutationFn: () => saveFeats(characterId, { levelFeats: level.map(toSelection), racialBonusFeats: racial.map(toSelection), classBonusFeats: classBonus.map((slot, index): ClassFeatSelection => ({ ...toSelection(slot), classFeatureId: page.data!.required.classBonusFeatures[index]!.id })) }), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  const visibleOptions = page.data?.options.filter((feat) => `${feat.name} ${feat.description ?? ""} ${feat.rulesText ?? ""} ${feat.explanation ?? ""}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const slots = [
    ...level.map((slot, index) => ({ key: `level-${index}`, label: `Level feat ${index + 1}`, slot, set: (value: FeatSlotState) => setLevel((current) => current.map((entry, i) => i === index ? value : entry)) })),
    ...racial.map((slot, index) => ({ key: `race-${index}`, label: `Racial bonus feat ${index + 1}`, slot, set: (value: FeatSlotState) => setRacial((current) => current.map((entry, i) => i === index ? value : entry)) })),
    ...classBonus.map((slot, index) => ({ key: `class-${index}`, label: `${page.data?.required.classBonusFeatures[index]?.name ?? `Class bonus feat ${index + 1}`}${page.data?.required.classBonusFeatures[index]?.className ? ` · ${page.data.required.classBonusFeatures[index]!.className}` : ""}`, slot, set: (value: FeatSlotState) => setClassBonus((current) => current.map((entry, i) => i === index ? value : entry)) })),
  ];
  return <AsyncStep title="Loading feat catalog" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<Swords />} eyebrow="Talents" title="Choose feats from full rule cards" body="Feats are shown as blocks with their effect, prerequisites, and special/repeatability notes instead of a name-only dropdown." /><label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search feats by name, effect, or prerequisite…" /></label><div className="creator-feat-slots">{slots.map((entry) => <FeatBlockSlot key={entry.key} label={entry.label} slot={entry.slot} setSlot={entry.set} options={visibleOptions} allOptions={page.data?.options ?? []} choiceOptions={page.data?.choiceOptions} />)}</div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!validSlots} /></div></AsyncStep>;
}

function FeatBlockSlot({ label, slot, setSlot, options, allOptions, choiceOptions }: { label: string; slot: FeatSlotState; setSlot: (value: FeatSlotState) => void; options: FeatOption[]; allOptions: FeatOption[]; choiceOptions: Partial<Record<Exclude<FeatChoiceKind, "none" | "other">, Array<{ id: string; name: string; slug?: string }>>> | undefined }) {
  const feat = allOptions.find((option) => option.id === slot.featId);
  const choices = feat && feat.choiceKind !== "none" && feat.choiceKind !== "other" ? choiceOptions?.[feat.choiceKind] ?? [] : [];
  return <section className="creator-feat-slot"><div className="creator-feat-slot-heading"><strong>{label}</strong>{feat && <span>Selected: {feat.name}</span>}</div><div className="creator-feat-grid">{options.map((option) => <button key={option.id} className={`creator-feat-card ${slot.featId === option.id ? "selected" : ""}`} onClick={() => setSlot({ featId: option.id, choice: "" })}><div><strong>{option.name}</strong>{option.repeatable && <span className="creator-pill">Repeatable</span>}</div><p>{option.description || option.rulesText || "Feat rules available from the source catalog."}</p>{option.explanation && <small><b>Prerequisite:</b> {option.explanation}</small>}{option.normalText && <small><b>Normal:</b> {option.normalText}</small>}{option.specialText && <small><b>Special:</b> {option.specialText}</small>}{option.repeatabilityText && <small>{option.repeatabilityText}</small>}</button>)}</div>{feat && feat.choiceKind !== "none" && <div className="creator-feat-choice"><strong>{feat.name} choice</strong>{choices.length > 0 ? <select value={slot.choice} onChange={(event) => setSlot({ ...slot, choice: event.target.value })}><option value="">Choose {feat.choiceKind}…</option>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select> : <input value={slot.choice} onChange={(event) => setSlot({ ...slot, choice: event.target.value })} placeholder={`Enter ${feat.choiceKind} choice`} />}</div>}</section>;
}

function LanguagesStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "languages"], queryFn: () => getLanguages(characterId) });
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  useEffect(() => { if (!page.data) return; const automatic = new Set(page.data.automatic.map((entry) => entry.languageId)); const bonusAllowed = new Set(page.data.bonusOptions.map((entry) => entry.languageId)); setSelected(page.data.selected.map((entry) => entry.id).filter((id) => !automatic.has(id) && bonusAllowed.has(id))); }, [page.data]);
  const required = page.data?.bonusChoicesRequired ?? 0;
  const all = page.data?.allOptions ?? [
    ...(page.data?.automatic ?? []).map((entry) => ({ id: entry.languageId, slug: entry.slug, name: entry.name })),
    ...(page.data?.bonusOptions ?? []).map((entry) => ({ id: entry.languageId, slug: entry.slug, name: entry.name })),
  ];
  const visible = all.filter((language) => `${language.name} ${language.script ?? ""} ${language.typicalSpeakers ?? ""}`.toLowerCase().includes(filter.toLowerCase()));
  const automatic = new Set(page.data?.automatic.map((entry) => entry.languageId) ?? []);
  const bonusAllowed = new Set(page.data?.bonusOptions.map((entry) => entry.languageId) ?? []);
  const save = useMutation({ mutationFn: () => saveLanguages(characterId, selected), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading language rules" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<Languages />} eyebrow="Languages" title="Browse the complete language catalog" body="Every enabled language is visible. Your race determines which non-secret languages can be chosen as bonus languages; restricted languages remain visible but locked." /><div className="creator-info-card"><strong>Automatic languages</strong><span>{page.data?.automatic.map((entry) => entry.name).join(", ") || "None"}{page.data?.druidicGranted ? `${page.data.automatic.length ? ", " : ""}Druidic` : ""}</span></div><p className="creator-selection-count">Bonus choices: <strong>{selected.length} / {required}</strong></p><label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search all languages…" /></label><div className="creator-language-grid">{visible.map((language) => { const isAutomatic = automatic.has(language.id) || (page.data?.druidicGranted && language.slug === "druidic"); const selectable = bonusAllowed.has(language.id) && !language.isSecret; const isSelected = selected.includes(language.id); return <button key={language.id} disabled={!selectable || isAutomatic} className={`creator-language-card ${isSelected || isAutomatic ? "selected" : ""} ${language.isSecret ? "locked" : ""}`} onClick={() => selectable && setSelected((current) => current.includes(language.id) ? current.filter((id) => id !== language.id) : current.length < required ? [...current, language.id] : current)}><div><strong>{language.name}</strong>{language.isSecret && <LockKeyhole size={14} />}</div><p>{language.description || language.typicalSpeakers || "D&D 3.5 language"}</p><small>{isAutomatic ? "Automatic" : isSelected ? "Chosen bonus language" : selectable ? "Available bonus language" : language.isSecret ? "Secret / class-restricted" : "Catalog language"}</small>{language.script && <small>Script: {language.script}</small>}</button>; })}</div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={selected.length !== required} /></div></AsyncStep>;
}

function WealthStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "equipment", "advanced"], queryFn: () => getAdvancedEquipment(characterId) });
  const roll = useMutation({ mutationFn: () => rollStartingWealth(characterId), onSuccess: async () => { await page.refetch(); toast.success("Starting wealth rolled and locked."); }, onError: (error) => toast.error(errorMessage(error)) });
  const wealth = page.data?.wealth?.startingWealthCopper;
  return <AsyncStep title="Loading starting wealth" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<CircleDollarSign />} eyebrow="Starting wealth" title="Roll class starting wealth" body="Every selected class exposes its source-backed formula. For gestalt, the Codex uses the richer expected formula rather than doubling funds." />{page.data?.classFormulas && page.data.classFormulas.length > 0 && <div className="creator-wealth-formulas">{page.data.classFormulas.map((entry) => <article key={entry.track}><span>Track {entry.track}</span><strong>{entry.className}</strong><b>{formatWealthFormula(entry.formula)}</b></article>)}</div>}<div className="creator-info-card"><CircleDollarSign /><div><strong>Applied rule</strong><span>{page.data?.wealthRule ?? "Class starting wealth formula"}</span></div></div><div className="creator-wealth-card"><CircleDollarSign /><div><span>{page.data?.class.name} starting funds</span><strong>{wealth == null ? "Not rolled" : formatCopper(wealth)}</strong><small>{wealth == null ? `Roll ${formatWealthFormula(page.data?.formula)} once to continue.` : "Starting wealth is now fixed for this character."}</small></div></div>{wealth == null ? <button className="creator-primary creator-roll" disabled={roll.isPending} onClick={() => roll.mutate()}><Dices /> {roll.isPending ? "Rolling…" : "Roll starting wealth"}</button> : <StepActions onSave={onComplete} saving={false} label="Continue to equipment" />}</div></AsyncStep>;
}

function EquipmentStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "equipment", "advanced"], queryFn: () => getAdvancedEquipment(characterId) });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  useEffect(() => { if (page.data) setQuantities(Object.fromEntries(page.data.inventory.map((entry) => [entry.itemId, entry.quantity]))); }, [page.data]);
  const starting = page.data?.wealth?.startingWealthCopper ?? 0;
  const spent = page.data?.options.reduce((sum, item) => sum + (quantities[item.id] ?? 0) * item.priceCopper, 0) ?? 0;
  const visible = page.data?.options.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const save = useMutation({ mutationFn: () => saveEquipment(characterId, Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([itemId, quantity]) => ({ itemId, quantity }))), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading equipment catalog" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<Backpack />} eyebrow="Equipment" title="Purchase starting gear" body="Search the equipment catalog and spend any amount up to your rolled starting wealth." /><div className="creator-budget-bar"><div><span>Spent</span><strong>{formatCopper(spent)} / {formatCopper(starting)}</strong></div><progress value={spent} max={Math.max(1, starting)} /></div><label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search weapons, armor, gear…" /></label><div className="creator-equipment-grid">{visible.map((item) => <article key={item.id} className="creator-equipment-card"><div><span>{item.category}</span><strong>{item.name}</strong><small>{formatCopper(item.priceCopper)}{item.weightPounds != null ? ` · ${item.weightPounds} lb.` : ""}</small></div><label>Qty<input type="number" min={0} max={999} value={quantities[item.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, Math.floor(Number(event.target.value))) }))} /></label></article>)}</div><div className="creator-total-line"><span>Remaining after purchase</span><strong className={spent > starting ? "negative" : ""}>{formatCopper(starting - spent)}</strong></div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={spent > starting} /></div></AsyncStep>;
}

function normalizeSpellSections(data: Awaited<ReturnType<typeof getSpells>> | undefined): SpellSection[] {
  if (!data) return [];
  return data.sections ?? [{ track: data.track ?? 1, classId: data.classId ?? "", className: data.className ?? "Class", required: data.required, mode: data.mode, automaticSpellIds: data.automaticSpellIds, firstLevelChoicesRequired: data.firstLevelChoicesRequired, specialization: data.specialization, knownByLevel: data.knownByLevel, options: data.options, selected: data.selected }];
}
function normalizePowerSections(data: Awaited<ReturnType<typeof getPowers>> | undefined): PowerSection[] {
  if (!data) return [];
  return data.sections ?? [{ track: data.track ?? 1, classId: data.classId ?? "", className: data.className ?? "Class", required: data.required, count: data.count, maximumPowerLevel: data.maximumPowerLevel ?? 0, disciplineId: data.disciplineId, options: data.options, selected: data.selected }];
}

function MagicStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const spells = useQuery({ queryKey: ["creator", characterId, "spells", "advanced"], queryFn: () => getSpells(characterId) });
  const powers = useQuery({ queryKey: ["creator", characterId, "powers", "advanced"], queryFn: () => getPowers(characterId) });
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});
  const [powerSelections, setPowerSelections] = useState<Record<number, string[]>>({});
  const [filter, setFilter] = useState("");
  const spellSections = normalizeSpellSections(spells.data);
  const powerSections = normalizePowerSections(powers.data);
  useEffect(() => { if (!spells.data) return; setSpellSelections(Object.fromEntries(normalizeSpellSections(spells.data).map((section) => [section.track, section.selected.map((entry) => entry.spellId).filter((id) => !section.automaticSpellIds?.includes(id))]))); }, [spells.data]);
  useEffect(() => { if (!powers.data) return; setPowerSelections(Object.fromEntries(normalizePowerSections(powers.data).map((section) => [section.track, section.selected.map((entry) => entry.powerId)]))); }, [powers.data]);
  const spellSectionValid = (section: SpellSection) => {
    const selected = spellSelections[section.track] ?? [];
    if (section.mode === "spellbook") return selected.length === (section.firstLevelChoicesRequired ?? 0) && selected.every((id) => section.options.find((option) => option.id === id)?.spellLevel === 1);
    if (section.mode === "limited") return Object.entries(section.knownByLevel ?? {}).every(([level, count]) => selected.filter((id) => section.options.find((option) => option.id === id)?.spellLevel === Number(level)).length === count);
    return selected.length === 0;
  };
  const powersValid = powerSections.every((section) => !section.required || (powerSelections[section.track]?.length ?? 0) === section.count);
  const spellsValid = spellSections.every(spellSectionValid);
  const save = useMutation({ mutationFn: async () => Promise.all([saveSpells(characterId, spellSections.map((section) => ({ track: section.track as 1 | 2, ids: spellSelections[section.track] ?? [] }))), savePowers(characterId, powerSections.map((section) => ({ track: section.track as 1 | 2, ids: powerSelections[section.track] ?? [] })))]), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading spell and power lists" loading={spells.isLoading || powers.isLoading} error={spells.error ?? powers.error}><div className="creator-step-content"><StepHeading icon={<WandSparkles />} eyebrow="Magic & psionics" title="Choose spells and powers by class track" body="Spell cards show school and mechanics. Gestalt characters receive independent spell/power selections for each casting class." /><label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search spells, schools, powers, disciplines…" /></label><div className="creator-track-stack">{spellSections.map((section) => <MagicSpellSection key={`spell-${section.track}`} section={section} selected={spellSelections[section.track] ?? []} setSelected={(ids) => setSpellSelections((current) => ({ ...current, [section.track]: ids }))} filter={filter} />)}{powerSections.map((section) => <MagicPowerSection key={`power-${section.track}`} section={section} selected={powerSelections[section.track] ?? []} setSelected={(ids) => setPowerSelections((current) => ({ ...current, [section.track]: ids }))} filter={filter} />)}</div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!spellsValid || !powersValid} /></div></AsyncStep>;
}

function MagicSpellSection({ section, selected, setSelected, filter }: { section: SpellSection; selected: string[]; setSelected: (ids: string[]) => void; filter: string }) {
  const choices = section.options.filter((spell) => (section.mode !== "spellbook" || spell.spellLevel === 1) && `${spell.name} ${spell.schoolName ?? ""} ${spell.description ?? ""}`.toLowerCase().includes(filter.toLowerCase()));
  if (!section.required && section.mode !== "spellbook") return <section className="creator-track-section"><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className}</span></div><NotRequired title={section.mode === "all_list" ? "Automatic spell access" : "No spell choices"} body={section.mode === "all_list" ? `${section.className} automatically knows/accesses the class spell list available at this level.` : `${section.className} does not choose spells at 1st level.`} /></section>;
  const countText = section.mode === "spellbook" ? `Choose ${section.firstLevelChoicesRequired ?? 0} 1st-level spells; eligible cantrips are automatic.` : Object.entries(section.knownByLevel ?? {}).map(([level, count]) => `${count} level-${level}`).join(" · ");
  return <section className="creator-track-section"><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className} spells</span></div><p className="creator-track-note">{countText}</p><div className="creator-magic-grid creator-magic-detail-grid">{choices.map((spell) => <button key={spell.id} className={selected.includes(spell.id) ? "selected" : ""} onClick={() => setSelected(selected.includes(spell.id) ? selected.filter((id) => id !== spell.id) : [...selected, spell.id])}><div className="creator-magic-card-top"><span>Level {spell.spellLevel}</span><span className="creator-school-pill">{spell.schoolName ?? spell.schoolSlug ?? "Unknown school"}</span></div><strong>{spell.name}</strong><p>{spell.description || spell.rulesText || "Spell mechanics are available in the rules catalog."}</p><small>{[spell.castingTime, spell.rangeText, spell.durationText].filter(Boolean).join(" · ")}</small></button>)}</div></section>;
}

function MagicPowerSection({ section, selected, setSelected, filter }: { section: PowerSection; selected: string[]; setSelected: (ids: string[]) => void; filter: string }) {
  if (!section.required) return <section className="creator-track-section"><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className}</span></div><NotRequired title="No psionic power choices" body={`${section.className} does not select powers at 1st level.`} /></section>;
  const choices = section.options.filter((power) => `${power.name} ${power.disciplineName ?? ""} ${power.description ?? ""}`.toLowerCase().includes(filter.toLowerCase()));
  return <section className="creator-track-section"><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className} powers · choose {section.count}</span></div><div className="creator-magic-grid creator-magic-detail-grid">{choices.map((power) => <button key={power.id} className={selected.includes(power.id) ? "selected" : ""} onClick={() => setSelected(selected.includes(power.id) ? selected.filter((id) => id !== power.id) : selected.length < section.count ? [...selected, power.id] : selected)}><div className="creator-magic-card-top"><span>Level {power.powerLevel}</span><span className="creator-school-pill">{power.disciplineName ?? "Psionic"}</span></div><strong>{power.name}</strong><p>{power.description || power.rulesText || "Psionic power mechanics are available in the rules catalog."}</p><small>{[power.powerPoints != null ? `${power.powerPoints} PP` : null, power.manifestingTime, power.rangeText, power.durationText].filter(Boolean).join(" · ")}</small>{power.augmentationText && <small><b>Augment:</b> {power.augmentationText}</small>}</button>)}</div></section>;
}

function DivineStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "divine"], queryFn: () => getDivine(characterId) });
  const [deityId, setDeityId] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  useEffect(() => { if (page.data) { setDeityId(page.data.deityId ?? ""); setDomains(page.data.domains.map((domain) => domain.id)); } }, [page.data]);
  const required = page.data?.domainsRequired ?? 0;
  const allowedByDeity = deityId ? page.data?.deityDomainIds?.[deityId] : undefined;
  const domainOptions = page.data?.domainOptions.filter((domain) => !allowedByDeity || allowedByDeity.includes(domain.id)) ?? [];
  const save = useMutation({ mutationFn: () => saveDivine(characterId, page.data?.required ? deityId || null : null, page.data?.required ? domains : []), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading deity and domain rules" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<Sparkles />} eyebrow="Faith" title="Choose deity and domains" body="Cleric alignment and deity-domain restrictions are enforced by the server, including a cleric on either gestalt track." />{!page.data?.required ? <NotRequired title="No divine choice required" body={page.data?.reason ?? "Your classes have no deity/domain selection at 1st level."} /> : <div className="creator-form-grid"><label className="creator-field creator-field-wide"><span>Deity <small>optional</small></span><select value={deityId} onChange={(event) => { setDeityId(event.target.value); setDomains([]); }}><option value="">No patron deity</option>{page.data.deityOptions.map((deity) => <option key={deity.id} value={deity.id}>{deity.name} — {deity.alignment}</option>)}</select></label><div className="creator-field creator-field-wide"><span>Domains — choose {required}</span><div className="creator-domain-grid">{domainOptions.map((domain) => <button key={domain.id} className={domains.includes(domain.id) ? "selected" : ""} onClick={() => setDomains((current) => current.includes(domain.id) ? current.filter((id) => id !== domain.id) : current.length < required ? [...current, domain.id] : current)}><strong>{domain.name}</strong><span>{domain.grantedPowerText || "Cleric domain"}</span></button>)}</div></div></div>}<StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={Boolean(page.data?.required && domains.length !== required)} /></div></AsyncStep>;
}

function normalizeCompanionSections(data: Awaited<ReturnType<typeof getCompanions>> | undefined): CompanionSection[] {
  if (!data) return [];
  return data.sections ?? [{ track: data.track ?? 1, classId: data.classId, className: data.className, required: data.required, mayDecline: data.mayDecline, kind: data.kind, options: data.options, selected: data.selected }];
}
function CompanionStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "companions", "advanced"], queryFn: () => getCompanions(characterId) });
  const [choices, setChoices] = useState<Record<number, { creatureName: string | null; name: string; decided: boolean }>>({});
  const sections = normalizeCompanionSections(page.data);
  useEffect(() => { if (!page.data) return; const next: Record<number, { creatureName: string | null; name: string; decided: boolean }> = {}; for (const section of normalizeCompanionSections(page.data)) { const selected = section.selected[0]; next[section.track] = selected ? { creatureName: selected.creatureName, name: selected.name ?? "", decided: true } : { creatureName: null, name: "", decided: !section.required }; } setChoices(next); }, [page.data]);
  const valid = sections.every((section) => !section.required || choices[section.track]?.decided);
  const save = useMutation({ mutationFn: () => saveCompanion(characterId, null, undefined, sections.map((section) => ({ track: section.track as 1 | 2, creatureName: section.required ? choices[section.track]?.creatureName ?? null : null, ...(choices[section.track]?.name.trim() ? { name: choices[section.track]!.name.trim() } : {}) }))), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Loading companion choices" loading={page.isLoading} error={page.error}><div className="creator-step-content"><StepHeading icon={<PawPrint />} eyebrow="Companions" title="Choose familiars and animal companions" body="Each gestalt class track keeps its own companion feature. You can explicitly decline a feature for now." /><div className="creator-track-stack">{sections.map((section) => { const choice = choices[section.track] ?? { creatureName: null, name: "", decided: false }; return <section className="creator-track-section" key={section.track}><div className="creator-track-heading"><strong>Track {section.track}</strong><span>{section.className}</span></div>{!section.required ? <NotRequired title="No companion feature" body={`${section.className} has no first-level familiar or animal companion choice.`} /> : <><div className="creator-chip-grid">{section.options.map((option) => <button key={option} className={choice.decided && choice.creatureName === option ? "selected" : ""} onClick={() => setChoices((current) => ({ ...current, [section.track]: { ...choice, creatureName: option, decided: true } }))}>{option}</button>)}<button className={choice.decided && choice.creatureName === null ? "selected" : ""} onClick={() => setChoices((current) => ({ ...current, [section.track]: { ...choice, creatureName: null, decided: true } }))}>Decline for now</button></div>{choice.creatureName && <label className="creator-field creator-top-gap"><span>Companion name <small>optional</small></span><input value={choice.name} onChange={(event) => setChoices((current) => ({ ...current, [section.track]: { ...choice, name: event.target.value } }))} placeholder="Name your companion…" /></label>}</>}</section>; })}</div><StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!valid} /></div></AsyncStep>;
}

function ReviewStep({ characterId, race, characterClass, secondaryClass, progressionMode, alignment, abilities, name, campaignName, abilityMethod, onReady }: { characterId: string; race: RaceOption | undefined; characterClass: ClassOption | undefined; secondaryClass: ClassOption | undefined; progressionMode: ProgressionMode; alignment: Alignment; abilities: Record<AbilityKey, number>; name: string; campaignName: string; abilityMethod: AbilityGenerationMethod; onReady: (result: ReadyResult) => void }) {
  const readiness = useQuery({ queryKey: ["creator", characterId, "readiness"], queryFn: () => getReadiness(characterId), refetchOnMount: "always" });
  const finalize = useMutation({ mutationFn: () => finalizeCharacter(characterId), onSuccess: onReady, onError: (error) => toast.error(errorMessage(error)) });
  return <AsyncStep title="Checking readiness" loading={readiness.isLoading} error={readiness.error}><div className="creator-step-content"><StepHeading icon={<Check />} eyebrow="Final review" title="Ready the adventurer" body="The final server gate revalidates every creator phase before play begins." /><div className="creator-review-hero"><div className="creator-avatar"><UserRound size={44} /></div><div><p className="creator-eyebrow">{campaignName}</p><h3>{name}</h3><span>Level 1 {race?.name} {characterClass?.name}{progressionMode === "gestalt" && secondaryClass ? ` // ${secondaryClass.name}` : ""} · {alignmentNames[alignment]}</span><small>{methodLabel(abilityMethod)} · LA +{race?.levelAdjustment ?? 0}{race?.racialHitDice ? ` · ${race.racialHitDice} racial HD` : ""}</small></div></div><div className="creator-review-abilities">{abilityKeys.map((key) => { const total = abilities[key] + (race?.abilityModifiers[key] ?? 0); return <div key={key}><span>{key.toUpperCase()}</span><strong>{total}</strong><small>{signed(abilityModifier(total))}</small></div>; })}</div>{readiness.data?.complete ? <div className="creator-success"><Check /><div><strong>All creator phases are complete</strong><span>The authoritative backend reports this character is ready to finalize.</span></div></div> : <div className="creator-error"><strong>Still incomplete</strong><span>{readiness.data?.missing.join(", ") || "Unknown creator steps remain."}</span><button className="creator-secondary" onClick={() => void readiness.refetch()}>Check again</button></div>}<StepActions onSave={() => finalize.mutate()} saving={finalize.isPending} disabled={!readiness.data?.complete} label="Mark character ready" /></div></AsyncStep>;
}

function CreatorSummary({ currentStep, campaignName, name, alignment, race, characterClass, secondaryClass, progressionMode, abilities, abilityMethod, characterId }: { currentStep: number; campaignName: string | undefined; name: string; alignment: Alignment; race: RaceOption | undefined; characterClass: ClassOption | undefined; secondaryClass: ClassOption | undefined; progressionMode: ProgressionMode; abilities: Record<AbilityKey, number>; abilityMethod: AbilityGenerationMethod; characterId: string | null }) {
  return <aside className="creator-summary"><p className="creator-eyebrow">CHARACTER PREVIEW</p><div className="creator-avatar"><UserRound size={46} /></div><h2>{name.trim() || "Unnamed Adventurer"}</h2><p>{race?.name ?? "Choose a race"} · {characterClass?.name ?? "Choose a class"}{progressionMode === "gestalt" && secondaryClass ? ` // ${secondaryClass.name}` : ""}</p><dl><div><dt>Campaign</dt><dd>{campaignName ?? "—"}</dd></div><div><dt>Alignment</dt><dd>{alignmentNames[alignment]}</dd></div><div><dt>Progression</dt><dd>{progressionMode === "gestalt" ? "Gestalt" : "Standard"}</dd></div><div><dt>Abilities</dt><dd>{methodLabel(abilityMethod)}</dd></div><div><dt>Level adjustment</dt><dd>+{race?.levelAdjustment ?? 0}</dd></div><div><dt>Current step</dt><dd>{steps[currentStep]}</dd></div></dl><div className="creator-mini-abilities">{abilityKeys.map((ability) => { const total = abilities[ability] + (race?.abilityModifiers[ability] ?? 0); return <div key={ability}><span>{ability.toUpperCase()}</span><strong>{total}</strong><small>{signed(abilityModifier(total))}</small></div>; })}</div>{characterId && <div className="creator-authoritative-badge"><Shield size={16} /><span>Draft persisted<br /><small>Server-authoritative choices</small></span></div>}</aside>;
}
