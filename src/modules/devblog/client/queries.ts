import { queryOptions } from "@tanstack/react-query";
import { api } from "@/infrastructure/api/client";
export { api };
type JsonResponse = { ok: boolean; status: number; json: () => Promise<unknown> };
type SuccessBody<R extends JsonResponse> = Exclude<
  Awaited<ReturnType<R["json"]>>,
  { success: false }
>;
export async function checked<R extends JsonResponse>(response: R): Promise<SuccessBody<R>> {
  const data = await response.json();
  if (!response.ok) {
    const details = data as { error?: { message?: string; issues?: { message: string }[] } };
    throw new Error(
      details.error?.issues?.[0]?.message ||
        details.error?.message ||
        "Unable to complete this request.",
    );
  }
  return data as SuccessBody<R>;
}
export const blogListQuery = (page: number) =>
  queryOptions({
    queryKey: ["devblog", "list", page],
    queryFn: async ({ signal }) =>
      checked(
        await api.api.devblog.posts.$get({ query: { page: String(page) } }, { init: { signal } }),
      ),
  });
export const blogPostQuery = (slug: string) =>
  queryOptions({
    queryKey: ["devblog", "post", slug],
    queryFn: async ({ signal }) =>
      checked(await api.api.devblog.posts[":slug"].$get({ param: { slug } }, { init: { signal } })),
    retry: false,
  });
export const commentListQuery = (id: string, page: number) =>
  queryOptions({
    queryKey: ["devblog", "comments", id, page],
    queryFn: async ({ signal }) =>
      checked(
        await api.api.devblog.posts[":id"].comments.$get(
          { param: { id }, query: { page: String(page) } },
          { init: { signal } },
        ),
      ),
  });
export const adminBlogQuery = (
  userId: string,
  status: "all" | "draft" | "published" | "archived",
  page: number,
) =>
  queryOptions({
    queryKey: ["admin", userId, "devblog", status, page],
    meta: { requiresAuth: true },
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) =>
      checked(
        await api.api.admin.devblog.posts.$get(
          { query: { status, page: String(page) } },
          { init: { signal } },
        ),
      ),
  });
export const editorQuery = (userId: string, id: string) =>
  queryOptions({
    queryKey: ["admin", userId, "devblog", "editor", id],
    meta: { requiresAuth: true },
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) =>
      checked(
        await api.api.admin.devblog.posts[":id"].$get({ param: { id } }, { init: { signal } }),
      ),
  });
export const moderationQuery = (
  userId: string,
  status: "pending" | "approved" | "rejected",
  page: number,
) =>
  queryOptions({
    queryKey: ["admin", userId, "devblog", "moderation", status, page],
    meta: { requiresAuth: true },
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) =>
      checked(
        await api.api.admin.devblog.comments.$get(
          { query: { status, page: String(page) } },
          { init: { signal } },
        ),
      ),
  });
export const aiWriterStatusQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", userId, "devblog", "ai-writer"],
    meta: { requiresAuth: true },
    gcTime: 0,
    retry: false,
    queryFn: async () => checked(await api.api.admin.devblog.ai.status.$get()),
  });
