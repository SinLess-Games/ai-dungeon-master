import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dices, History, RotateCcw, Trash2, X } from "lucide-react";
import { rollDiceFormula, type DiceFormulaRollResult } from "@/engine";

const HISTORY_KEY = "endless-codex:dice-history:v1";
const HISTORY_LIMIT = 40;
const DISPLAYED_ROLL_LIMIT = 40;
const quickDice = [4, 6, 8, 10, 12, 20, 100] as const;

type RollHistoryEntry = {
  id: string;
  notation: string;
  total: number;
  summary: string;
  rolledAt: number;
};

function summarizeRolls(rolls: readonly number[]): string {
  const visible = rolls.slice(0, 12).join(", ");
  const remaining = rolls.length - Math.min(rolls.length, 12);
  return remaining > 0 ? `${visible}, … +${remaining} more` : visible;
}

function summarizeResult(result: DiceFormulaRollResult): string {
  const terms = result.terms
    .map((term, index) => {
      const sign = term.sign < 0 ? "−" : index === 0 ? "" : "+";
      return `${sign}${term.expression.notation} [${summarizeRolls(term.rolls)}]`;
    })
    .join(" ");
  const modifier =
    result.modifier === 0
      ? ""
      : result.modifier > 0
        ? ` + ${result.modifier}`
        : ` − ${Math.abs(result.modifier)}`;
  return `${terms}${modifier}`;
}

function readHistory(): RollHistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RollHistoryEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as RollHistoryEntry).id === "string" &&
          typeof (entry as RollHistoryEntry).notation === "string" &&
          typeof (entry as RollHistoryEntry).total === "number" &&
          typeof (entry as RollHistoryEntry).summary === "string" &&
          typeof (entry as RollHistoryEntry).rolledAt === "number",
      )
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function DiceTray() {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("1d20");
  const [lastResult, setLastResult] = useState<DiceFormulaRollResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const expressionInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(readHistory());
    setHistoryReady(true);
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* Roll history is optional when browser storage is unavailable. */
    }
  }, [history, historyReady]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => expressionInput.current?.focus());
  }, [open]);

  function performRoll(notation: string) {
    try {
      const result = rollDiceFormula(notation);
      const normalized = result.formula.notation;
      setExpression(normalized);
      setLastResult(result);
      setError("");
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          notation: normalized,
          total: result.total,
          summary: summarizeResult(result),
          rolledAt: Date.now(),
        },
        ...current,
      ].slice(0, HISTORY_LIMIT));
    } catch (rollError) {
      setError(rollError instanceof Error ? rollError.message : "Unable to roll that expression.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    performRoll(expression);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full border border-gold/50 bg-background/95 px-4 py-3 text-sm font-semibold text-foreground shadow-2xl backdrop-blur transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-haspopup="dialog"
          aria-label="Open dice tray"
          title="Open dice tray (Ctrl/⌘ + Shift + D)"
        >
          <Dices className="h-5 w-5 text-gold" aria-hidden="true" />
          Dice
        </button>
      )}

      {open && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="dice-tray-title"
          className="fixed bottom-4 left-4 z-[70] flex max-h-[min(760px,calc(100vh-2rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gold/35 bg-background/98 text-foreground shadow-2xl backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/35 bg-gold/10 text-gold">
                <Dices className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="dice-tray-title" className="font-display text-lg font-semibold">
                  Dice Tray
                </h2>
                <p className="text-xs text-muted-foreground">Ctrl/⌘ + Shift + D to toggle</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close dice tray"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="overflow-y-auto p-4">
            <div className="mb-4 grid grid-cols-7 gap-2" aria-label="Quick dice">
              {quickDice.map((sides) => (
                <button
                  key={sides}
                  type="button"
                  onClick={() => performRoll(`1d${sides}`)}
                  className="rounded-lg border border-border bg-card px-2 py-2 text-sm font-semibold transition hover:border-gold/60 hover:bg-gold/10 hover:text-gold"
                  title={`Roll d${sides}`}
                >
                  d{sides}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-2">
              <label htmlFor="dice-expression" className="text-sm font-medium">
                Dice expression
              </label>
              <div className="flex gap-2">
                <input
                  ref={expressionInput}
                  id="dice-expression"
                  value={expression}
                  onChange={(event) => setExpression(event.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="2d6 + 1d4 + 3"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                  aria-describedby="dice-expression-help"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Roll
                </button>
              </div>
              <p id="dice-expression-help" className="text-xs text-muted-foreground">
                Supports multiple groups: 2d6+1d4+3, d20+d6-2, d%, or large rolls such as 500d6.
              </p>
            </form>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {lastResult && (
              <section className="mt-4 rounded-xl border border-gold/30 bg-card p-4" aria-live="polite">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {lastResult.formula.notation}
                    </p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-gold">
                      {lastResult.total}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => performRoll(lastResult.formula.notation)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-gold/50 hover:text-gold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Reroll
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {lastResult.terms.map((term, termIndex) => (
                    <div key={`${term.expression.notation}-${termIndex}`}>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        {term.sign < 0 ? "− " : termIndex > 0 ? "+ " : ""}
                        {term.expression.notation} = {term.subtotal}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {term.rolls.slice(0, DISPLAYED_ROLL_LIMIT).map((roll, rollIndex) => {
                          const isMaximum = roll === term.expression.sides;
                          const isMinimum = roll === 1;
                          return (
                            <span
                              key={`${rollIndex}-${roll}`}
                              className={`min-w-8 rounded-md border px-2 py-1 text-center font-mono text-xs font-semibold ${
                                isMaximum
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : isMinimum
                                    ? "border-destructive/45 bg-destructive/10 text-destructive"
                                    : "border-border bg-background text-foreground"
                              }`}
                              title={isMaximum ? "Maximum die result" : isMinimum ? "Minimum die result" : undefined}
                            >
                              {roll}
                            </span>
                          );
                        })}
                        {term.rolls.length > DISPLAYED_ROLL_LIMIT && (
                          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                            +{term.rolls.length - DISPLAYED_ROLL_LIMIT} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {lastResult.modifier !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      Modifier: {lastResult.modifier > 0 ? "+" : ""}{lastResult.modifier}
                    </p>
                  )}
                </div>
              </section>
            )}

            <section className="mt-5 border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4 text-gold" aria-hidden="true" />
                  Roll history
                </h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Your recent rolls will stay here on this device.
                </p>
              ) : (
                <ol className="space-y-2">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => performRoll(entry.notation)}
                        className="w-full rounded-lg border border-border bg-card p-3 text-left transition hover:border-gold/45"
                        title="Roll this expression again"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-mono text-sm font-semibold">{entry.notation}</span>
                          <strong className="text-lg text-gold">{entry.total}</strong>
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {entry.summary}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/75">
                          {new Date(entry.rolledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </aside>
      )}
    </>
  );
}
