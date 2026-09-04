import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminMetrics {
  totals: {
    users: number;
    characters: number;
    campaigns: number;
    worlds: number;
    maps: number;
    rolls: number;
    messages: number;
    /** Player seats active across all campaigns. */
    players: number;
  };
  avgPlayersPerCampaign: number;
  newUsers7d: number;
  activeUsers30d: number;
  signupSeries: { date: string; users: number }[];
  contentSeries: { date: string; characters: number; campaigns: number; worlds: number }[];
  contentMix: { name: string; value: number }[];
  recentUsers: { id: string; email: string; displayName: string; createdAt: string; isAdmin: boolean }[];
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function lastDays(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminMetrics> => {
    await assertAdmin(context as { supabase: any; userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [usersRes, chars, camps, worlds, maps, rolls, roles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("characters").select("id, created_at, user_id"),
      supabaseAdmin.from("campaigns").select("id, created_at, user_id, data"),
      supabaseAdmin.from("worlds").select("id, created_at, user_id"),
      supabaseAdmin.from("game_maps").select("id, created_at"),
      supabaseAdmin.from("dice_rolls").select("id, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const users = usersRes.data?.users ?? [];
    const adminIds = new Set(
      (roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );

    const now = Date.now();
    const since = (days: number) => now - days * 86_400_000;

    const newUsers7d = users.filter((u) => new Date(u.created_at).getTime() >= since(7)).length;
    const activeUsers30d = users.filter(
      (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= since(30),
    ).length;

    const days = lastDays(30);
    const countBy = (rows: { created_at: string }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(dayKey(r.created_at), (m.get(dayKey(r.created_at)) ?? 0) + 1);
      return m;
    };
    const signupMap = countBy(users.map((u) => ({ created_at: u.created_at })));
    const charMap = countBy(chars.data ?? []);
    const campMap = countBy(camps.data ?? []);
    const worldMap = countBy(worlds.data ?? []);

    const playerSeats = (camps.data ?? []).reduce((sum, c) => {
      const party = ((c.data as { party?: any[] } | null)?.party ?? []) as any[];
      const seats = party.filter(
        (m) => m?.controlledBy === "player" && (m?.status ?? "active") === "active",
      ).length;
      return sum + Math.max(1, seats);
    }, 0);

    const recentUsers = [...users]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        email: u.email ?? "—",
        displayName:
          (u.user_metadata?.["display_name"] as string | undefined) ?? (u.email ?? "").split("@")[0] ?? "Adventurer",
        createdAt: u.created_at,
        isAdmin: adminIds.has(u.id),
      }));

    return {
      totals: {
        users: users.length,
        characters: chars.data?.length ?? 0,
        campaigns: camps.data?.length ?? 0,
        worlds: worlds.data?.length ?? 0,
        maps: maps.data?.length ?? 0,
        rolls: rolls.data?.length ?? 0,
        messages: (camps.data ?? []).reduce(
          (sum, c) =>
            sum +
            (Array.isArray((c.data as { messages?: unknown[] } | null)?.messages)
              ? ((c.data as { messages: unknown[] }).messages.length)
              : 0),
          0,
        ),
        players: playerSeats,
      },
      avgPlayersPerCampaign:
        (camps.data ?? []).length > 0
          ? Math.round((playerSeats / (camps.data ?? []).length) * 10) / 10
          : 0,
      newUsers7d,
      activeUsers30d,
      signupSeries: days.map((d) => ({ date: d, users: signupMap.get(d) ?? 0 })),
      contentSeries: days.map((d) => ({
        date: d,
        characters: charMap.get(d) ?? 0,
        campaigns: campMap.get(d) ?? 0,
        worlds: worldMap.get(d) ?? 0,
      })),
      contentMix: [
        { name: "Characters", value: chars.data?.length ?? 0 },
        { name: "Campaigns", value: camps.data?.length ?? 0 },
        { name: "Worlds", value: worlds.data?.length ?? 0 },
        { name: "Maps", value: maps.data?.length ?? 0 },
      ],
      recentUsers,
    };
  });

export interface AdminSubscription {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  status: string;
  environment: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface AdminBilling {
  activeCount: number;
  monthlyCount: number;
  yearlyCount: number;
  canceledCount: number;
  mrrCents: number;
  rows: AdminSubscription[];
}

const PLAN_MONTHLY_CENTS: Record<string, number> = {
  multiplayer_monthly: 1000,
  multiplayer_yearly: Math.round(10000 / 12),
};

export const getAdminBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminBilling> => {
    await assertAdmin(context as { supabase: any; userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [subsRes, usersRes] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id, user_id, price_id, status, environment, current_period_end, cancel_at_period_end, created_at",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const users = new Map(
      (usersRes.data?.users ?? []).map((u) => [
        u.id,
        {
          email: u.email ?? "—",
          displayName:
            (u.user_metadata?.["display_name"] as string | undefined) ??
            (u.email ?? "").split("@")[0] ??
            "Adventurer",
        },
      ]),
    );

    const rows: AdminSubscription[] = (subsRes.data ?? []).map((s) => ({
      id: s.id,
      email: users.get(s.user_id)?.email ?? "—",
      displayName: users.get(s.user_id)?.displayName ?? "Adventurer",
      plan: s.price_id,
      status: s.status,
      environment: s.environment,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
      createdAt: s.created_at,
    }));

    const isLive = (r: AdminSubscription) => {
      const future = !r.currentPeriodEnd || new Date(r.currentPeriodEnd).getTime() > Date.now();
      return (
        (["active", "trialing", "past_due"].includes(r.status) && future) ||
        (r.status === "canceled" && future)
      );
    };
    const active = rows.filter(isLive);

    return {
      activeCount: active.length,
      monthlyCount: active.filter((r) => r.plan === "multiplayer_monthly").length,
      yearlyCount: active.filter((r) => r.plan === "multiplayer_yearly").length,
      canceledCount: rows.filter((r) => !isLive(r)).length,
      mrrCents: active.reduce((sum, r) => sum + (PLAN_MONTHLY_CENTS[r.plan] ?? 0), 0),
      rows,
    };
  });

/* ------------------------------------------------------------- inbox */

export interface InboxMessage {
  key: string;
  messageId: string;
  campaignId: string;
  campaignName: string;
  sender: string;
  senderKind: "player" | "dm";
  text: string;
  at: string;
  read: boolean;
}

export interface AdminInbox {
  total: number;
  unread: number;
  messages: InboxMessage[];
}

function textOf(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p: any) => p?.type === "text" && typeof p.text === "string")
    .map((p: any) => p.text as string)
    .join("\n")
    .trim();
}

export const getAdminInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInbox> => {
    const ctx = context as unknown as { supabase: any; userId: string };
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [campsRes, profilesRes, readsRes] = await Promise.all([
      supabaseAdmin
        .from("campaigns")
        .select("id, name, user_id, data, updated_at")
        .order("updated_at", { ascending: false })
        .limit(300),
      supabaseAdmin.from("profiles").select("id, display_name"),
      ctx.supabase
        .from("admin_message_reads")
        .select("campaign_id, message_id")
        .eq("admin_id", ctx.userId),
    ]);

    const names = new Map<string, string>(
      (profilesRes.data ?? []).map((p: any) => [p.id, p.display_name ?? "Adventurer"]),
    );
    const read = new Set(
      (readsRes.data ?? []).map((r: any) => `${r.campaign_id}:${r.message_id}`),
    );

    const messages: InboxMessage[] = [];
    for (const c of campsRes.data ?? []) {
      const data = (c.data ?? {}) as any;
      const list = Array.isArray(data.messages) ? data.messages : [];
      const base = new Date(c.updated_at).getTime();
      list.forEach((m: any, index: number) => {
        if (!m || m.role === "system") return;
        const hidden = Boolean(m.metadata?.hidden) || (m.role === "user" && index === 0);
        let text = textOf(m.parts);
        if (!text) text = toolSummary(m.parts);
        if (!text) return;
        const messageId = String(m.id ?? `${index}`);
        const key = `${c.id}:${messageId}`;
        // Older saves carry no per-message timestamp: order them by their place
        // in the transcript so the newest turn still sorts to the top.
        const at =
          (m.metadata?.at as string) ??
          new Date(base - (list.length - 1 - index) * 1000).toISOString();
        messages.push({
          key,
          messageId,
          campaignId: c.id,
          campaignName: c.name ?? "Untitled campaign",
          sender: hidden
            ? "Campaign opening"
            : m.role === "user"
              ? names.get(c.user_id) ?? "Adventurer"
              : "Dungeon Master",
          senderKind: m.role === "user" ? "player" : "dm",
          text: text.length > 1200 ? `${text.slice(0, 1200)}…` : text,
          at,
          read: read.has(key),
        });
      });
    }

    messages.sort((a, b) => b.at.localeCompare(a.at));
    const trimmed = messages.slice(0, 800);

    return {
      total: messages.length,
      unread: messages.filter((m) => !m.read).length,
      messages: trimmed,
    };
  });

export const setMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campaignId: string; messageId: string; read: boolean }) => {
    if (!input?.campaignId || !input?.messageId) throw new Error("Missing message");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: any; userId: string };
    await assertAdmin(ctx);
    if (data.read) {
      const { error } = await ctx.supabase.from("admin_message_reads").upsert(
        { admin_id: ctx.userId, campaign_id: data.campaignId, message_id: data.messageId },
        { onConflict: "admin_id,campaign_id,message_id" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await ctx.supabase
        .from("admin_message_reads")
        .delete()
        .eq("admin_id", ctx.userId)
        .eq("campaign_id", data.campaignId)
        .eq("message_id", data.messageId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ------------------------------------------------- players per campaign */

export interface CampaignPlayers {
  id: string;
  name: string;
  owner: string;
  players: number;
  messages: number;
  updatedAt: string;
}

export const getCampaignPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignPlayers[]> => {
    const ctx = context as unknown as { supabase: any; userId: string };
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { countActivePlayers } = await import("@/lib/campaign");

    const [campsRes, profilesRes] = await Promise.all([
      supabaseAdmin
        .from("campaigns")
        .select("id, name, user_id, data, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("profiles").select("id, display_name"),
    ]);
    const names = new Map<string, string>(
      (profilesRes.data ?? []).map((p: any) => [p.id, p.display_name ?? "Adventurer"]),
    );

    return (campsRes.data ?? []).map((c: any) => {
      const data = (c.data ?? {}) as any;
      return {
        id: c.id,
        name: c.name ?? "Untitled campaign",
        owner: names.get(c.user_id) ?? "Adventurer",
        players: countActivePlayers(data),
        messages: Array.isArray(data.messages) ? data.messages.length : 0,
        updatedAt: c.updated_at,
      };
    });
  });
