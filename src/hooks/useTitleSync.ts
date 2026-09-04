import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/useSession";
import { syncMyTitles } from "@/lib/titles.functions";

let lastRun = 0;
const COOLDOWN_MS = 60_000;

/**
 * Re-checks achievement rules in the background while a player uses the app,
 * so earned titles and progress bars keep up with real in-game actions.
 */
export function useTitleSync() {
  const { user } = useSession();
  const sync = useServerFn(syncMyTitles);

  useEffect(() => {
    if (!user) return;
    const run = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRun < COOLDOWN_MS) return;
      lastRun = now;
      sync({}).catch(() => undefined);
    };
    run();
    const id = window.setInterval(run, COOLDOWN_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [user, sync]);
}
