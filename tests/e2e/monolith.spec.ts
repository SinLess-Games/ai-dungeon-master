import { expect, test } from "@playwright/test";

test("React navigation and Hono requests share one origin, including a deep-link reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("The Endless Codex — AI-Powered D&D 3.5 Adventures");
  await expect(
    page.getByRole("heading", { name: "Infinite Stories Always Within Reach", exact: true }),
  ).toBeVisible();
  const healthResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/health",
  );
  await page.getByRole("link", { name: "Service status" }).click();
  const response = await healthResponse;
  expect(new URL(response.url()).origin).toBe(new URL(page.url()).origin);
  expect(response.headers()["content-type"]).toContain("application/json");
  await expect(page.getByRole("heading", { name: "Service status" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check again" })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Service status" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Endless Codex" }).click();
  await expect(
    page.getByRole("heading", { name: "Infinite Stories Always Within Reach", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("API navigation and missing API endpoints return JSON instead of the SPA", async ({
  page,
  request,
}) => {
  for (const path of ["/api", "/api/health/live", "/api/not-a-route"]) {
    const response = await page.goto(path);
    expect(response?.headers()["content-type"]).toContain("application/json");
    expect(response?.status()).toBe(path.endsWith("not-a-route") ? 404 : 200);
  }
  const missing = await request.post("/api/not-a-route");
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
});

test("unknown frontend deep links render the React not-found page", async ({ page }) => {
  await page.goto("/missing/frontend/page");
  await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
  await page.getByRole("link", { name: "Return Home" }).click();
  await expect(
    page.getByRole("heading", { name: "Infinite Stories Always Within Reach", exact: true }),
  ).toBeVisible();
});

test("service status handles an outage and can recover from a failed request", async ({ page }) => {
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 503,
      json: { status: "unhealthy", timestamp: "2026-09-15T01:00:00.000Z" },
    }),
  );
  await page.goto("/status");
  await expect(
    page.getByText("The service is temporarily unavailable", { exact: true }),
  ).toBeVisible();

  await page.unroute("**/api/health");
  await page.route("**/api/health", (route) =>
    route.fulfill({ status: 500, json: { error: "Test failure" } }),
  );
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(page.getByText("We couldn’t check the service. Please try again.")).toBeVisible();

  await page.unroute("**/api/health");
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 200,
      json: { status: "healthy", timestamp: "2026-09-15T01:01:00.000Z" },
    }),
  );
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(page.getByText("All systems operational", { exact: true })).toBeVisible();
  await expect(page.getByText("Last checked", { exact: false })).toBeVisible();
});
