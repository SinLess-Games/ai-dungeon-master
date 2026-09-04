import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    let environment: string;
    try {
      environment = getStripeEnvironment();
    } catch {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("id, status, price_id, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, load]);

  return {
    subscription,
    loading,
    isActive: isSubscriptionActive(subscription),
    refresh: load,
  };
}
