import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TITLE_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type TitleRarity = (typeof TITLE_RARITIES)[number];

export const CRITERIA_KINDS = [
  { value: "manual", label: "Granted by hand" },
  { value: "characters_created", label: "Heroes created" },
  { value: "campaigns_created", label: "Campaigns started" },
  { value: "worlds_created", label: "Worlds forged" },
  { value: "maps_created", label: "Maps made" },
  { value: "dice_rolled", label: "Dice rolled" },
  { value: "campaigns_completed", label: "Campaigns completed" },
  { value: "messages_sent", label: "Messages sent to the DM" },
  { value: "quests_completed", label: "Quests completed" },
  { value: "party_members", label: "Largest party gathered" },
  { value: "sites_discovered", label: "Places discovered" },
  { value: "days_since_joined", label: "Days since joining" },
] as const;
export type CriteriaKind = (typeof CRITERIA_KINDS)[number]["value"];

export interface TitleRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  rarity: string;
  icon: string | null;
  isActive: boolean;
  criteriaKind: string;
  criteriaTarget: number;
  holders: number;
}

export interface EarnedTitle {
  id: string;
  slug: string;
  name: string;
  description: string;
  rarity: string;
  icon: string | null;
  awardedAt: string;
}

export interface TitleProgress {
  slug: string;
  name: string;
  description: string;
  rarity: string;
  criteriaKind: string;
  criteriaTarget: number;
  current: number;
  earned: boolean;
}

type Ctx = { db: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data, error } = await ctx.db.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

function toRow(r: any, holders: number): TitleRow {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    rarity: r.rarity,
    icon: r.icon,
    isActive: r.is_active,
    criteriaKind: r.criteria_kind,
    criteriaTarget: r.criteria_target,
    holders,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/* ---------------------------------------------------------------- admin */

export const listTitles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TitleRow[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const [{ data, error }, held] = await Promise.all([
      ctx.db.from("titles").select("*").order("created_at", { ascending: true }),
      ctx.db.from("player_titles").select("title_id"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const r of (held.data ?? []) as any[]) {
      counts.set(r.title_id, (counts.get(r.title_id) ?? 0) + 1);
    }
    return ((data ?? []) as any[]).map((r) => toRow(r, counts.get(r.id) ?? 0));
  });

export const saveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      name: string;
      description?: string;
      rarity?: string;
      icon?: string | null;
      isActive?: boolean;
      criteriaKind?: string;
      criteriaTarget?: number;
    }) => {
      if (!input?.name?.trim()) throw new Error("A title needs a name");
      if (input.rarity && !TITLE_RARITIES.includes(input.rarity as TitleRarity)) {
        throw new Error("Unknown rarity");
      }
      if (input.criteriaKind && !CRITERIA_KINDS.some((c) => c.value === input.criteriaKind)) {
        throw new Error("Unknown earning rule");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const patch = {
      name: data.name.trim().slice(0, 80),
      description: (data.description ?? "").slice(0, 400),
      rarity: data.rarity ?? "common",
      icon: data.icon || null,
      is_active: data.isActive ?? true,
      criteria_kind: data.criteriaKind ?? "manual",
      criteria_target: Math.max(0, Math.round(data.criteriaTarget ?? 0)),
    };
    if (data.id) {
      const { error } = await ctx.db.from("titles").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await ctx.db
      .from("titles")
      .insert({ ...patch, slug: slugify(patch.name) || `title-${Date.now()}` });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.db.from("titles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface TitleHolder {
  userId: string;
  displayName: string;
  titleIds: string[];
}

export const listTitleHolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TitleHolder[]> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const [{ data: profiles }, { data: held }] = await Promise.all([
      ctx.db.from("profiles").select("id, display_name").order("display_name").limit(500),
      ctx.db.from("player_titles").select("user_id, title_id"),
    ]);
    const byUser = new Map<string, string[]>();
    for (const r of (held ?? []) as any[]) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.title_id]);
    }
    return ((profiles ?? []) as any[]).map((p) => ({
      userId: p.id,
      displayName: p.display_name ?? "Adventurer",
      titleIds: byUser.get(p.id) ?? [],
    }));
  });

