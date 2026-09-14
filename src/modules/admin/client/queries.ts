import type { InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/infrastructure/api/client";
export class AdminAccessError extends Error {}
async function checked<T>(response: { status: number; ok: boolean; json: () => Promise<T> }) {
  if (response.status === 401 || response.status === 403)
    throw new AdminAccessError("Administrator access is required.");
  if (!response.ok) throw new Error("Unable to load administration data. Please try again.");
  return response.json();
}
export const overviewQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", userId, "overview"],
    meta: { requiresAuth: true },
    queryFn: async ({ signal }) => {
      const response = await api.api.admin.overview.$get({}, { init: { signal } });
      return checked(response);
    },
    retry: false,
    gcTime: 0,
    refetchInterval: 30000,
  });
export interface AccountFilters {
  search: string;
  role: "all" | "user" | "admin";
  status: "all" | "active" | "suspended";
  page: number;
}
export const accountsQuery = (userId: string, filters: AccountFilters) =>
  queryOptions({
    queryKey: ["admin", userId, "accounts", filters],
    meta: { requiresAuth: true },
    queryFn: async ({ signal }) => {
      const response = await api.api.admin.users.$get(
        { query: { ...filters, page: String(filters.page) } },
        { init: { signal } },
      );
      return checked(response);
    },
    retry: false,
    gcTime: 0,
  });
export type AdminAccount = InferResponseType<typeof api.api.admin.users.$get>["users"][number];

export const feedbackQuery = (userId: string, type: "bug" | "feature", page: number) =>
  queryOptions({
    queryKey: ["admin", userId, "feedback", type, page],
    meta: { requiresAuth: true },
    queryFn: async ({ signal }) =>
      checked(
        await api.api.admin.feedback.$get(
          { query: { type, page: String(page) } },
          { init: { signal } },
        ),
      ),
    retry: false,
    gcTime: 0,
    refetchInterval: 30000,
  });

export async function updateFeedbackStatus(
  type: "bug" | "feature",
  id: string,
  status: string,
) {
  return checked<{ id: string; type: "bug" | "feature"; status: string; githubSyncQueued: boolean }>(
    await fetch(`/api/admin/feedback/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  );
}

export async function retryFeedbackGitHubSync(type: "bug" | "feature", id: string) {
  return checked<{ id: string; type: "bug" | "feature"; queued: boolean }>(
    await fetch(`/api/admin/feedback/${encodeURIComponent(type)}/${encodeURIComponent(id)}/sync`, {
      method: "POST",
      credentials: "same-origin",
    }),
  );
}

export const metricsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", userId, "metrics"],
    meta: { requiresAuth: true },
    queryFn: async ({ signal }) =>
      checked(await api.api.admin.metrics.$get({}, { init: { signal } })),
    retry: false,
    gcTime: 0,
    refetchInterval: 30000,
  });
