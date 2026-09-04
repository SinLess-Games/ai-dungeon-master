import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Award, Lock } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { setActiveTitle, syncMyTitles, type MyTitles } from "@/lib/titles.functions";

const RARITY_CLASS: Record<string, string> = {
  common: "border-border/60 text-muted-foreground",
  uncommon: "border-emerald-500/50 text-emerald-300",
  rare: "border-sky-500/50 text-sky-300",
  epic: "border-violet-500/50 text-violet-300",
  legendary: "border-primary/70 text-primary",
};

/** Shows the titles a player has earned, lets them wear one, and tracks progress toward the rest. */
export interface ActiveTitle {
  slug: string;
  name: string;
}

export function TitlesPanel({
  onActiveChange,
}: {
  onActiveChange?: (title: ActiveTitle | null) => void;
}) {
  const sync = useServerFn(syncMyTitles);
  const choose = useServerFn(setActiveTitle);
  const [data, setData] = useState<MyTitles | null>(null);

  useEffect(() => {
    let active = true;
    sync({})
      .then((d) => {
        if (!active) return;
        setData(d);
        const current = d.earned.find((t) => t.slug === d.activeSlug);
        onActiveChange?.(current ? { slug: current.slug, name: current.name } : null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function wear(slug: string | null) {
    const previous = data;
    setData((d) => (d ? { ...d, activeSlug: slug } : d));
    const picked = data?.earned.find((t) => t.slug === slug);
    onActiveChange?.(picked ? { slug: picked.slug, name: picked.name } : null);
    try {
      await choose({ data: { slug } });
      toast.success(slug ? "Title equipped." : "Title removed.");
    } catch (err) {
      setData(previous);
      const prior = previous?.earned.find((t) => t.slug === previous.activeSlug);
      onActiveChange?.(prior ? { slug: prior.slug, name: prior.name } : null);
      toast.error(err instanceof Error ? err.message : "Could not change your title.");
    }
  }

  return (
    <section className="rounded-lg border border-border/60 bg-card p-6">
      <h3 className="flex items-center gap-2 font-display text-lg text-foreground">
        <Award className="size-4 text-primary" /> Titles
      </h3>

      {!data ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking your deeds…</p>
      ) : (
        <>
          {data.earned.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No titles earned yet — play on and they will come.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void wear(null)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  data.activeSlug ? "border-border/60 text-muted-foreground" : "border-primary bg-primary/15 text-primary"
                }`}
              >
                None
              </button>
              {data.earned.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.description}
                  onClick={() => void wear(t.slug)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    RARITY_CLASS[t.rarity] ?? RARITY_CLASS["common"]
                  } ${data.activeSlug === t.slug ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-primary/10"}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {data.progress.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">In progress</p>
              {data.progress.slice(0, 8).map((p) => (
                <div key={p.slug}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Lock className="size-3 text-muted-foreground" /> {p.name}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.min(p.current, p.criteriaTarget)} / {p.criteriaTarget}
                    </span>
                  </div>
                  <Progress
                    value={
                      p.criteriaTarget > 0
                        ? Math.min(100, (p.current / p.criteriaTarget) * 100)
                        : 0
                    }
                    className="mt-1 h-1.5"
                  />
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
