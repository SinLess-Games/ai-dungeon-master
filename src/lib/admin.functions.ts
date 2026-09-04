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
  };
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
      supabaseAdmin.from("campaigns").select("id, created_at, user_id"),
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
      },
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
