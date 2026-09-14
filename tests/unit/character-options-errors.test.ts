import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { characterOptionRoutes } from "@/modules/characters/server/optionsRoutes";
import { supplementClassOptionRoutes } from "@/modules/characters/server/supplementClassOptionRoutes";
import { errorHandler } from "@/server/middleware/errors";

vi.mock("@/modules/auth/server/auth", () => ({ createAuth: vi.fn(() => ({})) }));
vi.mock("@/modules/auth/server/requireAuth", () => ({
  requireUser: vi.fn(async () => ({ user: { id: "player-1" } })),
}));

describe("character option error responses", () => {
  it.each([
    ["base", characterOptionRoutes],
    ["supplemental", supplementClassOptionRoutes],
  ] as const)(
    "preserves the root error envelope for %s catalog failures",
    async (_name, routes) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const app = new Hono().route("/", routes).onError(errorHandler);
      const response = await app.request(
        "/api/dnd35/character-creation-options",
        { headers: { "x-request-id": "catalog-failure" } },
        {
          DB: {
            prepare: () => {
              throw new Error("private database failure");
            },
          },
        },
      );
      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toMatchObject({
        error: { code: "INTERNAL_SERVER_ERROR", requestId: "catalog-failure" },
      });
    },
  );
});