export const grantTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; titleId: string; grant: boolean }) => {
    if (!input?.userId || !input?.titleId) throw new Error("Missing player or title");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    if (data.grant) {
      const { error } = await ctx.db
        .from("player_titles")
        .upsert(
          { user_id: data.userId, title_id: data.titleId },
          { onConflict: "user_id,title_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await ctx.db
        .from("player_titles")
        .delete()
        .eq("user_id", data.userId)
        .eq("title_id", data.titleId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* --------------------------------------------------------------- player */

async function countFor(ctx: Ctx, table: string) {
  const { count } = await ctx.db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId);
  return count ?? 0;
}

export interface MyTitles {
  activeSlug: string | null;
  earned: EarnedTitle[];
  progress: TitleProgress[];
}

/** Re-checks achievement rules for the signed-in player, awards any newly met titles, and returns their collection. */
export const syncMyTitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyTitles> => {
    const ctx = context as unknown as Ctx;

    const [{ data: titles }, { data: mine }, { data: profile }] = await Promise.all([
      ctx.db.from("titles").select("*").eq("is_active", true),
      ctx.db.from("player_titles").select("title_id, awarded_at").eq("user_id", ctx.userId),
      ctx.db.from("profiles").select("title, created_at").eq("id", ctx.userId).maybeSingle(),
    ]);

    const all = (titles ?? []) as any[];
    const ownedAt = new Map<string, string>();
    for (const r of (mine ?? []) as any[]) ownedAt.set(r.title_id, r.awarded_at);

    const needs = new Set(all.map((t) => t.criteria_kind));
    const stats: Record<string, number> = {};
    if (needs.has("characters_created"))
      stats["characters_created"] = await countFor(ctx, "characters");
    if (needs.has("campaigns_created"))
      stats["campaigns_created"] = await countFor(ctx, "campaigns");
    if (needs.has("worlds_created")) stats["worlds_created"] = await countFor(ctx, "worlds");
    if (needs.has("maps_created")) stats["maps_created"] = await countFor(ctx, "game_maps");
    if (needs.has("dice_rolled")) stats["dice_rolled"] = await countFor(ctx, "dice_rolls");
    const campaignKinds = [
      "campaigns_completed",
      "messages_sent",
      "quests_completed",
      "party_members",
      "sites_discovered",
    ];
    if (campaignKinds.some((k) => needs.has(k))) {
      const { data: camps } = await ctx.db
        .from("campaigns")
        .select("data")
        .eq("user_id", ctx.userId);
      let completed = 0;
      let messages = 0;
      let quests = 0;
      let party = 0;
      let sites = 0;
      for (const row of (camps ?? []) as any[]) {
        const d = (row?.data ?? {}) as any;
        if (d.completedAt) completed += 1;
        if (Array.isArray(d.messages)) {
          messages += d.messages.filter(
            (m: any) => m?.role === "user" && !m?.metadata?.hidden,
          ).length;
        }
        if (Array.isArray(d.quests)) {
          quests += d.quests.filter((q: any) => q?.status === "done").length;
        }
        if (Array.isArray(d.party)) {
          party = Math.max(
            party,
            d.party.filter((m: any) => (m?.status ?? "active") === "active").length,
          );
        }
        const discovered = d.world?.discovered ?? d.discoveredSites;
        if (Array.isArray(discovered)) sites += discovered.length;
      }
      stats["campaigns_completed"] = completed;
      stats["messages_sent"] = messages;
      stats["quests_completed"] = quests;
      stats["party_members"] = party;
      stats["sites_discovered"] = sites;
    }
    if (needs.has("days_since_joined")) {
      const created = (profile as any)?.created_at;
      stats["days_since_joined"] = created
        ? Math.floor((Date.now() - new Date(created).getTime()) / 86_400_000)
        : 0;
    }

    const toAward = all.filter(
      (t) =>
        !ownedAt.has(t.id) &&
        t.criteria_kind !== "manual" &&
        (stats[t.criteria_kind] ?? 0) >= t.criteria_target,
    );
    if (toAward.length) {
      const { error } = await ctx.db.from("player_titles").upsert(
        toAward.map((t) => ({ user_id: ctx.userId, title_id: t.id })),
        { onConflict: "user_id,title_id" },
      );
      if (!error) for (const t of toAward) ownedAt.set(t.id, new Date().toISOString());
    }

    const earned: EarnedTitle[] = all
      .filter((t) => ownedAt.has(t.id))
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description,
        rarity: t.rarity,
        icon: t.icon,
        awardedAt: ownedAt.get(t.id)!,
      }));

    const progress: TitleProgress[] = all
      .filter((t) => !ownedAt.has(t.id) && t.criteria_kind !== "manual")
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        rarity: t.rarity,
        criteriaKind: t.criteria_kind,
        criteriaTarget: t.criteria_target,
        current: stats[t.criteria_kind] ?? 0,
        earned: false,
      }));

    return {
      activeSlug: ((profile as any)?.title as string | null) ?? null,
      earned,
      progress,
    };
  });

/** Chooses which earned title shows on the player's profile. */
export const setActiveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string | null }) => input ?? { slug: null })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    if (data.slug) {
      const { data: match } = await ctx.db
        .from("titles")
        .select("id")
        .eq("slug", data.slug)
        .maybeSingle();
      if (!match) throw new Error("Unknown title");
      const { data: owned } = await ctx.db
        .from("player_titles")
        .select("id")
        .eq("user_id", ctx.userId)
        .eq("title_id", (match as any).id)
        .maybeSingle();
      if (!owned) throw new Error("You have not earned that title yet");
    }
    const { error } = await ctx.db
      .from("profiles")
      .update({ title: data.slug })
      .eq("id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
