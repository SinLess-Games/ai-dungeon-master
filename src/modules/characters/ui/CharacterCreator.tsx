import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Dice6,
  Feather,
  Heart,
  Shield,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import {
  createLevelOneCharacter,
  createSoloCampaign,
  getCharacterCreationOptions,
  listDraftCampaigns,
  type AbilityKey,
  type Alignment,
} from "../client/creatorApi";
import "./character-creator.css";

const steps = ["Identity", "Heritage", "Abilities", "Class", "Review"] as const;
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
      toast.success("Solo campaign created.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to create campaign."),
  });

  const createCharacter = useMutation({
    mutationFn: async () => {
      if (!selectedClass) throw new Error("Choose a class before creating the character.");
      const input = {
        campaignId,
        name: name.trim(),
        raceId,
        alignment,
        abilities,
        characterClass: selectedClass,
        ...(pronouns.trim() ? { pronouns: pronouns.trim() } : {}),
        ...(notes.trim() ? { playerNotes: notes.trim() } : {}),
      };
      return createLevelOneCharacter(input);
    },
    onSuccess: () => toast.success(`${name.trim()} is ready to adventure.`),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to create character."),
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
    return <CreatorState title="Preparing character creation…" body="Loading campaigns, races, and classes." />;
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

  if (createCharacter.data) {
    return (
      <main className="creator-page">
        <section className="creator-complete">
          <div className="creator-complete-mark"><Check size={34} /></div>
          <p className="creator-eyebrow">CHARACTER COMPLETE</p>
          <h1>{name}</h1>
          <p>
            Level 1 {selectedRace?.name} {selectedClass?.name} · {alignmentNames[alignment]}
          </p>
          <div className="creator-complete-stats">
            <span><Heart size={18} /> {createCharacter.data.maximumHitPoints} HP</span>
            <span><Shield size={18} /> Ready</span>
            <span><BookOpen size={18} /> {selectedCampaign?.name}</span>
          </div>
          <div className="creator-complete-actions">
            <button
              className="creator-primary"
              onClick={() => {
                createCharacter.reset();
                setStep(0);
                setName("");
                setRaceId("");
                setClassId("");
              }}
            >
              Create another
            </button>
            <Link to="/" className="creator-secondary">Return home</Link>
          </div>
          <p className="creator-character-id">Character ID: {createCharacter.data.characterId}</p>
        </section>
      </main>
    );
  }

  const canContinue =
    (step === 0 && Boolean(campaignId && name.trim())) ||
    (step === 1 && Boolean(raceId)) ||
    step === 2 ||
    (step === 3 && Boolean(classId)) ||
    step === 4;

  return (
    <main className="creator-page">
      <div className="creator-shell">
        <header className="creator-header">
          <div>
            <p className="creator-eyebrow">DUNGEONS & DRAGONS 3.5</p>
            <h1>Forge an adventurer</h1>
            <p>Build a rules-valid level 1 character directly against the Endless Codex rules engine.</p>
          </div>
          <div className="creator-level-seal"><span>LEVEL</span><strong>1</strong></div>
        </header>

        <nav className="creator-steps" aria-label="Character creation progress">
          {steps.map((label, index) => (
            <button
              key={label}
              className={index === step ? "active" : index < step ? "complete" : ""}
              disabled={index > step}
              onClick={() => index < step && setStep(index)}
            >
              <span>{index < step ? <Check size={15} /> : index + 1}</span>
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
              <ClassStep classes={options.data?.classes ?? []} classId={classId} setClassId={setClassId} />
            )}
            {step === 4 && selectedRace && selectedClass && (
              <ReviewStep
                campaignName={selectedCampaign?.name ?? "Campaign"}
                name={name}
                pronouns={pronouns}
                alignment={alignment}
                race={selectedRace}
                characterClass={selectedClass}
                abilities={abilities}
              />
            )}
          </section>

          <aside className="creator-summary">
            <p className="creator-eyebrow">CHARACTER PREVIEW</p>
            <div className="creator-avatar"><UserRound size={46} /></div>
            <h2>{name.trim() || "Unnamed Adventurer"}</h2>
            <p>{selectedRace?.name ?? "Choose a race"} · {selectedClass?.name ?? "Choose a class"}</p>
            <dl>
              <div><dt>Campaign</dt><dd>{selectedCampaign?.name ?? "—"}</dd></div>
              <div><dt>Alignment</dt><dd>{alignmentNames[alignment]}</dd></div>
              <div><dt>Speed</dt><dd>{selectedRace ? `${selectedRace.baseSpeedFeet} ft.` : "—"}</dd></div>
              <div><dt>Hit Die</dt><dd>{selectedClass ? `d${selectedClass.hitDie}` : "—"}</dd></div>
            </dl>
            <div className="creator-mini-abilities">
              {abilityKeys.map((ability) => {
                const racial = selectedRace?.abilityModifiers[ability] ?? 0;
                const total = abilities[ability] + racial;
                return (
                  <div key={ability}>
                    <span>{ability.toUpperCase()}</span>
                    <strong>{total}</strong>
                    <small>{signed(abilityModifier(total))}</small>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        <footer className="creator-footer">
          <button className="creator-secondary" disabled={step === 0 || createCharacter.isPending} onClick={() => setStep((value) => value - 1)}>
            <ChevronLeft size={18} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button className="creator-primary" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="creator-primary creator-finish" disabled={createCharacter.isPending} onClick={() => createCharacter.mutate()}>
              <Sparkles size={18} /> {createCharacter.isPending ? "Inscribing character…" : "Create character"}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}

function CreatorState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
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
      <div className="creator-step-heading"><Feather /><div><p>Step one</p><h2>Name the hero</h2><span>Choose the campaign this character belongs to, then define their identity.</span></div></div>
      <div className="creator-form-grid">
        <label className="creator-field creator-field-wide">
          <span>Campaign</span>
          <select value={props.campaignId} onChange={(event) => props.setCampaignId(event.target.value)}>
            <option value="">Select a draft campaign…</option>
            {props.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <div className="creator-quick-campaign creator-field-wide">
          <div><strong>Need a campaign?</strong><span>Create a private solo AI campaign without leaving the character creator.</span></div>
          <div><input value={props.campaignName} maxLength={120} placeholder="New campaign name" onChange={(event) => props.setCampaignName(event.target.value)} /><button type="button" disabled={!props.campaignName.trim() || props.creatingCampaign} onClick={props.createCampaign}>{props.creatingCampaign ? "Creating…" : "Create"}</button></div>
        </div>
        <label className="creator-field"><span>Character name</span><input autoFocus value={props.name} maxLength={120} placeholder="Mira Thornveil" onChange={(event) => props.setName(event.target.value)} /></label>
        <label className="creator-field"><span>Pronouns <small>optional</small></span><input value={props.pronouns} maxLength={120} placeholder="she / her" onChange={(event) => props.setPronouns(event.target.value)} /></label>
        <label className="creator-field creator-field-wide"><span>Player notes <small>optional</small></span><textarea value={props.notes} maxLength={20000} rows={4} placeholder="A few details you want the Codex to preserve…" onChange={(event) => props.setNotes(event.target.value)} /></label>
      </div>
    </div>
  );
}

function HeritageStep(props: {
  races: Awaited<ReturnType<typeof getCharacterCreationOptions>>["races"];
  raceId: string;
  setRaceId: (value: string) => void;
  alignment: Alignment;
  setAlignment: (value: Alignment) => void;
}) {
  return (
    <div className="creator-step-content">
      <div className="creator-step-heading"><Sparkles /><div><p>Step two</p><h2>Choose heritage</h2><span>Race modifies your final ability scores and defines core physical traits.</span></div></div>
      <div className="creator-card-grid">
        {props.races.map((race) => (
          <button key={race.id} className={`creator-choice-card ${props.raceId === race.id ? "selected" : ""}`} onClick={() => props.setRaceId(race.id)}>
            <span className="creator-choice-icon"><UserRound /></span>
            <div><h3>{race.name}{race.isHomebrew && <small>Homebrew</small>}</h3><p>{race.description || race.rulesText || "D&D 3.5 playable race"}</p><div className="creator-tags"><span>{race.size}</span><span>{race.baseSpeedFeet} ft.</span>{race.levelAdjustment ? <span>LA +{race.levelAdjustment}</span> : null}{Object.entries(race.abilityModifiers).map(([ability, value]) => <span key={ability}>{ability.toUpperCase()} {signed(value ?? 0)}</span>)}</div></div>
          </button>
        ))}
      </div>
      <div className="creator-alignment-block">
        <h3>Alignment</h3>
        <div className="creator-alignment-grid">
          {(Object.keys(alignmentNames) as Alignment[]).map((value) => <button key={value} className={props.alignment === value ? "selected" : ""} onClick={() => props.setAlignment(value)}><strong>{value}</strong><span>{alignmentNames[value]}</span></button>)}
        </div>
      </div>
    </div>
  );
}

function AbilitiesStep(props: {
  abilities: Record<AbilityKey, number>;
  setAbilities: React.Dispatch<React.SetStateAction<Record<AbilityKey, number>>>;
  selectedRace: Awaited<ReturnType<typeof getCharacterCreationOptions>>["races"][number] | undefined;
}) {
  function assign(ability: AbilityKey, next: number) {
    props.setAbilities((current) => {
      const previous = current[ability];
      const occupied = abilityKeys.find((key) => key !== ability && current[key] === next);
      if (!occupied) return { ...current, [ability]: next };
      return { ...current, [ability]: next, [occupied]: previous };
    });
  }
  return (
    <div className="creator-step-content">
      <div className="creator-step-heading"><Dice6 /><div><p>Step three</p><h2>Assign ability scores</h2><span>Using the D&D 3.5 standard array: 15, 14, 13, 12, 10, 8. Choosing an occupied value swaps the scores.</span></div></div>
      <div className="creator-abilities-grid">
        {abilityKeys.map((ability) => {
          const base = props.abilities[ability];
          const racial = props.selectedRace?.abilityModifiers[ability] ?? 0;
          const total = base + racial;
          return (
            <div className="creator-ability-card" key={ability}>
              <span>{ability.toUpperCase()}</span><h3>{abilityNames[ability]}</h3>
              <select aria-label={`${abilityNames[ability]} base score`} value={base} onChange={(event) => assign(ability, Number(event.target.value))}>{standardArray.map((score) => <option key={score} value={score}>{score}</option>)}</select>
              <div className="creator-score-math"><span>Base {base}</span><span>Race {signed(racial)}</span><strong>{total}</strong></div>
              <p>Modifier <b>{signed(abilityModifier(total))}</b></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassStep(props: {
  classes: Awaited<ReturnType<typeof getCharacterCreationOptions>>["classes"];
  classId: string;
  setClassId: (value: string) => void;
}) {
  return (
    <div className="creator-step-content">
      <div className="creator-step-heading"><Swords /><div><p>Step four</p><h2>Choose a class</h2><span>Your first class establishes hit points, combat progression, saving throws, and skill growth.</span></div></div>
      <div className="creator-card-grid creator-class-grid">
        {props.classes.map((characterClass) => (
          <button key={characterClass.id} className={`creator-choice-card ${props.classId === characterClass.id ? "selected" : ""}`} onClick={() => props.setClassId(characterClass.id)}>
            <span className="creator-choice-icon"><Swords /></span>
            <div><h3>{characterClass.name}{characterClass.isHomebrew && <small>Homebrew</small>}</h3><p>{characterClass.description || characterClass.rulesText || "D&D 3.5 base class"}</p><div className="creator-class-stats"><span><Heart size={15} /> d{characterClass.hitDie} HD</span><span><Feather size={15} /> {characterClass.skillPointsPerLevel} skill pts</span><span><Swords size={15} /> {characterClass.babProgression.replace("three_quarters", "¾")} BAB</span></div><div className="creator-tags"><span>Fort {characterClass.fortProgression}</span><span>Ref {characterClass.refProgression}</span><span>Will {characterClass.willProgression}</span></div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewStep(props: {
  campaignName: string;
  name: string;
  pronouns: string;
  alignment: Alignment;
  race: Awaited<ReturnType<typeof getCharacterCreationOptions>>["races"][number];
  characterClass: Awaited<ReturnType<typeof getCharacterCreationOptions>>["classes"][number];
  abilities: Record<AbilityKey, number>;
}) {
  return (
    <div className="creator-step-content">
      <div className="creator-step-heading"><BookOpen /><div><p>Final step</p><h2>Review the sheet</h2><span>The next action writes this character to the authoritative campaign state and marks it ready.</span></div></div>
      <div className="creator-review-hero"><div><span>LEVEL 1</span><h3>{props.name}</h3><p>{props.race.name} {props.characterClass.name} · {alignmentNames[props.alignment]}</p>{props.pronouns && <small>{props.pronouns}</small>}</div><div><strong>{props.campaignName}</strong><span>Campaign</span></div></div>
      <div className="creator-review-grid">
        <section><h3>Ability scores</h3>{abilityKeys.map((ability) => { const total = props.abilities[ability] + (props.race.abilityModifiers[ability] ?? 0); return <div className="creator-review-row" key={ability}><span>{abilityNames[ability]}</span><strong>{total}</strong><small>{signed(abilityModifier(total))}</small></div>; })}</section>
        <section><h3>Starting rules</h3><div className="creator-review-row"><span>First-level HP roll</span><strong>{props.characterClass.firstLevelHitPoints}</strong></div><div className="creator-review-row"><span>Hit Die</span><strong>d{props.characterClass.hitDie}</strong></div><div className="creator-review-row"><span>Base speed</span><strong>{props.race.baseSpeedFeet} ft.</strong></div><div className="creator-review-row"><span>Size</span><strong>{props.race.size}</strong></div><div className="creator-review-row"><span>Natural armor</span><strong>{signed(props.race.naturalArmor)}</strong></div></section>
      </div>
      <div className="creator-ready-note"><Shield /><div><strong>Rules-engine validation</strong><p>The server will validate race, six ability scores, class level, Constitution, hit points, and campaign readiness before the character becomes playable.</p></div></div>
    </div>
  );
}
