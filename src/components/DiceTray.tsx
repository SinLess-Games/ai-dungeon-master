import { useState } from "react";
import { Dices, Trash2 } from "lucide-react";
import { roll, parseNotation, type RollResult } from "@/lib/dice";
import { pushRoll } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const QUICK = [4, 6, 8, 10, 12, 20, 100];

export function DiceTray({
  presets = [],
  compact = false,
}: {
  presets?: { label: string; notation: string }[];
  compact?: boolean;
}) {
  const [notation, setNotation] = useState("1d20");
  const [history, setHistory] = useState<RollResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);

  function doRoll(input: string, label?: string) {
    const parsed = parseNotation(input);
    if (!parsed) {
      setError(`Can't read "${input}". Try 1d20, 4d6, or 100d6+12.`);
      return;
    }
    setError(null);
    setRolling(true);
    const result = roll(parsed.count, parsed.sides, parsed.modifier, label);
    window.setTimeout(() => {
      setHistory((h) => [result, ...h].slice(0, 25));
      pushRoll({
        id: result.id,
        notation: result.notation,
        ...(label ? { label } : {}),
        total: result.total,
        at: result.at,
      });
      setRolling(false);
    }, 260);
  }

  const latest = history[0];

  return (
    <Card className="card-etched bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Dices className="size-5 text-primary" /> Dice tray
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doRoll(notation)}
            placeholder="100d6+12"
            className="font-mono"
            aria-label="Dice notation"
          />
          <Button onClick={() => doRoll(notation)} disabled={rolling}>
            {rolling ? "Rolling…" : "Roll"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((s) => (
            <Button key={s} size="sm" variant="secondary" onClick={() => doRoll(`1d${s}`)}>
              d{s}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => doRoll("100d6")}>
            100d6
          </Button>
          <Button size="sm" variant="outline" onClick={() => doRoll("500d6")}>
            500d6
          </Button>
        </div>

        {presets.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">From your sheet</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="ghost"
                  className="border border-border/70"
                  onClick={() => doRoll(p.notation, p.label)}
                >
                  {p.label} <span className="ml-1.5 font-mono text-xs text-muted-foreground">{p.notation}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {latest ? (
          <div className="rounded-lg border border-primary/30 bg-background/60 p-4">
            <div className="flex items-baseline justify-between">
              <div>
                {latest.label ? (
                  <p className="text-sm text-primary">{latest.label}</p>
                ) : null}
                <p className="font-mono text-xs text-muted-foreground">{latest.notation}</p>
              </div>
              <p className="font-display text-4xl text-primary tabular-nums">{latest.total}</p>
            </div>
            {latest.count > 1 ? (
              <>
                <div className="mt-3 flex flex-wrap gap-1">
                  {latest.rolls.map((v, i) => (
                    <span
                      key={i}
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 font-mono text-xs ${
                        v === latest.sides
                          ? "border-primary/70 bg-primary/15 text-primary"
                          : v === 1
                            ? "border-destructive/50 text-destructive"
                            : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      {v}
                    </span>
                  ))}
                  {latest.sampleOnly ? (
                    <span className="self-center pl-2 text-xs text-muted-foreground">
                      showing first {latest.rolls.length} of {latest.count} dice
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>dice: {latest.count}</span>
                  <span>low: {latest.min}</span>
                  <span>high: {latest.max}</span>
                  <span>avg: {latest.average.toFixed(2)}</span>
                  {latest.modifier ? <span>mod: {latest.modifier > 0 ? `+${latest.modifier}` : latest.modifier}</span> : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {!compact && history.length > 1 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">History</p>
              <Button size="sm" variant="ghost" onClick={() => setHistory([])}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {history.slice(1).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded border border-border/50 px-2 py-1 text-sm">
                <span className="truncate text-muted-foreground">
                  {h.label ? `${h.label} · ` : ""}
                  <span className="font-mono text-xs">{h.notation}</span>
                </span>
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {h.total}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
