import { useCallback, useEffect, useState } from "react";
import { readSubscription } from "@/lib/database.functions";
import { useSession } from "@/hooks/useSession";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function isSubscriptionActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const future = !sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now();
  if (ACTIVE.has(sub.status)) return future;
  if (sub.status === "canceled") return future;
  return false;
}

/** Current Multiplayer Pass state for the signed-in account. */
export function useSubscription() {
  const { user } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let environment: "sandbox" | "live";
    try {
      environment = getStripeEnvironment();
    } catch {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const data = await readSubscription({ data: environment });
      setSubscription((data as SubscriptionRow | null) ?? null);
    } catch {
      setSubscription(null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
    if (!user) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 30_000);
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [user?.id, load]);

  return {
    subscription,
    loading,
    isActive: isSubscriptionActive(subscription),
    refresh: load,
  };
}
