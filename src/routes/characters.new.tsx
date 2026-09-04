import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Dices } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ABILITIES,
  ABILITY_NAMES,
  ABILITY_EXPLAIN,
  ALIGNMENTS,
  type AbilityKey,
  type Alignment,
} from "@/lib/rules/types";
import { RACES } from "@/lib/rules/races";

const RACE_GROUPS = [
  { key: "all", label: "All" },
  { key: "core", label: "Core" },
  { key: "planetouched", label: "Planetouched" },
  { key: "savage", label: "Savage" },
  { key: "monstrous", label: "Monstrous" },
  { key: "powerful", label: "Powerful (high LA)" },
] as const;
import { CLASSES } from "@/lib/rules/classes";
import { SKILLS } from "@/lib/rules/skills";
import { FEATS } from "@/lib/rules/feats";
import { ARMORS, SHIELDS, WEAPONS } from "@/lib/rules/equipment";
import { emptyCharacter, type Character } from "@/lib/rules/character";
import { computeCharacter, abilityMod, formatMod } from "@/lib/rules/engine";
import { rollAbilityScores, pointBuyCost, STANDARD_ARRAY, POINT_BUY_BUDGETS, type AbilityRollMethod } from "@/lib/dice";
import { saveCharacter, newId } from "@/lib/storage";

