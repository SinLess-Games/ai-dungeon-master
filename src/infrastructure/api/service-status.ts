import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

export const serviceStatusQuery = queryOptions({
  queryKey: ["service-status"],
  queryFn: async ({ signal }) => {
    const response = await api.api.health.$get({}, { init: { signal } });
    // Readiness deliberately returns a status report with 503 when unavailable.
    if (response.status !== 200 && response.status !== 503) {
      throw new Error("Service status is temporarily unavailable.");
    }
    return response.json();
  },
  staleTime: 15_000,
  refetchInterval: 30_000,
});
