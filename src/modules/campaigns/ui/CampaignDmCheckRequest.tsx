import { useEffect, useState } from "react";
import { Dice5, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { CampaignDmAction } from "../client/campaignPlayApi";

function actionLabel(action: CampaignDmAction): string {
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

  useEffect(() => {
    setRollText("");
  }, [action.id]);

  const roll = Number.parseInt(rollText, 10);
  const validRoll = Number.isInteger(roll) && roll >= 1 && roll <= 20;
  const resolving = disabled || action.status === "resolving";

  function rollD20() {
    const natural = Math.floor(Math.random() * 20) + 1;
    setRollText(String(natural));
  }

  return (
    <section className="border-t border-gold/25 bg-gold/5 px-4 py-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-gold/35 bg-card/95 p-4 shadow-lg shadow-black/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-gold">
              <ShieldQuestion className="h-4 w-4" /> Dungeon Master requests a roll
            </div>
            <h3 className="mt-1 font-display text-xl">{actionLabel(action)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm font-bold text-gold">
            DC {action.dc}
          </span>
        </div>

        {action.error ? (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            The last resolution attempt failed: {action.error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-28 flex-1 sm:max-w-36">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Natural d20
            </span>
            <input
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              value={rollText}
              disabled={resolving}
              onChange={(event) => setRollText(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-center text-lg font-bold outline-none transition focus:border-gold/50 disabled:opacity-50"
              aria-label="Natural d20 roll"
            />
          </label>
          <button
            type="button"
            disabled={resolving}
            onClick={rollD20}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            <Dice5 className="h-4 w-4" /> Roll d20
          </button>
          <button
            type="button"
            disabled={resolving || !validRoll}
            onClick={() => onResolve(roll)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resolving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Dice5 className="h-4 w-4" />}
            {resolving ? "Resolving…" : "Submit roll"}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          The number you submit is the natural d20. Your character modifiers, DC, and success or failure are resolved by the authoritative rules engine.
        </p>
      </div>
    </section>
  );
}