export const Route = createFileRoute("/characters/new")({
  head: () => ({
    meta: [
      { title: "Create a character — Grimoire D&D 3.5" },
      {
        name: "description",
        content:
          "Build a D&D 3.5 character step by step: abilities, race, class, skills, feats, and gear, with every rule explained as you go.",
      },
      { property: "og:title", content: "Create a character — Grimoire D&D 3.5" },
      { property: "og:description", content: "A guided, rules-accurate 3.5 character creator that explains every choice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CharacterCreator,
});

const STEPS = ["Abilities", "Race", "Class", "Skills", "Feats", "Gear", "Details"] as const;

function Explain({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}

function CharacterCreator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [char, setChar] = useState<Character>(() => emptyCharacter(newId()));
  const [pointBuyMode, setPointBuyMode] = useState(true);
  const [pointBudget, setPointBudget] = useState<number>(32);
  const [rollMethod, setRollMethod] = useState<AbilityRollMethod>("4d6-drop-lowest");
  const [rolled, setRolled] = useState<{ score: number; dice: number[] }[] | null>(null);

  const derived = useMemo(() => computeCharacter(char), [char]);
  const patch = (p: Partial<Character>) => setChar((c) => ({ ...c, ...p }));

  const pointsSpent = ABILITIES.reduce((n, a) => n + pointBuyCost(char.abilities[a]), 0);
  const pointsLeft = pointBudget - pointsSpent;

  const currentClass = CLASSES.find((c) => c.id === char.classes[0]?.classId);
  const spentPoints = derived.skillPointsSpent;
  const remainingPoints = derived.skillPointsTotal - spentPoints;

  function finish() {
    const saved = saveCharacter({
      ...char,
      name: char.name.trim() || "Unnamed Adventurer",
      hp: { current: derived.hpMax, max: derived.hpMax, temp: 0, nonlethal: 0 },
    });
    navigate({ to: "/characters/$id", params: { id: saved.id } });
  }

  return (
    <AppShell>
      <PageTitle
        title="Create a character"
        subtitle="Seven steps. Everything is explained, and nothing is locked in until you save."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              i === step
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* ---------------- Abilities ---------------- */}
          {step === 0 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Ability scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Explain>
                  Six numbers describe your body and mind. A score of 10–11 is dead average; every 2
                  points above 10 gives +1 to everything that ability governs. The modifier — not the
                  score — is what you add to rolls.
                </Explain>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={pointBuyMode ? "default" : "outline"} onClick={() => setPointBuyMode(true)}>
                    Point buy ({pointBudget})
                  </Button>
                  <Button
                    size="sm"
                    variant={!pointBuyMode ? "default" : "outline"}
                    onClick={() => setPointBuyMode(false)}
                  >
                    Roll 4d6
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = { ...char.abilities };
                      ABILITIES.forEach((a, i) => (next[a] = STANDARD_ARRAY[i]!));
                      patch({ abilities: next });
                    }}
                  >
                    Standard array
                  </Button>
                  {pointBuyMode ? (
                    <Badge variant={pointsLeft < 0 ? "destructive" : "secondary"} className="ml-auto">
                      {pointsLeft} points left
                    </Badge>
                  ) : null}
                </div>

                {pointBuyMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Budget</span>
                    {POINT_BUY_BUDGETS.map((b) => (
                      <Button
                        key={b}
                        size="sm"
                        variant={pointBudget === b ? "secondary" : "ghost"}
                        onClick={() => setPointBudget(b)}
                      >
                        {b}
                        {b === 72 ? " (epic)" : ""}
                      </Button>
                    ))}
                  </div>
                ) : null}

                {!pointBuyMode ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={rollMethod === "4d6-drop-lowest" ? "secondary" : "ghost"}
                        onClick={() => setRollMethod("4d6-drop-lowest")}
                      >
                        4d6 drop lowest
                      </Button>
                      <Button
                        size="sm"
                        variant={rollMethod === "4d6-drop-none" ? "secondary" : "ghost"}
                        onClick={() => setRollMethod("4d6-drop-none")}
                      >
                        4d6 drop none
                      </Button>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setRolled(rollAbilityScores(rollMethod))}>
                      <Dices className="mr-1.5 size-4" />{" "}
                      {rollMethod === "4d6-drop-none"
                        ? "Roll six sets of 4d6, keep all four"
                        : "Roll six sets of 4d6, drop lowest"}
                    </Button>
                    {rolled ? (
                      <div className="flex flex-wrap gap-2">
                        {rolled.map((r, i) => (
                          <Badge key={i} variant="outline" className="font-mono">
                            {r.score} <span className="ml-1 text-muted-foreground">[{r.dice.join(",")}]</span>
                          </Badge>
                        ))}
                        <span className="self-center text-xs text-muted-foreground">
                          Assign these by typing them below.
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-4">
                  {ABILITIES.map((a) => {
                    const base = char.abilities[a];
                    const mod = abilityMod(derived.abilityScores[a]);
                    return (
                      <div key={a} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-32 font-display text-lg">{ABILITY_NAMES[a]}</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => patch({ abilities: { ...char.abilities, [a]: Math.max(3, base - 1) } })}
                          >
                            −
                          </Button>
                          <Input
                            type="number"
                            value={base}
                            onChange={(e) =>
                              patch({ abilities: { ...char.abilities, [a]: Number(e.target.value) || 10 } })
                            }
                            className="w-20 text-center font-mono"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => patch({ abilities: { ...char.abilities, [a]: Math.min(50, base + 1) } })}
                          >
                            +
                          </Button>
                          <Badge variant="secondary" className="font-mono">
                            total {derived.abilityScores[a]} ({formatMod(mod)})
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{ABILITY_EXPLAIN[a]}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Race ---------------- */}
          {step === 1 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Race</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Explain>
                  Your race adjusts ability scores, sets your size and speed, and hands you a few
                  permanent traits. It never limits what class you can take — it only nudges you.
                </Explain>
                <div className="flex flex-wrap gap-2">
                  {RACE_GROUPS.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setRaceGroup(g.key)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        raceGroup === g.key
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border/60 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Level adjustment (LA) and racial Hit Dice raise your effective character level (ECL).
                  A gnoll with 1 class level has 2 racial HD and LA +1, so it plays alongside a 4th-level party.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {RACES.filter((r) => raceGroup === "all" || (r.category ?? "core") === raceGroup).map((r) => {
                    const active = char.raceId === r.id;
                    const la = r.levelAdjustment ?? 0;
                    const rhd = r.racialHitDice?.count ?? 0;
                    return (
                      <button
                        key={r.id}
                        onClick={() => patch({ raceId: r.id })}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-lg">{r.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.size} · {r.speed} ft.
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{r.blurb}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ABILITIES.filter((a) => r.abilityMods[a]).map((a) => (
                            <Badge key={a} variant="secondary" className="font-mono text-xs">
                              {formatMod(r.abilityMods[a]!)} {ABILITY_NAMES[a].slice(0, 3)}
                            </Badge>
                          ))}
                          {la > 0 ? (
                            <Badge variant="outline" className="font-mono text-xs">LA +{la}</Badge>
                          ) : null}
                          {rhd > 0 ? (
                            <Badge variant="outline" className="font-mono text-xs">{rhd} racial HD</Badge>
                          ) : null}
                          {r.naturalArmor ? (
                            <Badge variant="outline" className="font-mono text-xs">+{r.naturalArmor} natural</Badge>
                          ) : null}
                        </div>
                        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          {r.traits.slice(0, 4).map((t) => (
                            <li key={t}>• {t}</li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Class ---------------- */}
          {step === 2 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Class and level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Explain>
                  Your class is what you actually do in a fight and out of it. It sets your hit die,
                  attack bonus, saving throws, skill points, and special abilities. You can start above
                  level 1 if your campaign does.
                </Explain>

                <div className="flex items-center gap-3">
                  <Label htmlFor="lvl">Starting level</Label>
                  <Input
                    id="lvl"
                    type="number"
                    min={1}
                    max={40}
                    value={char.classes[0]?.levels ?? 1}
                    onChange={(e) =>
                      patch({
                        classes: [
                          { classId: char.classes[0]?.classId ?? "fighter", levels: Math.max(1, Math.min(40, Number(e.target.value) || 1)) },
                        ],
                      })
                    }
                    className="w-24 font-mono"
                  />
                  <span className="text-sm text-muted-foreground">Levels 21+ use epic progression.</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {CLASSES.map((cl) => {
                    const active = char.classes[0]?.classId === cl.id;
                    return (
                      <button
                        key={cl.id}
                        onClick={() => patch({ classes: [{ classId: cl.id, levels: char.classes[0]?.levels ?? 1 }] })}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg">{cl.name}</span>
                          <Badge variant="secondary" className="font-mono text-xs">
                            d{cl.hitDie}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{cl.blurb}</p>
                        <p className="mt-2 text-xs text-primary/90">{cl.playsLike}</p>
                        <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                          <span>{cl.skillPoints}+Int skills/level</span>
                          {cl.casting ? <span>· {cl.casting.label}</span> : null}
                          {cl.alignmentRequirement ? <span>· {cl.alignmentRequirement}</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentClass ? (
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-display text-lg">{currentClass.name} features</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {currentClass.features
                        .filter((f) => f.level <= (char.classes[0]?.levels ?? 1))
                        .map((f) => (
                          <li key={f.name}>
                            <span className="text-foreground">
                              {f.name} (lvl {f.level}):
                            </span>{" "}
                            {f.text}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Skills ---------------- */}
          {step === 3 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Explain>
                  Class skills cost 1 point per rank; anything else costs 2 points per rank. You can
                  buy up to {derived.maxRanks.classSkill} ranks in a class skill and{" "}
                  {derived.maxRanks.crossClass} in a cross-class skill. Your total is your ability
                  modifier plus ranks.
                </Explain>
                <div className="flex gap-2">
                  <Badge variant={remainingPoints < 0 ? "destructive" : "secondary"}>
                    {remainingPoints} of {derived.skillPointsTotal} skill points left
                  </Badge>
                </div>
                <div className="space-y-1">
                  {SKILLS.map((s) => {
                    const ranks = char.skillRanks[s.id] ?? 0;
                    const isClass = derived.classSkillIds.has(s.id);
                    const cap = isClass ? derived.maxRanks.classSkill : derived.maxRanks.crossClass;
                    const row = derived.skills.find((x) => x.id === s.id)!;
                    return (
                      <div key={s.id} className="rounded-md border border-border/50 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`w-52 ${isClass ? "text-foreground" : "text-muted-foreground"}`}>
                            {s.name}
                            <span className="ml-1 text-xs uppercase text-muted-foreground">
                              {s.ability}
                            </span>
                          </span>
                          {isClass ? <Badge variant="secondary" className="text-xs">class</Badge> : null}
                          {s.trainedOnly ? <Badge variant="outline" className="text-xs">trained only</Badge> : null}
                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patch({ skillRanks: { ...char.skillRanks, [s.id]: Math.max(0, ranks - (isClass ? 1 : 0.5)) } })
                              }
                            >
                              −
                            </Button>
                            <span className="w-10 text-center font-mono">{ranks}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patch({
                                  skillRanks: { ...char.skillRanks, [s.id]: Math.min(cap, ranks + (isClass ? 1 : 0.5)) },
                                })
                              }
                            >
                              +
                            </Button>
                            <Badge className="w-16 justify-center font-mono">{formatMod(row.total)}</Badge>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{s.explain}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Feats ---------------- */}
          {step === 4 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Feats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Explain>
                  Feats are the special tricks that make two fighters of the same level play
                  differently. You get one at 1st level and another every third level, plus bonus feats
                  from humans, fighters, and wizards.
                </Explain>
                <Badge variant={char.featIds.length > derived.featSlots ? "destructive" : "secondary"}>
                  {char.featIds.length} / {derived.featSlots} feats chosen
                </Badge>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEATS.map((f) => {
                    const active = char.featIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() =>
                          patch({
                            featIds: active
                              ? char.featIds.filter((x) => x !== f.id)
                              : [...char.featIds, f.id],
                          })
                        }
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display">{f.name}</span>
                          <Badge variant="outline" className="text-xs">{f.type}</Badge>
                        </div>
                        {f.prereq ? (
                          <p className="mt-1 text-xs text-primary/80">Requires: {f.prereq}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-muted-foreground">{f.benefit}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Gear ---------------- */}
          {step === 5 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Armor, shield, and weapons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Explain>
                  Heavier armor raises your Armor Class but caps how much Dexterity helps you, slows
                  you down, and hurts physical skills. Spellcasters also risk arcane spell failure.
                </Explain>

                <div>
                  <Label className="mb-2 block">Armor</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ARMORS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => patch({ armorId: a.id })}
                        className={`rounded-md border p-2 text-left text-sm ${
                          char.armorId === a.id ? "border-primary bg-primary/10" : "border-border/60"
                        }`}
                      >
                        <span className="font-medium">{a.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          +{a.acBonus} AC · maxDex {a.maxDex ?? "—"} · ACP {a.checkPenalty} · {a.spellFailure}% ASF · {a.weight} lb
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Shield</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SHIELDS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => patch({ shieldId: a.id })}
                        className={`rounded-md border p-2 text-left text-sm ${
                          char.shieldId === a.id ? "border-primary bg-primary/10" : "border-border/60"
                        }`}
                      >
                        <span className="font-medium">{a.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          +{a.acBonus} AC · ACP {a.checkPenalty} · {a.weight} lb
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Weapons</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {WEAPONS.map((w) => {
                      const active = char.weaponIds.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          onClick={() =>
                            patch({
                              weaponIds: active
                                ? char.weaponIds.filter((x) => x !== w.id)
                                : [...char.weaponIds, w.id],
                            })
                          }
                          className={`rounded-md border p-2 text-left text-sm ${
                            active ? "border-primary bg-primary/10" : "border-border/60"
                          }`}
                        >
                          <span className="font-medium">{w.name}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {w.damage} · {w.critical} · {w.weight} lb
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="font-medium">Track encumbrance</p>
                    <p className="text-sm text-muted-foreground">
                      When on, your load limits speed, Dexterity to AC, and physical skills. Turn it off
                      for a lighter bookkeeping game.
                    </p>
                  </div>
                  <Switch
                    checked={char.encumbranceEnabled}
                    onCheckedChange={(v) => patch({ encumbranceEnabled: v })}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="gold">Starting gold (gp)</Label>
                  <Input
                    id="gold"
                    type="number"
                    value={char.gold}
                    onChange={(e) => patch({ gold: Number(e.target.value) || 0 })}
                    className="w-32 font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ---------------- Details ---------------- */}
          {step === 6 ? (
            <Card className="card-etched bg-card/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">Name and outlook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Character name</Label>
                  <Input
                    id="name"
                    value={char.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="Seraphine Vance"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="deity">Deity (optional)</Label>
                  <Input
                    id="deity"
                    value={char.deity ?? ""}
                    onChange={(e) => patch({ deity: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Alignment</Label>
                  <Explain>
                    Alignment is a compass, not a cage. The AI DM watches how you actually behave and
                    may shift it — with a written reason you can read later.
                  </Explain>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {ALIGNMENTS.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => patch({ alignment: a.key as Alignment })}
                        className={`rounded-md border p-2 text-left text-sm ${
                          char.alignment === a.key ? "border-primary bg-primary/10" : "border-border/60"
                        }`}
                      >
                        <span className="font-medium">{a.name}</span>
                        <p className="text-xs text-muted-foreground">{a.blurb}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Backstory and notes</Label>
                  <Textarea
                    id="notes"
                    rows={6}
                    value={char.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder="Where you came from, what you want, and who you owe."
                    className="mt-1.5"
                  />
                </div>
                <Button size="lg" onClick={finish} className="w-full">
                  Save character
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next: {STEPS[step + 1]} <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* ---------------- Live summary ---------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="card-etched bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">{char.name || "Unnamed Adventurer"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {derived.race.name} · {currentClass?.name} {char.classes[0]?.levels ?? 1} · {char.alignment}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                {ABILITIES.map((a) => (
                  <div key={a} className="rounded border border-border/60 py-1.5">
                    <p className="text-xs uppercase text-muted-foreground">{a}</p>
                    <p className="font-display text-lg">{derived.abilityScores[a]}</p>
                    <p className="font-mono text-xs text-primary">{formatMod(derived.abilityMods[a])}</p>
                  </div>
                ))}
              </div>
              <Stat label="Hit points" value={derived.hpMax} />
              <Stat label="Armor class" value={`${derived.ac.total} (touch ${derived.ac.touch}, flat ${derived.ac.flatFooted})`} />
              <Stat label="Initiative" value={formatMod(derived.initiative)} />
              <Stat label="Base attack" value={derived.attacks.map(formatMod).join(" / ")} />
              <Stat label="Melee / Ranged" value={`${formatMod(derived.melee)} / ${formatMod(derived.ranged)}`} />
              <Stat label="Saves" value={`F ${formatMod(derived.saves.fort)} · R ${formatMod(derived.saves.ref)} · W ${formatMod(derived.saves.will)}`} />
              <Stat label="Speed" value={`${derived.speed} ft.`} />
              {char.encumbranceEnabled ? (
                <Stat label="Load" value={`${derived.load.carried} lb (${derived.load.category})`} />
              ) : null}
              {derived.casting ? <Stat label="Casting" value={derived.casting.label} /> : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
