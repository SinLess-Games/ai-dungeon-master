/* global document, innerWidth */
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
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
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
  const cookies = await page.context().cookies();
  assert.ok(cookies.some((cookie) => cookie.httpOnly && cookie.name.includes("session_token")));
  await page.locator(".auth-user-menu summary").click();
  assert.equal(await page.locator(".auth-admin-label").count(), 0);
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
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
