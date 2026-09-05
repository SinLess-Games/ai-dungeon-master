import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const collection = z.enum(["characters", "worlds", "campaigns", "game_maps"]);
export const readProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.db
      .from("profiles")
      .select("display_name, avatar_url, created_at")
      .eq("id", context.userId)
      .single();
    return result.data;
  });
export const writeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      display_name: z.string().trim().min(2).max(100).optional(),
      avatar_url: z.string().max(2_000_000).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await context.db.from("profiles").update(data).eq("id", context.userId);
    return { error: null };
  });
export const readAdminRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => context.db.scope.admin);
export const readSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.enum(["sandbox", "live"]))
  .handler(async ({ data, context }) => {
    const result = await context.db
      .from("subscriptions")
      .select("id, status, price_id, current_period_end, cancel_at_period_end")
      .eq("user_id", context.userId)
      .eq("environment", data)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return result.data;
  });
export const readCollectionRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(collection)
  .handler(async ({ data, context }) => {
    const result = await context.db
      .from(data)
      .select("id, data, updated_at")
      .eq("user_id", context.userId);
    return result.data ?? [];
  });
export const writeCollectionRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      table: collection,
      rows: z
        .array(
          z.object({
            id: z.uuid(),
            name: z.string().max(500),
            data: z.record(z.string(), z.unknown()),
            world_id: z.uuid().optional(),
            updated_at: z.iso.datetime(),
          }),
        )
        .max(50),
    }),
  )
  .handler(async ({ data, context }) => {
    for (const row of data.rows) {
      if (row.data["id"] !== row.id || row.data["updatedAt"] !== row.updated_at)
        throw new Error("Invalid saved record");
      if (new TextEncoder().encode(JSON.stringify(row.data)).byteLength > 1_500_000)
        throw new Error("Saved record is too large");
    }
    await context.db
      .from(data.table)
      .upsert(data.rows.map((row) => ({ ...row, user_id: context.userId })));
    return { error: null };
  });
export const deleteCollectionRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ table: collection, id: z.uuid() }))
  .handler(async ({ data, context }) => {
    await context.db.from(data.table).delete().eq("id", data.id).eq("user_id", context.userId);
    return { error: null };
  });
export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      kind: z.enum(["bug", "feature"]),
      title: z.string().trim().min(4).max(140),
      details: z.string().max(4000),
      page_url: z.string().max(2000).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    await context.db.from("feedback").insert({ ...data, user_id: context.userId });
    return { error: null };
  });

// Storage remains in Supabase; its privileged upload is authorized by the D1 admin role.
export const uploadBlogMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FormData) => data)
  .handler(async ({ data, context }) => {
    if (!context.db.scope.admin) throw new Error("Forbidden");
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      file.size > 10 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)
    )
      throw new Error("Upload a PNG, JPEG, WebP, or GIF under 10 MB");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = file.type.split("/")[1];
    const path = `posts/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("blog-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return `/api/public/blog-media/${path}`;
  });
