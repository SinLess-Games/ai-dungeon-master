import { useState, type FormEvent } from "react";
import { Dices, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diceNotationLimits, formatDiceTerm, parseDiceNotation } from "@/engine/diceNotation";
import { useDiceStore, type DiceHistoryEntry } from "@/modules/dice/client/diceStore";
import "./dice-roller.css";

const quickDice = [2, 4, 6, 8, 10, 12, 20, 100, 1000];
const examples = ["1d20+4-8", "2d6+1d4-3", "1d7", "1000d6"];

function RollBreakdown({ entry }: { entry: DiceHistoryEntry }) {
  return (
    <ul className="dice-breakdown" aria-label="Roll breakdown">
      {entry.terms.map((term, index) => (
        <li key={index}>
          <div className="dice-term-heading">
            <span>
              {term.sign === -1 ? "− " : index > 0 ? "+ " : ""}
              {formatDiceTerm(term)}
            </span>
            <strong>{term.subtotal}</strong>
          </div>
          {term.kind === "dice" &&
            (term.rolls.length <= 30 ? (
              <p className="dice-values" aria-label={`Individual ${formatDiceTerm(term)} rolls`}>
                {term.rolls.join(", ")}
              </p>
            ) : (
              <details>
                <summary>Show all {term.rolls.length} dice</summary>
                <p className="dice-values">{term.rolls.join(", ")}</p>
              </details>
            ))}
        </li>
      ))}
    </ul>
  );
}

export function DiceRollerPage() {
  const { expression, history, setExpression, roll, clearHistory } = useDiceStore();
  const [submitted, setSubmitted] = useState(false);
  const [rollError, setRollError] = useState<{ expression: string; message: string } | null>(null);
  let preview;
  let validationError = "";
  try {
    preview = parseDiceNotation(expression);
  } catch (error) {
    validationError = error instanceof Error ? error.message : "Check your dice expression.";
  }
  const latest = history[0];
  const error =
    (rollError?.expression === expression ? rollError.message : "") ||
    (submitted ? validationError : "");

  function submitRoll(notation: string) {
    setSubmitted(true);
    setRollError(null);
    try {
      roll(notation);
    } catch (error) {
      setRollError({
        expression: notation,
        message:
          error instanceof Error ? error.message : "The dice could not be rolled. Try again.",
      });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitRoll(expression);
  }

  function chooseExpression(value: string) {
    setExpression(value);
    setSubmitted(false);
    setRollError(null);
  }

  return (
    <main className="dice-page">
      <header className="dice-page-heading">
        <p className="dice-eyebrow">Tools of the adventurer</p>
        <h1>
          <Dices aria-hidden="true" /> Dice roller
        </h1>
        <p>
          From a coin toss to a thousand-sided die. Add your bonuses, subtract your penalties, and
          roll.
        </p>
      </header>

      <div className="dice-workspace">
        <section className="card-etched dice-panel" aria-labelledby="dice-expression-title">
          <h2 id="dice-expression-title">Make your roll</h2>
          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="dice-expression">Dice expression</label>
            <div className="dice-expression-row">
              <input
                id="dice-expression"
                name="expression"
                value={expression}
                onChange={(event) => chooseExpression(event.target.value)}
                placeholder="1d20+4-8"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={diceNotationLimits.maxLength}
                aria-invalid={Boolean(error)}
                aria-describedby={`dice-expression-help${error ? " dice-expression-error" : ""}`}
              />
              <Button type="submit" size="lg">
                <Dices aria-hidden="true" /> Roll dice
              </Button>
            </div>
            <p id="dice-expression-help" className="dice-help">
              Any die from d2 to d1000. Combine dice and whole numbers with + or −.
            </p>
            {error && (
              <p id="dice-expression-error" role="alert" className="dice-error">
                {error}
              </p>
            )}
            {preview && (
              <p className="dice-range">
                {preview.diceCount} {preview.diceCount === 1 ? "die" : "dice"} · Possible total:{" "}
                {preview.minimum} to {preview.maximum}
              </p>
            )}
          </form>
          <div className="dice-examples" aria-label="Expression examples">
            <span>Try</span>
            {examples.map((example) => (
              <button type="button" key={example} onClick={() => chooseExpression(example)}>
                {example}
              </button>
            ))}
          </div>
          <div className="dice-quick">
            <h3>Quick roll</h3>
            <div className="dice-quick-buttons">
              {quickDice.map((sides) => (
                <Button
                  variant="outline"
                  type="button"
                  key={sides}
                  aria-label={`Roll d${sides}`}
                  onClick={() => {
                    chooseExpression(`1d${sides}`);
                    submitRoll(`1d${sides}`);
                  }}
                >
                  d{sides}
                </Button>
              ))}
            </div>
          </div>
          <p className="dice-footnote">
            Up to 1,000 dice per roll. Personal rolls don’t change campaign state.
          </p>
        </section>

        <section
          className="card-etched dice-panel dice-result-panel"
          aria-labelledby="dice-result-title"
        >
          <h2 id="dice-result-title">Latest roll</h2>
          <div role="status" aria-live="polite" aria-atomic="true">
            {latest ? (
              <div key={latest.id} className="dice-result">
                <p className="dice-notation">{latest.notation}</p>
                <p className="dice-total" aria-label={`Total: ${latest.total}`}>
                  {latest.total}
                </p>
                <p className="dice-help">
                  Total · {new Date(latest.rolledAt).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="dice-empty">
                <Dices aria-hidden="true" />
                <p>Your next adventure starts with a roll.</p>
              </div>
            )}
          </div>
          {latest && (
            <>
              <RollBreakdown entry={latest} />
              <Button type="button" variant="outline" onClick={() => submitRoll(latest.notation)}>
                <RotateCcw aria-hidden="true" /> Roll again
              </Button>
            </>
          )}
        </section>
      </div>

      <section className="dice-history" aria-labelledby="dice-history-title">
        <div className="dice-history-heading">
          <div>
            <h2 id="dice-history-title">Recent rolls</h2>
            <p className="dice-help">Last 40 rolls on this device, shared with the dice tray.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={history.length === 0}
            onClick={clearHistory}
          >
            <Trash2 aria-hidden="true" /> Clear history
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="dice-help">No rolls yet.</p>
        ) : (
          <ol className="dice-history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <details>
                  <summary>
                    <span className="dice-history-expression">{entry.notation}</span>
                    <strong>{entry.total}</strong>
                    <time dateTime={entry.rolledAt}>
                      {new Date(entry.rolledAt).toLocaleTimeString()}
                    </time>
                  </summary>
                  <RollBreakdown entry={entry} />
                  <Button type="button" variant="ghost" onClick={() => submitRoll(entry.notation)}>
                    Roll {entry.notation} again
                  </Button>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
