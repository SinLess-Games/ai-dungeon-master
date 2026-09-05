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
  recentUsers: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    isAdmin: boolean;
  }[];
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

async function assertAdmin(context: { db: any; userId: string }) {
  const { data, error } = await context.db.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminMetrics> => {
    await assertAdmin(context as { db: any; userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { serviceDatabase } = await import("@/integrations/d1/client.server");
    const dbAdmin = await serviceDatabase();

    const [usersRes, chars, camps, worlds, maps, rolls, roles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      dbAdmin.from("characters").select("id, created_at, user_id"),
      dbAdmin.from("campaigns").select("id, created_at, user_id, data"),
      dbAdmin.from("worlds").select("id, created_at, user_id"),
      dbAdmin.from("game_maps").select("id, created_at"),
      dbAdmin.from("dice_rolls").select("id, created_at"),
      dbAdmin.from("user_roles").select("user_id, role"),
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
      for (const r of rows ?? [])
        m.set(dayKey(r.created_at), (m.get(dayKey(r.created_at)) ?? 0) + 1);
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
          (u.user_metadata?.["display_name"] as string | undefined) ??
          (u.email ?? "").split("@")[0] ??
          "Adventurer",
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
              ? (c.data as { messages: unknown[] }).messages.length
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
    await assertAdmin(context as { db: any; userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { serviceDatabase } = await import("@/integrations/d1/client.server");
    const dbAdmin = await serviceDatabase();

    const [subsRes, usersRes] = await Promise.all([
      dbAdmin
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

export const getAdminInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInbox> => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    // Nothing is routed to the admin inbox at this time.
    return { total: 0, unread: 0, messages: [] };
  });

export const setMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campaignId: string; messageId: string; read: boolean }) => {
    if (!input?.campaignId || !input?.messageId) throw new Error("Missing message");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    if (data.read) {
      const { error } = await ctx.db
        .from("admin_message_reads")
        .upsert(
          { admin_id: ctx.userId, campaign_id: data.campaignId, message_id: data.messageId },
          { onConflict: "admin_id,campaign_id,message_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await ctx.db
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
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    const { serviceDatabase } = await import("@/integrations/d1/client.server");
    const dbAdmin = await serviceDatabase();
    const { countActivePlayers } = await import("@/lib/campaign");

    const [campsRes, profilesRes] = await Promise.all([
      dbAdmin
        .from("campaigns")
        .select("id, name, user_id, data, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500),
      dbAdmin.from("profiles").select("id, display_name"),
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

/* --------------------------------------------- campaign dashboard */

function textOf(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p: any) => p?.type === "text" && typeof p.text === "string")
    .map((p: any) => p.text as string)
    .join("\n")
    .trim();
}

export interface CampaignPlayerRow {
  key: string;
  name: string;
  /** "hero" for player-run seats, "companion" for DM-run ones. */
  kind: "hero" | "companion";
  isOwner: boolean;
  race: string;
  classLine: string;
  level: number;
  status: string;
  hp: number;
  maxHp: number;
  messages: number;
  titles: { name: string; rarity: string; awardedAt: string }[];
}

export interface CampaignDashboardRow {
  id: string;
  name: string;
  owner: string;
  ownerId: string;
  updatedAt: string;
  completed: boolean;
  questsDone: number;
  questsTotal: number;
  messages: number;
  playerMessages: number;
  players: CampaignPlayerRow[];
}

function questCounts(data: any) {
  const quests = Array.isArray(data?.quests) ? data.quests : [];
  return {
    total: quests.length,
    done: quests.filter((q: any) => q?.status === "done").length,
  };
}

function playerMessageCount(data: any) {
  const list = Array.isArray(data?.messages) ? data.messages : [];
  return list.filter((m: any, i: number) => m?.role === "user" && !m?.metadata?.hidden && i !== 0)
    .length;
}

async function loadTitlesByUser(dbAdmin: any, userIds: string[]) {
  const map = new Map<string, { name: string; rarity: string; awardedAt: string }[]>();
  if (!userIds.length) return map;
  const { data } = await dbAdmin
    .from("player_titles")
    .select("user_id, awarded_at, titles(name, rarity)")
    .in("user_id", userIds);
  for (const row of (data ?? []) as any[]) {
    const list = map.get(row.user_id) ?? [];
    list.push({
      name: row.titles?.name ?? "Unknown title",
      rarity: row.titles?.rarity ?? "common",
      awardedAt: row.awarded_at,
    });
    map.set(row.user_id, list);
  }
  return map;
}

function buildPlayers(
  data: any,
  ownerName: string,
  ownerTitles: { name: string; rarity: string; awardedAt: string }[],
  playerMessages: number,
): CampaignPlayerRow[] {
  const party = Array.isArray(data?.party) ? data.party : [];
  const rows: CampaignPlayerRow[] = [];
  let ownerSeatUsed = false;

  for (const m of party as any[]) {
    if (!m) continue;
    const isHero = m.controlledBy === "player";
    const isOwner = isHero && !ownerSeatUsed;
    if (isOwner) ownerSeatUsed = true;
    rows.push({
      key: String(m.id ?? m.name ?? rows.length),
      name: m.name ?? "Unnamed",
      kind: isHero ? "hero" : "companion",
      isOwner,
      race: m.race ?? "",
      classLine: m.classLine ?? "",
      level: Number(m.level ?? 1),
      status: m.status ?? "active",
      hp: Number(m.hp ?? 0),
      maxHp: Number(m.maxHp ?? 0),
      messages: isOwner ? playerMessages : 0,
      titles: isOwner ? ownerTitles : [],
    });
  }

  if (!ownerSeatUsed) {
    rows.unshift({
      key: "owner",
      name: ownerName,
      kind: "hero",
      isOwner: true,
      race: "",
      classLine: "",
      level: 1,
      status: "active",
      hp: 0,
      maxHp: 0,
      messages: playerMessages,
      titles: ownerTitles,
    });
  }
  return rows;
}

export const getCampaignDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignDashboardRow[]> => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    const { serviceDatabase } = await import("@/integrations/d1/client.server");
    const dbAdmin = await serviceDatabase();

    const [campsRes, profilesRes] = await Promise.all([
      dbAdmin
        .from("campaigns")
        .select("id, name, user_id, data, updated_at")
        .order("updated_at", { ascending: false })
        .limit(200),
      dbAdmin.from("profiles").select("id, display_name"),
    ]);
    const names = new Map<string, string>(
      (profilesRes.data ?? []).map((p: any) => [p.id, p.display_name ?? "Adventurer"]),
    );
    const camps = (campsRes.data ?? []) as any[];
    const titles = await loadTitlesByUser(
      dbAdmin,
      Array.from(new Set(camps.map((c) => c.user_id))),
    );

    return camps.map((c) => {
      const data = (c.data ?? {}) as any;
      const q = questCounts(data);
      const playerMessages = playerMessageCount(data);
      const ownerName = names.get(c.user_id) ?? "Adventurer";
      return {
        id: c.id,
        name: c.name ?? "Untitled campaign",
        owner: ownerName,
        ownerId: c.user_id,
        updatedAt: c.updated_at,
        completed: Boolean(data.completedAt),
        questsDone: q.done,
        questsTotal: q.total,
        messages: Array.isArray(data.messages) ? data.messages.length : 0,
        playerMessages,
        players: buildPlayers(data, ownerName, titles.get(c.user_id) ?? [], playerMessages),
      };
    });
  });

export interface CampaignPlayerProfile {
  campaign: { id: string; name: string; owner: string; updatedAt: string; completed: boolean };
  player: CampaignPlayerRow;
  gear: { slot: string; name: string; notes?: string }[];
  notes: string;
  questsDone: number;
  questsTotal: number;
  journalEntries: number;
  recentMessages: { id: string; text: string }[];
}

export const getCampaignPlayerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { campaignId: string; playerKey: string }) => {
    if (!input?.campaignId || !input?.playerKey) throw new Error("Missing player");
    return input;
  })
  .handler(async ({ data: input, context }): Promise<CampaignPlayerProfile> => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    const { serviceDatabase } = await import("@/integrations/d1/client.server");
    const dbAdmin = await serviceDatabase();

    const { data: camp, error } = await dbAdmin
      .from("campaigns")
      .select("id, name, user_id, data, updated_at")
      .eq("id", input.campaignId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!camp) throw new Error("Campaign not found");

    const data = (camp.data ?? {}) as any;
    const { data: profile } = await dbAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", camp.user_id)
      .maybeSingle();
    const ownerName = profile?.display_name ?? "Adventurer";
    const titles = await loadTitlesByUser(dbAdmin, [camp.user_id]);
    const playerMessages = playerMessageCount(data);
    const players = buildPlayers(data, ownerName, titles.get(camp.user_id) ?? [], playerMessages);
    const player = players.find((p) => p.key === input.playerKey) ?? players[0];
    if (!player) throw new Error("Player not found");

    const seat = (Array.isArray(data.party) ? data.party : []).find(
      (m: any) => String(m?.id ?? m?.name) === player.key,
    );
    const q = questCounts(data);
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const recent = player.isOwner
      ? messages
          .filter((m: any, i: number) => m?.role === "user" && !m?.metadata?.hidden && i !== 0)
          .slice(-10)
          .reverse()
          .map((m: any, i: number) => ({
            id: String(m.id ?? i),
            text: textOf(m.parts).slice(0, 600),
          }))
          .filter((m: any) => m.text)
      : [];

    return {
      campaign: {
        id: camp.id,
        name: camp.name ?? "Untitled campaign",
        owner: ownerName,
        updatedAt: camp.updated_at,
        completed: Boolean(data.completedAt),
      },
      player,
      gear: Array.isArray(seat?.gear)
        ? seat.gear.map((g: any) => ({ slot: g?.slot ?? "", name: g?.name ?? "", notes: g?.notes }))
        : [],
      notes: seat?.notes ?? "",
      questsDone: q.done,
      questsTotal: q.total,
      journalEntries: Array.isArray(data.journal) ? data.journal.length : 0,
      recentMessages: recent,
    };
  });
