/* global document, innerWidth, window */
/** Runs the real Vite/Worker monolith with isolated D1 and generated, disposable credentials. */
import { createServer } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { getPlatformProxy, unstable_readConfig as readConfig } from "wrangler";
import { chromium } from "@playwright/test";
import { mkdtemp, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const directory = await mkdtemp(join(tmpdir(), "codex-auth-browser-"));
const origin = "http://localhost:5186";
const secret = randomBytes(48).toString("hex");
const password = randomBytes(24).toString("hex");
let server, proxy, browser;
try {
  const original = readConfig({ config: "wrangler.jsonc" });
  const configPath = join(directory, "wrangler.json");
  await writeFile(
    configPath,
    JSON.stringify({
      name: original.name,
      main: fileURLToPath(new URL("../src/server/worker.ts", import.meta.url)),
      compatibility_date: original.compatibility_date,
      compatibility_flags: original.compatibility_flags,
      d1_databases: original.d1_databases,
      assets: original.assets,
      vars: { BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret },
    }),
  );
  proxy = await getPlatformProxy({
    configPath,
    persist: { path: join(directory, "v3") },
    remoteBindings: false,
  });
  for (const file of (await readdir("drizzle")).filter((f) => f.endsWith(".sql")).sort())
    for (const statement of (await readFile(`drizzle/${file}`, "utf8"))
      .split("--> statement-breakpoint")
      .filter((s) => s.trim()))
      await proxy.env.DB.prepare(statement).run();
  const loader = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  });
  try {
    const { seedAdmin } = await loader.ssrLoadModule("/src/modules/auth/server/seed.ts");
    await seedAdmin({
      DB: proxy.env.DB,
      BETTER_AUTH_URL: origin,
      BETTER_AUTH_SECRET: secret,
      SEED_ADMIN_PASSWORD: password,
      SEED_ADMIN_EMAIL: "admin-browser@example.test",
      SEED_ADMIN_USERNAME: "BrowserAdmin",
    });
  } finally {
    await loader.close();
  }
  // An older account distinguishes the rolling signup windows.
  await proxy.env.DB.prepare("UPDATE users SET created_at = ? WHERE email = ?")
    .bind(Date.now() - 10 * 86_400_000, "admin-browser@example.test")
    .run();
  await proxy.dispose();
  proxy = undefined;
  server = await createServer({
    configFile: false,
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/app/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
      cloudflare({
        configPath,
        persistState: { path: directory },
        remoteBindings: false,
        inspectorPort: false,
      }),
    ],
    server: { host: "localhost", port: 5186, strictPort: true },
  });
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  assert.equal((await page.request.get(origin + "/api/admin/overview")).status(), 401);
  assert.equal((await page.request.get(origin + "/api/admin/users")).status(), 401);
  assert.equal((await page.request.get(origin + "/api/admin/feedback")).status(), 401);
  assert.equal((await page.request.get(origin + "/api/admin/metrics")).status(), 401);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await page.getByLabel("Email or username").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "Enter the Codex", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("BrowserHero");
  await page.getByLabel("Email", { exact: true }).fill("browser@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill("mismatch");
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByText("Passwords do not match.", { exact: true }).waitFor();
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
  await page.reload();
  await page.locator(".auth-user-menu summary").waitFor();
  assert.equal((await page.request.get(origin + "/api/admin/overview")).status(), 403);
  assert.equal((await page.request.get(origin + "/api/admin/users")).status(), 403);
  assert.equal((await page.request.get(origin + "/api/admin/feedback")).status(), 403);
  assert.equal((await page.request.get(origin + "/api/admin/metrics")).status(), 403);
  await page.goto(origin + "/user/admin");
  await page.getByRole("heading", { name: "Administrator access required", exact: true }).waitFor();
  await page.goto(origin);
  await page.locator(".auth-user-menu summary").click();
  await page.getByRole("link", { name: "My profile", exact: true }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Test Adventurer");
  await page.getByLabel("Username", { exact: true }).fill("ProfileHero");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Profile saved.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Your adventurer profile" }).waitFor();
  assert.equal(
    await page.getByLabel("Display name", { exact: true }).inputValue(),
    "Test Adventurer",
  );
  assert.equal(await page.getByLabel("Username", { exact: true }).inputValue(), "ProfileHero");
  await page.getByLabel("Username", { exact: true }).fill("BrowserAdmin");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "That username is unavailable." }).waitFor();
  await page.getByRole("button", { name: "Discard changes" }).click();
  assert.equal(await page.getByLabel("Username", { exact: true }).inputValue(), "ProfileHero");
  await page.getByLabel("Username", { exact: true }).fill("BrowserHero");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Profile saved.", { exact: true }).waitFor();
  await page.getByLabel("Choose profile picture").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 100, height: 100 } }),
  });
  await page.getByRole("button", { name: "Save picture", exact: true }).click();
  await page.getByText("Picture saved.", { exact: true }).waitFor();
  await page.reload();
  await page.getByAltText("Your profile picture").waitFor();
  assert.ok(
    (await page.getByAltText("Your profile picture").getAttribute("src")).startsWith(
      "data:image/webp;base64,",
    ),
  );
  assert.equal(await page.locator(".codex-avatar img").count(), 1);
  await page.getByRole("button", { name: "Remove picture" }).click();
  await page.getByRole("button", { name: "Save picture", exact: true }).click();
  await page.getByText("Picture saved.", { exact: true }).waitFor();
  await page.getByAltText("Your profile picture").waitFor({ state: "detached" });
  const changedPassword = randomBytes(24).toString("hex");
  for (const [current, next] of [
    [password, changedPassword],
    [changedPassword, password],
  ]) {
    await page.getByLabel("Current password", { exact: true }).fill(current);
    await page.getByLabel("New password", { exact: true }).fill(next);
    await page.getByLabel("Confirm new password", { exact: true }).fill(next);
    await page.getByRole("button", { name: "Change password", exact: true }).click();
    await page
      .getByText("Password changed. Other devices have been signed out.", { exact: true })
      .waitFor();
  }
  await page.getByRole("button", { name: "Change password", exact: true }).scrollIntoViewIfNeeded();
  assert.ok((await page.locator(".codex-header").boundingBox()).y >= 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: join(tmpdir(), `codex-profile-${width}.png`) });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const kind of ["bug", "feature"]) {
    await page.getByRole("button", { name: "Give feedback", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Help shape the Codex" });
    if (kind === "feature") await modal.getByRole("button", { name: /Feature Request/ }).click();
    await modal.getByLabel("Title", { exact: true }).fill("Browser feedback test");
    await modal
      .getByLabel(kind === "bug" ? "What went wrong?" : "Describe your idea")
      .fill("An isolated browser test submission.");
    const request = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/feedback") && response.request().method() === "POST",
    );
    await modal
      .getByRole("button", {
        name: kind === "bug" ? "Submit bug report" : "Submit feature request",
        exact: true,
      })
      .click();
    const response = await request;
    assert.equal(response.status(), 201);
    assert.equal((await response.json()).type, kind);
    await page.getByRole("heading", { name: "Thank you, adventurer" }).waitFor();
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  assert.equal(
    (
      await page.request.post(origin + "/api/feedback", {
        headers: { Origin: origin },
        data: { type: "bug", title: "", description: "" },
      })
    ).status(),
    400,
  );
  const cookies = await page.context().cookies();
  assert.ok(cookies.some((cookie) => cookie.httpOnly && cookie.name.includes("session_token")));
  await page.locator(".auth-user-menu summary").click();
  assert.equal(await page.locator(".auth-admin-label").count(), 0);
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
  await page.goto(origin + "/user/profile");
  await page.getByRole("heading", { name: "Your story starts here" }).waitFor();
  assert.equal(await page.getByLabel("Display name", { exact: true }).count(), 0);
  await page.goto(origin);
  await page.getByRole("button", { name: "Give feedback", exact: true }).click();
  await page.getByRole("button", { name: "Sign in to give feedback" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Help shape the Codex" }).waitFor({ state: "hidden" });
  assert.equal(
    (
      await page.request.post(origin + "/api/feedback", {
        headers: { Origin: origin },
        data: { type: "bug", title: "Guest report", description: "Must be signed in." },
      })
    ).status(),
    401,
  );
  for (const identifier of ["browser@example.test", "BROWSERHERO"]) {
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.getByLabel("Email or username").fill(identifier);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click();
    await page.locator(".auth-user-menu summary").waitFor();
    await page.locator(".auth-user-menu summary").click();
    await page.getByRole("button", { name: "Sign Out", exact: true }).click();
    await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "Create Account", exact: true }).click();
    await page.getByLabel("Username", { exact: true }).waitFor();
    await page.screenshot({ path: join(tmpdir(), `codex-auth-${width}.png`) });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByLabel("Email or username").fill("BrowserAdmin");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
  await page.locator(".auth-user-menu summary").click();
  await page.getByRole("link", { name: "Admin panel", exact: true }).click();
  await page.getByRole("heading", { name: "Administration", exact: true }).waitFor();
  const userRow = page
    .getByRole("row")
    .filter({ has: page.getByText("browser@example.test", { exact: true }) });
  await userRow.getByRole("button", { name: "Suspend", exact: true }).waitFor();
  const overview = await (await page.request.get(origin + "/api/admin/overview")).json();
  assert.equal(overview.users, 2);
  assert.equal(overview.administrators, 1);
  const detailed = await (await page.request.get(origin + "/api/admin/metrics")).json();
  assert.equal(detailed.accounts.total, 2);
  assert.equal(detailed.accounts.last7, 1);
  assert.equal(detailed.accounts.previous7, 1);
  assert.equal(detailed.accounts.last30, 2);
  assert.equal(detailed.accounts.previous30, 0);
  assert.equal(detailed.daily.length, 30);
  assert.equal(
    detailed.daily.reduce((sum, day) => sum + day.signups, 0),
    2,
  );
  assert.equal(detailed.campaigns.total, 0);
  assert.equal(detailed.bugs.total, 1);
  assert.equal(detailed.features.submitted, 1);
  assert.equal(detailed.posts.total, 0);
  await page.getByRole("heading", { name: "Platform insights" }).waitFor();
  await page.getByLabel("Show", { exact: false }).selectOption("campaigns");
  await page.getByRole("heading", { name: "At a glance", exact: true }).waitFor();
  await page.getByLabel("Compare periods", { exact: false }).selectOption("30");
  const verification = page
    .locator(".admin-chart-card")
    .filter({ has: page.getByRole("heading", { name: "Email verification", exact: true }) });
  const unverified = verification.getByRole("button", { name: /Unverified/ });
  await unverified.click();
  assert.equal(await unverified.getAttribute("aria-pressed"), "true");
  await unverified.click();
  assert.equal(await unverified.getAttribute("aria-pressed"), "false");

  const inbox = page.locator("#admin-feedback");
  await inbox.locator("summary").filter({ hasText: "Browser feedback test" }).waitFor();
  await inbox.locator("summary").click();
  await inbox.getByText("An isolated browser test submission.", { exact: true }).waitFor();
  await inbox.getByRole("button", { name: "Feature requests", exact: true }).click();
  await inbox.locator("summary").filter({ hasText: "Browser feedback test" }).waitFor();
  const feedbackResponse = await page.request.get(origin + "/api/admin/feedback?type=feature");
  assert.equal(feedbackResponse.status(), 200);
  const feedbackData = await feedbackResponse.json();
  assert.equal(feedbackData.total, 1);
  assert.equal(feedbackData.items[0].reporter, "browser@example.test");
  assert.equal("internalNotes" in feedbackData.items[0], false);

  assert.equal(overview.newUsers7Days, 1);
  assert.equal(overview.newUsers30Days, 2);
  assert.equal(overview.campaigns, 0);
  assert.equal(overview.aiMessages, null);
  assert.equal(await page.getByText("Not tracking yet", { exact: true }).isVisible(), true);
  const usersResponse = await page.request.get(origin + "/api/admin/users");
  assert.equal(usersResponse.headers()["cache-control"], "no-store");
  const accountData = await usersResponse.json();
  assert.equal(
    accountData.users.some(
      (user) => Object.hasOwn(user, "password") || Object.hasOwn(user, "token"),
    ),
    false,
  );
  assert.equal((await page.request.get(origin + "/api/admin/users?page=-1")).status(), 400);
  await page.getByLabel("Search accounts").fill("missing-person");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("heading", { name: "No accounts found" }).waitFor();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Account role").selectOption("admin");
  await page.getByText("1 found", { exact: true }).waitFor();
  await page.getByLabel("Account role").selectOption("all");
  await userRow.getByRole("button", { name: "Suspend", exact: true }).click();
  await page.getByLabel("Reason").fill("Browser verification");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Suspend account", exact: true })
    .click();
  await userRow.getByRole("button", { name: "Restore", exact: true }).waitFor();
  await page.getByLabel("Account status").selectOption("suspended");
  await page.getByText("1 found", { exact: true }).waitFor();
  await userRow.getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByRole("button", { name: "Restore access", exact: true }).click();
  await page.getByRole("heading", { name: "No accounts found" }).waitFor();
  await page.getByRole("button", { name: "Reset filters" }).click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await userRow.getByRole("button", { name: "Suspend", exact: true }).waitFor();
    await page.screenshot({ path: join(tmpdir(), `codex-admin-${width}.png`), fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  await page.reload();
  await page.getByRole("heading", { name: "Administration", exact: true }).waitFor();
  await page.locator(".auth-user-menu summary").click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByRole("heading", { name: "Sign in to continue", exact: true }).waitFor();
  assert.equal(await page.getByRole("table").count(), 0);
  console.info(
    "PASS: admin user/guest denial, live counts, private DTOs, search and filters, suspend/restore, deep link reload, logout data clearing, desktop/mobile layouts.",
  );
  assert.deepEqual(errors, []);
  console.info(
    "PASS: real Worker browser signup/validation, modal focus/ESC, session-aware UI, reload persistence, email/username login, logout, desktop/mobile layout.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await proxy?.dispose();
  await rm(directory, { recursive: true, force: true });
}
