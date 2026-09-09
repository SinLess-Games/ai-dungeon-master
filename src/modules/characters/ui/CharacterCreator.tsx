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
  PawPrint,
  ScrollText,
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
  createCharacterFoundation,
  createSoloCampaign,
  finalizeCharacter,
  getCharacterCreationOptions,
  getClassChoices,
  getCompanions,
  getDivine,
  getEquipment,
  getFeats,
  getLanguages,
  getPowers,
  getReadiness,
  getSkills,
  getSpells,
  listDraftCampaigns,
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
  type AbilityKey,
  type Alignment,
  type ClassFeatSelection,
  type ClassOption,
  type FeatChoiceKind,
  type FeatOption,
  type FeatSelection,
  type RaceOption,
  type ReadyResult,
  type RuleChoice,
} from "../client/creatorApi";
import "./character-creator.css";

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

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function formatCopper(copper: number) {
  const gp = Math.floor(copper / 100);
  const sp = Math.floor((copper % 100) / 10);
  const cp = copper % 10;
  return [gp ? `${gp} gp` : "", sp ? `${sp} sp` : "", cp ? `${cp} cp` : ""]
    .filter(Boolean)
    .join(" ") || "0 gp";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The Codex rejected that choice.";
}

export function CharacterCreator() {
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
  const [classId, setClassId] = useState("");
  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
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
    queryKey: ["character-creator", "options"],
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
  const selectedCampaign = campaigns.data?.find((campaign) => campaign.id === campaignId);

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

  const foundation = useMutation({
    mutationFn: async () => {
      if (!selectedClass) throw new Error("Choose a class first.");
      if (!selectedRace) throw new Error("Choose a race first.");
      return createCharacterFoundation({
        campaignId,
        name: name.trim(),
        raceId,
        alignment,
        abilities,
        characterClass: selectedClass,
        ...(pronouns.trim() ? { pronouns: pronouns.trim() } : {}),
        ...(notes.trim() ? { playerNotes: notes.trim() } : {}),
      });
    },
    onSuccess: ({ characterId: createdId }) => {
      setCharacterId(createdId);
      setCompleted(new Set([0, 1, 2, 3]));
      setStep(4);
      toast.success("Core character choices saved. Rules-driven creation is now active.");
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
        action={
          <button className="creator-primary" onClick={useAuthModal.getState().openLogin}>
            Sign in
          </button>
        }
      />
    );
  }
  if (campaigns.isLoading || options.isLoading) {
    return <CreatorState title="Preparing character creation…" body="Loading campaigns, races, classes, and rules." />;
  }
  if (campaigns.error || options.error) {
    const message = campaigns.error?.message ?? options.error?.message ?? "Character creation data could not be loaded.";
    return (
      <CreatorState
        title="The character creator could not open"
        body={message}
        action={
          <button
            className="creator-primary"
            onClick={() => {
              void campaigns.refetch();
              void options.refetch();
            }}
          >
            Try again
          </button>
        }
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
          <p>Level 1 {selectedRace?.name} {selectedClass?.name} · {alignmentNames[alignment]}</p>
          <div className="creator-complete-stats">
            <span><Heart size={18} /> {ready.maximumHitPoints} HP</span>
            <span><Shield size={18} /> Ready</span>
            <span><BookOpen size={18} /> {selectedCampaign?.name ?? "Campaign"}</span>
          </div>
          <div className="creator-complete-actions">
            <Link to="/" className="creator-primary">Return to the Codex</Link>
          </div>
          <p className="creator-character-id">Character ID: {ready.characterId}</p>
        </section>
      </main>
    );
  }

  const markAndAdvance = (index: number) => {
    setCompleted((current) => new Set([...current, index]));
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };
  const canBaseContinue =
    (step === 0 && Boolean(campaignId && name.trim())) ||
    (step === 1 && Boolean(raceId)) ||
    step === 2 ||
    (step === 3 && Boolean(selectedClass?.allowedAlignments.includes(alignment)));

  return (
    <main className="creator-page">
      <div className="creator-shell">
        <header className="creator-header">
          <div>
            <p className="creator-eyebrow">DUNGEONS & DRAGONS 3.5</p>
            <h1>Forge an adventurer</h1>
            <p>Every choice is checked against the authoritative Endless Codex rules engine.</p>
          </div>
          <div className="creator-level-seal"><span>LEVEL</span><strong>1</strong></div>
        </header>

        <nav className="creator-steps" aria-label="Character creation progress">
          {steps.map((label, index) => (
            <button
              key={label}
              className={index === step ? "active" : completed.has(index) ? "complete" : ""}
              disabled={characterId !== null ? index < 4 || index > step : index > step}
              onClick={() => {
                if (index < step && (characterId === null || index >= 4)) setStep(index);
              }}
              title={characterId !== null && index < 4 ? "Core choices are locked after the draft character is created." : undefined}
            >
              <span>{completed.has(index) ? <Check size={14} /> : index + 1}</span>
              {label}
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
                createCampaign={() => {
                  const trimmed = campaignName.trim();
                  if (trimmed) quickCampaign.mutate(trimmed);
                }}
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
              />
            )}
            {step === 2 && (
              <AbilitiesStep abilities={abilities} setAbilities={setAbilities} selectedRace={selectedRace} />
            )}
            {step === 3 && (
              <ClassStep
                classes={options.data?.classes ?? []}
                classId={classId}
                setClassId={setClassId}
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
                alignment={alignment}
                abilities={abilities}
                name={name}
                campaignName={selectedCampaign?.name ?? "Campaign"}
                onReady={(result) => {
                  setCompleted((current) => new Set([...current, 13]));
                  setReady(result);
                }}
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
            abilities={abilities}
            characterId={characterId}
          />
        </div>

        {step < 4 && (
          <footer className="creator-footer">
            <button className="creator-secondary" disabled={step === 0 || foundation.isPending} onClick={() => setStep((value) => value - 1)}>
              <ChevronLeft size={18} /> Back
            </button>
            {step < 3 ? (
              <button
                className="creator-primary"
                disabled={!canBaseContinue}
                onClick={() => {
                  setCompleted((current) => new Set([...current, step]));
                  setStep((value) => value + 1);
                }}
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button className="creator-primary" disabled={!canBaseContinue || foundation.isPending} onClick={() => foundation.mutate()}>
                <Sparkles size={18} /> {foundation.isPending ? "Inscribing core choices…" : "Begin rules-driven creation"}
              </button>
            )}
          </footer>
        )}
      </div>
    </main>
  );
}

function CreatorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <main className="creator-page creator-state-page">
      <section className="creator-state">
        <BookOpen size={42} />
        <h1>{title}</h1>
        <p>{body}</p>
        {action}
      </section>
    </main>
  );
}

function StepHeading({ icon, eyebrow, title, body }: { icon: ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <div className="creator-step-heading">
      <span className="creator-step-icon">{icon}</span>
      <div><p>{eyebrow}</p><h2>{title}</h2><span>{body}</span></div>
    </div>
  );
}

function AsyncStep({
  title,
  error,
  loading,
  children,
}: {
  title: string;
  error?: unknown;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) return <div className="creator-inline-state"><Dices className="creator-spin" /><strong>Consulting the rules…</strong><span>{title}</span></div>;
  if (error) return <div className="creator-error"><strong>Unable to load this step</strong><span>{errorMessage(error)}</span></div>;
  return <>{children}</>;
}

function StepActions({
  onSave,
  saving,
  disabled,
  label = "Save & continue",
}: {
  onSave: () => void;
  saving: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="creator-step-actions">
      <button className="creator-primary" disabled={saving || disabled} onClick={onSave}>
        {saving ? "Saving…" : label} <ChevronRight size={17} />
      </button>
    </div>
  );
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
      <StepHeading icon={<Feather />} eyebrow="Step one" title="Name the hero" body="Choose the campaign this character belongs to, then define their identity." />
      <div className="creator-form-grid">
        <label className="creator-field creator-field-wide">
          <span>Campaign</span>
          <select value={props.campaignId} onChange={(event) => props.setCampaignId(event.target.value)}>
            <option value="">Select a D&D 3.5 campaign…</option>
            {props.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <div className="creator-quick-campaign creator-field-wide">
          <div><strong>Need a campaign?</strong><span>Create a private solo AI campaign without leaving the creator.</span></div>
          <div>
            <input value={props.campaignName} maxLength={120} placeholder="New campaign name" onChange={(event) => props.setCampaignName(event.target.value)} />
            <button type="button" disabled={!props.campaignName.trim() || props.creatingCampaign} onClick={props.createCampaign}>{props.creatingCampaign ? "Creating…" : "Create"}</button>
          </div>
        </div>
        <label className="creator-field"><span>Character name</span><input autoFocus value={props.name} maxLength={120} placeholder="Mira Thornveil" onChange={(event) => props.setName(event.target.value)} /></label>
        <label className="creator-field"><span>Pronouns <small>optional</small></span><input value={props.pronouns} maxLength={120} placeholder="she / her" onChange={(event) => props.setPronouns(event.target.value)} /></label>
        <label className="creator-field creator-field-wide"><span>Player notes <small>optional</small></span><textarea value={props.notes} maxLength={20000} rows={4} placeholder="Details you want the Codex to preserve…" onChange={(event) => props.setNotes(event.target.value)} /></label>
      </div>
    </div>
  );
}

function HeritageStep({ races, raceId, setRaceId, alignment, setAlignment }: {
  races: RaceOption[];
  raceId: string;
  setRaceId: (value: string) => void;
  alignment: Alignment;
  setAlignment: (value: Alignment) => void;
}) {
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Shield />} eyebrow="Heritage" title="Choose race and alignment" body="Racial modifiers are applied automatically while your base scores stay intact." />
      <div className="creator-card-grid">
        {races.map((race) => (
          <button key={race.id} className={`creator-choice-card ${race.id === raceId ? "selected" : ""}`} onClick={() => setRaceId(race.id)}>
            <span className="creator-choice-icon"><UserRound /></span>
            <span>
              <h3>{race.name}{race.isHomebrew ? <small>Homebrew</small> : null}</h3>
              <p>{race.description || race.rulesText || "D&D 3.5 race."}</p>
              <span className="creator-tags"><span>{race.size}</span><span>{race.baseSpeedFeet} ft.</span>{Object.entries(race.abilityModifiers).map(([key, value]) => <span key={key}>{key.toUpperCase()} {signed(value ?? 0)}</span>)}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="creator-alignment-block">
        <h3>Alignment</h3>
        <div className="creator-alignment-grid">
          {(Object.keys(alignmentNames) as Alignment[]).map((key) => (
            <button key={key} className={alignment === key ? "selected" : ""} onClick={() => setAlignment(key)}>
              <strong>{key}</strong><span>{alignmentNames[key]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AbilitiesStep({ abilities, setAbilities, selectedRace }: {
  abilities: Record<AbilityKey, number>;
  setAbilities: (value: Record<AbilityKey, number>) => void;
  selectedRace: RaceOption | undefined;
}) {
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Dices />} eyebrow="Ability scores" title="Assign the standard array" body="Use each value once. Racial adjustments are shown in the final score." />
      <div className="creator-abilities-grid">
        {abilityKeys.map((ability) => {
          const racial = selectedRace?.abilityModifiers[ability] ?? 0;
          const total = abilities[ability] + racial;
          return (
            <div className="creator-ability-card" key={ability}>
              <span>{ability.toUpperCase()}</span><h3>{abilityNames[ability]}</h3>
              <select value={abilities[ability]} onChange={(event) => setAbilities({ ...abilities, [ability]: Number(event.target.value) })}>
                {standardArray.map((score) => {
                  const usedBy = abilityKeys.find((key) => key !== ability && abilities[key] === score);
                  return <option key={score} value={score} disabled={Boolean(usedBy)}>{score}{usedBy ? ` — ${usedBy.toUpperCase()}` : ""}</option>;
                })}
              </select>
              <div className="creator-score-math"><span>Base {abilities[ability]}</span><span>Race {signed(racial)}</span><strong>{total}</strong></div>
              <p>Modifier <b>{signed(abilityModifier(total))}</b></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassStep({ classes, classId, setClassId, alignment }: {
  classes: ClassOption[];
  classId: string;
  setClassId: (value: string) => void;
  alignment: Alignment;
}) {
  return (
    <div className="creator-step-content">
      <StepHeading icon={<Swords />} eyebrow="Calling" title="Choose a first class" body="The class determines hit points, skills, feats, magic, and class-specific decisions." />
      <div className="creator-card-grid creator-class-grid">
        {classes.map((characterClass) => {
          const alignmentAllowed = characterClass.allowedAlignments.includes(alignment);
          return (
            <button key={characterClass.id} className={`creator-choice-card ${characterClass.id === classId ? "selected" : ""} ${alignmentAllowed ? "" : "invalid"}`} onClick={() => setClassId(characterClass.id)}>
              <span className="creator-choice-icon"><Swords /></span>
              <span>
                <h3>{characterClass.name}{characterClass.isHomebrew ? <small>Homebrew</small> : null}</h3>
                <div className="creator-class-stats"><span>d{characterClass.hitDie} Hit Die</span><span>{characterClass.skillPointsPerLevel} + INT skills</span></div>
                <p>{characterClass.description || characterClass.rulesText || "D&D 3.5 base class."}</p>
                {!alignmentAllowed && <span className="creator-warning">{characterClass.prerequisiteExplanation ?? `${characterClass.name} does not allow ${alignmentNames[alignment]}.`}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClassChoicesStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "class-choices"], queryFn: () => getClassChoices(characterId) });
  const [typeId, setTypeId] = useState("");
  const [subtypeId, setSubtypeId] = useState("");
  const [wizardMode, setWizardMode] = useState<"generalist" | "specialist">("generalist");
  const [schoolId, setSchoolId] = useState("");
  const [prohibited, setProhibited] = useState<string[]>([]);
  const [disciplineId, setDisciplineId] = useState("");

  useEffect(() => {
    const data = page.data;
    if (!data?.selected.length) return;
    const selected = data.selected[0];
    if (!selected) return;
    if (data.choice === "favored-enemy") {
      setTypeId(selected.contentId ?? "");
      const subtype = selected.parameters?.["subtypeId"];
      setSubtypeId(typeof subtype === "string" ? subtype : "");
    } else if (data.choice === "school-specialization") {
      if (selected.valueText === "generalist") setWizardMode("generalist");
      else {
        setWizardMode("specialist");
        setSchoolId(selected.contentId ?? "");
        const ids = selected.parameters?.["prohibitedSchoolIds"];
        if (Array.isArray(ids)) setProhibited(ids.filter((value): value is string => typeof value === "string"));
      }
    } else if (data.choice === "psionic-discipline") setDisciplineId(selected.contentId ?? "");
  }, [page.data]);

  const save = useMutation({
    mutationFn: async () => {
      const data = page.data;
      if (!data) throw new Error("Class choices have not loaded.");
      if (data.choice === "favored-enemy") {
        return saveClassChoices(characterId, { favoredEnemyTypeId: typeId || null, favoredEnemySubtypeId: subtypeId || null });
      }
      if (data.choice === "school-specialization") {
        if (wizardMode === "generalist") return saveClassChoices(characterId, { wizardSpecialization: null });
        return saveClassChoices(characterId, { wizardSpecialization: { schoolId, prohibitedSchoolIds: prohibited } });
      }
      if (data.choice === "psionic-discipline") return saveClassChoices(characterId, { psionDisciplineId: disciplineId || null });
      return saveClassChoices(characterId, {});
    },
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const selectedType = page.data?.options?.find((option) => option.id === typeId);
  const subtypeRequired = Boolean(selectedType && page.data?.subtypeRequiredFor?.includes(selectedType.slug));
  const wizardSchool = page.data?.schools?.find((school) => school.id === schoolId);
  const requiredProhibited = wizardSchool?.slug === "divination" ? 1 : 2;
  const disabled = page.data?.required
    ? page.data.choice === "favored-enemy" ? !typeId || (subtypeRequired && !subtypeId)
      : page.data.choice === "school-specialization" ? wizardMode === "specialist" && (!schoolId || prohibited.length !== requiredProhibited)
        : page.data.choice === "psionic-discipline" ? !disciplineId
          : false
    : false;

  return (
    <AsyncStep title="Loading class choices" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<ListChecks />} eyebrow="Class features" title="Resolve first-level class choices" body="Only choices required by your class are shown." />
        {page.data?.choice === null && <NotRequired title="No class-specific choice" body={`${page.data.className} has no additional first-level class decision in this phase.`} />}
        {page.data?.choice === "favored-enemy" && (
          <div className="creator-form-grid">
            <label className="creator-field creator-field-wide"><span>Favored enemy</span><select value={typeId} onChange={(event) => { setTypeId(event.target.value); setSubtypeId(""); }}><option value="">Choose creature type…</option>{page.data.options?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            {subtypeRequired && <label className="creator-field creator-field-wide"><span>{selectedType?.name} subtype</span><select value={subtypeId} onChange={(event) => setSubtypeId(event.target.value)}><option value="">Choose subtype…</option>{(page.data.subtypeOptions?.[selectedType?.slug ?? ""] ?? []).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
          </div>
        )}
        {page.data?.choice === "school-specialization" && (
          <div>
            <div className="creator-segmented"><button className={wizardMode === "generalist" ? "selected" : ""} onClick={() => { setWizardMode("generalist"); setSchoolId(""); setProhibited([]); }}>Generalist</button><button className={wizardMode === "specialist" ? "selected" : ""} onClick={() => setWizardMode("specialist")}>Specialist</button></div>
            {wizardMode === "specialist" && <div className="creator-form-grid creator-top-gap"><label className="creator-field creator-field-wide"><span>Specialist school</span><select value={schoolId} onChange={(event) => { setSchoolId(event.target.value); setProhibited([]); }}><option value="">Choose school…</option>{page.data.schools?.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label><div className="creator-field creator-field-wide"><span>Prohibited schools — choose {requiredProhibited}</span><div className="creator-chip-grid">{page.data.schools?.filter((school) => school.id !== schoolId && !["divination", "universal"].includes(school.slug)).map((school) => <button key={school.id} className={prohibited.includes(school.id) ? "selected" : ""} onClick={() => setProhibited((current) => current.includes(school.id) ? current.filter((id) => id !== school.id) : current.length < requiredProhibited ? [...current, school.id] : current)}>{school.name}</button>)}</div></div></div>}
          </div>
        )}
        {page.data?.choice === "psionic-discipline" && <div className="creator-card-grid">{page.data.options?.map((option) => <button key={option.id} className={`creator-choice-card ${disciplineId === option.id ? "selected" : ""}`} onClick={() => setDisciplineId(option.id)}><span className="creator-choice-icon"><Sparkles /></span><span><h3>{option.name}</h3><p>{option.specialistName ? `Specialist: ${option.specialistName}` : "Psionic discipline"}</p></span></button>)}</div>}
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={disabled} />
      </div>
    </AsyncStep>
  );
}

function SkillsStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "skills"], queryFn: () => getSkills(characterId) });
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [specializations, setSpecializations] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!page.data) return;
    const nextRanks: Record<string, number> = {};
    const nextSpecializations: Record<string, string> = {};
    for (const selection of page.data.selections) {
      nextRanks[selection.skillId] = selection.ranks;
      nextSpecializations[selection.skillId] = selection.specialization;
    }
    setRanks(nextRanks);
    setSpecializations(nextSpecializations);
  }, [page.data]);

  const spent = useMemo(() => page.data?.options.reduce((sum, option) => sum + (ranks[option.id] ?? 0) * option.pointCostPerRank, 0) ?? 0, [page.data, ranks]);
  const visible = page.data?.options.filter((option) => `${option.name} ${option.ability}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const save = useMutation({
    mutationFn: () => saveSkills(characterId, (page.data?.options ?? []).flatMap((option) => {
      const value = ranks[option.id] ?? 0;
      if (value <= 0) return [];
      const specialization = specializations[option.id]?.trim();
      return [{ skillId: option.id, ranks: value, ...(specialization ? { specialization } : {}) }];
    })),
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <AsyncStep title="Loading skill rules" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<ScrollText />} eyebrow="Training" title="Spend skill points" body="Class skills and cross-class costs/rank caps come directly from the rules engine." />
        <div className="creator-budget-bar"><div><span>Skill-point budget</span><strong>{spent} / {page.data?.budget ?? 0}</strong></div><progress value={spent} max={page.data?.budget ?? 1} /></div>
        <label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter skills…" /></label>
        <div className="creator-table-wrap"><table className="creator-table"><thead><tr><th>Skill</th><th>Ability</th><th>Type</th><th>Max ranks</th><th>Ranks</th></tr></thead><tbody>{visible.map((option) => {
          const value = ranks[option.id] ?? 0;
          return <tr key={option.id}><td><strong>{option.name}</strong>{option.trainedOnly ? <small>Trained only</small> : null}{option.requiresSpecialization && option.slug !== "speak-language" ? <input className="creator-inline-input" placeholder="Specialization" value={specializations[option.id] ?? ""} onChange={(event) => setSpecializations((current) => ({ ...current, [option.id]: event.target.value }))} /> : null}{option.slug === "speak-language" ? <select className="creator-inline-input" value={specializations[option.id] ?? ""} onChange={(event) => setSpecializations((current) => ({ ...current, [option.id]: event.target.value }))}><option value="">Choose language…</option>{page.data?.speakLanguageOptions?.map((language) => <option key={language.id} value={language.id}>{language.name}</option>)}</select> : null}</td><td>{option.ability.toUpperCase()}</td><td><span className={option.isClassSkill ? "creator-pill good" : "creator-pill"}>{option.isClassSkill ? "Class" : "Cross-class"}</span><small>{option.pointCostPerRank} pt / rank</small></td><td>{option.maximumRanks}</td><td><input type="number" min={0} max={option.maximumRanks} step={option.isClassSkill ? 1 : 0.5} value={value} onChange={(event) => setRanks((current) => ({ ...current, [option.id]: Number(event.target.value) }))} /></td></tr>;
        })}</tbody></table></div>
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={spent !== page.data?.budget || spent <= 0} />
      </div>
    </AsyncStep>
  );
}

type FeatSlotState = { featId: string; choice: string };
function FeatsStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "feats"], queryFn: () => getFeats(characterId) });
  const [level, setLevel] = useState<FeatSlotState[]>([]);
  const [racial, setRacial] = useState<FeatSlotState[]>([]);
  const [classBonus, setClassBonus] = useState<FeatSlotState[]>([]);

  useEffect(() => {
    if (!page.data) return;
    const hydrate = (kind: "level" | "race" | "class", count: number) => {
      const rows = page.data!.selected.filter((entry) => entry.grantKind === kind);
      return Array.from({ length: count }, (_, index) => ({ featId: rows[index]?.featId ?? "", choice: rows[index]?.choices?.[0]?.contentId ?? rows[index]?.choices?.[0]?.text ?? "" }));
    };
    setLevel(hydrate("level", page.data.required.level));
    setRacial(hydrate("race", page.data.required.racialBonus));
    setClassBonus(hydrate("class", page.data.required.classBonusFeatures.length));
  }, [page.data]);

  const toSelection = (slot: FeatSlotState): FeatSelection => {
    const feat = page.data?.options.find((option) => option.id === slot.featId);
    const choices: RuleChoice[] | undefined = feat && feat.choiceKind !== "none" && slot.choice
      ? [{ key: feat.choiceKind, ...(feat.choiceKind === "other" ? { text: slot.choice } : { contentId: slot.choice }) }]
      : undefined;
    return { featId: slot.featId, ...(choices ? { choices } : {}) };
  };
  const validSlots = [...level, ...racial, ...classBonus].every((slot) => {
    if (!slot.featId) return false;
    const feat = page.data?.options.find((option) => option.id === slot.featId);
    return !feat || feat.choiceKind === "none" || Boolean(slot.choice);
  });
  const save = useMutation({
    mutationFn: () => saveFeats(characterId, {
      levelFeats: level.map(toSelection),
      racialBonusFeats: racial.map(toSelection),
      classBonusFeats: classBonus.map((slot, index): ClassFeatSelection => ({ ...toSelection(slot), classFeatureId: page.data!.required.classBonusFeatures[index]!.id })),
    }),
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <AsyncStep title="Loading feat catalog" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<Swords />} eyebrow="Talents" title="Choose first-level feats" body="Level, racial, and class bonus feat slots are validated independently." />
        <div className="creator-slot-list">
          {level.map((slot, index) => <FeatSlot key={`level-${index}`} label={`Level feat ${index + 1}`} slot={slot} setSlot={(value) => setLevel((current) => current.map((entry, slotIndex) => slotIndex === index ? value : entry))} options={page.data?.options ?? []} choiceOptions={page.data?.choiceOptions} />)}
          {racial.map((slot, index) => <FeatSlot key={`race-${index}`} label={`Racial bonus feat ${index + 1}`} slot={slot} setSlot={(value) => setRacial((current) => current.map((entry, slotIndex) => slotIndex === index ? value : entry))} options={page.data?.options ?? []} choiceOptions={page.data?.choiceOptions} />)}
          {classBonus.map((slot, index) => <FeatSlot key={`class-${index}`} label={page.data?.required.classBonusFeatures[index]?.name ?? `Class bonus feat ${index + 1}`} slot={slot} setSlot={(value) => setClassBonus((current) => current.map((entry, slotIndex) => slotIndex === index ? value : entry))} options={page.data?.options ?? []} choiceOptions={page.data?.choiceOptions} />)}
        </div>
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!validSlots} />
      </div>
    </AsyncStep>
  );
}

function FeatSlot({ label, slot, setSlot, options, choiceOptions }: {
  label: string;
  slot: FeatSlotState;
  setSlot: (value: FeatSlotState) => void;
  options: FeatOption[];
  choiceOptions: Partial<Record<Exclude<FeatChoiceKind, "none" | "other">, Array<{ id: string; name: string; slug?: string }>>> | undefined;
}) {
  const feat = options.find((option) => option.id === slot.featId);
  const choices = feat && feat.choiceKind !== "none" && feat.choiceKind !== "other" ? choiceOptions?.[feat.choiceKind] ?? [] : [];
  return (
    <div className="creator-slot-card">
      <div><strong>{label}</strong>{feat?.explanation ? <span>{feat.explanation}</span> : null}</div>
      <select value={slot.featId} onChange={(event) => setSlot({ featId: event.target.value, choice: "" })}><option value="">Choose feat…</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}{option.explanation ? " *" : ""}</option>)}</select>
      {feat && feat.choiceKind !== "none" && (
        choices.length > 0
          ? <select value={slot.choice} onChange={(event) => setSlot({ ...slot, choice: event.target.value })}><option value="">Choose {feat.choiceKind}…</option>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select>
          : <input value={slot.choice} onChange={(event) => setSlot({ ...slot, choice: event.target.value })} placeholder={`Enter ${feat.choiceKind} choice`} />
      )}
    </div>
  );
}

function LanguagesStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "languages"], queryFn: () => getLanguages(characterId) });
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (!page.data) return;
    const automatic = new Set(page.data.automatic.map((entry) => entry.languageId));
    setSelected(page.data.selected.map((entry) => entry.id).filter((id) => !automatic.has(id)));
  }, [page.data]);
  const required = page.data?.bonusChoicesRequired ?? 0;
  const save = useMutation({ mutationFn: () => saveLanguages(characterId, selected), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return (
    <AsyncStep title="Loading language rules" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<Languages />} eyebrow="Languages" title="Choose bonus languages" body="Automatic racial and class languages are granted without consuming your choices." />
        <div className="creator-info-card"><strong>Automatic</strong><span>{page.data?.automatic.map((entry) => entry.name).join(", ") || "None"}{page.data?.druidicGranted ? `${page.data.automatic.length ? ", " : ""}Druidic` : ""}</span></div>
        <p className="creator-selection-count">Choose {required}: <strong>{selected.length} / {required}</strong></p>
        <div className="creator-chip-grid">{page.data?.bonusOptions.map((language) => <button key={language.languageId} className={selected.includes(language.languageId) ? "selected" : ""} onClick={() => setSelected((current) => current.includes(language.languageId) ? current.filter((id) => id !== language.languageId) : current.length < required ? [...current, language.languageId] : current)}>{language.name}</button>)}</div>
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={selected.length !== required} />
      </div>
    </AsyncStep>
  );
}

function WealthStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "equipment"], queryFn: () => getEquipment(characterId) });
  const roll = useMutation({
    mutationFn: () => rollStartingWealth(characterId),
    onSuccess: async () => { await page.refetch(); toast.success("Starting wealth rolled and locked."); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const wealth = page.data?.wealth?.startingWealthCopper;
  return (
    <AsyncStep title="Loading starting wealth" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<CircleDollarSign />} eyebrow="Starting wealth" title="Roll starting gold" body="The server rolls your class formula once and records the result permanently." />
        <div className="creator-wealth-card"><CircleDollarSign /><div><span>{page.data?.class.name} starting funds</span><strong>{wealth == null ? "Not rolled" : formatCopper(wealth)}</strong><small>{wealth == null ? "Roll once to continue." : "Starting wealth is now fixed for this character."}</small></div></div>
        {wealth == null ? <button className="creator-primary creator-roll" disabled={roll.isPending} onClick={() => roll.mutate()}><Dices /> {roll.isPending ? "Rolling…" : "Roll starting wealth"}</button> : <StepActions onSave={onComplete} saving={false} label="Continue to equipment" />}
      </div>
    </AsyncStep>
  );
}

function EquipmentStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "equipment"], queryFn: () => getEquipment(characterId) });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  useEffect(() => {
    if (!page.data) return;
    setQuantities(Object.fromEntries(page.data.inventory.map((entry) => [entry.itemId, entry.quantity])));
  }, [page.data]);
  const starting = page.data?.wealth?.startingWealthCopper ?? 0;
  const spent = page.data?.options.reduce((sum, item) => sum + (quantities[item.id] ?? 0) * item.priceCopper, 0) ?? 0;
  const visible = page.data?.options.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const save = useMutation({
    mutationFn: () => saveEquipment(characterId, Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([itemId, quantity]) => ({ itemId, quantity }))),
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <AsyncStep title="Loading equipment catalog" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<Backpack />} eyebrow="Equipment" title="Purchase starting gear" body="Prices and inventory are persisted in copper pieces; you cannot overspend your starting wealth." />
        <div className="creator-budget-bar"><div><span>Spent</span><strong>{formatCopper(spent)} / {formatCopper(starting)}</strong></div><progress value={spent} max={Math.max(1, starting)} /></div>
        <label className="creator-search"><Search size={17} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search weapons, armor, gear…" /></label>
        <div className="creator-equipment-grid">{visible.map((item) => <article key={item.id} className="creator-equipment-card"><div><span>{item.category}</span><strong>{item.name}</strong><small>{formatCopper(item.priceCopper)}{item.weightPounds != null ? ` · ${item.weightPounds} lb.` : ""}</small></div><label>Qty<input type="number" min={0} max={999} value={quantities[item.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, Math.floor(Number(event.target.value))) }))} /></label></article>)}</div>
        <div className="creator-total-line"><span>Remaining after purchase</span><strong className={spent > starting ? "negative" : ""}>{formatCopper(starting - spent)}</strong></div>
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={spent > starting} />
      </div>
    </AsyncStep>
  );
}

function MagicStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const spells = useQuery({ queryKey: ["creator", characterId, "spells"], queryFn: () => getSpells(characterId) });
  const powers = useQuery({ queryKey: ["creator", characterId, "powers"], queryFn: () => getPowers(characterId) });
  const [spellIds, setSpellIds] = useState<string[]>([]);
  const [powerIds, setPowerIds] = useState<string[]>([]);
  useEffect(() => { if (spells.data) setSpellIds(spells.data.selected.map((entry) => entry.spellId).filter((id) => !spells.data?.automaticSpellIds?.includes(id))); }, [spells.data]);
  useEffect(() => { if (powers.data) setPowerIds(powers.data.selected.map((entry) => entry.powerId)); }, [powers.data]);
  const save = useMutation({
    mutationFn: async () => Promise.all([saveSpells(characterId, spellIds), savePowers(characterId, powerIds)]),
    onSuccess: onComplete,
    onError: (error) => toast.error(errorMessage(error)),
  });
  const wizardRequired = spells.data?.mode === "spellbook" ? spells.data.firstLevelChoicesRequired ?? 0 : null;
  const limitedValid = spells.data?.mode !== "limited" || Object.entries(spells.data.knownByLevel ?? {}).every(([level, count]) => spellIds.filter((id) => spells.data?.options.find((option) => option.id === id)?.spellLevel === Number(level)).length === count);
  const spellsValid = wizardRequired == null ? limitedValid : spellIds.length === wizardRequired && spellIds.every((id) => spells.data?.options.find((option) => option.id === id)?.spellLevel === 1);
  const powersValid = !powers.data?.required || powerIds.length === powers.data.count;

  return (
    <AsyncStep title="Loading spell and power lists" loading={spells.isLoading || powers.isLoading} error={spells.error ?? powers.error}>
      <div className="creator-step-content">
        <StepHeading icon={<WandSparkles />} eyebrow="Magic & psionics" title="Choose spells or powers" body="The creator only asks for selections your first class actually makes at level 1." />
        {spells.data?.required || spells.data?.mode === "spellbook" ? (
          <section className="creator-subsection"><div className="creator-subsection-heading"><BookOpen /><div><h3>Spells</h3><p>{spells.data.mode === "spellbook" ? `Choose ${wizardRequired} 1st-level spells. Eligible cantrips are added automatically.` : "Choose exactly the spells known required at each level."}</p></div></div><div className="creator-magic-grid">{spells.data.options.filter((spell) => spells.data?.mode !== "spellbook" || spell.spellLevel === 1).map((spell) => <button key={spell.id} className={spellIds.includes(spell.id) ? "selected" : ""} onClick={() => setSpellIds((current) => current.includes(spell.id) ? current.filter((id) => id !== spell.id) : [...current, spell.id])}><span>Level {spell.spellLevel}</span><strong>{spell.name}</strong><small>{spell.slug.replaceAll("-", " ")}</small></button>)}</div></section>
        ) : <NotRequired title="No spell choices" body="This class does not choose individual spells at 1st level." />}
        {powers.data?.required ? (
          <section className="creator-subsection"><div className="creator-subsection-heading"><Sparkles /><div><h3>Psionic powers</h3><p>Choose exactly {powers.data.count} power{powers.data.count === 1 ? "" : "s"} known.</p></div></div><div className="creator-magic-grid">{powers.data.options.map((power) => <button key={power.id} className={powerIds.includes(power.id) ? "selected" : ""} onClick={() => setPowerIds((current) => current.includes(power.id) ? current.filter((id) => id !== power.id) : current.length < powers.data!.count ? [...current, power.id] : current)}><span>Level {power.powerLevel}</span><strong>{power.name}</strong><small>{power.slug.replaceAll("-", " ")}</small></button>)}</div></section>
        ) : <NotRequired title="No psionic power choices" body="This class does not select powers at 1st level." />}
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={!spellsValid || !powersValid} />
      </div>
    </AsyncStep>
  );
}

function DivineStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "divine"], queryFn: () => getDivine(characterId) });
  const [deityId, setDeityId] = useState<string>("");
  const [domains, setDomains] = useState<string[]>([]);
  useEffect(() => { if (page.data) { setDeityId(page.data.deityId ?? ""); setDomains(page.data.domains.map((domain) => domain.id)); } }, [page.data]);
  const required = page.data?.domainsRequired ?? 0;
  const allowedByDeity = deityId ? page.data?.deityDomainIds?.[deityId] : undefined;
  const domainOptions = page.data?.domainOptions.filter((domain) => !allowedByDeity || allowedByDeity.includes(domain.id)) ?? [];
  const save = useMutation({ mutationFn: () => saveDivine(characterId, page.data?.required ? deityId || null : null, page.data?.required ? domains : []), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return (
    <AsyncStep title="Loading deity and domain rules" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<Sparkles />} eyebrow="Faith" title="Choose deity and domains" body="Cleric alignment and deity-domain restrictions are enforced by the server." />
        {!page.data?.required ? <NotRequired title="No divine choice required" body={page.data?.reason ?? "Your class has no deity/domain selection at 1st level."} /> : <div className="creator-form-grid"><label className="creator-field creator-field-wide"><span>Deity <small>optional</small></span><select value={deityId} onChange={(event) => { setDeityId(event.target.value); setDomains([]); }}><option value="">No patron deity</option>{page.data.deityOptions.map((deity) => <option key={deity.id} value={deity.id}>{deity.name} — {deity.alignment}</option>)}</select></label><div className="creator-field creator-field-wide"><span>Domains — choose {required}</span><div className="creator-domain-grid">{domainOptions.map((domain) => <button key={domain.id} className={domains.includes(domain.id) ? "selected" : ""} onClick={() => setDomains((current) => current.includes(domain.id) ? current.filter((id) => id !== domain.id) : current.length < required ? [...current, domain.id] : current)}><strong>{domain.name}</strong><span>{domain.grantedPowerText || "Cleric domain"}</span></button>)}</div></div></div>}
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={Boolean(page.data?.required && domains.length !== required)} />
      </div>
    </AsyncStep>
  );
}

function CompanionStep({ characterId, onComplete }: { characterId: string; onComplete: () => void }) {
  const page = useQuery({ queryKey: ["creator", characterId, "companions"], queryFn: () => getCompanions(characterId) });
  const [creature, setCreature] = useState<string | null>(null);
  const [companionName, setCompanionName] = useState("");
  const [decided, setDecided] = useState(false);
  useEffect(() => {
    if (!page.data) return;
    const selected = page.data.selected[0];
    if (selected) { setCreature(selected.creatureName); setCompanionName(selected.name ?? ""); setDecided(true); }
    else if (!page.data.required) setDecided(true);
  }, [page.data]);
  const save = useMutation({ mutationFn: () => saveCompanion(characterId, page.data?.required ? creature : null, companionName), onSuccess: onComplete, onError: (error) => toast.error(errorMessage(error)) });
  return (
    <AsyncStep title="Loading companion choices" loading={page.isLoading} error={page.error}>
      <div className="creator-step-content">
        <StepHeading icon={<PawPrint />} eyebrow="Companion" title="Choose a familiar or animal companion" body="Wizard, Sorcerer, and Druid choices are rules-aware; taking one is optional in the creator." />
        {!page.data?.required ? <NotRequired title="No companion feature" body={`${page.data?.className ?? "This class"} has no first-level familiar or animal companion choice.`} /> : <><div className="creator-chip-grid">{page.data.options.map((option) => <button key={option} className={decided && creature === option ? "selected" : ""} onClick={() => { setCreature(option); setDecided(true); }}>{option}</button>)}<button className={decided && creature === null ? "selected" : ""} onClick={() => { setCreature(null); setDecided(true); }}>Decline for now</button></div>{creature && <label className="creator-field creator-top-gap"><span>Companion name <small>optional</small></span><input value={companionName} onChange={(event) => setCompanionName(event.target.value)} placeholder="Name your companion…" /></label>}</>}
        <StepActions onSave={() => save.mutate()} saving={save.isPending} disabled={Boolean(page.data?.required && !decided)} />
      </div>
    </AsyncStep>
  );
}

function ReviewStep({ characterId, race, characterClass, alignment, abilities, name, campaignName, onReady }: {
  characterId: string;
  race: RaceOption | undefined;
  characterClass: ClassOption | undefined;
  alignment: Alignment;
  abilities: Record<AbilityKey, number>;
  name: string;
  campaignName: string;
  onReady: (result: ReadyResult) => void;
}) {
  const readiness = useQuery({ queryKey: ["creator", characterId, "readiness"], queryFn: () => getReadiness(characterId), refetchOnMount: "always" });
  const finalize = useMutation({ mutationFn: () => finalizeCharacter(characterId), onSuccess: onReady, onError: (error) => toast.error(errorMessage(error)) });
  return (
    <AsyncStep title="Checking readiness" loading={readiness.isLoading} error={readiness.error}>
      <div className="creator-step-content">
        <StepHeading icon={<Check />} eyebrow="Final review" title="Ready the adventurer" body="The final server gate revalidates every character-creation phase before play begins." />
        <div className="creator-review-hero"><div className="creator-avatar"><UserRound size={44} /></div><div><p className="creator-eyebrow">{campaignName}</p><h3>{name}</h3><span>Level 1 {race?.name} {characterClass?.name} · {alignmentNames[alignment]}</span></div></div>
        <div className="creator-review-abilities">{abilityKeys.map((key) => { const total = abilities[key] + (race?.abilityModifiers[key] ?? 0); return <div key={key}><span>{key.toUpperCase()}</span><strong>{total}</strong><small>{signed(abilityModifier(total))}</small></div>; })}</div>
        {readiness.data?.complete ? <div className="creator-success"><Check /><div><strong>All creator phases are complete</strong><span>The authoritative backend reports this character is ready to finalize.</span></div></div> : <div className="creator-error"><strong>Still incomplete</strong><span>{readiness.data?.missing.join(", ") || "Unknown creator steps remain."}</span><button className="creator-secondary" onClick={() => void readiness.refetch()}>Check again</button></div>}
        <StepActions onSave={() => finalize.mutate()} saving={finalize.isPending} disabled={!readiness.data?.complete} label="Mark character ready" />
      </div>
    </AsyncStep>
  );
}

function NotRequired({ title, body }: { title: string; body: string }) {
  return <div className="creator-info-card"><Check /><div><strong>{title}</strong><span>{body}</span></div></div>;
}

function CreatorSummary({ currentStep, campaignName, name, alignment, race, characterClass, abilities, characterId }: {
  currentStep: number;
  campaignName: string | undefined;
  name: string;
  alignment: Alignment;
  race: RaceOption | undefined;
  characterClass: ClassOption | undefined;
  abilities: Record<AbilityKey, number>;
  characterId: string | null;
}) {
  return (
    <aside className="creator-summary">
      <p className="creator-eyebrow">CHARACTER PREVIEW</p>
      <div className="creator-avatar"><UserRound size={46} /></div>
      <h2>{name.trim() || "Unnamed Adventurer"}</h2>
      <p>{race?.name ?? "Choose a race"} · {characterClass?.name ?? "Choose a class"}</p>
      <dl>
        <div><dt>Campaign</dt><dd>{campaignName ?? "—"}</dd></div>
        <div><dt>Alignment</dt><dd>{alignmentNames[alignment]}</dd></div>
        <div><dt>Current step</dt><dd>{steps[currentStep]}</dd></div>
        <div><dt>Speed</dt><dd>{race ? `${race.baseSpeedFeet} ft.` : "—"}</dd></div>
        <div><dt>Hit Die</dt><dd>{characterClass ? `d${characterClass.hitDie}` : "—"}</dd></div>
      </dl>
      <div className="creator-mini-abilities">{abilityKeys.map((ability) => { const total = abilities[ability] + (race?.abilityModifiers[ability] ?? 0); return <div key={ability}><span>{ability.toUpperCase()}</span><strong>{total}</strong><small>{signed(abilityModifier(total))}</small></div>; })}</div>
      {characterId && <div className="creator-authoritative-badge"><Shield size={16} /><span>Draft persisted<br /><small>Server-authoritative choices</small></span></div>}
    </aside>
  );
}
