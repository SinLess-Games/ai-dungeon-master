import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { DiceTray } from "@/components/DiceTray";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dice")({
  head: () => ({
    meta: [
      { title: "Dice tray — The Endless Codex" },
      {
        name: "description",
        content:
          "Roll anything from 1d20 to 500d6 with per-die results, totals, averages, and a running history.",
      },
      { property: "og:title", content: "Dice tray — The Endless Codex" },
      { property: "og:description", content: "A fast d20 dice roller that handles enormous dice pools honestly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DicePage,
});

function DicePage() {
  return (
    <AppShell>
      <PageTitle
        title="Dice tray"
        subtitle="You roll your own dice. Type any notation — 1d20, 4d6, 100d6+12, even 5000d6 for a truly unwise fireball."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <DiceTray />
        <Card className="card-etched bg-card/60 lg:sticky lg:top-24 lg:self-start">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">How notation works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-mono text-foreground">1d20</span> — one twenty-sided die.</p>
            <p><span className="font-mono text-foreground">4d6</span> — four six-sided dice, summed.</p>
            <p><span className="font-mono text-foreground">100d6+12</span> — a hundred d6 plus a flat 12.</p>
            <p><span className="font-mono text-foreground">2d8-1</span> — negative modifiers work too.</p>
            <p className="pt-2">
              Rolls use the browser's cryptographic random source with modulo bias removed, so every face is
              genuinely equally likely. Huge pools show the first 300 dice plus the true total, low, high, and average.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
