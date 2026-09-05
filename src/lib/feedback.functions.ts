import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FeedbackItem {
  id: string;
  kind: string;
  title: string;
  details: string;
  status: string;
  adminNote: string | null;
  pageUrl: string | null;
  createdAt: string;
  reporter: string;
}

export const FEEDBACK_STATUSES = ["new", "planned", "in progress", "done", "declined"] as const;

async function assertAdmin(context: { db: any; userId: string }) {
  const { data, error } = await context.db.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FeedbackItem[]> => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);

    const { data, error } = await ctx.db
      .from("feedback")
      .select("id, kind, title, details, status, admin_note, page_url, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as any[];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const names = new Map<string, string>();
    if (ids.length) {
      const { data: profiles } = await ctx.db
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      for (const p of (profiles ?? []) as any[]) names.set(p.id, p.display_name);
    }

    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      details: r.details,
      status: r.status,
      adminNote: r.admin_note,
      pageUrl: r.page_url,
      createdAt: r.created_at,
      reporter: names.get(r.user_id) ?? "Adventurer",
    }));
  });

export const updateFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status?: string; adminNote?: string }) => {
    if (!input?.id) throw new Error("Missing id");
    if (input.status && !FEEDBACK_STATUSES.includes(input.status as never)) {
      throw new Error("Invalid status");
    }
    return {
      id: input.id,
      status: input.status,
      adminNote: input.adminNote?.slice(0, 2000),
    };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch["status"] = data.status;
    if (data.adminNote !== undefined) patch["admin_note"] = data.adminNote;
    const { error } = await ctx.db.from("feedback").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { db: any; userId: string };
    await assertAdmin(ctx);
    const { error } = await ctx.db.from("feedback").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
