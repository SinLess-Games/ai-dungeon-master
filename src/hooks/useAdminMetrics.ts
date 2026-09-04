import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin.functions";

export function useAdminMetrics(enabled: boolean) {
  const fetchMetrics = useServerFn(getAdminMetrics);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchMetrics({})
      .then((m) => {
        if (active) setMetrics(m);
      })
      .catch(() => {
        if (active) setError("Could not load the metrics right now.");
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { metrics, error };
}
