import { useEffect, useState } from "react";
import { Dice5, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { CampaignDmAction } from "../client/campaignPlayApi";

function isInitiativeAction(action: CampaignDmAction): boolean {
  return (action.kind as string) === "check.initiative";
}

function actionLabel(action: CampaignDmAction): string {
  if (isInitiativeAction(action)) return "Initiative";
  if (action.kind === "check.skill" && action.skill) {
    return `${action.skill.name}${action.skill.specialization ? ` (${action.skill.specialization})` : ""}`;
  }
  switch (action.save) {
    case "fort":
      return "Fortitude save";
    case "ref":
      return "Reflex save";
    case "will":
      return "Will save";
    default:
      return "d20 check";
  }
}

export function CampaignDmCheckRequest({
  action,
  disabled,
  onResolve,
}: {
  action: CampaignDmAction;
  disabled: boolean;
  onResolve: (roll: number) => void;
}) {
  const [rollText, setRollText] = useState("");
  const [rolledWithButton, setRolledWithButton] = useState(false);
  const [lockedRoll, setLockedRoll] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setRollText("");
    setRolledWithButton(false);
    setLockedRoll(null);
    setSubmitted(false);
  }, [action.id]);

  useEffect(() => {
    if (action.status === "pending" && action.error) setSubmitted(false);
  }, [action.error, action.status]);

  const enteredRoll = Number.parseInt(rollText, 10);
  const roll = lockedRoll ?? enteredRoll;
  const validRoll = Number.isInteger(roll) && roll >= 1 && roll <= 20;
  const resolving = disabled || submitted || action.status === "resolving";
  const rollInputLocked = resolving || rolledWithButton || lockedRoll !== null;
  const initiative = isInitiativeAction(action);

  function rollD20() {
    if (resolving || rolledWithButton || lockedRoll !== null) return;
    const natural = Math.floor(Math.random() * 20) + 1;
    setRollText(String(natural));
    setRolledWithButton(true);
  }

  function submitRoll() {
    if (resolving || !validRoll) return;
    setLockedRoll(roll);
    setSubmitted(true);
    onResolve(roll);
  }

  return (
    <section className="border-t border-gold/20 bg-gold/5 px-3 py-2">
      <div className="mx-auto max-w-2xl rounded-lg border border-gold/30 bg-card/95 px-3 py-2.5 shadow-sm shadow-black/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
              <ShieldQuestion className="h-3.5 w-3.5" /> {initiative ? "Combat" : "DM check"}
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="font-display text-base leading-tight">{actionLabel(action)}</h3>
              <p className="min-w-0 text-xs leading-4 text-muted-foreground">{action.reason}</p>
            </div>
          </div>
          {!initiative ? (
            <span className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-bold text-gold">
              DC {action.dc}
            </span>
          ) : null}
        </div>

        {action.error ? (
          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
            The last resolution attempt failed: {action.error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-end gap-1.5">
          <label className="w-20 shrink-0">
            <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              d20
            </span>
            <input
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              value={rollText}
              disabled={rollInputLocked}
              onChange={(event) => setRollText(event.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-sm font-bold outline-none transition focus:border-gold/50 disabled:opacity-50"
              aria-label={initiative ? "Natural initiative roll" : "Natural d20 roll"}
            />
          </label>
          <button
            type="button"
            disabled={resolving || rolledWithButton || lockedRoll !== null}
            onClick={rollD20}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            <Dice5 className="h-3.5 w-3.5" /> {rolledWithButton ? "Rolled" : "Roll"}
          </button>
          <button
            type="button"
            disabled={resolving || !validRoll}
            onClick={submitRoll}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resolving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Dice5 className="h-3.5 w-3.5" />}
            {resolving
              ? "Resolving…"
              : action.error && lockedRoll !== null
                ? "Retry same roll"
                : "Submit"}
          </button>
          <p className="min-w-48 flex-1 text-[10px] leading-4 text-muted-foreground">
            {initiative
              ? "One natural d20. Your initiative modifier and turn order are resolved by the rules engine."
              : "One natural d20 per requested check. Modifiers and success are resolved by the rules engine."}
          </p>
        </div>
      </div>
    </section>
  );
}
